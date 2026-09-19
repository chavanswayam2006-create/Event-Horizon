# 09 - API Contracts

## 1. POST `/api/analyze`
Submits raw text of an RTI application and retrieves routing assessment.

### Request Body
```json
{
  "text": "There are large potholes on my street and the road urgently needs repair.",
  "state": "Maharashtra",
  "district": "Pune"
}
```

### Response (200 OK)
```json
{
  "detected_subject": "road repair",
  "keywords": ["large", "potholes", "street", "road", "repair"],
  "candidates": [
    {
      "star_map_rule_id": "EH-001",
      "subject": "road repair",
      "state": "Maharashtra",
      "district": "Pune",
      "departments": ["Municipal Engineering Department"],
      "jurisdiction": "single",
      "similarity": 0.7431,
      "keyword_overlap": 0.6,
      "combined_score": 0.7502,
      "note": "Local road maintenance, pothole filling...",
      "source": "MVP / Demonstration Jurisdiction Dataset"
    }
  ],
  "decision": "CLEAR",
  "confidence": 0.75,
  "reason": "confident single department match"
}
```

## 2. GET `/api/starmap`
Returns full array of Star Map rules currently loaded in memory.

## 3. GET `/api/health`
Returns service status and active rules count.
