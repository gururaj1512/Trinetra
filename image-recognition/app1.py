import os
import cv2
import tempfile
import asyncio
from datetime import datetime
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from typing import List, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field
from agno.agent import Agent
from agno.media import Image
from agno.models.google import Gemini

# --- CONFIGURE GOOGLE GEMINI API KEY ---
os.environ["GOOGLE_API_KEY"] = "AIzaSyAMaCTCpemNwOLu2nfUp9NQKiScTb0oVpw"  # Replace with your key

# --- FLASK CONFIGURATION ---
app = Flask(__name__)
UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"mp4", "avi", "mov"}
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# --- ENUMS ---
class ThreatLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class SecurityAssessment(BaseModel):
    threat_level: ThreatLevel = Field(..., description="Threat level: LOW, MEDIUM, HIGH")
    suspicious_activities: List[str] = Field(default_factory=list)
    number_of_people: int = Field(..., description="Approximate number of people")
    weapons_detected: bool = Field(default=False)
    recommended_force: str = Field(default="None", description="Recommended security response")


# --- GEMINI AGENT ---
agent = Agent(
    model=Gemini(id="gemini-1.5-flash"),
    description="Analyze video frames for potential threats and security risks.",
    instructions=[
        "Look for weapons, fights, unusual movement, or suspicious behavior.",
        "Classify threat level as LOW, MEDIUM, or HIGH.",
        "Estimate the number of people in the frame.",
        "Identify weapons and recommend force if needed."
    ]
)


# --- HELPERS ---
def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def save_temp_frame(frame) -> str:
    """Save OpenCV frame as JPEG and return file path."""
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
    success = cv2.imwrite(temp_file.name, frame)
    if not success:
        raise ValueError("Failed to save frame")
    return temp_file.name


async def analyze_frame(frame_path: str) -> SecurityAssessment:
    """Analyze a single video frame."""
    try:
        print(f"Analyzing frame: {frame_path}")
        with open(frame_path, "rb") as f:
            image = Image.from_file(f)

        response = await agent.run(inputs={"image": image})

        if not isinstance(response.output, dict):
            print(f"Unexpected output: {response.output}")
            return SecurityAssessment(
                threat_level=ThreatLevel.LOW,
                suspicious_activities=["Uncertain analysis"],
                number_of_people=0
            )

        data = response.output
        return SecurityAssessment(
            threat_level=ThreatLevel(data.get("threat_level", "LOW")),
            suspicious_activities=data.get("suspicious_activities", []),
            number_of_people=data.get("number_of_people", 0),
            weapons_detected=data.get("weapons_detected", False),
            recommended_force=data.get("recommended_force", "None")
        )

    except Exception as e:
        print(f"Error analyzing frame: {e}")
        return SecurityAssessment(
            threat_level=ThreatLevel.LOW,
            suspicious_activities=["Error analyzing frame"],
            number_of_people=0
        )


async def analyze_video(video_path: str, frame_interval: int = 30) -> List[SecurityAssessment]:
    """Extract frames and analyze them."""
    assessments = []
    cap = cv2.VideoCapture(video_path)
    frame_count = 0

    if not cap.isOpened():
        print("Error: Could not open video.")
        return assessments

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_count % frame_interval == 0:
            try:
                frame_path = save_temp_frame(frame)
                assessment = await analyze_frame(frame_path)
                assessments.append(assessment)
                os.remove(frame_path)
            except Exception as e:
                print(f"Frame processing error: {e}")

        frame_count += 1

    cap.release()
    return assessments


def summarize_assessments(assessments: List[SecurityAssessment]) -> Dict[str, Any]:
    """Summarize multiple assessments into a single report."""
    if not assessments:
        return {"summary": "No frames analyzed."}

    total_people = sum(a.number_of_people for a in assessments)
    weapons = any(a.weapons_detected for a in assessments)
    threat_levels = [a.threat_level for a in assessments]

    highest_threat = ThreatLevel.LOW
    if ThreatLevel.HIGH in threat_levels:
        highest_threat = ThreatLevel.HIGH
    elif ThreatLevel.MEDIUM in threat_levels:
        highest_threat = ThreatLevel.MEDIUM

    activities = set()
    for a in assessments:
        activities.update(a.suspicious_activities)

    return {
        "overall_threat_level": highest_threat,
        "total_people_detected": total_people,
        "weapons_detected": weapons,
        "suspicious_activities": list(activities),
        "recommended_action": "Call law enforcement" if highest_threat == ThreatLevel.HIGH else "Monitor situation"
    }


# --- ROUTES ---
@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Security Threat Detection API", "timestamp": datetime.utcnow().isoformat()})


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy", "timestamp": datetime.utcnow().isoformat()})


@app.route("/analyze", methods=["POST"])
def analyze():
    if "video" not in request.files:
        return jsonify({"error": "No video file provided"}), 400

    file = request.files["video"]
    if file.filename == "" or not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type"}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(filepath)

    try:
        assessments = asyncio.run(analyze_video(filepath))
        summary = summarize_assessments(assessments)
    finally:
        os.remove(filepath)

    return jsonify({"summary": summary})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5002, debug=True)
