import * as React from "react";
import GlobalStyles from "@mui/joy/GlobalStyles";
import IconButton from "@mui/joy/IconButton";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import BugReportIcon from "@mui/icons-material/BugReport";
import SettingsIcon from "@mui/icons-material/Settings";
import { downloadLogs } from "../services/LoggerService";
import { ModalClose, Drawer, FormControl, FormLabel, Select, Option, Textarea, Divider, Button, Box } from "@mui/joy";
import { MODEL_OPTIONS, WRITE_AI_SYSTEM_PROMPT, DEFAULT_MODELS, AI_MODELS, MODEL_FETCH_TOKENS } from "../constants";
import { getSettings, saveSettings } from "../services/SettingsService";
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { fetchFineTunedModels } from "../services/OpenAIService";
import CircularProgress from '@mui/joy/CircularProgress';

type ModelValue = string;

type ModelOption = {
  label: string;
  value: ModelValue | 'divider';
  disabled?: boolean;
  token?: string;
};

export default function Header() {
  const [open, setOpen] = React.useState(false);
  const [modelOptions, setModelOptions] = React.useState<ModelOption[]>(MODEL_OPTIONS);
  const [isLoadingModels, setIsLoadingModels] = React.useState(false);
  
  // Initialize state from settings service
  const initialSettings = React.useMemo(() => getSettings(), []);
  const [researchModel, setResearchModel] = React.useState<ModelValue>(initialSettings.researchModel);
  const [writerModel, setWriterModel] = React.useState<ModelValue>(initialSettings.writerModel);
  const [researchPrompts, setResearchPrompts] = React.useState(initialSettings.researchPrompts);
  const [writerPrompts, setWriterPrompts] = React.useState(initialSettings.writerPrompts);

  // Fetch fine-tuned models when drawer opens
  React.useEffect(() => {
    if (open) {
      const fetchModels = async () => {
        setIsLoadingModels(true);
        try {
          // Fetch models for each token
          const modelPromises = MODEL_FETCH_TOKENS.map(async (token: string | undefined) => {
            if (!token) return [];
            try {
              const models = await fetchFineTunedModels(token);
              // Add token information to each model
              return models.map(model => ({
                ...model,
                token
              }));
            } catch (error) {
              console.error(`Error fetching models for token:`, error);
              return [];
            }
          });

          const allModelResults = await Promise.all(modelPromises);
          
          // Get existing model IDs from constants
          const existingModelIds:string[] = Object.values(AI_MODELS);
          
          // Combine all fine-tuned models
          const allModels = allModelResults.flat();
          
          // Filter out models that are already in our constants
          const newModels: ModelOption[] = allModels
            .filter(model => model.status === 'succeeded' && model.fine_tuned_model)
            .filter(model => !existingModelIds.includes(model.fine_tuned_model!))
            .map(model => ({
              label: `${model.user_provided_suffix}`,
              value: model.fine_tuned_model!,
              token: model.token // Store the token with the model option
            }));

          // Combine with existing options
          setModelOptions([
            ...MODEL_OPTIONS.filter(opt => opt.value !== 'divider'),
            ...newModels
          ]);

          // Update settings with model tokens
          const settings = getSettings();
          const modelTokens = newModels.reduce((acc, model) => {
            if (model.token) {
              acc[model.value] = model.token;
            }
            return acc;
          }, {} as Record<string, string>);

          saveSettings({
            ...settings,
            modelTokens: {
              ...settings.modelTokens,
              ...modelTokens
            }
          });
        } catch (error) {
          console.error('Error fetching models:', error);
        } finally {
          setIsLoadingModels(false);
        }
      };

      fetchModels();
    }
  }, [open]);

  // Get current prompts based on selected models
  const currentResearchPrompt = researchPrompts[researchModel] || '';
  const currentWriterPrompt = writerPrompts[writerModel] || '';  // Don't fall back to default prompt

  // Handle model changes
  const handleResearchModelChange = (value: ModelValue | 'divider') => {
    // Ignore if divider is selected
    if (value === 'divider') return;
    
    setResearchModel(value);
    // Initialize empty prompt for new model if it doesn't exist
    if (!researchPrompts[value]) {
      setResearchPrompts(prev => ({
        ...prev,
        [value]: '' // Allow empty prompt
      }));
    }
  };

  const handleWriterModelChange = (value: ModelValue | 'divider') => {
    // Ignore if divider is selected
    if (value === 'divider') return;
    
    setWriterModel(value);
    // Initialize with empty or default prompt for new model
    if (!writerPrompts[value]) {
      setWriterPrompts(prev => ({
        ...prev,
        [value]: value === DEFAULT_MODELS.WRITER ? WRITE_AI_SYSTEM_PROMPT : '' // Only use default for Jesse Voice model
      }));
    }
  };

  // Handle prompt changes
  const handleResearchPromptChange = (value: string) => {
    setResearchPrompts(prev => ({
      ...prev,
      [researchModel]: value
    }));
  };

  const handleWriterPromptChange = (value: string) => {
    setWriterPrompts(prev => ({
      ...prev,
      [writerModel]: value  // Simply save the value as-is, no default fallback
    }));
  };

  // Function to handle settings update
  const handleUpdateSettings = () => {
    saveSettings({
      researchModel,
      writerModel,
      researchPrompts,
      writerPrompts,
      modelTokens: getSettings().modelTokens // Preserve existing model tokens
    });
    setOpen(false);
  };

  return (
    <>
      <Sheet
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "fixed",
          top: 0,
          width: "100vw",
          height: "50px",
          zIndex: 9995,
          p: 1,
          backgroundColor: "#1976D2", // Matches the blue theme
          color: "white",
          boxShadow: "sm",
        }}
      >
        <GlobalStyles
          styles={{
            ":root": {
              "--Header-height": "60px",
            },
            body: {
              marginTop: "100px",
            },
          }}
        />

        {/* Left Side - Title */}
        <Typography component="h5" sx={{ fontWeight: "bold", color: "white" }}>
          Transcript to Newsletter App
        </Typography>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <IconButton
            variant="plain"
            aria-label="settings"
            color="neutral"
            size="sm"
            sx={{ display: { xs: "none", sm: "unset" }, color: 'white' }}
            onClick={() => setOpen(true)}
          >
            <SettingsIcon />
          </IconButton>
          <IconButton
            variant="plain"
            aria-label="edit"
            color="warning"
            size="sm"
            sx={{ display: { xs: "none", sm: "unset" } }}
            onClick={() => {
              downloadLogs()
            }}
          >
            <BugReportIcon />
          </IconButton>
        </div>
      </Sheet>

      <Drawer
        size="md"
        variant="plain"
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{
          content: {
            sx: {
              bgcolor: 'background.surface',
              p: 4,
              boxShadow: 'lg',
              width: '50vw',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            },
          },
          backdrop: {
            sx: {
              zIndex: 9998,
            },
          },
        }}
      >
        <ModalClose />
        <div style={{ flex: 1, overflow: 'auto' }}>
          <Typography level="h3" sx={{ mb: 3, mt: 3 }}>Settings</Typography>
          
          {/* Research Section */}
          <Typography level="h4" sx={{ mb: 2 }}>Research Settings</Typography>
          <FormControl sx={{ mb: 2 }}>
            <FormLabel>Model</FormLabel>
            <Box sx={{ position: 'relative' }}>
              <Select
                value={researchModel}
                onChange={(_, value) => handleResearchModelChange(value as ModelValue | 'divider')}
                sx={{ mb: 2 }}
              >
                {modelOptions.map((option) => (
                  <Option 
                    key={option.value} 
                    value={option.value}
                    disabled={option.value === 'divider'}
                  >
                    {option.label}
                  </Option>
                ))}
              </Select>
              {isLoadingModels && (
                <CircularProgress
                  size="sm"
                  sx={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                />
              )}
            </Box>
            
            <FormLabel>System Prompt (Optional)</FormLabel>
            <Textarea
              minRows={4}
              value={currentResearchPrompt}
              onChange={(e) => handleResearchPromptChange(e.target.value)}
              placeholder="Enter system prompt for research model (optional)..."
              sx={{ mb: 3 }}
            />
          </FormControl>

          <Divider sx={{ my: 4 }} />

          {/* Writer Section */}
          <Typography level="h4" sx={{ mb: 2 }}>Writer Settings</Typography>
          <FormControl sx={{ mb: 2 }}>
            <FormLabel>Model</FormLabel>
            <Box sx={{ position: 'relative' }}>
              <Select
                value={writerModel}
                onChange={(_, value) => handleWriterModelChange(value as ModelValue | 'divider')}
                sx={{ mb: 2 }}
              >
                {modelOptions.map((option) => (
                  <Option 
                    key={option.value} 
                    value={option.value}
                    disabled={option.value === 'divider'}
                  >
                    {option.label}
                  </Option>
                ))}
              </Select>
              {isLoadingModels && (
                <CircularProgress
                  size="sm"
                  sx={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                />
              )}
            </Box>
          </FormControl>

          <FormLabel>System Prompt (Optional)</FormLabel>
          <Box sx={{ position: 'relative' }}>
            <Textarea
              minRows={4}
              value={currentWriterPrompt}
              onChange={(e) => handleWriterPromptChange(e.target.value)}
              placeholder="Enter system prompt for writer model (optional)..."
              sx={{ mb: 3 }}
            />
            <IconButton
              size="sm"
              variant="plain"
              color="neutral"
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 1,
                bgcolor: 'background.surface',
              }}
              onClick={() => handleWriterPromptChange(WRITE_AI_SYSTEM_PROMPT)}
              title="Reset to default prompt"
            >
              <RestartAltIcon />
            </IconButton>
          </Box>
        </div>

        {/* Update Button */}
        <Button 
          color="primary"
          size="lg"
          onClick={handleUpdateSettings}
          sx={{ mt: 4 }}
        >
          Update Settings
        </Button>
      </Drawer>
    </>
  );
}
