#!/usr/bin/env python
"""
ดาวน์โหลดและรวมชุดข้อมูล Reddit mental-health ทั้งหมดไว้ในไฟล์เดียว จากนั้นก็ cleaned file.
"""

from __future__ import annotations

import argparse
import json
import re
import string
from pathlib import Path
from typing import Dict, List, Optional

import pandas as pd
import requests

import kagglehub
from datasets import load_dataset

WELLNESS_LABEL = "wellbeing"
LABEL_ORDER = ["Anxiety", "SuicideWatch", "depression", "mentalhealth", WELLNESS_LABEL]
RANDOM_STATE = 42
DEFAULT_OUTPUT = Path("python") / "data" / "combined_dataset.parquet"
DEFAULT_STATS = Path("python") / "data" / "combined_dataset_stats.json"
GOEMOTIONS_POSITIVE = {
    "admiration",
    "amusement",
    "approval",
    "caring",
    "contentment",
    "desire",
    "excitement",
    "gratitude",
    "joy",
    "love",
    "optimism",
    "pride",
    "relief",
    "surprise",
}


def log(message: str) -> None:
    print(f"[data-pipeline] {message}")


def preprocess_text(text: str) -> str:
    text = str(text).lower()
    text = re.sub(r"http\S+", " ", text)
    text = re.sub(f"[{re.escape(string.punctuation)}]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def combine_text_fields(
    df: pd.DataFrame, primary: str = "selftext", secondary: str = "title"
) -> pd.Series:
    primary_series = df[primary].fillna("") if primary in df.columns else pd.Series("", index=df.index)
    secondary_series = df[secondary].fillna("") if secondary in df.columns else pd.Series("", index=df.index)
    return (primary_series.astype(str) + " " + secondary_series.astype(str)).str.strip()


def sample_with_cap(df: pd.DataFrame, label_col: str, cap: Optional[int]) -> pd.DataFrame:
    if cap is None:
        return df
    samples: List[pd.DataFrame] = []
    for _, group in df.groupby(label_col):
        take = min(len(group), cap)
        samples.append(group.sample(take, random_state=RANDOM_STATE))
    return pd.concat(samples, ignore_index=True) if samples else df


def clean_and_dedup(df: pd.DataFrame) -> pd.DataFrame:
    df = df.dropna(subset=["text", "label"])
    df["text"] = df["text"].astype(str)
    df = df[~df["text"].str.strip().eq("")]
    df["text"] = df["text"].replace({"[removed]": "", "[deleted]": ""}, regex=False)
    df["text"] = df["text"].apply(preprocess_text)
    df = df[df["text"].str.len() >= 30]
    df = df.drop_duplicates(subset="text")
    return df


def load_original_labelled() -> pd.DataFrame:
    log("Loading original labelled Kaggle splits…")
    base = Path(kagglehub.dataset_download("entenam/reddit-mental-health-dataset"))
    csv_names = ["LD DA 1.csv", "LD EL1.csv", "LD PF1.csv", "LD TS 1.csv"]
    frames: List[pd.DataFrame] = []
    for name in csv_names:
        csv_path = base / "Original Reddit Data" / "Labelled Data" / name
        df = pd.read_csv(csv_path, usecols=["selftext", "title", "subreddit"])
        df["text"] = combine_text_fields(df)
        frames.append(df[["text", "subreddit"]].rename(columns={"subreddit": "label"}))
    return pd.concat(frames, ignore_index=True)


def load_kamaruladha(max_per_label: int) -> pd.DataFrame:
    log("Loading kamaruladha mental disorder dataset…")
    dataset_path = Path(kagglehub.dataset_download("kamaruladha/mental-disorders-identification-reddit-nlp"))
    csv_path = dataset_path / "mental_disorders_reddit.csv"
    label_map = {
        "Anxiety": "Anxiety",
        "depression": "depression",
        "mentalillness": "mentalhealth",
        "BPD": "mentalhealth",
        "bipolar": "mentalhealth",
        "schizophrenia": "mentalhealth",
    }
    df = pd.read_csv(csv_path, usecols=["title", "selftext", "subreddit"])
    df = df[df["subreddit"].isin(label_map)]
    df["label"] = df["subreddit"].map(label_map)
    df["text"] = combine_text_fields(df)
    df = df[["text", "label"]]
    return sample_with_cap(df, "label", max_per_label)


def load_solomonk(max_rows_per_file: int) -> pd.DataFrame:
    log("Loading solomonk mental-health subreddit samples from HuggingFace…")
    base_url = "https://huggingface.co/datasets/solomonk/reddit_mental_health_posts/resolve/main/{}"
    file_configs = {
        "depression.csv": ("depression", max_rows_per_file),
        "adhd.csv": ("mentalhealth", max_rows_per_file // 2),
        "aspergers.csv": ("mentalhealth", max_rows_per_file // 2),
        "ocd.csv": ("mentalhealth", max_rows_per_file // 2),
        "ptsd.csv": ("mentalhealth", max_rows_per_file // 2),
    }
    frames: List[pd.DataFrame] = []
    for filename, (label, limit) in file_configs.items():
        if limit <= 0:
            continue
        url = base_url.format(filename)
        log(f"  → Fetching {filename} (limit {limit})")
        chunk = pd.read_csv(url, usecols=["body", "title"], nrows=limit * 2 or None)
        chunk["text"] = combine_text_fields(chunk, primary="body", secondary="title")
        chunk["label"] = label
        chunk = chunk[["text", "label"]]
        if len(chunk) > limit:
            chunk = chunk.sample(limit, random_state=RANDOM_STATE)
        frames.append(chunk)
    return pd.concat(frames, ignore_index=True) if frames else pd.DataFrame(columns=["text", "label"])


def load_goemotions(max_rows: int) -> pd.DataFrame:
    log("Loading GoEmotions positive samples…")
    dataset = load_dataset("go_emotions")
    label_names = dataset["train"].features["labels"].feature.names
    splits = [dataset["train"], dataset["validation"], dataset["test"]]
    df = pd.concat((split.to_pandas()[["text", "labels"]] for split in splits), ignore_index=True)

    def has_positive(label_ids: List[int]) -> bool:
        return any(label_names[idx] in GOEMOTIONS_POSITIVE for idx in label_ids)

    df = df[df["labels"].apply(has_positive)].copy()
    df["label"] = WELLNESS_LABEL
    df = df[["text", "label"]]
    if max_rows and len(df) > max_rows:
        df = df.sample(max_rows, random_state=RANDOM_STATE)
    log(f"  → GoEmotions positive samples: {len(df)}")
    return df


def load_twitter_positive(max_rows: int) -> pd.DataFrame:
    """Load positive sentiment from tweet_eval sentiment dataset"""
    log("Loading Twitter positive sentiment samples…")
    try:
        dataset = load_dataset("tweet_eval", "sentiment")
        # Combine all splits
        frames = []
        for split_name in ["train", "validation", "test"]:
            if split_name in dataset:
                split_df = dataset[split_name].to_pandas()
                # sentiment: 0=negative, 1=neutral, 2=positive
                split_df = split_df[split_df["label"] == 2].copy()
                frames.append(split_df)
        
        if not frames:
            log("  → No positive tweets found")
            return pd.DataFrame(columns=["text", "label"])
            
        df = pd.concat(frames, ignore_index=True)
        df["label"] = WELLNESS_LABEL
        df = df[["text", "label"]]
        
        if max_rows and len(df) > max_rows:
            df = df.sample(max_rows, random_state=RANDOM_STATE)
        log(f"  → Twitter positive samples: {len(df)}")
        return df
    except Exception as e:
        log(f"  → Twitter dataset failed: {e}, skipping")
        return pd.DataFrame(columns=["text", "label"])


def load_positive_reddit(max_rows: int) -> pd.DataFrame:
    """Load positive samples from emotion dataset"""
    log("Loading positive emotion samples (joy, love)…")
    try:
        dataset = load_dataset("emotion")
        # Combine all splits
        frames = []
        for split_name in ["train", "validation", "test"]:
            if split_name in dataset:
                split_df = dataset[split_name].to_pandas()
                # emotion labels: sadness(0), joy(1), love(2), anger(3), fear(4), surprise(5)
                # Filter for joy(1) and love(2)
                split_df = split_df[split_df["label"].isin([1, 2])].copy()
                frames.append(split_df)
        
        if not frames:
            log("  → No positive emotions found")
            return pd.DataFrame(columns=["text", "label"])
            
        df = pd.concat(frames, ignore_index=True)
        df["label"] = WELLNESS_LABEL
        df = df[["text", "label"]]
        
        if max_rows and len(df) > max_rows:
            df = df.sample(max_rows, random_state=RANDOM_STATE)
        log(f"  → Positive emotion samples (joy/love): {len(df)}")
        return df
    except Exception as e:
        log(f"  → Emotion dataset failed: {e}, skipping")
        return pd.DataFrame(columns=["text", "label"])


def load_suicide_watch(max_rows: int) -> pd.DataFrame:
    log("Loading SuicideWatch positives…")
    dataset_path = Path(kagglehub.dataset_download("nikhileswarkomati/suicide-watch"))
    csv_path = dataset_path / "Suicide_Detection.csv"
    df = pd.read_csv(csv_path, usecols=["text", "class"])
    df = df[df["class"] == "suicide"]
    if max_rows and len(df) > max_rows:
        df = df.sample(max_rows, random_state=RANDOM_STATE)
    df["label"] = "SuicideWatch"
    return df[["text", "label"]]


def fetch_lonely_from_pushshift(max_posts: int, batch_size: int, enabled: bool) -> pd.DataFrame:
    if not enabled:
        log("Skipping Pushshift lonely data fetch (disabled).")
        return pd.DataFrame(columns=["text", "label"])

    log("Fetching r/lonely posts from Pushshift…")
    url = "https://api.pushshift.io/reddit/search/submission/"
    headers = {"User-Agent": "reddit-mood-scan/1.0 data-ingestion"}
    posts: List[Dict[str, str]] = []
    before: Optional[int] = None
    session = requests.Session()
    while len(posts) < max_posts:
        params = {
            "subreddit": "lonely",
            "size": batch_size,
            "fields": "selftext,title,created_utc",
        }
        if before is not None:
            params["before"] = before
        try:
            resp = session.get(url, params=params, headers=headers, timeout=30)
            resp.raise_for_status()
        except requests.RequestException as exc:
            log(f"  → request failed ({exc}); stopping fetch.")
            break
        data = resp.json().get("data", [])
        if not data:
            break
        posts.extend(data)
        before = data[-1]["created_utc"]
        log(f"  → collected {len(posts)} posts")
    log(f"Collected {len(posts)} lonely posts total.")
    if not posts:
        return pd.DataFrame(columns=["text", "label"])
    df = pd.DataFrame(posts)
    if "selftext" not in df:
        df["selftext"] = ""
    if "title" not in df:
        df["title"] = ""
    df["text"] = combine_text_fields(df)
    # Map lonely to depression since loneliness is often associated with depressive symptoms
    df["label"] = "depression"
    return df[["text", "label"]]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="Path to save the cleaned dataset (parquet or csv).")
    parser.add_argument("--stats-output", type=Path, default=DEFAULT_STATS, help="Optional JSON file with label counts/statistics.")
    parser.add_argument("--max-kamaruladha", type=int, default=40000, help="Maximum samples per label to take from kamaruladha dataset.")
    parser.add_argument("--max-solomonk", type=int, default=20000, help="Maximum rows to take per HuggingFace file.")
    parser.add_argument("--max-suicidewatch", type=int, default=60000, help="Maximum SuicideWatch positive rows.")
    parser.add_argument("--max-goemotions", type=int, default=120000, help="Maximum GoEmotions positive rows to include.")
    parser.add_argument("--max-twitter-positive", type=int, default=40000, help="Maximum Twitter positive sentiment rows.")
    parser.add_argument("--max-reddit-positive", type=int, default=30000, help="Maximum positive Reddit samples from happy/motivational subreddits.")
    parser.add_argument("--lonely-max-posts", type=int, default=12000, help="Maximum posts to fetch from Pushshift r/lonely.")
    parser.add_argument("--lonely-batch-size", type=int, default=250, help="Pushshift batch size.")
    parser.add_argument("--skip-pushshift", action="store_true", help="Skip Pushshift lonely collection.")
    parser.add_argument("--sample-per-label", type=int, default=None, help="Optional cap for the final combined dataset per label.")
    return parser.parse_args()


def save_dataset(df: pd.DataFrame, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.suffix.lower() == ".csv":
        df.to_csv(path, index=False)
    else:
        df.to_parquet(path, index=False)
    log(f"Saved dataset with {len(df)} rows to {path}")


def save_stats(df: pd.DataFrame, path: Path) -> None:
    if not path:
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    stats = {
        "total_rows": int(len(df)),
        "label_counts": df["label"].value_counts().to_dict(),
    }
    path.write_text(json.dumps(stats, indent=2))
    log(f"Saved dataset stats to {path}")


def main() -> None:
    args = parse_args()
    frames = [
        load_original_labelled(),
        load_kamaruladha(args.max_kamaruladha),
        load_solomonk(args.max_solomonk),
        load_goemotions(args.max_goemotions),
        load_twitter_positive(args.max_twitter_positive),
        load_positive_reddit(args.max_reddit_positive),
        load_suicide_watch(args.max_suicidewatch),
        fetch_lonely_from_pushshift(args.lonely_max_posts, args.lonely_batch_size, not args.skip_pushshift),
    ]
    raw_dataset = pd.concat(frames, ignore_index=True)
    raw_dataset = raw_dataset[raw_dataset["label"].isin(LABEL_ORDER)]
    dataset = clean_and_dedup(raw_dataset)
    if args.sample_per_label:
        dataset = sample_with_cap(dataset, "label", args.sample_per_label)
    dataset = dataset.sample(frac=1, random_state=RANDOM_STATE).reset_index(drop=True)
    log("Final label distribution:")
    log(dataset["label"].value_counts().to_string())
    save_dataset(dataset, args.output)
    if args.stats_output:
        save_stats(dataset, args.stats_output)


if __name__ == "__main__":
    main()
