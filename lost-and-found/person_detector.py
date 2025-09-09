import cv2
import face_recognition
import numpy as np
import os
from PIL import Image
import argparse

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
        self.output_dir = "detected_frames"
        
        # Create output directory
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)
    
    def load_person_encoding(self):
        """Load and encode the lost person's face."""
        try:
            # Load the person's image
            person_image = face_recognition.load_image_file(self.person_image_path)
            
            # Find face encodings in the person's image
            face_encodings = face_recognition.face_encodings(person_image)
            
            if len(face_encodings) == 0:
                print("No face found in the person's image. Please use an image with a clear face.")
                return False
            
            # Use the first face encoding found
            self.person_encoding = face_encodings[0]
            print("Successfully loaded person's face encoding.")
            return True
            
        except Exception as e:
            print(f"Error loading person's image: {e}")
            return False
    
    def detect_person_in_video(self, tolerance=0.6, frame_skip=5):
        """
        Detect the lost person in the crowd video.
        
        Args:
            tolerance (float): Face recognition tolerance (lower = more strict)
            frame_skip (int): Process every nth frame to speed up detection
        """
        if self.person_encoding is None:
            print("Person encoding not loaded. Please load the person's image first.")
            return
        
        # Open the video file
        video = cv2.VideoCapture(self.video_path)
        
        if not video.isOpened():
            print("Error: Could not open video file.")
            return
        
        frame_count = 0
        detected_frames = 0
        
        print("Starting person detection in video...")
        print(f"Processing every {frame_skip}th frame for efficiency.")
        
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
                for i, face_encoding in enumerate(face_encodings):
                    # Compare faces
                    matches = face_recognition.compare_faces([self.person_encoding], face_encoding, tolerance=tolerance)
                    
                    if matches[0]:
                        # Person found! Save the frame
                        frame_filename = f"frame_{frame_count:06d}_detection_{detected_frames:03d}.jpg"
                        frame_path = os.path.join(self.output_dir, frame_filename)
                        
                        # Draw rectangle around the detected face
                        top, right, bottom, left = face_locations[i]
                        cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)
                        cv2.putText(frame, "PERSON FOUND!", (left, top - 10), 
                                  cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
                        
                        # Save the frame
                        cv2.imwrite(frame_path, frame)
                        detected_frames += 1
                        
                        print(f"Person detected in frame {frame_count} - Saved as {frame_filename}")
                
                # Show progress
                if frame_count % 100 == 0:
                    print(f"Processed {frame_count} frames...")
            
            frame_count += 1
        
        video.release()
        print(f"\nDetection complete!")
        print(f"Total frames processed: {frame_count}")
        print(f"Frames with person detected: {detected_frames}")
        print(f"Detected frames saved in: {self.output_dir}/")
    
    def run_detection(self, tolerance=0.6, frame_skip=5):
        """Run the complete person detection process."""
        print("=== Lost Person Detection System ===")
        print(f"Person image: {self.person_image_path}")
        print(f"Video file: {self.video_path}")
        print()
        
        # Load person's face encoding
        if not self.load_person_encoding():
            return
        
        # Detect person in video
        self.detect_person_in_video(tolerance, frame_skip)

def main():
    parser = argparse.ArgumentParser(description='Detect a lost person in a crowd video')
    parser.add_argument('--person', default='person3.png', help='Path to the lost person\'s image')
    parser.add_argument('--video', default='crowd1.mp4', help='Path to the crowd video')
    parser.add_argument('--tolerance', type=float, default=0.4, help='Face recognition tolerance (0.0-1.0, lower is stricter)')
    parser.add_argument('--frame-skip', type=int, default=20, help='Process every nth frame (higher = faster but may miss detections)')
    
    args = parser.parse_args()
    
    # Check if files exist
    if not os.path.exists(args.person):
        print(f"Error: Person image '{args.person}' not found.")
        return
    
    if not os.path.exists(args.video):
        print(f"Error: Video file '{args.video}' not found.")
        return
    
    # Create detector and run detection
    detector = PersonDetector(args.person, args.video)
    detector.run_detection(args.tolerance, args.frame_skip)

if __name__ == "__main__":
    main()

