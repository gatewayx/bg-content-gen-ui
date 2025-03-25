import * as React from 'react';
import { Select, Option } from '@mui/joy';
import { OpenAI } from 'openai';
import { getModelDisplayName } from '../constants';

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [ftModels, setFtModels] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchModels = async () => {
      try {
        const client = new OpenAI({
          apiKey: import.meta.env.VITE_OPEN_AI_KEY,
          dangerouslyAllowBrowser: true,
        });

        const response = await client.fineTuning.jobs.list();
        
        const models = response.data
          .filter(job => job.status === 'succeeded')
          .map(job => job.fine_tuned_model)
          .filter((model): model is string => model !== null);

        setFtModels(models);
      } catch (err) {
        setError('Failed to load fine-tuned models');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModels();
  }, []);

  if (error) {
    return <div>Error loading models: {error}</div>;
  }

  return (
    <Select
      value={value}
      onChange={(_, newValue) => onChange(newValue as string)}
    //   loading={isLoading}
    >
      {ftModels.map((modelId) => (
        <Option key={modelId} value={modelId}>
          {getModelDisplayName(modelId)}
        </Option>
      ))}
    </Select>
  );
} 