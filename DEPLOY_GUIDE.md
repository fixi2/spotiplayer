# 🚀 Деплой на Vercel для Spotify Callback

## 📋 Быстрая настройка

### 1. Подготовка к деплою

1. **Создайте аккаунт на Vercel:**
   - Перейдите: https://vercel.com
   - Войдите через GitHub

2. **Подготовьте файлы:**
   - ✅ `public/callback.html` - создан
   - ✅ `vercel.json` - создан

### 2. Деплой через GitHub

1. **Создайте репозиторий на GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/ваш-username/spotify-callback.git
   git push -u origin main
   ```

2. **Подключите к Vercel:**
   - Зайдите на https://vercel.com/dashboard
   - Нажмите "New Project"
   - Выберите ваш репозиторий
   - Нажмите "Deploy"

3. **Получите URL:**
   - После деплоя получите URL типа: `https://ваш-проект.vercel.app`

### 3. Альтернативный способ - Drag & Drop

1. **Создайте папку с файлами:**
   ```
   spotify-callback/
   ├── public/
   │   └── callback.html
   └── vercel.json
   ```

2. **Загрузите на Vercel:**
   - Перейдите на https://vercel.com
   - Перетащите папку в область деплоя
   - Получите URL

### 4. Настройка Spotify Dashboard

1. **Обновите Redirect URI:**
   - Зайдите в Spotify Developer Dashboard
   - В настройках приложения добавьте:
   - `https://ваш-проект.vercel.app/callback`

2. **Обновите код приложения:**
   ```javascript
   // В services/SpotifyService.js
   this.redirectUri = 'https://ваш-проект.vercel.app/callback';
   ```

### 5. Тестирование

1. **Запустите приложение:**
   ```bash
   npm run electron-dev
   ```

2. **Проверьте авторизацию:**
   - Двойной клик на иконке трея
   - Нажмите "Подключить Spotify"
   - Должна открыться страница авторизации

## 🔧 Альтернативные сервисы

### Netlify
1. Перейдите на https://netlify.com
2. Перетащите папку с файлами
3. Получите URL типа: `https://ваш-проект.netlify.app`

### GitHub Pages
1. Создайте репозиторий
2. Включите GitHub Pages в настройках
3. Получите URL: `https://username.github.io/spotify-callback`

## ⚠️ Важные моменты

- **HTTPS обязателен** для Spotify API
- **URL должен быть доступен** из интернета
- **Callback URL** должен точно совпадать в Spotify Dashboard
- **Домен должен быть постоянным** (не localhost)

## 🎯 Рекомендация

**Используйте Vercel** - самый простой и надежный вариант:
- ✅ Бесплатно навсегда
- ✅ HTTPS из коробки  
- ✅ Мгновенный деплой
- ✅ Автоматические обновления
