import { useEffect } from 'react';
import useNotiStore from '../store/useNotiStore';

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationPage() {
  const notis = useNotiStore((s) => s.notis);
  const unreadCount = useNotiStore((s) => s.unreadCount);
  const loading = useNotiStore((s) => s.loading);
  const fetchNotis = useNotiStore((s) => s.fetchNotis);
  const markRead = useNotiStore((s) => s.markRead);
  const markAllRead = useNotiStore((s) => s.markAllRead);
  const deleteNoti = useNotiStore((s) => s.deleteNoti);

  useEffect(() => {
    fetchNotis();
  }, [fetchNotis]);

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
    <div className="min-h-[calc(100vh-64px)] py-12 px-4" style={{ background: 'var(--bg-secondary)' }}>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Notifications
            </h1>
            <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="px-4 py-2 text-sm font-medium rounded-xl transition"
              style={{
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                background: 'var(--card-bg)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover-bg)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--card-bg)'; }}
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Notifications list */}
        {notis.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔔</div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>No notifications</h2>
            <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
              You&apos;re all caught up! Check back later.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notis.map((n) => (
              <div
                key={n._id}
                className="rounded-2xl p-5 transition shadow-sm"
                style={{
                  background: n.isRead ? 'var(--card-bg)' : 'var(--hover-bg)',
                  border: '1px solid var(--border-color)',
                  borderLeft: n.isRead
                    ? '1px solid var(--border-color)'
                    : '3px solid var(--accent-color)',
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="pt-1.5 shrink-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: n.isRead ? 'transparent' : 'var(--accent-color)' }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <h3
                        className={`text-sm ${n.isRead ? 'font-medium' : 'font-semibold'}`}
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {n.title}
                      </h3>
                      <span
                        className="text-xs shrink-0 whitespace-nowrap"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {n.content}
                    </p>

                    <div className="flex items-center gap-2 mt-3">
                      {!n.isRead && (
                        <button
                          type="button"
                          onClick={() => markRead(n._id)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg transition"
                          style={{ background: 'var(--accent-color)', color: 'var(--bg-primary)' }}
                        >
                          Mark as read
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteNoti(n._id)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg transition"
                        style={{ color: 'var(--text-secondary)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
