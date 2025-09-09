#!/usr/bin/env python3
"""
Test script for the Lost Person Detection API
Run this after starting the Flask server to test the endpoints
"""

import requests
import json
import os
import time

# API base URL
BASE_URL = "http://localhost:5000"

def test_health_check():
    """Test the health check endpoint"""
    print("🔍 Testing health check endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Health check failed with status {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure the Flask app is running.")
        return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False
    return True

def test_web_interface():
    """Test the web interface endpoint"""
    print("\n🌐 Testing web interface endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200:
            print("✅ Web interface accessible")
            print(f"   Content length: {len(response.text)} characters")
        else:
            print(f"❌ Web interface failed with status {response.status_code}")
    except Exception as e:
        print(f"❌ Web interface error: {e}")
        return False
    return True

def test_detection_without_files():
    """Test the detection endpoint without files (should fail gracefully)"""
    print("\n📤 Testing detection endpoint without files...")
    try:
        response = requests.post(f"{BASE_URL}/api/detect")
        if response.status_code == 400:
            print("✅ Detection endpoint properly rejects requests without files")
            error_data = response.json()
            print(f"   Error message: {error_data.get('error', 'Unknown error')}")
        else:
            print(f"❌ Unexpected response: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Detection test error: {e}")
        return False
    return True

def test_detection_with_files():
    """Test the detection endpoint with actual files"""
    print("\n📁 Testing detection endpoint with files...")
    
    # Check if test files exist
    person_file = "person.png"
    video_file = "crowd.mp4"
    
    if not os.path.exists(person_file):
        print(f"⚠️  Person image file '{person_file}' not found. Skipping file test.")
        return True
    
    if not os.path.exists(video_file):
        print(f"⚠️  Video file '{video_file}' not found. Skipping file test.")
        return True
    
    try:
        # Prepare files for upload
        files = {
            'person_image': open(person_file, 'rb'),
            'crowd_video': open(video_file, 'rb')
        }
        
        data = {
            'tolerance': '0.6',
            'frame_skip': '5'
        }
        
        print("   Uploading files for detection...")
        response = requests.post(f"{BASE_URL}/api/detect", files=files, data=data)
        
        # Close file handles
        files['person_image'].close()
        files['crowd_video'].close()
        
        if response.status_code == 200:
            print("✅ Detection request successful!")
            result = response.json()
            print(f"   Output video: {result.get('output_video', 'Unknown')}")
            print(f"   Total frames: {result.get('detection_summary', {}).get('total_frames', 'Unknown')}")
            print(f"   Detected frames: {result.get('detection_summary', {}).get('detected_frames', 'Unknown')}")
            
            # Test download endpoint
            output_video = result.get('output_video')
            if output_video:
                print(f"\n📥 Testing download endpoint for {output_video}...")
                download_response = requests.get(f"{BASE_URL}/api/download/{output_video}")
                if download_response.status_code == 200:
                    print("✅ Download endpoint working")
                else:
                    print(f"❌ Download failed with status {download_response.status_code}")
            
        elif response.status_code == 400:
            error_data = response.json()
            print(f"⚠️  Detection request failed (client error): {error_data.get('error', 'Unknown error')}")
        elif response.status_code == 500:
            error_data = response.json()
            print(f"❌ Detection request failed (server error): {error_data.get('error', 'Unknown error')}")
        else:
            print(f"❌ Unexpected response: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ File detection test error: {e}")
        return False
    
    return True

def main():
    """Run all tests"""
    print("🚀 Starting Lost Person Detection API Tests")
    print("=" * 50)
    
    # Test server connectivity
    if not test_health_check():
        print("\n❌ Server is not running. Please start the Flask app first:")
        print("   python app.py")
        return
    
    # Test web interface
    test_web_interface()
    
    # Test detection endpoint without files
    test_detection_without_files()
    
    # Test detection endpoint with files
    test_detection_with_files()
    
    print("\n" + "=" * 50)
    print("🏁 All tests completed!")
    print("\nTo use the API:")
    print("1. Web interface: http://localhost:5000")
    print("2. API endpoint: POST http://localhost:5000/api/detect")
    print("3. Health check: GET http://localhost:5000/api/health")

if __name__ == "__main__":
    main()
