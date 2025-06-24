// Импортируем библиотеку для работы с Telegram Bot API
const TelegramBot = require('node-telegram-bot-api');

// Токен, выданный BotFather в Telegram
const token = process.env.BOT_TOKEN;

// Создаём экземпляр бота с указанным токеном и включаем режим polling (опроса)
const bot = new TelegramBot(token, {
    polling: {
        interval: 3000,   // Интервал опроса Telegram-сервера в миллисекундах
        autoStart: true   // Автоматически запускать опрос при старте
    }
});

// Экспортируем бота, чтобы использовать его в других файлах
module.exports = bot;