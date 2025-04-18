import * as React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssVarsProvider, useColorScheme } from '@mui/joy/styles';
import CssBaseline from '@mui/joy/CssBaseline';
import Box from '@mui/joy/Box';
import Header from './components/Header';
import MyMessages from './components/MyMessages';
import { SettingsProvider } from './contexts/SettingsContext';
import { AuthProvider } from './contexts/AuthContext';
import Login from './components/Login';
import { ProtectedRoute } from './components/ProtectedRoute';

// Check if dark mode is enabled in environment variables
const isDarkModeEnabled = import.meta.env.VITE_ENABLE_DARK_MODE === 'true';

// Function to get initial color scheme
const getInitialColorScheme = () => {
  if (!isDarkModeEnabled) return 'light';
  
  // Check browser preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

// ThemeProvider component that handles theme switching
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { setMode } = useColorScheme();
  
  React.useEffect(() => {
    // Set initial color scheme
    setMode(getInitialColorScheme());
    
    // Listen for system color scheme changes if dark mode is enabled
    if (isDarkModeEnabled) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        setMode(e.matches ? 'dark' : 'light');
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [setMode]);

  return <>{children}</>;
}

export default function JoyMessagesTemplate() {
  return (
    <Router>
      <AuthProvider>
        <SettingsProvider>
          <CssVarsProvider disableTransitionOnChange>
            <CssBaseline />
            <ThemeProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Box sx={{ display: 'flex', minHeight: '100dvh' }}>
                        <Header />
                        
                      </Box>
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ThemeProvider>
          </CssVarsProvider>
        </SettingsProvider>
      </AuthProvider>
    </Router>
  );
}
