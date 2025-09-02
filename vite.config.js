import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Базовый путь для продакшена
  base: './',
  
  // Настройки сборки
  build: {
    outDir: 'build',
    assetsDir: 'static',
    sourcemap: false,
    minify: 'esbuild',
    
    // Оптимизация для Electron
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      
      // Исключаем Node.js модули из bundle
      external: [
        'electron',
        'fs',
        'path',
        'os'
      ]
    },
    
    // Настройки для целевой среды
    target: 'chrome100',
    
    // Размер чанков
    chunkSizeWarningLimit: 1000
  },
  
  // Настройки dev сервера
  server: {
    port: 3000,
    host: 'localhost',
    open: false,
    cors: true
  },
  
  // Настройки CSS
  css: {
    postcss: './postcss.config.js'
  },
  
  // Алиасы для импортов
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@services': resolve(__dirname, 'services'),
      '@utils': resolve(__dirname, 'utils')
    }
  },
  
  // Переменные окружения
  define: {
    'process.env': process.env,
    '__VERSION__': JSON.stringify(process.env.npm_package_version),
    '__DEV__': JSON.stringify(process.env.NODE_ENV === 'development')
  },
  
  // Оптимизация зависимостей
  optimizeDeps: {
    include: [
      'react',
      'react-dom'
    ],
    
    // Исключаем Electron модули
    exclude: [
      'electron'
    ]
  }
});
