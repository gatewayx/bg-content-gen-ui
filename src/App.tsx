import * as React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssVarsProvider } from '@mui/joy/styles';
import CssBaseline from '@mui/joy/CssBaseline';
import Box from '@mui/joy/Box';
import Header from './components/Header';
import MyMessages from './components/MyMessages';
import { SettingsProvider } from './contexts/SettingsContext';
import { AuthProvider } from './contexts/AuthContext';
import Login from './components/Login';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function JoyMessagesTemplate() {
  return (
    <Router>
      <AuthProvider>
        <SettingsProvider>
          <CssVarsProvider disableTransitionOnChange>
            <CssBaseline />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Box sx={{ display: 'flex', minHeight: '100dvh' }}>
                      <Header />
                      <Box component="main" className="MainContent" sx={{ flex: 1, marginTop: "40px" }}>
                        <MyMessages />
                      </Box>
                    </Box>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </CssVarsProvider>
        </SettingsProvider>
      </AuthProvider>
    </Router>
  );
}
