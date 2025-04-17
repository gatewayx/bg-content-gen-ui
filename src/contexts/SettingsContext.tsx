import React, { createContext, useContext, useState, useEffect } from 'react';
import { Settings, getSettings, saveSettings } from '../services/SettingsService';

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>, saveToDb?: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>({
    canvasModePrompt: '',
    canvasMode: false,
    researchModel: 'o1',
    writerModel: 'jessievoice',
    researchPrompts: {},
    writerPrompts: {},
    modelTokens: {}
  });

  const updateSettings = async (newSettings: Partial<Settings>, saveToDb: boolean = false) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    // Update settings in localStorage
    const currentStoredSettings = JSON.parse(localStorage.getItem('settings') || '{}');
    const currentChatId = localStorage.getItem('selectedChatId');
    if (currentChatId) {
      currentStoredSettings[currentChatId] = updatedSettings;
      localStorage.setItem('settings', JSON.stringify(currentStoredSettings));
    }
    
    if (saveToDb && currentChatId) {
      await saveSettings(updatedSettings, currentChatId);
    }

    // Update chat sessions in localStorage to reflect new model selections
    const chatSessions = JSON.parse(localStorage.getItem('chat_sessions') || '[]');
    if (currentChatId && chatSessions.length > 0) {
      const updatedSessions = chatSessions.map((session: any) => {
        if (session.id === currentChatId) {
          return {
            ...session,
            researchModel: updatedSettings.researchModel,
            writerModel: updatedSettings.writerModel
          };
        }
        return session;
      });
      localStorage.setItem('chat_sessions', JSON.stringify(updatedSessions));
    }
  };

  // Load settings on initial load and when selected chat changes
  useEffect(() => {
    const loadSettings = async () => {
      const currentChatId = localStorage.getItem('selectedChatId');
      if (currentChatId) {
        const loadedSettings = await getSettings(currentChatId);
        setSettings(loadedSettings);
      }
    };
    loadSettings();

    // Listen for changes to selectedChatId in localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'selectedChatId') {
        loadSettings();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}; 