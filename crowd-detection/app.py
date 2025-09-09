#!/usr/bin/env python3
"""
Trinetra - Crowd Analysis Web Application for Mahakumbh
Flask-based web interface for crowd density analysis
"""

import os
import cv2
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Use non-GUI backend for web applications
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap
import base64
import io
from flask import Flask, request, render_template, jsonify, send_file, make_response
from werkzeug.utils import secure_filename
import tempfile
import json
from datetime import datetime
import logging
from pathlib import Path

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

# Import our crowd analyzer
from crowd_analyzer import CrowdAnalyzer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['OUTPUT_FOLDER'] = 'outputs'
app.json_encoder = NumpyEncoder

# Create necessary directories
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['OUTPUT_FOLDER'], exist_ok=True)

# Initialize crowd analyzer
crowd_analyzer = CrowdAnalyzer()

# Allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'mp4', 'avi', 'mov', 'mkv', 'wmv'}

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def is_video_file(filename):
    """Check if file is a video"""
    video_extensions = {'mp4', 'avi', 'mov', 'mkv', 'wmv'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in video_extensions

def is_image_file(filename):
    """Check if file is an image"""
    image_extensions = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in image_extensions

def encode_image_to_base64(image_path):
    """Encode image to base64 for web display"""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def convert_numpy_types(obj):
    """Convert numpy types to Python native types for JSON serialization"""
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {key: convert_numpy_types(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_types(item) for item in obj]
    else:
        return obj

def create_response_data(analysis_result, file_type, output_dir, filename):
    """Create response data for API"""
    base_name = Path(filename).stem
    
    if file_type == 'image':
        # Convert numpy types to Python types
        analysis_data = {
            'estimated_count': int(analysis_result['analysis']['estimated_count']['estimated_count']),
            'crowd_level': str(analysis_result['analysis']['overall']['crowd_level']),
            'confidence': float(analysis_result['analysis']['estimated_count']['confidence']),
            'highest_density_region': str(analysis_result['analysis']['highest_density_region']),
            'regions': convert_numpy_types(analysis_result['analysis']['regions'])
        }
        
        return {
            'success': True,
            'type': 'image',
            'analysis': analysis_data,
            'images': {
                'heatmap': encode_image_to_base64(os.path.join(output_dir, f"{base_name}_heatmap.png")),
                'blended': encode_image_to_base64(os.path.join(output_dir, f"{base_name}_blended.jpg")),
                'analysis': encode_image_to_base64(os.path.join(output_dir, f"{base_name}_analysis.png"))
            },
            'timestamp': datetime.now().isoformat()
        }
    
    elif file_type == 'video':
        # Convert numpy types to Python types
        analysis_data = {
            'total_frames': int(analysis_result['total_frames']),
            'total_people_detected': int(analysis_result['total_people_detected']),
            'average_people_per_frame': float(analysis_result['average_people_per_frame']),
            'max_people_in_frame': int(analysis_result['max_people_in_frame']),
            'final_crowd_level': str(analysis_result['final_analysis']['overall']['crowd_level']),
            'final_regions': convert_numpy_types(analysis_result['final_analysis']['regions'])
        }
        
        return {
            'success': True,
            'type': 'video',
            'analysis': analysis_data,
            'videos': {
                'blended_video': f"/video/{base_name}_blended_output.mp4",
                'heatmap_video': f"/video/{base_name}_heatmap_video.mp4"
            },
            'images': {
                'final_heatmap': encode_image_to_base64(os.path.join(output_dir, f"{base_name}_final_heatmap.png")),
                'final_analysis': encode_image_to_base64(os.path.join(output_dir, f"{base_name}_final_analysis.png"))
            },
            'timestamp': datetime.now().isoformat()
        }

@app.route('/')
def index():
    """Main page"""
    return render_template('index.html')

@app.route('/api/analyze', methods=['POST'])
def analyze_file():
    """API endpoint for file analysis"""
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'success': False, 'error': 'File type not supported'}), 400
        
        # Save uploaded file
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp}_{filename}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        # Create output directory
        output_dir = os.path.join(app.config['OUTPUT_FOLDER'], Path(filename).stem)
        os.makedirs(output_dir, exist_ok=True)
        
        # Analyze file
        if is_image_file(filename):
            logger.info(f"Processing image: {filename}")
            result = crowd_analyzer.process_image(file_path, output_dir)
            response_data = create_response_data(result, 'image', output_dir, filename)
            
        elif is_video_file(filename):
            logger.info(f"Processing video: {filename}")
            result = crowd_analyzer.process_video(file_path, output_dir)
            response_data = create_response_data(result, 'video', output_dir, filename)
            
        else:
            return jsonify({'success': False, 'error': 'Unsupported file type'}), 400
        
        # Clean up uploaded file
        os.remove(file_path)
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Error processing file: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/download/<filename>')
def download_file(filename):
    """Download generated files"""
    try:
        # Find the file in outputs directory
        for root, dirs, files in os.walk(app.config['OUTPUT_FOLDER']):
            if filename in files:
                file_path = os.path.join(root, filename)
                return send_file(file_path, as_attachment=True)
        
        return jsonify({'error': 'File not found'}), 404
        
    except Exception as e:
        logger.error(f"Error downloading file: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/video/<filename>')
def serve_video(filename):
    """Serve video files for inline playback"""
    try:
        # Find the file in outputs directory
        for root, dirs, files in os.walk(app.config['OUTPUT_FOLDER']):
            if filename in files:
                file_path = os.path.join(root, filename)
                
                # Set proper headers for video streaming
                response = make_response(send_file(file_path))
                response.headers['Content-Type'] = 'video/mp4'
                response.headers['Accept-Ranges'] = 'bytes'
                response.headers['Cache-Control'] = 'no-cache'
                
                return response
        
        return jsonify({'error': 'File not found'}), 404
        
    except Exception as e:
        logger.error(f"Error serving video: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Trinetra - Crowd Analysis',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat()
    })

@app.errorhandler(413)
def too_large(e):
    """Handle file too large error"""
    return jsonify({'success': False, 'error': 'File too large. Maximum size is 100MB.'}), 413

@app.errorhandler(404)
def not_found(e):
    """Handle 404 errors"""
    return jsonify({'success': False, 'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(e):
    """Handle 500 errors"""
    return jsonify({'success': False, 'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5002)
