const { app, BrowserWindow, ipcMain, screen, Tray, Menu, dialog, shell, nativeImage } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { autoUpdater } = require('electron-updater');
const windowStateKeeper = require('electron-window-state');

// Windows API для работы с процессами (временно отключено)
// const ffi = require('ffi-napi');
// const ref = require('ref-napi');

// Импортируем наши сервисы (WindowsService временно отключен из-за ffi-napi)
const SpotifyService = require('../services/SpotifyService');
// const WindowsService = require('../services/WindowsService');  // Временно отключен
const ConfigService = require('../services/ConfigService');
const Logger = require('../utils/Logger');

class ElectronApp {
  constructor() {
    this.mainWindow = null;
    this.overlayWindow = null;
    this.tray = null;
    this.isQuiting = false;
    this.spotifyService = new SpotifyService();
    // this.windowsService = new WindowsService();  // Временно отключен
    this.windowsService = null;  // Заглушка
    this.configService = new ConfigService();
    this.logger = new Logger();
    
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // Основные события приложения
    app.whenReady().then(() => this.onReady());
    app.on('window-all-closed', this.onWindowAllClosed.bind(this));
    app.on('activate', this.onActivate.bind(this));
    app.on('before-quit', () => { this.isQuiting = true; });

    // IPC события для общения с рендерером
    ipcMain.handle('spotify-auth', this.handleSpotifyAuth.bind(this));
    ipcMain.handle('get-current-track', this.handleGetCurrentTrack.bind(this));
    ipcMain.handle('control-playback', this.handleControlPlayback.bind(this));
    ipcMain.handle('get-app-config', this.handleGetConfig.bind(this));
    ipcMain.handle('save-app-config', this.handleSaveConfig.bind(this));
    ipcMain.handle('show-settings', this.handleShowSettings.bind(this));
  }

  async onReady() {
    this.logger.info('Приложение запущено');
    
    // Создаем системный трей
    this.createTray();
    
    // Инициализируем сервисы
    await this.initializeServices();
    
    // Создаем главное окно (скрыто по умолчанию)
    this.createMainWindow();
    
    // Запускаем мониторинг Spotify
    this.startSpotifyMonitoring();
    
    // Автообновления
    if (!isDev) {
      autoUpdater.checkForUpdatesAndNotify();
    }
  }

  onWindowAllClosed() {
    // На macOS приложения обычно остаются активными даже после закрытия всех окон
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }

  onActivate() {
    // На macOS часто пересоздают окно после клика на иконку в доке
    if (BrowserWindow.getAllWindows().length === 0) {
      this.createMainWindow();
    }
  }

  async initializeServices() {
    try {
      await this.configService.load();
      await this.spotifyService.initialize(this.configService.get('spotify'));
      // this.windowsService.initialize();  // Временно отключен
      
      this.logger.info('Основные сервисы инициализированы (WindowsService отключен)');
    } catch (error) {
      this.logger.error('Ошибка инициализации сервисов:', error);
      this.showErrorDialog('Ошибка инициализации', error.message);
    }
  }

  createMainWindow() {
    // Состояние окна для запоминания позиции и размера
    const mainWindowState = windowStateKeeper({
      defaultWidth: 1200,
      defaultHeight: 800
    });

    this.mainWindow = new BrowserWindow({
      x: mainWindowState.x,
      y: mainWindowState.y,
      width: mainWindowState.width,
      height: mainWindowState.height,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: path.join(__dirname, 'preload.js')
      },
      icon: path.join(__dirname, 'assets', 'icon.png'),
      show: false,
      title: 'Spotify Overlay Player - Настройки'
    });

    // Управляем состоянием окна
    mainWindowState.manage(this.mainWindow);

    // Загружаем интерфейс настроек
    const startUrl = isDev 
      ? 'http://localhost:3000/settings' 
      : `file://${path.join(__dirname, '../build/index.html')}`;
    
    this.mainWindow.loadURL(startUrl);

    // События окна
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    this.mainWindow.on('close', (event) => {
      if (!this.isQuiting) {
        event.preventDefault();
        this.mainWindow.hide();
        
        // Показываем уведомление только в первый раз
        if (!this.configService.get('ui.hideToTrayNotificationShown')) {
          this.tray.displayBalloon({
            iconType: 'info',
            title: 'Spotify Overlay Player',
            content: 'Приложение продолжает работу в системном трее'
          });
          this.configService.set('ui.hideToTrayNotificationShown', true);
        }
      }
    });

    // Открытие внешних ссылок в браузере
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });
  }

  createOverlayWindow() {
    if (this.overlayWindow) {
      this.overlayWindow.focus();
      return;
    }

    const displays = screen.getAllDisplays();
    const targetDisplay = displays.find(display => 
      this.configService.get('display.targetDisplay') === display.id
    ) || screen.getPrimaryDisplay();

    const { width, height } = targetDisplay.workAreaSize;
    const { x, y } = targetDisplay.workArea;

    this.overlayWindow = new BrowserWindow({
      width: 1000,
      height: 320,
      x: x + (width - 1000) / 2,
      y: y + (height - 320) / 2,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      closable: false,
      focusable: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      }
    });

    // Делаем окно "проходным" для кликов мыши в областях без контента
    this.overlayWindow.setIgnoreMouseEvents(true, { forward: true });

    const overlayUrl = isDev 
      ? 'http://localhost:3000/overlay' 
      : `file://${path.join(__dirname, '../build/index.html')}#/overlay`;
    
    this.overlayWindow.loadURL(overlayUrl);

    this.overlayWindow.on('closed', () => {
      this.overlayWindow = null;
    });

    // Показываем окно с анимацией
    this.overlayWindow.showInactive();
    
    this.logger.info('Overlay окно создано');
  }

  hideOverlayWindow() {
    if (this.overlayWindow) {
      this.overlayWindow.close();
      this.overlayWindow = null;
      this.logger.info('Overlay окно скрыто');
    }
  }

  createTray() {
    // Временно используем встроенную иконку Electron
    const trayIcon = nativeImage.createEmpty();
    trayIcon.resize({ width: 16, height: 16 });
    this.tray = new Tray(trayIcon);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Показать плеер',
        click: () => this.createOverlayWindow()
      },
      {
        label: 'Скрыть плеер',
        click: () => this.hideOverlayWindow()
      },
      { type: 'separator' },
      {
        label: 'Настройки',
        click: () => this.showSettings()
      },
      {
        label: `Статус: ${this.spotifyService?.isConnected ? 'Подключен' : 'Отключен'}`,
        enabled: false
      },
      { type: 'separator' },
      {
        label: 'Автозапуск',
        type: 'checkbox',
        checked: this.configService.get('system.autoStart'),
        click: (menuItem) => this.toggleAutoStart(menuItem.checked)
      },
      { type: 'separator' },
      {
        label: 'О программе',
        click: () => this.showAbout()
      },
      {
        label: 'Выход',
        click: () => {
          this.isQuiting = true;
          app.quit();
        }
      }
    ]);

    this.tray.setContextMenu(contextMenu);
    this.tray.setToolTip('Spotify Overlay Player');
    
    // Двойной клик по трею показывает/скрывает плеер
    this.tray.on('double-click', () => {
      if (this.overlayWindow) {
        this.hideOverlayWindow();
      } else {
        this.createOverlayWindow();
      }
    });
  }

  startSpotifyMonitoring() {
    // Временно отключаем автоматический мониторинг Spotify
    this.logger.info('Мониторинг Spotify временно отключен (нет WindowsService)');
    
    // TODO: Включить после установки ffi-napi
    /*
    setInterval(async () => {
      try {
        const isSpotifyRunning = await this.windowsService.isSpotifyRunning();
        const isSpotifyMinimized = await this.windowsService.isSpotifyMinimized();
        
        if (isSpotifyRunning && isSpotifyMinimized) {
          if (!this.overlayWindow && this.configService.get('behavior.showOnMinimize')) {
            this.createOverlayWindow();
          }
        } else {
          if (this.overlayWindow && this.configService.get('behavior.hideOnRestore')) {
            this.hideOverlayWindow();
          }
        }
      } catch (error) {
        this.logger.error('Ошибка мониторинга Spotify:', error);
      }
    }, 2000);
    */
  }

  // IPC обработчики
  async handleSpotifyAuth() {
    try {
      const authUrl = await this.spotifyService.getAuthUrl();
      await shell.openExternal(authUrl);
      return { success: true };
    } catch (error) {
      this.logger.error('Ошибка авторизации Spotify:', error);
      return { success: false, error: error.message };
    }
  }

  async handleGetCurrentTrack() {
    try {
      const track = await this.spotifyService.getCurrentTrack();
      return { success: true, track };
    } catch (error) {
      this.logger.error('Ошибка получения текущего трека:', error);
      return { success: false, error: error.message };
    }
  }

  async handleControlPlayback(event, action, data) {
    try {
      await this.spotifyService.controlPlayback(action, data);
      return { success: true };
    } catch (error) {
      this.logger.error('Ошибка управления воспроизведением:', error);
      return { success: false, error: error.message };
    }
  }

  async handleGetConfig() {
    return this.configService.getAll();
  }

  async handleSaveConfig(event, config) {
    try {
      await this.configService.saveAll(config);
      return { success: true };
    } catch (error) {
      this.logger.error('Ошибка сохранения конфигурации:', error);
      return { success: false, error: error.message };
    }
  }

  handleShowSettings() {
    this.showSettings();
  }

  // Утилиты
  showSettings() {
    if (this.mainWindow) {
      this.mainWindow.show();
      this.mainWindow.focus();
    } else {
      this.createMainWindow();
    }
  }

  showAbout() {
    dialog.showMessageBox({
      type: 'info',
      title: 'О программе',
      message: 'Spotify Overlay Player',
      detail: `Версия: ${app.getVersion()}\nКрасивый overlay плеер для Spotify\n\nСделано с ❤️`
    });
  }

  showErrorDialog(title, message) {
    dialog.showErrorBox(title, message);
  }

  async toggleAutoStart(enabled) {
    try {
      if (enabled) {
        app.setLoginItemSettings({
          openAtLogin: true,
          path: process.execPath,
          args: ['--hidden']
        });
      } else {
        app.setLoginItemSettings({ openAtLogin: false });
      }
      
      await this.configService.set('system.autoStart', enabled);
      this.logger.info(`Автозапуск ${enabled ? 'включен' : 'отключен'}`);
    } catch (error) {
      this.logger.error('Ошибка настройки автозапуска:', error);
    }
  }
}

// Запускаем приложение
const electronApp = new ElectronApp();

// Обработка необработанных ошибок
process.on('uncaughtException', (error) => {
  console.error('Необработанная ошибка:', error);
  try {
    electronApp.logger.error('Необработанная ошибка:', error);
  } catch (logError) {
    console.error('Ошибка логирования:', logError);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Необработанное отклонение promise:', reason);
  try {
    electronApp.logger.error('Необработанное отклонение promise:', reason);
  } catch (logError) {
    console.error('Ошибка логирования:', logError);
  }
});

module.exports = electronApp;
