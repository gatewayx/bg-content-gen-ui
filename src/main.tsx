import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { StyledEngineProvider } from '@mui/joy/styles';
import App from './App';
import ErrorBoundary from "./ErrorBoundry";

ReactDOM.createRoot(document.querySelector("#root")!).render(
  <React.StrictMode>
    {/* <ErrorBoundary> */}
    <StyledEngineProvider injectFirst>
      <App />
    </StyledEngineProvider>
    {/* </ErrorBoundary> */}
  </React.StrictMode>
);