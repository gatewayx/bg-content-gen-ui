import { WRITE_AI_SYSTEM_PROMPT, DEFAULT_MODELS } from '../constants';

type ModelValue = string;

interface Settings {
  researchModel: ModelValue;
  writerModel: ModelValue;
  researchPrompts: Record<ModelValue, string>; // Map of model -> prompt
  writerPrompts: Record<ModelValue, string>;   // Map of model -> prompt
}

// Storage keys
const STORAGE_KEYS = {
  RESEARCH_MODEL: 'research_model',
  WRITER_MODEL: 'writer_model',
  RESEARCH_PROMPTS: 'research_prompts',
  WRITER_PROMPTS: 'writer_prompts'
};

/**
 * Get all settings from localStorage or defaults
 */
export const getSettings = (): Settings => {
  const researchModel = localStorage.getItem(STORAGE_KEYS.RESEARCH_MODEL) || DEFAULT_MODELS.RESEARCH;
  const writerModel = localStorage.getItem(STORAGE_KEYS.WRITER_MODEL) || DEFAULT_MODELS.WRITER;
  const researchPrompts = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESEARCH_PROMPTS) || '{}');
  const writerPrompts = JSON.parse(localStorage.getItem(STORAGE_KEYS.WRITER_PROMPTS) || 
    // Initialize with default writer prompt for default model
    JSON.stringify({ [DEFAULT_MODELS.WRITER]: WRITE_AI_SYSTEM_PROMPT }));

  // Return settings
  const settings: Settings = {
    researchModel,
    writerModel,
    researchPrompts,
    writerPrompts
  };

  return settings;
};

/**
 * Save all settings to localStorage
 */
export const saveSettings = (settings: Settings) => {
  localStorage.setItem(STORAGE_KEYS.RESEARCH_MODEL, settings.researchModel);
  localStorage.setItem(STORAGE_KEYS.WRITER_MODEL, settings.writerModel);
  localStorage.setItem(STORAGE_KEYS.RESEARCH_PROMPTS, JSON.stringify(settings.researchPrompts));
  localStorage.setItem(STORAGE_KEYS.WRITER_PROMPTS, JSON.stringify(settings.writerPrompts));
  
  // Trigger storage event to notify other components
  window.dispatchEvent(new Event('storage'));
}; 