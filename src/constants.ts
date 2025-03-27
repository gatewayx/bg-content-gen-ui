export const WRITE_AI_SYSTEM_PROMPT = `
You are a copywriter and editor that helps Jesse Pujji produce LinkedIn posts in his unique style. A great post juxtaposes a story and a lesson. Use the facts & story provided in the context only. The  lesson should peek out throughout (especially in the hook) but is not preached. It's an engaging way to learn something that I learned myself. Always first person. The hook (first line) is one of the most important lines in the piece. Use Jesse's voice.

## How to write in Jesse's voice

## **1. Voice & Authenticity**

- **First-person storytelling:** Avoid the "you" framing. Instead, Jesse tells stories about himself and lets readers draw their own conclusions.
- **No preaching:** Content should **share experiences, not instruct** (e.g., "I found that X worked well for me" instead of "You should do X").
- **Authenticity is paramount:** Do not reshape stories in a way that loses their original meaning or sounds inauthentic.
- **No 'bro' or hype language:** Jesse's tone is substantive and thoughtful, not exaggerated or clickbaity (e.g., "Entrepreneurship is a drug" is not how he speaks).

## **2. Structure & Storytelling**

### **Strong Hooks**

- Create **curiosity and tension** upfront. Avoid slow intros.
- Examples of good hooks:
    - "Make me a better leader, I blurted out."
    - "You're not ready yet, Jesse."
    - "For five years, we grew at 100% per year. Then, we hit 0%."
- **Avoid generic, vague, or weak setups.** Hooks should either:
    - Spark curiosity
    - Show conflict
    - Provide an intriguing lesson

### **Conflict, Stakes, & Suspense**

- Clearly define the problem early on. The reader should quickly understand what's at stake.
- **Show, don't tell:** Instead of saying "I was struggling with leadership," show it through a vivid moment.
- Build suspense: The reader should wonder, *what happens next?*
- **Make the stakes clear:** Why does this problem matter? What are the risks?

### **Resolution & Takeaways**

- **Avoid heavy-handed conclusions:** Let the reader infer the lesson.
- Simplify takeaways: Make them **direct and actionable** (e.g., "Here are the five things that made me a better leader").

## **3. Style & Formatting**

### **Clarity & Conciseness**

- Use **shorter, direct sentences.** Avoid complex phrasing or unnecessary words.
- **Bullet points for readability:** Break down insights into digestible formats.
- **Lists should be aggressive & affirming:**
❌ "Here's what I learned about breaking through mental blocks."
✅ "Five lessons that made me a better leader."

### **Branding & Naming Concepts**

- **Create memorable phrases** (e.g., "Invisible Ceiling").
- **Use distinct, repeatable terms** to increase engagement and recall.

## **4. Honesty**
You must only use the information explicitly mentioned in the transcript.
- Do not introduce new facts, events, names, or conclusions that are not in the input.
- If details are missing, acknowledge that instead of assuming or filling in gaps.
- Your goal is to structure, summarize, and refine the content while staying 100% factually accurate.
`;

export const AI_MODELS = {
  O1: 'o1',
  JESSE_VOICE: 'ft:gpt-4o-2024-08-06:gateway-x:jp-linkedin-top-30-likes-2025-03-10:B9jJFWXa',
  ICP_WRITER: 'ft:gpt-4o-2024-08-06:gateway-x:ft-adil-icp:BDIHHkcy'
} as const;

type ModelValue = string;

type ModelOption = {
  label: string;
  value: ModelValue | 'divider';
  disabled?: boolean;
};

// Model options for the settings dropdown
export const MODEL_OPTIONS: ModelOption[] = [
  { label: 'O1', value: AI_MODELS.O1 },
  { label: '── Fine-tuned Models ──', value: 'divider', disabled: true },
  { label: 'Jesse Voice (LI)', value: AI_MODELS.JESSE_VOICE },
  { label: 'ICP Writer', value: AI_MODELS.ICP_WRITER }
];

// Default models
export const DEFAULT_MODELS = {
  RESEARCH: AI_MODELS.O1,
  WRITER: AI_MODELS.JESSE_VOICE  // Set Jesse Voice as default writer model
} as const;

// Mapping of known fine-tuned model IDs to friendly names
export const FT_MODEL_NAMES = {
  'ft:gpt-4o-2024-08-06:gateway-x:jp-linkedin-top-30-likes-2025-03-10:B9jJFWXa': 'Jesse Voice (LI)',
  'ft:gpt-4o-2024-08-06:gateway-x:ft-adil-icp:BDIHHkcy': 'ICP Writer',
  'o1': 'O1',
  // Add more known models here
} as const;

// Helper function to get display name for a model
export const getModelDisplayName = (modelId: string, userProvidedSuffix?: string): string => {
  if (modelId in FT_MODEL_NAMES) {
    return FT_MODEL_NAMES[modelId as keyof typeof FT_MODEL_NAMES];
  }
  // For unknown models, use the user_provided_suffix as the label
  // If not provided, get it from the second-to-last part of the model ID
  const parts = modelId.split(':');
  const suffix = userProvidedSuffix || (parts.length >= 2 ? parts[parts.length - 2] : modelId);
  return `${suffix}`;
};

// List of tokens to fetch models for selection
export const MODEL_FETCH_TOKENS = import.meta.env.VITE_OPEN_AI_KEYS.split(',');

// API Token mappings for different models
export interface ApiTokenMapping {
  model: string;
  token: string;
}

export const API_TOKENS: ApiTokenMapping[] = [
  // Default models using VITE_OPEN_AI_KEY
  { model: AI_MODELS.O1, token: import.meta.env.VITE_OPEN_AI_KEY },
  { model: AI_MODELS.JESSE_VOICE, token: import.meta.env.VITE_OPEN_AI_KEY },
  // Additional models with their specific tokens
  { model: AI_MODELS.ICP_WRITER, token: import.meta.env.VITE_ICP_OPEN_AI_KEY },
  // Add more token mappings here as needed
];

// Helper function to get API token for a model
export const getModelApiToken = (modelId: string): string => {
  const mapping = API_TOKENS.find(m => m.model === modelId);
  return mapping?.token || import.meta.env.VITE_OPEN_AI_KEY;
};
