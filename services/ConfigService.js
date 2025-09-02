const fs = require('fs').promises;
const path = require('path');
const { app } = require('electron');
const EventEmitter = require('events');

class ConfigService extends EventEmitter {
  constructor() {
    super();
    this.configPath = this.getConfigPath();
    this.config = this.getDefaultConfig();
    this.isLoaded = false;
  }

  getConfigPath() {
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'config.json');
  }

  getDefaultConfig() {
    return {
      // Spotify настройки
      spotify: {
        clientId: '',
        clientSecret: '',
        refreshToken: '',
        accessToken: '',
        tokenExpiry: null
      },

      // Поведение приложения
      behavior: {
        showOnMinimize: true,        // Показывать плеер при сворачивании Spotify
        hideOnRestore: true,         // Скрывать плеер при разворачивании Spotify
        autoStart: true,             // Автозапуск с Windows
        startMinimized: true,        // Запускать свернутым в трей
        closeToTray: true,           // Сворачивать в трей вместо закрытия
        showNotifications: true      // Показывать уведомления
      },

      // UI настройки
      ui: {
        theme: 'auto',               // 'light', 'dark', 'auto'
        opacity: 0.95,               // Прозрачность плеера (0.5 - 1.0)
        scale: 1.0,                  // Масштаб плеера (0.5 - 2.0)
        position: 'center',          // 'center', 'top', 'bottom', 'custom'
        customPosition: { x: 0, y: 0 }, // Кастомная позиция
        alwaysOnTop: true,           // Всегда поверх других окон
        clickThrough: false,         // Пропускать клики мыши
        hideToTrayNotificationShown: false,
        animations: {
          fadeIn: true,              // Анимация появления
          fadeOut: true,             // Анимация исчезновения
          hover: true,               // Анимации при наведении
          transitions: true          // Плавные переходы
        }
      },

      // Дисплей настройки
      display: {
        targetDisplay: 'primary',    // 'primary', 'secondary', или ID дисплея
        followSpotify: true,         // Показывать плеер на том же дисплее что и Spotify
        multiMonitorMode: 'single'   // 'single', 'all', 'primary'
      },

      // Горячие клавиши
      hotkeys: {
        enabled: true,
        global: {
          togglePlayer: 'Ctrl+Shift+P',
          playPause: 'Ctrl+Shift+Space',
          nextTrack: 'Ctrl+Shift+Right',
          previousTrack: 'Ctrl+Shift+Left',
          volumeUp: 'Ctrl+Shift+Up',
          volumeDown: 'Ctrl+Shift+Down'
        }
      },

      // Расширенные настройки
      advanced: {
        pollingInterval: 1000,       // Интервал обновления данных (мс)
        cacheTimeout: 2000,          // Время кэширования (мс)
        maxRetries: 3,               // Максимум повторных попыток
        logLevel: 'info',            // 'error', 'warn', 'info', 'debug'
        enableDebugMode: false,      // Режим отладки
        hardwareAcceleration: true,  // Аппаратное ускорение
        backgroundThrottling: false  // Ограничение фоновых процессов
      },

      // Система настройки
      system: {
        autoStart: false,
        startMinimized: true,
        checkForUpdates: true,
        sendAnalytics: false,
        enableLogging: true,
        version: app.getVersion()
      },

      // Настройки плеера
      player: {
        showAlbumArt: true,
        showProgressBar: true,
        showTimeLabels: true,
        showControlButtons: true,
        enableMarquee: true,
        marqueeSpeed: 8,             // Скорость прокрутки (сек)
        progressBarHeight: 9,        // Высота прогресс-бара (px)
        fontSize: {
          title: 64,
          artist: 48,
          time: 24
        }
      }
    };
  }

  async load() {
    try {
      const exists = await this.fileExists(this.configPath);
      
      if (exists) {
        const data = await fs.readFile(this.configPath, 'utf-8');
        const loadedConfig = JSON.parse(data);
        
        // Мержим с дефолтной конфигурацией для обратной совместимости
        this.config = this.deepMerge(this.getDefaultConfig(), loadedConfig);
        
        console.log('Конфигурация загружена из', this.configPath);
      } else {
        // Создаем файл с дефолтной конфигурацией
        await this.save();
        console.log('Создан новый конфигурационный файл');
      }
      
      this.isLoaded = true;
      this.emit('loaded', this.config);
      
      return this.config;
    } catch (error) {
      console.error('Ошибка загрузки конфигурации:', error);
      
      // В случае ошибки используем дефолтную конфигурацию
      this.config = this.getDefaultConfig();
      this.isLoaded = true;
      
      throw error;
    }
  }

  async save() {
    try {
      // Создаем директорию если не существует
      const configDir = path.dirname(this.configPath);
      await fs.mkdir(configDir, { recursive: true });
      
      // Сохраняем с красивым форматированием
      const data = JSON.stringify(this.config, null, 2);
      await fs.writeFile(this.configPath, data, 'utf-8');
      
      console.log('Конфигурация сохранена в', this.configPath);
      this.emit('saved', this.config);
      
      return true;
    } catch (error) {
      console.error('Ошибка сохранения конфигурации:', error);
      throw error;
    }
  }

  get(key) {
    if (!this.isLoaded) {
      console.warn('Конфигурация еще не загружена');
      return null;
    }

    return this.getNestedValue(this.config, key);
  }

  async set(key, value) {
    if (!this.isLoaded) {
      await this.load();
    }

    const oldValue = this.get(key);
    this.setNestedValue(this.config, key, value);
    
    // Автосохранение
    await this.save();
    
    // Уведомляем об изменении
    this.emit('changed', {
      key,
      oldValue,
      newValue: value,
      config: this.config
    });

    return true;
  }

  getAll() {
    return { ...this.config };
  }

  async saveAll(newConfig) {
    const oldConfig = { ...this.config };
    this.config = this.deepMerge(this.getDefaultConfig(), newConfig);
    
    await this.save();
    
    this.emit('changed', {
      key: '*',
      oldValue: oldConfig,
      newValue: this.config,
      config: this.config
    });

    return true;
  }

  // Специфичные методы для часто используемых настроек
  async updateSpotifyTokens(tokens) {
    const updates = {};
    
    if (tokens.accessToken) {
      updates['spotify.accessToken'] = tokens.accessToken;
    }
    if (tokens.refreshToken) {
      updates['spotify.refreshToken'] = tokens.refreshToken;
    }
    if (tokens.expiresIn) {
      updates['spotify.tokenExpiry'] = Date.now() + (tokens.expiresIn * 1000);
    }

    // Батчевое обновление
    for (const [key, value] of Object.entries(updates)) {
      this.setNestedValue(this.config, key, value);
    }

    await this.save();
    return true;
  }

  async resetToDefaults() {
    // Сохраняем некоторые важные данные
    const preservedData = {
      'spotify.refreshToken': this.get('spotify.refreshToken'),
      'spotify.clientId': this.get('spotify.clientId'),
      'spotify.clientSecret': this.get('spotify.clientSecret'),
      'ui.hideToTrayNotificationShown': this.get('ui.hideToTrayNotificationShown')
    };

    this.config = this.getDefaultConfig();

    // Восстанавливаем сохраненные данные
    for (const [key, value] of Object.entries(preservedData)) {
      if (value !== null && value !== undefined) {
        this.setNestedValue(this.config, key, value);
      }
    }

    await this.save();
    
    this.emit('reset', this.config);
    return true;
  }

  // Валидация конфигурации
  validate() {
    const errors = [];

    // Проверяем Spotify настройки
    if (!this.get('spotify.clientId')) {
      errors.push('spotify.clientId не может быть пустым');
    }

    // Проверяем UI настройки
    const opacity = this.get('ui.opacity');
    if (opacity < 0.1 || opacity > 1.0) {
      errors.push('ui.opacity должно быть между 0.1 и 1.0');
    }

    const scale = this.get('ui.scale');
    if (scale < 0.1 || scale > 3.0) {
      errors.push('ui.scale должно быть между 0.1 и 3.0');
    }

    // Проверяем интервалы
    const pollingInterval = this.get('advanced.pollingInterval');
    if (pollingInterval < 100 || pollingInterval > 10000) {
      errors.push('advanced.pollingInterval должно быть между 100 и 10000 мс');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Экспорт/импорт конфигурации
  async exportConfig(filePath) {
    try {
      const data = JSON.stringify(this.config, null, 2);
      await fs.writeFile(filePath, data, 'utf-8');
      return true;
    } catch (error) {
      console.error('Ошибка экспорта конфигурации:', error);
      throw error;
    }
  }

  async importConfig(filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      const importedConfig = JSON.parse(data);
      
      // Валидируем импортированную конфигурацию
      const tempConfig = this.deepMerge(this.getDefaultConfig(), importedConfig);
      const validation = this.validate.call({ config: tempConfig, get: (key) => this.getNestedValue(tempConfig, key) });
      
      if (!validation.valid) {
        throw new Error(`Невалидная конфигурация: ${validation.errors.join(', ')}`);
      }

      this.config = tempConfig;
      await this.save();
      
      this.emit('imported', this.config);
      return true;
    } catch (error) {
      console.error('Ошибка импорта конфигурации:', error);
      throw error;
    }
  }

  // Утилиты
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (current[key] === undefined) {
        current[key] = {};
      }
      return current[key];
    }, obj);
    
    target[lastKey] = value;
  }

  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  // Статистика использования
  async updateUsageStats() {
    const stats = this.get('usage') || {};
    const today = new Date().toISOString().split('T')[0];
    
    stats.lastUsed = Date.now();
    stats.totalLaunches = (stats.totalLaunches || 0) + 1;
    stats.dailyUsage = stats.dailyUsage || {};
    stats.dailyUsage[today] = (stats.dailyUsage[today] || 0) + 1;

    await this.set('usage', stats);
  }

  // Очистка старых данных
  async cleanup() {
    // Удаляем старые данные использования (старше 30 дней)
    const stats = this.get('usage');
    if (stats && stats.dailyUsage) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      for (const date in stats.dailyUsage) {
        if (new Date(date) < thirtyDaysAgo) {
          delete stats.dailyUsage[date];
        }
      }
      
      await this.set('usage', stats);
    }
  }

  // Миграция конфигурации между версиями
  async migrate() {
    const currentVersion = this.get('system.version');
    const appVersion = app.getVersion();
    
    if (currentVersion !== appVersion) {
      console.log(`Миграция конфигурации с ${currentVersion} на ${appVersion}`);
      
      // Здесь можно добавить логику миграции между версиями
      await this.set('system.version', appVersion);
      
      this.emit('migrated', {
        from: currentVersion,
        to: appVersion,
        config: this.config
      });
    }
  }
}

module.exports = ConfigService;
