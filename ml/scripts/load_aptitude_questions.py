"""
Merge aptitude CSV datasets into a single JSON question bank.

Usage:
    python ml/scripts/load_aptitude_questions.py
"""

import json
from pathlib import Path

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parents[2]
APTITUDE_DIR = PROJECT_ROOT / "Datasets" / "Aptitude"
OUTPUT_PATH = PROJECT_ROOT / "ml" / "data" / "aptitude_questions.json"

DATASETS = [
    ("quantitative", APTITUDE_DIR / "clean_general_aptitude_dataset (1).csv"),
    ("logical", APTITUDE_DIR / "logical_reasoning_questions.csv"),
    ("technical", APTITUDE_DIR / "cse_dataset.csv"),
]


def load_questions(section: str, path: Path) -> list[dict]:
    df = pd.read_csv(path, sep=";")
    questions = []

    for index, row in df.iterrows():
        options = [
            str(row["Option A"]).strip(),
            str(row["Option B"]).strip(),
            str(row["Option C"]).strip(),
            str(row["Option D"]).strip(),
        ]
        questions.append(
            {
                "id": f"{section}-{index + 1}",
                "section": section,
                "question": str(row["Question"]).strip(),
                "options": options,
                "answer": str(row["Answer"]).strip().upper(),
            }
        )

    return questions


def main() -> None:
    all_questions: list[dict] = []
    summary: dict[str, int] = {}

    for section, path in DATASETS:
        section_questions = load_questions(section, path)
        all_questions.extend(section_questions)
        summary[section] = len(section_questions)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = {"summary": summary, "total": len(all_questions), "questions": all_questions}
    OUTPUT_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    print(f"Saved {len(all_questions)} questions to {OUTPUT_PATH}")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
