import * as React from 'react';
import GlobalStyles from '@mui/joy/GlobalStyles';
import IconButton from '@mui/joy/IconButton';
import Sheet from '@mui/joy/Sheet';
import Button from '@mui/joy/Button';
import Typography from '@mui/joy/Typography';

export default function Header() {
  return (
    <Sheet
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'fixed',
        top: 0,
        width: '100vw',
        height: '50px',
        zIndex: 9995,
        p: 1,
        backgroundColor: '#1976D2', // Matches the blue theme
        color: 'white',
        boxShadow: 'sm',
      }}
    >
     <GlobalStyles
  styles={{
    ':root': {
      '--Header-height': '60px',
    },
    'body': {
      marginTop: '100px',
    }
  }}
/>

      
      {/* Left Side - Title */}
      <Typography component="h5" sx={{ fontWeight: 'bold', color:"white" }}>
        Transcript to Newsletter App
      </Typography>
      
    </Sheet>
  );
}
