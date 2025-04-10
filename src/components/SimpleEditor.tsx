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
    const newContent = e.currentTarget.innerHTML;
    if (onSave) {
      onSave(newContent);
    }
  };
  // Function to handle closing
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };
  // Initialize and update content
  React.useEffect(() => {
    if (editorRef.current) {
      // Only update if content is different
      if (editorRef.current.innerHTML !== initialContent) {
        // Store selection positions
        const selection = window.getSelection();
        let range = null;
        if (selection && selection.rangeCount > 0) {
          range = selection.getRangeAt(0);
        }
        
        // Update content
        editorRef.current.innerHTML = initialContent;
        
        // Restore cursor position to end if we were focused
        if (document.activeElement === editorRef.current) {
          const newRange = document.createRange();
          newRange.selectNodeContents(editorRef.current);
          newRange.collapse(false); // false means collapse to end
          selection?.removeAllRanges();
          selection?.addRange(newRange);
        }
      }
    }
  }, [initialContent]); // Only run when initialContent changes
  
  // Basic formatting functions
  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      if (onSave) {
        onSave(newContent);
      }
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
        <IconButton size="sm" onClick={() => formatText('bold')}>
          <FormatBoldIcon fontSize="small" />
        </IconButton>
        
        <IconButton size="sm" onClick={() => formatText('italic')}>
          <FormatItalicIcon fontSize="small" />
        </IconButton>
        
        <IconButton size="sm" onClick={() => formatText('underline')}>
          <FormatUnderlinedIcon fontSize="small" />
        </IconButton>
        
        <IconButton size="sm" onClick={() => formatText('insertUnorderedList')}>
          <FormatListBulletedIcon fontSize="small" />
        </IconButton>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <IconButton size="sm" onClick={handleClose} color="neutral">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>
      
      <Box
        sx={{
          flex: 1,
          p: 2,
          overflow: "auto",
          backgroundColor: "background.surface",
          '&:focus': {
            outline: "2px solid",
            outlineColor: "primary.500",
          }
        }}
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleContentChange}
      />
    </Box>
  );
}