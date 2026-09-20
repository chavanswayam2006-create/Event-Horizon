import urllib.request
import json
import io
from pypdf import PdfWriter

def main():
    print("=== 1. Health Endpoints Verification ===")
    for path in ['/health', '/api/health']:
        try:
            res = urllib.request.urlopen(f'http://127.0.0.1:8000{path}')
            print(f"PASS {path} -> HTTP {res.status}: {res.read().decode().strip()}")
        except Exception as e:
            print(f"FAIL {path} -> {e}")

    print("\n=== 2. Canonical Acceptance Cases Verification ===")
    cases = [
        ("Preset 1 (Potholes road repair)", "There are large potholes on my street and the road urgently needs repair.", "CLEAR"),
        ("Preset 2 (Traffic signal)", "The traffic signal at the main chowk has been broken for two weeks and nobody has fixed it.", "AMBIGUOUS"),
        ("Preset 3 (AI surveillance)", "I want records about the new AI surveillance camera project in my area.", "UNKNOWN")
    ]

    for label, text, expected in cases:
        payload = json.dumps({"text": text, "district": "Pune", "state": "Maharashtra"}).encode('utf-8')
        req = urllib.request.Request(
            'http://127.0.0.1:8000/api/analyze',
            data=payload,
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            status = "PASS" if data['decision'] == expected else "FAIL"
            print(f"[{status}] {label}: Decision={data['decision']} (Expected {expected}), Conf={data['confidence']}, Subject='{data.get('detected_subject')}'")

    print("\n=== 3. Live PDF Extraction Verification ===")
    import httpx
    raw_pdf = b"""%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 55 >> stream
BT /F1 12 Tf 72 712 Td (Road repair RTI draft application) Tj ET
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000350 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
426
%%EOF"""
    res = httpx.post(
        'http://127.0.0.1:8000/api/extract-pdf',
        files={'file': ('road_repair_notice.pdf', raw_pdf, 'application/pdf')}
    )
    if res.status_code == 200:
        d = res.json()
        print(f"[PASS] /api/extract-pdf -> HTTP 200: file='{d['filename']}', pages={d['pages_count']}, extracted='{d['extracted_text']}'")
    else:
        print(f"[FAIL] /api/extract-pdf -> HTTP {res.status_code}: {res.text}")

if __name__ == "__main__":
    main()
