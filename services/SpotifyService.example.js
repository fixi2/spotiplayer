const axios = require('axios');
const crypto = require('crypto');
const express = require('express');
// const open = require('open');  // Убираем open, используем shell.openExternal в Electron
const { BrowserWindow, shell } = require('electron');

class SpotifyService {
  constructor() {
    // ⚠️ ВАЖНО: Замените на ваши реальные значения из Spotify Developer Dashboard
    // НЕ КОММИТЬТЕ реальные значения в git!
    this.clientId = 'YOUR_SPOTIFY_CLIENT_ID_HERE';
    this.clientSecret = 'YOUR_SPOTIFY_CLIENT_SECRET_HERE';
    
    // GitHub Pages URL для callback
    this.redirectUri = 'https://fixi2.github.io/spotiplayer/callback.html';
    this.alternativeUris = [
      'https://fixi2.github.io/spotiplayer/callback.html',   // GitHub Pages
      'http://localhost:3000/callback',                      // Локальная разработка
      'http://localhost:8888/callback'                       // Резервный
    ];
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    this.isConnected = false;
    this.currentTrack = null;
    this.playbackState = null;
    this.authServer = null;
    this.authPort = 3000;
    this.alternativePorts = [8888, 3001, 3002];
    this.isInitialized = false;
  }

  // ... остальные методы остаются без изменений
}

module.exports = SpotifyService;
