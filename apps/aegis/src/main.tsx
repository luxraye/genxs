import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { SpineProvider } from '@shared/lib/spine/react';
import { ErrorBoundary } from '@shared/lib/ErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary surface="aegis">
      <SpineProvider>
        <App />
      </SpineProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
