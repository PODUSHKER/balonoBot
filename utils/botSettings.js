const TelegramBot = require('node-telegram-bot-api')
const token = '7859844570:AAE_cXIYyrGkPyA0sFJeq6p_osmsaYK6ZI8';
const bot = new TelegramBot(token, {
    polling: {
        interval: 3000,
        autoStart: true
    }
})


module.exports = bot;