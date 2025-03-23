import * as React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

// DOMContentLoadedイベントを待ってからレンダリングする
document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.getElementById('root');
  
  if (rootElement) {
    const root = createRoot(rootElement);
    root.render(<App />);
  } else {
    console.error('Could not find root element');
  }
}); 