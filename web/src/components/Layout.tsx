import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { isDemoMode } from '@/services/mockApi';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Projects', href: '/projects', icon: FolderIcon },
  { name: 'Sites', href: '/sites', icon: MapPinIcon },
  { name: 'Settings', href: '/settings', icon: SettingsIcon },
];

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const { user } = useAuthStore();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sample notifications for demo
  const notifications = [
    { id: 1, type: 'pending', title: 'New site pending review', message: 'Site BH-2024-015 needs QA review', time: '5 min ago', unread: true },
    { id: 2, type: 'flagged', title: 'Site flagged for issues', message: 'Site WL-2024-008 has data quality issues', time: '1 hour ago', unread: true },
    { id: 3, type: 'approved', title: 'Site approved', message: 'Site BH-2024-012 was approved by Admin', time: '3 hours ago', unread: false },
    { id: 4, type: 'sync', title: 'Sync completed', message: '5 sites synced from mobile app', time: 'Yesterday', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;
  const navigate = useNavigate();
  const location = useLocation();
  const demoMode = isDemoMode();

  // Get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/projects/') && path !== '/projects') return 'Project Details';
    if (path.startsWith('/sites/') && path !== '/sites') return 'Site Details';
    const currentNav = navigation.find(n => n.href === path);
    return currentNav?.name || 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo mode banner */}
      {demoMode && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center py-2 text-sm font-medium shadow-md">
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Demo Mode - Using sample data. Changes won't persist.
          </div>
        </div>
      )}

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 z-40 w-72 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${demoMode ? 'top-10 h-[calc(100%-2.5rem)]' : 'inset-y-0 h-full'}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-gray-100">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity" onClick={() => setSidebarOpen(false)}>
              <div className="w-10 h-10 bg-gradient-to-br from-aqua-500 to-aqua-700 rounded-xl flex items-center justify-center shadow-lg shadow-aqua-500/30">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">Aquapack</span>
                <p className="text-xs text-gray-500">Field Data Management</p>
              </div>
            </Link>
          </div>

          {/* Search (optional) */}
          <div className="px-4 py-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-aqua-500/20 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
            <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Menu</p>
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `nav-item group ${isActive ? 'active' : ''}`
                }
              >
                <item.icon className="nav-item-icon" />
                <span className="flex-1">{item.name}</span>
                {item.name === 'Sites' && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                    3
                  </span>
                )}
              </NavLink>
            ))}

          </nav>

          {/* Quick Stats */}
          <div className="px-4 py-4 border-t border-gray-100">
            <div className="bg-gradient-to-br from-aqua-50 to-aqua-100 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-aqua-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-aqua-600 font-medium">This Week</p>
                  <p className="text-lg font-bold text-aqua-900">12 Sites</p>
                </div>
              </div>
              <div className="w-full bg-aqua-200 rounded-full h-1.5">
                <div className="bg-aqua-600 h-1.5 rounded-full" style={{ width: '75%' }}></div>
              </div>
              <p className="text-xs text-aqua-700 mt-2">75% reviewed</p>
            </div>
          </div>

          {/* User info and Sign Out (Mobile) */}
          <div className="px-4 py-4 border-t border-gray-100 lg:hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="avatar-md">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                useAuthStore.setState({ user: null, tokens: null, isAuthenticated: false, isLoading: false });
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = window.location.pathname.includes('/Aquapack') ? '/Aquapack/#/login' : '/#/login';
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors cursor-pointer"
            >
              <LogoutIcon className="w-4 h-4" />
              Sign Out
            </button>
          </div>

        </div>
      </aside>

      {/* Main content */}
      <div className={`lg:pl-72 min-h-screen ${demoMode ? 'pt-10' : ''}`}>
        {/* Top bar */}
        <header className={`sticky z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 ${demoMode ? 'top-10' : 'top-0'}`}>
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Page title */}
            <div className="hidden lg:block">
              <h1 className="text-xl font-semibold text-gray-900">{getPageTitle()}</h1>
            </div>
            <span className="lg:hidden text-lg font-semibold text-gray-900">Aquapack</span>

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <div ref={notificationsRef} className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNotifications(!showNotifications);
                    setShowUserMenu(false);
                  }}
                  className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <BellIcon className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute -right-2 sm:right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-sm bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-50 animate-slide-down">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="text-xs font-medium text-aqua-600 bg-aqua-50 px-2 py-1 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((notification) => (
                        <button
                          key={notification.id}
                          onClick={() => {
                            setShowNotifications(false);
                            navigate('/sites');
                          }}
                          className={`w-full p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                            notification.unread ? 'bg-aqua-50/50' : ''
                          }`}
                        >
                          <div className="flex gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              notification.type === 'pending' ? 'bg-amber-100' :
                              notification.type === 'flagged' ? 'bg-rose-100' :
                              notification.type === 'approved' ? 'bg-emerald-100' :
                              'bg-aqua-100'
                            }`}>
                              {notification.type === 'pending' && (
                                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                              {notification.type === 'flagged' && (
                                <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                              )}
                              {notification.type === 'approved' && (
                                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                              {notification.type === 'sync' && (
                                <svg className="w-5 h-5 text-aqua-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${notification.unread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5 truncate">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                            </div>
                            {notification.unread && (
                              <div className="w-2 h-2 bg-aqua-500 rounded-full flex-shrink-0 mt-2"></div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="p-3 border-t border-gray-100 bg-gray-50">
                      <button
                        onClick={() => {
                          setShowNotifications(false);
                          navigate('/sites?status=PENDING');
                        }}
                        className="w-full text-center text-sm font-medium text-aqua-600 hover:text-aqua-700"
                      >
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User avatar (desktop) */}
              <div ref={userMenuRef} className="hidden lg:block relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUserMenu(!showUserMenu);
                    setShowNotifications(false);
                  }}
                  className="flex items-center gap-3 pl-4 border-l border-gray-200 hover:bg-gray-50 rounded-xl p-2 -m-2 transition-colors"
                >
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <div className="avatar-md">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* User Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-50 animate-slide-down">
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                      <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
                      <span className="inline-block mt-2 text-xs font-medium text-aqua-600 bg-aqua-50 px-2 py-0.5 rounded-full capitalize">
                        {user?.role?.toLowerCase().replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="py-2">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          navigate('/settings');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <SettingsIcon className="w-4 h-4 text-gray-400" />
                        Account Settings
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          setShowHelpModal(true);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Help & Support
                      </button>
                    </div>
                    <div className="border-t border-gray-100 py-2">
                      <a
                        href="/login"
                        onClick={(e) => {
                          e.preventDefault();
                          useAuthStore.setState({ user: null, tokens: null, isAuthenticated: false, isLoading: false });
                          localStorage.clear();
                          sessionStorage.clear();
                          window.location.href = window.location.pathname.includes('/Aquapack') ? '/Aquapack/#/login' : '/#/login';
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 bg-red-50/50 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <LogoutIcon className="w-4 h-4" />
                        Sign Out
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8 animate-fade-in">
          <Outlet />
        </main>
      </div>

      {/* Help & Support Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
            onClick={() => setShowHelpModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-aqua-500 to-aqua-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Help & Support</h2>
                  <p className="text-sm text-aqua-100">We're here to help</p>
                </div>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* FAQs */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Frequently Asked Questions</h3>
                <div className="space-y-3">
                  <details className="group bg-gray-50 rounded-xl">
                    <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                      <span className="text-sm font-medium text-gray-700">How do I add a new site?</span>
                      <svg className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <p className="px-4 pb-4 text-sm text-gray-600">Navigate to Sites page and click the "Add Site" button. Fill in the required information including location, coordinates, and site details.</p>
                  </details>
                  <details className="group bg-gray-50 rounded-xl">
                    <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                      <span className="text-sm font-medium text-gray-700">How does offline sync work?</span>
                      <svg className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <p className="px-4 pb-4 text-sm text-gray-600">Data collected in the mobile app is stored locally and syncs automatically when you have an internet connection. You can also manually trigger a sync from the mobile app.</p>
                  </details>
                  <details className="group bg-gray-50 rounded-xl">
                    <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                      <span className="text-sm font-medium text-gray-700">How do I export data?</span>
                      <svg className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <p className="px-4 pb-4 text-sm text-gray-600">Go to the Site Detail page and use the export options to download data as CSV, GeoJSON, or generate PDF reports.</p>
                  </details>
                  <details className="group bg-gray-50 rounded-xl">
                    <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                      <span className="text-sm font-medium text-gray-700">What do the site status colors mean?</span>
                      <svg className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <p className="px-4 pb-4 text-sm text-gray-600">
                      <span className="font-medium">Pending:</span> Awaiting review. <span className="font-medium">Approved:</span> Data verified. <span className="font-medium">Flagged:</span> Needs attention. <span className="font-medium">Draft:</span> Incomplete entry.
                    </p>
                  </details>
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact Us</h3>
                <div className="space-y-3">
                  <a href="mailto:support@aquapack.io" className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="w-10 h-10 bg-aqua-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-aqua-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email Support</p>
                      <p className="text-xs text-gray-500">support@aquapack.io</p>
                    </div>
                  </a>
                  <a href="tel:+1234567890" className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Phone Support</p>
                      <p className="text-xs text-gray-500">+1 (234) 567-890</p>
                    </div>
                  </a>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-center text-gray-500">Aquapack v1.0.0 - Field Data Management System</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
