import { OpenAI } from 'openai';

export interface FineTunedModel {
  id: string;
  status: string;
  fine_tuned_model: string | null;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function fetchFineTunedModels(apiKey: string): Promise<FineTunedModel[]> {
  try {
    const client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    });

    const response = await client.fineTuning.jobs.list();
    return response.data;
  } catch (error) {
    console.error('Error fetching fine-tuned models:', error);
    return [];
  }
}

export async function createChatCompletion(modelId: string, messages: ChatMessage[], apiKey: string) {
  try {
    const client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    });

    const response = await client.chat.completions.create({
      model: modelId,
      messages,
      stream: true,
    });

    return response;
  } catch (error) {
    console.error('Error creating chat completion:', error);
    throw error;
  }
} 