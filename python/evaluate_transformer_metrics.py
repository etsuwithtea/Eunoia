#!/usr/bin/env python
"""
Interactive evaluation script for the finetuned transformer classifier.

- Lets you pick a test set size from a simple menu.
- Generates text metrics (classification report, accuracy, macro F1, macro ROC-AUC).
- Saves helpful plots (confusion matrix, per-class bars, ROC curves).

Example:
  python python/evaluate_transformer_metrics.py \\
    --data-path python/data/combined_dataset.parquet \\
    --model-dir model/transformer_bert_base
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Dict, List, Tuple

# Avoid OpenMP duplicate runtime error (commonly on Windows/anaconda)
import os

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

import matplotlib

matplotlib.use("Agg")  # headless plot rendering
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402
import torch  # noqa: E402
from sklearn.metrics import (  # noqa: E402
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    roc_auc_score,
    roc_curve,
)
from sklearn.model_selection import train_test_split  # noqa: E402
from sklearn.preprocessing import label_binarize  # noqa: E402
from torch.utils.data import DataLoader, Dataset  # noqa: E402
from transformers import (  # noqa: E402
    AutoModelForSequenceClassification,
    AutoTokenizer,
    DataCollatorWithPadding,
)

# Keep label order consistent with training
LABEL_ORDER = ["Anxiety", "SuicideWatch", "depression", "mentalhealth", "wellbeing"]
DEFAULT_DATA_PATH = Path("python") / "data" / "combined_dataset.parquet"
DEFAULT_MODEL_DIR = Path("model") / "transformer_bert_base"


def log(message: str) -> None:
    print(f"[eval] {message}")


class TextDataset(Dataset):
    def __init__(self, texts: List[str], labels: List[int], tokenizer, max_length: int):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_length = max_length

    def __len__(self) -> int:
        return len(self.texts)

    def __getitem__(self, idx: int) -> Dict[str, torch.Tensor]:
        text = self.texts[idx]
        label = self.labels[idx]
        encoded = self.tokenizer(
            text,
            truncation=True,
            padding="max_length",
            max_length=self.max_length,
            return_tensors="pt",
        )
        item = {k: v.squeeze(0) for k, v in encoded.items()}
        item["labels"] = torch.tensor(label, dtype=torch.long)
        return item


def prompt_test_size(default: float = 0.2) -> float:
    options = [0.1, 0.15, 0.2, 0.25, 0.3]
    print("\nเลือก test size (สัดส่วนข้อมูลสำหรับประเมิน):")
    for idx, val in enumerate(options, start=1):
        print(f"  {idx}) {val:.2f}")
    print("  c) พิมพ์ตัวเลขเอง (เช่น 0.18)")
    choice = input(f"เลือกเลข [ค่าเริ่มต้น {default:.2f}]: ").strip().lower()
    if not choice:
        return default
    if choice.isdigit():
        idx = int(choice) - 1
        if 0 <= idx < len(options):
            return options[idx]
    try:
        value = float(choice)
        if 0.05 <= value <= 0.5:
            return value
    except ValueError:
        pass
    log("อินพุตไม่ถูกต้อง ใช้ค่าเริ่มต้นแทน")
    return default


def load_dataframe(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"Dataset not found: {path}")
    if path.suffix.lower() == ".csv":
        return pd.read_csv(path)
    return pd.read_parquet(path)


def prepare_data(df: pd.DataFrame, test_size: float) -> Tuple[List[str], List[int], List[str]]:
    df = df[df["label"].isin(LABEL_ORDER)].copy()
    label2id = {label: idx for idx, label in enumerate(LABEL_ORDER)}
    df["label_id"] = df["label"].map(label2id)
    _, test_df = train_test_split(
        df,
        test_size=test_size,
        stratify=df["label_id"],
        random_state=42,
    )
    texts = test_df["text"].astype(str).tolist()
    labels = test_df["label_id"].tolist()
    return texts, labels, LABEL_ORDER


def run_inference(
    texts: List[str],
    labels: List[int],
    tokenizer,
    model,
    device: torch.device,
    max_length: int,
    batch_size: int,
) -> Tuple[np.ndarray, np.ndarray]:
    dataset = TextDataset(texts, labels, tokenizer, max_length)
    collator = DataCollatorWithPadding(tokenizer=tokenizer)
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=False, collate_fn=collator)

    all_logits: List[np.ndarray] = []
    all_labels: List[int] = []

    model.eval()
    for batch in dataloader:
        batch = {k: v.to(device) for k, v in batch.items()}
        with torch.no_grad():
            outputs = model(**batch)
            logits = outputs.logits.detach().cpu().numpy()
        all_logits.append(logits)
        all_labels.extend(batch["labels"].cpu().numpy())

    logits_arr = np.concatenate(all_logits, axis=0)
    labels_arr = np.array(all_labels)
    return logits_arr, labels_arr


def plot_confusion(cm: np.ndarray, labels: List[str], path: Path) -> None:
    fig, ax = plt.subplots(figsize=(6, 5))
    im = ax.imshow(cm, interpolation="nearest", cmap=plt.cm.Blues)
    ax.figure.colorbar(im, ax=ax)
    ax.set(
        xticks=np.arange(cm.shape[1]),
        yticks=np.arange(cm.shape[0]),
        xticklabels=labels,
        yticklabels=labels,
        ylabel="True label",
        xlabel="Predicted label",
        title="Confusion Matrix",
    )
    plt.setp(ax.get_xticklabels(), rotation=45, ha="right", rotation_mode="anchor")
    thresh = cm.max() / 2.0
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            ax.text(
                j,
                i,
                format(cm[i, j], "d"),
                ha="center",
                va="center",
                color="white" if cm[i, j] > thresh else "black",
            )
    fig.tight_layout()
    path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(path, dpi=200)
    plt.close(fig)


def plot_per_class_bars(report: Dict[str, Dict[str, float]], labels: List[str], path: Path) -> None:
    precisions = [report[label]["precision"] for label in labels]
    recalls = [report[label]["recall"] for label in labels]
    f1s = [report[label]["f1-score"] for label in labels]

    x = np.arange(len(labels))
    width = 0.25

    fig, ax = plt.subplots(figsize=(8, 5))
    ax.bar(x - width, precisions, width, label="Precision")
    ax.bar(x, recalls, width, label="Recall")
    ax.bar(x + width, f1s, width, label="F1")
    ax.set_ylabel("Score")
    ax.set_ylim(0, 1.05)
    ax.set_title("Per-class Metrics")
    ax.set_xticks(x)
    ax.set_xticklabels(labels, rotation=20, ha="right")
    ax.legend()
    fig.tight_layout()
    path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(path, dpi=200)
    plt.close(fig)


def plot_roc_curves(probs: np.ndarray, labels: np.ndarray, label_names: List[str], path: Path) -> None:
    y_true_bin = label_binarize(labels, classes=list(range(len(label_names))))
    fig, ax = plt.subplots(figsize=(7, 5))
    for idx, name in enumerate(label_names):
        fpr, tpr, _ = roc_curve(y_true_bin[:, idx], probs[:, idx])
        ax.plot(fpr, tpr, label=name)
    ax.plot([0, 1], [0, 1], "k--", label="Chance")
    ax.set_xlabel("False Positive Rate")
    ax.set_ylabel("True Positive Rate")
    ax.set_title("ROC Curves (One-vs-Rest)")
    ax.legend()
    ax.grid(True, alpha=0.3)
    fig.tight_layout()
    path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(path, dpi=200)
    plt.close(fig)


def save_text_report(report_text: str, metrics: Dict[str, float], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    summary = {
        "macro_f1": metrics["macro_f1"],
        "macro_roc_auc": metrics["macro_roc_auc"],
        "accuracy": metrics["accuracy"],
    }
    payload = {
        "summary": summary,
        "classification_report": report_text,
    }
    path.write_text(json.dumps(payload, indent=2))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-path", type=Path, default=DEFAULT_DATA_PATH, help="Path to the cleaned dataset (parquet or csv).")
    parser.add_argument("--model-dir", type=Path, default=DEFAULT_MODEL_DIR, help="Directory containing the finetuned model.")
    parser.add_argument("--test-size", type=float, default=None, help="Holdout fraction for evaluation. If omitted, a menu will appear.")
    parser.add_argument("--max-length", type=int, default=128, help="Tokenizer max length (should match training).")
    parser.add_argument("--batch-size", type=int, default=32, help="Evaluation batch size.")
    parser.add_argument("--skip-plots", action="store_true", help="Only print metrics; do not save plots.")
    args = parser.parse_args()

    test_size = args.test_size if args.test_size else prompt_test_size()
    log(f"ใช้ test_size={test_size:.2f}")

    df = load_dataframe(args.data_path)
    texts, labels, label_names = prepare_data(df, test_size)
    log(f"ตัวอย่างสำหรับทดสอบ: {len(texts)}")

    tokenizer = AutoTokenizer.from_pretrained(args.model_dir)
    model = AutoModelForSequenceClassification.from_pretrained(args.model_dir)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    log(f"ใช้ device: {device}")

    logits, y_true = run_inference(
        texts=texts,
        labels=labels,
        tokenizer=tokenizer,
        model=model,
        device=device,
        max_length=args.max_length,
        batch_size=args.batch_size,
    )
    probs = torch.softmax(torch.tensor(logits), dim=1).numpy()
    y_pred = probs.argmax(axis=1)

    report_dict = classification_report(
        y_true,
        y_pred,
        target_names=label_names,
        digits=3,
        output_dict=True,
    )
    report_text = classification_report(
        y_true,
        y_pred,
        target_names=label_names,
        digits=3,
    )

    macro_f1 = f1_score(y_true, y_pred, average="macro")
    accuracy = accuracy_score(y_true, y_pred)
    y_true_bin = label_binarize(y_true, classes=list(range(len(label_names))))
    macro_roc_auc = roc_auc_score(y_true_bin, probs, average="macro", multi_class="ovr")

    log("=== Classification Report ===")
    print(report_text)
    log(f"Macro F1: {macro_f1:.3f}")
    log(f"Macro ROC-AUC: {macro_roc_auc:.3f}")
    log(f"Accuracy: {accuracy:.3f}")

    output_dir = args.model_dir / "eval_outputs"
    output_dir.mkdir(parents=True, exist_ok=True)
    save_text_report(
        report_text=report_text,
        metrics={"macro_f1": macro_f1, "macro_roc_auc": macro_roc_auc, "accuracy": accuracy},
        path=output_dir / "metrics.json",
    )

    if not args.skip_plots:
        cm = confusion_matrix(y_true, y_pred, labels=list(range(len(label_names))))
        plot_confusion(cm, label_names, output_dir / "confusion_matrix.png")
        plot_per_class_bars(report_dict, label_names, output_dir / "per_class_metrics.png")
        plot_roc_curves(probs, y_true, label_names, output_dir / "roc_curves.png")
        log(f"บันทึกกราฟที่ {output_dir}")
    else:
        log("ข้ามการสร้างกราฟ (--skip-plots เปิดไว้)")

    log(f"รายงานถูกบันทึกที่ {output_dir / 'metrics.json'}")


if __name__ == "__main__":
    main()
