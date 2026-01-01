import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { projectsApi } from '@/services/api';

interface CreateProjectForm {
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

export default function ProjectsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [search, setSearch] = useState('');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your hydrogeology projects
          </p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </button>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aqua-600"></div>
        </div>
      ) : projectsList.length === 0 ? (
        <div className="text-center py-12 card">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No projects</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new project.</p>
          <div className="mt-6">
            <button onClick={() => setShowCreateModal(true)} className="btn-primary">
              Create your first project
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projectsList.map((project: any) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="card hover:shadow-md hover:border-aqua-300 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-gray-900 truncate">{project.name}</h3>
                  <p className="text-sm text-gray-500">{project.code}</p>
                </div>
                <span className={`badge ${project.isActive ? 'badge-approved' : 'badge-pending'}`}>
                  {project.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {project.client && (
                <p className="mt-2 text-sm text-gray-600">Client: {project.client}</p>
              )}

              {project.description && (
                <p className="mt-2 text-sm text-gray-500 line-clamp-2">{project.description}</p>
              )}

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  {project._count?.sites || 0} sites
                </span>
                <span className="text-aqua-600 font-medium">View details</span>
              </div>
            </Link>
          ))}
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

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CreateProjectForm>({
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
    { id: 'basic', label: 'Basic Info', icon: '📋' },
    { id: 'client', label: 'Client & Location', icon: '👤' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    { id: 'modules', label: 'Modules', icon: '📦' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Create New Project</h3>
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
                      <p className="mt-1 text-xs text-gray-500">Unique identifier (uppercase, numbers, dashes)</p>
                      {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>}
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
                    <p className="text-sm text-blue-700">Enter details about the project client/sponsor</p>
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
                    <p className="text-sm text-green-700">Select which data collection modules to enable for this project</p>
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
            <div className="bg-gray-50 px-4 py-4 sm:px-6 flex items-center justify-between">
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
                        Creating...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Create Project
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
