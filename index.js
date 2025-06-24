// Импортируем библиотеку dotenv и загружаем переменные окружения
const dotenv = require('dotenv');
dotenv.config();

// Импорт настроек бота
const bot = require('./utils/botSettings');

// Импорт моделей: Водитель, Заказ, Клиент
const { Driver, Order, Client } = require('./models/associations.js');

// Импорт настроек подключения к базе данных
const { sequelize } = require('./utils/dbSettings');

// Импорт операторов Sequelize
const { where, or } = require('sequelize');

// Главная асинхронная функция, в которой запускается логика бота
async function main() {
    // Синхронизация моделей с базой данных
    await sequelize.sync();

    // Обработка текстовых сообщений
    bot.on('text', async (msg) => {
        // Команда /start — просто отправляет сообщение, что бот запущен
        if (msg.text === '/start') {
            await bot.sendMessage(msg.chat.id, 'Бот запущен!');
        }

        // Обработка команды вида /t 89001234567 — запрос информации по номеру телефона
        if (msg.text.match(/^\/t (\+7|8)[0-9]+$/)) {
            const phone = msg.text.split(' ')[1].replace(/\+7/, '8'); // Приведение телефона к формату с 8
            const client = await Client.findOne({ where: { phone } }); // Поиск клиента по номеру

            if (client) {
                // Получаем все заказы клиента и подключаем модель Driver
                const orders = await Order.findAll({ where: { clientId: client.id }, include: Driver });

                // Определяем дату и время последнего заказа
                const lastOrder = orders.sort((a, b) => b.createdAt - a.createdAt)[0].createdAt;
                const lastOrderDate = lastOrder.toLocaleDateString();
                const lastOrderTime = lastOrder.toLocaleTimeString().slice(0, 5);

                // Подсчитываем общее количество заказанных баллонов
                const totalQuantity = orders.reduce((acc, el) => acc += el.quantity, 0);

                // Формируем текстовую историю последних 5 заказов
                const ordersHistory = orders.slice(0, 5).map(el =>
                    `👬 ${el.quantity} | ${el.address} | ${el.createdAt.toLocaleDateString()} | ${el.Driver.name}`
                );

                // Итоговое сообщение для пользователя
                const msgText = `Клиент: ${client.name}\nТелефон: ${client.phone}\nПоследний заказ: ${lastOrderTime} - ${lastOrderDate}\nВсего заказано баллонов: ${totalQuantity}\nИстория заказов:\n${ordersHistory.join('\n')}`;

                // Отправляем сообщение с кнопкой "Больше заказов..."
                await bot.sendMessage(msg.chat.id, msgText, {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: 'Больше заказов...', callback_data: JSON.stringify({ clientId: client.id, command: 'more_info' }) }]
                        ]
                    }
                });
            } else {
                // Клиент не найден
                await bot.sendMessage(msg.chat.id, 'Клиент не найден!');
            }
        } else {
            // Если сообщение не команда — считаем, что это заказ

            // Преобразуем сообщение в массив строк
            const infoArr = msg.text.trim().split(/\n/);

            // Первая строка — количество баллонов
            const quantity = parseInt(infoArr.splice(0, 1)[0]);

            // Последняя строка — имя и телефон
            let [name, ...phone] = infoArr.splice(-1, 1)[0].split(' ').reverse();
            phone = phone.reverse().join('').replace(/^\+7/, '8').replace(/[^0-9]/g, '');

            // Остальное — адрес
            const address = infoArr.join(', ');

            // Поиск или создание клиента
            let client = await Client.findOne({ where: { phone } });
            if (!client) {
                client = await Client.create({ name, phone });
            }

            // Создание заказа
            const totalPrice = 1700 * quantity;
            const order = await Order.create({ quantity, totalPrice, clientId: client.id, address });

            // Получаем список всех водителей
            const drivers = await Driver.findAll({});

            // Генерируем кнопки с именами водителей
            const buttons = [...drivers].map(el => [{
                text: el.name,
                callback_data: JSON.stringify({ driverId: el.id, orderId: order.id, command: 'set_driver' })
            }]);

            // Отправляем сообщение с выбором водителя
            await bot.sendMessage(msg.chat.id, 'Выберите водителя:', {
                reply_markup: {
                    inline_keyboard: buttons
                }
            });
        }
    });

    // Обработка нажатий на кнопки (callback_query)
    bot.on('callback_query', async (callback) => {
        const data = JSON.parse(callback.data);

        // Назначение водителя для заказа
        if (data['command'] === 'set_driver') {
            await Order.update({ driverId: data.driverId }, { where: { id: data.orderId } });
            bot.sendMessage(callback.from.id, 'Данные успешно внесены!');
        }

        // Запрос полной истории заказов клиента
        if (data['command'] === 'more_info') {
            const orders = await Order.findAll({ where: { clientId: data.clientId }, include: Driver });
            const ordersHistory = orders.map(el =>
                `👬 ${el.quantity} | ${el.address} | ${el.createdAt.toLocaleDateString()} | ${el.Driver.name}`
            );
            const msgText = `Полная история заказов:\n${ordersHistory.join('\n')}`;
            bot.sendMessage(callback.from.id, msgText);
        }
    });
}

// Запуск основной функции
main();

// Обработка непойманных исключений (например, ошибок в промисах)
process.on('uncaughtException', (err) => {
    console.log(err);
});

// Обработка сигнала завершения (Ctrl+C) — закрываем подключение к БД
process.on('SIGINT', async () => {
    await sequelize.close();
    process.exit();
});