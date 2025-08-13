import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface RemindersTimelineChartProps {
  data?: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      tension: number;
      fill: boolean;
      pointBackgroundColor: string;
      pointBorderColor: string;
      pointBorderWidth: number;
      pointRadius: number;
      pointHoverRadius: number;
    }[];
  };
  options?: any;
}

export const RemindersTimelineChart: React.FC<RemindersTimelineChartProps> = ({ 
  data, 
  options 
}) => {
  const defaultData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Upcoming Reminders',
      data: [3, 7, 12, 8, 5, 9],
      borderColor: '#7C3AED',
      backgroundColor: 'rgba(124, 58, 237, 0.1)',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#7C3AED',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 6,
      pointHoverRadius: 8
    }]
  };

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.parsed.y} reminders in ${context.label}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          stepSize: 2
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    elements: {
      point: {
        hoverRadius: 8
      }
    }
  };

  return (
    <div className="h-48 w-full">
      <Line 
        data={data || defaultData} 
        options={options || defaultOptions} 
      />
    </div>
  );
};