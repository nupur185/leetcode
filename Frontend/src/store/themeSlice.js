import { createSlice } from '@reduxjs/toolkit';

const getInitial = () =>
  localStorage.getItem('theme') ||
  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

const themeSlice = createSlice({
  name: 'theme',
  initialState: { mode: getInitial() },
  reducers: {
    toggleTheme: (s) => { s.mode = s.mode === 'dark' ? 'light' : 'dark'; },
    setTheme: (s, a) => { s.mode = a.payload; },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;