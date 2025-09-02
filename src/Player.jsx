import React, { useState, useEffect, useRef } from 'react';
import './Player.css';
import FadeContent from '../FadeContent';

const Player = () => {
  // Состояния компонента
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(63); // секунды
  const [totalTime, setTotalTime] = useState(187); // секунды
  const [trackData, setTrackData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Refs для анимаций
  const titleRef = useRef(null);
  const artistRef = useRef(null);

  // Демо данные
  const demoTrack = {
    title: "Bohemian Rhapsody",
    artist: "Queen",
    album: "A Night at the Opera",
    image: "https://via.placeholder.com/180x180/1a1a1a/ffffff?text=♪",
    duration: 187000,
    progress: 63000,
    isPlaying: false
  };

  // Инициализация плеера
  useEffect(() => {
    initializePlayer();
    return () => cleanup();
  }, []);

  const initializePlayer = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Проверяем доступность Electron API
      if (window.electronAPI) {
        console.log('Electron API доступен, подключаемся...');
        
        // Подписываемся на события Spotify
        window.electronAPI.spotify.onTrackChanged(handleTrackChanged);
        window.electronAPI.spotify.onPlaybackStateChanged(handlePlaybackStateChanged);
        window.electronAPI.spotify.onSpotifyConnectionChanged(handleConnectionChanged);
        
        // Получаем текущий трек
        await fetchCurrentTrack();
      } else {
        console.log('Electron API недоступен, используем демо режим');
        // Демо режим для браузера
        setTrackData(demoTrack);
        setIsConnected(false);
        setCurrentTime(Math.floor(demoTrack.progress / 1000));
        setTotalTime(Math.floor(demoTrack.duration / 1000));
        setIsPlaying(demoTrack.isPlaying);
      }
    } catch (err) {
      console.error('Ошибка инициализации плеера:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const cleanup = () => {
    if (window.electronAPI) {
      // Отписываемся от событий при размонтировании
      window.electronAPI.spotify.removeAllListeners();
    }
  };

  const handleTrackChanged = (data) => {
    console.log('Трек изменен:', data);
    setTrackData(data);
    if (data) {
      setCurrentTime(Math.floor(data.progress / 1000));
      setTotalTime(Math.floor(data.duration / 1000));
    }
  };

  const handlePlaybackStateChanged = (data) => {
    console.log('Состояние воспроизведения изменено:', data);
    setIsPlaying(data.isPlaying);
    if (data.progress !== undefined) {
      setCurrentTime(Math.floor(data.progress / 1000));
    }
  };

  const handleConnectionChanged = (connected) => {
    console.log('Соединение со Spotify:', connected);
    setIsConnected(connected);
  };

  const fetchCurrentTrack = async () => {
    try {
      const response = await window.electronAPI.spotify.getCurrentTrack();
      if (response.success && response.track) {
        handleTrackChanged(response.track);
        setIsConnected(true);
      } else {
        setError(response.error || 'Не удалось получить данные трека');
      }
    } catch (err) {
      console.error('Ошибка получения трека:', err);
      setError(err.message);
    }
  };

  // Утилиты для времени
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Обработчики действий
  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const progressPercent = clickX / rect.width;
    const newTime = Math.floor(totalTime * progressPercent);
    
    if (window.electronAPI) {
      // Electron режим
      window.electronAPI.spotify.controlPlayback('seek', { position: newTime * 1000 });
    } else {
      // Демо режим
      setCurrentTime(newTime);
    }
  };

  const handleButtonClick = (action) => {
    if (window.electronAPI) {
      // Electron режим
      window.electronAPI.spotify.controlPlayback(action);
    } else {
      // Демо режим
      if (action === 'toggle') {
        setIsPlaying(!isPlaying);
      }
    }
  };

  // Данные для отображения
  const displayData = trackData || demoTrack;
  const progressPercent = totalTime > 0 ? (currentTime / totalTime) * 100 : 0;

  return (
    <FadeContent blur={true} duration={1000} easing="ease-out" initialOpacity={0}>
      <div className="player-container">
        {/* Фон с блюром */}
        <div className="player-background" />
        
        {/* Основная карточка */}
        <div className="player-card">
          {isLoading ? (
            <div className="loading-spinner">
              <div className="spinner" />
              <p>Загрузка плеера...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <p>❌ Ошибка: {error}</p>
              <button onClick={initializePlayer} className="retry-button">
                Повторить
              </button>
            </div>
          ) : (
            <>
              {/* Обложка альбома */}
              <div className="album-cover">
                <img 
                  src={displayData.image || 'https://via.placeholder.com/180x180/1a1a1a/ffffff?text=♪'} 
                  alt="Album Cover"
                />
              </div>

              {/* Информация о треке */}
              <div className="track-info">
                <div className="track-title-container">
                  <h1 
                    ref={titleRef}
                    className="track-title"
                    title={displayData.title}
                  >
                    {displayData.title || 'Неизвестный трек'}
                  </h1>
                </div>
                
                <div className="track-artist-container">
                  <h2 
                    ref={artistRef}
                    className="track-artist"
                    title={displayData.artist}
                  >
                    {displayData.artist || 'Неизвестный исполнитель'}
                  </h2>
                </div>

                {/* Прогресс бар */}
                <div className="progress-section">
                  <div className="progress-times">
                    <span className="time-current">{formatTime(currentTime)}</span>
                    <span className="time-total">{formatTime(totalTime)}</span>
                  </div>
                  
                  <div className="progress-bar-container" onClick={handleProgressClick}>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Контролы */}
                <div className="controls">
                  <button 
                    className="control-button"
                    onClick={() => handleButtonClick('previous')}
                  >
                    ⏮️
                  </button>
                  
                  <button 
                    className="control-button play-pause"
                    onClick={() => handleButtonClick('toggle')}
                  >
                    {isPlaying ? '⏸️' : '▶️'}
                  </button>
                  
                  <button 
                    className="control-button"
                    onClick={() => handleButtonClick('next')}
                  >
                    ⏭️
                  </button>
                </div>

                {/* Статус подключения */}
                <div className="connection-status">
                  <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
                    {isConnected ? '🟢 Spotify подключен' : '🔴 Spotify отключен'}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </FadeContent>
  );
};

export default Player;