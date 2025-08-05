import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import SimpleApp from './SimpleApp';
import reportWebVitals from './reportWebVitals';
import * as serviceWorkerRegistration from './serviceWorker';

// Get the root element
const container = document.getElementById('root');
if (!container) {
  throw new Error('Failed to find the root element');
}

// Create root and render the app
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <SimpleApp />
  </React.StrictMode>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note that this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.register();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
