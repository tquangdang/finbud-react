import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,

  fetchUser: async () => {
    try {
      const res = await api.get('/auth/current-user');
      set({ user: res.data.user, isAuthenticated: true, loading: false });
    } catch {
      set({ user: null, isAuthenticated: false, loading: false });
    }
  },

  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    set({ user: res.data, isAuthenticated: true });
    return res.data;
  },

  signup: async (email, password, firstName, lastName) => {
    const res = await api.post('/auth/signup', { email, password, firstName, lastName });
    return res.data;
  },

  logout: async () => {
    await api.post('/auth/logout');
    set({ user: null, isAuthenticated: false });
  },
}));

export default useAuthStore;