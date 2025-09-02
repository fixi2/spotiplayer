const { contextBridge, ipcRenderer } = require('electron');

// Безопасный API для renderer процесса
contextBridge.exposeInMainWorld('electronAPI', {
  // Spotify интеграция
  spotify: {
    auth: () => ipcRenderer.invoke('spotify-auth'),
    getCurrentTrack: () => ipcRenderer.invoke('get-current-track'),
    controlPlayback: (action, data) => ipcRenderer.invoke('control-playback', action, data),
  },

  // Конфигурация приложения
  config: {
    get: () => ipcRenderer.invoke('get-app-config'),
    save: (config) => ipcRenderer.invoke('save-app-config', config),
  },

  // UI управление
  ui: {
    showSettings: () => ipcRenderer.invoke('show-settings'),
  },

  // События (подписка на обновления)
  events: {
    onTrackChanged: (callback) => {
      ipcRenderer.on('track-changed', (event, track) => callback(track));
      return () => ipcRenderer.removeAllListeners('track-changed');
    },
    
    onPlaybackStateChanged: (callback) => {
      ipcRenderer.on('playback-state-changed', (event, state) => callback(state));
      return () => ipcRenderer.removeAllListeners('playback-state-changed');
    },

    onSpotifyConnectionChanged: (callback) => {
      ipcRenderer.on('spotify-connection-changed', (event, isConnected) => callback(isConnected));
      return () => ipcRenderer.removeAllListeners('spotify-connection-changed');
    },

    onConfigChanged: (callback) => {
      ipcRenderer.on('config-changed', (event, config) => callback(config));
      return () => ipcRenderer.removeAllListeners('config-changed');
    }
  },

  // Утилиты
  utils: {
    openExternal: (url) => ipcRenderer.invoke('open-external', url),
    getVersion: () => ipcRenderer.invoke('get-version'),
    getPlatform: () => process.platform,
    isDevMode: () => ipcRenderer.invoke('is-dev-mode'),
  }
});
