import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services/api';

interface ProfileForm {
  name: string;
  email: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'preferences'>('profile');
  const [successMessage, setSuccessMessage] = useState('');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'profile', label: 'Profile' },
            { id: 'password', label: 'Password' },
            { id: 'preferences', label: 'Preferences' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setSuccessMessage('');
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-aqua-500 text-aqua-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {successMessage}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <ProfileSection
          user={user}
          onSuccess={(message) => setSuccessMessage(message)}
        />
      )}

      {activeTab === 'password' && (
        <PasswordSection onSuccess={(message) => setSuccessMessage(message)} />
      )}

      {activeTab === 'preferences' && <PreferencesSection />}
    </div>
  );
}

function ProfileSection({
  user,
  onSuccess,
}: {
  user: any;
  onSuccess: (message: string) => void;
}) {
  const { setUser } = useAuthStore();
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      // In demo mode, just update local state
      return { data: { user: { ...user, ...data } } };
    },
    onSuccess: (response) => {
      setUser(response.data.user);
      onSuccess('Profile updated successfully');
    },
  });

  return (
    <div className="card">
      <h2 className="text-lg font-medium text-gray-900 mb-6">Profile Information</h2>
      <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center space-x-6">
          <div className="w-20 h-20 rounded-full bg-aqua-100 flex items-center justify-center">
            <span className="text-3xl font-bold text-aqua-700">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">{user?.name}</h3>
            <p className="text-sm text-gray-500">{user?.role}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="label">Full Name</label>
            <input
              {...register('name', { required: 'Name is required' })}
              className="input"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="label">Email Address</label>
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
              type="email"
              className="input"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!isDirty || updateMutation.isPending}
            className="btn-primary"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

function PasswordSection({ onSuccess }: { onSuccess: (message: string) => void }) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PasswordForm>();

  const newPassword = watch('newPassword');

  const updateMutation = useMutation({
    mutationFn: async (data: PasswordForm) => {
      // In demo mode, just simulate success
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      reset();
      onSuccess('Password updated successfully');
    },
  });

  return (
    <div className="card">
      <h2 className="text-lg font-medium text-gray-900 mb-6">Change Password</h2>
      <form
        onSubmit={handleSubmit((data) => updateMutation.mutate(data))}
        className="space-y-6 max-w-md"
      >
        <div>
          <label className="label">Current Password</label>
          <input
            {...register('currentPassword', { required: 'Current password is required' })}
            type="password"
            className="input"
          />
          {errors.currentPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.currentPassword.message}</p>
          )}
        </div>

        <div>
          <label className="label">New Password</label>
          <input
            {...register('newPassword', {
              required: 'New password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters',
              },
            })}
            type="password"
            className="input"
          />
          {errors.newPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>
          )}
        </div>

        <div>
          <label className="label">Confirm New Password</label>
          <input
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (value) => value === newPassword || 'Passwords do not match',
            })}
            type="password"
            className="input"
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={updateMutation.isPending} className="btn-primary">
            {updateMutation.isPending ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  );
}

function PreferencesSection() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    weekly: true,
  });

  const [theme, setTheme] = useState('light');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // In demo mode, just show success
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Notifications</h2>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Email Notifications</p>
              <p className="text-sm text-gray-500">Receive email updates about your projects</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.email}
              onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
              className="h-5 w-5 text-aqua-600 rounded border-gray-300 focus:ring-aqua-500"
            />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Push Notifications</p>
              <p className="text-sm text-gray-500">Receive push notifications in browser</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.push}
              onChange={(e) => setNotifications({ ...notifications, push: e.target.checked })}
              className="h-5 w-5 text-aqua-600 rounded border-gray-300 focus:ring-aqua-500"
            />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Weekly Digest</p>
              <p className="text-sm text-gray-500">Receive a weekly summary of activity</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.weekly}
              onChange={(e) => setNotifications({ ...notifications, weekly: e.target.checked })}
              className="h-5 w-5 text-aqua-600 rounded border-gray-300 focus:ring-aqua-500"
            />
          </label>
        </div>
      </div>

      {/* Appearance */}
      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Appearance</h2>
        <div>
          <label className="label">Theme</label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="input w-48"
          >
            <option value="light">Light</option>
            <option value="dark">Dark (Coming Soon)</option>
            <option value="system">System</option>
          </select>
        </div>
      </div>

      {/* Data & Privacy */}
      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Data & Privacy</h2>
        <div className="space-y-4">
          <button
            onClick={() => {
              // Generate sample export data
              const exportData = {
                exportDate: new Date().toISOString(),
                user: { name: 'Demo User', email: 'demo@aquapack.com' },
                message: 'This is a demo export. In production, this would contain all your projects, sites, and measurements.',
              };
              const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'aquapack-data-export.json';
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="btn-secondary"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export My Data
          </button>
          <p className="text-sm text-gray-500">
            Download a copy of all your data including projects, sites, and measurements.
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button onClick={handleSave} className="btn-primary">
          {saved ? 'Saved!' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}
