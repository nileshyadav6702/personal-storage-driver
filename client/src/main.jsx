import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './index.css'
import App from './App.jsx'
import Login from './pages/login.jsx';
import Register from './pages/Register.jsx';
import PortfolioSection from './Demo.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/:dirId" element={<App />} />
        <Route path="/demo" element={<PortfolioSection />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)