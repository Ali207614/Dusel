const TelegramBot = require('node-telegram-bot-api');

const token = "7772567096:AAGoXbMMPipKsxmGybPfb75MORti0erzW6w"
if (!token) throw new Error('BOT_TOKEN yo‘q');

const bot = new TelegramBot(token, { polling: true });

bot.on('polling_error', (e) => console.error('polling_error:', e?.message || e));
bot.on('webhook_error', (e) => console.error('webhook_error:', e?.message || e));

bot.on('message', async (msg) => {
    const chat = msg.chat;
    const from = msg.from;
    const text = msg.text || '';

    console.log(`[${chat.type}] chatId=${chat.id} | fromId=${from?.id} | text="${text}"`);

});