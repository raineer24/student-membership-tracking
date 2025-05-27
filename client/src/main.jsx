// main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // <-- Import this
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
   {/* 👈 Wrap your app here */}
      <App />

  </React.StrictMode>
);