import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sitesApi } from '@/services/api';
import Map from '@/components/Map';
import Pagination from '@/components/Pagination';
import ExportTools from '@/components/ExportTools';
import BulkImport from '@/components/BulkImport';

const ITEMS_PER_PAGE = 10;

export default function SitesPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const projectId = searchParams.get('projectId');
  const statusFromUrl = searchParams.get('status') || '';
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(statusFromUrl);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSites, setSelectedSites] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Sync status filter with URL parameter
  useEffect(() => {
    setStatusFilter(statusFromUrl);
  }, [statusFromUrl]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, projectId]);

  const bulkReviewMutation = useMutation({
    mutationFn: async ({ siteIds, status }: { siteIds: string[]; status: string }) => {
      await Promise.all(siteIds.map(id => sitesApi.review(id, status)));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      queryClient.invalidateQueries({ queryKey: ['all-sites'] });
      setSelectedSites(new Set());
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

  const { data: sites, isLoading } = useQuery({
    queryKey: ['sites', projectId, search, statusFilter],
    queryFn: () => sitesApi.getAll({
      projectId: projectId || undefined,
      search: search || undefined,
      qaStatus: statusFilter || undefined,
    }),
  });

  const sitesList = Array.isArray(sites?.data?.sites) ? sites.data.sites : [];

  const sortedSites = [...sitesList].sort((a: any, b: any) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (sortField === 'project') {
      aVal = a.project?.name || '';
      bVal = b.project?.name || '';
    }
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = (bVal || '').toLowerCase();
    }
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

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
      className={`w-4 h-4 ml-1 inline-block transition-colors ${sortField === field ? 'text-aqua-600' : 'text-gray-400'}`}
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

  const stats = {
    total: sitesList.length,
    approved: sitesList.filter((s: any) => s.qaStatus === 'APPROVED').length,
    pending: sitesList.filter((s: any) => s.qaStatus === 'PENDING').length,
    flagged: sitesList.filter((s: any) => s.qaStatus === 'FLAGGED').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'FLAGGED': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'REJECTED': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleBulkImport = async (sites: any[]) => {
    // Transform imported data to match API format and create sites
    for (const site of sites) {
      try {
        await sitesApi.create({
          ...site,
          projectId: projectId || undefined,
        });
      } catch (error) {
        console.error('Failed to import site:', site.name, error);
      }
    }
    queryClient.invalidateQueries({ queryKey: ['sites'] });
    setShowImportModal(false);
  };

  // Get sites for export (all filtered sites, not just paginated)
  const sitesForExport = sortedSites.map((site: any) => ({
    id: site.id,
    name: site.name,
    code: site.code,
    latitude: site.latitude,
    longitude: site.longitude,
    elevation: site.elevation,
    siteType: site.siteType,
    qaStatus: site.qaStatus,
    description: site.description,
    _count: site._count,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sites</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and review all field site data
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Import/Export Buttons */}
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            disabled={sitesList.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-aqua-500 text-white rounded-xl text-sm font-medium hover:bg-aqua-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>

          {/* View Toggle */}
          <div className="bg-gray-100 p-1 rounded-xl flex">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              List
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'map'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Map
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => setStatusFilter('')}
          className={`group relative bg-white rounded-2xl p-5 border-2 transition-all hover:shadow-lg ${
            !statusFilter ? 'border-aqua-400 shadow-md' : 'border-transparent shadow-sm hover:border-gray-200'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-aqua-400 to-aqua-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Sites</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setStatusFilter('APPROVED')}
          className={`group relative bg-white rounded-2xl p-5 border-2 transition-all hover:shadow-lg ${
            statusFilter === 'APPROVED' ? 'border-emerald-400 shadow-md' : 'border-transparent shadow-sm hover:border-gray-200'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-3xl font-bold text-emerald-600">{stats.approved}</p>
              <p className="text-sm text-gray-500">Approved</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setStatusFilter('PENDING')}
          className={`group relative bg-white rounded-2xl p-5 border-2 transition-all hover:shadow-lg ${
            statusFilter === 'PENDING' ? 'border-amber-400 shadow-md' : 'border-transparent shadow-sm hover:border-gray-200'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setStatusFilter('FLAGGED')}
          className={`group relative bg-white rounded-2xl p-5 border-2 transition-all hover:shadow-lg ${
            statusFilter === 'FLAGGED' ? 'border-rose-400 shadow-md' : 'border-transparent shadow-sm hover:border-gray-200'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-400 to-rose-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-3xl font-bold text-rose-600">{stats.flagged}</p>
              <p className="text-sm text-gray-500">Flagged</p>
            </div>
          </div>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by site name, code, or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border-0 rounded-xl text-sm placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-aqua-400 transition-all"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-aqua-400 transition-all cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="APPROVED">Approved</option>
              <option value="FLAGGED">Flagged</option>
              <option value="REJECTED">Rejected</option>
            </select>
            {statusFilter && (
              <button
                onClick={() => setStatusFilter('')}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm text-gray-600 transition-colors"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-aqua-200 border-t-aqua-500 rounded-full animate-spin"></div>
            <p className="mt-4 text-sm text-gray-500">Loading sites...</p>
          </div>
        </div>
      ) : sitesList.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No sites found</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
              Sites are created from the mobile app during field work. Connect your mobile device to start adding sites.
            </p>
          </div>
        </div>
      ) : viewMode === 'map' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Site Locations
              <span className="ml-2 text-sm font-normal text-gray-500">({sitesList.length} sites)</span>
            </h2>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="text-gray-600">Approved</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <span className="text-gray-600">Pending</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                <span className="text-gray-600">Flagged</span>
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Bulk Actions Bar */}
          {selectedSites.size > 0 && (
            <div className="bg-gradient-to-r from-aqua-50 to-aqua-100 border-b border-aqua-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-aqua-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">{selectedSites.size}</span>
                </div>
                <span className="text-sm text-aqua-800 font-medium">
                  site{selectedSites.size > 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => bulkReviewMutation.mutate({ siteIds: Array.from(selectedSites), status: 'APPROVED' })}
                  disabled={bulkReviewMutation.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-100 rounded-lg hover:bg-emerald-200 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Approve
                </button>
                <button
                  onClick={() => bulkReviewMutation.mutate({ siteIds: Array.from(selectedSites), status: 'FLAGGED' })}
                  disabled={bulkReviewMutation.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-700 bg-amber-100 rounded-lg hover:bg-amber-200 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                  </svg>
                  Flag
                </button>
                <button
                  onClick={() => bulkReviewMutation.mutate({ siteIds: Array.from(selectedSites), status: 'REJECTED' })}
                  disabled={bulkReviewMutation.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-rose-700 bg-rose-100 rounded-lg hover:bg-rose-200 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Reject
                </button>
                <div className="w-px h-6 bg-aqua-300 mx-1"></div>
                <button
                  onClick={() => setSelectedSites(new Set())}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="w-12 px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedSites.size === paginatedSites.length && paginatedSites.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-aqua-500 rounded border-gray-300 focus:ring-aqua-400 cursor-pointer"
                    />
                  </th>
                  <th
                    className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-aqua-600 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    Site <SortIcon field="name" />
                  </th>
                  <th
                    className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-aqua-600 transition-colors"
                    onClick={() => handleSort('project')}
                  >
                    Project <SortIcon field="project" />
                  </th>
                  <th
                    className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-aqua-600 transition-colors"
                    onClick={() => handleSort('siteType')}
                  >
                    Type <SortIcon field="siteType" />
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Coordinates
                  </th>
                  <th
                    className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-aqua-600 transition-colors"
                    onClick={() => handleSort('qaStatus')}
                  >
                    Status <SortIcon field="qaStatus" />
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-4 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedSites.map((site: any) => (
                  <tr
                    key={site.id}
                    className={`group hover:bg-gray-50 transition-colors ${
                      selectedSites.has(site.id) ? 'bg-aqua-50' : ''
                    }`}
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedSites.has(site.id)}
                        onChange={() => toggleSelect(site.id)}
                        className="w-4 h-4 text-aqua-500 rounded border-gray-300 focus:ring-aqua-400 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <Link to={`/sites/${site.id}`} className="flex items-center gap-3 group/link">
                        <div className="w-10 h-10 bg-gradient-to-br from-aqua-400 to-aqua-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 group-hover/link:text-aqua-600 transition-colors">
                            {site.name}
                          </p>
                          <p className="text-xs text-gray-500 font-mono">{site.code}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      {site.project ? (
                        <Link
                          to={`/projects/${site.project.id}`}
                          className="text-sm text-gray-600 hover:text-aqua-600 transition-colors"
                        >
                          {site.project.name}
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-600">{site.siteType || '—'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                        {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusColor(site.qaStatus)}`}>
                        {site.qaStatus}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                          </svg>
                          {site._count?.boreholes || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          {site._count?.waterLevels || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        to={`/sites/${site.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-aqua-600 hover:text-aqua-700 transition-colors"
                      >
                        View
                        <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-gray-100 px-6 py-4">
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
      )}

      {/* Export Modal */}
      {showExportModal && (
        <ExportTools
          sites={sitesForExport}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <BulkImport
          onImport={handleBulkImport}
          onClose={() => setShowImportModal(false)}
        />
      )}
    </div>
  );
}
