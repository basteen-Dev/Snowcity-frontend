import React from 'react';
import adminApi from '../../services/adminApi';

export default function AdminProfile() {
  const [profileState, setProfileState] = React.useState({
    status: 'loading',
    error: null,
    form: { name: '', email: '', phone: '' },
    saving: false
  });

  const [passwordState, setPasswordState] = React.useState({
    form: { currentPassword: '', newPassword: '', confirmPassword: '' },
    saving: false,
    error: null,
    success: null
  });

  React.useEffect(() => {
    (async () => {
      try {
        // Use admin-specific profile endpoint
        const res = await adminApi.get('/api/admin/auth/profile');
        const u = res?.user || {};
        setProfileState((s) => ({
          ...s,
          status: 'idle',
          form: { name: u.name || '', email: u.email || '', phone: u.phone || '' }
        }));
      } catch (err) {
        setProfileState((s) => ({ ...s, status: 'failed', error: err }));
      }
    })();
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileState((s) => ({ ...s, saving: true }));
    try {
      await adminApi.patch('/api/users/me', profileState.form);
      alert('Profile updated successfully');
    } catch (err) {
      alert(err?.message || 'Update failed');
    } finally {
      setProfileState((s) => ({ ...s, saving: false }));
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPasswordState((s) => ({ ...s, saving: true, error: null, success: null }));

    const { currentPassword, newPassword, confirmPassword } = passwordState.form;

    // Validation
    if (!currentPassword) {
      setPasswordState((s) => ({ ...s, saving: false, error: 'Current password is required' }));
      return;
    }

    if (!newPassword) {
      setPasswordState((s) => ({ ...s, saving: false, error: 'New password is required' }));
      return;
    }

    if (newPassword.length < 8) {
      setPasswordState((s) => ({ ...s, saving: false, error: 'Password must be at least 8 characters long' }));
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordState((s) => ({ ...s, saving: false, error: 'New passwords do not match' }));
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordState((s) => ({ ...s, saving: false, error: 'New password must be different from current password' }));
      return;
    }

    try {
      await adminApi.post('/api/admin/auth/change-password', {
        currentPassword,
        newPassword
      });

      setPasswordState((s) => ({
        ...s,
        saving: false,
        success: 'Password changed successfully',
        form: { currentPassword: '', newPassword: '', confirmPassword: '' }
      }));
    } catch (err) {
      setPasswordState((s) => ({
        ...s,
        saving: false,
        error: err?.message || 'Failed to change password'
      }));
    }
  };

  const updatePasswordForm = (field, value) => {
    setPasswordState((s) => ({
      ...s,
      form: { ...s.form, [field]: value },
      error: null,
      success: null
    }));
  };

  if (profileState.status === 'loading') return <div className="p-6 text-center">Loading profile...</div>;
  if (profileState.status === 'failed') {
    return (
      <div className="p-6">
        <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
          {profileState.error?.message || 'Failed to load profile'}
        </div>
      </div>
    );
  }

  const profileForm = profileState.form;
  const passwordForm = passwordState.form;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your profile and security settings</p>
      </div>

      {/* Profile Information */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Information</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Update your personal information</p>
        </div>

        <form onSubmit={saveProfile} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-colors"
                value={profileForm.name}
                onChange={(e) => setProfileState((s) => ({
                  ...s,
                  form: { ...s.form, name: e.target.value }
                }))}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-colors"
                value={profileForm.email}
                onChange={(e) => setProfileState((s) => ({
                  ...s,
                  form: { ...s.form, email: e.target.value }
                }))}
                placeholder="Enter your email address"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone Number
              </label>
              <input
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-colors"
                value={profileForm.phone}
                onChange={(e) => setProfileState((s) => ({
                  ...s,
                  form: { ...s.form, phone: e.target.value }
                }))}
                placeholder="Enter your phone number"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={profileState.saving}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed"
            >
              {profileState.saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Password Change */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Change Password</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Update your account password</p>
        </div>

        <form onSubmit={changePassword} className="p-6">
          {passwordState.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{passwordState.error}</p>
            </div>
          )}

          {passwordState.success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">{passwordState.success}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Current Password
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-colors"
                value={passwordForm.currentPassword}
                onChange={(e) => updatePasswordForm('currentPassword', e.target.value)}
                placeholder="Enter your current password"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  New Password
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-colors"
                  value={passwordForm.newPassword}
                  onChange={(e) => updatePasswordForm('newPassword', e.target.value)}
                  placeholder="Enter new password"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Must be at least 8 characters long
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-colors"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => updatePasswordForm('confirmPassword', e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={passwordState.saving}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed"
            >
              {passwordState.saving ? 'Changing Password...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}