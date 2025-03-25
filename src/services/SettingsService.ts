import { WRITE_AI_SYSTEM_PROMPT, DEFAULT_MODELS } from '../constants';

// Storage keys for settings
const STORAGE_KEYS = {
  RESEARCH_MODEL: 'research_model',
  WRITER_MODEL: 'writer_model',
  RESEARCH_PROMPT: 'research_prompt',
  WRITER_PROMPT: 'writer_prompt'
};

interface Settings {
  researchModel: string;
  writerModel: string;
  researchPrompt?: string; // Optional, only included if set
  writerPrompt: string;
}

/**
 * Get all settings from localStorage or defaults
 */
export const getSettings = (): Settings => {
  const settings: Settings = {
    researchModel: localStorage.getItem(STORAGE_KEYS.RESEARCH_MODEL) || DEFAULT_MODELS.RESEARCH,
    writerModel: localStorage.getItem(STORAGE_KEYS.WRITER_MODEL) || DEFAULT_MODELS.WRITER,
    writerPrompt: localStorage.getItem(STORAGE_KEYS.WRITER_PROMPT) || WRITE_AI_SYSTEM_PROMPT,
  };

  // Only include research prompt if it exists in localStorage and is not empty
  const researchPrompt = localStorage.getItem(STORAGE_KEYS.RESEARCH_PROMPT);
  if (researchPrompt && researchPrompt.trim() !== '') {
    settings.researchPrompt = researchPrompt;
  }

  return settings;
};

/**
 * Save all settings to localStorage
 */
export const saveSettings = (settings: Settings) => {
  localStorage.setItem(STORAGE_KEYS.RESEARCH_MODEL, settings.researchModel);
  localStorage.setItem(STORAGE_KEYS.WRITER_MODEL, settings.writerModel);
  if (settings.researchPrompt) {
    localStorage.setItem(STORAGE_KEYS.RESEARCH_PROMPT, settings.researchPrompt);
  }
  localStorage.setItem(STORAGE_KEYS.WRITER_PROMPT, settings.writerPrompt);
}; 