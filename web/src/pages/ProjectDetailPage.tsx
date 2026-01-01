import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { projectsApi, sitesApi, boreholesApi } from '@/services/api';
import Map from '@/components/Map';
import { BoreholeStatusChart } from '@/components/Charts';
import Pagination from '@/components/Pagination';

const ITEMS_PER_PAGE = 10;

interface EditProjectForm {
  // Basic Info
  name: string;
  code: string;
  description?: string;

  // Client & Location
  client?: string;
  clientContact?: string;
  clientEmail?: string;
  clientPhone?: string;
  country?: string;
  region?: string;

  // Timeline
  startDate?: string;
  endDate?: string;
  isActive: boolean;

  // Settings
  depthUnit: 'meters' | 'feet';
  dischargeUnit: 'l/s' | 'm3/h' | 'gpm';
  coordinateSystem: 'WGS84' | 'UTM';
  gpsAccuracyThreshold: number;

  // Enabled Modules
  enableBoreholes: boolean;
  enableWaterLevels: boolean;
  enablePumpTests: boolean;
  enableWaterQuality: boolean;
  enableMedia: boolean;
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'sites' | 'map'>('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [siteSearch, setSiteSearch] = useState('');
  const [siteStatusFilter, setSiteStatusFilter] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sitesPage, setSitesPage] = useState(1);

  // Reset page when filters change
  useEffect(() => {
    setSitesPage(1);
  }, [siteSearch, siteStatusFilter]);

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

  const { data: boreholes } = useQuery({
    queryKey: ['all-boreholes'],
    queryFn: () => boreholesApi.getAll({}),
  });

  const updateMutation = useMutation({
    mutationFn: (data: EditProjectForm) => projectsApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowEditModal(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => projectsApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate('/projects');
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

  // Filter sites based on search and status
  const filteredSites = sitesList.filter((site: any) => {
    const matchesSearch = !siteSearch ||
      site.name.toLowerCase().includes(siteSearch.toLowerCase()) ||
      site.code.toLowerCase().includes(siteSearch.toLowerCase());
    const matchesStatus = !siteStatusFilter || site.qaStatus === siteStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination for filtered sites
  const sitesTotalPages = Math.ceil(filteredSites.length / ITEMS_PER_PAGE);
  const paginatedFilteredSites = filteredSites.slice(
    (sitesPage - 1) * ITEMS_PER_PAGE,
    sitesPage * ITEMS_PER_PAGE
  );

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

  // Get boreholes for this project's sites and calculate borehole status stats
  const siteIds = new Set(sitesList.map((s: any) => s.id));
  const boreholesList = Array.isArray(boreholes?.data?.boreholes)
    ? boreholes.data.boreholes.filter((b: any) => siteIds.has(b.siteId))
    : [];
  const boreholeStats = {
    drilling: boreholesList.filter((b: any) => b.boreholeStatus === 'DRILLING').length,
    completed: boreholesList.filter((b: any) => b.boreholeStatus === 'COMPLETED').length,
    operational: boreholesList.filter((b: any) => b.boreholeStatus === 'OPERATIONAL').length,
    abandoned: boreholesList.filter((b: any) => b.boreholeStatus === 'ABANDONED').length,
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
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn-secondary text-red-600 border-red-300 hover:bg-red-50"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {dashboardData && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total Sites" value={dashboardData.sitesTotal} color="blue" onClick={() => setActiveTab('sites')} />
          <StatCard label="Completed" value={dashboardData.sitesCompleted} color="green" onClick={() => setActiveTab('sites')} />
          <StatCard label="Boreholes" value={dashboardData.boreholesTotal} color="cyan" onClick={() => setActiveTab('overview')} />
          <StatCard label="Pending Review" value={dashboardData.pendingReviewCount} color="yellow" onClick={() => setActiveTab('sites')} />
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
          {/* Borehole Status Chart */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Borehole Status</h3>
            <div className="h-64">
              <BoreholeStatusChart {...boreholeStats} />
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2 text-center text-sm">
              <div className="p-2 bg-yellow-50 rounded">
                <p className="font-bold text-yellow-700">{boreholeStats.drilling}</p>
                <p className="text-yellow-600 text-xs">Drilling</p>
              </div>
              <div className="p-2 bg-blue-50 rounded">
                <p className="font-bold text-blue-700">{boreholeStats.completed}</p>
                <p className="text-blue-600 text-xs">Completed</p>
              </div>
              <div className="p-2 bg-green-50 rounded">
                <p className="font-bold text-green-700">{boreholeStats.operational}</p>
                <p className="text-green-600 text-xs">Operational</p>
              </div>
              <div className="p-2 bg-red-50 rounded">
                <p className="font-bold text-red-700">{boreholeStats.abandoned}</p>
                <p className="text-red-600 text-xs">Abandoned</p>
              </div>
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
            <h2 className="text-lg font-medium text-gray-900">
              All Sites ({filteredSites.length}{filteredSites.length !== sitesList.length ? ` of ${sitesList.length}` : ''})
            </h2>
            <div className="flex space-x-2">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search sites..."
                  value={siteSearch}
                  onChange={(e) => setSiteSearch(e.target.value)}
                  className="input text-sm pl-9 w-48"
                />
              </div>
              <select
                value={siteStatusFilter}
                onChange={(e) => setSiteStatusFilter(e.target.value)}
                className="input text-sm w-auto"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="FLAGGED">Flagged</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {sitesList.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No sites yet. Sites will appear here once created from the mobile app.
            </div>
          ) : filteredSites.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No sites match your search criteria.
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
                  {paginatedFilteredSites.map((site: any) => (
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
              <Pagination
                currentPage={sitesPage}
                totalPages={sitesTotalPages}
                onPageChange={setSitesPage}
                totalItems={filteredSites.length}
                itemsPerPage={ITEMS_PER_PAGE}
              />
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowDeleteConfirm(false)} />
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <h3 className="text-lg font-semibold text-gray-900">Delete Project</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete <strong>{projectData?.name}</strong>? This will permanently remove the project and all associated data. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-2">
                <button
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete Project'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, onClick }: { label: string; value: number; color: string; onClick?: () => void }) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    cyan: 'bg-cyan-50 text-cyan-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    purple: 'bg-purple-50 text-purple-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    red: 'bg-red-50 text-red-700',
  };

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`card ${colorClasses[color]} border-0 w-full text-left hover:opacity-80 transition-opacity cursor-pointer`}
      >
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm opacity-80">{label}</p>
      </button>
    );
  }

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
  const [activeSection, setActiveSection] = useState<'basic' | 'client' | 'settings' | 'modules'>('basic');

  // Parse existing config if available
  const existingConfig = project.templateConfig || {};

  const { register, handleSubmit, formState: { errors } } = useForm<EditProjectForm>({
    defaultValues: {
      name: project.name,
      code: project.code,
      description: project.description || '',
      client: project.client || '',
      clientContact: existingConfig.clientContact || '',
      clientEmail: existingConfig.clientEmail || '',
      clientPhone: existingConfig.clientPhone || '',
      country: existingConfig.country || '',
      region: project.region || '',
      startDate: project.startDate ? project.startDate.split('T')[0] : '',
      endDate: project.endDate ? project.endDate.split('T')[0] : '',
      isActive: project.isActive ?? true,
      depthUnit: existingConfig.defaultUnits?.depth || 'meters',
      dischargeUnit: existingConfig.defaultUnits?.discharge || 'l/s',
      coordinateSystem: existingConfig.coordinateSystem || 'WGS84',
      gpsAccuracyThreshold: existingConfig.gpsAccuracyThreshold || 10,
      enableBoreholes: existingConfig.enabledModules?.includes('boreholes') ?? true,
      enableWaterLevels: existingConfig.enabledModules?.includes('waterLevels') ?? true,
      enablePumpTests: existingConfig.enabledModules?.includes('pumpTests') ?? true,
      enableWaterQuality: existingConfig.enabledModules?.includes('waterQuality') ?? true,
      enableMedia: existingConfig.enabledModules?.includes('media') ?? true,
    },
  });

  const sections = [
    { id: 'basic', label: 'Basic Info', icon: '📋' },
    { id: 'client', label: 'Client & Location', icon: '👤' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    { id: 'modules', label: 'Modules', icon: '📦' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Edit Project Settings</h3>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                  {error}
                </div>
              )}

              {/* Section Tabs */}
              <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id as any)}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                      activeSection === section.id
                        ? 'bg-white text-aqua-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <span className="mr-1">{section.icon}</span>
                    {section.label}
                  </button>
                ))}
              </div>

              {/* Basic Info Section */}
              {activeSection === 'basic' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="label">Project Name *</label>
                      <input
                        {...register('name', { required: 'Project name is required' })}
                        className="input"
                        placeholder="e.g., Nairobi Water Supply Project"
                      />
                      {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                    </div>

                    <div>
                      <label className="label">Project Code *</label>
                      <input
                        {...register('code', {
                          required: 'Project code is required',
                          pattern: {
                            value: /^[A-Z0-9-]+$/,
                            message: 'Must be uppercase with numbers and dashes only',
                          },
                        })}
                        className="input uppercase"
                        placeholder="e.g., NRB-WS-2024"
                      />
                      {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>}
                    </div>

                    <div>
                      <label className="label">Project Status</label>
                      <div className="flex items-center mt-2">
                        <input
                          {...register('isActive')}
                          type="checkbox"
                          className="h-5 w-5 text-aqua-600 rounded border-gray-300 focus:ring-aqua-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Active Project</span>
                      </div>
                    </div>

                    <div>
                      <label className="label">Start Date</label>
                      <input
                        {...register('startDate')}
                        type="date"
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="label">End Date</label>
                      <input
                        {...register('endDate')}
                        type="date"
                        className="input"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="label">Project Description</label>
                      <textarea
                        {...register('description')}
                        rows={3}
                        className="input"
                        placeholder="Brief description of the project objectives and scope..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Client & Location Section */}
              {activeSection === 'client' && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg mb-4">
                    <h4 className="font-medium text-blue-900 mb-1">Client Information</h4>
                    <p className="text-sm text-blue-700">Update details about the project client/sponsor</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="label">Client / Organization Name</label>
                      <input
                        {...register('client')}
                        className="input"
                        placeholder="e.g., Nairobi City County Government"
                      />
                    </div>

                    <div>
                      <label className="label">Contact Person</label>
                      <input
                        {...register('clientContact')}
                        className="input"
                        placeholder="e.g., John Doe"
                      />
                    </div>

                    <div>
                      <label className="label">Contact Email</label>
                      <input
                        {...register('clientEmail', {
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address',
                          },
                        })}
                        type="email"
                        className="input"
                        placeholder="e.g., john.doe@example.com"
                      />
                      {errors.clientEmail && <p className="mt-1 text-sm text-red-600">{errors.clientEmail.message}</p>}
                    </div>

                    <div>
                      <label className="label">Contact Phone</label>
                      <input
                        {...register('clientPhone')}
                        type="tel"
                        className="input"
                        placeholder="e.g., +254 700 123456"
                      />
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Project Location</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Country</label>
                        <select {...register('country')} className="input">
                          <option value="">Select country...</option>
                          <optgroup label="West Africa">
                            <option value="NG">Nigeria</option>
                            <option value="GH">Ghana</option>
                            <option value="SN">Senegal</option>
                            <option value="CI">Ivory Coast</option>
                            <option value="ML">Mali</option>
                            <option value="BF">Burkina Faso</option>
                            <option value="NE">Niger</option>
                          </optgroup>
                          <optgroup label="East Africa">
                            <option value="KE">Kenya</option>
                            <option value="ET">Ethiopia</option>
                            <option value="TZ">Tanzania</option>
                            <option value="UG">Uganda</option>
                            <option value="RW">Rwanda</option>
                            <option value="SS">South Sudan</option>
                            <option value="SO">Somalia</option>
                            <option value="DJ">Djibouti</option>
                            <option value="ER">Eritrea</option>
                          </optgroup>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="label">Region / State / Province</label>
                        <input
                          {...register('region')}
                          className="input"
                          placeholder="e.g., Central Region"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Settings Section */}
              {activeSection === 'settings' && (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 rounded-lg mb-4">
                    <h4 className="font-medium text-amber-900 mb-1">Project Settings</h4>
                    <p className="text-sm text-amber-700">Configure units and GPS settings for field data collection</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Depth Unit</label>
                      <select {...register('depthUnit')} className="input">
                        <option value="meters">Meters (m)</option>
                        <option value="feet">Feet (ft)</option>
                      </select>
                      <p className="mt-1 text-xs text-gray-500">Used for water levels, borehole depths</p>
                    </div>

                    <div>
                      <label className="label">Discharge Unit</label>
                      <select {...register('dischargeUnit')} className="input">
                        <option value="l/s">Liters per second (l/s)</option>
                        <option value="m3/h">Cubic meters per hour (m³/h)</option>
                        <option value="gpm">Gallons per minute (gpm)</option>
                      </select>
                      <p className="mt-1 text-xs text-gray-500">Used for pump test measurements</p>
                    </div>

                    <div>
                      <label className="label">Coordinate System</label>
                      <select {...register('coordinateSystem')} className="input">
                        <option value="WGS84">WGS 84 (Lat/Long)</option>
                        <option value="UTM">UTM</option>
                      </select>
                      <p className="mt-1 text-xs text-gray-500">Geographic coordinate reference system</p>
                    </div>

                    <div>
                      <label className="label">GPS Accuracy Threshold (m)</label>
                      <input
                        {...register('gpsAccuracyThreshold', {
                          valueAsNumber: true,
                          min: { value: 1, message: 'Must be at least 1 meter' },
                          max: { value: 100, message: 'Must be less than 100 meters' },
                        })}
                        type="number"
                        min="1"
                        max="100"
                        className="input"
                        placeholder="10"
                      />
                      <p className="mt-1 text-xs text-gray-500">Minimum required GPS accuracy for site capture</p>
                      {errors.gpsAccuracyThreshold && <p className="mt-1 text-sm text-red-600">{errors.gpsAccuracyThreshold.message}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Modules Section */}
              {activeSection === 'modules' && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg mb-4">
                    <h4 className="font-medium text-green-900 mb-1">Enabled Modules</h4>
                    <p className="text-sm text-green-700">Select which data collection modules are enabled for this project</p>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        {...register('enableBoreholes')}
                        type="checkbox"
                        className="h-5 w-5 text-aqua-600 rounded border-gray-300 focus:ring-aqua-500"
                      />
                      <div className="ml-4">
                        <p className="font-medium text-gray-900">Borehole / Well Data</p>
                        <p className="text-sm text-gray-500">Record borehole construction details, lithology logs, casing</p>
                      </div>
                    </label>

                    <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        {...register('enableWaterLevels')}
                        type="checkbox"
                        className="h-5 w-5 text-aqua-600 rounded border-gray-300 focus:ring-aqua-500"
                      />
                      <div className="ml-4">
                        <p className="font-medium text-gray-900">Water Level Measurements</p>
                        <p className="text-sm text-gray-500">Capture static and dynamic water level readings</p>
                      </div>
                    </label>

                    <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        {...register('enablePumpTests')}
                        type="checkbox"
                        className="h-5 w-5 text-aqua-600 rounded border-gray-300 focus:ring-aqua-500"
                      />
                      <div className="ml-4">
                        <p className="font-medium text-gray-900">Pump Tests</p>
                        <p className="text-sm text-gray-500">Record step tests, constant rate tests, and recovery data</p>
                      </div>
                    </label>

                    <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        {...register('enableWaterQuality')}
                        type="checkbox"
                        className="h-5 w-5 text-aqua-600 rounded border-gray-300 focus:ring-aqua-500"
                      />
                      <div className="ml-4">
                        <p className="font-medium text-gray-900">Water Quality</p>
                        <p className="text-sm text-gray-500">Field parameters: pH, EC, TDS, temperature, turbidity</p>
                      </div>
                    </label>

                    <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        {...register('enableMedia')}
                        type="checkbox"
                        className="h-5 w-5 text-aqua-600 rounded border-gray-300 focus:ring-aqua-500"
                      />
                      <div className="ml-4">
                        <p className="font-medium text-gray-900">Photos & Media</p>
                        <p className="text-sm text-gray-500">Capture geotagged photos and audio notes</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-4 sm:px-6 flex items-center justify-between sticky bottom-0">
              <div className="flex space-x-2">
                {activeSection !== 'basic' && (
                  <button
                    type="button"
                    onClick={() => {
                      const idx = sections.findIndex(s => s.id === activeSection);
                      if (idx > 0) setActiveSection(sections[idx - 1].id as any);
                    }}
                    className="btn-secondary"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </button>
                )}
              </div>

              <div className="flex space-x-2">
                <button type="button" onClick={onClose} className="btn-secondary">
                  Cancel
                </button>

                {activeSection !== 'modules' ? (
                  <button
                    type="button"
                    onClick={() => {
                      const idx = sections.findIndex(s => s.id === activeSection);
                      if (idx < sections.length - 1) setActiveSection(sections[idx + 1].id as any);
                    }}
                    className="btn-primary"
                  >
                    Next
                    <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ) : (
                  <button type="submit" disabled={isLoading} className="btn-primary">
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Save Changes
                      </>
                    )}
                  </button>
                )}
              </div>
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
