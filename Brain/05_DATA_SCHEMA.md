# 05 - Data Schema Specification

## 1. Star Map Rule Schema (`data/star_map.json`)
```json
{
  "id": "EH-001",
  "state": "Maharashtra",
  "district": "Pune",
  "subject": "road repair",
  "departments": ["Municipal Engineering Department"],
  "jurisdiction": "single",
  "note": "Local road maintenance, pothole filling, asphalt resurfacing, and street repair within Pune Municipal Corporation limits",
  "source": "MVP / Demonstration Jurisdiction Dataset"
}
```
### Allowed Values
- `jurisdiction`: `"single"` | `"shared"` | `"unknown"`
- `source`: Must be `"MVP / Demonstration Jurisdiction Dataset"` for Day 1.

## 2. API Analysis Request (`POST /api/analyze`)
```json
{
  "text": "There are large potholes on my street and the road urgently needs repair.",
  "state": "Maharashtra",
  "district": "Pune"
}
```

## 3. API Analysis Response (`POST /api/analyze`)
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
      "keyword_overlap": 0.6000,
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
