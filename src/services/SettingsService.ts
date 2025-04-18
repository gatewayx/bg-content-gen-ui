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
  user_id: string;
  session_id: string;
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
      // console.log('Settings fetch already in progress, returning cached settings');
      return settingsCache || DEFAULT_SETTINGS;
    }

    // Return cached settings if they exist and are not expired
    const now = Date.now();
    if (settingsCache && (now - lastFetchTime) < CACHE_DURATION) {
      // console.log('Returning cached settings');
      return settingsCache;
    }

    // console.log('Fetching settings from database for session:', sessionId);
    isFetching = true;

    // Start with default settings
    const settings = { ...DEFAULT_SETTINGS };

    // Only try database if we have a session ID
    if (sessionId) {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .or(`unique_user_key.eq.${SETTINGS_KEYS.WRITER_MODEL}_${sessionId},unique_user_key.eq.${SETTINGS_KEYS.RESEARCH_MODEL}_${sessionId},unique_user_key.like.${SETTINGS_KEYS.WRITER_SYSTEM_PROMPT}_%_${sessionId},unique_user_key.like.${SETTINGS_KEYS.RESEARCH_SYSTEM_PROMPT}_%_${sessionId},unique_user_key.like.${SETTINGS_KEYS.WRITER_TOKENS}_%_${sessionId},unique_user_key.like.${SETTINGS_KEYS.RESEARCH_TOKENS}_%_${sessionId}`);

      if (error) {
        console.error('Error fetching settings from database:', error);
        isFetching = false;
        return DEFAULT_SETTINGS;
      }

      // Update with database values, ensuring no undefined values
      data?.forEach(setting => {
        if (!setting || !setting.key || !setting.value) return;

        // Extract model ID from unique_user_key if present
        const parts = setting.unique_user_key.split('_');
        const modelId = parts.length > 2 ? parts[1] : undefined;

        switch (setting.key) {
          case SETTINGS_KEYS.WRITER_MODEL:
            if (setting.value) settings.writerModel = setting.value;
            break;
          case SETTINGS_KEYS.RESEARCH_MODEL:
            if (setting.value) settings.researchModel = setting.value;
            break;
          case SETTINGS_KEYS.WRITER_SYSTEM_PROMPT:
            if (setting.value && modelId) settings.writerPrompts[modelId] = setting.value;
            break;
          case SETTINGS_KEYS.RESEARCH_SYSTEM_PROMPT:
            if (setting.value && modelId) settings.researchPrompts[modelId] = setting.value;
            break;
          case SETTINGS_KEYS.WRITER_TOKENS:
            if (setting.value && modelId) settings.modelTokens[modelId] = setting.value;
            break;
          case SETTINGS_KEYS.RESEARCH_TOKENS:
            if (setting.value && modelId) settings.modelTokens[modelId] = setting.value;
            break;
        }
      });
    }

    // Always check local storage as fallback
    const storedSettings = localStorage.getItem('settings');
    if (storedSettings) {
      try {
        const parsedSettings = JSON.parse(storedSettings);
        // Get settings for the specific session
        const sessionSettings = parsedSettings[sessionId];
        if (sessionSettings && typeof sessionSettings === 'object') {
          Object.assign(settings, sessionSettings);
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
    const currentStoredSettings = JSON.parse(localStorage.getItem('settings') || '{}');
    currentStoredSettings[sessionId] = settings;
    localStorage.setItem('settings', JSON.stringify(currentStoredSettings));

    // console.log('Settings fetched and cached successfully');
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
  if (!sessionId) {
    console.error('Session ID is required for saving settings');
    return;
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('No authenticated user found');
    return;
  }

  const now = new Date().toISOString();
  const updates: Partial<Setting>[] = [];

  // Helper function to validate and add setting
  const addSetting = (key: SettingKey, value: string | undefined, modelId?: string) => {
    if (value !== undefined && value !== null && value !== '') {
      // Create unique key with model ID if provided
      const uniqueKey = modelId ? `${key}_${modelId}_${sessionId}` : `${key}_${sessionId}`;
      
      updates.push({
        key,
        value,
        created_at: now,
        updated_at: now,
        unique_user_key: uniqueKey,
        user_id: user.id,
        session_id: sessionId
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
    addSetting(SETTINGS_KEYS.WRITER_SYSTEM_PROMPT, promptValue, settings.writerModel);
  }

  if (settings.researchPrompts && settings.researchModel) {
    const promptValue = settings.researchPrompts[settings.researchModel];
    addSetting(SETTINGS_KEYS.RESEARCH_SYSTEM_PROMPT, promptValue, settings.researchModel);
  }

  if (settings.modelTokens) {
    if (settings.writerModel) {
      const tokenValue = settings.modelTokens[settings.writerModel];
      addSetting(SETTINGS_KEYS.WRITER_TOKENS, tokenValue, settings.writerModel);
    }
    if (settings.researchModel) {
      const tokenValue = settings.modelTokens[settings.researchModel];
      addSetting(SETTINGS_KEYS.RESEARCH_TOKENS, tokenValue, settings.researchModel);
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

    // Save to local storage with session ID as key
    const currentStoredSettings = JSON.parse(localStorage.getItem('settings') || '{}');
    currentStoredSettings[sessionId] = {
      ...currentStoredSettings[sessionId],
      ...settings
    };
    localStorage.setItem('settings', JSON.stringify(currentStoredSettings));
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
      onConflict: 'unique_user_key'
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

export const loadAllSessionSettings = async (sessionIds: string[]): Promise<void> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found');
      return;
    }

    // Initialize localStorage structure if it doesn't exist
    const currentStoredSettings = JSON.parse(localStorage.getItem('settings') || '{}');
    const chatSessions = JSON.parse(localStorage.getItem('chat_sessions') || '[]');

    // Load settings and messages for each session
    for (const sessionId of sessionIds) {
      try {
        // Fetch settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('settings')
          .select('*')
          .eq('session_id', sessionId)
          .eq('user_id', user.id);

        if (settingsError) {
          console.error(`Error fetching settings for session ${sessionId}:`, settingsError);
          currentStoredSettings[sessionId] = DEFAULT_SETTINGS;
          continue;
        }

        // Fetch research messages (interface: 0)
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('session_id', sessionId)
          .eq('interface', 0)
          .order('created_at', { ascending: true });

        // Fetch writer messages (interface: 1)
        const { data: messagesFT, error: messagesFTError } = await supabase
          .from('messages')
          .select('*')
          .eq('session_id', sessionId)
          .eq('interface', 1)
          .order('created_at', { ascending: true });

        if (messagesError || messagesFTError) {
          console.error(`Error fetching messages for session ${sessionId}:`, messagesError || messagesFTError);
        }

        // Format messages
        const formattedMessages = (messages || []).map(msg => ({
          id: msg.id.toString(),
          sender: msg.role === 'user' ? 'You' : {
            name: "Assistant",
            username: new Date(msg.created_at).toLocaleString(),
            avatar: "/static/images/avatar/1.jpg",
            online: true
          },
          content: msg.content,
          timestamp: new Date(msg.created_at).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })
        }));

        const formattedMessagesFT = (messagesFT || []).map(msg => ({
          id: msg.id.toString(),
          sender: msg.role === 'user' ? 'You' : {
            name: "Assistant",
            username: new Date(msg.created_at).toLocaleString(),
            avatar: "/static/images/avatar/1.jpg",
            online: true
          },
          content: msg.content,
          timestamp: new Date(msg.created_at).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }),
          canvasMode: msg.canvasMode || false
        }));

        // Update chat sessions with messages
        const sessionIndex = chatSessions.findIndex((s: any) => s.id === sessionId);
        if (sessionIndex !== -1) {
          chatSessions[sessionIndex] = {
            ...chatSessions[sessionIndex],
            messages: formattedMessages,
            messagesFT: formattedMessagesFT
          };
        }

        // Start with default settings
        const settings = { ...DEFAULT_SETTINGS };

        // Update with database values
        settingsData?.forEach(setting => {
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

        // Save settings to localStorage
        currentStoredSettings[sessionId] = settings;
      } catch (error) {
        console.error(`Error processing settings for session ${sessionId}:`, error);
        currentStoredSettings[sessionId] = DEFAULT_SETTINGS;
      }
    }

    // Save all settings and sessions to localStorage
    localStorage.setItem('settings', JSON.stringify(currentStoredSettings));
    localStorage.setItem('chat_sessions', JSON.stringify(chatSessions));
  } catch (error) {
    console.error('Error loading all session settings:', error);
  }
}; 