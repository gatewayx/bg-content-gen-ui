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
    localStorage.setItem('settings', JSON.stringify(updatedSettings));
    
    if (saveToDb) {
      const currentChatId = localStorage.getItem('selectedChatId');
      if (currentChatId) {
        await saveSettings(updatedSettings, currentChatId);
      }
    }
  };

  // Only fetch settings on initial load
  useEffect(() => {
    const loadSettings = async () => {
      const currentChatId = localStorage.getItem('selectedChatId');
      if (currentChatId) {
        const loadedSettings = await getSettings(currentChatId);
        setSettings(loadedSettings);
      }
    };
    loadSettings();
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