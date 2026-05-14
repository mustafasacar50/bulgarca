import PyPDF2
import sys
import os

pdf_path = sys.argv[1]
out_path = sys.argv[2]

try:
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = ""
        for i, page in enumerate(reader.pages):
            text += f"--- PAGE {i+1} ---\n"
            text += page.extract_text() + "\n\n"
            
    with open(out_path, 'w', encoding='utf-8') as out_file:
        out_file.write(text)
    print(f"Successfully extracted text to {out_path}")
except Exception as e:
    print(f"Error: {e}")
