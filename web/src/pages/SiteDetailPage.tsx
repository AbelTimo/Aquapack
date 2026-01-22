import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sitesApi } from '@/services/api';
import Map from '@/components/Map';
import { WaterLevelChart, WaterQualityChart } from '@/components/Charts';
import BoreholeDesign from '@/components/BoreholeDesign';
import LabReportUpload from '@/components/LabReportUpload';
import PumpTestAnalysis from '@/components/PumpTestAnalysis';
import WaterLevelTrends from '@/components/WaterLevelTrends';
import { LabReport } from '@/types';
import { useUpdateBorehole } from '@/hooks/useBoreholes';

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
  const [activeTab, setActiveTab] = useState<'details' | 'boreholes' | 'measurements' | 'quality' | 'design' | 'analysis' | 'trends'>('details');
  const [showLabReportUpload, setShowLabReportUpload] = useState(false);
  const [labReports, setLabReports] = useState<LabReport[]>([]);
  const queryClient = useQueryClient();
  const { mutateAsync: updateBorehole } = useUpdateBorehole();

  const { data: siteResponse, isLoading } = useQuery({
    queryKey: ['site', id],
    queryFn: () => sitesApi.getById(id!),
    enabled: !!id,
  });

  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const reviewMutation = useMutation({
    mutationFn: ({ status, comment }: { status: string; comment?: string }) =>
      sitesApi.review(id!, status, comment),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['site', id] });
      setReviewComment('');
      setReviewSuccess(`Site ${variables.status.toLowerCase()} successfully`);
      setReviewError(null);
      setTimeout(() => setReviewSuccess(null), 3000);
    },
    onError: (error: any) => {
      setReviewError(error?.response?.data?.error?.message || 'Failed to update review status');
      setReviewSuccess(null);
      setTimeout(() => setReviewError(null), 5000);
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'FLAGGED': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'REJECTED': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'SYNCED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-12 h-12 border-4 border-aqua-200 border-t-aqua-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-gray-500">Loading site details...</p>
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
      <div className="text-center py-24">
        <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="mt-4 text-lg font-semibold text-gray-900">Site not found</h2>
        <p className="mt-2 text-sm text-gray-500">The site you're looking for doesn't exist or has been removed.</p>
        <Link to="/sites" className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-aqua-500 text-white rounded-lg hover:bg-aqua-600 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Sites
        </Link>
      </div>
    );
  }

  const waterLevelChartData = waterLevels
    .sort((a: any, b: any) => new Date(a.measurementDatetime).getTime() - new Date(b.measurementDatetime).getTime())
    .map((wl: any) => ({
      date: formatDate(wl.measurementDatetime, 'short'),
      depth: wl.depthToWater,
    }));

  const latestWQ = waterQuality[0];
  const waterQualityChartData = latestWQ ? [
    { parameter: 'pH', value: latestWQ.ph || 0, unit: '', limit: 8.5 },
    { parameter: 'EC', value: latestWQ.electricalConductivity || 0, unit: 'uS/cm', limit: 1500 },
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <Link
              to="/sites"
              className="mt-1 w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{siteData.name}</h1>
                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium border ${getStatusColor(siteData.qaStatus)}`}>
                  {siteData.qaStatus}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium border ${getStatusColor(siteData.syncStatus)}`}>
                  {siteData.syncStatus}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{siteData.code}</span>
                {siteData.project && (
                  <Link to={`/projects/${siteData.project.id}`} className="hover:text-aqua-600 transition-colors">
                    {siteData.project.name}
                  </Link>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => setActiveTab('boreholes')}
          className={`group bg-white rounded-2xl p-5 border-2 transition-all hover:shadow-lg ${
            activeTab === 'boreholes' ? 'border-blue-400 shadow-md' : 'border-transparent shadow-sm hover:border-gray-200'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-3xl font-bold text-gray-900">{boreholes.length}</p>
              <p className="text-sm text-gray-500">Boreholes</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('measurements')}
          className={`group bg-white rounded-2xl p-5 border-2 transition-all hover:shadow-lg ${
            activeTab === 'measurements' ? 'border-aqua-400 shadow-md' : 'border-transparent shadow-sm hover:border-gray-200'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-aqua-400 to-aqua-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-3xl font-bold text-gray-900">{waterLevels.length}</p>
              <p className="text-sm text-gray-500">Water Levels</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('details')}
          className={`group bg-white rounded-2xl p-5 border-2 transition-all hover:shadow-lg ${
            activeTab === 'details' ? 'border-violet-400 shadow-md' : 'border-transparent shadow-sm hover:border-gray-200'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-400 to-violet-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-3xl font-bold text-gray-900">{pumpTests.length}</p>
              <p className="text-sm text-gray-500">Pump Tests</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('quality')}
          className={`group bg-white rounded-2xl p-5 border-2 transition-all hover:shadow-lg ${
            activeTab === 'quality' ? 'border-emerald-400 shadow-md' : 'border-transparent shadow-sm hover:border-gray-200'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-3xl font-bold text-gray-900">{waterQuality.length}</p>
              <p className="text-sm text-gray-500">WQ Samples</p>
            </div>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Map */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Location</h3>
            </div>
            <Map markers={mapMarker} zoom={14} height="250px" />
            <div className="p-4 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span className="font-mono text-sm text-gray-600">
                  {siteData.latitude.toFixed(6)}, {siteData.longitude.toFixed(6)}
                </span>
              </div>
              {siteData.accuracy && (
                <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded-lg">
                  Accuracy: {siteData.accuracy.toFixed(1)} m
                </span>
              )}
            </div>
          </div>

          {/* Tabs Content */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Tab Navigation */}
            <div className="border-b border-gray-100 px-4 overflow-x-auto">
              <nav className="flex gap-1 min-w-max">
                {[
                  { id: 'details', label: 'Details', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                  { id: 'boreholes', label: `Boreholes (${boreholes.length})`, icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
                  { id: 'design', label: 'Design', icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2' },
                  { id: 'measurements', label: `Measurements (${waterLevels.length})`, icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
                  { id: 'trends', label: 'Trends', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                  { id: 'analysis', label: `Pump Tests (${pumpTests.length})`, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                  { id: 'quality', label: `Water Quality (${waterQuality.length})`, icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                      activeTab === tab.id
                        ? 'border-aqua-500 text-aqua-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                    </svg>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'details' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <DetailItem label="Site Type" value={siteData.siteType || 'Not specified'} icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    <DetailItem label="Altitude" value={siteData.altitude ? `${siteData.altitude} m` : 'N/A'} icon="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    <DetailItem label="Created By" value={siteData.creator?.name || 'Unknown'} icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    <DetailItem label="Created At" value={formatDate(siteData.createdAt, 'long')} icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </div>
                  {siteData.description && (
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                      <p className="text-sm text-gray-600">{siteData.description}</p>
                    </div>
                  )}
                  {siteData.accessNotes && (
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                      <h4 className="text-sm font-medium text-amber-700 mb-2">Access Notes</h4>
                      <p className="text-sm text-amber-600">{siteData.accessNotes}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'boreholes' && (
                <div className="space-y-4">
                  {boreholes.length > 0 ? (
                    boreholes.map((bh: any) => (
                      <div key={bh.id} className="p-5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-gray-900">{bh.name}</h4>
                            <p className="text-sm text-gray-500 mt-1">
                              {bh.wellType} - {bh.totalDepth} {bh.depthUnit} deep
                            </p>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusColor(bh.qaStatus || 'PENDING')}`}>
                            {bh.qaStatus || 'PENDING'}
                          </span>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-4">
                          <div className="bg-white rounded-lg p-3">
                            <p className="text-xs text-gray-500">Drilling Method</p>
                            <p className="text-sm font-medium text-gray-900 mt-1">{bh.drillingMethod || 'N/A'}</p>
                          </div>
                          <div className="bg-white rounded-lg p-3">
                            <p className="text-xs text-gray-500">Diameter</p>
                            <p className="text-sm font-medium text-gray-900 mt-1">{bh.diameter ? `${bh.diameter} mm` : 'N/A'}</p>
                          </div>
                          <div className="bg-white rounded-lg p-3">
                            <p className="text-xs text-gray-500">Static Water Level</p>
                            <p className="text-sm font-medium text-gray-900 mt-1">{bh.staticWaterLevel ? `${bh.staticWaterLevel} m` : 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState message="No boreholes recorded" icon="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  )}
                </div>
              )}

              {activeTab === 'measurements' && (
                <div className="space-y-6">
                  {waterLevelChartData.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-4">Water Level Trend</h4>
                      <div className="h-64">
                        <WaterLevelChart data={waterLevelChartData} />
                      </div>
                    </div>
                  )}
                  {waterLevels.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date/Time</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Depth to Water</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Method</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {waterLevels.map((wl: any) => (
                            <tr key={wl.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 text-sm text-gray-600">{formatDate(wl.measurementDatetime)}</td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{wl.depthToWater} {wl.depthUnit}</td>
                              <td className="px-4 py-3 text-sm text-gray-500">{wl.measurementMethod}</td>
                              <td className="px-4 py-3 text-sm text-gray-500">{wl.measurementType}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(wl.qaStatus || 'PENDING')}`}>
                                  {wl.qaStatus || 'PENDING'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyState message="No water level measurements recorded" icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  )}
                </div>
              )}

              {activeTab === 'quality' && (
                <div className="space-y-6">
                  {/* Upload Lab Report Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">Water Quality Assessment</h3>
                    <button
                      onClick={() => setShowLabReportUpload(true)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-aqua-500 text-white rounded-xl text-sm font-medium hover:bg-aqua-600 transition-colors whitespace-nowrap"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Upload Lab Report
                    </button>
                  </div>

                  {/* Lab Reports Section */}
                  {labReports.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-700">Lab Reports</h4>
                      {labReports.map((report) => (
                        <div key={report.id} className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{report.labName}</p>
                                <p className="text-sm text-gray-500">
                                  Sample: {formatDate(report.sampleDate, 'long')} | Report: {formatDate(report.reportDate, 'long')}
                                </p>
                              </div>
                            </div>
                            {report.fileUrl && (
                              <a
                                href={report.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                              >
                                View PDF
                              </a>
                            )}
                          </div>

                          {/* Parameters with status indicators */}
                          {report.parameters.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 mt-4">
                              {report.parameters.map((param, idx) => (
                                <div
                                  key={idx}
                                  className={`p-2 sm:p-3 rounded-lg ${
                                    param.status === 'exceeded' ? 'bg-red-100 border border-red-200' :
                                    param.status === 'warning' ? 'bg-yellow-100 border border-yellow-200' :
                                    'bg-white border border-gray-100'
                                  }`}
                                >
                                  <p className="text-xs text-gray-500 truncate" title={param.name}>{param.name}</p>
                                  <p className={`text-sm sm:text-lg font-semibold ${
                                    param.status === 'exceeded' ? 'text-red-700' :
                                    param.status === 'warning' ? 'text-yellow-700' :
                                    'text-gray-900'
                                  }`}>
                                    {param.value}
                                    <span className="text-xs font-normal text-gray-400 ml-1">{param.unit}</span>
                                  </p>
                                  {param.limit && (
                                    <p className="text-xs text-gray-400 truncate">Limit: {param.limit}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {report.notes && (
                            <p className="mt-3 text-sm text-gray-600 italic">{report.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Field Parameters Chart */}
                  {waterQualityChartData.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-4">Field Parameters</h4>
                      <div className="h-64">
                        <WaterQualityChart data={waterQualityChartData} />
                      </div>
                    </div>
                  )}

                  {/* Field Samples */}
                  {waterQuality.length > 0 ? (
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-700">Field Measurements</h4>
                      {waterQuality.map((wq: any) => (
                        <div key={wq.id} className="p-4 sm:p-5 bg-gray-50 rounded-xl">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
                            <span className="font-semibold text-gray-900">{wq.sampleId || 'Field Sample'}</span>
                            <span className="text-sm text-gray-500">{formatDate(wq.sampleDatetime)}</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
                            <ParamCard label="Temp" value={wq.temperature} unit="°C" />
                            <ParamCard label="pH" value={wq.ph} />
                            <ParamCard label="EC" value={wq.electricalConductivity} unit="µS/cm" />
                            <ParamCard label="TDS" value={wq.totalDissolvedSolids} unit="mg/L" />
                            <ParamCard label="DO" value={wq.dissolvedOxygen} unit="mg/L" />
                            <ParamCard label="Turbidity" value={wq.turbidity} unit="NTU" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : labReports.length === 0 ? (
                    <EmptyState message="No water quality data. Upload a lab report to get started." icon="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  ) : null}
                </div>
              )}

              {activeTab === 'design' && (
                <BoreholeDesign
                  borehole={boreholes[0]}
                  onSave={async (data) => {
                    try {
                      if (boreholes[0]?.id) {
                        await updateBorehole({ id: boreholes[0].id, data });
                      }
                    } catch (error) {
                      console.error('Failed to save borehole design:', error);
                    }
                  }}
                />
              )}

              {activeTab === 'trends' && (
                <div className="space-y-6">
                  {waterLevels.length > 0 ? (
                    <WaterLevelTrends
                      waterLevels={waterLevels.map((wl: any) => ({
                        id: wl.id,
                        measurementDatetime: wl.measurementDatetime,
                        depthToWater: wl.depthToWater,
                        depthUnit: wl.depthUnit || 'm',
                        measurementMethod: wl.measurementMethod,
                        measurementType: wl.measurementType,
                        notes: wl.notes,
                      }))}
                      staticWaterLevel={boreholes[0]?.staticWaterLevel}
                      siteName={siteData.name}
                    />
                  ) : (
                    <EmptyState message="No water level data available for trend analysis" icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  )}
                </div>
              )}

              {activeTab === 'analysis' && (
                <div className="space-y-6">
                  {pumpTests.length > 0 ? (
                    <PumpTestAnalysis
                      pumpTests={pumpTests.map((pt: any) => ({
                        id: pt.id,
                        testType: pt.testType || 'CONSTANT_RATE',
                        startDatetime: pt.startDatetime,
                        endDatetime: pt.endDatetime,
                        staticWaterLevel: pt.staticWaterLevel || boreholes[0]?.staticWaterLevel || 0,
                        finalWaterLevel: pt.finalWaterLevel,
                        averageDischargeRate: pt.pumpRate,
                        totalDuration: pt.duration,
                        entries: (pt.entries || []).map((e: any) => ({
                          id: e.id,
                          elapsedMinutes: e.elapsedMinutes,
                          waterLevel: e.waterLevel,
                          dischargeRate: e.pumpRate,
                          remarks: e.notes,
                        })),
                        notes: pt.notes,
                      }))}
                    />
                  ) : (
                    <EmptyState message="No pump tests recorded for this site" icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Review Panel */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">QA Review</h2>
            </div>
            <div className="p-5 space-y-4">
              {/* Success Message */}
              {reviewSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-emerald-700">{reviewSuccess}</p>
                </div>
              )}

              {/* Error Message */}
              {reviewError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
                  <svg className="w-5 h-5 text-rose-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-rose-700">{reviewError}</p>
                </div>
              )}

              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Current Status</p>
                <div className="mt-2">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium border ${getStatusColor(siteData.qaStatus)}`}>
                    {siteData.qaStatus}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Review Notes</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Add comments (required for flagging/rejection)..."
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-aqua-400 focus:border-transparent transition-all resize-none"
                />
                {!reviewComment && (
                  <p className="text-xs text-gray-400 mt-1">* Comments required for Flag and Reject actions</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => reviewMutation.mutate({ status: 'APPROVED', comment: reviewComment })}
                  disabled={reviewMutation.isPending}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {reviewMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  Approve
                </button>
                <button
                  onClick={() => reviewMutation.mutate({ status: 'FLAGGED', comment: reviewComment })}
                  disabled={reviewMutation.isPending || !reviewComment}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {reviewMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                  Flag Issue
                </button>
              </div>
              <button
                onClick={() => reviewMutation.mutate({ status: 'REJECTED', comment: reviewComment })}
                disabled={reviewMutation.isPending || !reviewComment}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-rose-200 text-rose-600 rounded-xl text-sm font-medium hover:bg-rose-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reviewMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-rose-300 border-t-rose-600 rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                Reject
              </button>
            </div>
          </div>

          {/* Pump Tests Summary */}
          {pumpTests.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Pump Tests</h2>
              </div>
              <div className="p-4 space-y-3">
                {pumpTests.map((pt: any) => (
                  <div key={pt.id} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-medium text-gray-900">{pt.testName || pt.testType}</span>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(pt.startDatetime)}</p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(pt.qaStatus || 'PENDING')}`}>
                        {pt.qaStatus || 'PENDING'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lab Report Upload Modal */}
      {showLabReportUpload && (
        <LabReportUpload
          siteId={id!}
          onClose={() => setShowLabReportUpload(false)}
          onSave={(reportData) => {
            const newReport: LabReport = {
              ...reportData,
              id: Date.now().toString(),
              uploadedAt: new Date().toISOString(),
            };
            setLabReports(prev => [newReport, ...prev]);
            setShowLabReportUpload(false);
          }}
        />
      )}
    </div>
  );
}

function DetailItem({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
        </svg>
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function ParamCard({ label, value, unit = '' }: { label: string; value?: number; unit?: string }) {
  return (
    <div className="bg-white rounded-lg p-3 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-900 mt-1">
        {value !== undefined ? value : '-'}
        {value !== undefined && unit && <span className="text-xs text-gray-400 ml-0.5">{unit}</span>}
      </p>
    </div>
  );
}

function EmptyState({ message, icon }: { message: string; icon: string }) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
        </svg>
      </div>
      <p className="mt-4 text-sm text-gray-500">{message}</p>
    </div>
  );
}
