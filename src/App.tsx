import * as React from 'react';
import { CssVarsProvider } from '@mui/joy/styles';
import CssBaseline from '@mui/joy/CssBaseline';
import Box from '@mui/joy/Box';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MyMessages from './components/MyMessages';
import { SettingsProvider } from './contexts/SettingsContext';
import { MDXEditor } from '@mdxeditor/editor'
import '@mdxeditor/editor/style.css'

export default function JoyMessagesTemplate() {
  return (
    <SettingsProvider>
      <CssVarsProvider disableTransitionOnChange>
        <CssBaseline />
        <Box sx={{ display: 'flex', minHeight: '100dvh' }}>
          <Header />
          <Box component="main" className="MainContent" sx={{ flex: 1, marginTop:"40px", }}>
            <MyMessages />
          </Box>
        </Box>
      </CssVarsProvider>
    </SettingsProvider>
  );
}
