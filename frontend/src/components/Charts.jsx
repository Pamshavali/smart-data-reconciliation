import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

export function MatchedDoughnutChart({ data }) {
  if (!data || !data.datasets) return null;

  const chartData = {
    labels: data.labels || ['Matched', 'Mismatched', 'Missing'],
    datasets: [{
      data: data.datasets[0].data,
      backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
      borderWidth: 2,
      borderColor: '#ffffff',
      hoverOffset: 4
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { font: { family: 'Inter', size: 12 }, boxWidth: 12, padding: 15 }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 10,
        cornerRadius: 6
      }
    },
    cutout: '70%'
  };

  return (
    <div className="h-64 relative">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}

export function SystemCountBarChart({ data }) {
  if (!data || !data.datasets) return null;

  const chartData = {
    labels: data.labels,
    datasets: [{
      label: 'Record Volume',
      data: data.datasets[0].data,
      backgroundColor: ['#2563eb', '#6366f1'],
      borderRadius: 6
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: '#0f172a' }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        ticks: { font: { family: 'Inter', size: 11 } }
      },
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Inter', size: 11 } }
      }
    }
  };

  return (
    <div className="h-64">
      <Bar data={chartData} options={options} />
    </div>
  );
}

export function OrgComparisonChart({ data }) {
  if (!data || !data.labels) return null;

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Matched Records',
        data: data.matched,
        backgroundColor: '#10b981',
        borderRadius: 4
      },
      {
        label: 'Discrepancies',
        data: data.mismatched,
        backgroundColor: '#ef4444',
        borderRadius: 4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { font: { family: 'Inter', size: 12 }, boxWidth: 12 }
      }
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
      x: { grid: { display: false } }
    }
  };

  return (
    <div className="h-64">
      <Bar data={chartData} options={options} />
    </div>
  );
}

export function LocationComparisonChart({ data }) {
  if (!data || !data.labels) return null;

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Matched',
        data: data.matched,
        backgroundColor: '#3b82f6',
        borderRadius: 4
      },
      {
        label: 'Mismatched / Missing',
        data: data.mismatched,
        backgroundColor: '#f97316',
        borderRadius: 4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { boxWidth: 12 } }
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
      x: { grid: { display: false } }
    }
  };

  return (
    <div className="h-64">
      <Bar data={chartData} options={options} />
    </div>
  );
}

export function MonthlyComparisonChart({ data }) {
  if (!data || !data.labels) return null;

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'System A Value ($)',
        data: data.system_a_values,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#2563eb'
      },
      {
        label: 'System B Value ($)',
        data: data.system_b_values,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#6366f1'
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { boxWidth: 12 } },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: $${Number(ctx.raw).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        ticks: {
          callback: (value) => `$${(value / 1000).toFixed(0)}k`
        }
      },
      x: { grid: { display: false } }
    }
  };

  return (
    <div className="h-64">
      <Line data={chartData} options={options} />
    </div>
  );
}

export function QualityDistributionChart({ data }) {
  if (!data || !data.labels) return null;

  const chartData = {
    labels: data.labels,
    datasets: [{
      label: 'Issues Found',
      data: data.counts,
      backgroundColor: [
        '#ef4444',
        '#f59e0b',
        '#f97316',
        '#dc2626',
        '#8b5cf6',
        '#eab308',
        '#64748b'
      ],
      borderRadius: 4
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
      x: {
        grid: { display: false },
        ticks: { maxRotation: 45, minRotation: 25, font: { size: 10 } }
      }
    }
  };

  return (
    <div className="h-64">
      <Bar data={chartData} options={options} />
    </div>
  );
}

