import { StrictMode } from 'react'
import './i18n'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { serviceWorkerManager } from './utils/serviceWorker'
import ErrorBoundary from './components/ErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

// Register service worker in production
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  serviceWorkerManager.register().then((registration) => {
    if (registration) {
      console.log('Service Worker registered successfully');
    }
  }).catch((error) => {
    console.error('Service Worker registration failed:', error);
  });
}
