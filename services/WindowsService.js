// Временно отключаем ffi для первого запуска
// const ffi = require('ffi-napi');
// const ref = require('ref-napi');
// const Struct = require('ref-struct-napi');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class WindowsService {
  constructor() {
    this.isWindows = process.platform === 'win32';
    this.user32 = null;
    this.kernel32 = null;
    this.psapi = null;
    
    // Кэш процессов для оптимизации
    this.processCache = new Map();
    this.cacheTimeout = 2000; // 2 секунды
    
    this.initializeWindowsAPI();
  }

  initialize() {
    if (!this.isWindows) {
      console.warn('WindowsService: Не Windows система, функционал ограничен');
      return;
    }

    console.log('WindowsService инициализирован');
  }

  initializeWindowsAPI() {
    if (!this.isWindows) {
      return;
    }

    // Временно используем только fallback методы без ffi
    console.log('Windows API временно отключен, используем fallback методы');
    this.user32 = null;
    this.kernel32 = null;
    
    /* 
    TODO: Включить после установки ffi-napi
    try {
      const RECT = Struct({...});
      const WINDOWPLACEMENT = Struct({...});
      this.user32 = ffi.Library('user32', {...});
      this.kernel32 = ffi.Library('kernel32', {...});
      console.log('Windows API успешно инициализирован');
    } catch (error) {
      console.error('Ошибка инициализации Windows API:', error);
    }
    */
  }

  async isSpotifyRunning() {
    try {
      // Кэшированная проверка
      const cached = this.getCachedResult('spotifyRunning');
      if (cached !== null) {
        return cached;
      }

      let isRunning = false;

      if (this.isWindows && this.user32) {
        // Способ 1: Поиск по имени окна
        const spotifyWindow = this.user32.FindWindowA(null, null);
        isRunning = await this.findSpotifyWindowByTitle();
      }

      if (!isRunning) {
        // Способ 2: Поиск через список процессов (fallback)
        isRunning = await this.findSpotifyProcess();
      }

      this.setCachedResult('spotifyRunning', isRunning);
      return isRunning;
    } catch (error) {
      console.error('Ошибка проверки запуска Spotify:', error);
      return false;
    }
  }

  async isSpotifyMinimized() {
    try {
      const cached = this.getCachedResult('spotifyMinimized');
      if (cached !== null) {
        return cached;
      }

      if (!this.isWindows || !this.user32) {
        // На не-Windows системах используем альтернативные методы
        return await this.isSpotifyMinimizedFallback();
      }

      const spotifyHwnd = await this.findSpotifyWindow();
      if (!spotifyHwnd) {
        this.setCachedResult('spotifyMinimized', false);
        return false;
      }

      // Проверяем, свернуто ли окно
      const isMinimized = this.user32.IsIconic(spotifyHwnd);
      
      this.setCachedResult('spotifyMinimized', isMinimized);
      return Boolean(isMinimized);
    } catch (error) {
      console.error('Ошибка проверки сворачивания Spotify:', error);
      return false;
    }
  }

  async findSpotifyWindow() {
    if (!this.isWindows || !this.user32) {
      return null;
    }

    return new Promise((resolve) => {
      let spotifyHwnd = null;

      // Создаем callback для EnumWindows
      const enumWindowsCallback = ffi.Callback('bool', ['long', 'long'], (hwnd, lParam) => {
        try {
          if (!this.user32.IsWindowVisible(hwnd)) {
            return true; // Продолжаем поиск
          }

          const titleLength = this.user32.GetWindowTextLengthA(hwnd);
          if (titleLength === 0) {
            return true;
          }

          const titleBuffer = Buffer.alloc(titleLength + 1);
          const actualLength = this.user32.GetWindowTextA(hwnd, titleBuffer, titleLength + 1);
          
          if (actualLength > 0) {
            const title = titleBuffer.toString('utf8').slice(0, actualLength);
            
            // Проверяем, содержит ли заголовок окна "Spotify"
            if (title.includes('Spotify') && !title.includes('Spotify Web Helper')) {
              spotifyHwnd = hwnd;
              return false; // Останавливаем поиск
            }
          }
          
          return true; // Продолжаем поиск
        } catch (error) {
          console.error('Ошибка в enumWindowsCallback:', error);
          return true;
        }
      });

      try {
        this.user32.EnumWindows(enumWindowsCallback, 0);
      } catch (error) {
        console.error('Ошибка EnumWindows:', error);
      }

      resolve(spotifyHwnd);
    });
  }

  async findSpotifyWindowByTitle() {
    if (!this.isWindows || !this.user32) {
      return false;
    }

    // Пробуем несколько вариантов поиска Spotify окна
    const spotifyTitles = [
      'Spotify Premium',
      'Spotify Free',
      'Spotify'
    ];

    for (const title of spotifyTitles) {
      const hwnd = this.user32.FindWindowA(null, title);
      if (hwnd && hwnd !== 0) {
        return true;
      }
    }

    // Поиск через перечисление всех окон
    return (await this.findSpotifyWindow()) !== null;
  }

  async findSpotifyProcess() {
    try {
      if (this.isWindows) {
        const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq Spotify.exe" /FO CSV /NH');
        return stdout.includes('Spotify.exe');
      } else if (process.platform === 'darwin') {
        // macOS
        const { stdout } = await execAsync('pgrep -f Spotify');
        return stdout.trim().length > 0;
      } else {
        // Linux
        const { stdout } = await execAsync('pgrep -f spotify');
        return stdout.trim().length > 0;
      }
    } catch (error) {
      // Если команда завершилась с ошибкой, процесс не найден
      return false;
    }
  }

  async isSpotifyMinimizedFallback() {
    // Альтернативный метод для не-Windows систем
    try {
      if (process.platform === 'darwin') {
        // macOS - проверяем через AppleScript
        const { stdout } = await execAsync(`
          osascript -e 'tell application "System Events"
            set spotifyProcess to first process whose name is "Spotify"
            return visible of spotifyProcess
          end tell'
        `);
        return stdout.trim() === 'false';
      } else if (process.platform === 'linux') {
        // Linux - проверяем через xdotool или wmctrl
        try {
          const { stdout } = await execAsync('wmctrl -l | grep -i spotify');
          return stdout.trim().length === 0;
        } catch {
          return false;
        }
      }
    } catch (error) {
      console.error('Ошибка fallback проверки сворачивания:', error);
    }
    
    return false;
  }

  async getSpotifyWindowInfo() {
    try {
      const hwnd = await this.findSpotifyWindow();
      if (!hwnd || !this.user32) {
        return null;
      }

      // Получаем информацию о размещении окна
      const WINDOWPLACEMENT = Struct({
        length: 'uint32',
        flags: 'uint32',
        showCmd: 'uint32',
        ptMinPosition: Struct({ x: 'long', y: 'long' }),
        ptMaxPosition: Struct({ x: 'long', y: 'long' }),
        rcNormalPosition: Struct({
          left: 'long',
          top: 'long',
          right: 'long',
          bottom: 'long'
        })
      });

      const placement = new WINDOWPLACEMENT();
      placement.length = WINDOWPLACEMENT.size;
      
      const success = this.user32.GetWindowPlacement(hwnd, placement.ref());
      
      if (success) {
        return {
          hwnd: hwnd,
          showCmd: placement.showCmd, // SW_SHOWMINIMIZED = 2, SW_SHOWMAXIMIZED = 3, SW_SHOWNORMAL = 1
          isMinimized: placement.showCmd === 2,
          isMaximized: placement.showCmd === 3,
          rect: {
            left: placement.rcNormalPosition.left,
            top: placement.rcNormalPosition.top,
            right: placement.rcNormalPosition.right,
            bottom: placement.rcNormalPosition.bottom
          }
        };
      }

      return null;
    } catch (error) {
      console.error('Ошибка получения информации об окне Spotify:', error);
      return null;
    }
  }

  async restoreSpotifyWindow() {
    try {
      const hwnd = await this.findSpotifyWindow();
      if (!hwnd || !this.user32) {
        return false;
      }

      // SW_RESTORE = 9
      return Boolean(this.user32.ShowWindow(hwnd, 9));
    } catch (error) {
      console.error('Ошибка восстановления окна Spotify:', error);
      return false;
    }
  }

  async minimizeSpotifyWindow() {
    try {
      const hwnd = await this.findSpotifyWindow();
      if (!hwnd || !this.user32) {
        return false;
      }

      // SW_MINIMIZE = 6
      return Boolean(this.user32.ShowWindow(hwnd, 6));
    } catch (error) {
      console.error('Ошибка сворачивания окна Spotify:', error);
      return false;
    }
  }

  // Кэширование результатов для оптимизации
  getCachedResult(key) {
    const cached = this.processCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.value;
    }
    return null;
  }

  setCachedResult(key, value) {
    this.processCache.set(key, {
      value: value,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.processCache.clear();
  }

  // Мониторинг изменений (для будущего использования)
  async startWindowMonitoring(callback) {
    let lastSpotifyRunning = await this.isSpotifyRunning();
    let lastSpotifyMinimized = await this.isSpotifyMinimized();

    const checkInterval = setInterval(async () => {
      try {
        this.clearCache(); // Очищаем кэш для свежих данных
        
        const isRunning = await this.isSpotifyRunning();
        const isMinimized = await this.isSpotifyMinimized();

        if (isRunning !== lastSpotifyRunning || isMinimized !== lastSpotifyMinimized) {
          callback({
            isRunning,
            isMinimized,
            changed: {
              running: isRunning !== lastSpotifyRunning,
              minimized: isMinimized !== lastSpotifyMinimized
            }
          });

          lastSpotifyRunning = isRunning;
          lastSpotifyMinimized = isMinimized;
        }
      } catch (error) {
        console.error('Ошибка мониторинга окна:', error);
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }

  // Утилиты для работы с дисплеями
  async getCurrentDisplay() {
    const { screen } = require('electron');
    
    try {
      const spotifyWindow = await this.getSpotifyWindowInfo();
      if (spotifyWindow && spotifyWindow.rect) {
        const centerX = (spotifyWindow.rect.left + spotifyWindow.rect.right) / 2;
        const centerY = (spotifyWindow.rect.top + spotifyWindow.rect.bottom) / 2;
        
        return screen.getDisplayNearestPoint({ x: centerX, y: centerY });
      }
    } catch (error) {
      console.error('Ошибка определения текущего дисплея:', error);
    }
    
    return screen.getPrimaryDisplay();
  }

  // Очистка ресурсов
  destroy() {
    this.clearCache();
    console.log('WindowsService уничтожен');
  }
}

module.exports = WindowsService;
