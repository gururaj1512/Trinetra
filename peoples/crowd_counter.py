import cv2
import argparse
from ultralytics import YOLO
from typing import Optional, Tuple
import time

class CrowdCounter:
    def __init__(self, model_path: str = "yolov8n.pt", conf_threshold: float = 0.5):
        """
        Initialize the CrowdCounter with YOLO model.
        
        Args:
            model_path: Path to YOLO model weights (.pt file)
            conf_threshold: Confidence threshold for detection
        """
        self.model = YOLO(model_path)
        self.conf_threshold = conf_threshold
        self.class_names = self.model.names
        self.person_class_id = list(self.class_names.values()).index('person') if 'person' in self.class_names.values() else 0
        
    def process_frame(self, frame):
        """Process a single frame and return the frame with detections and person count."""
        # Run YOLOv8 inference
        results = self.model(frame, verbose=False)[0]
        
        # Initialize variables
        count = 0
        
        # Process detections
        for box in results.boxes:
            # Check if detection is a person and confidence is above threshold
            if int(box.cls) == self.person_class_id and box.conf >= self.conf_threshold:
                count += 1
                # Draw bounding box
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
        
        # Add count and FPS to frame
        cv2.putText(frame, f"People: {count}", (20, 40),
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        
        return frame, count

def process_image(image_path: str, output_path: Optional[str] = None, show: bool = True):
    """
    Process a single image for crowd counting.
    
    Args:
        image_path: Path to input image file
        output_path: Path to save output image (optional)
        show: Whether to show the output in a window
    """
    # Read the image
    frame = cv2.imread(image_path)
    if frame is None:
        print(f"Error: Could not read image from {image_path}")
        return
    
    # Initialize crowd counter
    counter = CrowdCounter()
    
    # Process the image
    processed_frame, count = counter.process_frame(frame)
    
    # Save the output image if path is provided
    if output_path:
        cv2.imwrite(output_path, processed_frame)
        print(f"Processed image saved to {output_path}")
    
    # Display the result
    if show:
        cv2.imshow('Crowd Counter', processed_frame)
        print(f"Detected {count} people in the image")
        print("Press any key to close...")
        cv2.waitKey(0)
        cv2.destroyAllWindows()

def process_video(input_source: str, output_path: Optional[str] = None, show: bool = True):
    """
    Process video or webcam stream for crowd counting.
    
    Args:
        input_source: Path to video file or 0 for webcam
        output_path: Path to save output video (optional)
        show: Whether to show the output in a window
    """
    # Check if input is an image
    if input_source.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.gif')):
        process_image(input_source, output_path, show)
        return
        
    # Initialize video capture
    cap = cv2.VideoCapture(input_source if input_source.isdigit() == False else int(input_source))
    if not cap.isOpened():
        print(f"Error: Could not open video source {input_source}")
        return
    
    # Get video properties
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    
    # Initialize video writer if output path is provided
    writer = None
    if output_path:
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        writer = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    
    # Initialize crowd counter
    counter = CrowdCounter()
    
    print("Starting crowd counting...")
    print("Press 'q' to quit")
    
    # Process video frame by frame
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        # Process frame
        processed_frame, count = counter.process_frame(frame)
        
        # Display the frame
        if show:
            cv2.imshow('Crowd Counter', processed_frame)
            
            # Break the loop if 'q' is pressed
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        
        # Write the frame to output video
        if writer:
            writer.write(processed_frame)
    
    # Release resources
    cap.release()
    if writer:
        writer.release()
    cv2.destroyAllWindows()

def main():
    parser = argparse.ArgumentParser(description='Crowd Counting using YOLOv8')
    parser.add_argument('--input', type=str, default='0',
                       help='Path to input video/image file, 0 for webcam, or image path')
    parser.add_argument('--output', type=str, default=None,
                       help='Path to save output video/image (optional)')
    parser.add_argument('--no-display', action='store_true',
                       help='Do not display the output')
    
    args = parser.parse_args()
    
    try:
        # Check if input is an image
        if args.input.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.gif')):
            process_image(
                image_path=args.input,
                output_path=args.output,
                show=not args.no_display
            )
        else:
            process_video(
                input_source=args.input,
                output_path=args.output,
                show=not args.no_display
            )
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        return 1
    
    return 0

if __name__ == "__main__":
    main()
