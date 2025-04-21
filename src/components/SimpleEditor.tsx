import * as React from "react";
import Box from "@mui/joy/Box";
import Stack from "@mui/joy/Stack";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/joy/IconButton";
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  toolbarPlugin,
  UndoRedo,
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  InsertThematicBreak,
  ListsToggle,
} from "@mdxeditor/editor";
import '@mdxeditor/editor/style.css'
interface SimpleEditorProps {
  initialContent?: string;
  onSave?: (content: string) => void;
  onClose?: () => void;
}

export default function SimpleEditor({
  initialContent = "",
  onSave,
  onClose,
}: SimpleEditorProps) {
  // Create a ref to access the editor instance
  const editorRef = React.useRef<any>(null);

  // Function to handle content changes
  const handleContentChange = (content: string) => {
    if (onSave) {
      onSave(content);
    }
  };

  // Update editor content when initialContent changes
  React.useEffect(() => {
    if (editorRef.current && initialContent !== undefined) {
      // Set the editor content to the new initialContent
      editorRef.current.setMarkdown(initialContent);
    }
  }, [initialContent]);

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
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
        <Box sx={{ flexGrow: 1 }} />
        <IconButton size="sm" onClick={onClose} color="neutral">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>

      <Box
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
          "& .mdxeditor": {
            height: "100%",
            border: "none",
            backgroundColor: "transparent",
          },
          "& .mdxeditor-toolbar": {
            backgroundColor: "background.level1",
            borderBottom: "1px solid",
            borderColor: "divider",
          },
        }}
      >
        <MDXEditor
          ref={editorRef}
          markdown={initialContent}
          onChange={handleContentChange}
          plugins={[
            headingsPlugin(),
            listsPlugin(),
            quotePlugin(),
            thematicBreakPlugin(),
            markdownShortcutPlugin(),
            toolbarPlugin({
              toolbarContents: () => (
                <>
                  <UndoRedo />
                  <BlockTypeSelect />
                  <BoldItalicUnderlineToggles />
                  <InsertThematicBreak />
                  <ListsToggle />
                </>
              ),
            }),
          ]}
        />
      </Box>
    </Box>
  );
}
