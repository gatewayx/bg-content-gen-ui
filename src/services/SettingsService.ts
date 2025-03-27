export interface Settings {
  researchModel: string;
  writerModel: string;
  researchPrompts: Record<string, string>;
  writerPrompts: Record<string, string>;
  modelTokens: Record<string, string>;
}

const DEFAULT_SETTINGS: Settings = {
  researchModel: "o1",
  writerModel: "ft:gpt-4o-2024-08-06:gateway-x:jp-linkedin-top-30-likes-2025-03-10:B9jJFWXa",
  researchPrompts: {},
  writerPrompts: {},
  modelTokens: {},
};

export function getSettings(): Settings {
  const savedSettings = localStorage.getItem('settings');
  if (savedSettings) {
    return JSON.parse(savedSettings);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem('settings', JSON.stringify(settings));
  // Dispatch storage event to notify other components
  window.dispatchEvent(new Event('storage'));
} 