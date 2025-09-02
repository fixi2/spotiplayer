# 🎵 Настройка Spotify API для Overlay Player

## 📋 Пошаговая инструкция

### 1. Создание приложения в Spotify Developer Dashboard

1. **Перейдите на:** https://developer.spotify.com/dashboard
2. **Войдите** в свой аккаунт Spotify
3. **Нажмите "Create App"**
4. **Заполните форму:**
   - **App name:** `Spotify Overlay Player`
   - **App description:** `Custom overlay player for Windows`
   - **Website:** `http://localhost:3000`
   - **Redirect URI:** `http://localhost:3000/callback`
   - **API/SDKs:** ✅ **Web API**
5. **Нажмите "Save"**

### 2. Получение Client ID и Client Secret

После создания приложения:
1. **Скопируйте Client ID** (виден сразу)
2. **Нажмите "Show Client Secret"** и скопируйте его
3. **Сохраните эти значения в безопасном месте**

### 3. Настройка в приложении

Откройте файл `services/SpotifyService.js` и замените:

```javascript
// Строки 10-11
this.clientId = 'YOUR_SPOTIFY_CLIENT_ID_HERE';
this.clientSecret = 'YOUR_SPOTIFY_CLIENT_SECRET_HERE';
```

На ваши реальные значения:

```javascript
this.clientId = 'ваш_client_id_здесь';
this.clientSecret = 'ваш_client_secret_здесь';
```

### 4. Проверка Redirect URI

Убедитесь что в Spotify Dashboard добавлен Redirect URI:
- `http://localhost:3000/callback`

### 5. Запуск приложения

После настройки:
```bash
npm run electron-dev
```

### 6. Авторизация

1. **Двойной клик** на иконке в системном трее
2. **Нажмите "Подключить Spotify"**
3. **Разрешите доступ** в браузере
4. **Готово!** Плеер подключен к Spotify

## ⚠️ Важные моменты

- **Client Secret** держите в секрете
- **Redirect URI** должен точно совпадать
- Приложение должно быть **активным** в Spotify Dashboard
- **Первый запуск** может потребовать повторной авторизации

## 🔧 Устранение проблем

### "Client ID не найден"
- Проверьте что заменили `YOUR_SPOTIFY_CLIENT_ID_HERE` на реальный ID
- Убедитесь что приложение создано в Spotify Dashboard

### "Redirect URI не совпадает"
- Проверьте URI в Spotify Dashboard
- Убедитесь что порт 3000 свободен

### "Ошибка авторизации"
- Проверьте Client Secret
- Убедитесь что приложение активно
- Попробуйте пересоздать приложение

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте логи в консоли Electron
2. Убедитесь что все настройки корректны
3. Попробуйте пересоздать приложение в Spotify Dashboard
