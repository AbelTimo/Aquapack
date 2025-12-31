import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { projectsApi, sitesApi } from '@/services/api';
import Map from '@/components/Map';
import { QAStatusChart } from '@/components/Charts';

interface EditProjectForm {
  name: string;
  code: string;
  client?: string;
  region?: string;
  description?: string;
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'sites' | 'map'>('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.getById(id!),
    enabled: !!id,
  });

  const { data: dashboard } = useQuery({
    queryKey: ['project-dashboard', id],
    queryFn: () => projectsApi.getDashboard(id!),
    enabled: !!id,
  });

  const { data: sites } = useQuery({
    queryKey: ['project-sites', id],
    queryFn: () => sitesApi.getAll({ projectId: id }),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: EditProjectForm) => projectsApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowEditModal(false);
    },
  });

  if (projectLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aqua-600"></div>
      </div>
    );
  }

  const projectData = project?.data?.project;
  const dashboardData = dashboard?.data;
  const sitesList = Array.isArray(sites?.data?.sites) ? sites.data.sites : [];

  if (!projectData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-medium text-gray-900">Project not found</h2>
        <Link to="/projects" className="mt-4 btn-primary">
          Back to Projects
        </Link>
      </div>
    );
  }

  const mapMarkers = sitesList.map((site: any) => ({
    id: site.id,
    lat: site.latitude,
    lng: site.longitude,
    title: site.name,
    status: site.qaStatus,
  }));

  // Calculate QA stats
  const qaStats = {
    approved: sitesList.filter((s: any) => s.qaStatus === 'APPROVED').length,
    pending: sitesList.filter((s: any) => s.qaStatus === 'PENDING').length,
    flagged: sitesList.filter((s: any) => s.qaStatus === 'FLAGGED').length,
    rejected: sitesList.filter((s: any) => s.qaStatus === 'REJECTED').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Link to="/projects" className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{projectData.name}</h1>
            <span className={`badge ${projectData.isActive ? 'badge-approved' : 'badge-pending'}`}>
              {projectData.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {projectData.code} {projectData.client && `• ${projectData.client}`} {projectData.region && `• ${projectData.region}`}
          </p>
          {projectData.description && (
            <p className="mt-2 text-sm text-gray-600">{projectData.description}</p>
          )}
        </div>
        <div className="flex space-x-2">
          <button onClick={() => setShowEditModal(true)} className="btn-secondary">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
          <button onClick={() => setShowReportModal(true)} className="btn-primary">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Generate Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {dashboardData && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          <StatCard label="Total Sites" value={dashboardData.sitesTotal} color="blue" />
          <StatCard label="Completed" value={dashboardData.sitesCompleted} color="green" />
          <StatCard label="Boreholes" value={dashboardData.boreholesTotal} color="cyan" />
          <StatCard label="Water Levels" value={dashboardData.waterLevelCount} color="indigo" />
          <StatCard label="Pump Tests" value={dashboardData.pumpTestCount} color="purple" />
          <StatCard label="Pending Review" value={dashboardData.pendingReviewCount} color="yellow" />
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'sites', 'map'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-aqua-500 text-aqua-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QA Status Chart */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">QA Status</h3>
            <div className="h-64">
              <QAStatusChart {...qaStats} />
            </div>
          </div>

          {/* Recent Sites */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Sites</h3>
              <button
                onClick={() => setActiveTab('sites')}
                className="text-sm font-medium text-aqua-600 hover:text-aqua-500"
              >
                View all
              </button>
            </div>
            <div className="space-y-3">
              {sitesList.slice(0, 5).map((site: any) => (
                <Link
                  key={site.id}
                  to={`/sites/${site.id}`}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-aqua-300 hover:bg-aqua-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{site.name}</p>
                    <p className="text-xs text-gray-500">{site.code}</p>
                  </div>
                  <span className={`badge badge-${site.qaStatus.toLowerCase()}`}>
                    {site.qaStatus}
                  </span>
                </Link>
              ))}
              {sitesList.length === 0 && (
                <p className="text-center text-gray-500 py-4">No sites yet</p>
              )}
            </div>
          </div>

          {/* Mini Map */}
          {mapMarkers.length > 0 && (
            <div className="card lg:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Site Locations</h3>
              <Map
                markers={mapMarkers}
                height="300px"
                onMarkerClick={(siteId) => navigate(`/sites/${siteId}`)}
              />
            </div>
          )}
        </div>
      )}

      {activeTab === 'sites' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">All Sites ({sitesList.length})</h2>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Search sites..."
                className="input text-sm"
              />
            </div>
          </div>

          {sitesList.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No sites yet. Sites will appear here once created from the mobile app.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Type</th>
                    <th>Coordinates</th>
                    <th>Status</th>
                    <th>Data</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sitesList.map((site: any) => (
                    <tr key={site.id} className="hover:bg-gray-50">
                      <td>
                        <Link to={`/sites/${site.id}`} className="font-medium text-aqua-600 hover:text-aqua-500">
                          {site.name}
                        </Link>
                      </td>
                      <td className="text-gray-500">{site.code}</td>
                      <td className="text-gray-500">{site.siteType || '-'}</td>
                      <td className="text-gray-500 text-xs font-mono">
                        {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
                      </td>
                      <td>
                        <span className={`badge badge-${site.qaStatus.toLowerCase()}`}>
                          {site.qaStatus}
                        </span>
                      </td>
                      <td className="text-gray-500 text-sm">
                        {site._count?.boreholes || 0} BH, {site._count?.waterLevels || 0} WL
                      </td>
                      <td>
                        <Link
                          to={`/sites/${site.id}`}
                          className="text-aqua-600 hover:text-aqua-800 text-sm font-medium"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'map' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Site Map</h2>
            <div className="flex items-center space-x-4 text-sm">
              <span className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-green-500 mr-1"></span> Approved
              </span>
              <span className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></span> Pending
              </span>
              <span className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-red-500 mr-1"></span> Flagged
              </span>
            </div>
          </div>
          {mapMarkers.length > 0 ? (
            <Map
              markers={mapMarkers}
              height="500px"
              onMarkerClick={(siteId) => navigate(`/sites/${siteId}`)}
            />
          ) : (
            <div className="text-center py-12 text-gray-500">
              No sites with coordinates to display on map.
            </div>
          )}
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditModal && projectData && (
        <EditProjectModal
          project={projectData}
          onClose={() => setShowEditModal(false)}
          onSubmit={(data) => updateMutation.mutate(data)}
          isLoading={updateMutation.isPending}
          error={updateMutation.error?.message}
        />
      )}

      {/* Report Modal */}
      {showReportModal && projectData && (
        <ReportModal
          project={projectData}
          sites={sitesList}
          dashboardData={dashboardData}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    cyan: 'bg-cyan-50 text-cyan-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    purple: 'bg-purple-50 text-purple-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    red: 'bg-red-50 text-red-700',
  };

  return (
    <div className={`card ${colorClasses[color]} border-0`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm opacity-80">{label}</p>
    </div>
  );
}

function EditProjectModal({
  project,
  onClose,
  onSubmit,
  isLoading,
  error,
}: {
  project: any;
  onClose: () => void;
  onSubmit: (data: EditProjectForm) => void;
  isLoading: boolean;
  error?: string;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<EditProjectForm>({
    defaultValues: {
      name: project.name,
      code: project.code,
      client: project.client || '',
      region: project.region || '',
      description: project.description || '',
    },
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Project</h3>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="label">Project Name *</label>
                  <input
                    {...register('name', { required: 'Name is required' })}
                    className="input"
                    placeholder="e.g., Nairobi Water Supply"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="label">Project Code *</label>
                  <input
                    {...register('code', {
                      required: 'Code is required',
                      pattern: {
                        value: /^[A-Z0-9-]+$/,
                        message: 'Code must be uppercase alphanumeric with dashes',
                      },
                    })}
                    className="input uppercase"
                    placeholder="e.g., NRB-WS-2024"
                  />
                  {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>}
                </div>

                <div>
                  <label className="label">Client</label>
                  <input
                    {...register('client')}
                    className="input"
                    placeholder="e.g., Nairobi City County"
                  />
                </div>

                <div>
                  <label className="label">Region</label>
                  <input
                    {...register('region')}
                    className="input"
                    placeholder="e.g., Central Kenya"
                  />
                </div>

                <div>
                  <label className="label">Description</label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="input"
                    placeholder="Brief description of the project..."
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-2">
              <button type="submit" disabled={isLoading} className="btn-primary w-full sm:w-auto">
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={onClose} className="btn-secondary w-full sm:w-auto mt-2 sm:mt-0">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function ReportModal({
  project,
  sites,
  dashboardData,
  onClose,
}: {
  project: any;
  sites: any[];
  dashboardData: any;
  onClose: () => void;
}) {
  const [reportType, setReportType] = useState<'summary' | 'detailed' | 'csv'>('summary');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = async () => {
    setIsGenerating(true);

    if (reportType === 'csv') {
      // Generate CSV
      const headers = ['Site Name', 'Code', 'Type', 'Latitude', 'Longitude', 'QA Status', 'Boreholes', 'Water Levels'];
      const rows = sites.map(site => [
        site.name,
        site.code,
        site.siteType || '',
        site.latitude,
        site.longitude,
        site.qaStatus,
        site._count?.boreholes || 0,
        site._count?.waterLevels || 0,
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.code}-sites-export.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Generate printable HTML report
      const qaStats = {
        approved: sites.filter(s => s.qaStatus === 'APPROVED').length,
        pending: sites.filter(s => s.qaStatus === 'PENDING').length,
        flagged: sites.filter(s => s.qaStatus === 'FLAGGED').length,
        rejected: sites.filter(s => s.qaStatus === 'REJECTED').length,
      };

      const reportHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${project.name} - Project Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
            h1 { color: #0891b2; border-bottom: 2px solid #0891b2; padding-bottom: 10px; }
            h2 { color: #0e7490; margin-top: 30px; }
            .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
            .info-item { background: #f8fafc; padding: 15px; border-radius: 8px; }
            .info-label { font-size: 12px; color: #64748b; text-transform: uppercase; }
            .info-value { font-size: 18px; font-weight: bold; margin-top: 5px; }
            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
            .stat-card { text-align: center; padding: 20px; border-radius: 8px; }
            .stat-value { font-size: 24px; font-weight: bold; }
            .stat-label { font-size: 12px; margin-top: 5px; }
            .approved { background: #dcfce7; color: #166534; }
            .pending { background: #fef3c7; color: #92400e; }
            .flagged { background: #fee2e2; color: #dc2626; }
            .rejected { background: #f3f4f6; color: #374151; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
            th { background: #f8fafc; font-weight: 600; }
            .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #64748b; font-size: 12px; }
            @media print { body { margin: 20px; } }
          </style>
        </head>
        <body>
          <h1>${project.name}</h1>

          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Project Code</div>
              <div class="info-value">${project.code}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Client</div>
              <div class="info-value">${project.client || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Region</div>
              <div class="info-value">${project.region || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Status</div>
              <div class="info-value">${project.isActive ? 'Active' : 'Inactive'}</div>
            </div>
          </div>

          ${project.description ? `<p><strong>Description:</strong> ${project.description}</p>` : ''}

          <h2>Summary Statistics</h2>
          ${dashboardData ? `
          <div class="stats-grid">
            <div class="stat-card" style="background: #e0f2fe; color: #0369a1;">
              <div class="stat-value">${dashboardData.sitesTotal || 0}</div>
              <div class="stat-label">Total Sites</div>
            </div>
            <div class="stat-card" style="background: #dcfce7; color: #166534;">
              <div class="stat-value">${dashboardData.sitesCompleted || 0}</div>
              <div class="stat-label">Completed</div>
            </div>
            <div class="stat-card" style="background: #e0e7ff; color: #4338ca;">
              <div class="stat-value">${dashboardData.boreholesTotal || 0}</div>
              <div class="stat-label">Boreholes</div>
            </div>
            <div class="stat-card" style="background: #fef3c7; color: #92400e;">
              <div class="stat-value">${dashboardData.pendingReviewCount || 0}</div>
              <div class="stat-label">Pending Review</div>
            </div>
          </div>
          ` : ''}

          <h2>QA Status</h2>
          <div class="stats-grid">
            <div class="stat-card approved">
              <div class="stat-value">${qaStats.approved}</div>
              <div class="stat-label">Approved</div>
            </div>
            <div class="stat-card pending">
              <div class="stat-value">${qaStats.pending}</div>
              <div class="stat-label">Pending</div>
            </div>
            <div class="stat-card flagged">
              <div class="stat-value">${qaStats.flagged}</div>
              <div class="stat-label">Flagged</div>
            </div>
            <div class="stat-card rejected">
              <div class="stat-value">${qaStats.rejected}</div>
              <div class="stat-label">Rejected</div>
            </div>
          </div>

          ${reportType === 'detailed' ? `
          <h2>Sites List</h2>
          <table>
            <thead>
              <tr>
                <th>Site Name</th>
                <th>Code</th>
                <th>Type</th>
                <th>Coordinates</th>
                <th>Status</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              ${sites.map(site => `
                <tr>
                  <td>${site.name}</td>
                  <td>${site.code}</td>
                  <td>${site.siteType || '-'}</td>
                  <td>${site.latitude.toFixed(4)}, ${site.longitude.toFixed(4)}</td>
                  <td><span class="badge ${site.qaStatus.toLowerCase()}">${site.qaStatus}</span></td>
                  <td>${site._count?.boreholes || 0} BH, ${site._count?.waterLevels || 0} WL</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ` : ''}

          <div class="footer">
            <p>Generated on ${new Date().toLocaleString()} | Aquapack Field Data Management System</p>
          </div>
        </body>
        </html>
      `;

      const blob = new Blob([reportHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (win) {
        win.onload = () => {
          setTimeout(() => win.print(), 500);
        };
      }
      URL.revokeObjectURL(url);
    }

    setIsGenerating(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Report</h3>

            <div className="space-y-3">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="reportType"
                  value="summary"
                  checked={reportType === 'summary'}
                  onChange={(e) => setReportType(e.target.value as any)}
                  className="mr-3"
                />
                <div>
                  <p className="font-medium">Summary Report</p>
                  <p className="text-sm text-gray-500">Overview with statistics and QA status</p>
                </div>
              </label>

              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="reportType"
                  value="detailed"
                  checked={reportType === 'detailed'}
                  onChange={(e) => setReportType(e.target.value as any)}
                  className="mr-3"
                />
                <div>
                  <p className="font-medium">Detailed Report</p>
                  <p className="text-sm text-gray-500">Full report including all sites list</p>
                </div>
              </label>

              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="reportType"
                  value="csv"
                  checked={reportType === 'csv'}
                  onChange={(e) => setReportType(e.target.value as any)}
                  className="mr-3"
                />
                <div>
                  <p className="font-medium">CSV Export</p>
                  <p className="text-sm text-gray-500">Download sites data as spreadsheet</p>
                </div>
              </label>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-2">
            <button
              onClick={generateReport}
              disabled={isGenerating}
              className="btn-primary w-full sm:w-auto"
            >
              {isGenerating ? 'Generating...' : reportType === 'csv' ? 'Download CSV' : 'Generate & Print'}
            </button>
            <button onClick={onClose} className="btn-secondary w-full sm:w-auto mt-2 sm:mt-0">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
