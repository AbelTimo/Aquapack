import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface WaterLevelChartProps {
  data: { date: string; depth: number }[];
  title?: string;
}

export function WaterLevelChart({ data, title = 'Water Level Trend' }: WaterLevelChartProps) {
  const chartData = {
    labels: data.map(d => d.date),
    datasets: [
      {
        label: 'Depth to Water (m)',
        data: data.map(d => d.depth),
        borderColor: 'rgb(6, 182, 212)',
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title,
      },
    },
    scales: {
      y: {
        reverse: true,
        title: {
          display: true,
          text: 'Depth (m)',
        },
      },
    },
  };

  return <Line data={chartData} options={options} />;
}

interface QAStatusChartProps {
  approved: number;
  pending: number;
  flagged: number;
  rejected?: number;
}

export function QAStatusChart({ approved, pending, flagged, rejected = 0 }: QAStatusChartProps) {
  const chartData = {
    labels: ['Approved', 'Pending', 'Flagged', 'Rejected'],
    datasets: [
      {
        data: [approved, pending, flagged, rejected],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(107, 114, 128, 0.8)',
        ],
        borderColor: [
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
          'rgb(107, 114, 128)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: 'QA Status Distribution',
      },
    },
  };

  return <Doughnut data={chartData} options={options} />;
}

interface DataCollectionChartProps {
  data: {
    label: string;
    sites: number;
    boreholes: number;
    waterLevels: number;
  }[];
}

export function DataCollectionChart({ data }: DataCollectionChartProps) {
  const chartData = {
    labels: data.map(d => d.label),
    datasets: [
      {
        label: 'Sites',
        data: data.map(d => d.sites),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
      },
      {
        label: 'Boreholes',
        data: data.map(d => d.boreholes),
        backgroundColor: 'rgba(6, 182, 212, 0.8)',
      },
      {
        label: 'Water Levels',
        data: data.map(d => d.waterLevels),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Data Collection Progress',
      },
    },
    scales: {
      x: {
        stacked: false,
      },
      y: {
        stacked: false,
      },
    },
  };

  return <Bar data={chartData} options={options} />;
}

interface WaterQualityChartProps {
  data: {
    parameter: string;
    value: number;
    unit: string;
    limit?: number;
  }[];
}

export function WaterQualityChart({ data }: WaterQualityChartProps) {
  const chartData = {
    labels: data.map(d => `${d.parameter} (${d.unit})`),
    datasets: [
      {
        label: 'Measured Value',
        data: data.map(d => d.value),
        backgroundColor: data.map(d =>
          d.limit && d.value > d.limit
            ? 'rgba(239, 68, 68, 0.8)'
            : 'rgba(6, 182, 212, 0.8)'
        ),
        borderColor: data.map(d =>
          d.limit && d.value > d.limit
            ? 'rgb(239, 68, 68)'
            : 'rgb(6, 182, 212)'
        ),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Water Quality Parameters',
      },
    },
  };

  return <Bar data={chartData} options={options} />;
}

interface BoreholeStatusChartProps {
  drilling: number;
  completed: number;
  operational: number;
  abandoned: number;
}

export function BoreholeStatusChart({ drilling, completed, operational, abandoned }: BoreholeStatusChartProps) {
  const chartData = {
    labels: ['Drilling', 'Completed', 'Operational', 'Abandoned'],
    datasets: [
      {
        data: [drilling, completed, operational, abandoned],
        backgroundColor: [
          'rgba(245, 158, 11, 0.8)',   // yellow for drilling
          'rgba(59, 130, 246, 0.8)',   // blue for completed
          'rgba(16, 185, 129, 0.8)',   // green for operational
          'rgba(239, 68, 68, 0.8)',    // red for abandoned
        ],
        borderColor: [
          'rgb(245, 158, 11)',
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: 'Borehole Status Distribution',
      },
    },
  };

  return <Doughnut data={chartData} options={options} />;
}
