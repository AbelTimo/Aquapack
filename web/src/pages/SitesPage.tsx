import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sitesApi, projectsApi } from '@/services/api';
import Map from '@/components/Map';
import Pagination from '@/components/Pagination';

const ITEMS_PER_PAGE = 10;

export default function SitesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const projectId = searchParams.get('projectId');
  const statusFromUrl = searchParams.get('status') || '';
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(statusFromUrl);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSites, setSelectedSites] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, projectId]);

  // Bulk review mutation
  const bulkReviewMutation = useMutation({
    mutationFn: async ({ siteIds, status }: { siteIds: string[]; status: string }) => {
      // Process each site
      await Promise.all(siteIds.map(id => sitesApi.review(id, status)));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      queryClient.invalidateQueries({ queryKey: ['all-sites'] });
      setSelectedSites(new Set());
      setShowBulkActions(false);
    },
  });

  const toggleSelectAll = () => {
    if (selectedSites.size === paginatedSites.length) {
      setSelectedSites(new Set());
    } else {
      setSelectedSites(new Set(paginatedSites.map((s: any) => s.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedSites);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedSites(newSelected);
  };

  const { data: projects } = useQuery({
    queryKey: ['my-projects'],
    queryFn: projectsApi.getMyProjects,
  });

  const { data: sites, isLoading } = useQuery({
    queryKey: ['sites', projectId, search, statusFilter],
    queryFn: () => sitesApi.getAll({
      projectId: projectId || undefined,
      search: search || undefined,
      qaStatus: statusFilter || undefined,
    }),
  });

  const sitesList = Array.isArray(sites?.data?.sites) ? sites.data.sites : [];
  const projectsList = Array.isArray(projects?.data?.projects) ? projects.data.projects : [];

  // Sort sites
  const sortedSites = [...sitesList].sort((a: any, b: any) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    // Handle nested project name
    if (sortField === 'project') {
      aVal = a.project?.name || '';
      bVal = b.project?.name || '';
    }

    // Handle string comparison
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = (bVal || '').toLowerCase();
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination (on sorted list)
  const totalPages = Math.ceil(sortedSites.length / ITEMS_PER_PAGE);
  const paginatedSites = sortedSites.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ field }: { field: string }) => (
    <svg
      className={`w-4 h-4 ml-1 inline-block ${sortField === field ? 'text-aqua-600' : 'text-gray-400'}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      {sortField === field && sortDirection === 'desc' ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      )}
    </svg>
  );

  const mapMarkers = sitesList.map((site: any) => ({
    id: site.id,
    lat: site.latitude,
    lng: site.longitude,
    title: site.name,
    status: site.qaStatus,
  }));

  // Stats
  const stats = {
    total: sitesList.length,
    approved: sitesList.filter((s: any) => s.qaStatus === 'APPROVED').length,
    pending: sitesList.filter((s: any) => s.qaStatus === 'PENDING').length,
    flagged: sitesList.filter((s: any) => s.qaStatus === 'FLAGGED').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sites</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage all field sites
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm font-medium ${
                viewMode === 'list'
                  ? 'bg-aqua-50 text-aqua-700'
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-2 text-sm font-medium ${
                viewMode === 'map'
                  ? 'bg-aqua-50 text-aqua-700'
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500">Total Sites</p>
        </div>
        <div className="card text-center py-4 bg-green-50 border-0">
          <p className="text-2xl font-bold text-green-700">{stats.approved}</p>
          <p className="text-sm text-green-600">Approved</p>
        </div>
        <div className="card text-center py-4 bg-yellow-50 border-0">
          <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
          <p className="text-sm text-yellow-600">Pending</p>
        </div>
        <div className="card text-center py-4 bg-red-50 border-0">
          <p className="text-2xl font-bold text-red-700">{stats.flagged}</p>
          <p className="text-sm text-red-600">Flagged</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px] max-w-md">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search sites..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-auto"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending Review</option>
          <option value="APPROVED">Approved</option>
          <option value="FLAGGED">Flagged</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aqua-600"></div>
        </div>
      ) : sitesList.length === 0 ? (
        <div className="text-center py-12 card">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No sites found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Sites are created from the mobile app during field work.
          </p>
        </div>
      ) : viewMode === 'map' ? (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Site Locations ({sitesList.length})</h2>
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
          <Map
            markers={mapMarkers}
            height="500px"
            onMarkerClick={(siteId) => navigate(`/sites/${siteId}`)}
          />
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          {/* Bulk Actions Bar */}
          {selectedSites.size > 0 && (
            <div className="bg-aqua-50 border-b border-aqua-200 px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-aqua-700 font-medium">
                {selectedSites.size} site{selectedSites.size > 1 ? 's' : ''} selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => bulkReviewMutation.mutate({ siteIds: Array.from(selectedSites), status: 'APPROVED' })}
                  disabled={bulkReviewMutation.isPending}
                  className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200"
                >
                  Approve All
                </button>
                <button
                  onClick={() => bulkReviewMutation.mutate({ siteIds: Array.from(selectedSites), status: 'FLAGGED' })}
                  disabled={bulkReviewMutation.isPending}
                  className="px-3 py-1.5 text-sm font-medium text-yellow-700 bg-yellow-100 rounded-md hover:bg-yellow-200"
                >
                  Flag All
                </button>
                <button
                  onClick={() => bulkReviewMutation.mutate({ siteIds: Array.from(selectedSites), status: 'REJECTED' })}
                  disabled={bulkReviewMutation.isPending}
                  className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200"
                >
                  Reject All
                </button>
                <button
                  onClick={() => setSelectedSites(new Set())}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
          <table className="table">
            <thead>
              <tr>
                <th className="w-10">
                  <input
                    type="checkbox"
                    checked={selectedSites.size === paginatedSites.length && paginatedSites.length > 0}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 text-aqua-600 rounded border-gray-300 focus:ring-aqua-500"
                  />
                </th>
                <th className="cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                  Site Name <SortIcon field="name" />
                </th>
                <th className="cursor-pointer hover:bg-gray-100" onClick={() => handleSort('code')}>
                  Code <SortIcon field="code" />
                </th>
                <th className="cursor-pointer hover:bg-gray-100" onClick={() => handleSort('project')}>
                  Project <SortIcon field="project" />
                </th>
                <th className="cursor-pointer hover:bg-gray-100" onClick={() => handleSort('siteType')}>
                  Type <SortIcon field="siteType" />
                </th>
                <th>Coordinates</th>
                <th className="cursor-pointer hover:bg-gray-100" onClick={() => handleSort('qaStatus')}>
                  Status <SortIcon field="qaStatus" />
                </th>
                <th>Data</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedSites.map((site: any) => (
                <tr key={site.id} className={`hover:bg-gray-50 ${selectedSites.has(site.id) ? 'bg-aqua-50' : ''}`}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedSites.has(site.id)}
                      onChange={() => toggleSelect(site.id)}
                      className="h-4 w-4 text-aqua-600 rounded border-gray-300 focus:ring-aqua-500"
                    />
                  </td>
                  <td>
                    <Link to={`/sites/${site.id}`} className="font-medium text-aqua-600 hover:text-aqua-500">
                      {site.name}
                    </Link>
                  </td>
                  <td className="text-gray-500">{site.code}</td>
                  <td>
                    {site.project ? (
                      <Link to={`/projects/${site.project.id}`} className="text-gray-600 hover:text-aqua-600">
                        {site.project.name}
                      </Link>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
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
                    <Link to={`/sites/${site.id}`} className="text-aqua-600 hover:text-aqua-500 text-sm font-medium">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={sitesList.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </div>
      )}
    </div>
  );
}
