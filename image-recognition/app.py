import os
import tempfile
import time
from flask import Flask, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from typing import List, Literal, Optional
import cv2
import json
from math import ceil
from pydantic import BaseModel, Field, field_validator
from enum import Enum
from agno.agent import Agent
from agno.media import Image
from agno.models.google import Gemini

app = Flask(__name__)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Set Google Gemini API key (should be in environment variables in production)
os.environ["GOOGLE_API_KEY"] = "AIzaSyAMaCTCpemNwOLu2nfUp9NQKiScTb0oVpw"

class CrowdLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"

class CrowdAssessment(BaseModel):
    # Core assessments
    crowd_level: Literal["low", "medium", "high", "very_high"] = Field(
        ..., description="Qualitative crowd density level."
    )
    estimated_people: int = Field(
        ...,
        description="Estimated number of people in the crowd. This is a rough estimate based on visible individuals.",
        ge=0,
    )
    police_required: bool = Field(
        ...,
        description="Whether police presence is recommended based on crowd size and behavior.",
    )
    police_count: int = Field(
        ...,
        description="Recommended number of police personnel. Should be 0 if police_required is false.",
        ge=0,
    )
    medical_required: bool = Field(
        ...,
        description="Whether medical assistance is recommended based on crowd conditions.",
    )
    medical_staff_count: int = Field(
        ...,
        description="Recommended number of medical staff. Should be 0 if medical_required is false.",
        ge=0,
    )
    activities: List[str] = Field(
        ...,
        description="List of observed activities in the crowd (e.g., 'walking', 'bathing', 'pushing').",
    )
    chokepoints_detected: bool = Field(
        ...,
        description="Whether any chokepoints or bottlenecks are visible in the crowd.",
    )
    emergency_access_clear: bool = Field(
        ...,
        description="Whether emergency access routes appear to be clear and unobstructed.",
    )
    harm_likelihood: Literal["low", "medium", "high"] = Field(
        ...,
        description="Assessed likelihood of harm or incident based on visible conditions.",
    )
    notes: str = Field(
        default="",
        description="Additional observations or recommendations not covered by other fields.",
    )

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def bump_crowd_level(level: CrowdLevel) -> CrowdLevel:
    """Adjust crowd level based on Mahakumbh context (more conservative)."""
    levels = list(CrowdLevel)
    try:
        index = levels.index(level)
        return levels[min(index + 1, len(levels) - 1)]
    except ValueError:
        return level

def load_video_frames(video_path: str, min_seconds: int = 5, max_frames: int = 12) -> List[bytes]:
    """Load frames from video file."""
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise FileNotFoundError(f"Cannot open video: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 0.0
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    if fps <= 0 or frame_count <= 0:
        cap.release()
        raise ValueError("Invalid video metadata (fps/frame_count)")

    duration_sec = frame_count / fps
    span_frames = int(min_seconds * fps)
    span_frames = min(span_frames, frame_count)
    if span_frames <= 0:
        span_frames = frame_count

    step = max(1, span_frames // max_frames)
    indices = list(range(0, span_frames, step))[:max_frames]

    frames_bytes = []
    for idx in indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ret, frame = cap.read()
        if not ret:
            continue
        _, buffer = cv2.imencode('.jpg', frame)
        frames_bytes.append(buffer.tobytes())

    cap.release()
    if not frames_bytes:
        raise ValueError("Failed to extract frames from video")
    return frames_bytes

def analyze_video(video_path: str, location: str = "Mahakumbh, Prayagraj", context: str = "") -> dict:
    """Analyze video and return crowd assessment."""
    agent = Agent(
        model=Gemini(id="gemini-2.0-flash-exp"),
        description=(
            "You are a Mahakumbh crowd safety assessor. You analyze images to estimate crowd density, "
            "identify activities, detect chokepoints, and recommend police/medical staffing. "
            "Be conservative and safety-first. Base answers only on the visible image; if uncertain, say so."
        ),
        response_model=CrowdAssessment,
        markdown=False,
    )

    prompt = (
        "Analyze this video for Mahakumbh crowd safety (Indian spiritual gathering with surge risk):\n"
        f"- Location: {location}\n"
        f"- Context: {context}\n\n"
        "Instructions (STRICT):\n"
        "1) Estimate crowd density and visible headcount (approximate is OK; state uncertainty).\n"
        "2) Police deployment rule: If estimated visible people <= 100, set police_required = false and police_count = 0.\n"
        "   If > 100, set police_required = true and recommend police_count at approximately 20% of estimated_people.\n"
        "3) Medical: recommend only if scene indicates risk (e.g., pushing, heat, elderly, chokepoints, water proximity); justify briefly.\n"
        "4) List observed activities (e.g., queuing, pushing, bathing, ritual, walking, security check).\n"
        "5) Flag chokepoints/bottlenecks and whether emergency access seems clear.\n"
        "6) Assess harm likelihood from visual cues only (no assumptions beyond the image).\n"
        "7) Ground all outputs strictly on the visible image; keep it concise."
    )

    # Load and process video frames
    frames = load_video_frames(video_path)
    images = [Image(content=frame) for frame in frames]

    # Run analysis
    run = agent.run(prompt, images=images, stream=False)
    result: CrowdAssessment = run.content  # type: ignore

    # Apply Mahakumbh-specific rules
    result.crowd_level = bump_crowd_level(result.crowd_level)

    # Staffing policy: police only if > 100 people; then ensure >= 20%
    try:
        people = max(0, int(result.estimated_people))
    except Exception:
        people = 0
    
    if people <= 100:
        result.police_required = False
        result.police_count = 0
    else:
        min_police = ceil(0.20 * people)
        if result.police_count < min_police:
            result.police_required = True
            result.police_count = min_police

    return result.model_dump()

@app.route('/', methods=['GET'])
def index():
    return """
    <!doctype html>
    <html>
    <head>
        <title>Mahakumbh Crowd Analysis</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .upload-form { border: 2px dashed #ccc; padding: 20px; text-align: center; margin: 20px 0; }
            .result { margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 5px; }
            pre { white-space: pre-wrap; word-wrap: break-word; }
        </style>
    </head>
    <body>
        <h1>Mahakumbh Crowd Safety Analysis</h1>
        <p>Upload a video for crowd analysis:</p>
        
        <form class="upload-form" action="/analyze" method="post" enctype="multipart/form-data">
            <input type="file" name="file" accept="video/*" required>
            <br><br>
            <label for="location">Location (optional):</label>
            <input type="text" name="location" value="Mahakumbh, Prayagraj">
            <br><br>
            <label for="context">Additional Context (optional):</label>
            <input type="text" name="context" placeholder="E.g., Morning rush hour">
            <br><br>
            <button type="submit">Analyze Video</button>
        </form>
        
        <div id="result" class="result" style="display: none;">
            <h3>Analysis Result:</h3>
            <pre id="result-json"></pre>
        </div>
        
        <script>
            document.querySelector('form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                
                try {
                    const response = await fetch('/analyze', {
                        method: 'POST',
                        body: formData
                    });
                    
                    if (!response.ok) {
                        throw new Error('Analysis failed');
                    }
                    
                    const result = await response.json();
                    document.getElementById('result-json').textContent = JSON.stringify(result, null, 2);
                    document.getElementById('result').style.display = 'block';
                } catch (error) {
                    alert('Error: ' + error.message);
                }
            });
        </script>
    </body>
    </html>
    """

@app.route('/analyze', methods=['POST'])
def analyze():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    if file and (file.filename.lower().endswith('.mp4') or file.filename.lower().endswith('.mov')):
        try:
            # Create a temporary file with a proper extension
            temp_dir = tempfile.mkdtemp()
            filename = secure_filename(f"analysis_{int(time.time())}.mp4")
            video_path = os.path.join(temp_dir, filename)
            
            # Save the file
            file.save(video_path)
            
            # Check if file was saved and has content
            if not os.path.exists(video_path) or os.path.getsize(video_path) == 0:
                return jsonify({"error": "Failed to save video file"}), 500
                
            print(f"[DEBUG] Saved video to {video_path} (size: {os.path.getsize(video_path)} bytes)")
            
            # Get optional parameters
            location = request.form.get('location', 'Mahakumbh, Prayagraj')
            context = request.form.get('context', '')
            
            # Analyze the video
            print("[DEBUG] Starting video analysis...")
            result = analyze_video(video_path, location, context)
            print("[DEBUG] Analysis complete")
            
            return jsonify(result)
            
        except Exception as e:
            import traceback
            error_msg = f"Error processing video: {str(e)}\n{traceback.format_exc()}"
            print(f"[ERROR] {error_msg}")
            return jsonify({
                "error": "Failed to process video",
                "details": str(e)
            }), 500
            
        finally:
            # Clean up temporary files
            try:
                if os.path.exists(video_path):
                    os.remove(video_path)
                if os.path.exists(temp_dir):
                    os.rmdir(temp_dir)
            except Exception as e:
                print(f"[WARNING] Failed to clean up temp files: {e}")
    
    return jsonify({"error": "Invalid file type. Please upload an MP4 or MOV video file."}), 400

if __name__ == '__main__':
    # For development
    app.run(debug=True, host='0.0.0.0', port=5000)
else:
    # For production with gunicorn
    application = app
