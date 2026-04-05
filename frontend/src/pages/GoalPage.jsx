import { useState, useEffect } from 'react';
import api from '../services/api';

const emptyForm = {
  title: '',
  targetAmount: '',
  currentAmount: '',
  startDate: '',
  endDate: '',
  category: '',
};

function toDateInput(iso) {
  if (!iso) return '';
  return iso.slice(0, 10);
}

function pct(current, target) {
  if (!target) return 0;
  return Math.min(Math.round((current / target) * 100), 100);
}

export default function GoalPage() {
  const [goals, setGoals] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const fetchGoals = async () => {
    try {
      const res = await api.get('/goals');
      setGoals(res.data);
    } catch {
      setError('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/goals', {
        ...form,
        targetAmount: Number(form.targetAmount),
        currentAmount: Number(form.currentAmount) || 0,
      });
      setForm(emptyForm);
      setShowForm(false);
      fetchGoals();
    } catch {
      setError('Failed to create goal');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/goals/${id}`);
      fetchGoals();
    } catch {
      setError('Failed to delete goal');
    }
  };

  const handleUpdateAmount = async (id, value) => {
    try {
      await api.put(`/goals/${id}`, { currentAmount: Number(value) });
      fetchGoals();
    } catch {
      setError('Failed to update goal');
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

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: 'var(--bg-secondary)' }}>
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between" data-aos="fade-down">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Your Goals
            </h1>
            <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
              Track your financial milestones
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="px-5 py-2.5 text-sm font-medium rounded-xl transition"
            style={{ background: 'var(--accent-color)', color: 'var(--bg-primary)' }}
          >
            {showForm ? 'Cancel' : '+ New Goal'}
          </button>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Create form */}
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="rounded-xl p-6 shadow-sm space-y-4"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
            }}
            data-aos="fade-up"
          >
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>New Goal</h2>
            <input
              name="title"
              placeholder="Goal title"
              value={form.title}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl outline-none transition text-sm"
              style={{
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              }}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Target amount
                </label>
                <input
                  name="targetAmount"
                  type="number"
                  min="1"
                  placeholder="$10,000"
                  value={form.targetAmount}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl outline-none transition text-sm"
                  style={{
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                  }}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Current amount
                </label>
                <input
                  name="currentAmount"
                  type="number"
                  min="0"
                  placeholder="$0"
                  value={form.currentAmount}
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
                  Start date
                </label>
                <input
                  name="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl outline-none transition text-sm"
                  style={{
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                  }}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  End date
                </label>
                <input
                  name="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl outline-none transition text-sm"
                  style={{
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                  }}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Category
              </label>
              <input
                name="category"
                placeholder="e.g. Savings, Investment, Debt"
                value={form.category}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl outline-none transition text-sm"
                style={{
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                }}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 font-medium rounded-xl transition"
              style={{ background: 'var(--accent-color)', color: 'var(--bg-primary)' }}
            >
              Create Goal
            </button>
          </form>
        )}

        {/* Goals list */}
        {goals.length === 0 ? (
          <div className="text-center py-16" data-aos="fade-up">
            <div className="text-5xl mb-4">🎯</div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>No goals yet</h2>
            <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
              Create your first financial goal to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map((g) => {
              const progress = pct(g.currentAmount, g.targetAmount);
              return (
                <div
                  key={g._id}
                  className="rounded-xl p-6 shadow-sm hover:shadow-md transition space-y-4"
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                  }}
                  data-aos="fade-up"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {g.title}
                      </h2>
                      <span
                        className="inline-block mt-1 text-xs font-medium px-2.5 py-0.5 rounded-full"
                        style={{
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {g.category}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(g._id)}
                      className="text-sm transition"
                      style={{ color: 'var(--text-secondary)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                      Delete
                    </button>
                  </div>

                  {/* Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        ${g.currentAmount.toLocaleString()}{' '}
                        <span style={{ color: 'var(--text-secondary)' }}>
                          / ${g.targetAmount.toLocaleString()}
                        </span>
                      </span>
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {progress}%
                      </span>
                    </div>
                    <div
                      className="w-full h-1.5 rounded-full overflow-hidden"
                      style={{ background: 'var(--bg-secondary)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${progress}%`, background: 'var(--accent-color)' }}
                      />
                    </div>
                  </div>

                  {/* Update */}
                  <div className="flex items-center gap-3">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const val = e.target.elements.amount.value;
                        if (val !== '') handleUpdateAmount(g._id, val);
                        e.target.reset();
                      }}
                      className="flex gap-2 flex-1"
                    >
                      <input
                        name="amount"
                        type="number"
                        min="0"
                        placeholder="Update current amount"
                        className="flex-1 px-4 py-2 rounded-xl text-sm outline-none transition"
                        style={{
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-color)',
                        }}
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium rounded-xl transition"
                        style={{
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                          background: 'var(--card-bg)',
                        }}
                      >
                        Update
                      </button>
                    </form>
                  </div>

                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {toDateInput(g.startDate)} &rarr; {toDateInput(g.endDate)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
