# Crowd Analyzer for Drone Footage

A comprehensive Python script that processes drone footage or images to detect crowds and generate detailed heatmaps showing crowd density distribution across roads and areas.

## Features

- **Multi-format Support**: Processes both video files and images
- **Road-Specific Analysis**: Analyzes crowd distribution across left, center, and right sides of roads
- **Detailed Heatmaps**: Generates color-coded density maps with proper scaling
- **Crowd Estimation**: Estimates total crowd count with confidence levels
- **Video Processing**: Processes video frames and creates cumulative analysis
- **Comprehensive Reports**: Generates detailed analysis reports and visualizations

## Requirements

- Python 3.8+
- OpenCV 4.8+
- NumPy 1.24+
- Matplotlib 3.7+

## Installation

1. Install the required dependencies:

```bash
pip install -r requirements.txt
```

## Usage

### Basic Usage

```bash
# Process an image
python crowd_analyzer.py path/to/image.jpg

# Process a video
python crowd_analyzer.py path/to/video.mp4

# Specify output directory
python crowd_analyzer.py input.jpg -o ./my_results

# Process video and save output video
python crowd_analyzer.py input.mp4 --video-output output.mp4
```

### Test Script

```bash
# Run the test script with the example image
python test_crowd_analyzer.py
```

### Command Line Arguments

- `input`: Path to input video or image file (required)
- `-o, --output`: Output directory for results (default: `./crowd_analysis_output`)
- `--video-output`: Output video path for video processing

### Supported Formats

**Images**: JPG, JPEG, PNG, BMP, TIFF
**Videos**: MP4, AVI, MOV, MKV, WMV

## Output

The script generates several output files:

### For Images:
1. **`*_heatmap.png`**: Colored heatmap showing crowd density
2. **`*_blended.jpg`**: Original image with heatmap overlay
3. **`*_analysis.png`**: Detailed analysis with regional breakdown
4. **`*_density.npy`**: Raw density data (NumPy array)
5. **`*_report.txt`**: Detailed analysis report

### For Videos:
1. **`*_blended_output.mp4`**: Video with heatmap overlay on original footage
2. **`*_heatmap_video.mp4`**: Pure heatmap video showing density changes frame-by-frame
3. **`*_final_heatmap.png`**: Cumulative heatmap from all frames
4. **`*_final_analysis.png`**: Final analysis visualization
5. **`*_final_density.npy`**: Cumulative density data
6. **`*_video_report.txt`**: Video analysis report

## Analysis Features

### Road-Side Analysis
- **Left Side**: Crowd density on the left side of the road
- **Center**: Crowd density in the center of the road
- **Right Side**: Crowd density on the right side of the road

### Crowd Level Classification
- **Very Low**: Density < 0.1
- **Low**: Density 0.1 - 0.25
- **Medium**: Density 0.25 - 0.4
- **High**: Density 0.4 - 0.6
- **Very High**: Density 0.6 - 0.8
- **Extremely High**: Density > 0.8

### Crowd Count Estimation
- Adaptive pixel-per-person calculation based on density
- Confidence scoring based on spatial consistency
- Multiple estimation methods combined

## Example Usage Scenarios

### Drone Footage Analysis

```bash
# Analyze drone video of a crowd
python crowd_analyzer.py drone_footage.mp4 -o ./drone_analysis

# This will generate:
# - drone_footage_blended_output.mp4 (original video with heatmap overlay)
# - drone_footage_heatmap_video.mp4 (pure heatmap video)
# - drone_footage_final_heatmap.png (cumulative heatmap)
# - drone_footage_final_analysis.png (detailed analysis)
```

### Image Analysis

```bash
# Analyze a crowd image
python crowd_analyzer.py crowd_photo.jpg -o ./photo_analysis
```

### Batch Processing

```bash
# Process multiple images
for img in *.jpg; do
    python crowd_analyzer.py "$img" -o "./results/$(basename "$img" .jpg)"
done
```

## How It Works

### Density Analysis Methods

1. **Edge Density**: Uses Canny edge detection to find crowd boundaries
2. **Local Variance**: Analyzes pixel variation to detect crowd patterns
3. **Gradient Magnitude**: Uses Sobel operators to detect intensity changes

### Heatmap Generation

1. **Multi-method Combination**: Combines edge, variance, and gradient analysis
2. **Normalization**: Removes outliers and normalizes to [0,1] range
3. **Smoothing**: Applies Gaussian blur for better visualization
4. **Color Mapping**: Maps density values to intuitive color spectrum

### Road Analysis

- **Horizontal Division**: Splits image into left, center, right regions
- **Vertical Division**: Analyzes top and bottom halves
- **Regional Statistics**: Calculates mean, max, and total density for each region

## Performance Tips

1. **Video Processing**: For long videos, consider processing in segments
2. **Resolution**: Higher resolution inputs provide better analysis accuracy
3. **Memory Usage**: Large videos may require significant RAM

## Troubleshooting

### Common Issues

1. **OpenCV Installation**: If you encounter OpenCV issues, try:
   ```bash
   pip uninstall opencv-python
   pip install opencv-python-headless
   ```

2. **Memory Issues**: For large videos, ensure sufficient RAM availability

3. **Display Issues**: The script works in headless environments

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## Support

For questions or issues, please check the troubleshooting section or create an issue in the repository.