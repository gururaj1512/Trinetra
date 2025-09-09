import os
import cv2
import tempfile
import base64
import numpy as np
from flask import Flask, request, jsonify
import google.generativeai as genai
import json
import re
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# 🔹 Get Gemini API Key from environment variables
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is required")

genai.configure(api_key=GEMINI_API_KEY)

app = Flask(__name__)

# Configuration
UPLOAD_FOLDER = 'uploads'
MAX_CONTENT_LENGTH = 100 * 1024 * 1024  # 100MB max file size
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv', 'webm', 'jpg', 'jpeg', 'png'}

app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Custom JSON encoder to handle numpy types
class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        return super(NumpyEncoder, self).default(obj)

# 🔹 Helper function to encode image to base64
def encode_image_to_base64(image_array):
    try:
        _, buffer = cv2.imencode('.jpg', image_array)
        image_base64 = base64.b64encode(buffer).decode('utf-8')
        return f"data:image/jpeg;base64,{image_base64}"
    except Exception as e:
        print(f"Error encoding image: {e}")
        return None

# 🔹 Helper function to extract person images from frame
def extract_person_images(frame, analysis_result):
    person_images = []
    try:
        # This is a simplified person detection - in production, use YOLO or similar
        # For now, we'll create a mock person detection based on analysis
        if analysis_result.get("status") in ["danger", "critical"] and analysis_result.get("weapons"):
            # Create a cropped region as mock person detection
            height, width = frame.shape[:2]
            # Create multiple person regions (mock detection)
            for i in range(min(2, len(analysis_result.get("weapons", [])))):
                x1 = int(width * 0.1 + i * width * 0.4)
                y1 = int(height * 0.2)
                x2 = int(x1 + width * 0.3)
                y2 = int(y1 + height * 0.6)
                
                person_crop = frame[y1:y2, x1:x2]
                if person_crop.size > 0:
                    person_base64 = encode_image_to_base64(person_crop)
                    if person_base64:
                        person_images.append({
                            "image": person_base64,
                            "confidence": 0.85 + (i * 0.1),  # Mock confidence
                            "bbox": [x1, y1, x2, y2]
                        })
    except Exception as e:
        print(f"Error extracting person images: {e}")
    
    return person_images

# 🔹 Enhanced analysis function for comprehensive threat detection
def analyze_video_for_threats(video_path, frame_interval_sec=5):
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise Exception("Could not open video file")
    
    frame_count = 0
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0:
        fps = 30  # Default fallback
    
    results = []
    model = genai.GenerativeModel("gemini-1.5-flash")

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            frame_count += 1
            if frame_count % int(fps * frame_interval_sec) == 0:
                # Save frame to temp file
                with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as temp_file:
                    cv2.imwrite(temp_file.name, frame)
                    temp_file_path = temp_file.name

                # Read bytes and close before sending to API
                with open(temp_file_path, "rb") as img:
                    image_bytes = img.read()

                os.unlink(temp_file_path)  # Safe deletion

                # Enhanced prompt for comprehensive threat detection
                prompt = """
                You are an AI security monitoring system analyzing CCTV footage in spiritual places.
                Carefully examine this frame and detect:
                1. Weapons or harmful objects (guns, knives, explosives, sticks, stones, etc.)
                2. People fighting or in physical altercations
                3. Fire, smoke, or fire-related incidents
                4. Any suspicious or dangerous behavior

                Respond ONLY in this JSON structure:
                {
                  "status": "safe" | "anomaly" | "danger" | "critical",
                  "summary": "Brief description of what was detected",
                  "weapons": ["gun", "knife"] or [],
                  "fighting_detected": true/false,
                  "fire_detected": true/false,
                  "suspicious_activity": true/false
                }

                Status Rules:
                - "critical": Fire, explosives, or life-threatening weapons detected
                - "danger": Weapons, fighting, or serious threats detected
                - "anomaly": Suspicious activity or minor threats detected
                - "safe": No threats detected

                Be thorough but accurate in your analysis.
                """

                # Call Gemini model
                try:
                    response = model.generate_content([
                        prompt,
                        {"mime_type": "image/jpeg", "data": image_bytes}
                    ])

                    # Robust JSON extraction
                    try:
                        match = re.search(r'{.*}', response.text.strip(), re.DOTALL)
                        if match:
                            frame_analysis = json.loads(match.group())
                        else:
                            frame_analysis = {
                                "status": "error",
                                "summary": "Failed to parse analysis",
                                "weapons": [],
                                "fighting_detected": False,
                                "fire_detected": False,
                                "suspicious_activity": False
                            }
                    except json.JSONDecodeError as e:
                        print(f"JSON decode error: {e}")
                        frame_analysis = {
                            "status": "error",
                            "summary": "Analysis parsing error",
                            "weapons": [],
                            "fighting_detected": False,
                            "fire_detected": False,
                            "suspicious_activity": False
                        }

                except Exception as e:
                    print(f"Gemini API error: {e}")
                    frame_analysis = {
                        "status": "error",
                        "summary": "API call failed",
                        "weapons": [],
                        "fighting_detected": False,
                        "fire_detected": False,
                        "suspicious_activity": False
                    }

                timestamp = round(frame_count / fps, 2)
                
                # Determine if we need to capture screenshot and person images
                should_capture = (
                    frame_analysis.get("status") in ["danger", "critical", "anomaly"] or
                    frame_analysis.get("weapons") or
                    frame_analysis.get("fighting_detected") or
                    frame_analysis.get("fire_detected") or
                    frame_analysis.get("suspicious_activity")
                )

                result = {
                    "frame": frame_count,
                    "timestamp_sec": timestamp,
                    "analysis": frame_analysis
                }

                # Capture screenshot if threat detected
                if should_capture:
                    try:
                        frame_screenshot = encode_image_to_base64(frame)
                        if frame_screenshot:
                            result["frame_screenshot"] = frame_screenshot
                        
                        # Extract person images if fighting or weapons detected
                        if (frame_analysis.get("fighting_detected") or 
                            frame_analysis.get("weapons") or 
                            frame_analysis.get("status") in ["danger", "critical"]):
                            person_images = extract_person_images(frame, frame_analysis)
                            if person_images:
                                result["person_images"] = person_images
                    except Exception as e:
                        print(f"Error capturing screenshots: {e}")

                results.append(result)

                # Print frame result for console debugging
                print(f"Frame {frame_count} | Time {timestamp}s | Status: {frame_analysis.get('status')} | Summary: {frame_analysis.get('summary', 'N/A')}")

    except Exception as e:
        print(f"Error during video analysis: {e}")
        raise e
    finally:
        cap.release()

    print(f"Analysis complete. Processed {len(results)} frames.")
    return results

# 🔹 Flask endpoint with enhanced error handling
@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400

        # Validate file type
        if not allowed_file(file.filename):
            return jsonify({"error": f"Unsupported file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"}), 400

        # Generate unique filename to avoid conflicts
        import uuid
        unique_filename = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        file.save(file_path)

        # Validate file exists and is readable
        if not os.path.exists(file_path):
            return jsonify({"error": "File upload failed"}), 500

        # Perform analysis
        try:
            analysis = analyze_video_for_threats(file_path, frame_interval_sec=5)
            
            # Clean up uploaded file
            try:
                os.remove(file_path)
            except Exception as e:
                print(f"Warning: Could not delete uploaded file: {e}")

            return jsonify({
                "success": True,
                "results": analysis,
                "total_frames": len(analysis),
                "threats_detected": len([r for r in analysis if r.get("analysis", {}).get("status") in ["danger", "critical", "anomaly"]])
            })

        except Exception as analysis_error:
            # Clean up uploaded file on analysis error
            try:
                os.remove(file_path)
            except Exception as e:
                print(f"Warning: Could not delete uploaded file after error: {e}")
            
            print(f"Analysis error: {analysis_error}")
            return jsonify({
                "error": f"Analysis failed: {str(analysis_error)}",
                "success": False
            }), 500

    except Exception as e:
        print(f"Endpoint error: {e}")
        return jsonify({
            "error": f"Server error: {str(e)}",
            "success": False
        }), 500

# 🔹 Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "Threat Detection API",
        "version": "2.0"
    })

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5002))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(host="0.0.0.0", port=port, debug=debug)