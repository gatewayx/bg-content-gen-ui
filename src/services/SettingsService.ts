import { DEFAULT_MODELS, VITE_CANVAS_MODE_PROMPT, WRITE_AI_SYSTEM_PROMPT } from "../constants";

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
  writerModel: DEFAULT_MODELS.WRITER,
  researchPrompts: {
    "o1": ""
  },
  writerPrompts: {
    "jessievoice": WRITE_AI_SYSTEM_PROMPT
  },
  modelTokens: {
    "o1": import.meta.env.VITE_OPEN_AI_KEY,
    "jessievoice": import.meta.env.VITE_OPEN_AI_KEY
  }
};

export const getSettings = (): Settings => {
  const storedSettings = localStorage.getItem('settings');
  if (storedSettings) {
    try {
      const parsed = JSON.parse(storedSettings);
      // Merge with default settings to ensure all required fields exist
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        // Ensure nested objects are merged properly
        researchPrompts: {
          ...DEFAULT_SETTINGS.researchPrompts,
          ...(parsed.researchPrompts || {})
        },
        writerPrompts: {
          ...DEFAULT_SETTINGS.writerPrompts,
          ...(parsed.writerPrompts || {})
        },
        modelTokens: {
          ...DEFAULT_SETTINGS.modelTokens,
          ...(parsed.modelTokens || {})
        }
      };
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