import * as React from "react";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import Stack from "@mui/joy/Stack";
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from "@mui/joy/IconButton";

interface SimpleEditorProps {
  initialContent?: string;
  onSave?: (content: string) => void;
  onClose?: () => void;
}

export default function SimpleEditor({ initialContent = "", onSave, onClose }: SimpleEditorProps) {
  const editorRef = React.useRef<HTMLDivElement>(null);

  // Function to handle content changes
  const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    if (onSave) {
      onSave(e.currentTarget.innerHTML);
    }
  };

  // Function to handle closing
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  // Initialize content
  React.useEffect(() => {
    if (editorRef.current) {
      if (editorRef.current.innerHTML !== initialContent) {
        const selection = window.getSelection();
        let range = null;
        if (selection && selection.rangeCount > 0) {
          range = selection.getRangeAt(0);
        }

        // Convert markdown to HTML
        let content = initialContent;
        content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
        editorRef.current.innerHTML = content;

        // Restore cursor position if editor was focused
        if (document.activeElement === editorRef.current && range) {
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }
    }
  }, [initialContent]);

  // Format text function
  const formatText = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    if (editorRef.current) {
      handleContentChange({ currentTarget: editorRef.current } as React.FormEvent<HTMLDivElement>);
    }
  };

  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      <Stack 
        direction="row" 
        spacing={1} 
        sx={{ 
          p: 1, 
          borderBottom: "1px solid", 
          borderColor: "divider",
          alignItems: "center",
        }}
      >
        <IconButton 
          size="sm" 
          onClick={() => formatText('bold')}
          onMouseDown={(e) => e.preventDefault()}
        >
          <FormatBoldIcon fontSize="small" />
        </IconButton>
        
        <IconButton 
          size="sm" 
          onClick={() => formatText('italic')}
          onMouseDown={(e) => e.preventDefault()}
        >
          <FormatItalicIcon fontSize="small" />
        </IconButton>
        
        <IconButton 
          size="sm" 
          onClick={() => formatText('underline')}
          onMouseDown={(e) => e.preventDefault()}
        >
          <FormatUnderlinedIcon fontSize="small" />
        </IconButton>
        
        <IconButton 
          size="sm" 
          onClick={() => formatText('insertUnorderedList')}
          onMouseDown={(e) => e.preventDefault()}
        >
          <FormatListBulletedIcon fontSize="small" />
        </IconButton>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <IconButton size="sm" onClick={handleClose} color="neutral">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>
      
      <Box
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleContentChange}
        sx={{
          flex: 1,
          p: 2,
          overflow: "auto",
          backgroundColor: "background.surface",
          borderRadius: "12px",
          border: "1px solid",
          borderColor: "divider",
          margin: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          position: "relative",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          '&:focus': {
            outline: "2px solid",
            outlineColor: "primary.500",
          },
          '&::before': {
            content: '""',
            position: "absolute",
            top: "0",
            left: "-8px",
            width: "0",
            height: "0",
            borderTop: "8px solid transparent",
            borderBottom: "8px solid transparent",
            borderRight: "8px solid",
            borderRightColor: "divider",
          },
          '&::after': {
            content: '""',
            position: "absolute",
            top: "0",
            left: "-7px",
            width: "0",
            height: "0",
            borderTop: "8px solid transparent",
            borderBottom: "8px solid transparent",
            borderRight: "8px solid",
            borderRightColor: "background.surface",
          }
        }}
      />
    </Box>
  );
}