import React from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface CrowdRadarChartProps {
  regions: {
    left_side: { mean_density: number; crowd_level: string };
    center: { mean_density: number; crowd_level: string };
    right_side: { mean_density: number; crowd_level: string };
    top_half?: { mean_density: number; crowd_level: string };
    bottom_half?: { mean_density: number; crowd_level: string };
  };
  type: 'image' | 'video';
}

const CrowdRadarChart: React.FC<CrowdRadarChartProps> = ({ regions, type }) => {
  // Convert crowd levels to numeric values for radar chart
  const getCrowdLevelValue = (level: string): number => {
    switch (level.toLowerCase()) {
      case 'very low': return 1;
      case 'low': return 2;
      case 'medium': return 3;
      case 'high': return 4;
      case 'very high': return 5;
      case 'extremely high': return 6;
      default: return 1;
    }
  };

  // Prepare data for radar chart
  const labels = ['Left Side', 'Center', 'Right Side'];
  const densityValues = [
    regions.left_side.mean_density * 100, // Convert to percentage
    regions.center.mean_density * 100,
    regions.right_side.mean_density * 100,
  ];
  const crowdLevelValues = [
    getCrowdLevelValue(regions.left_side.crowd_level),
    getCrowdLevelValue(regions.center.crowd_level),
    getCrowdLevelValue(regions.right_side.crowd_level),
  ];

  const data = {
    labels,
    datasets: [
      {
        label: 'Density (%)',
        data: densityValues,
        backgroundColor: 'rgba(255, 107, 53, 0.2)',
        borderColor: 'rgba(255, 107, 53, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(255, 107, 53, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(255, 107, 53, 1)',
      },
      {
        label: 'Crowd Level',
        data: crowdLevelValues,
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(59, 130, 246, 1)',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#374151',
          font: {
            size: 12,
            weight: '500' as const,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 107, 53, 1)',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.r;
            
            if (label === 'Density (%)') {
              return `${label}: ${value.toFixed(1)}%`;
            } else if (label === 'Crowd Level') {
              const levelNames = ['', 'Very Low', 'Low', 'Medium', 'High', 'Very High', 'Extremely High'];
              return `${label}: ${levelNames[Math.round(value)] || 'Unknown'}`;
            }
            return `${label}: ${value}`;
          },
        },
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        min: 0,
        max: type === 'image' ? 100 : 6,
        ticks: {
          color: '#6B7280',
          font: {
            size: 10,
          },
          callback: function(value: any) {
            if (type === 'image') {
              return `${value}%`;
            } else {
              const levelNames = ['', 'Very Low', 'Low', 'Medium', 'High', 'Very High', 'Extremely High'];
              return levelNames[value] || value;
            }
          },
        },
        grid: {
          color: 'rgba(107, 114, 128, 0.2)',
        },
        angleLines: {
          color: 'rgba(107, 114, 128, 0.2)',
        },
        pointLabels: {
          color: '#374151',
          font: {
            size: 11,
            weight: '600' as const,
          },
        },
      },
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6,
      },
      line: {
        tension: 0.1,
      },
    },
  };

  return (
    <div className="w-full h-80 bg-white rounded-lg p-4 shadow-lg border border-gray-200">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">
          {type === 'image' ? 'Crowd Distribution Analysis' : 'Road Side Analysis'}
        </h3>
        <p className="text-sm text-gray-600">
          {type === 'image' 
            ? 'Density distribution across different regions' 
            : 'Crowd levels across road sections'
          }
        </p>
      </div>
      <div className="h-64">
        <Radar data={data} options={options} />
      </div>
    </div>
  );
};

export default CrowdRadarChart;

