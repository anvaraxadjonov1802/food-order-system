import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Telegram Mini App — bot ichida oyna bo'lib ochilganda to'liq balandlikda ochiladi
const tg = window.Telegram && window.Telegram.WebApp;
if (tg) {
  try { tg.ready(); tg.expand(); } catch (e) {}
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
