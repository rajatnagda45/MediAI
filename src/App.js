import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PatientForm from './pages/PatientForm';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';

function App() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <Router>
      <div className="min-h-screen relative overflow-hidden transition-colors duration-300">
        {/* Background Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[120px] pointer-events-none" />

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme} 
          className="fixed top-4 right-4 z-50 p-2 rounded-full glass-panel hover:bg-white/20 transition-all"
        >
          {theme === 'dark' ? '🌞' : '🌙'}
        </button>

        <div className="relative z-10 container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Navigate to="/register" replace />} />
            <Route path="/register" element={<PatientForm />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
