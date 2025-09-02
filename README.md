# 🎵 Spotify Overlay Player

Профессиональный плеер-оверлей для Windows с интеграцией Spotify Web API. Автоматически появляется при сворачивании Spotify, предоставляя красивый и функциональный интерфейс управления воспроизведением.

![Spotify Overlay Player](https://via.placeholder.com/800x400/000000/FFFFFF?text=Spotify+Overlay+Player+Screenshot)

## ✨ Особенности

### 🎵 Основной функционал
- **Автоматическое отслеживание Spotify** - плеер появляется при сворачивании Spotify и исчезает при его разворачивании
- **Spotify Web API интеграция** - полноценное управление воспроизведением (play/pause/next/previous/seek)
- **Реальные данные треков** - название, исполнитель, обложка альбома, прогресс воспроизведения
- **Windows API интеграция** - отслеживание состояния окон и процессов

### 🎨 Дизайн и анимации
- **Двухслойный дизайн** с фоном blur и основной карточкой
- **Плавные анимации**: hover эффекты, marquee для длинного текста, ripple эффекты
- **Интерактивный прогресс-бар** с drag-функционалом и клик-навигацией
- **Responsive дизайн** - автоматическое масштабирование под размер экрана
- **FadeContent анимация** появления/исчезновения плеера

### ⚙️ Продвинутые настройки
- **Системный трей** - управление через контекстное меню
- **Автозапуск с Windows** - запуск в фоновом режиме
- **Горячие клавиши** - глобальное управление без фокуса на плеере
- **Гибкие настройки UI** - прозрачность, масштаб, позиция, тема
- **Логирование и диагностика** - подробные логи для отладки проблем

## 🎯 Технические характеристики

- **Размер плеера**: 1000x320 px (масштабируется)
- **Обложка**: 180x180 px с border-radius 16px  
- **Название трека**: 64px, Actay Wide Bold, белый
- **Исполнитель**: 48px, Actay Wide Bold, белый 70% opacity
- **Время**: 24px, Actay Wide Bold
- **Прогресс-бар**: 384x9 px с border-radius 16px
- **Кнопки**: 80x80 px с hover scale 1.1

## 📦 Установка

### Готовые сборки (Рекомендуется)
1. Скачайте последнюю версию с [Releases страницы](https://github.com/your-username/spotify-overlay-player/releases)
2. Запустите установщик `SpotifyOverlayPlayer-Setup.exe`
3. Следуйте инструкциям мастера установки
4. После установки настройте Spotify API ключи в настройках

### Сборка из исходников
```bash
# Клонирование репозитория
git clone https://github.com/your-username/spotify-overlay-player.git
cd spotify-overlay-player

# Установка зависимостей
npm install

# Разработка
npm run electron-dev

# Сборка для продакшена
npm run build
npm run dist
```

## ⚡ Быстрый старт

### 1. Настройка Spotify API
1. Перейдите на [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Создайте новое приложение
3. Добавьте Redirect URI: `http://localhost:8888/callback`
4. Скопируйте Client ID в настройки приложения
5. Нажмите "Авторизоваться в Spotify"

### 2. Первое использование
1. Запустите приложение (будет в системном трее)
2. Откройте Spotify и включите любой трек
3. Сверните Spotify - плеер автоматически появится
4. Разверните Spotify - плеер автоматически скроется

## 🚀 Режимы запуска

```bash
# Режим разработки (hot reload)
npm run electron-dev

# Запуск продакшена
npm start

# Сборка установщика Windows
npm run dist:win

# Сборка портабельной версии
npm run build:portable

# Запуск только React интерфейса
npm run dev
```

## 📁 Структура проекта

```
spotify-overlay-player/
├── public/
│   ├── electron.js              # Main процесс Electron
│   └── preload.js               # Preload скрипт для безопасного API
├── services/
│   ├── SpotifyService.js        # Интеграция со Spotify Web API
│   ├── WindowsService.js        # Windows API для отслеживания процессов
│   └── ConfigService.js         # Управление конфигурацией
├── utils/
│   └── Logger.js                # Система логирования
├── src/
│   ├── App.jsx                  # Основной компонент с маршрутизацией
│   ├── Player.jsx               # Overlay плеер
│   ├── Settings.jsx             # Интерфейс настроек
│   ├── FadeContent.jsx          # Компонент fade-анимации
│   ├── Player.css               # Кастомные стили и анимации
│   └── index.js                 # Точка входа React
├── assets/                      # Иконки и ресурсы
├── electron-builder.json        # Конфигурация сборки
├── installer.nsh                # NSIS скрипт установщика
├── config.example.json          # Пример конфигурации
└── package.json                 # Зависимости и скрипты
```

## 🎮 Управление плеером

### Основные элементы
- **Play/Pause**: Переключение воспроизведения с анимацией смены иконок
- **Previous/Next**: Переключение треков с Spotify API
- **Прогресс-бар**: Интерактивная перемотка (клик + drag)
- **Marquee текст**: Автопрокрутка длинных названий при hover

### Горячие клавиши (настраиваются)
- `Ctrl+Shift+P` - Показать/скрыть плеер
- `Ctrl+Shift+Space` - Play/Pause
- `Ctrl+Shift+Left/Right` - Previous/Next track
- `Ctrl+Shift+Up/Down` - Громкость

### Системный трей
- **Двойной клик** - Показать/скрыть плеер
- **Правый клик** - Контекстное меню с настройками
- **Индикатор статуса** - Подключение к Spotify

## 🔧 Настройки и конфигурация

### Spotify настройки
- Client ID/Secret настройка
- Автоматическая авторизация OAuth 2.0
- Управление токенами доступа

### Поведение приложения
- Автопоказ при сворачивании Spotify
- Автоскрытие при разворачивании
- Автозапуск с Windows
- Уведомления

### UI настройки
- Прозрачность (50-100%)
- Масштаб (50-200%)
- Позиция (центр/верх/низ/кастом)
- Тема (авто/светлая/темная)

### Производительность
- Интервал обновления данных
- Кэширование запросов
- Логирование и отладка

## 📊 Мониторинг и диагностика

### Логирование
- Автоматические логи в `%APPDATA%/SpotifyOverlayPlayer/logs/`
- Настраиваемые уровни (error/warn/info/debug)
- Ротация файлов и очистка старых логов
- Экспорт логов для диагностики

### Состояние подключения
- Индикатор подключения к Spotify API
- Диагностика проблем авторизации
- Мониторинг состояния Windows процессов

### Статистика использования
- Счетчики запусков и использования
- Аналитика ошибок (локально, без отправки)

## 🛠️ Разработка

### Настройка среды разработки
```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run electron-dev

# Сборка React части отдельно
npm run dev
```

### Сборка и распространение
```bash
# Сборка продакшена
npm run build

# Создание установщика Windows
npm run dist:win

# Создание портабельной версии
npm run build:portable

# Публикация релиза
npm run publish
```

### Архитектура
- **Main процесс**: Управление окнами, системная интеграция
- **Renderer процесс**: React UI для настроек и overlay
- **Preload**: Безопасный мост между процессами
- **Services**: Изолированная бизнес-логика
- **IPC**: Асинхронная коммуникация между процессами

## ❓ Часто задаваемые вопросы

### Почему плеер не появляется?
1. Проверьте авторизацию Spotify в настройках
2. Убедитесь что Spotify запущен и воспроизводит музыку
3. Проверьте настройки поведения в Settings

### Как настроить горячие клавиши?
Откройте настройки приложения → вкладка "Горячие клавиши" → настройте нужные комбинации

### Плеер мешает работе с другими приложениями
В настройках отключите "Всегда поверх других окон" или включите "Пропускать клики мыши"

### Как обновить приложение?
Приложение автоматически проверяет обновления. Также можно скачать новую версию с GitHub Releases.

## 🤝 Вклад в проект

Мы приветствуем вклад от сообщества! Если вы хотите помочь:

1. Форкните репозиторий
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Закоммитьте изменения (`git commit -m 'Add amazing feature'`)
4. Запушьте в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

### Сообщения об ошибках
- Используйте GitHub Issues для багрепортов
- Прикрепляйте логи из `%APPDATA%/SpotifyOverlayPlayer/logs/`
- Описывайте шаги для воспроизведения проблемы

## 📜 Лицензия

Этот проект распространяется под лицензией MIT. Подробности в файле [LICENSE](LICENSE).

```
MIT License

Copyright (c) 2024 Spotify Overlay Player

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🌟 Поддержка проекта

Если проект вам понравился:
- ⭐ Поставьте звезду на GitHub
- 🐛 Сообщайте об ошибках через Issues  
- 💡 Предлагайте новые функции
- 🔧 Отправляйте Pull Request'ы
- 💬 Делитесь с друзьями

**Сделано с ❤️ для музыкальных энтузиастов и любителей красивого софта**
