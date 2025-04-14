import { DEFAULT_MODELS, VITE_CANVAS_MODE_PROMPT, WRITE_AI_SYSTEM_PROMPT } from "../constants";
import { supabase } from '../lib/supabase';

export interface Settings {
  canvasModePrompt: string;
  canvasMode: boolean;
  researchModel: string;
  writerModel: string;
  researchPrompts: Record<string, string>;
  writerPrompts: Record<string, string>;
  modelTokens: Record<string, string>;
}

export const SETTINGS_KEYS = {
  // Model selections
  WRITER_MODEL: 'writer_model',
  RESEARCH_MODEL: 'research_model',
  // System prompts
  WRITER_SYSTEM_PROMPT: 'writer_system_prompt',
  RESEARCH_SYSTEM_PROMPT: 'research_system_prompt',
  // Tokens
  WRITER_TOKENS: 'writer_tokens',
  RESEARCH_TOKENS: 'research_tokens'
} as const;

export type SettingKey = typeof SETTINGS_KEYS[keyof typeof SETTINGS_KEYS];

export interface Setting {
  id: string;
  key: SettingKey;
  value: string;
  created_at: string;
  updated_at: string;
  unique_user_key: string;
}

export const DEFAULT_SETTINGS: Settings = {
  canvasModePrompt: VITE_CANVAS_MODE_PROMPT || "",
  canvasMode: false,
  researchModel: "o1",
  writerModel: DEFAULT_MODELS.WRITER,
  researchPrompts: {
    "o1": "",
  },
  writerPrompts: {
    "jessievoice": WRITE_AI_SYSTEM_PROMPT
  },
  modelTokens: {
    "o1": import.meta.env.VITE_OPEN_AI_KEY,
    "jessievoice": import.meta.env.VITE_OPEN_AI_KEY
  }
};

// Add cache variables
let settingsCache: Settings | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
let isFetching = false; // Add flag to prevent concurrent fetches

export const getSettings = async (sessionId: string): Promise<Settings> => {
  try {
    // Prevent concurrent fetches
    if (isFetching) {
      console.log('Settings fetch already in progress, returning cached settings');
      return settingsCache || DEFAULT_SETTINGS;
    }

    // Return cached settings if they exist and are not expired
    const now = Date.now();
    if (settingsCache && (now - lastFetchTime) < CACHE_DURATION) {
      console.log('Returning cached settings');
      return settingsCache;
    }

    console.log('Fetching settings from database for session:', sessionId);
    isFetching = true;

    // Start with default settings
    const settings = { ...DEFAULT_SETTINGS };

    // Only try database if we have a session ID
    if (sessionId) {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .like('unique_user_key', `%_${sessionId}`);

      if (error) {
        console.error('Error fetching settings from database:', error);
        isFetching = false;
        return DEFAULT_SETTINGS;
      }

      // Update with database values, ensuring no undefined values
      data?.forEach(setting => {
        if (!setting || !setting.key || !setting.value) return;

        switch (setting.key) {
          case SETTINGS_KEYS.WRITER_MODEL:
            if (setting.value) settings.writerModel = setting.value;
            break;
          case SETTINGS_KEYS.RESEARCH_MODEL:
            if (setting.value) settings.researchModel = setting.value;
            break;
          case SETTINGS_KEYS.WRITER_SYSTEM_PROMPT:
            if (setting.value) settings.writerPrompts[settings.writerModel] = setting.value;
            break;
          case SETTINGS_KEYS.RESEARCH_SYSTEM_PROMPT:
            if (setting.value) settings.researchPrompts[settings.researchModel] = setting.value;
            break;
          case SETTINGS_KEYS.WRITER_TOKENS:
            if (setting.value) settings.modelTokens[settings.writerModel] = setting.value;
            break;
          case SETTINGS_KEYS.RESEARCH_TOKENS:
            if (setting.value) settings.modelTokens[settings.researchModel] = setting.value;
            break;
        }
      });
    }

    // Always check local storage as fallback
    const storedSettings = localStorage.getItem('settings');
    if (storedSettings) {
      try {
        const parsedSettings = JSON.parse(storedSettings);
        // Only use valid settings from local storage
        if (parsedSettings && typeof parsedSettings === 'object') {
          Object.assign(settings, parsedSettings);
          // Only save to database if we have a session ID
          if (sessionId) {
            await saveSettings(settings, sessionId);
          }
        }
      } catch (e) {
        console.error('Error parsing local storage settings:', e);
        isFetching = false;
        return DEFAULT_SETTINGS;
      }
    }

    // Ensure all required fields are initialized with default values
    if (!settings.researchPrompts["o1"]) {
      settings.researchPrompts["o1"] = "";
    }
    if (!settings.writerPrompts[DEFAULT_MODELS.WRITER]) {
      settings.writerPrompts[DEFAULT_MODELS.WRITER] = WRITE_AI_SYSTEM_PROMPT;
    }
    if (!settings.modelTokens["o1"]) {
      settings.modelTokens["o1"] = import.meta.env.VITE_OPEN_AI_KEY || "";
    }
    if (!settings.modelTokens[DEFAULT_MODELS.WRITER]) {
      settings.modelTokens[DEFAULT_MODELS.WRITER] = import.meta.env.VITE_OPEN_AI_KEY || "";
    }

    // Update cache
    settingsCache = settings;
    lastFetchTime = now;

    // Save to local storage for backward compatibility
    localStorage.setItem('settings', JSON.stringify(settings));

    console.log('Settings fetched and cached successfully');
    isFetching = false;
    return settings;
  } catch (error) {
    console.error('Error loading settings:', error);
    isFetching = false;
    return DEFAULT_SETTINGS;
  }
};

// Add a function to clear the cache when settings are updated
export const clearSettingsCache = () => {
  settingsCache = null;
  lastFetchTime = 0;
};

export const saveSettings = async (settings: Partial<Settings>, sessionId: string): Promise<void> => {
  if (!sessionId) throw new Error('Session ID is required');

  const now = new Date().toISOString();
  const updates: Partial<Setting>[] = [];

  // Helper function to validate and add setting
  const addSetting = (key: SettingKey, value: string | undefined) => {
    if (value !== undefined && value !== null && value !== '') {
      updates.push({
        key,
        value,
        created_at: now,
        updated_at: now,
        unique_user_key: `${key}_${sessionId}`
      });
    }
  };

  // Prepare settings updates
  if (settings.writerModel) {
    addSetting(SETTINGS_KEYS.WRITER_MODEL, settings.writerModel);
  }

  if (settings.researchModel) {
    addSetting(SETTINGS_KEYS.RESEARCH_MODEL, settings.researchModel);
  }

  if (settings.writerPrompts && settings.writerModel) {
    const promptValue = settings.writerPrompts[settings.writerModel];
    addSetting(SETTINGS_KEYS.WRITER_SYSTEM_PROMPT, promptValue);
  }

  if (settings.researchPrompts && settings.researchModel) {
    const promptValue = settings.researchPrompts[settings.researchModel];
    addSetting(SETTINGS_KEYS.RESEARCH_SYSTEM_PROMPT, promptValue);
  }

  if (settings.modelTokens) {
    if (settings.writerModel) {
      const tokenValue = settings.modelTokens[settings.writerModel];
      addSetting(SETTINGS_KEYS.WRITER_TOKENS, tokenValue);
    }
    if (settings.researchModel) {
      const tokenValue = settings.modelTokens[settings.researchModel];
      addSetting(SETTINGS_KEYS.RESEARCH_TOKENS, tokenValue);
    }
  }

  // Only perform upsert if we have updates
  if (updates.length > 0) {
    const { error } = await supabase
      .from('settings')
      .upsert(updates, {
        onConflict: 'unique_user_key',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
    
    // Clear the cache after saving
    clearSettingsCache();
  }
};

export const getSetting = async (key: SettingKey): Promise<string | null> => {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .single();

  if (error) return null;
  return data?.value || null;
};

export const setSetting = async (key: SettingKey, value: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No authenticated user');

  const now = new Date().toISOString();
  const { error } = await supabase
    .from('settings')
    .upsert({
      user_id: user.id,
      key,
      value,
      updated_at: now
    }, {
      onConflict: 'user_id,key'
    });

  if (error) throw error;
};

export const getAllSettings = async (): Promise<Record<SettingKey, string>> => {
  const { data, error } = await supabase
    .from('settings')
    .select('key, value');

  if (error) throw error;

  const settings: Record<SettingKey, string> = {} as Record<SettingKey, string>;
  data?.forEach(setting => {
    settings[setting.key as SettingKey] = setting.value;
  });

  return settings;
}; 