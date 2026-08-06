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
    try:
        reader = PdfReader(str(path))
        if not reader.pages:
            return ""
        pages = []
        for page in reader.pages:
            try:
                text = page.extract_text() or ""
                # Remove null bytes
                text = text.replace('\x00', '')
                if text.strip():
                    pages.append(text)
            except Exception as e:
                print(f"Warning: Failed to extract from PDF page: {e}", file=sys.stderr)
                continue
        return "\n".join(pages).strip()
    except Exception as e:
        print(f"Error reading PDF: {e}", file=sys.stderr)
        return ""


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
