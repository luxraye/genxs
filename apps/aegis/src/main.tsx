import React from 'react';
import ReactDOM from 'react-dom/client';
import { AegisProvider } from './context/AegisContext';
import App from './App';
import { SpineProvider } from '@shared/lib/spine/react';
import { ErrorBoundary } from '@shared/lib/ErrorBoundary';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AegisProvider>
      <ErrorBoundary surface="aegis"><SpineProvider><App /></SpineProvider></ErrorBoundary>
    </AegisProvider>
  </React.StrictMode>
);
