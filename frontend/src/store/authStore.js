import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axiosInstance from '../lib/axios';
import socketService from '../lib/socket';
import toast from 'react-hot-toast';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: true,

      setUser: (user) => set({ user }),

      login: async (credentials) => {
        try {
          const { data } = await axiosInstance.post('/api/auth/login', credentials);
          
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data));
          
          set({ user: data, token: data.token });
          
          // Connect socket
          socketService.connect(data.token);
          
          toast.success('Login successful!');
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.message || 'Login failed';
          toast.error(message);
          return { success: false, message };
        }
      },

      register: async (userData) => {
        try {
          const { data } = await axiosInstance.post('/api/auth/register', userData);
          
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data));
          
          set({ user: data, token: data.token });
          
          // Connect socket
          socketService.connect(data.token);
          
          toast.success('Registration successful!');
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.message || 'Registration failed';
          toast.error(message);
          return { success: false, message };
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        socketService.disconnect();
        set({ user: null, token: null });
        toast.success('Logged out successfully');
      },

      updateProfile: async (updates) => {
        try {
          const { data } = await axiosInstance.put('/api/auth/profile', updates);
          
          const updatedUser = { ...get().user, ...data };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          set({ user: updatedUser });
          toast.success('Profile updated successfully');
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.message || 'Update failed';
          toast.error(message);
          return { success: false, message };
        }
      },

      checkAuth: async () => {
        try {
          const token = localStorage.getItem('token');
          const storedUser = localStorage.getItem('user');

          if (token && storedUser) {
            const user = JSON.parse(storedUser);
            set({ user, token, isLoading: false });
            
            // Connect socket
            socketService.connect(token);
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);

// Initialize auth check
useAuthStore.getState().checkAuth();
