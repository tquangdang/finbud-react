import { useState, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import api from '../services/api';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const fetchUser = useAuthStore((s) => s.fetchUser);

  const [form, setForm] = useState({ firstName: '', lastName: '', displayName: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) return;
    setForm({
      firstName: user.identityData?.firstName || '',
      lastName: user.identityData?.lastName || '',
      displayName: user.identityData?.displayName || '',
    });
  }, [user]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setSaving(true);
    try {
      await api.put('/users/profile', form);
      await fetchUser();
      setMessage('Profile updated');
    } catch {
      setMessage('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-color)' }}
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Not signed in</h2>
        <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Please log in to view your profile.</p>
      </div>
    );
  }

  const picture = user.identityData?.profilePicture;
  const initial = (user.identityData?.firstName?.[0] || user.email?.[0] || '?').toUpperCase();

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: 'var(--bg-secondary)' }}>
      <div className="max-w-lg mx-auto space-y-6">
        <h1
          className="text-3xl font-extrabold tracking-tight text-center"
          style={{ color: 'var(--text-primary)' }}
        >
          Profile
        </h1>

        {/* Avatar card */}
        <div
          className="rounded-xl p-6 shadow-sm flex items-center gap-5"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
        >
          {picture ? (
            <img
              src={picture}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover ring-4"
              style={{ '--tw-ring-color': 'var(--border-color)' }}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold ring-4"
              style={{
                background: 'var(--accent-color)',
                color: 'var(--bg-primary)',
                '--tw-ring-color': 'var(--border-color)',
              }}
            >
              {initial}
            </div>
          )}
          <div>
            <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {user.identityData?.displayName ||
                `${user.identityData?.firstName || ''} ${user.identityData?.lastName || ''}`.trim() ||
                'No name set'}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
          </div>
        </div>

        {/* Edit form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-xl p-6 shadow-sm space-y-5"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
        >
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Edit details</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                First name
              </label>
              <input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl outline-none transition text-sm"
                style={{
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Last name
              </label>
              <input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl outline-none transition text-sm"
                style={{
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Display name
            </label>
            <input
              name="displayName"
              value={form.displayName}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl outline-none transition text-sm"
              style={{
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              }}
            />
          </div>

          {message && (
            <div
              className={`text-sm rounded-xl px-4 py-3 ${
                message.includes('Failed')
                  ? 'text-red-600 bg-red-50 border border-red-200'
                  : 'text-green-700 bg-green-50 border border-green-200'
              }`}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 font-medium rounded-xl disabled:opacity-40 transition"
            style={{ background: 'var(--accent-color)', color: 'var(--bg-primary)' }}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
