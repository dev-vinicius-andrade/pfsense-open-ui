import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { loadConfig } from './config/loader';
import { useConfigStore } from './stores/configStore';

async function bootstrap() {
  const config = await loadConfig();
  useConfigStore.getState().setConfig(config);

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

bootstrap();