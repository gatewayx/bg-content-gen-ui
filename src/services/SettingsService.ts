import { VITE_CANVAS_MODE_PROMPT, WRITE_AI_SYSTEM_PROMPT } from "../constants";

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
  canvasModePrompt: VITE_CANVAS_MODE_PROMPT || "",
  canvasMode: false,
  researchModel: "o1",
  writerModel: "jessievoice",
  researchPrompts: {
    "o1": ""
  },
  writerPrompts: {
    "jessievoice": WRITE_AI_SYSTEM_PROMPT
  },
  modelTokens: {
    "o1": "",
    "jessievoice": WRITE_AI_SYSTEM_PROMPT
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