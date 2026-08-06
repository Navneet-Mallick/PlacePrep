"""
Extract plain text from PDF or DOCX resume files.

Usage:
    python ml/scripts/extract_text.py path/to/resume.pdf
"""

import sys
from pathlib import Path

from docx import Document
from PyPDF2 import PdfReader


def extract_from_pdf(path: Path) -> str:
    reader = PdfReader(str(path))
    pages = [page.extract_text() or "" for page in reader.pages]
    return "\n".join(pages).strip()


def extract_from_docx(path: Path) -> str:
    document = Document(str(path))
    paragraphs = [para.text for para in document.paragraphs if para.text.strip()]
    return "\n".join(paragraphs).strip()


def extract_text(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        return extract_from_pdf(path)
    if suffix == ".docx":
        return extract_from_docx(path)
    raise ValueError(f"Unsupported file type: {suffix}. Use PDF or DOCX.")


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python ml/scripts/extract_text.py path/to/resume.pdf")
        sys.exit(1)

    path = Path(sys.argv[1])
    if not path.exists():
        print(f"File not found: {path}")
        sys.exit(1)

    print(extract_text(path))


if __name__ == "__main__":
    main()
