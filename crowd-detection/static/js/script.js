// Trinetra - Mahakumbh Crowd Analysis Frontend JavaScript

class TrinetraApp {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.checkHealth();
    }

    initializeElements() {
        // Main stat cards
        this.riskScore = document.getElementById('riskScore');
        this.criticalAlerts = document.getElementById('criticalAlerts');
        this.currentCrowd = document.getElementById('currentCrowd');
        this.openRoutes = document.getElementById('openRoutes');

        // Upload elements
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.uploadProgress = document.getElementById('uploadProgress');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');

        // Preview elements
        this.previewSection = document.getElementById('previewSection');
        this.previewContent = document.getElementById('previewContent');

        // Analysis elements
        this.analysisSection = document.getElementById('analysisSection');
        this.analysisType = document.getElementById('analysisType');
        this.imageAnalysis = document.getElementById('imageAnalysis');
        this.videoAnalysis = document.getElementById('videoAnalysis');
        this.roadAnalysis = document.getElementById('roadAnalysis');

        // Image analysis elements
        this.imageCount = document.getElementById('imageCount');
        this.imageLevel = document.getElementById('imageLevel');
        this.imageConfidence = document.getElementById('imageConfidence');
        this.imageRegion = document.getElementById('imageRegion');
        this.heatmapImage = document.getElementById('heatmapImage');
        this.blendedImage = document.getElementById('blendedImage');
        this.analysisImage = document.getElementById('analysisImage');

        // Video analysis elements
        this.videoFrames = document.getElementById('videoFrames');
        this.videoAverage = document.getElementById('videoAverage');
        this.videoMax = document.getElementById('videoMax');
        this.blendedVideo = document.getElementById('blendedVideo');
        this.heatmapVideo = document.getElementById('heatmapVideo');
        this.blendedSource = document.getElementById('blendedSource');
        this.heatmapSource = document.getElementById('heatmapSource');
        this.blendedDownload = document.getElementById('blendedDownload');
        this.heatmapDownload = document.getElementById('heatmapDownload');
        this.finalHeatmapImage = document.getElementById('finalHeatmapImage');
        this.finalAnalysisImage = document.getElementById('finalAnalysisImage');

        // Road analysis elements
        this.roadStats = document.getElementById('roadStats');

        // Loading elements
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.loadingText = document.getElementById('loadingText');
    }

    bindEvents() {
        // Upload area events
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        this.uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.uploadArea.addEventListener('drop', this.handleDrop.bind(this));

        // File input event
        this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
    }

    async checkHealth() {
        try {
            const response = await fetch('/api/health');
            const data = await response.json();
            console.log('Trinetra is healthy:', data);
        } catch (error) {
            console.error('Health check failed:', error);
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    async processFile(file) {
        // Validate file
        if (!this.validateFile(file)) {
            return;
        }

        // Show preview first
        this.showPreview(file);

        // Show loading
        this.showLoading('Uploading and analyzing your media...');

        // Create form data
        const formData = new FormData();
        formData.append('file', file);

        try {
            // Upload and analyze
            const response = await fetch('/api/analyze', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.displayResults(result);
            } else {
                this.showError(result.error || 'Analysis failed');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showError('Network error. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    validateFile(file) {
        const maxSize = 100 * 1024 * 1024; // 100MB
        const allowedTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff',
            'video/mp4', 'video/avi', 'video/mov', 'video/quicktime', 'video/x-msvideo'
        ];

        if (file.size > maxSize) {
            this.showError('File size too large. Maximum size is 100MB.');
            return false;
        }

        if (!allowedTypes.includes(file.type)) {
            this.showError('File type not supported. Please upload images or videos.');
            return false;
        }

        return true;
    }

    showPreview(file) {
        this.previewSection.style.display = 'block';
        this.previewContent.innerHTML = '';

        const isVideo = file.type.startsWith('video/');
        const isImage = file.type.startsWith('image/');

        if (isImage) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.className = 'preview-media';
            img.alt = 'Preview';
            this.previewContent.appendChild(img);
        } else if (isVideo) {
            const video = document.createElement('video');
            video.src = URL.createObjectURL(file);
            video.className = 'preview-media';
            video.controls = true;
            video.preload = 'metadata';
            this.previewContent.appendChild(video);
        }

        this.previewSection.scrollIntoView({ behavior: 'smooth' });
    }

    displayResults(result) {
        // Update main stat cards
        this.updateMainStats(result);
        
        this.analysisSection.style.display = 'block';
        this.analysisSection.scrollIntoView({ behavior: 'smooth' });

        if (result.type === 'image') {
            this.displayImageResults(result);
        } else if (result.type === 'video') {
            this.displayVideoResults(result);
        }
    }

    updateMainStats(data) {
        // Calculate risk score based on crowd density
        const crowdCount = data.analysis?.estimated_count || 0;
        let riskScore = 0;
        let criticalAlerts = 0;
        
        if (crowdCount > 1000) {
            riskScore = Math.min(100, Math.floor(crowdCount / 50));
            criticalAlerts = crowdCount > 2000 ? 1 : 0;
        }
        
        // Update risk score
        this.riskScore.textContent = riskScore;
        
        // Update critical alerts
        this.criticalAlerts.textContent = criticalAlerts;
        
        // Update current crowd
        this.currentCrowd.textContent = crowdCount;
        
        // Update open routes (simplified logic)
        const openRoutes = crowdCount > 1000 ? Math.max(0, 4 - Math.floor(crowdCount / 500)) : 4;
        this.openRoutes.textContent = openRoutes;
        
        // Update status text based on risk level
        const riskCard = this.riskScore.closest('.stat-card');
        const alertCard = this.criticalAlerts.closest('.stat-card');
        const crowdCard = this.currentCrowd.closest('.stat-card');
        const routeCard = this.openRoutes.closest('.stat-card');
        
        // Update risk status
        const riskStatus = riskCard.querySelector('.stat-status');
        if (riskScore < 30) {
            riskStatus.textContent = 'Low Risk';
        } else if (riskScore < 70) {
            riskStatus.textContent = 'Medium Risk';
        } else {
            riskStatus.textContent = 'High Risk';
        }
        
        // Update alert status
        const alertStatus = alertCard.querySelector('.stat-status');
        if (criticalAlerts > 0) {
            alertStatus.textContent = 'Immediate Action Required';
        } else {
            alertStatus.textContent = 'All Systems Normal';
        }
        
        // Update crowd capacity
        const crowdStatus = crowdCard.querySelector('.stat-status');
        const capacity = Math.min(100, Math.floor((crowdCount / 2000) * 100));
        crowdStatus.textContent = `${capacity}% Capacity`;
        
        // Update route status
        const routeStatus = routeCard.querySelector('.stat-status');
        if (openRoutes >= 3) {
            routeStatus.textContent = 'Traffic Flow Normal';
        } else if (openRoutes >= 1) {
            routeStatus.textContent = 'Moderate Congestion';
        } else {
            routeStatus.textContent = 'Heavy Traffic';
        }
    }

    displayImageResults(result) {
        this.analysisType.textContent = 'Image Analysis';
        this.imageAnalysis.style.display = 'block';
        this.videoAnalysis.style.display = 'none';

        // Update stats
        this.imageCount.textContent = result.analysis.estimated_count.toLocaleString();
        this.imageLevel.textContent = result.analysis.crowd_level;
        this.imageConfidence.textContent = `${(result.analysis.confidence * 100).toFixed(1)}%`;
        this.imageRegion.textContent = result.analysis.highest_density_region.replace('_', ' ').toUpperCase();

        // Update images
        this.heatmapImage.src = `data:image/png;base64,${result.images.heatmap}`;
        this.blendedImage.src = `data:image/jpeg;base64,${result.images.blended}`;
        this.analysisImage.src = `data:image/png;base64,${result.images.analysis}`;

        // Display road analysis
        this.displayRoadAnalysis(result.analysis.regions);
    }

    displayVideoResults(result) {
        this.analysisType.textContent = 'Video Analysis';
        this.imageAnalysis.style.display = 'none';
        this.videoAnalysis.style.display = 'block';

        // Update stats
        this.videoFrames.textContent = result.analysis.total_frames.toLocaleString();
        this.videoAverage.textContent = result.analysis.average_people_per_frame.toFixed(1);
        this.videoMax.textContent = result.analysis.max_people_in_frame.toLocaleString();

        // Update videos for playback
        this.blendedSource.src = result.videos.blended_video;
        this.heatmapSource.src = result.videos.heatmap_video;
        this.blendedVideo.load();
        this.heatmapVideo.load();

        // Update download links (use download route for actual downloads)
        const blendedFilename = result.videos.blended_video.split('/').pop();
        const heatmapFilename = result.videos.heatmap_video.split('/').pop();
        this.blendedDownload.href = `/download/${blendedFilename}`;
        this.heatmapDownload.href = `/download/${heatmapFilename}`;

        // Update final images
        this.finalHeatmapImage.src = `data:image/png;base64,${result.images.final_heatmap}`;
        this.finalAnalysisImage.src = `data:image/png;base64,${result.images.final_analysis}`;

        // Display road analysis
        this.displayRoadAnalysis(result.analysis.final_regions);
    }

    displayRoadAnalysis(regions) {
        this.roadAnalysis.style.display = 'block';
        this.roadStats.innerHTML = '';

        const roadRegions = ['left_side', 'center', 'right_side'];
        
        roadRegions.forEach(region => {
            if (regions[region]) {
                const stat = document.createElement('div');
                stat.className = 'road-stat';
                
                const level = regions[region].crowd_level;
                const density = regions[region].mean_density;
                
                stat.innerHTML = `
                    <h4>${region.replace('_', ' ').toUpperCase()}</h4>
                    <p><strong>Level:</strong> ${level}</p>
                    <p><strong>Density:</strong> ${density.toFixed(4)}</p>
                `;
                
                this.roadStats.appendChild(stat);
            }
        });
    }

    showLoading(text = 'Processing...') {
        this.loadingText.textContent = text;
        this.loadingOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    hideLoading() {
        this.loadingOverlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    showError(message) {
        // Create error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #DC3545;
            color: white;
            padding: 1rem 2rem;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 400px;
            animation: slideIn 0.3s ease;
        `;
        
        errorDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <i class="fas fa-exclamation-circle" style="font-size: 1.2rem;"></i>
                <span style="flex: 1;">${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; cursor: pointer; padding: 0.25rem; border-radius: 50%; transition: background 0.2s;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 5000);
    }

    showSuccess(message) {
        // Create success notification
        const successDiv = document.createElement('div');
        successDiv.className = 'success-notification';
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28A745;
            color: white;
            padding: 1rem 2rem;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 400px;
            animation: slideIn 0.3s ease;
        `;
        
        successDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <i class="fas fa-check-circle" style="font-size: 1.2rem;"></i>
                <span style="flex: 1;">${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; cursor: pointer; padding: 0.25rem; border-radius: 50%; transition: background 0.2s;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(successDiv);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (successDiv.parentElement) {
                successDiv.remove();
            }
        }, 3000);
    }
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .error-notification, .success-notification {
        font-family: 'Poppins', sans-serif;
    }
`;
document.head.appendChild(style);

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.trinetraApp = new TrinetraApp();
});

// Add some interactive effects
document.addEventListener('DOMContentLoaded', () => {
    // Add hover effects to stat cards
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Add click effects to download buttons
    const downloadBtns = document.querySelectorAll('.download-btn');
    downloadBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });
    });
});
