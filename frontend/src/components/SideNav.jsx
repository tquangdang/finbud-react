import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Target,
  LineChart,
  User,
  Bell,
  LogOut,
  LogIn,
  UserPlus,
  Sun,
  Moon,
  Menu,
  X,
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useNotiStore from '../store/useNotiStore';

const navItems = [
  { to: '/chat', icon: MessageSquare, label: 'Chat' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/stocks', icon: LineChart, label: 'Stocks' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/profile', icon: User, label: 'Profile' },
];

function userDisplayName(user) {
  if (!user) return '';
  const d = user.identityData?.displayName?.trim();
  if (d) return d;
  const first = user.identityData?.firstName?.trim() || '';
  const last = user.identityData?.lastName?.trim() || '';
  const combined = `${first} ${last}`.trim();
  if (combined) return combined;
  return user.email || 'Account';
}

export default function SideNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authLoading = useAuthStore((s) => s.loading);
  const logout = useAuthStore((s) => s.logout);

  const unreadCount = useNotiStore((s) => s.unreadCount);
  const fetchNotis = useNotiStore((s) => s.fetchNotis);
  const connectSocket = useNotiStore((s) => s.connectSocket);
  const disconnectSocket = useNotiStore((s) => s.disconnectSocket);

  const [expanded, setExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    fetchNotis();
    connectSocket(user._id);
    return () => disconnectSocket();
  }, [isAuthenticated, user, fetchNotis, connectSocket, disconnectSocket]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    setDark(isDark);
    localStorage.setItem('darkMode', isDark);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch {
      navigate('/');
    }
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <Link
        to="/"
        className="flex items-center gap-3 px-3 py-2 mb-6 shrink-0"
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0"
          style={{ background: 'var(--accent-color)', color: 'var(--bg-primary)' }}
        >
          FB
        </div>
        <span
          className="text-lg font-extrabold tracking-tight whitespace-nowrap overflow-hidden"
          style={{ color: 'var(--text-primary)' }}
        >
          FinBud
        </span>
      </Link>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to || location.pathname.startsWith(to + '/');
          return (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
              style={{
                background: active ? 'var(--hover-bg)' : 'transparent',
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: active ? 600 : 400,
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = 'var(--hover-bg)';
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = 'transparent';
              }}
            >
              <span className="relative shrink-0">
                <Icon className="w-5 h-5" />
                {label === 'Notifications' && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 leading-none">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </span>
              <span className="whitespace-nowrap overflow-hidden text-sm">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="flex flex-col gap-1 mt-auto pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
        {/* Dark mode toggle */}
        <button
          type="button"
          onClick={toggleDark}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors w-full text-left"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover-bg)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          {dark ? <Sun className="w-5 h-5 shrink-0" /> : <Moon className="w-5 h-5 shrink-0" />}
          <span className="whitespace-nowrap overflow-hidden text-sm">
            {dark ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>

        {authLoading ? (
          <div className="px-3 py-2.5">
            <div className="w-full h-8 rounded-lg animate-pulse" style={{ background: 'var(--hover-bg)' }} />
          </div>
        ) : isAuthenticated && user ? (
          <>
            <div
              className="flex items-center gap-3 px-3 py-2 rounded-lg"
              style={{ color: 'var(--text-primary)' }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: 'var(--hover-bg)', color: 'var(--text-primary)' }}
              >
                {userDisplayName(user).charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium truncate whitespace-nowrap overflow-hidden">
                {userDisplayName(user)}
              </span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors w-full text-left"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover-bg)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <LogOut className="w-5 h-5 shrink-0" />
              <span className="whitespace-nowrap overflow-hidden text-sm">Logout</span>
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover-bg)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <LogIn className="w-5 h-5 shrink-0" />
              <span className="whitespace-nowrap overflow-hidden text-sm">Sign In</span>
            </Link>
            <Link
              to="/signup"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover-bg)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <UserPlus className="w-5 h-5 shrink-0" />
              <span className="whitespace-nowrap overflow-hidden text-sm">Sign Up</span>
            </Link>
          </>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        type="button"
        className="md:hidden fixed top-4 left-4 z-[60] p-2 rounded-lg"
        style={{ background: 'var(--card-bg)', color: 'var(--text-primary)' }}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`md:hidden fixed left-0 top-0 h-screen w-72 z-50 flex flex-col py-6 px-3 transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'var(--bg-primary)',
          borderRight: '1px solid var(--border-color)',
        }}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex fixed left-0 top-0 h-screen z-50 flex-col py-6 px-3 transition-all duration-300 ${
          expanded ? 'w-72' : 'w-20'
        }`}
        style={{
          background: 'var(--bg-primary)',
          borderRight: '1px solid var(--border-color)',
        }}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
