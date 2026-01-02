import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { projectsApi, sitesApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['my-projects'],
    queryFn: projectsApi.getMyProjects,
  });

  const { data: sites } = useQuery({
    queryKey: ['all-sites'],
    queryFn: () => sitesApi.getAll({}),
  });

  const projectsList = Array.isArray(projects?.data?.projects) ? projects.data.projects : [];
  const sitesList = Array.isArray(sites?.data?.sites) ? sites.data.sites : [];

  const pendingCount = sitesList.filter((s: any) => s.qaStatus === 'PENDING').length;
  const flaggedCount = sitesList.filter((s: any) => s.qaStatus === 'FLAGGED').length;
  const approvedCount = sitesList.filter((s: any) => s.qaStatus === 'APPROVED').length;
  const totalSites = sitesList.length;
  const activeProjects = projectsList.filter((p: any) => p.isActive).length;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-aqua-400 to-aqua-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-aqua-500/20">
              {getInitials(user?.name || '')}
            </div>
            <div>
              <p className="text-sm text-gray-500">{getGreeting()}</p>
              <h1 className="text-2xl font-bold text-gray-900">{user?.name || 'Welcome'}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/sites"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              View Sites
            </Link>
            <Link
              to="/projects"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-aqua-500 text-white font-medium rounded-xl hover:bg-aqua-600 transition-colors shadow-lg shadow-aqua-500/20"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Project
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-12 gap-5">
        {/* Main Stats Card */}
        <div className="col-span-12 lg:col-span-8 bg-gradient-to-br from-aqua-500 via-aqua-600 to-aqua-700 rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }} />
          </div>
          <div className="relative">
            <h2 className="text-lg font-medium text-aqua-100 mb-6">Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center md:text-left">
                <p className="text-5xl font-bold">{activeProjects}</p>
                <p className="text-aqua-100 mt-1">Active Projects</p>
              </div>
              <div className="text-center md:text-left">
                <p className="text-5xl font-bold">{totalSites}</p>
                <p className="text-aqua-100 mt-1">Total Sites</p>
              </div>
              <div className="text-center md:text-left">
                <p className="text-5xl font-bold">{approvedCount}</p>
                <p className="text-aqua-100 mt-1">Approved</p>
              </div>
              <div className="text-center md:text-left">
                <p className="text-5xl font-bold">{pendingCount + flaggedCount}</p>
                <p className="text-aqua-100 mt-1">Need Review</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Status Cards */}
        <div className="col-span-12 lg:col-span-4 grid grid-rows-2 gap-5">
          <Link
            to="/sites?status=PENDING"
            className="bg-white rounded-2xl p-5 shadow-sm border-2 border-transparent hover:border-amber-300 hover:shadow-lg transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold text-amber-500">{pendingCount}</p>
                <p className="text-gray-600 font-medium mt-1">Pending Review</p>
              </div>
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Link>
          <Link
            to="/sites?status=FLAGGED"
            className="bg-white rounded-2xl p-5 shadow-sm border-2 border-transparent hover:border-rose-300 hover:shadow-lg transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold text-rose-500">{flaggedCount}</p>
                <p className="text-gray-600 font-medium mt-1">Flagged Issues</p>
              </div>
              <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* Projects List */}
        <div className="col-span-12 lg:col-span-7 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Your Projects</h2>
              <p className="text-sm text-gray-500 mt-0.5">{projectsList.length} total projects</p>
            </div>
            <Link to="/projects" className="text-sm font-semibold text-aqua-600 hover:text-aqua-700 flex items-center gap-1">
              View All
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 border-4 border-aqua-200 border-t-aqua-500 rounded-full animate-spin"></div>
            </div>
          ) : projectsList.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="w-20 h-20 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">No projects yet</h3>
              <p className="text-gray-500 mt-1 mb-6">Create your first hydrogeology project</p>
              <Link to="/projects" className="inline-flex items-center gap-2 px-5 py-2.5 bg-aqua-500 text-white font-medium rounded-xl hover:bg-aqua-600 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Project
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {projectsList.slice(0, 5).map((project: any, index: number) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="flex items-center p-4 hover:bg-gray-50 transition-colors group"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg bg-gradient-to-br ${
                    ['from-aqua-400 to-aqua-500', 'from-violet-400 to-violet-500', 'from-emerald-400 to-emerald-500', 'from-orange-400 to-orange-500', 'from-pink-400 to-pink-500'][index % 5]
                  }`}>
                    {project.name.charAt(0)}
                  </div>
                  <div className="ml-4 flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate group-hover:text-aqua-600 transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">{project.region || project.code}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{project._count?.sites || 0}</p>
                      <p className="text-xs text-gray-500">sites</p>
                    </div>
                    <div className={`w-2.5 h-2.5 rounded-full ${project.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-aqua-600 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="col-span-12 lg:col-span-5 space-y-5">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <ActionButton
                href="/sites"
                icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>}
                label="View Sites"
                color="aqua"
              />
              <ActionButton
                href="/sites?status=PENDING"
                icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
                label="Review"
                color="amber"
              />
              <ActionButton
                href="/projects"
                icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                label="Projects"
                color="violet"
              />
              <ActionButton
                href="/settings"
                icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                label="Settings"
                color="gray"
              />
            </div>
          </div>

          {/* Site Status Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Site Status</h2>
            <div className="flex items-center justify-center py-4">
              <div className="relative">
                <svg className="w-36 h-36 transform -rotate-90">
                  <circle cx="72" cy="72" r="60" fill="none" stroke="#f3f4f6" strokeWidth="12" />
                  {totalSites > 0 && (
                    <>
                      <circle
                        cx="72" cy="72" r="60" fill="none"
                        stroke="#10b981" strokeWidth="12"
                        strokeDasharray={`${(approvedCount / totalSites) * 377} 377`}
                        strokeLinecap="round"
                      />
                      <circle
                        cx="72" cy="72" r="60" fill="none"
                        stroke="#f59e0b" strokeWidth="12"
                        strokeDasharray={`${(pendingCount / totalSites) * 377} 377`}
                        strokeDashoffset={`-${(approvedCount / totalSites) * 377}`}
                        strokeLinecap="round"
                      />
                      <circle
                        cx="72" cy="72" r="60" fill="none"
                        stroke="#ef4444" strokeWidth="12"
                        strokeDasharray={`${(flaggedCount / totalSites) * 377} 377`}
                        strokeDashoffset={`-${((approvedCount + pendingCount) / totalSites) * 377}`}
                        strokeLinecap="round"
                      />
                    </>
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-3xl font-bold text-gray-900">{totalSites}</p>
                  <p className="text-sm text-gray-500">Total</p>
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-5 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-sm text-gray-600">Approved ({approvedCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-sm text-gray-600">Pending ({pendingCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="text-sm text-gray-600">Flagged ({flaggedCount})</span>
              </div>
            </div>
          </div>

          {/* Tip Card */}
          <div className="bg-gradient-to-r from-violet-500 to-indigo-500 rounded-2xl p-5 text-white">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Pro Tip</h3>
                <p className="text-violet-100 text-sm mt-1">
                  Use the mobile app to capture GPS coordinates and field data directly on-site.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  href,
  icon,
  label,
  color,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  color: 'aqua' | 'amber' | 'violet' | 'gray';
}) {
  const colorClasses = {
    aqua: 'bg-aqua-50 text-aqua-600 hover:bg-aqua-100 hover:shadow-md',
    amber: 'bg-amber-50 text-amber-600 hover:bg-amber-100 hover:shadow-md',
    violet: 'bg-violet-50 text-violet-600 hover:bg-violet-100 hover:shadow-md',
    gray: 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:shadow-md',
  };

  return (
    <Link
      to={href}
      className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all ${colorClasses[color]}`}
    >
      {icon}
      <span className="text-sm font-medium mt-2">{label}</span>
    </Link>
  );
}
