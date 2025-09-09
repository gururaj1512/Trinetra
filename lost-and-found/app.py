from flask import Flask, request, jsonify, send_file, render_template
from werkzeug.utils import secure_filename
import os
import cv2
import face_recognition
import numpy as np
from PIL import Image
import tempfile
import uuid
import logging
from datetime import datetime
import json

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['OUTPUT_FOLDER'] = 'outputs'

# Ensure directories exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['OUTPUT_FOLDER'], exist_ok=True)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Allowed file extensions
ALLOWED_EXTENSIONS_IMAGE = {'png', 'jpg', 'jpeg', 'gif', 'bmp'}
ALLOWED_EXTENSIONS_VIDEO = {'mp4', 'avi', 'mov', 'mkv', 'wmv'}

def allowed_file(filename, allowed_extensions):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

class PersonDetector:
    def __init__(self, person_image_path, video_path):
        """
        Initialize the person detector with the lost person's image and crowd video.
        
        Args:
            person_image_path (str): Path to the lost person's image
            video_path (str): Path to the crowd video
        """
        self.person_image_path = person_image_path
        self.video_path = video_path
        self.person_encoding = None
        
    def load_person_encoding(self):
        """Load and encode the lost person's face."""
        try:
            # Load the person's image
            person_image = face_recognition.load_image_file(self.person_image_path)
            
            # Find face encodings in the person's image
            face_encodings = face_recognition.face_encodings(person_image)
            
            if len(face_encodings) == 0:
                return False, "No face found in the person's image. Please use an image with a clear face."
            
            # Use the first face encoding found
            self.person_encoding = face_encodings[0]
            return True, "Successfully loaded person's face encoding."
            
        except Exception as e:
            return False, f"Error loading person's image: {str(e)}"
    
    def detect_person_in_video(self, output_video_path, tolerance=0.6, frame_skip=5):
        """
        Detect the lost person in the crowd video and create output video.
        
        Args:
            output_video_path (str): Path to save the output video
            tolerance (float): Face recognition tolerance (lower = more strict)
            frame_skip (int): Process every nth frame to speed up detection
        """
        if self.person_encoding is None:
            return False, "Person encoding not loaded."
        
        # Open the video file
        video = cv2.VideoCapture(self.video_path)
        
        if not video.isOpened():
            return False, "Could not open video file."
        
        # Get video properties
        fps = int(video.get(cv2.CAP_PROP_FPS))
        width = int(video.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(video.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(video.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Initialize video writer with better codec compatibility
        try:
            fourcc = cv2.VideoWriter_fourcc(*'avc1')  # Try H.264 codec first
            out = cv2.VideoWriter(output_video_path, fourcc, fps, (width, height))
            if not out.isOpened():
                # Fallback to MP4V if H.264 fails
                fourcc = cv2.VideoWriter_fourcc(*'mp4v')
                out = cv2.VideoWriter(output_video_path, fourcc, fps, (width, height))
        except Exception as e:
            logger.warning(f"Codec initialization failed: {e}, using MP4V fallback")
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(output_video_path, fourcc, fps, (width, height))
        
        frame_count = 0
        detected_frames = 0
        detection_timestamps = []
        detection_frame_path = None
        
        logger.info("Starting person detection in video...")
        logger.info(f"Processing every {frame_skip}th frame for efficiency.")
        
        while True:
            ret, frame = video.read()
            
            if not ret:
                break
            
            # Process every nth frame to speed up detection
            if frame_count % frame_skip == 0:
                # Convert BGR to RGB (face_recognition uses RGB)
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                
                # Find faces in the current frame
                face_locations = face_recognition.face_locations(rgb_frame)
                face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)
                
                # Check if any face matches the person we're looking for
                person_found_in_frame = False
                for i, face_encoding in enumerate(face_encodings):
                    # Compare faces
                    matches = face_recognition.compare_faces([self.person_encoding], face_encoding, tolerance=tolerance)
                    
                    if matches[0]:
                        # Person found! Draw rectangle and add timestamp
                        top, right, bottom, left = face_locations[i]
                        cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)
                        cv2.putText(frame, "PERSON FOUND!", (left, top - 10), 
                                  cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
                        
                        # Add timestamp
                        timestamp = frame_count / fps
                        cv2.putText(frame, f"Time: {timestamp:.2f}s", (left, bottom + 25), 
                                  cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                        
                        person_found_in_frame = True
                        detected_frames += 1
                        detection_timestamps.append(timestamp)
                        
                        # Save the first detection frame as a separate image
                        if detection_frame_path is None:
                            detection_frame_path = output_video_path.replace('.mp4', '_detection_frame.jpg')
                            cv2.imwrite(detection_frame_path, frame)
                            logger.info(f"Saved detection frame: {detection_frame_path}")
                        
                        logger.info(f"Person detected in frame {frame_count} at {timestamp:.2f}s")
                
                # Write frame to output video (with or without detection)
                out.write(frame)
                
                # Show progress
                if frame_count % 100 == 0:
                    progress = (frame_count / total_frames) * 100
                    logger.info(f"Progress: {progress:.1f}% ({frame_count}/{total_frames} frames)")
            
            frame_count += 1
        
        video.release()
        out.release()
        
        logger.info(f"Detection complete! Total frames processed: {frame_count}")
        logger.info(f"Frames with person detected: {detected_frames}")
        
        return True, {
            "total_frames": frame_count,
            "detected_frames": detected_frames,
            "detection_timestamps": detection_timestamps,
            "output_video_path": output_video_path,
            "detection_frame_path": detection_frame_path
        }

@app.route('/')
def index():
    """Home page with upload form."""
    return render_template('index.html')

@app.route('/api/detect', methods=['POST'])
def detect_person():
    """
    API endpoint to detect a person in a video.
    
    Expected form data:
    - person_image: Image file of the person to find
    - crowd_video: Video file of the crowd
    - tolerance: Face recognition tolerance (optional, default 0.6)
    - frame_skip: Frame processing rate (optional, default 5)
    """
    try:
        # Check if files are present
        if 'person_image' not in request.files or 'crowd_video' not in request.files:
            return jsonify({'error': 'Both person_image and crowd_video files are required'}), 400
        
        person_file = request.files['person_image']
        video_file = request.files['crowd_video']
        
        # Check file extensions
        if not allowed_file(person_file.filename, ALLOWED_EXTENSIONS_IMAGE):
            return jsonify({'error': 'Invalid person image format. Allowed: png, jpg, jpeg, gif, bmp'}), 400
        
        if not allowed_file(video_file.filename, ALLOWED_EXTENSIONS_VIDEO):
            return jsonify({'error': 'Invalid video format. Allowed: mp4, avi, mov, mkv, wmv'}), 400
        
        # Get optional parameters
        tolerance = float(request.form.get('tolerance', 0.6))
        frame_skip = int(request.form.get('frame_skip', 5))
        
        # Validate parameters
        if not 0.0 <= tolerance <= 1.0:
            return jsonify({'error': 'Tolerance must be between 0.0 and 1.0'}), 400
        
        if frame_skip < 1:
            return jsonify({'error': 'Frame skip must be at least 1'}), 400
        
        # Generate unique filenames
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        
        person_filename = f"person_{timestamp}_{unique_id}.{person_file.filename.rsplit('.', 1)[1].lower()}"
        video_filename = f"crowd_{timestamp}_{unique_id}.{video_file.filename.rsplit('.', 1)[1].lower()}"
        output_filename = f"output_{timestamp}_{unique_id}.mp4"
        
        # Save uploaded files
        person_path = os.path.join(app.config['UPLOAD_FOLDER'], person_filename)
        video_path = os.path.join(app.config['UPLOAD_FOLDER'], video_filename)
        output_path = os.path.join(app.config['OUTPUT_FOLDER'], output_filename)
        
        person_file.save(person_path)
        video_file.save(video_path)
        
        logger.info(f"Files uploaded: {person_filename}, {video_filename}")
        
        # Initialize detector
        detector = PersonDetector(person_path, video_path)
        
        # Load person encoding
        success, message = detector.load_person_encoding()
        if not success:
            # Clean up uploaded files
            os.remove(person_path)
            os.remove(video_path)
            return jsonify({'error': message}), 400
        
        # Run detection
        success, result = detector.detect_person_in_video(output_path, tolerance, frame_skip)
        
        if not success:
            # Clean up uploaded files
            os.remove(person_path)
            os.remove(video_path)
            return jsonify({'error': result}), 500
        
        # Clean up uploaded files (keep output video)
        os.remove(person_path)
        os.remove(video_path)
        
        # Return success response
        return jsonify({
            'success': True,
            'message': 'Person detection completed successfully',
            'output_video': output_filename,
            'detection_frame': output_filename.replace('.mp4', '_detection_frame.jpg'),
            'detection_summary': result
        }), 200
        
    except Exception as e:
        logger.error(f"Error in detection: {str(e)}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/api/download/<filename>')
def download_video(filename):
    """Download the processed video file."""
    try:
        file_path = os.path.join(app.config['OUTPUT_FOLDER'], filename)
        if os.path.exists(file_path):
            return send_file(file_path, as_attachment=True, download_name=filename)
        else:
            return jsonify({'error': 'File not found'}), 404
    except Exception as e:
        return jsonify({'error': f'Error downloading file: {str(e)}'}), 500

@app.route('/api/view/<filename>')
def view_file(filename):
    """View the file (video or image) in browser."""
    try:
        file_path = os.path.join(app.config['OUTPUT_FOLDER'], filename)
        if os.path.exists(file_path):
            return send_file(file_path)
        else:
            return jsonify({'error': 'File not found'}), 404
    except Exception as e:
        return jsonify({'error': f'Error viewing file: {str(e)}'}), 500

@app.route('/api/health')
def health_check():
    """Health check endpoint for deployment monitoring."""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': 'Person Detection API'
    })

@app.errorhandler(413)
def too_large(e):
    """Handle file too large error."""
    return jsonify({'error': 'File too large. Maximum size is 100MB.'}), 413

@app.errorhandler(404)
def not_found(e):
    """Handle 404 errors."""
    return jsonify({'error': 'Endpoint not found'}), 404

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
