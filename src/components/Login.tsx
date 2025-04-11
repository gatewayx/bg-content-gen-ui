import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CssVarsProvider } from '@mui/joy/styles';
import Sheet from '@mui/joy/Sheet';
import Typography from '@mui/joy/Typography';
import Button from '@mui/joy/Button';
import Link from '@mui/joy/Link';
import Alert from '@mui/joy/Alert';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithGoogle, isAuthenticated } = useAuth();
  const [showExpiredAlert, setShowExpiredAlert] = React.useState(false);

  React.useEffect(() => {
    // Check for expired token in URL parameters
    const params = new URLSearchParams(location.search);
    if (params.get('error') === 'expired_token') {
      setShowExpiredAlert(true);
    }

    // Check for existing session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Store user info in localStorage
        localStorage.setItem('user', JSON.stringify({
          email: session.user.email,
          name: session.user.user_metadata?.full_name,
          avatar: session.user.user_metadata?.avatar_url,
        }));
        navigate('/');
      }
    };
    checkSession();
  }, [navigate, location]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      // The redirect will be handled by the useEffect above
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  if (isAuthenticated) {
    navigate('/');
    return null;
  }

  return (
    <CssVarsProvider>
      <main style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: 'var(--joy-palette-background-body)'
      }}>
        <Sheet
          sx={{
            width: 350,
            py: 3,
            px: 2.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
            borderRadius: 'sm',
            boxShadow: 'md',
            backgroundColor: 'var(--joy-palette-background-surface)'
          }}
          variant="outlined"
        >
          {showExpiredAlert && (
            <Alert
              color="danger"
              variant="soft"
              sx={{ mb: 1.5 }}
            >
              Your session has expired. Please sign in again.
            </Alert>
          )}
          
          <div>
            {/* Logo Section */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              marginBottom: '1.5rem'
            }}>
              <div style={{
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                overflow: 'hidden',
                backgroundColor: 'var(--joy-palette-background-surface)'
              }}>
                <img 
                  src="./semi-logo-gateway.png" 
                  alt="GatewayX Logo" 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'contain',
                    padding: '10px'
                  }}
                />
              </div>
            </div>

            <Typography 
              level="h4" 
              component="h1" 
              textAlign="center"
              sx={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.75,
                color: 'var(--joy-palette-text-primary)',
                mb: 2
              }}
            >
              <span style={{ fontSize: '1.75em', fontWeight: 'bold' }}>Xpress</span>
              <Typography
                sx={{ 
                  fontSize: '0.75em',
                  verticalAlign: 'sub',
                  color: 'var(--joy-palette-text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                by{' '}
                <Link
                  href="https://gatewayx.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ 
                    color: 'var(--joy-palette-text-secondary)',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  GatewayX
                </Link>
              </Typography>
            </Typography>
            <Typography 
              level="body-sm" 
              textAlign="center" 
              sx={{ 
                mt: 2, 
                color: 'var(--joy-palette-text-secondary)', 
                mb: 2 
              }}
            >
              Sign in to continue.
            </Typography>
          </div>
          <Button
            onClick={handleGoogleSignIn}
            sx={{
              backgroundColor: 'var(--joy-palette-background-surface)',
              color: 'var(--joy-palette-text-primary)',
              '&:hover': {
                backgroundColor: 'var(--joy-palette-background-level1)',
              },
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              border: '1px solid var(--joy-palette-neutral-outlinedBorder)',
              padding: '12px 24px',
              fontSize: '1rem',
              '& .MuiSvgIcon-root': {
                width: '20px',
                height: '20px'
              }
            }}
          >
            <img 
              src="https://www.google.com/favicon.ico" 
              alt="Google" 
              style={{ 
                width: '20px', 
                height: '20px',
                marginRight: '8px'
              }} 
            />
            Sign in with Google
          </Button>
        </Sheet>
      </main>
    </CssVarsProvider>
  );
} 