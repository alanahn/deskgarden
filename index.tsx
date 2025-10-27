
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { HashRouter } from 'react-router-dom';
import { NavProvider } from './contexts/NavContext'; // Import NavProvider

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HashRouter>
      <NavProvider> {/* Add NavProvider here */}
        <App />
      </NavProvider>
    </HashRouter>
  </React.StrictMode>
);