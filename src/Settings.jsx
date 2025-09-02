import React, { useState, useEffect } from 'react';

const Settings = () => {
  const [config, setConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('spotify');
  
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API недоступен');
      }

      const loadedConfig = await window.electronAPI.config.get();
      setConfig(loadedConfig);
      setIsLoading(false);
    } catch (error) {
      console.error('Ошибка загрузки конфигурации:', error);
      setError(error.message);
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage('');

    try {
      const result = await window.electronAPI.config.save(config);
      if (result.success) {
        setSuccessMessage('Настройки сохранены успешно!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error(result.error || 'Ошибка сохранения');
      }
    } catch (error) {
      console.error('Ошибка сохранения конфигурации:', error);
      setError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (path, value) => {
    setConfig(prev => {
      const newConfig = { ...prev };
      const keys = path.split('.');
      let current = newConfig;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newConfig;
    });
  };

  const handleSpotifyAuth = async () => {
    try {
      const result = await window.electronAPI.spotify.auth();
      if (result.success) {
        setSuccessMessage('Авторизация Spotify запущена. Следуйте инструкциям в браузере.');
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        throw new Error(result.error || 'Ошибка авторизации');
      }
    } catch (error) {
      console.error('Ошибка авторизации Spotify:', error);
      setError(error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 mx-auto border-4 border-white border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-xl">Загрузка настроек...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-xl text-red-400">Ошибка загрузки конфигурации</p>
          <button 
            onClick={loadConfig}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'spotify', name: 'Spotify', icon: '🎵' },
    { id: 'behavior', name: 'Поведение', icon: '⚙️' },
    { id: 'ui', name: 'Интерфейс', icon: '🎨' },
    { id: 'hotkeys', name: 'Горячие клавиши', icon: '⌨️' },
    { id: 'advanced', name: 'Дополнительно', icon: '🔧' }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Заголовок */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Spotify Overlay Player - Настройки</h1>
          <div className="flex gap-2">
            <button
              onClick={saveConfig}
              disabled={isSaving}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Сохранение...
                </>
              ) : (
                'Сохранить'
              )}
            </button>
          </div>
        </div>
        
        {/* Уведомления */}
        {error && (
          <div className="mt-4 p-3 bg-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="mt-4 p-3 bg-green-600 rounded-lg text-sm">
            {successMessage}
          </div>
        )}
      </header>

      <div className="flex h-screen">
        {/* Боковая панель */}
        <nav className="w-64 bg-gray-800 border-r border-gray-700 p-4">
          <div className="space-y-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>
        </nav>

        {/* Основное содержимое */}
        <main className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'spotify' && (
            <SpotifySettings 
              config={config.spotify}
              onChange={(field, value) => handleInputChange(`spotify.${field}`, value)}
              onAuth={handleSpotifyAuth}
            />
          )}
          
          {activeTab === 'behavior' && (
            <BehaviorSettings 
              config={config.behavior}
              onChange={(field, value) => handleInputChange(`behavior.${field}`, value)}
            />
          )}
          
          {activeTab === 'ui' && (
            <UISettings 
              config={config.ui}
              onChange={(field, value) => handleInputChange(`ui.${field}`, value)}
            />
          )}
          
          {activeTab === 'hotkeys' && (
            <HotkeySettings 
              config={config.hotkeys}
              onChange={(field, value) => handleInputChange(`hotkeys.${field}`, value)}
            />
          )}
          
          {activeTab === 'advanced' && (
            <AdvancedSettings 
              config={config.advanced}
              onChange={(field, value) => handleInputChange(`advanced.${field}`, value)}
            />
          )}
        </main>
      </div>
    </div>
  );
};

// Компонент настроек Spotify
const SpotifySettings = ({ config, onChange, onAuth }) => (
  <div className="space-y-6">
    <h2 className="text-3xl font-bold mb-6">Настройки Spotify</h2>
    
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-4">Подключение к Spotify</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Client ID</label>
          <input
            type="text"
            value={config.clientId || ''}
            onChange={(e) => onChange('clientId', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Введите Spotify Client ID"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Client Secret (опционально)</label>
          <input
            type="password"
            value={config.clientSecret || ''}
            onChange={(e) => onChange('clientSecret', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Введите Spotify Client Secret"
          />
        </div>
        
        <button
          onClick={onAuth}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Авторизоваться в Spotify
        </button>
        
        <div className="mt-4 p-4 bg-blue-900 bg-opacity-50 rounded-lg">
          <h4 className="font-semibold mb-2">Как получить Client ID:</h4>
          <ol className="list-decimal list-inside text-sm space-y-1 text-gray-300">
            <li>Перейдите на <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">Spotify Developer Dashboard</a></li>
            <li>Создайте новое приложение</li>
            <li>Скопируйте Client ID из настроек приложения</li>
            <li>Добавьте Redirect URI: http://localhost:8888/callback</li>
          </ol>
        </div>
      </div>
    </div>
  </div>
);

// Компонент настроек поведения
const BehaviorSettings = ({ config, onChange }) => (
  <div className="space-y-6">
    <h2 className="text-3xl font-bold mb-6">Настройки поведения</h2>
    
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-4">Автоматическое поведение</h3>
      
      <div className="space-y-4">
        <CheckboxSetting
          label="Показывать плеер при сворачивании Spotify"
          checked={config.showOnMinimize}
          onChange={(value) => onChange('showOnMinimize', value)}
        />
        
        <CheckboxSetting
          label="Скрывать плеер при разворачивании Spotify"
          checked={config.hideOnRestore}
          onChange={(value) => onChange('hideOnRestore', value)}
        />
        
        <CheckboxSetting
          label="Автозапуск с Windows"
          checked={config.autoStart}
          onChange={(value) => onChange('autoStart', value)}
        />
        
        <CheckboxSetting
          label="Запускать свернутым в трей"
          checked={config.startMinimized}
          onChange={(value) => onChange('startMinimized', value)}
        />
        
        <CheckboxSetting
          label="Показывать уведомления"
          checked={config.showNotifications}
          onChange={(value) => onChange('showNotifications', value)}
        />
      </div>
    </div>
  </div>
);

// Компонент настроек UI
const UISettings = ({ config, onChange }) => (
  <div className="space-y-6">
    <h2 className="text-3xl font-bold mb-6">Настройки интерфейса</h2>
    
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-4">Внешний вид</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Прозрачность плеера: {Math.round(config.opacity * 100)}%
          </label>
          <input
            type="range"
            min="0.5"
            max="1"
            step="0.05"
            value={config.opacity}
            onChange={(e) => onChange('opacity', parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Масштаб плеера: {Math.round(config.scale * 100)}%
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={config.scale}
            onChange={(e) => onChange('scale', parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Позиция плеера</label>
          <select
            value={config.position}
            onChange={(e) => onChange('position', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
          >
            <option value="center">По центру</option>
            <option value="top">Сверху</option>
            <option value="bottom">Снизу</option>
            <option value="custom">Пользовательская</option>
          </select>
        </div>
        
        <CheckboxSetting
          label="Всегда поверх других окон"
          checked={config.alwaysOnTop}
          onChange={(value) => onChange('alwaysOnTop', value)}
        />
      </div>
    </div>
  </div>
);

// Компонент настроек горячих клавиш
const HotkeySettings = ({ config, onChange }) => (
  <div className="space-y-6">
    <h2 className="text-3xl font-bold mb-6">Горячие клавиши</h2>
    
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-4">Глобальные горячие клавиши</h3>
      
      <div className="space-y-4">
        <CheckboxSetting
          label="Включить горячие клавиши"
          checked={config.enabled}
          onChange={(value) => onChange('enabled', value)}
        />
        
        {config.enabled && (
          <div className="pl-6 space-y-3">
            <HotkeyInput
              label="Показать/скрыть плеер"
              value={config.global.togglePlayer}
              onChange={(value) => onChange('global.togglePlayer', value)}
            />
            
            <HotkeyInput
              label="Play/Pause"
              value={config.global.playPause}
              onChange={(value) => onChange('global.playPause', value)}
            />
            
            <HotkeyInput
              label="Следующий трек"
              value={config.global.nextTrack}
              onChange={(value) => onChange('global.nextTrack', value)}
            />
            
            <HotkeyInput
              label="Предыдущий трек"
              value={config.global.previousTrack}
              onChange={(value) => onChange('global.previousTrack', value)}
            />
          </div>
        )}
      </div>
    </div>
  </div>
);

// Компонент расширенных настроек
const AdvancedSettings = ({ config, onChange }) => (
  <div className="space-y-6">
    <h2 className="text-3xl font-bold mb-6">Расширенные настройки</h2>
    
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-4">Производительность</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Интервал обновления: {config.pollingInterval}мс
          </label>
          <input
            type="range"
            min="500"
            max="5000"
            step="100"
            value={config.pollingInterval}
            onChange={(e) => onChange('pollingInterval', parseInt(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Уровень логирования</label>
          <select
            value={config.logLevel}
            onChange={(e) => onChange('logLevel', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
          >
            <option value="error">Только ошибки</option>
            <option value="warn">Предупреждения и ошибки</option>
            <option value="info">Информация (рекомендуется)</option>
            <option value="debug">Отладка (подробно)</option>
          </select>
        </div>
        
        <CheckboxSetting
          label="Аппаратное ускорение"
          checked={config.hardwareAcceleration}
          onChange={(value) => onChange('hardwareAcceleration', value)}
        />
        
        <CheckboxSetting
          label="Режим отладки"
          checked={config.enableDebugMode}
          onChange={(value) => onChange('enableDebugMode', value)}
        />
      </div>
    </div>
  </div>
);

// Вспомогательные компоненты
const CheckboxSetting = ({ label, checked, onChange }) => (
  <label className="flex items-center space-x-3">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
    />
    <span>{label}</span>
  </label>
);

const HotkeyInput = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm">{label}</span>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-center min-w-[200px]"
      placeholder="Ctrl+Shift+P"
    />
  </div>
);

export default Settings;
