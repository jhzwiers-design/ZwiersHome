import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { startHome } from './store/home';
import { installTapFeedback } from './lib/touch';
import './styles/index.css';

startHome();
installTapFeedback();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
