export interface Settings {
  canvasModePrompt: string;
  // Add other settings as needed
}

const DEFAULT_SETTINGS: Settings = {
  canvasModePrompt: "You are a helpful AI assistant. Please help me with my request.",
};

export const getSettings = (): Settings => {
  const storedSettings = localStorage.getItem('settings');
  if (storedSettings) {
    try {
      return JSON.parse(storedSettings);
    } catch (error) {
      console.error('Error parsing settings:', error);
      return DEFAULT_SETTINGS;
    }
  }
  return DEFAULT_SETTINGS;
};

export function saveSettings(settings: Settings): void {
  localStorage.setItem('settings', JSON.stringify(settings));
  // Dispatch storage event to notify other components
  window.dispatchEvent(new Event('storage'));
} 