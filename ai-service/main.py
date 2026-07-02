import base64
import os
from functools import lru_cache
from typing import Any

import cv2
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from ultralytics import YOLO


MODEL_LABELS = {
    "VEHICLE_EMISSION": "YOLO vehicle smoke detector",
    "GARBAGE": "YOLO garbage detector",
}

GARBAGE_CLASSES = {
    "garbage_pile",
    "overflowing_bin",
    "plastic_waste",
    "organic_waste",
    "mixed_waste",
    "garbage",
    "waste",
    "trash",
}

VEHICLE_CLASSES = {"vehicle", "car", "bus", "truck", "bike", "motorcycle", "auto"}
SMOKE_CLASSES = {"smoke", "black_smoke", "grey_smoke", "gray_smoke", "white_smoke"}


class DetectionRequest(BaseModel):
    imageDataUrl: str = Field(..., min_length=20)
    mode: str = Field(..., pattern="^(VEHICLE_EMISSION|GARBAGE)$")
    durationSeconds: float = 0


class Detection(BaseModel):
    className: str
    confidence: float
    box: list[float]


class DetectionResponse(BaseModel):
    mode: str
    aiScore: float
    aiConfidenceScore: float
    rollingAverageScore: float
    aiSeverityLabel: str
    severityLabel: str
    aiPriority: str
    smokeColor: str | None = None
    wasteType: str | None = None
    vehicleCount: int = 0
    frameSampleCount: int = 1
    detectionModel: str
    onDeviceInference: bool = False
    estimatedCarbonGrams: float = 0
    carbonEstimateLabel: str = "Not applicable"
    carbonEstimateMethod: str = "Carbon estimate is only shown for vehicle smoke analysis."
    title: str
    summary: str
    detections: list[Detection]


app = FastAPI(title="CarbonTrack YOLO AI Service", version="1.0.0")

allowed_origins = [
    origin.strip()
    for origin in os.getenv("AI_SERVICE_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def clamp(value: float, minimum: float = 0, maximum: float = 100) -> float:
    return min(maximum, max(minimum, value))


def round_metric(value: float) -> float:
    return round(float(value or 0), 1)


def resolve_priority(score: float) -> str:
    if score >= 80:
        return "CRITICAL"
    if score >= 60:
        return "HIGH"
    if score >= 35:
        return "MEDIUM"
    return "LOW"


def decode_data_url(data_url: str) -> np.ndarray:
    if "," not in data_url:
        raise HTTPException(status_code=400, detail="Image must be a base64 data URL")

    header, encoded = data_url.split(",", 1)
    if not header.lower().startswith(("data:image/jpeg;base64", "data:image/jpg;base64", "data:image/png;base64", "data:image/webp;base64")):
        raise HTTPException(status_code=400, detail="Image must be JPEG, PNG, or WebP")

    try:
        image_bytes = base64.b64decode(encoded)
        image_array = np.frombuffer(image_bytes, dtype=np.uint8)
        image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Image could not be decoded") from exc

    if image is None:
        raise HTTPException(status_code=400, detail="Image could not be decoded")
    return image


def model_path_for_mode(mode: str) -> str:
    env_name = "GARBAGE_MODEL_PATH" if mode == "GARBAGE" else "VEHICLE_SMOKE_MODEL_PATH"
    default_name = "garbage_yolo.pt" if mode == "GARBAGE" else "vehicle_smoke_yolo.pt"
    return os.getenv(env_name, os.path.join(os.path.dirname(__file__), "models", default_name))


@lru_cache(maxsize=2)
def load_model(mode: str) -> YOLO:
    path = model_path_for_mode(mode)
    if not os.path.exists(path):
        raise HTTPException(
            status_code=503,
            detail=f"{mode} YOLO model not found at {path}. Train/export a YOLO .pt model and set the model path env var.",
        )
    return YOLO(path)


def parse_detections(result: Any) -> list[dict[str, Any]]:
    names = result.names or {}
    detections = []
    for box in result.boxes:
        class_id = int(box.cls[0])
        class_name = str(names.get(class_id, class_id)).lower().replace(" ", "_").replace("-", "_")
        confidence = float(box.conf[0])
        xyxy = [round_metric(value) for value in box.xyxy[0].tolist()]
        detections.append({
            "className": class_name,
            "confidence": round_metric(confidence * 100),
            "box": xyxy,
        })
    return detections


def dominant_detection(detections: list[dict[str, Any]], allowed: set[str] | None = None) -> dict[str, Any] | None:
    filtered = [item for item in detections if allowed is None or item["className"] in allowed]
    if not filtered:
        return None
    return max(filtered, key=lambda item: item["confidence"])


def estimate_visual_carbon(ai_score: float, duration_seconds: float, smoke_color: str | None, vehicle_count: int) -> dict[str, Any]:
    safe_duration = max(0, float(duration_seconds or 0))
    if safe_duration == 0:
        return {
            "estimatedCarbonGrams": 0,
            "carbonEstimateLabel": "Awaiting duration",
            "carbonEstimateMethod": "Visual carbon approximation needs a video duration to estimate total release.",
        }

    multiplier = {
        "BLACK": 1.45,
        "GREY": 1.2,
        "GRAY": 1.2,
        "WHITE": 0.95,
    }.get(str(smoke_color or "GREY").upper(), 1)
    grams_per_minute = (110 + (ai_score * 5.2)) * multiplier * max(1, vehicle_count)
    estimated = round_metric(grams_per_minute * (safe_duration / 60))

    if estimated >= 450:
        label = "Very High Visual Carbon Estimate"
    elif estimated >= 250:
        label = "High Visual Carbon Estimate"
    elif estimated >= 120:
        label = "Moderate Visual Carbon Estimate"
    else:
        label = "Low Visual Carbon Estimate"

    return {
        "estimatedCarbonGrams": estimated,
        "carbonEstimateLabel": label,
        "carbonEstimateMethod": "YOLO visual approximation from smoke detection, duration, and vehicle count. Not a sensor-grade carbon measurement.",
    }


def vehicle_response(detections: list[dict[str, Any]], duration_seconds: float) -> DetectionResponse:
    smoke = dominant_detection(detections, SMOKE_CLASSES)
    vehicles = [item for item in detections if item["className"] in VEHICLE_CLASSES]
    vehicle_count = len(vehicles)

    smoke_score = smoke["confidence"] if smoke else 0
    vehicle_bonus = min(12, vehicle_count * 4)
    ai_score = round_metric(clamp(smoke_score + vehicle_bonus))
    smoke_class = smoke["className"] if smoke else ""
    smoke_color = None
    if "black" in smoke_class:
        smoke_color = "BLACK"
    elif "white" in smoke_class:
        smoke_color = "WHITE"
    elif smoke:
        smoke_color = "GREY"

    severity = "High Pollution" if ai_score >= 70 else "Medium Pollution" if ai_score >= 40 else "Low Pollution"
    ai_severity = "HIGH" if ai_score >= 70 else "MEDIUM" if ai_score >= 40 else "LOW"
    carbon = estimate_visual_carbon(ai_score, duration_seconds, smoke_color, vehicle_count)
    summary = (
        f"{severity} detected from YOLO smoke evidence."
        if smoke
        else "No strong smoke emission detected by YOLO in this frame."
    )

    return DetectionResponse(
        mode="VEHICLE_EMISSION",
        aiScore=ai_score,
        aiConfidenceScore=round_metric(clamp((smoke_score * 0.75) + min(20, len(detections) * 4))),
        rollingAverageScore=ai_score,
        aiSeverityLabel=ai_severity,
        severityLabel=severity,
        aiPriority=resolve_priority(ai_score),
        smokeColor=smoke_color,
        vehicleCount=vehicle_count,
        detectionModel=MODEL_LABELS["VEHICLE_EMISSION"],
        estimatedCarbonGrams=carbon["estimatedCarbonGrams"],
        carbonEstimateLabel=carbon["carbonEstimateLabel"],
        carbonEstimateMethod=carbon["carbonEstimateMethod"],
        title="YOLO vehicle emission detected",
        summary=summary,
        detections=detections,
    )


def garbage_response(detections: list[dict[str, Any]]) -> DetectionResponse:
    garbage_detections = [item for item in detections if item["className"] in GARBAGE_CLASSES]
    strongest = dominant_detection(garbage_detections)
    ai_score = round_metric(clamp((strongest["confidence"] if strongest else 0) + min(15, len(garbage_detections) * 3)))
    severity = "Severe / Overflowing" if ai_score >= 70 else "Moderate Waste" if ai_score >= 35 else "Clean"
    ai_severity = "HIGH" if ai_score >= 70 else "MEDIUM" if ai_score >= 35 else "LOW"

    class_name = strongest["className"] if strongest else ""
    if "plastic" in class_name:
        waste_type = "PLASTIC"
    elif "organic" in class_name:
        waste_type = "ORGANIC"
    elif strongest:
        waste_type = "MIXED"
    else:
        waste_type = None

    summary = (
        f"{severity} detected by YOLO with likely {waste_type.lower()} waste profile."
        if strongest and waste_type
        else "No strong garbage signal detected by YOLO in this image."
    )

    return DetectionResponse(
        mode="GARBAGE",
        aiScore=ai_score,
        aiConfidenceScore=round_metric(clamp((ai_score * 0.82) + min(18, len(garbage_detections) * 3))),
        rollingAverageScore=ai_score,
        aiSeverityLabel=ai_severity,
        severityLabel=severity,
        aiPriority=resolve_priority(ai_score),
        wasteType=waste_type,
        detectionModel=MODEL_LABELS["GARBAGE"],
        title="YOLO garbage hotspot detected",
        summary=summary,
        detections=detections,
    )


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "garbageModelPath": model_path_for_mode("GARBAGE"),
        "vehicleSmokeModelPath": model_path_for_mode("VEHICLE_EMISSION"),
    }


@app.post("/detect/image", response_model=DetectionResponse)
def detect_image(request: DetectionRequest) -> DetectionResponse:
    image = decode_data_url(request.imageDataUrl)
    model = load_model(request.mode)
    result = model.predict(image, conf=float(os.getenv("YOLO_CONFIDENCE", "0.25")), verbose=False)[0]
    detections = parse_detections(result)

    if request.mode == "GARBAGE":
        return garbage_response(detections)
    return vehicle_response(detections, request.durationSeconds)
