"""PDF -> DOCX using pdf2docx. Usage: pdf_to_docx.py in.pdf out.docx
Exit codes: 0 ok, 3 no selectable text (scanned PDF), 4 password protected, 1 other failure."""
import sys
import warnings

warnings.filterwarnings("ignore")
import fitz  # PyMuPDF
from pdf2docx import Converter

src, dst = sys.argv[1], sys.argv[2]
doc = fitz.open(src)
if doc.needs_pass:
    sys.exit(4)
if sum(len(p.get_text().strip()) for p in doc) < 10:
    sys.exit(3)
doc.close()
cv = Converter(src)
try:
    cv.convert(dst)
finally:
    cv.close()
