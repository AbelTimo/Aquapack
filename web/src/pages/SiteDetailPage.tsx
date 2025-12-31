import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sitesApi } from '@/services/api';
import Map from '@/components/Map';
import { WaterLevelChart, WaterQualityChart } from '@/components/Charts';

// Simple date formatting helper
const formatDate = (date: string | Date, style: 'short' | 'medium' | 'long' = 'medium') => {
  const d = new Date(date);
  if (style === 'short') {
    return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
  }
  if (style === 'long') {
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  return d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
};

const formatDateForExport = (date: string | Date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

export default function SiteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [reviewComment, setReviewComment] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'boreholes' | 'measurements' | 'quality'>('details');
  const queryClient = useQueryClient();

  const { data: siteResponse, isLoading } = useQuery({
    queryKey: ['site', id],
    queryFn: () => sitesApi.getById(id!),
    enabled: !!id,
  });

  const reviewMutation = useMutation({
    mutationFn: ({ status, comment }: { status: string; comment?: string }) =>
      sitesApi.review(id!, status, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', id] });
      setReviewComment('');
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aqua-600"></div>
      </div>
    );
  }

  const siteData = siteResponse?.data?.site;
  const boreholes = siteResponse?.data?.boreholes || [];
  const waterLevels = siteResponse?.data?.waterLevels || [];
  const pumpTests = siteResponse?.data?.pumpTests || [];
  const waterQuality = siteResponse?.data?.waterQuality || [];

  if (!siteData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-medium text-gray-900">Site not found</h2>
        <Link to="/sites" className="mt-4 btn-primary">
          Back to Sites
        </Link>
      </div>
    );
  }

  // Prepare chart data
  const waterLevelChartData = waterLevels
    .sort((a: any, b: any) => new Date(a.measurementDatetime).getTime() - new Date(b.measurementDatetime).getTime())
    .map((wl: any) => ({
      date: formatDate(wl.measurementDatetime, 'short'),
      depth: wl.depthToWater,
    }));

  const latestWQ = waterQuality[0];
  const waterQualityChartData = latestWQ ? [
    { parameter: 'pH', value: latestWQ.ph || 0, unit: '', limit: 8.5 },
    { parameter: 'EC', value: latestWQ.electricalConductivity || 0, unit: 'µS/cm', limit: 1500 },
    { parameter: 'TDS', value: latestWQ.totalDissolvedSolids || 0, unit: 'mg/L', limit: 1000 },
    { parameter: 'Turbidity', value: latestWQ.turbidity || 0, unit: 'NTU', limit: 5 },
  ] : [];

  const mapMarker = [{
    id: siteData.id,
    lat: siteData.latitude,
    lng: siteData.longitude,
    title: siteData.name,
    status: siteData.qaStatus,
  }];

  const exportCSV = () => {
    const headers = ['Date', 'Depth to Water (m)', 'Method', 'Type'];
    const rows = waterLevels.map((wl: any) => [
      formatDateForExport(wl.measurementDatetime),
      wl.depthToWater,
      wl.measurementMethod,
      wl.measurementType,
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${siteData.code}-water-levels.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Link to="/sites" className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{siteData.name}</h1>
            <span className={`badge badge-${siteData.qaStatus.toLowerCase()}`}>
              {siteData.qaStatus}
            </span>
            <span className={`badge ${siteData.syncStatus === 'SYNCED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {siteData.syncStatus}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {siteData.code} • {siteData.project?.name || 'No project'}
          </p>
        </div>
        <div className="flex space-x-2">
          <button onClick={exportCSV} className="btn-secondary">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="card text-center bg-blue-50 border-0">
              <p className="text-2xl font-bold text-blue-700">{boreholes.length}</p>
              <p className="text-sm text-blue-600">Boreholes</p>
            </div>
            <div className="card text-center bg-cyan-50 border-0">
              <p className="text-2xl font-bold text-cyan-700">{waterLevels.length}</p>
              <p className="text-sm text-cyan-600">Water Levels</p>
            </div>
            <div className="card text-center bg-purple-50 border-0">
              <p className="text-2xl font-bold text-purple-700">{pumpTests.length}</p>
              <p className="text-sm text-purple-600">Pump Tests</p>
            </div>
            <div className="card text-center bg-green-50 border-0">
              <p className="text-2xl font-bold text-green-700">{waterQuality.length}</p>
              <p className="text-sm text-green-600">WQ Samples</p>
            </div>
          </div>

          {/* Map */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Location</h3>
            <Map markers={mapMarker} zoom={14} height="250px" />
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="font-mono text-gray-600">
                {siteData.latitude.toFixed(6)}, {siteData.longitude.toFixed(6)}
              </span>
              {siteData.accuracy && (
                <span className="text-gray-500">Accuracy: {siteData.accuracy.toFixed(1)} m</span>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="card">
            <div className="border-b border-gray-200 mb-4">
              <nav className="-mb-px flex space-x-6">
                {[
                  { id: 'details', label: 'Details' },
                  { id: 'boreholes', label: `Boreholes (${boreholes.length})` },
                  { id: 'measurements', label: `Measurements (${waterLevels.length})` },
                  { id: 'quality', label: `Water Quality (${waterQuality.length})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-2 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-aqua-500 text-aqua-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {activeTab === 'details' && (
              <div className="space-y-4">
                <dl className="grid grid-cols-2 gap-4">
                  <DetailItem label="Site Type" value={siteData.siteType || 'Not specified'} />
                  <DetailItem label="Altitude" value={siteData.altitude ? `${siteData.altitude} m` : 'N/A'} />
                  <DetailItem label="Created By" value={siteData.creator?.name || 'Unknown'} />
                  <DetailItem label="Created At" value={formatDate(siteData.createdAt, 'long')} />
                </dl>
                {siteData.description && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                    <dd className="mt-1 text-sm text-gray-900">{siteData.description}</dd>
                  </div>
                )}
                {siteData.accessNotes && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Access Notes</dt>
                    <dd className="mt-1 text-sm text-gray-900">{siteData.accessNotes}</dd>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'boreholes' && (
              <div className="space-y-3">
                {boreholes.length > 0 ? (
                  boreholes.map((bh: any) => (
                    <div key={bh.id} className="p-4 border border-gray-200 rounded-lg hover:border-aqua-300">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">{bh.name}</h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {bh.wellType} • {bh.totalDepth} {bh.depthUnit} deep
                          </p>
                        </div>
                        <span className={`badge badge-${bh.qaStatus?.toLowerCase() || 'pending'}`}>
                          {bh.qaStatus || 'PENDING'}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Drilling Method:</span>
                          <span className="ml-1 text-gray-900">{bh.drillingMethod || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Diameter:</span>
                          <span className="ml-1 text-gray-900">{bh.diameter ? `${bh.diameter} mm` : 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">SWL:</span>
                          <span className="ml-1 text-gray-900">{bh.staticWaterLevel ? `${bh.staticWaterLevel} m` : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">No boreholes recorded</p>
                )}
              </div>
            )}

            {activeTab === 'measurements' && (
              <div className="space-y-4">
                {waterLevelChartData.length > 0 && (
                  <div className="h-64">
                    <WaterLevelChart data={waterLevelChartData} />
                  </div>
                )}
                {waterLevels.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Date/Time</th>
                          <th>Depth to Water</th>
                          <th>Method</th>
                          <th>Type</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {waterLevels.map((wl: any) => (
                          <tr key={wl.id} className="hover:bg-gray-50">
                            <td className="text-sm">{formatDate(wl.measurementDatetime)}</td>
                            <td className="text-sm font-medium">{wl.depthToWater} {wl.depthUnit}</td>
                            <td className="text-sm text-gray-500">{wl.measurementMethod}</td>
                            <td className="text-sm text-gray-500">{wl.measurementType}</td>
                            <td>
                              <span className={`badge badge-${wl.qaStatus?.toLowerCase() || 'pending'}`}>
                                {wl.qaStatus || 'PENDING'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No water level measurements recorded</p>
                )}
              </div>
            )}

            {activeTab === 'quality' && (
              <div className="space-y-4">
                {waterQualityChartData.length > 0 && (
                  <div className="h-64">
                    <WaterQualityChart data={waterQualityChartData} />
                  </div>
                )}
                {waterQuality.length > 0 ? (
                  <div className="space-y-3">
                    {waterQuality.map((wq: any) => (
                      <div key={wq.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-medium">{wq.sampleId || 'Sample'}</span>
                          <span className="text-sm text-gray-500">
                            {formatDate(wq.sampleDatetime)}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <ParamDisplay label="Temp" value={wq.temperature} unit="°C" />
                          <ParamDisplay label="pH" value={wq.ph} />
                          <ParamDisplay label="EC" value={wq.electricalConductivity} unit="µS/cm" />
                          <ParamDisplay label="TDS" value={wq.totalDissolvedSolids} unit="mg/L" />
                          <ParamDisplay label="DO" value={wq.dissolvedOxygen} unit="mg/L" />
                          <ParamDisplay label="Turbidity" value={wq.turbidity} unit="NTU" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No water quality samples recorded</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Review Panel */}
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">QA Review</h2>
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Current Status</p>
                <p className="text-lg font-medium mt-1">
                  <span className={`badge badge-${siteData.qaStatus.toLowerCase()}`}>
                    {siteData.qaStatus}
                  </span>
                </p>
              </div>

              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Add review notes (required for flagging)..."
                rows={3}
                className="input"
              />

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => reviewMutation.mutate({ status: 'APPROVED', comment: reviewComment })}
                  disabled={reviewMutation.isPending}
                  className="btn-success"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Approve
                </button>
                <button
                  onClick={() => reviewMutation.mutate({ status: 'FLAGGED', comment: reviewComment })}
                  disabled={reviewMutation.isPending || !reviewComment}
                  className="btn-secondary text-yellow-700 border-yellow-300 hover:bg-yellow-50"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                  </svg>
                  Flag
                </button>
              </div>
              <button
                onClick={() => reviewMutation.mutate({ status: 'REJECTED', comment: reviewComment })}
                disabled={reviewMutation.isPending || !reviewComment}
                className="btn-secondary w-full text-red-700 border-red-300 hover:bg-red-50"
              >
                Reject
              </button>
            </div>
          </div>

          {/* Pump Tests Summary */}
          {pumpTests.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Pump Tests</h2>
              <div className="space-y-3">
                {pumpTests.map((pt: any) => (
                  <div key={pt.id} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex justify-between">
                      <span className="font-medium text-sm">{pt.testName || pt.testType}</span>
                      <span className={`badge badge-${pt.qaStatus?.toLowerCase() || 'pending'}`}>
                        {pt.qaStatus || 'PENDING'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(pt.startDatetime)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value}</dd>
    </div>
  );
}

function ParamDisplay({ label, value, unit = '' }: { label: string; value?: number; unit?: string }) {
  return (
    <div>
      <span className="text-gray-500">{label}:</span>
      <span className="ml-1 font-medium">{value !== undefined ? `${value}${unit ? ` ${unit}` : ''}` : 'N/A'}</span>
    </div>
  );
}
