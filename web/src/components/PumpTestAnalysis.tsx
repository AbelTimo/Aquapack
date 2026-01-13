import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ReferenceLine,
} from 'recharts';

interface PumpTestEntry {
  id: string;
  elapsedMinutes: number;
  waterLevel: number;
  dischargeRate?: number;
  remarks?: string;
}

interface PumpTest {
  id: string;
  testType: 'STEP' | 'CONSTANT_RATE' | 'RECOVERY';
  startDatetime: string;
  endDatetime?: string;
  staticWaterLevel: number;
  finalWaterLevel?: number;
  averageDischargeRate?: number;
  totalDuration?: number;
  entries: PumpTestEntry[];
  notes?: string;
}

interface PumpTestAnalysisProps {
  pumpTests: PumpTest[];
  depthUnit?: string;
  dischargeUnit?: string;
}

export default function PumpTestAnalysis({
  pumpTests,
  depthUnit = 'm',
  dischargeUnit = 'L/s',
}: PumpTestAnalysisProps) {
  const [selectedTest, setSelectedTest] = useState<PumpTest | null>(
    pumpTests.length > 0 ? pumpTests[0] : null
  );
  const [chartType, setChartType] = useState<'drawdown' | 'semilog' | 'recovery'>('drawdown');

  // Calculate drawdown data
  const drawdownData = useMemo(() => {
    if (!selectedTest) return [];
    return selectedTest.entries.map((entry) => ({
      time: entry.elapsedMinutes,
      waterLevel: entry.waterLevel,
      drawdown: entry.waterLevel - selectedTest.staticWaterLevel,
      dischargeRate: entry.dischargeRate,
      logTime: entry.elapsedMinutes > 0 ? Math.log10(entry.elapsedMinutes) : 0,
    }));
  }, [selectedTest]);

  // Calculate recovery data (for Cooper-Jacob analysis)
  const recoveryData = useMemo(() => {
    if (!selectedTest || selectedTest.testType !== 'RECOVERY') return [];
    const pumpingDuration = selectedTest.totalDuration || 60;
    return selectedTest.entries.map((entry) => {
      const t = pumpingDuration + entry.elapsedMinutes;
      const tPrime = entry.elapsedMinutes;
      return {
        time: entry.elapsedMinutes,
        residualDrawdown: entry.waterLevel - selectedTest.staticWaterLevel,
        tRatio: tPrime > 0 ? t / tPrime : 0,
        logTRatio: tPrime > 0 ? Math.log10(t / tPrime) : 0,
      };
    });
  }, [selectedTest]);

  // Calculate specific capacity
  const specificCapacity = useMemo(() => {
    if (!selectedTest || !selectedTest.averageDischargeRate) return null;
    const maxDrawdown = Math.max(...drawdownData.map((d) => d.drawdown));
    if (maxDrawdown <= 0) return null;
    return selectedTest.averageDischargeRate / maxDrawdown;
  }, [selectedTest, drawdownData]);

  // Calculate transmissivity estimate (simplified Cooper-Jacob)
  const transmissivityEstimate = useMemo(() => {
    if (!selectedTest || drawdownData.length < 10) return null;
    // Find slope of semi-log plot (change in drawdown per log cycle)
    const midPoint = Math.floor(drawdownData.length / 2);
    const earlyData = drawdownData.slice(0, midPoint);
    const lateData = drawdownData.slice(midPoint);

    if (earlyData.length === 0 || lateData.length === 0) return null;

    const avgEarlyDrawdown = earlyData.reduce((sum, d) => sum + d.drawdown, 0) / earlyData.length;
    const avgLateDrawdown = lateData.reduce((sum, d) => sum + d.drawdown, 0) / lateData.length;
    const deltaS = avgLateDrawdown - avgEarlyDrawdown;

    if (deltaS <= 0 || !selectedTest.averageDischargeRate) return null;

    // T = 2.3Q / (4π * ΔS) - simplified estimate
    const Q = selectedTest.averageDischargeRate * 0.001; // Convert L/s to m³/s
    const T = (2.3 * Q) / (4 * Math.PI * deltaS);
    return T * 86400; // Convert to m²/day
  }, [selectedTest, drawdownData]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTestTypeLabel = (type: string) => {
    switch (type) {
      case 'STEP': return 'Step Drawdown Test';
      case 'CONSTANT_RATE': return 'Constant Rate Test';
      case 'RECOVERY': return 'Recovery Test';
      default: return type;
    }
  };

  const getTestTypeColor = (type: string) => {
    switch (type) {
      case 'STEP': return 'bg-violet-100 text-violet-700';
      case 'CONSTANT_RATE': return 'bg-aqua-100 text-aqua-700';
      case 'RECOVERY': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (pumpTests.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="font-semibold text-gray-900">No Pump Tests</h3>
        <p className="text-gray-500 mt-1">Pump test data will appear here once recorded.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Test Selector */}
      <div className="flex flex-wrap gap-3">
        {pumpTests.map((test) => (
          <button
            key={test.id}
            onClick={() => setSelectedTest(test)}
            className={`px-4 py-3 rounded-xl border-2 transition-all text-left ${
              selectedTest?.id === test.id
                ? 'border-aqua-500 bg-aqua-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getTestTypeColor(test.testType)}`}>
                {test.testType.replace('_', ' ')}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-900">{formatDate(test.startDatetime)}</p>
            <p className="text-xs text-gray-500">{test.entries.length} readings</p>
          </button>
        ))}
      </div>

      {selectedTest && (
        <>
          {/* Test Summary */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {getTestTypeLabel(selectedTest.testType)}
              </h3>
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${getTestTypeColor(selectedTest.testType)}`}>
                {selectedTest.testType.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Static WL</p>
                <p className="text-xl font-bold text-gray-900">
                  {selectedTest.staticWaterLevel.toFixed(2)} <span className="text-sm font-normal">{depthUnit}</span>
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Final WL</p>
                <p className="text-xl font-bold text-gray-900">
                  {selectedTest.finalWaterLevel?.toFixed(2) || '--'} <span className="text-sm font-normal">{depthUnit}</span>
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Avg. Discharge</p>
                <p className="text-xl font-bold text-gray-900">
                  {selectedTest.averageDischargeRate?.toFixed(2) || '--'} <span className="text-sm font-normal">{dischargeUnit}</span>
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Duration</p>
                <p className="text-xl font-bold text-gray-900">
                  {selectedTest.totalDuration || '--'} <span className="text-sm font-normal">min</span>
                </p>
              </div>
            </div>

            {/* Calculated Parameters */}
            {(specificCapacity || transmissivityEstimate) && (
              <div className="border-t border-gray-100 pt-4 mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Calculated Parameters</h4>
                <div className="grid grid-cols-2 gap-4">
                  {specificCapacity && (
                    <div className="bg-aqua-50 rounded-xl p-4">
                      <p className="text-xs text-aqua-600 uppercase tracking-wider">Specific Capacity</p>
                      <p className="text-xl font-bold text-aqua-900">
                        {specificCapacity.toFixed(3)} <span className="text-sm font-normal">{dischargeUnit}/{depthUnit}</span>
                      </p>
                    </div>
                  )}
                  {transmissivityEstimate && (
                    <div className="bg-emerald-50 rounded-xl p-4">
                      <p className="text-xs text-emerald-600 uppercase tracking-wider">Transmissivity (est.)</p>
                      <p className="text-xl font-bold text-emerald-900">
                        {transmissivityEstimate.toFixed(1)} <span className="text-sm font-normal">m²/day</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Chart Type Selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setChartType('drawdown')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                chartType === 'drawdown'
                  ? 'bg-aqua-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Drawdown vs Time
            </button>
            <button
              onClick={() => setChartType('semilog')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                chartType === 'semilog'
                  ? 'bg-aqua-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Semi-Log Plot
            </button>
            {selectedTest.testType === 'RECOVERY' && (
              <button
                onClick={() => setChartType('recovery')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  chartType === 'recovery'
                    ? 'bg-aqua-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Recovery Analysis
              </button>
            )}
          </div>

          {/* Charts */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h4 className="text-sm font-medium text-gray-700 mb-4">
              {chartType === 'drawdown' && 'Drawdown vs Time'}
              {chartType === 'semilog' && 'Semi-Log Plot (Cooper-Jacob)'}
              {chartType === 'recovery' && 'Recovery Analysis'}
            </h4>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'drawdown' ? (
                  <LineChart data={drawdownData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="time"
                      label={{ value: 'Time (min)', position: 'insideBottom', offset: -5 }}
                      stroke="#6b7280"
                    />
                    <YAxis
                      reversed
                      label={{ value: `Drawdown (${depthUnit})`, angle: -90, position: 'insideLeft' }}
                      stroke="#6b7280"
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: any) => value !== undefined ? [Number(value).toFixed(2), 'Drawdown'] : ['', 'Drawdown']}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="drawdown"
                      stroke="#0891b2"
                      strokeWidth={2}
                      dot={{ fill: '#0891b2', strokeWidth: 0, r: 4 }}
                      name={`Drawdown (${depthUnit})`}
                    />
                    {selectedTest.testType === 'STEP' && (
                      <Line
                        type="stepAfter"
                        dataKey="dischargeRate"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        name={`Discharge (${dischargeUnit})`}
                        yAxisId="right"
                      />
                    )}
                  </LineChart>
                ) : chartType === 'semilog' ? (
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="logTime"
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      label={{ value: 'log₁₀(Time)', position: 'insideBottom', offset: -5 }}
                      stroke="#6b7280"
                    />
                    <YAxis
                      reversed
                      dataKey="drawdown"
                      label={{ value: `Drawdown (${depthUnit})`, angle: -90, position: 'insideLeft' }}
                      stroke="#6b7280"
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: any, name: any) => value !== undefined ? [Number(value).toFixed(3), name] : ['', name]}
                    />
                    <Scatter
                      data={drawdownData.filter(d => d.time > 0)}
                      fill="#0891b2"
                      name="Drawdown"
                    />
                  </ScatterChart>
                ) : (
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="logTRatio"
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      label={{ value: 'log₁₀(t/t\')', position: 'insideBottom', offset: -5 }}
                      stroke="#6b7280"
                    />
                    <YAxis
                      reversed
                      dataKey="residualDrawdown"
                      label={{ value: `Residual Drawdown (${depthUnit})`, angle: -90, position: 'insideLeft' }}
                      stroke="#6b7280"
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <ReferenceLine y={0} stroke="#10b981" strokeDasharray="5 5" />
                    <Scatter
                      data={recoveryData.filter(d => d.tRatio > 1)}
                      fill="#10b981"
                      name="Residual Drawdown"
                    />
                  </ScatterChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h4 className="font-medium text-gray-900">Test Data ({selectedTest.entries.length} readings)</h4>
            </div>
            <div className="overflow-x-auto max-h-64">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time (min)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Water Level ({depthUnit})</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Drawdown ({depthUnit})</th>
                    {selectedTest.testType === 'STEP' && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discharge ({dischargeUnit})</th>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedTest.entries.map((entry, idx) => (
                    <tr key={entry.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-2 font-mono">{entry.elapsedMinutes}</td>
                      <td className="px-4 py-2 font-mono">{entry.waterLevel.toFixed(2)}</td>
                      <td className="px-4 py-2 font-mono text-aqua-600">
                        {(entry.waterLevel - selectedTest.staticWaterLevel).toFixed(2)}
                      </td>
                      {selectedTest.testType === 'STEP' && (
                        <td className="px-4 py-2 font-mono">{entry.dischargeRate?.toFixed(2) || '--'}</td>
                      )}
                      <td className="px-4 py-2 text-gray-500">{entry.remarks || '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Export Button */}
          <div className="flex justify-end">
            <button
              onClick={() => {
                const headers = ['Time (min)', `Water Level (${depthUnit})`, `Drawdown (${depthUnit})`, 'Discharge Rate', 'Remarks'];
                const rows = selectedTest.entries.map(e => [
                  e.elapsedMinutes,
                  e.waterLevel.toFixed(2),
                  (e.waterLevel - selectedTest.staticWaterLevel).toFixed(2),
                  e.dischargeRate?.toFixed(2) || '',
                  e.remarks || '',
                ]);
                const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `pump-test-${selectedTest.id}.csv`;
                a.click();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          </div>
        </>
      )}
    </div>
  );
}
