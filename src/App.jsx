import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Player from './Player';
// import Settings from './Settings';

const AppContent = () => {
  const location = useLocation();
  const isElectron = window.electronAPI !== undefined;
  const isOverlay = location.hash === '#/overlay' || location.pathname.includes('overlay');

  // Если это overlay режим, показываем только плеер
  if (isOverlay) {
    return (
      <div style={{ 
        width: '100vw', 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'transparent'
      }}>
        <Player />
      </div>
    );
  }

  // Если это браузер (не Electron), показываем демо
  if (!isElectron) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '20px',
          borderRadius: '16px',
          color: '#ffffff',
          textAlign: 'center',
          fontFamily: 'Inter, sans-serif',
          marginBottom: '20px'
        }}>
          <h2>🎵 Spotify Overlay Player - Демо Режим</h2>
          <p>Это демонстрация интерфейса плеера в браузере</p>
          <p>Для полной функциональности запустите как Electron приложение</p>
        </div>
        <Player />
      </div>
    );
  }

  // Electron режим - главное окно с настройками
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#1a1a1a',
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '40px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h1 style={{ marginBottom: '20px', fontSize: '32px', fontWeight: '700' }}>
          🎵 Spotify Overlay Player
        </h1>
        <p style={{ marginBottom: '20px', fontSize: '18px', opacity: 0.8 }}>
          Настройки скоро будут...
        </p>
        <p style={{ fontSize: '14px', opacity: 0.6 }}>
          Плеер работает в системном трее<br />
          Двойной клик на иконке → показать overlay
        </p>
      </div>
      {/* 
      <Routes>
        <Route path="/" element={<Settings />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
      */}
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;