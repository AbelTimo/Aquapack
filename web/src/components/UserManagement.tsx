import { useState } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'FIELD_TECH' | 'VIEWER';
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  createdAt: string;
  lastLogin?: string;
  projectCount?: number;
}

interface UserManagementProps {
  users: User[];
  currentUserId: string;
  onUpdateUser: (userId: string, updates: Partial<User>) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  onInviteUser: (email: string, role: User['role']) => Promise<void>;
  onClose: () => void;
}

const ROLE_LABELS: Record<User['role'], string> = {
  ADMIN: 'Administrator',
  MANAGER: 'Project Manager',
  FIELD_TECH: 'Field Technician',
  VIEWER: 'Viewer',
};

const ROLE_DESCRIPTIONS: Record<User['role'], string> = {
  ADMIN: 'Full access to all features and settings',
  MANAGER: 'Manage projects, sites, and approve data',
  FIELD_TECH: 'Collect field data and submit for review',
  VIEWER: 'View-only access to data and reports',
};

const STATUS_COLORS: Record<User['status'], string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  INACTIVE: 'bg-gray-100 text-gray-600',
  PENDING: 'bg-amber-100 text-amber-700',
};

export default function UserManagement({
  users,
  currentUserId,
  onUpdateUser,
  onDeleteUser,
  onInviteUser,
  onClose,
}: UserManagementProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'invite' | 'roles'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<User['role'] | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<User['status'] | 'ALL'>('ALL');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<User['role']>('FIELD_TECH');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleRoleChange = async (userId: string, newRole: User['role']) => {
    setIsUpdating(true);
    try {
      await onUpdateUser(userId, { role: newRole });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusToggle = async (user: User) => {
    setIsUpdating(true);
    try {
      await onUpdateUser(user.id, {
        status: user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (userId: string) => {
    setIsUpdating(true);
    try {
      await onDeleteUser(userId);
      setShowDeleteConfirm(null);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    try {
      await onInviteUser(inviteEmail.trim(), inviteRole);
      setInviteSuccess(true);
      setInviteEmail('');
      setTimeout(() => setInviteSuccess(false), 3000);
    } finally {
      setIsInviting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatLastLogin = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(dateString);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
              <p className="text-sm text-gray-500 mt-1">{users.length} users in the system</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 bg-gray-100 p-1 rounded-xl">
            {[
              { id: 'users', label: 'All Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
              { id: 'invite', label: 'Invite User', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
              { id: 'roles', label: 'Role Info', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-aqua-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
                  className="px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-aqua-500 focus:border-transparent"
                >
                  <option value="ALL">All Roles</option>
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-aqua-500 focus:border-transparent"
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>

              {/* User List */}
              <div className="space-y-2">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p>No users found</p>
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`p-4 border rounded-xl transition-all ${
                        selectedUser?.id === user.id ? 'border-aqua-500 bg-aqua-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="w-10 h-10 bg-gradient-to-br from-aqua-400 to-aqua-600 rounded-full flex items-center justify-center text-white font-medium">
                          {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 truncate">{user.name}</p>
                            {user.id === currentUserId && (
                              <span className="text-xs bg-aqua-100 text-aqua-700 px-2 py-0.5 rounded-full">You</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate">{user.email}</p>
                        </div>

                        {/* Role Selector */}
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as User['role'])}
                          disabled={isUpdating || user.id === currentUserId}
                          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-aqua-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {Object.entries(ROLE_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>

                        {/* Status Badge */}
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[user.status]}`}>
                          {user.status}
                        </span>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View details"
                          >
                            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                          {user.id !== currentUserId && (
                            <>
                              <button
                                onClick={() => handleStatusToggle(user)}
                                disabled={isUpdating}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                                title={user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                              >
                                <svg className={`w-4 h-4 ${user.status === 'ACTIVE' ? 'text-emerald-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={user.status === 'ACTIVE' ? 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' : 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'} />
                                </svg>
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(user.id)}
                                disabled={isUpdating}
                                className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Delete user"
                              >
                                <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {selectedUser?.id === user.id && (
                        <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Joined</p>
                            <p className="font-medium">{formatDate(user.createdAt)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Last Login</p>
                            <p className="font-medium">{formatLastLogin(user.lastLogin)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Projects</p>
                            <p className="font-medium">{user.projectCount || 0}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Role Permissions</p>
                            <p className="font-medium text-aqua-600">{ROLE_DESCRIPTIONS[user.role]}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'invite' && (
            <div className="max-w-md mx-auto">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-aqua-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-aqua-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Invite a New User</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Send an invitation email to add a new team member
                </p>
              </div>

              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-aqua-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <div className="space-y-2">
                    {(Object.entries(ROLE_LABELS) as [User['role'], string][]).map(([value, label]) => (
                      <label
                        key={value}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          inviteRole === value ? 'border-aqua-500 bg-aqua-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={value}
                          checked={inviteRole === value}
                          onChange={() => setInviteRole(value)}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          inviteRole === value ? 'border-aqua-500' : 'border-gray-300'
                        }`}>
                          {inviteRole === value && <div className="w-2 h-2 bg-aqua-500 rounded-full" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{label}</p>
                          <p className="text-xs text-gray-500">{ROLE_DESCRIPTIONS[value]}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isInviting || !inviteEmail.trim()}
                  className="w-full px-4 py-3 bg-aqua-500 text-white rounded-xl font-medium hover:bg-aqua-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isInviting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending Invitation...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Send Invitation
                    </>
                  )}
                </button>

                {inviteSuccess && (
                  <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Invitation sent successfully!
                  </div>
                )}
              </form>
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="space-y-4">
              <p className="text-gray-600 mb-6">
                Understanding roles helps you assign the right permissions to team members.
              </p>

              {(Object.entries(ROLE_LABELS) as [User['role'], string][]).map(([role, label]) => (
                <div key={role} className="p-4 border border-gray-200 rounded-xl">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${
                      role === 'ADMIN' ? 'bg-purple-100 text-purple-600' :
                      role === 'MANAGER' ? 'bg-blue-100 text-blue-600' :
                      role === 'FIELD_TECH' ? 'bg-emerald-100 text-emerald-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                          role === 'ADMIN' ? 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' :
                          role === 'MANAGER' ? 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' :
                          role === 'FIELD_TECH' ? 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' :
                          'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                        } />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{label}</h4>
                      <p className="text-sm text-gray-500 mt-1">{ROLE_DESCRIPTIONS[role]}</p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {role === 'ADMIN' && (
                          <>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Manage Users</span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">System Settings</span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">All Projects</span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Delete Data</span>
                          </>
                        )}
                        {role === 'MANAGER' && (
                          <>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Create Projects</span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Approve Data</span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Generate Reports</span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Export Data</span>
                          </>
                        )}
                        {role === 'FIELD_TECH' && (
                          <>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Add Sites</span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Record Data</span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Upload Photos</span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Submit for Review</span>
                          </>
                        )}
                        {role === 'VIEWER' && (
                          <>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">View Projects</span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">View Reports</span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Download Data</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-20">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-center text-gray-900 mb-2">Delete User?</h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                This action cannot be undone. The user will lose access to all projects and data.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  disabled={isUpdating}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {isUpdating ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
