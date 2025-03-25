import * as React from "react";
import GlobalStyles from "@mui/joy/GlobalStyles";
import IconButton from "@mui/joy/IconButton";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import BugReportIcon from "@mui/icons-material/BugReport";
import SettingsIcon from "@mui/icons-material/Settings";
import { downloadLogs } from "../services/LoggerService";
import { ModalClose, Drawer, FormControl, FormLabel, Select, Option, Textarea, Divider, Button, Box } from "@mui/joy";
import { MODEL_OPTIONS } from "../constants";
import { getSettings, saveSettings } from "../services/SettingsService";
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { WRITE_AI_SYSTEM_PROMPT } from "../constants";
export default function Header() {
  const [open, setOpen] = React.useState(false);
  
  // Initialize state from settings service
  const initialSettings = React.useMemo(() => getSettings(), []);
  const [researchModel, setResearchModel] = React.useState(initialSettings.researchModel);
  const [writerModel, setWriterModel] = React.useState(initialSettings.writerModel);
  const [researchPrompt, setResearchPrompt] = React.useState(initialSettings.researchPrompt || '');
  const [writerPrompt, setWriterPrompt] = React.useState(initialSettings.writerPrompt);

  // Function to handle settings update
  const handleUpdateSettings = () => {
    saveSettings({
      researchModel,
      writerModel,
      researchPrompt: researchPrompt.trim() !== '' ? researchPrompt : undefined,
      writerPrompt
    });
    setOpen(false); // Close drawer after saving
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
            <Select
              value={researchModel}
              onChange={(_, value) => setResearchModel(value as string)}
              sx={{ mb: 2 }}
            >
              {MODEL_OPTIONS.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
            
            <FormLabel>System Prompt</FormLabel>
            <Textarea
              minRows={4}
              value={researchPrompt}
              onChange={(e) => setResearchPrompt(e.target.value)}
              placeholder="Enter system prompt for research model..."
              sx={{ mb: 3 }}
            />
          </FormControl>

          <Divider sx={{ my: 4 }} />

          {/* Writer Section */}
          <Typography level="h4" sx={{ mb: 2 }}>Writer Settings</Typography>
          <FormControl sx={{ mb: 2 }}>
            <FormLabel>Model</FormLabel>
            <Select
              value={writerModel}
              onChange={(_, value) => setWriterModel(value as string)}
              sx={{ mb: 2 }}
            >
              {MODEL_OPTIONS.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </FormControl>

          <FormLabel>System Prompt</FormLabel>
          <Box sx={{ position: 'relative' }}>
            <Textarea
              minRows={4}
              value={writerPrompt}
              onChange={(e) => setWriterPrompt(e.target.value)}
              placeholder="Enter system prompt for writer model..."
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
              onClick={() => setWriterPrompt(WRITE_AI_SYSTEM_PROMPT)}
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
