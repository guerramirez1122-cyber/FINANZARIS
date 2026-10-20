import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register PWA Service Worker for offline support and installation
if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'test') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[PWA] Service Worker registrado con éxito en:', registration.scope);
      })
      .catch((error) => {
        console.warn('[PWA] Error registrando Service Worker:', error);
      });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
