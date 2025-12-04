#!/usr/bin/env python
"""
Finetune a transformer classifier on the combined Reddit dataset with GPU acceleration.

Run `python python/data_pipeline.py` first to produce the dataset, then execute:
`python python/train_gpu_transformer.py --data-path python/data/combined_dataset.parquet`
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Dict, Tuple

# Fix OpenMP duplicate library warning
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

import numpy as np
import pandas as pd
import torch
from datasets import Dataset
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_class_weight
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    DataCollatorWithPadding,
    Trainer,
    TrainingArguments,
)
from torch import nn

# Removed "lonely" due to insufficient data (only 46 samples from failed Pushshift API)
LABEL_ORDER = ["Anxiety", "SuicideWatch", "depression", "mentalhealth", "wellbeing"]
DEFAULT_DATA_PATH = Path("python") / "data" / "combined_dataset.parquet"
DEFAULT_MODEL_DIR = Path("model") / "transformer_bert_base"
DEFAULT_MODEL_NAME = "bert-base-uncased"
RANDOM_STATE = 42


def log(message: str) -> None:
    print(f"[train-gpu] {message}")


def auto_scale_batch_size(model_name: str) -> tuple[int, int, int, int]:
    """Auto-scale batch size based on available GPU VRAM or CPU."""
    if not torch.cuda.is_available():
        log("⚠️ No GPU detected, using conservative CPU settings")
        log("CPU training will be significantly slower than GPU")
        return 2, 4, 8, 128
    
    try:
        total_vram_gb = torch.cuda.get_device_properties(0).total_memory / (1024**3)
        log(f"Detected {total_vram_gb:.1f} GB GPU VRAM")
    except Exception as e:
        log(f"⚠️ Error detecting GPU properties: {e}")
        log("Falling back to CPU settings")
        return 2, 4, 8, 128
    
    # Heuristics based on model size and VRAM
    # Format: (train_batch, eval_batch, grad_accum, max_length)
    if "distilbert" in model_name.lower():
        if total_vram_gb >= 10:  # 10+ GB (like RTX 4070 Ti)
            return 32, 64, 1, 256  # ~9-11 GB usage (optimized)
        elif total_vram_gb >= 8:
            return 16, 32, 2, 256
        elif total_vram_gb >= 6:
            return 8, 16, 2, 256
        else:
            return 4, 8, 4, 128
    elif "bert-base" in model_name.lower():
        if total_vram_gb >= 10:
            return 32, 64, 2, 256
        elif total_vram_gb >= 8:
            return 12, 24, 2, 256
        else:
            return 4, 8, 4, 128
    elif "roberta-large" in model_name.lower() or "bert-large" in model_name.lower():
        if total_vram_gb >= 10:  # RTX 4070 Ti 12GB
            return 8, 16, 2, 256  # ~10-11 GB usage (optimized)
        else:
            return 2, 4, 8, 128
    else:
        # Conservative defaults for unknown models
        if total_vram_gb >= 10:
            return 8, 16, 2, 256
        else:
            return 4, 8, 4, 128


def load_dataframe(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"Dataset not found: {path}")
    if path.suffix.lower() == ".csv":
        return pd.read_csv(path)
    return pd.read_parquet(path)


def cap_per_label(df: pd.DataFrame, max_per_label: int | None) -> pd.DataFrame:
    if not max_per_label:
        return df
    return (
        df.groupby("label", group_keys=False)
        .apply(lambda g: g.sample(min(len(g), max_per_label), random_state=RANDOM_STATE))
        .reset_index(drop=True)
    )


def tokenize_function(tokenizer, max_length: int):
    def wrapper(batch):
        return tokenizer(batch["text"], truncation=True, padding="max_length", max_length=max_length)

    return wrapper


def build_datasets(
    df: pd.DataFrame, test_size: float, max_length: int, tokenizer
) -> Tuple[Dataset, Dataset, Dict[int, str], np.ndarray]:
    label_names = sorted(df["label"].unique().tolist(), key=lambda x: LABEL_ORDER.index(x))
    label2id = {label: idx for idx, label in enumerate(label_names)}
    id2label = {idx: label for label, idx in label2id.items()}

    df = df.assign(label_id=df["label"].map(label2id))
    
    # Compute class weights to handle imbalance
    class_weights = compute_class_weight(
        class_weight='balanced',
        classes=np.unique(df["label_id"]),
        y=df["label_id"]
    )
    log(f"Class weights: {dict(zip([id2label[i] for i in range(len(class_weights))], class_weights))}")
    
    train_df, test_df = train_test_split(
        df[["text", "label_id"]],
        test_size=test_size,
        stratify=df["label_id"],
        random_state=RANDOM_STATE,
    )

    train_dataset = Dataset.from_pandas(train_df.reset_index(drop=True))
    test_dataset = Dataset.from_pandas(test_df.reset_index(drop=True))
    train_dataset = train_dataset.map(tokenize_function(tokenizer, max_length), batched=True)
    test_dataset = test_dataset.map(tokenize_function(tokenizer, max_length), batched=True)
    drop_cols_train = [col for col in ["text", "__index_level_0__"] if col in train_dataset.column_names]
    drop_cols_test = [col for col in ["text", "__index_level_0__"] if col in test_dataset.column_names]
    if drop_cols_train:
        train_dataset = train_dataset.remove_columns(drop_cols_train)
    if drop_cols_test:
        test_dataset = test_dataset.remove_columns(drop_cols_test)
    train_dataset = train_dataset.rename_column("label_id", "labels")
    test_dataset = test_dataset.rename_column("label_id", "labels")

    return train_dataset, test_dataset, id2label, class_weights


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-path", type=Path, default=DEFAULT_DATA_PATH, help="Path to the combined dataset (parquet or csv).")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_MODEL_DIR, help="Directory to store the finetuned model.")
    parser.add_argument("--model-name", type=str, default=DEFAULT_MODEL_NAME, help="Base transformer checkpoint.")
    parser.add_argument("--max-per-label", type=int, default=None, help="Optional max samples per label (after cleaning).")
    parser.add_argument("--test-size", type=float, default=0.2, help="Fraction of data reserved for evaluation.")
    parser.add_argument("--epochs", type=float, default=3.0, help="Number of training epochs.")
    parser.add_argument("--auto-batch", action="store_true", help="Automatically scale batch size based on GPU VRAM.")
    parser.add_argument("--train-batch-size", type=int, default=4, help="Per-device training batch size.")
    parser.add_argument("--eval-batch-size", type=int, default=8, help="Per-device evaluation batch size.")
    parser.add_argument("--grad-accumulation", type=int, default=4, help="Gradient accumulation steps.")
    parser.add_argument("--learning-rate", type=float, default=5e-5, help="Learning rate.")
    parser.add_argument("--max-length", type=int, default=128, help="Maximum token length.")
    parser.add_argument("--resume", action="store_true", help="Resume training from last checkpoint if available.")
    return parser.parse_args()


class WeightedTrainer(Trainer):
    """Custom Trainer that applies class weights to handle imbalanced datasets."""
    
    def __init__(self, *args, class_weights=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.class_weights = None
        if class_weights is not None:
            # Defer weight tensor creation until we know the device
            self._class_weights_array = class_weights
        else:
            self._class_weights_array = None
    
    def compute_loss(self, model, inputs, return_outputs=False, **kwargs):
        labels = inputs.pop("labels")
        outputs = model(**inputs)
        logits = outputs.logits
        
        # Initialize class_weights tensor on first use when device is known
        if self.class_weights is None and self._class_weights_array is not None:
            device = logits.device
            self.class_weights = torch.tensor(self._class_weights_array, dtype=torch.float32).to(device)
        
        if self.class_weights is not None:
            loss_fct = nn.CrossEntropyLoss(weight=self.class_weights)
            loss = loss_fct(logits.view(-1, self.model.config.num_labels), labels.view(-1))
        else:
            loss_fct = nn.CrossEntropyLoss()
            loss = loss_fct(logits.view(-1, self.model.config.num_labels), labels.view(-1))
        
        return (loss, outputs) if return_outputs else loss


def main() -> None:
    args = parse_args()
    
    # Auto-scale batch size by default if not explicitly set
    # Check if user provided batch size manually or should use auto-scaling
    import sys
    manual_batch = any(arg in sys.argv for arg in ['--train-batch-size', '--eval-batch-size'])
    
    if not manual_batch or args.auto_batch:
        train_bs, eval_bs, grad_accum, max_len = auto_scale_batch_size(args.model_name)
        args.train_batch_size = train_bs
        args.eval_batch_size = eval_bs
        args.grad_accumulation = grad_accum
        args.max_length = max_len
        log(f"Auto-scaled settings: train_batch={train_bs}, eval_batch={eval_bs}, grad_accum={grad_accum}, max_length={max_len}")
    else:
        log(f"Using manual settings: train_batch={args.train_batch_size}, eval_batch={args.eval_batch_size}, grad_accum={args.grad_accumulation}, max_length={args.max_length}")
    
    df = load_dataframe(args.data_path)
    df = df[df["label"].isin(LABEL_ORDER)]
    df = cap_per_label(df, args.max_per_label)
    log(f"Dataset rows after filtering: {len(df)}")
    
    # Log class distribution
    label_counts = df["label"].value_counts()
    log(f"Class distribution:\n{label_counts}")
    
    tokenizer = AutoTokenizer.from_pretrained(args.model_name)

    train_dataset, test_dataset, id2label, class_weights = build_datasets(df, args.test_size, args.max_length, tokenizer)
    label2id = {label: idx for idx, label in id2label.items()}

    model = AutoModelForSequenceClassification.from_pretrained(
        args.model_name,
        num_labels=len(id2label),
        id2label=id2label,
        label2id=label2id,
    )

    # Check and configure GPU/CPU
    use_cuda = torch.cuda.is_available()
    
    if use_cuda:
        try:
            device = torch.device("cuda")
            log(f"✓ Using GPU: {torch.cuda.get_device_name(0)}")
            log(f"GPU Memory: {torch.cuda.get_device_properties(0).total_memory / (1024**3):.1f} GB")
            # Move model to GPU explicitly
            model = model.to(device)
        except Exception as e:
            log(f"⚠️ Error initializing GPU: {e}")
            log("Falling back to CPU")
            use_cuda = False
            device = torch.device("cpu")
            model = model.to(device)
    else:
        device = torch.device("cpu")
        log("⚠️ GPU not available; training will run on CPU (much slower)")
        log("To use GPU, install PyTorch with CUDA support: pip install torch --index-url https://download.pytorch.org/whl/cu118")
        model = model.to(device)

    training_args = TrainingArguments(
        output_dir=str(args.output_dir),
        learning_rate=args.learning_rate,
        per_device_train_batch_size=args.train_batch_size,
        per_device_eval_batch_size=args.eval_batch_size,
        num_train_epochs=args.epochs,
        weight_decay=0.01,
        eval_strategy="epoch",
        save_strategy="epoch",
        save_total_limit=3,  # Keep only last 3 checkpoints to save disk space
        logging_strategy="steps",
        logging_steps=100,
        gradient_accumulation_steps=args.grad_accumulation,
        load_best_model_at_end=True,
        metric_for_best_model="accuracy",
        report_to="none",
        fp16=use_cuda,  # Only use fp16 if CUDA is available
        auto_find_batch_size=True,  # Auto-reduce batch size if OOM
        save_safetensors=True,  # Use safetensors format
        no_cuda=not use_cuda,  # Use CPU if CUDA not available
    )

    data_collator = DataCollatorWithPadding(tokenizer=tokenizer)

    def compute_metrics(eval_pred):
        logits, labels = eval_pred
        preds = np.argmax(logits, axis=-1)
        return {
            "accuracy": accuracy_score(labels, preds),
            "macro_f1": f1_score(labels, preds, average="macro"),
        }

    trainer = WeightedTrainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=test_dataset,
        tokenizer=tokenizer,
        data_collator=data_collator,
        compute_metrics=compute_metrics,
        class_weights=class_weights,
    )

    # Check for existing checkpoints to resume from
    resume_from_checkpoint = None
    if args.resume and args.output_dir.exists():
        checkpoints = list(args.output_dir.glob("checkpoint-*"))
        if checkpoints:
            # Sort by modification time and get the latest
            latest_checkpoint = max(checkpoints, key=lambda p: p.stat().st_mtime)
            resume_from_checkpoint = str(latest_checkpoint)
            log(f"Found checkpoint: {latest_checkpoint.name}. Resuming training...")
        else:
            log("No checkpoint found. Starting training from scratch.")
    
    try:
        trainer.train(resume_from_checkpoint=resume_from_checkpoint)
    except Exception as e:
        log(f"Error during training with checkpoint resume: {e}")
        log("Retrying training from scratch...")
        trainer.train()
    metrics = trainer.evaluate()
    log(f"Evaluation metrics: {metrics}")

    predictions = trainer.predict(test_dataset)
    preds = np.argmax(predictions.predictions, axis=-1)
    report = classification_report(
        predictions.label_ids,
        preds,
        target_names=[id2label[i] for i in sorted(id2label.keys())],
        digits=3,
    )
    log("Classification report:\n" + report)

    args.output_dir.mkdir(parents=True, exist_ok=True)
    trainer.save_model(args.output_dir)
    tokenizer.save_pretrained(args.output_dir)
    (args.output_dir / "label_map.json").write_text(json.dumps(id2label, indent=2))
    (args.output_dir / "metrics.json").write_text(json.dumps(metrics, indent=2))
    log(f"Model and tokenizer saved to {args.output_dir}")


if __name__ == "__main__":
    main()
