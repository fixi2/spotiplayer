# 🔒 Безопасность - Spotify API Credentials

## ⚠️ ВАЖНО: Никогда не коммитьте реальные Client ID и Client Secret!

### 🛡️ Как безопасно добавить свои credentials:

#### 1. Получите credentials в Spotify Dashboard:
- Перейдите: https://developer.spotify.com/dashboard
- Создайте приложение
- Скопируйте **Client ID** и **Client Secret**

#### 2. Обновите файл `services/SpotifyService.js`:
```javascript
// Замените эти строки на ваши реальные значения:
this.clientId = 'ваш_реальный_client_id';
this.clientSecret = 'ваш_реальный_client_secret';
```

#### 3. Проверьте .gitignore:
Убедитесь что в `.gitignore` есть:
```
# Spotify API credentials (NEVER commit these!)
services/SpotifyService.backup.js
services/SpotifyService.local.js
```

### 🚨 Что НЕ делать:
- ❌ Не коммитьте файлы с реальными credentials
- ❌ Не публикуйте Client Secret в открытом доступе
- ❌ Не добавляйте credentials в README или документацию

### ✅ Что делать:
- ✅ Используйте placeholder значения в публичном коде
- ✅ Храните реальные credentials локально
- ✅ Регулярно обновляйте Client Secret
- ✅ Используйте переменные окружения в продакшене

### 🔧 Альтернативный способ - переменные окружения:

Создайте файл `.env` (уже в .gitignore):
```env
SPOTIFY_CLIENT_ID=ваш_client_id
SPOTIFY_CLIENT_SECRET=ваш_client_secret
```

И обновите код:
```javascript
this.clientId = process.env.SPOTIFY_CLIENT_ID || 'YOUR_SPOTIFY_CLIENT_ID_HERE';
this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET || 'YOUR_SPOTIFY_CLIENT_SECRET_HERE';
```

### 📞 Если credentials попали в git:
1. Немедленно сгенерируйте новые в Spotify Dashboard
2. Удалите старые credentials из истории git
3. Обновите все копии репозитория

**Помните: Client Secret - это как пароль, держите его в секрете!** 🔐
