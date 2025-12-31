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

  // Safely extract projects array
  const projectsList = Array.isArray(projects?.data?.projects)
    ? projects.data.projects
    : [];

  // Safely extract sites array and calculate stats
  const sitesList = Array.isArray(sites?.data?.sites) ? sites.data.sites : [];
  const pendingCount = sitesList.filter((s: any) => s.qaStatus === 'PENDING').length;
  const flaggedCount = sitesList.filter((s: any) => s.qaStatus === 'FLAGGED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back, {user?.name}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="My Projects"
          value={projectsList.length}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          }
          color="bg-blue-500"
        />
        <StatCard
          title="Total Sites"
          value={projectsList.reduce((acc: number, p: any) => acc + (p._count?.sites || 0), 0)}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          color="bg-green-500"
        />
        <StatCard
          title="Pending Review"
          value={pendingCount}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          color="bg-yellow-500"
          href="/sites?status=PENDING"
        />
        <StatCard
          title="Flagged"
          value={flaggedCount}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
          }
          color="bg-red-500"
          href="/sites?status=FLAGGED"
        />
      </div>

      {/* Projects List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">My Projects</h2>
          <Link to="/projects" className="text-sm font-medium text-aqua-600 hover:text-aqua-500">
            View all
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aqua-600"></div>
          </div>
        ) : projectsList.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No projects</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new project.</p>
            <div className="mt-6">
              <Link to="/projects" className="btn-primary">
                Create Project
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {projectsList.slice(0, 5).map((project: any) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:border-aqua-300 hover:bg-aqua-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{project.name}</h3>
                    <p className="text-sm text-gray-500">{project.code}</p>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{project._count?.sites || 0} sites</span>
                    <span className={`badge ${project.isActive ? 'badge-approved' : 'badge-pending'}`}>
                      {project.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <QuickAction
          title="Add New Site"
          description="Create a new site record with GPS coordinates"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
          href="/sites"
        />
        <QuickAction
          title="Review Data"
          description="Review and approve pending field submissions"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          }
          href="/sites?status=PENDING"
        />
        <QuickAction
          title="Generate Report"
          description="Create PDF reports from project data"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          href="/projects"
        />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
  href,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-center">
      <div className={`flex-shrink-0 p-3 rounded-lg ${color}`}>
        <div className="text-white">{icon}</div>
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link to={href} className="card hover:border-aqua-300 hover:shadow-md transition-all">
        {content}
      </Link>
    );
  }

  return <div className="card">{content}</div>;
}

function QuickAction({
  title,
  description,
  icon,
  href,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      to={href}
      className="card hover:border-aqua-300 hover:shadow-md transition-all group"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 p-2 bg-aqua-100 rounded-lg text-aqua-600 group-hover:bg-aqua-200 transition-colors">
          {icon}
        </div>
        <div className="ml-4">
          <h3 className="text-sm font-medium text-gray-900 group-hover:text-aqua-700">{title}</h3>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </Link>
  );
}
