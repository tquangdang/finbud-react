import { create } from 'zustand';
import api from '../services/api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

let socket = null;

const useNotiStore = create((set, get) => ({
  notis: [],
  unreadCount: 0,
  loading: true,
  _connected: false,
  _interval: null,

  fetchNotis: async () => {
    try {
      const res = await api.get('/notis');
      const notis = res.data;
      set({
        notis,
        unreadCount: notis.filter((n) => !n.isRead).length,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  connectSocket: async (userId) => {
    if (get()._connected) return;

    if (SOCKET_URL) {
      try {
        const { io } = await import('socket.io-client');
        socket = io(SOCKET_URL, { withCredentials: true });
        socket.emit('register', userId);
        socket.on('noti:update', () => get().fetchNotis());
        set({ _connected: true });
        return;
      } catch {
        /* fall through to polling */
      }
    }

    const interval = setInterval(() => get().fetchNotis(), 15000);
    set({ _connected: true, _interval: interval });
  },

  disconnectSocket: () => {
    if (socket) {
      socket.off('noti:update');
      socket.disconnect();
      socket = null;
    }
    const interval = get()._interval;
    if (interval) clearInterval(interval);
    set({ _connected: false, _interval: null });
  },

  markRead: async (id) => {
    try {
      const res = await api.put(`/notis/${id}`);
      const notis = get().notis.map((n) => (n._id === id ? res.data : n));
      set({ notis, unreadCount: notis.filter((n) => !n.isRead).length });
    } catch {
      /* silently fail */
    }
  },

  markAllRead: async () => {
    const unread = get().notis.filter((n) => !n.isRead);
    await Promise.all(unread.map((n) => api.put(`/notis/${n._id}`)));
    get().fetchNotis();
  },

  deleteNoti: async (id) => {
    try {
      await api.delete(`/notis/${id}`);
      const notis = get().notis.filter((n) => n._id !== id);
      set({ notis, unreadCount: notis.filter((n) => !n.isRead).length });
    } catch {
      /* silently fail */
    }
  },
}));

export default useNotiStore;
