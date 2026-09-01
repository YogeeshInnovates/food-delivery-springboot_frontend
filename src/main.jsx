import { StrictMode, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import WakeUpScreen from './components/WakeUpScreen.jsx';

function Root() {
  const [ready, setReady] = useState(false);
  const handleReady = useCallback(() => setReady(true), []);

  if (!ready) {
    return <WakeUpScreen onReady={handleReady} />;
  }

  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
