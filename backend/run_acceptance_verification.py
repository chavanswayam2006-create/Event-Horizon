"""
Script to execute the 3 Acceptance Test cases against the FastAPI application
and output the exact formatted JSON responses.
"""

import json
from fastapi.testclient import TestClient
from app.main import app, load_star_map

load_star_map()
client = TestClient(app)

cases = [
    {
        "name": "Case 1: Road Potholes",
        "input": "There are large potholes on my street and the road urgently needs repair.",
        "state": "Maharashtra",
        "district": "Pune"
    },
    {
        "name": "Case 2: Broken Traffic Signal",
        "input": "The traffic signal at the main chowk has been broken for two weeks and nobody has fixed it.",
        "state": "Maharashtra",
        "district": "Pune"
    },
    {
        "name": "Case 3: AI Surveillance Camera",
        "input": "I want records about the new AI surveillance camera project in my area.",
        "state": "Maharashtra",
        "district": "Pune"
    }
]

for idx, c in enumerate(cases, 1):
    print(f"============================================================")
    print(f"ACCEPTANCE TEST {idx}: {c['name']}")
    print(f"Input: {c['input']}")
    response = client.post("/api/analyze", json={"text": c["input"], "state": c["state"], "district": c["district"]})
    print(f"Status Code: {response.status_code}")
    print(f"Response JSON:")
    print(json.dumps(response.json(), indent=2))
    print()
