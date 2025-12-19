import { create } from 'zustand';

// Initialize theme from localStorage
const getInitialTheme = () => {
  if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark';
    
    // Apply theme immediately
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    return isDark;
  }
  return false;
};

export const useThemeStore = create((set) => ({
  isDarkMode: getInitialTheme(),
  
  toggleDarkMode: () => {
    set((state) => {
      const newDarkMode = !state.isDarkMode;
      
      // Save to localStorage
      localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
      
      // Apply dark mode class to document
      if (newDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      return { isDarkMode: newDarkMode };
    });
  },
  
  setDarkMode: (isDark) => {
    set({ isDarkMode: isDark });
    
    // Save to localStorage
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    // Apply dark mode class to document
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },
}));
