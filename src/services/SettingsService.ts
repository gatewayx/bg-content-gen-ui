export interface Settings {
  canvasModePrompt: string;
  canvasMode: boolean;
  researchModel: string;
  writerModel: string;
  researchPrompts: Record<string, string>;
  writerPrompts: Record<string, string>;
  modelTokens: Record<string, string>;
  // Add other settings as needed
}

const DEFAULT_SETTINGS: Settings = {
  canvasModePrompt: "You are a helpful AI assistant. Please help me with my request.",
  canvasMode: false,
  researchModel: "o1",
  writerModel: "jessievoice",
  researchPrompts: {
    "o1": "You are a helpful AI assistant. Please help me with my request."
  },
  writerPrompts: {
    "jessievoice": "You are a helpful AI assistant. Please help me with my request."
  },
  modelTokens: {
    "o1": "",
    "jessievoice": ""
  }
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