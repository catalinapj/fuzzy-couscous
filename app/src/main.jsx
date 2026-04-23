import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const originalFetch = window.fetch;

window.fetch = async function (...args) {
  const response = await originalFetch.apply(this, args);

  if (response.status === 401) {
    localStorage.removeItem("access_token");
    window.location.href = "/login";
    return new Response(null, { status: 401 });
  }

  return response;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
