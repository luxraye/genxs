import React from 'react';
import ReactDOM from 'react-dom/client';
import { TorrentProvider } from './context/TorrentContext';
import App from './App';
import { SpineProvider } from '@shared/lib/spine/react';
import { ErrorBoundary } from '@shared/lib/ErrorBoundary';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TorrentProvider>
      <ErrorBoundary surface="torrent"><SpineProvider><App /></SpineProvider></ErrorBoundary>
    </TorrentProvider>
  </React.StrictMode>
);
