import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface DocumentCategoryChartProps {
  data?: {
    labels: string[];
    datasets: {
      data: number[];
      backgroundColor: string[];
      borderWidth: number;
      hoverOffset: number;
    }[];
  };
  options?: any;
}

export const DocumentCategoryChart: React.FC<DocumentCategoryChartProps> = ({ 
  data, 
  options 
}) => {
  const defaultData = {
    labels: ['Financial', 'Identity', 'Insurance', 'Medical', 'Legal', 'Personal'],
    datasets: [{
      data: [45, 32, 28, 24, 18, 39],
      backgroundColor: [
        '#10B981', // Financial - Green
        '#3B82F6', // Identity - Blue  
        '#F59E0B', // Insurance - Amber
        '#EF4444', // Medical - Red
        '#8B5CF6', // Legal - Purple
        '#6B7280'  // Personal - Gray
      ],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} documents (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <div className="h-64 w-full">
      <Pie 
        data={data || defaultData} 
        options={options || defaultOptions} 
      />
    </div>
  );
};