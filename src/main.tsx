import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import './theme/tokens.css';
import './theme/app.css';
import { App } from './App';
import { IS_ARTIFACT } from './lib/env';

// The hosted artifact can't use real URLs, so it keeps routes in memory.
const Router = IS_ARTIFACT ? MemoryRouter : BrowserRouter;

// Ask the browser to keep our IndexedDB data rather than evicting it under storage pressure.
void navigator.storage?.persist?.();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <App />
    </Router>
  </StrictMode>,
);
