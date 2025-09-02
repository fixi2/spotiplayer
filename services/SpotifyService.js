const axios = require('axios');
const crypto = require('crypto');
const express = require('express');
// const open = require('open');  // Убираем open, используем shell.openExternal в Electron
const { BrowserWindow, shell } = require('electron');

class SpotifyService {
  constructor() {
    // TODO: Замените на ваши реальные значения из Spotify Developer Dashboard
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
    
    // Настройки polling
    this.pollingInterval = null;
    this.pollingFrequency = 1000; // 1 секунда
    
    // Express сервер для авторизации
    this.authServer = null;
    this.authPort = 3000;  // Изменили порт
    
    // События
    this.eventCallbacks = {
      trackChanged: [],
      playbackStateChanged: [],
      connectionChanged: []
    };

    // Scopes для Spotify API
    this.scopes = [
      'user-read-currently-playing',
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-private'
    ].join(' ');
  }

  async initialize(config = {}) {
    this.clientId = config.clientId || process.env.SPOTIFY_CLIENT_ID;
    this.clientSecret = config.clientSecret || process.env.SPOTIFY_CLIENT_SECRET;
    
    if (!this.clientId) {
      throw new Error('Spotify Client ID не найден. Укажите его в настройках.');
    }

    // Пытаемся загрузить сохраненные токены
    if (config.refreshToken) {
      this.refreshToken = config.refreshToken;
      await this.refreshAccessToken();
    }

    console.log('SpotifyService инициализирован');
  }

  async getAuthUrl() {
    const state = crypto.randomBytes(16).toString('hex');
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = this.generateCodeChallenge(codeVerifier);
    
    // Сохраняем для использования позже
    this.authState = state;
    this.codeVerifier = codeVerifier;

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope: this.scopes,
      state: state,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge
    });

    const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
    
    // Запускаем локальный сервер для обработки callback
    await this.startAuthServer();
    
    return authUrl;
  }

  async startAuthServer() {
    if (this.authServer) {
      return; // Сервер уже запущен
    }

    return new Promise((resolve, reject) => {
      const app = express();
      
      app.get('/callback', async (req, res) => {
        const { code, state, error } = req.query;
        
        if (error) {
          res.send(`<h1>Ошибка авторизации: ${error}</h1>`);
          this.stopAuthServer();
          reject(new Error(`Spotify authorization error: ${error}`));
          return;
        }

        if (state !== this.authState) {
          res.send('<h1>Ошибка: неверный state параметр</h1>');
          this.stopAuthServer();
          reject(new Error('Invalid state parameter'));
          return;
        }

        try {
          await this.exchangeCodeForTokens(code);
          res.send(`
            <h1>✅ Авторизация успешна!</h1>
            <p>Теперь вы можете закрыть это окно и вернуться к приложению.</p>
            <script>window.close();</script>
          `);
          this.stopAuthServer();
          resolve();
        } catch (exchangeError) {
          res.send(`<h1>Ошибка обмена токена: ${exchangeError.message}</h1>`);
          this.stopAuthServer();
          reject(exchangeError);
        }
      });

      this.authServer = app.listen(this.authPort, () => {
        console.log(`Auth server запущен на порту ${this.authPort}`);
        resolve();
      });
      
      // Обработка ошибок порта
      this.authServer.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`Порт ${this.authPort} занят, пробуем 8888...`);
          this.authPort = 8888;
          this.redirectUri = 'http://localhost:8888/callback';
          this.authServer = app.listen(this.authPort, () => {
            console.log(`Auth server запущен на порту ${this.authPort}`);
            resolve();
          });
        }
      });
    });
  }

  stopAuthServer() {
    if (this.authServer) {
      this.authServer.close();
      this.authServer = null;
      console.log('Auth server остановлен');
    }
  }

  async exchangeCodeForTokens(code) {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: this.redirectUri,
      client_id: this.clientId,
      code_verifier: this.codeVerifier
    });

    try {
      const response = await axios.post('https://accounts.spotify.com/api/token', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const { access_token, refresh_token, expires_in } = response.data;
      
      this.accessToken = access_token;
      this.refreshToken = refresh_token;
      this.tokenExpiry = Date.now() + (expires_in * 1000);
      this.isConnected = true;

      // Начинаем polling
      this.startPolling();
      
      // Уведомляем о подключении
      this.emit('connectionChanged', true);

      console.log('Spotify токены получены успешно');
      
      return {
        accessToken: this.accessToken,
        refreshToken: this.refreshToken,
        expiresIn: expires_in
      };
    } catch (error) {
      console.error('Ошибка обмена кода на токен:', error.response?.data || error.message);
      throw new Error(`Failed to exchange code for tokens: ${error.message}`);
    }
  }

  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('Refresh token отсутствует');
    }

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: this.refreshToken,
      client_id: this.clientId
    });

    try {
      const response = await axios.post('https://accounts.spotify.com/api/token', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const { access_token, expires_in, refresh_token } = response.data;
      
      this.accessToken = access_token;
      if (refresh_token) {
        this.refreshToken = refresh_token;
      }
      this.tokenExpiry = Date.now() + (expires_in * 1000);
      this.isConnected = true;

      // Начинаем polling если еще не запущен
      if (!this.pollingInterval) {
        this.startPolling();
      }

      console.log('Access token обновлен');
      this.emit('connectionChanged', true);
      
      return this.accessToken;
    } catch (error) {
      console.error('Ошибка обновления токена:', error.response?.data || error.message);
      this.isConnected = false;
      this.emit('connectionChanged', false);
      throw new Error(`Failed to refresh access token: ${error.message}`);
    }
  }

  async ensureValidToken() {
    if (!this.accessToken) {
      throw new Error('Access token отсутствует. Необходима авторизация.');
    }

    // Проверяем, не истек ли токен (с запасом в 5 минут)
    if (this.tokenExpiry && Date.now() > (this.tokenExpiry - 300000)) {
      await this.refreshAccessToken();
    }
  }

  async getCurrentTrack() {
    await this.ensureValidToken();

    try {
      const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (response.status === 204 || !response.data) {
        return null; // Ничего не играет
      }

      const track = this.parseTrackData(response.data);
      
      // Проверяем, изменился ли трек
      if (!this.tracksEqual(this.currentTrack, track)) {
        this.currentTrack = track;
        this.emit('trackChanged', track);
      }

      return track;
    } catch (error) {
      if (error.response?.status === 401) {
        // Токен невалиден
        await this.refreshAccessToken();
        return this.getCurrentTrack(); // Повторная попытка
      }
      console.error('Ошибка получения текущего трека:', error.response?.data || error.message);
      throw error;
    }
  }

  async getPlaybackState() {
    await this.ensureValidToken();

    try {
      const response = await axios.get('https://api.spotify.com/v1/me/player', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (response.status === 204 || !response.data) {
        return null;
      }

      const state = {
        isPlaying: response.data.is_playing,
        shuffleState: response.data.shuffle_state,
        repeatState: response.data.repeat_state,
        progressMs: response.data.progress_ms,
        device: response.data.device,
        volume: response.data.device?.volume_percent || 0
      };

      // Проверяем, изменилось ли состояние
      if (!this.statesEqual(this.playbackState, state)) {
        this.playbackState = state;
        this.emit('playbackStateChanged', state);
      }

      return state;
    } catch (error) {
      if (error.response?.status === 401) {
        await this.refreshAccessToken();
        return this.getPlaybackState();
      }
      console.error('Ошибка получения состояния воспроизведения:', error.response?.data || error.message);
      throw error;
    }
  }

  async controlPlayback(action, data = {}) {
    await this.ensureValidToken();

    let endpoint = '';
    let method = 'PUT';
    let body = null;

    switch (action) {
      case 'play':
        endpoint = 'https://api.spotify.com/v1/me/player/play';
        break;
      case 'pause':
        endpoint = 'https://api.spotify.com/v1/me/player/pause';
        break;
      case 'next':
        endpoint = 'https://api.spotify.com/v1/me/player/next';
        method = 'POST';
        break;
      case 'previous':
        endpoint = 'https://api.spotify.com/v1/me/player/previous';
        method = 'POST';
        break;
      case 'seek':
        endpoint = `https://api.spotify.com/v1/me/player/seek?position_ms=${data.positionMs}`;
        break;
      case 'volume':
        endpoint = `https://api.spotify.com/v1/me/player/volume?volume_percent=${data.volumePercent}`;
        break;
      case 'shuffle':
        endpoint = `https://api.spotify.com/v1/me/player/shuffle?state=${data.state}`;
        break;
      case 'repeat':
        endpoint = `https://api.spotify.com/v1/me/player/repeat?state=${data.state}`;
        break;
      default:
        throw new Error(`Неизвестное действие: ${action}`);
    }

    try {
      await axios({
        method,
        url: endpoint,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        data: body
      });

      // Обновляем состояние после выполнения действия
      setTimeout(() => {
        this.getCurrentTrack();
        this.getPlaybackState();
      }, 100);

    } catch (error) {
      if (error.response?.status === 401) {
        await this.refreshAccessToken();
        return this.controlPlayback(action, data);
      }
      console.error('Ошибка управления воспроизведением:', error.response?.data || error.message);
      throw error;
    }
  }

  startPolling() {
    if (this.pollingInterval) {
      return; // Уже запущен
    }

    this.pollingInterval = setInterval(async () => {
      try {
        await Promise.all([
          this.getCurrentTrack(),
          this.getPlaybackState()
        ]);
      } catch (error) {
        console.error('Ошибка polling:', error.message);
      }
    }, this.pollingFrequency);

    console.log('Spotify polling запущен');
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('Spotify polling остановлен');
    }
  }

  // Утилиты
  parseTrackData(data) {
    if (!data || !data.item) {
      return null;
    }

    const item = data.item;
    return {
      id: item.id,
      name: item.name,
      artists: item.artists.map(artist => artist.name),
      album: item.album.name,
      albumArt: item.album.images[0]?.url || null,
      duration: item.duration_ms,
      isPlaying: data.is_playing,
      progress: data.progress_ms,
      uri: item.uri,
      externalUrls: item.external_urls
    };
  }

  tracksEqual(track1, track2) {
    if (!track1 && !track2) return true;
    if (!track1 || !track2) return false;
    return track1.id === track2.id && track1.progress === track2.progress;
  }

  statesEqual(state1, state2) {
    if (!state1 && !state2) return true;
    if (!state1 || !state2) return false;
    
    return state1.isPlaying === state2.isPlaying &&
           state1.shuffleState === state2.shuffleState &&
           state1.repeatState === state2.repeatState &&
           state1.volume === state2.volume;
  }

  generateCodeVerifier() {
    return crypto.randomBytes(32).toString('base64url');
  }

  generateCodeChallenge(verifier) {
    return crypto.createHash('sha256').update(verifier).digest('base64url');
  }

  // События
  on(event, callback) {
    if (this.eventCallbacks[event]) {
      this.eventCallbacks[event].push(callback);
    }
  }

  off(event, callback) {
    if (this.eventCallbacks[event]) {
      const index = this.eventCallbacks[event].indexOf(callback);
      if (index > -1) {
        this.eventCallbacks[event].splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.eventCallbacks[event]) {
      this.eventCallbacks[event].forEach(callback => callback(data));
    }
  }

  // Очистка
  destroy() {
    this.stopPolling();
    this.stopAuthServer();
    this.eventCallbacks = {};
    console.log('SpotifyService уничтожен');
  }
}

module.exports = SpotifyService;
