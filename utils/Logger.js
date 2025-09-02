const fs = require('fs').promises;
const path = require('path');
const { app } = require('electron');
const EventEmitter = require('events');

class Logger extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.levels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3
    };
    
    this.currentLevel = this.levels[options.level || 'INFO'];
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.maxFiles = options.maxFiles || 5;
    this.enableConsole = options.enableConsole !== false;
    this.enableFile = options.enableFile !== false;
    
    this.logDir = this.getLogDirectory();
    this.currentLogFile = null;
    this.logQueue = [];
    this.isWriting = false;
    this.isLogging = false; // Защита от рекурсии
    
    this.initializeLogger();
  }

  getLogDirectory() {
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'logs');
  }

  async initializeLogger() {
    try {
      // Создаем директорию для логов
      await fs.mkdir(this.logDir, { recursive: true });
      
      // Определяем текущий лог файл
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      this.currentLogFile = path.join(this.logDir, `app-${dateStr}.log`);
      
      // Очищаем старые логи
      await this.cleanupOldLogs();
      
      console.log('Logger инициализирован, файл:', this.currentLogFile);
      
    } catch (error) {
      console.error('Ошибка инициализации Logger:', error);
      // Отключаем запись в файл если инициализация не удалась
      this.enableFile = false;
      this.currentLogFile = null;
    }
  }

  async error(message, meta = {}) {
    await this.log('ERROR', message, meta);
  }

  async warn(message, meta = {}) {
    await this.log('WARN', message, meta);
  }

  async info(message, meta = {}) {
    await this.log('INFO', message, meta);
  }

  async debug(message, meta = {}) {
    await this.log('DEBUG', message, meta);
  }

  async log(level, message, meta = {}) {
    // Защита от рекурсии
    if (this.isLogging) {
      console.log(`[${level}]: ${message}`, meta); // Простой вывод без логгера
      return;
    }

    if (this.levels[level] > this.currentLevel) {
      return; // Уровень логирования слишком низкий
    }

    this.isLogging = true;

    try {
      const timestamp = new Date().toISOString();
      const logEntry = {
        timestamp,
        level,
        message,
        meta,
        pid: process.pid
      };

      // Выводим в консоль
      if (this.enableConsole) {
        this.logToConsole(logEntry);
      }

      // Записываем в файл
      if (this.enableFile) {
        this.logQueue.push(logEntry);
        await this.processLogQueue();
      }

      // ВРЕМЕННО ОТКЛЮЧЕНЫ EMIT'Ы для предотвращения рекурсии
      // this.emit('log', logEntry);
      // this.emit(level.toLowerCase(), logEntry);
      
    } finally {
      this.isLogging = false;
    }
  }

  logToConsole(logEntry) {
    const { timestamp, level, message, meta } = logEntry;
    const timeStr = new Date(timestamp).toLocaleTimeString();
    
    let colorCode = '';
    let resetCode = '\x1b[0m';
    
    switch (level) {
      case 'ERROR':
        colorCode = '\x1b[31m'; // Красный
        break;
      case 'WARN':
        colorCode = '\x1b[33m'; // Желтый
        break;
      case 'INFO':
        colorCode = '\x1b[36m'; // Голубой
        break;
      case 'DEBUG':
        colorCode = '\x1b[37m'; // Белый
        break;
    }

    const prefix = `${colorCode}[${timeStr}] ${level}${resetCode}`;
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    
    console.log(`${prefix}: ${message}${metaStr}`);
  }

  async processLogQueue() {
    if (this.isWriting || this.logQueue.length === 0) {
      return;
    }

    this.isWriting = true;
    let entries = [];

    try {
      // Проверяем что файл инициализирован
      if (!this.currentLogFile) {
        console.log('Log file not initialized, skipping file write');
        this.logQueue = []; // Очищаем очередь
        return;
      }
      
      // Проверяем размер файла
      await this.checkFileSize();
      
      // Обрабатываем всю очередь
      entries = [...this.logQueue];
      this.logQueue = [];
      
      const logLines = entries.map(entry => {
        const metaStr = Object.keys(entry.meta).length > 0 ? ` | ${JSON.stringify(entry.meta)}` : '';
        return `${entry.timestamp} [${entry.level}] [${entry.pid}]: ${entry.message}${metaStr}`;
      });
      
      const logData = logLines.join('\n') + '\n';
      
      await fs.appendFile(this.currentLogFile, logData, 'utf8');
      
    } catch (error) {
      console.error('Ошибка записи в лог файл:', error);
      // Возвращаем записи обратно в очередь только если entries определен
      if (entries.length > 0) {
        this.logQueue.unshift(...entries);
      }
    } finally {
      this.isWriting = false;
    }
  }

  async checkFileSize() {
    if (!this.currentLogFile) {
      return;
    }

    try {
      const stats = await fs.stat(this.currentLogFile);
      
      if (stats.size > this.maxFileSize) {
        await this.rotateLogFile();
      }
    } catch (error) {
      // Файл не существует, это нормально для первого запуска
      if (error.code !== 'ENOENT') {
        console.error('Ошибка проверки размера лог файла:', error);
      }
    }
  }

  async rotateLogFile() {
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    const rotatedFile = path.join(this.logDir, `app-${timestamp}.log`);
    
    try {
      await fs.rename(this.currentLogFile, rotatedFile);
      console.log(`Лог файл ротирован: ${rotatedFile}`);
      
      // Очищаем старые файлы
      await this.cleanupOldLogs();
      
    } catch (error) {
      console.error('Ошибка ротации лог файла:', error);
    }
  }

  async cleanupOldLogs() {
    try {
      const files = await fs.readdir(this.logDir);
      const logFiles = files
        .filter(file => file.startsWith('app-') && file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(this.logDir, file)
        }));

      // Сортируем по дате создания
      const fileStats = await Promise.all(
        logFiles.map(async file => {
          const stats = await fs.stat(file.path);
          return { ...file, mtime: stats.mtime };
        })
      );

      fileStats.sort((a, b) => b.mtime - a.mtime);

      // Удаляем старые файлы
      if (fileStats.length > this.maxFiles) {
        const filesToDelete = fileStats.slice(this.maxFiles);
        
        for (const file of filesToDelete) {
          await fs.unlink(file.path);
          console.log(`Удален старый лог файл: ${file.name}`);
        }
      }

    } catch (error) {
      console.error('Ошибка очистки старых логов:', error);
    }
  }

  // Методы для работы с логами
  async getLogs(options = {}) {
    const {
      level = null,
      limit = 100,
      offset = 0,
      startDate = null,
      endDate = null
    } = options;

    try {
      const files = await fs.readdir(this.logDir);
      const logFiles = files
        .filter(file => file.startsWith('app-') && file.endsWith('.log'))
        .map(file => path.join(this.logDir, file));

      let allLogs = [];

      for (const file of logFiles) {
        try {
          const content = await fs.readFile(file, 'utf8');
          const lines = content.trim().split('\n');
          
          for (const line of lines) {
            if (line.trim()) {
              const logEntry = this.parseLogLine(line);
              if (logEntry) {
                allLogs.push(logEntry);
              }
            }
          }
        } catch (readError) {
          console.error(`Ошибка чтения лог файла ${file}:`, readError);
        }
      }

      // Фильтрация
      if (level) {
        allLogs = allLogs.filter(log => log.level === level.toUpperCase());
      }

      if (startDate) {
        allLogs = allLogs.filter(log => new Date(log.timestamp) >= new Date(startDate));
      }

      if (endDate) {
        allLogs = allLogs.filter(log => new Date(log.timestamp) <= new Date(endDate));
      }

      // Сортировка по времени (новые сначала)
      allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Пагинация
      return allLogs.slice(offset, offset + limit);

    } catch (error) {
      console.error('Ошибка получения логов:', error);
      return [];
    }
  }

  parseLogLine(line) {
    const regex = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z) \[(\w+)\] \[(\d+)\]: (.+)$/;
    const match = line.match(regex);
    
    if (!match) {
      return null;
    }

    const [, timestamp, level, pid, messageAndMeta] = match;
    
    // Пытаемся разделить сообщение и мета-данные
    let message = messageAndMeta;
    let meta = {};
    
    const pipeIndex = messageAndMeta.lastIndexOf(' | {');
    if (pipeIndex !== -1) {
      message = messageAndMeta.substring(0, pipeIndex);
      const metaStr = messageAndMeta.substring(pipeIndex + 3);
      
      try {
        meta = JSON.parse(metaStr);
      } catch {
        // Если не удалось распарсить мета, оставляем как есть
      }
    }

    return {
      timestamp,
      level,
      pid: parseInt(pid),
      message,
      meta
    };
  }

  // Настройки логгера
  setLevel(level) {
    if (this.levels[level.toUpperCase()] !== undefined) {
      this.currentLevel = this.levels[level.toUpperCase()];
      this.info(`Уровень логирования изменен на ${level}`);
    } else {
      throw new Error(`Неизвестный уровень логирования: ${level}`);
    }
  }

  getLevel() {
    return Object.keys(this.levels).find(key => this.levels[key] === this.currentLevel);
  }

  // Специальные методы логирования
  async logError(error, context = '') {
    const errorInfo = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      context
    };

    await this.error('Ошибка приложения', errorInfo);
  }

  async logPerformance(operation, duration, meta = {}) {
    await this.info(`Производительность: ${operation}`, {
      duration: `${duration}ms`,
      ...meta
    });
  }

  async logUserAction(action, userId = null, meta = {}) {
    await this.info(`Действие пользователя: ${action}`, {
      userId,
      ...meta
    });
  }

  async logSpotifyEvent(event, data = {}) {
    await this.info(`Spotify событие: ${event}`, data);
  }

  async logSystemEvent(event, data = {}) {
    await this.info(`Системное событие: ${event}`, data);
  }

  // Статистика
  async getLogStats() {
    try {
      const logs = await this.getLogs({ limit: 10000 }); // Последние 10k записей
      
      const stats = {
        total: logs.length,
        byLevel: {},
        byDate: {},
        topErrors: {},
        recentActivity: logs.slice(0, 10)
      };

      // Статистика по уровням
      for (const log of logs) {
        stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
        
        const date = log.timestamp.split('T')[0];
        stats.byDate[date] = (stats.byDate[date] || 0) + 1;
        
        if (log.level === 'ERROR') {
          stats.topErrors[log.message] = (stats.topErrors[log.message] || 0) + 1;
        }
      }

      return stats;
    } catch (error) {
      console.error('Ошибка получения статистики логов:', error);
      return null;
    }
  }

  // Очистка
  async clearLogs() {
    try {
      const files = await fs.readdir(this.logDir);
      const logFiles = files.filter(file => file.startsWith('app-') && file.endsWith('.log'));
      
      for (const file of logFiles) {
        await fs.unlink(path.join(this.logDir, file));
      }
      
      await this.info('Все логи очищены');
      return true;
    } catch (error) {
      console.error('Ошибка очистки логов:', error);
      return false;
    }
  }

  // Экспорт логов
  async exportLogs(filePath, options = {}) {
    try {
      const logs = await this.getLogs(options);
      const exportData = logs.map(log => {
        const metaStr = Object.keys(log.meta).length > 0 ? ` | ${JSON.stringify(log.meta)}` : '';
        return `${log.timestamp} [${log.level}] [${log.pid}]: ${log.message}${metaStr}`;
      }).join('\n');
      
      await fs.writeFile(filePath, exportData, 'utf8');
      
      await this.info(`Логи экспортированы в ${filePath}`, { count: logs.length });
      return true;
    } catch (error) {
      console.error('Ошибка экспорта логов:', error);
      return false;
    }
  }

  // Уничтожение
  async destroy() {
    // Записываем оставшиеся логи
    await this.processLogQueue();
    
    // Финальное сообщение
    await this.info('Logger завершает работу');
    
    // Последний раз обрабатываем очередь
    await this.processLogQueue();
    
    this.removeAllListeners();
  }
}

module.exports = Logger;
