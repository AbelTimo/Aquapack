import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { projectsApi } from '@/services/api';

interface CreateProjectForm {
  name: string;
  code: string;
  description?: string;
  client?: string;
  clientContact?: string;
  clientEmail?: string;
  clientPhone?: string;
  country?: string;
  region?: string;
  startDate?: string;
  endDate?: string;
  depthUnit: 'meters' | 'feet';
  dischargeUnit: 'l/s' | 'm3/h' | 'gpm';
  coordinateSystem: 'WGS84' | 'UTM';
  gpsAccuracyThreshold: number;
  enableBoreholes: boolean;
  enableWaterLevels: boolean;
  enablePumpTests: boolean;
  enableWaterQuality: boolean;
  enableMedia: boolean;
}

const projectColors = [
  'from-aqua-500 to-aqua-600',
  'from-violet-500 to-violet-600',
  'from-emerald-500 to-emerald-600',
  'from-orange-500 to-orange-600',
  'from-pink-500 to-pink-600',
  'from-blue-500 to-blue-600',
];

export default function ProjectsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects', search],
    queryFn: () => projectsApi.getAll({ search: search || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: projectsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['my-projects'] });
      setShowCreateModal(false);
    },
  });

  const projectsList = Array.isArray(projects?.data?.projects) ? projects.data.projects : [];
  const activeCount = projectsList.filter((p: any) => p.isActive).length;
  const totalSites = projectsList.reduce((sum: number, p: any) => sum + (p._count?.sites || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="mt-1 text-gray-500">
            Manage your hydrogeology projects
          </p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-aqua-100 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-aqua-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{projectsList.length}</p>
            <p className="text-sm text-gray-500">Total Projects</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
            <p className="text-sm text-gray-500">Active Projects</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalSites}</p>
            <p className="text-sm text-gray-500">Total Sites</p>
          </div>
        </div>
      </div>

      {/* Search & View Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative max-w-md flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="tabs p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`tab ${viewMode === 'grid' ? 'active' : ''}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`tab ${viewMode === 'list' ? 'active' : ''}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Projects */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="spinner spinner-lg text-aqua-600" />
        </div>
      ) : projectsList.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">
            <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <h3 className="empty-state-title">No projects yet</h3>
          <p className="empty-state-description">
            Get started by creating your first hydrogeology project to begin collecting field data.
          </p>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create your first project
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projectsList.map((project: any, index: number) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="card-interactive group animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Project Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${projectColors[index % projectColors.length]} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                  {project.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-aqua-600 transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-sm text-gray-500">{project.code}</p>
                </div>
                <span className={`badge ${project.isActive ? 'badge-approved' : 'badge-neutral'}`}>
                  {project.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Client */}
              {project.client && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="truncate">{project.client}</span>
                </div>
              )}

              {/* Description */}
              {project.description && (
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">{project.description}</p>
              )}

              {/* Footer */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {project._count?.sites || 0} sites
                  </div>
                  {project.region && (
                    <span className="text-sm text-gray-400">{project.region}</span>
                  )}
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-aqua-600 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Client</th>
                <th>Region</th>
                <th>Sites</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {projectsList.map((project: any, index: number) => (
                <tr key={project.id} className="animate-fade-in" style={{ animationDelay: `${index * 30}ms` }}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${projectColors[index % projectColors.length]} flex items-center justify-center text-white font-bold`}>
                        {project.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{project.name}</p>
                        <p className="text-sm text-gray-500">{project.code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-gray-600">{project.client || '-'}</td>
                  <td className="text-gray-600">{project.region || '-'}</td>
                  <td className="font-medium">{project._count?.sites || 0}</td>
                  <td>
                    <span className={`badge ${project.isActive ? 'badge-approved' : 'badge-neutral'}`}>
                      {project.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <Link to={`/projects/${project.id}`} className="btn-ghost btn-sm">
                      View
                      <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
          error={createMutation.error?.message}
        />
      )}
    </div>
  );
}

function CreateProjectModal({
  onClose,
  onSubmit,
  isLoading,
  error,
}: {
  onClose: () => void;
  onSubmit: (data: CreateProjectForm) => void;
  isLoading: boolean;
  error?: string;
}) {
  const [activeSection, setActiveSection] = useState<'basic' | 'client' | 'settings' | 'modules'>('basic');

  const { register, handleSubmit, formState: { errors } } = useForm<CreateProjectForm>({
    defaultValues: {
      depthUnit: 'meters',
      dischargeUnit: 'l/s',
      coordinateSystem: 'WGS84',
      gpsAccuracyThreshold: 10,
      enableBoreholes: true,
      enableWaterLevels: true,
      enablePumpTests: true,
      enableWaterQuality: true,
      enableMedia: true,
    }
  });

  const sections = [
    { id: 'basic', label: 'Basic', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'client', label: 'Client', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
    { id: 'modules', label: 'Modules', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  ];

  const sectionIndex = sections.findIndex(s => s.id === activeSection);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-fade-in">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="modal-overlay" onClick={onClose} />

        <div className="modal modal-xl animate-scale-in">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Header */}
            <div className="modal-header">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Create New Project</h3>
                <p className="text-sm text-gray-500 mt-1">Set up a new hydrogeology project</p>
              </div>
              <button type="button" onClick={onClose} className="btn-ghost btn-icon">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              {error && (
                <div className="alert-error mb-6">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Progress Steps */}
              <div className="flex items-center justify-between mb-8">
                {sections.map((section, index) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id as any)}
                    className="flex-1 flex flex-col items-center relative"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      index <= sectionIndex
                        ? 'bg-aqua-600 text-white'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={section.icon} />
                      </svg>
                    </div>
                    <span className={`text-xs font-medium mt-2 ${
                      activeSection === section.id ? 'text-aqua-600' : 'text-gray-500'
                    }`}>
                      {section.label}
                    </span>
                    {index < sections.length - 1 && (
                      <div className={`absolute top-5 left-1/2 w-full h-0.5 ${
                        index < sectionIndex ? 'bg-aqua-600' : 'bg-gray-200'
                      }`} style={{ transform: 'translateX(50%)' }} />
                    )}
                  </button>
                ))}
              </div>

              {/* Form Sections */}
              <div className="min-h-[300px]">
                {activeSection === 'basic' && (
                  <div className="space-y-5 animate-fade-in">
                    <div>
                      <label className="label">Project Name *</label>
                      <input
                        {...register('name', { required: 'Project name is required' })}
                        className={`input ${errors.name ? 'input-error' : ''}`}
                        placeholder="e.g., Nairobi Water Supply Project"
                      />
                      {errors.name && <p className="form-error">{errors.name.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Project Code *</label>
                        <input
                          {...register('code', {
                            required: 'Project code is required',
                            pattern: {
                              value: /^[A-Z0-9-]+$/,
                              message: 'Uppercase, numbers, dashes only',
                            },
                          })}
                          className={`input uppercase ${errors.code ? 'input-error' : ''}`}
                          placeholder="NRB-WS-2024"
                        />
                        {errors.code && <p className="form-error">{errors.code.message}</p>}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="label">Start Date</label>
                          <input {...register('startDate')} type="date" className="input" />
                        </div>
                        <div>
                          <label className="label">End Date</label>
                          <input {...register('endDate')} type="date" className="input" />
                        </div>
                      </div>
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
                )}

                {activeSection === 'client' && (
                  <div className="space-y-5 animate-fade-in">
                    <div>
                      <label className="label">Client / Organization</label>
                      <input {...register('client')} className="input" placeholder="e.g., Nairobi City County" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Contact Person</label>
                        <input {...register('clientContact')} className="input" placeholder="John Doe" />
                      </div>
                      <div>
                        <label className="label">Contact Email</label>
                        <input {...register('clientEmail')} type="email" className="input" placeholder="john@example.com" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Country</label>
                        <select {...register('country')} className="select">
                          <option value="">Select country...</option>
                          <option value="KE">Kenya</option>
                          <option value="NG">Nigeria</option>
                          <option value="ET">Ethiopia</option>
                          <option value="TZ">Tanzania</option>
                          <option value="GH">Ghana</option>
                          <option value="UG">Uganda</option>
                        </select>
                      </div>
                      <div>
                        <label className="label">Region</label>
                        <input {...register('region')} className="input" placeholder="Central Region" />
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'settings' && (
                  <div className="space-y-5 animate-fade-in">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Depth Unit</label>
                        <select {...register('depthUnit')} className="select">
                          <option value="meters">Meters (m)</option>
                          <option value="feet">Feet (ft)</option>
                        </select>
                      </div>
                      <div>
                        <label className="label">Discharge Unit</label>
                        <select {...register('dischargeUnit')} className="select">
                          <option value="l/s">Liters per second (l/s)</option>
                          <option value="m3/h">Cubic meters per hour (m³/h)</option>
                          <option value="gpm">Gallons per minute (gpm)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Coordinate System</label>
                        <select {...register('coordinateSystem')} className="select">
                          <option value="WGS84">WGS 84 (Lat/Long)</option>
                          <option value="UTM">UTM</option>
                        </select>
                      </div>
                      <div>
                        <label className="label">GPS Accuracy (m)</label>
                        <input
                          {...register('gpsAccuracyThreshold', { valueAsNumber: true })}
                          type="number"
                          min="1"
                          max="100"
                          className="input"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'modules' && (
                  <div className="space-y-3 animate-fade-in">
                    {[
                      { key: 'enableBoreholes', label: 'Borehole / Well Data', desc: 'Construction details, lithology logs' },
                      { key: 'enableWaterLevels', label: 'Water Level Measurements', desc: 'Static and dynamic water levels' },
                      { key: 'enablePumpTests', label: 'Pump Tests', desc: 'Step tests, constant rate, recovery' },
                      { key: 'enableWaterQuality', label: 'Water Quality', desc: 'pH, EC, TDS, temperature, turbidity' },
                      { key: 'enableMedia', label: 'Photos & Media', desc: 'Geotagged photos and audio notes' },
                    ].map((module) => (
                      <label key={module.key} className="flex items-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          {...register(module.key as any)}
                          type="checkbox"
                          className="checkbox"
                        />
                        <div className="ml-4">
                          <p className="font-medium text-gray-900">{module.label}</p>
                          <p className="text-sm text-gray-500">{module.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>

              <div className="flex gap-2">
                {sectionIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveSection(sections[sectionIndex - 1].id as any)}
                    className="btn-secondary"
                  >
                    Previous
                  </button>
                )}

                {sectionIndex < sections.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setActiveSection(sections[sectionIndex + 1].id as any)}
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
                        <span className="spinner spinner-sm" />
                        Creating...
                      </>
                    ) : (
                      <>
                        Create Project
                        <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
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
