# CarbonTrack YOLO AI Service

This service performs YOLO-based garbage and vehicle-smoke detection. Spring Boot still handles users, complaints, database, admin workflow, and Tesseract OCR still handles plate text.

## Model Files

Place trained YOLO `.pt` files here:

```text
ai-service/models/garbage_yolo.pt
ai-service/models/vehicle_smoke_yolo.pt
```

Or set custom paths:

```powershell
$env:GARBAGE_MODEL_PATH="D:\models\garbage_yolo.pt"
$env:VEHICLE_SMOKE_MODEL_PATH="D:\models\vehicle_smoke_yolo.pt"
```

Recommended training classes:

```text
garbage_pile, overflowing_bin, plastic_waste, organic_waste, mixed_waste
vehicle, car, bus, truck, bike, motorcycle, smoke, black_smoke, grey_smoke, white_smoke
```

## Run

```powershell
cd ai-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001
```

Frontend default AI URL:

```env
VITE_AI_API_BASE_URL=http://localhost:8001
```
