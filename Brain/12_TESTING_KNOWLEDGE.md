# 12 - Testing Knowledge & Test Execution

## Automated Test Suites

### Acceptance Tests
Located in `backend/tests/test_acceptance.py`.
Runs automated verification against the 3 required hackathon scenarios:
1. `test_acceptance_case_1_potholes_road_repair`
2. `test_acceptance_case_2_traffic_signal_ambiguous`
3. `test_acceptance_case_3_ai_surveillance_unknown`

### Command to Execute
```powershell
backend\venv\Scripts\python -m pytest backend/tests/test_acceptance.py -v
```

## Manual Verification via cURL
### Scenario 1 (CLEAR)
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/analyze" -Method Post -ContentType "application/json" -Body '{"text":"There are large potholes on my street and the road urgently needs repair.","state":"Maharashtra","district":"Pune"}' | ConvertTo-Json -Depth 5
```

### Scenario 2 (AMBIGUOUS)
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/analyze" -Method Post -ContentType "application/json" -Body '{"text":"The traffic signal at the main chowk has been broken for two weeks and nobody has fixed it.","state":"Maharashtra","district":"Pune"}' | ConvertTo-Json -Depth 5
```

### Scenario 3 (UNKNOWN)
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/analyze" -Method Post -ContentType "application/json" -Body '{"text":"I want records about the new AI surveillance camera project in my area.","state":"Maharashtra","district":"Pune"}' | ConvertTo-Json -Depth 5
```
