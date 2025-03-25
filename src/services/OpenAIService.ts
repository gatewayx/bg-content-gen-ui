import { OpenAI } from 'openai';

export interface FineTunedModel {
  id: string;
  status: string;
  fine_tuned_model: string | null;
}

export const fetchFineTunedModels = async (apiKey: string): Promise<FineTunedModel[]> => {
  const client = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  try {
    const response = await client.fineTuning.jobs.list();
    return response.data;
  } catch (error) {
    console.error('Error fetching fine-tuned models:', error);
    return [];
  }
}; 