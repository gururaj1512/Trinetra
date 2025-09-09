#!/usr/bin/env python3
"""
Crowd Analyzer for Drone Footage
Processes video and image inputs to detect crowds and generate detailed heatmaps
"""

import cv2
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Use non-GUI backend for web applications
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap
import argparse
import os
from pathlib import Path
import logging
from typing import Tuple, List, Dict
import time

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class CrowdDensityAnalyzer:
    def __init__(self):
        """Initialize the crowd density analyzer"""
        # Parameters for crowd detection
        self.blur_kernel_size = 15
        self.edge_threshold_low = 30
        self.edge_threshold_high = 100
        
        # Create custom colormap for heatmaps
        colors = ['darkblue', 'blue', 'cyan', 'yellow', 'orange', 'red', 'darkred']
        self.colormap = LinearSegmentedColormap.from_list('crowd_density', colors, N=256)
        
    def analyze_frame(self, frame: np.ndarray) -> Tuple[np.ndarray, Dict]:
        """Analyze a single frame for crowd density"""
        # Convert to grayscale
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Method 1: Edge density analysis
        edge_density = self._calculate_edge_density(gray)
        
        # Method 2: Local variance analysis
        variance_density = self._calculate_variance_density(gray)
        
        # Method 3: Gradient magnitude analysis
        gradient_density = self._calculate_gradient_density(gray)
        
        # Combine methods
        combined_density = (
            0.4 * edge_density +
            0.35 * variance_density +
            0.25 * gradient_density
        )
        
        # Normalize and smooth
        density_map = self._normalize_density(combined_density)
        
        # Analyze crowd distribution
        analysis = self._analyze_distribution(density_map, frame.shape)
        
        return density_map, analysis
    
    def _calculate_edge_density(self, gray: np.ndarray) -> np.ndarray:
        """Calculate edge density using Canny edge detection"""
        # Apply Gaussian blur
        blurred = cv2.GaussianBlur(gray, (self.blur_kernel_size, self.blur_kernel_size), 0)
        
        # Detect edges
        edges = cv2.Canny(blurred, self.edge_threshold_low, self.edge_threshold_high)
        
        # Create density map from edges
        edge_density = cv2.GaussianBlur(edges.astype(np.float32), (25, 25), 0)
        
        return edge_density
    
    def _calculate_variance_density(self, gray: np.ndarray) -> np.ndarray:
        """Calculate local variance density"""
        gray_float = gray.astype(np.float32)
        
        # Calculate local variance
        kernel = np.ones((21, 21), np.float32) / 441
        local_mean = cv2.filter2D(gray_float, -1, kernel)
        local_var = cv2.filter2D((gray_float - local_mean)**2, -1, kernel)
        
        # Smooth the variance map
        variance_density = cv2.GaussianBlur(local_var, (25, 25), 0)
        
        return variance_density
    
    def _calculate_gradient_density(self, gray: np.ndarray) -> np.ndarray:
        """Calculate gradient magnitude density"""
        # Calculate gradients
        grad_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        grad_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        
        # Calculate gradient magnitude
        gradient_magnitude = np.sqrt(grad_x**2 + grad_y**2)
        
        # Smooth and normalize
        gradient_density = cv2.GaussianBlur(gradient_magnitude.astype(np.float32), (25, 25), 0)
        
        return gradient_density
    
    def _normalize_density(self, density: np.ndarray) -> np.ndarray:
        """Normalize density map to [0, 1] range"""
        # Remove outliers
        percentile_95 = np.percentile(density, 95)
        percentile_5 = np.percentile(density, 5)
        density = np.clip(density, percentile_5, percentile_95)
        
        # Normalize to [0, 1]
        if density.max() > 0:
            density = (density - density.min()) / (density.max() - density.min())
        
        # Apply smoothing
        density = cv2.GaussianBlur(density, (15, 15), 0)
        
        return density
    
    def _analyze_distribution(self, density_map: np.ndarray, frame_shape: Tuple[int, int, int]) -> Dict:
        """Analyze crowd distribution across different regions"""
        height, width = frame_shape[:2]
        
        # Define road regions (assuming road runs horizontally)
        regions = {
            'left_side': density_map[:, :width//3],
            'center': density_map[:, width//3:2*width//3],
            'right_side': density_map[:, 2*width//3:],
            'top_half': density_map[:height//2, :],
            'bottom_half': density_map[height//2:, :],
            'road_center': density_map[height//4:3*height//4, width//4:3*width//4]
        }
        
        # Calculate statistics for each region
        region_stats = {}
        for name, region in regions.items():
            region_stats[name] = {
                'mean_density': np.mean(region),
                'max_density': np.max(region),
                'total_density': np.sum(region),
                'crowd_level': self._classify_crowd_level(np.mean(region))
            }
        
        # Overall statistics
        overall_stats = {
            'mean_density': np.mean(density_map),
            'max_density': np.max(density_map),
            'total_density': np.sum(density_map),
            'crowd_level': self._classify_crowd_level(np.mean(density_map))
        }
        
        # Find highest density region
        max_region = max(region_stats.keys(), 
                        key=lambda k: region_stats[k]['mean_density'])
        
        # Estimate crowd count
        estimated_count = self._estimate_crowd_count(density_map, frame_shape)
        
        return {
            'regions': region_stats,
            'overall': overall_stats,
            'highest_density_region': max_region,
            'estimated_count': estimated_count
        }
    
    def _classify_crowd_level(self, density: float) -> str:
        """Classify crowd density level"""
        if density < 0.1:
            return "Very Low"
        elif density < 0.25:
            return "Low"
        elif density < 0.4:
            return "Medium"
        elif density < 0.6:
            return "High"
        elif density < 0.8:
            return "Very High"
        else:
            return "Extremely High"
    
    def _estimate_crowd_count(self, density_map: np.ndarray, frame_shape: Tuple[int, int, int]) -> Dict:
        """Estimate crowd count based on density analysis"""
        height, width = frame_shape[:2]
        total_pixels = height * width
        mean_density = np.mean(density_map)
        max_density = np.max(density_map)
        
        # Adaptive pixels per person based on density
        if mean_density < 0.1:
            pixels_per_person = 800  # Very sparse crowd
        elif mean_density < 0.2:
            pixels_per_person = 500  # Sparse crowd
        elif mean_density < 0.4:
            pixels_per_person = 300  # Medium density
        elif mean_density < 0.6:
            pixels_per_person = 200  # Dense crowd
        else:
            pixels_per_person = 120  # Very dense crowd
        
        # Calculate estimate based on high-density areas
        # Use only pixels with significant density (> 0.3 of max)
        high_density_threshold = max_density * 0.3
        high_density_pixels = np.sum(density_map > high_density_threshold)
        
        # Estimate based on high-density areas
        base_estimate = int(high_density_pixels / pixels_per_person)
        
        # Apply density scaling factor
        density_factor = min(2.0, mean_density * 5.0)  # Scale factor based on overall density
        scaled_estimate = int(base_estimate * density_factor)
        
        # Apply confidence factor
        spatial_consistency = 1.0 / (1.0 + np.std(density_map))
        confidence = max(0.3, spatial_consistency)
        
        final_estimate = int(scaled_estimate * confidence)
        
        # Ensure reasonable bounds
        final_estimate = max(0, min(final_estimate, 50000))  # Cap at 50k people
        
        return {
            'estimated_count': final_estimate,
            'confidence': confidence,
            'pixels_per_person': pixels_per_person,
            'base_estimate': base_estimate
        }

class HeatmapGenerator:
    def __init__(self):
        """Initialize heatmap generator"""
        colors = ['darkblue', 'blue', 'cyan', 'yellow', 'orange', 'red', 'darkred']
        self.colormap = LinearSegmentedColormap.from_list('crowd_density', colors, N=256)
    
    def generate_heatmap(self, density_map: np.ndarray, original_frame: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """Generate colored heatmap and blended visualization"""
        # Create colored heatmap
        colored_heatmap = self.colormap(density_map)
        colored_heatmap = (colored_heatmap[:, :, :3] * 255).astype(np.uint8)
        
        # Blend with original frame
        alpha = 0.7
        blended = cv2.addWeighted(original_frame, 1 - alpha, colored_heatmap, alpha, 0)
        
        return colored_heatmap, blended
    
    def create_analysis_heatmap(self, density_map: np.ndarray, analysis: Dict, frame_shape: Tuple[int, int, int]) -> None:
        """Create detailed analysis heatmap with annotations"""
        height, width = frame_shape[:2]
        
        # Create figure with subplots
        fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(20, 16))
        
        # Main heatmap
        im1 = ax1.imshow(density_map, cmap=self.colormap, interpolation='nearest')
        ax1.set_title('Crowd Density Heatmap', fontsize=16, fontweight='bold')
        ax1.set_xticks([])
        ax1.set_yticks([])
        
        # Add colorbar
        cbar1 = plt.colorbar(im1, ax=ax1, shrink=0.8)
        cbar1.set_label('Crowd Density', fontsize=12)
        
        # Regional analysis
        regions = ['left_side', 'center', 'right_side', 'top_half', 'bottom_half']
        region_densities = [analysis['regions'][region]['mean_density'] for region in regions]
        region_names = [region.replace('_', ' ').title() for region in regions]
        
        bars = ax2.bar(region_names, region_densities, color=['blue', 'green', 'red', 'orange', 'purple'])
        ax2.set_title('Regional Density Analysis', fontsize=16, fontweight='bold')
        ax2.set_ylabel('Mean Density')
        ax2.tick_params(axis='x', rotation=45)
        
        # Add value labels on bars
        for bar, density in zip(bars, region_densities):
            height = bar.get_height()
            ax2.text(bar.get_x() + bar.get_width()/2., height + 0.01,
                    f'{density:.3f}', ha='center', va='bottom')
        
        # Road side analysis
        road_sides = ['Left Side', 'Center', 'Right Side']
        road_densities = [
            analysis['regions']['left_side']['mean_density'],
            analysis['regions']['center']['mean_density'],
            analysis['regions']['right_side']['mean_density']
        ]
        
        colors = ['red' if d > 0.3 else 'orange' if d > 0.15 else 'green' for d in road_densities]
        bars2 = ax3.bar(road_sides, road_densities, color=colors)
        ax3.set_title('Road Side Crowd Distribution', fontsize=16, fontweight='bold')
        ax3.set_ylabel('Mean Density')
        
        # Add value labels
        for bar, density in zip(bars2, road_densities):
            height = bar.get_height()
            ax3.text(bar.get_x() + bar.get_width()/2., height + 0.01,
                    f'{density:.3f}', ha='center', va='bottom')
        
        # Summary statistics
        ax4.axis('off')
        summary_text = f"""
CROWD ANALYSIS SUMMARY

Overall Crowd Level: {analysis['overall']['crowd_level']}
Estimated Count: {analysis['estimated_count']['estimated_count']:,} people
Confidence: {analysis['estimated_count']['confidence']:.1%}

Highest Density Region: {analysis['highest_density_region'].replace('_', ' ').title()}

ROAD ANALYSIS:
• Left Side: {analysis['regions']['left_side']['crowd_level']} ({analysis['regions']['left_side']['mean_density']:.3f})
• Center: {analysis['regions']['center']['crowd_level']} ({analysis['regions']['center']['mean_density']:.3f})
• Right Side: {analysis['regions']['right_side']['crowd_level']} ({analysis['regions']['right_side']['mean_density']:.3f})

DENSITY STATISTICS:
• Mean Density: {analysis['overall']['mean_density']:.4f}
• Max Density: {analysis['overall']['max_density']:.4f}
• Total Density: {analysis['overall']['total_density']:.2f}
        """
        
        ax4.text(0.1, 0.9, summary_text, transform=ax4.transAxes, fontsize=12,
                verticalalignment='top', fontfamily='monospace',
                bbox=dict(boxstyle='round', facecolor='lightgray', alpha=0.8))
        
        plt.tight_layout()
        return fig

class VideoProcessor:
    def __init__(self):
        """Initialize video processor"""
        self.analyzer = CrowdDensityAnalyzer()
        self.heatmap_gen = HeatmapGenerator()
        
    def process_video(self, video_path: str, output_path: str = None, heatmap_video_path: str = None) -> Dict:
        """Process video file and generate analysis"""
        logger.info(f"Processing video: {video_path}")
        
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Could not open video: {video_path}")
        
        # Get video properties
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        logger.info(f"Video properties: {width}x{height}, {fps} FPS, {total_frames} frames")
        
        # Initialize video writers
        writer = None
        heatmap_writer = None
        
        if output_path:
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            writer = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
        
        if heatmap_video_path:
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            heatmap_writer = cv2.VideoWriter(heatmap_video_path, fourcc, fps, (width, height))
        
        # Process frames
        frame_count = 0
        all_analyses = []
        cumulative_density = np.zeros((height, width), dtype=np.float32)
        heatmap_frames = []  # Store individual heatmap frames
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_count += 1
            if frame_count % 30 == 0:  # Log every 30 frames
                logger.info(f"Processing frame {frame_count}/{total_frames}")
            
            # Analyze frame
            density_map, analysis = self.analyzer.analyze_frame(frame)
            all_analyses.append(analysis)
            
            # Accumulate density for final heatmap
            cumulative_density += density_map
            
            # Generate heatmap for this frame
            colored_heatmap, blended_frame = self.heatmap_gen.generate_heatmap(density_map, frame)
            
            # Store heatmap frame for video creation
            heatmap_frames.append(colored_heatmap.copy())
            
            # Add frame info to blended frame
            info_text = f"Frame: {frame_count}/{total_frames} | Count: {analysis['estimated_count']['estimated_count']} | Level: {analysis['overall']['crowd_level']}"
            cv2.putText(blended_frame, info_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            
            # Add frame info to heatmap frame
            heatmap_info = f"Frame: {frame_count}/{total_frames} | Density: {analysis['overall']['mean_density']:.3f} | Level: {analysis['overall']['crowd_level']}"
            cv2.putText(colored_heatmap, heatmap_info, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            
            # Write frames if output specified
            if writer:
                writer.write(blended_frame)
            
            if heatmap_writer:
                heatmap_writer.write(colored_heatmap)
        
        cap.release()
        if writer:
            writer.release()
        if heatmap_writer:
            heatmap_writer.release()
        
        # Generate final cumulative analysis
        final_density = cumulative_density / frame_count
        final_analysis = self.analyzer._analyze_distribution(final_density, (height, width, 3))
        
        # Calculate video-wide statistics
        total_people = sum(analysis['estimated_count']['estimated_count'] for analysis in all_analyses)
        avg_people_per_frame = total_people / frame_count
        max_people = max(analysis['estimated_count']['estimated_count'] for analysis in all_analyses)
        
        video_stats = {
            'total_frames': frame_count,
            'total_people_detected': total_people,
            'average_people_per_frame': avg_people_per_frame,
            'max_people_in_frame': max_people,
            'final_density_map': final_density,
            'final_analysis': final_analysis,
            'frame_analyses': all_analyses,
            'heatmap_frames': heatmap_frames
        }
        
        return video_stats

class CrowdAnalyzer:
    def __init__(self):
        """Initialize the main crowd analyzer"""
        self.analyzer = CrowdDensityAnalyzer()
        self.heatmap_gen = HeatmapGenerator()
        self.video_processor = VideoProcessor()
        
    def process_image(self, image_path: str, output_dir: str = "./crowd_analysis_output") -> Dict:
        """Process a single image"""
        logger.info(f"Processing image: {image_path}")
        
        # Read image
        frame = cv2.imread(image_path)
        if frame is None:
            raise ValueError(f"Could not read image: {image_path}")
        
        logger.info(f"Image loaded: {frame.shape}")
        
        # Analyze image
        density_map, analysis = self.analyzer.analyze_frame(frame)
        
        # Generate heatmaps
        colored_heatmap, blended_frame = self.heatmap_gen.generate_heatmap(density_map, frame)
        
        # Save results
        os.makedirs(output_dir, exist_ok=True)
        base_name = Path(image_path).stem
        
        # Save files
        cv2.imwrite(os.path.join(output_dir, f"{base_name}_heatmap.png"), colored_heatmap)
        cv2.imwrite(os.path.join(output_dir, f"{base_name}_blended.jpg"), blended_frame)
        np.save(os.path.join(output_dir, f"{base_name}_density.npy"), density_map)
        
        # Create detailed analysis heatmap
        fig = self.heatmap_gen.create_analysis_heatmap(density_map, analysis, frame.shape)
        fig.savefig(os.path.join(output_dir, f"{base_name}_analysis.png"), 
                   dpi=300, bbox_inches='tight', facecolor='white')
        plt.close(fig)
        
        # Save analysis report
        self._save_analysis_report(analysis, os.path.join(output_dir, f"{base_name}_report.txt"))
        
        results = {
            'density_map': density_map,
            'analysis': analysis,
            'colored_heatmap': colored_heatmap,
            'blended_frame': blended_frame
        }
        
        return results
    
    def process_video(self, video_path: str, output_dir: str = "./crowd_analysis_output") -> Dict:
        """Process a video file"""
        logger.info(f"Processing video: {video_path}")
        
        # Create output directory
        os.makedirs(output_dir, exist_ok=True)
        base_name = Path(video_path).stem
        
        # Process video with heatmap video generation
        video_stats = self.video_processor.process_video(
            video_path, 
            os.path.join(output_dir, f"{base_name}_blended_output.mp4"),
            os.path.join(output_dir, f"{base_name}_heatmap_video.mp4")
        )
        
        # Save final cumulative heatmap
        final_density = video_stats['final_density_map']
        final_analysis = video_stats['final_analysis']
        
        # Generate final heatmap
        colored_heatmap, _ = self.heatmap_gen.generate_heatmap(final_density, 
                                                              np.zeros((final_density.shape[0], final_density.shape[1], 3), dtype=np.uint8))
        
        cv2.imwrite(os.path.join(output_dir, f"{base_name}_final_heatmap.png"), colored_heatmap)
        np.save(os.path.join(output_dir, f"{base_name}_final_density.npy"), final_density)
        
        # Create detailed analysis
        fig = self.heatmap_gen.create_analysis_heatmap(final_density, final_analysis, 
                                                      (final_density.shape[0], final_density.shape[1], 3))
        fig.savefig(os.path.join(output_dir, f"{base_name}_final_analysis.png"), 
                   dpi=300, bbox_inches='tight', facecolor='white')
        plt.close(fig)
        
        # Save video analysis report
        self._save_video_report(video_stats, os.path.join(output_dir, f"{base_name}_video_report.txt"))
        
        return video_stats
    
    def _save_analysis_report(self, analysis: Dict, report_path: str):
        """Save analysis report to file"""
        with open(report_path, 'w') as f:
            f.write("CROWD ANALYSIS REPORT\n")
            f.write("=" * 50 + "\n\n")
            
            f.write(f"CROWD COUNT ESTIMATION:\n")
            f.write(f"Estimated count: {analysis['estimated_count']['estimated_count']:,} people\n")
            f.write(f"Confidence: {analysis['estimated_count']['confidence']:.1%}\n")
            f.write(f"Pixels per person: {analysis['estimated_count']['pixels_per_person']}\n\n")
            
            f.write(f"OVERALL ANALYSIS:\n")
            f.write(f"Crowd level: {analysis['overall']['crowd_level']}\n")
            f.write(f"Mean density: {analysis['overall']['mean_density']:.4f}\n")
            f.write(f"Max density: {analysis['overall']['max_density']:.4f}\n")
            f.write(f"Highest density region: {analysis['highest_density_region']}\n\n")
            
            f.write(f"ROAD SIDE ANALYSIS:\n")
            for region in ['left_side', 'center', 'right_side']:
                stats = analysis['regions'][region]
                f.write(f"{region.replace('_', ' ').title()}:\n")
                f.write(f"  Crowd level: {stats['crowd_level']}\n")
                f.write(f"  Mean density: {stats['mean_density']:.4f}\n")
                f.write(f"  Max density: {stats['max_density']:.4f}\n\n")
    
    def _save_video_report(self, video_stats: Dict, report_path: str):
        """Save video analysis report to file"""
        with open(report_path, 'w') as f:
            f.write("VIDEO CROWD ANALYSIS REPORT\n")
            f.write("=" * 60 + "\n\n")
            
            f.write(f"VIDEO STATISTICS:\n")
            f.write(f"Total frames processed: {video_stats['total_frames']:,}\n")
            f.write(f"Total people detected: {video_stats['total_people_detected']:,}\n")
            f.write(f"Average people per frame: {video_stats['average_people_per_frame']:.1f}\n")
            f.write(f"Maximum people in single frame: {video_stats['max_people_in_frame']:,}\n\n")
            
            final_analysis = video_stats['final_analysis']
            f.write(f"FINAL CUMULATIVE ANALYSIS:\n")
            f.write(f"Overall crowd level: {final_analysis['overall']['crowd_level']}\n")
            f.write(f"Mean density: {final_analysis['overall']['mean_density']:.4f}\n")
            f.write(f"Highest density region: {final_analysis['highest_density_region']}\n\n")
            
            f.write(f"ROAD SIDE DISTRIBUTION:\n")
            for region in ['left_side', 'center', 'right_side']:
                stats = final_analysis['regions'][region]
                f.write(f"{region.replace('_', ' ').title()}: {stats['crowd_level']} ({stats['mean_density']:.4f})\n")

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='Crowd Analyzer for Drone Footage')
    parser.add_argument('input', help='Input video or image file path')
    parser.add_argument('-o', '--output', help='Output directory', default='./crowd_analysis_output')
    parser.add_argument('--blended-video', help='Output blended video path (for video input)')
    parser.add_argument('--heatmap-video', help='Output heatmap video path (for video input)')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.input):
        logger.error(f"Input file not found: {args.input}")
        return
    
    analyzer = CrowdAnalyzer()
    
    try:
        input_path = Path(args.input)
        
        if input_path.suffix.lower() in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']:
            # Process image
            results = analyzer.process_image(args.input, args.output)
            
            print(f"\n{'='*60}")
            print(f"IMAGE ANALYSIS COMPLETE")
            print(f"{'='*60}")
            print(f"Estimated crowd count: {results['analysis']['estimated_count']['estimated_count']:,}")
            print(f"Crowd level: {results['analysis']['overall']['crowd_level']}")
            print(f"Highest density region: {results['analysis']['highest_density_region']}")
            print(f"Confidence: {results['analysis']['estimated_count']['confidence']:.1%}")
            
        elif input_path.suffix.lower() in ['.mp4', '.avi', '.mov', '.mkv', '.wmv']:
            # Process video
            results = analyzer.process_video(args.input, args.output)
            
            print(f"\n{'='*60}")
            print(f"VIDEO ANALYSIS COMPLETE")
            print(f"{'='*60}")
            print(f"Total frames: {results['total_frames']:,}")
            print(f"Total people detected: {results['total_people_detected']:,}")
            print(f"Average per frame: {results['average_people_per_frame']:.1f}")
            print(f"Max in single frame: {results['max_people_in_frame']:,}")
            print(f"Final crowd level: {results['final_analysis']['overall']['crowd_level']}")
            print(f"\nGenerated videos:")
            print(f"  - Blended video: {input_path.stem}_blended_output.mp4")
            print(f"  - Heatmap video: {input_path.stem}_heatmap_video.mp4")
            
        else:
            logger.error(f"Unsupported file format: {input_path.suffix}")
            return
        
        print(f"\nResults saved to: {args.output}")
        
    except Exception as e:
        logger.error(f"Error during processing: {str(e)}")
        raise

if __name__ == "__main__":
    main()
