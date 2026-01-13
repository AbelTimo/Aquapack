import { useState, useMemo } from 'react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';

interface WaterLevel {
  id: string;
  measurementDatetime: string;
  depthToWater: number;
  measurementMethod?: string;
  measuredBy?: string;
  notes?: string;
}

interface WaterLevelTrendsProps {
  waterLevels: WaterLevel[];
  staticWaterLevel?: number;
  depthUnit?: string;
  siteName?: string;
}

export default function WaterLevelTrends({
  waterLevels,
  staticWaterLevel,
  depthUnit = 'm',
  siteName,
}: WaterLevelTrendsProps) {
  const [timeRange, setTimeRange] = useState<'all' | '7d' | '30d' | '90d' | '1y'>('all');
  const [showStatistics, setShowStatistics] = useState(true);

  // Sort and filter data by time range
  const chartData = useMemo(() => {
    const sorted = [...waterLevels].sort(
      (a, b) => new Date(a.measurementDatetime).getTime() - new Date(b.measurementDatetime).getTime()
    );

    const now = new Date();
    const filtered = sorted.filter((wl) => {
      if (timeRange === 'all') return true;
      const date = new Date(wl.measurementDatetime);
      const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
      switch (timeRange) {
        case '7d': return diffDays <= 7;
        case '30d': return diffDays <= 30;
        case '90d': return diffDays <= 90;
        case '1y': return diffDays <= 365;
        default: return true;
      }
    });

    return filtered.map((wl) => ({
      ...wl,
      date: new Date(wl.measurementDatetime).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: timeRange === 'all' || timeRange === '1y' ? '2-digit' : undefined,
      }),
      fullDate: new Date(wl.measurementDatetime).toLocaleString(),
      timestamp: new Date(wl.measurementDatetime).getTime(),
    }));
  }, [waterLevels, timeRange]);

  // Calculate statistics
  const statistics = useMemo(() => {
    if (chartData.length === 0) return null;

    const depths = chartData.map((d) => d.depthToWater);
    const min = Math.min(...depths);
    const max = Math.max(...depths);
    const avg = depths.reduce((sum, d) => sum + d, 0) / depths.length;
    const latest = depths[depths.length - 1];

    // Calculate trend (simple linear regression)
    const n = chartData.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    chartData.forEach((d, i) => {
      sumX += i;
      sumY += d.depthToWater;
      sumXY += i * d.depthToWater;
      sumX2 += i * i;
    });
    const slope = n > 1 ? (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) : 0;
    const trend = slope > 0.01 ? 'rising' : slope < -0.01 ? 'falling' : 'stable';

    // Calculate seasonal variation (standard deviation)
    const variance = depths.reduce((sum, d) => sum + Math.pow(d - avg, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    return { min, max, avg, latest, trend, slope, stdDev, count: n };
  }, [chartData]);

  const formatTooltipDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising':
        return (
          <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'falling':
        return (
          <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
        );
    }
  };

  if (waterLevels.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        </div>
        <h3 className="font-semibold text-gray-900">No Water Level Data</h3>
        <p className="text-gray-500 mt-1">Water level measurements will appear here once recorded.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Water Level Trends</h3>
          {siteName && <p className="text-sm text-gray-500">{siteName}</p>}
        </div>

        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['7d', '30d', '90d', '1y', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  timeRange === range
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {range === 'all' ? 'All' : range}
              </button>
            ))}
          </div>

          {/* Statistics Toggle */}
          <button
            onClick={() => setShowStatistics(!showStatistics)}
            className={`p-2 rounded-lg transition-colors ${
              showStatistics ? 'bg-aqua-100 text-aqua-600' : 'bg-gray-100 text-gray-600'
            }`}
            title="Toggle Statistics"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {showStatistics && statistics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Latest</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {statistics.latest.toFixed(2)} <span className="text-sm font-normal">{depthUnit}</span>
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Average</p>
            <p className="text-2xl font-bold text-aqua-600 mt-1">
              {statistics.avg.toFixed(2)} <span className="text-sm font-normal">{depthUnit}</span>
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Min / Max</p>
            <p className="text-lg font-bold text-gray-900 mt-1">
              {statistics.min.toFixed(2)} - {statistics.max.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Variation (σ)</p>
            <p className="text-2xl font-bold text-violet-600 mt-1">
              ±{statistics.stdDev.toFixed(2)} <span className="text-sm font-normal">{depthUnit}</span>
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Trend</p>
              {getTrendIcon(statistics.trend)}
            </div>
            <p className="text-lg font-bold capitalize mt-1">
              {statistics.trend}
              <span className="text-sm font-normal text-gray-500 ml-1">
                ({statistics.slope > 0 ? '+' : ''}{(statistics.slope * 100).toFixed(2)} {depthUnit}/reading)
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Main Chart */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="waterLevelGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0891b2" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis
                reversed
                stroke="#6b7280"
                tick={{ fontSize: 12 }}
                label={{
                  value: `Depth to Water (${depthUnit})`,
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 12 },
                }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                labelFormatter={(_, payload: any) => {
                  if (payload && payload[0]?.payload?.timestamp) {
                    return formatTooltipDate(payload[0].payload.timestamp);
                  }
                  return '';
                }}
                formatter={(value: any) => value !== undefined ? [`${Number(value).toFixed(2)} ${depthUnit}`, 'Depth to Water'] : ['', 'Depth to Water']}
              />
              <Legend />

              {/* Static water level reference */}
              {staticWaterLevel && (
                <ReferenceLine
                  y={staticWaterLevel}
                  stroke="#10b981"
                  strokeDasharray="5 5"
                  label={{
                    value: `Static WL: ${staticWaterLevel} ${depthUnit}`,
                    position: 'right',
                    fill: '#10b981',
                    fontSize: 11,
                  }}
                />
              )}

              {/* Average reference */}
              {statistics && (
                <ReferenceLine
                  y={statistics.avg}
                  stroke="#8b5cf6"
                  strokeDasharray="3 3"
                  label={{
                    value: `Avg: ${statistics.avg.toFixed(2)} ${depthUnit}`,
                    position: 'left',
                    fill: '#8b5cf6',
                    fontSize: 11,
                  }}
                />
              )}

              <Area
                type="monotone"
                dataKey="depthToWater"
                stroke="none"
                fill="url(#waterLevelGradient)"
                name="Water Level"
              />
              <Line
                type="monotone"
                dataKey="depthToWater"
                stroke="#0891b2"
                strokeWidth={2}
                dot={{ fill: '#0891b2', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 6, fill: '#0891b2' }}
                name={`Water Level (${depthUnit})`}
              />

              {chartData.length > 20 && (
                <Brush
                  dataKey="date"
                  height={30}
                  stroke="#0891b2"
                  fill="#f0fdfa"
                  tickFormatter={() => ''}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h4 className="font-medium text-gray-900">
            Measurement History ({chartData.length} readings)
          </h4>
          <button
            onClick={() => {
              const headers = ['Date', `Depth to Water (${depthUnit})`, 'Method', 'Measured By', 'Notes'];
              const rows = chartData.map((wl) => [
                new Date(wl.measurementDatetime).toISOString(),
                wl.depthToWater.toFixed(2),
                wl.measurementMethod || '',
                wl.measuredBy || '',
                wl.notes || '',
              ]);
              const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `water-levels-${siteName || 'export'}.csv`;
              a.click();
            }}
            className="text-sm text-aqua-600 hover:text-aqua-700 font-medium"
          >
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto max-h-64">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Depth ({depthUnit})</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Measured By</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[...chartData].reverse().map((wl, idx) => (
                <tr key={wl.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 text-gray-900">{wl.fullDate}</td>
                  <td className="px-4 py-2 font-mono font-medium text-aqua-600">{wl.depthToWater.toFixed(2)}</td>
                  <td className="px-4 py-2 text-gray-500">{wl.measurementMethod || '--'}</td>
                  <td className="px-4 py-2 text-gray-500">{wl.measuredBy || '--'}</td>
                  <td className="px-4 py-2 text-gray-500 max-w-xs truncate">{wl.notes || '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
