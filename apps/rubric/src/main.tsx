import React from 'react';
import { createRoot } from 'react-dom/client';
import { SpineProvider } from '@shared/lib/spine/react';
import { ErrorBoundary } from '@shared/lib/ErrorBoundary';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary surface="rubric"><SpineProvider><App /></SpineProvider></ErrorBoundary>
  </React.StrictMode>
);
