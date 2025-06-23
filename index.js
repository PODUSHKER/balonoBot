const bot = require('./utils/botSettings')
const { Driver, Order, Client } = require('./models/associations.js')
const { sequelize } = require('./utils/dbSettings');
const { where, or } = require('sequelize');

async function main() {
    await sequelize.sync()

    bot.on('text', async (msg) => {
        if (msg.text === '/start') {
            await bot.sendMessage(msg.chat.id, 'Bot started!')
        }
        console.log(msg.text.match(/^\/t (\+7|8)[0-9]+$/))
        if (msg.text.match(/^\/t (\+7|8)[0-9]+$/)) {
            const phone = msg.text.split(' ')[1].replace(/\+7/, '8');
            const client = await Client.findOne({ where: { phone } });
            if (client) {
                const orders = await Order.findAll({ where: { clientId: client.id }, include: Driver });
                console.log(orders)
                const lastOrder = orders.sort((a, b) => b.createdAt - a.createdAt)[0].createdAt;
                const lastOrderDate = lastOrder.toLocaleDateString()
                const lastOrderTime = lastOrder.toLocaleTimeString().slice(0, 5);
                console.log(lastOrderTime)
                const totalQuantity = orders.reduce((acc, el) => acc += el.quantity, 0)

                const ordersHistory = orders.map(el => `👬 ${el.quantity} | ${el.address} | ${el.createdAt.toLocaleDateString()} | ${el.Driver.name}`)
                const msgText = `Клиент: ${client.name}\nТелефон: ${client.phone}\nПоследний заказ: ${lastOrderTime} - ${lastOrderDate}\nВсего заказано баллонов: ${totalQuantity}\nИстория заказов:\n${ordersHistory.join('\n')}`

                await bot.sendMessage(msg.chat.id, msgText);
            }
            else{
                await bot.sendMessage(msg.chat.id, 'Клиент не найден!')
            }
        }
        else {
            const infoArr = msg.text.trim().split(/\n/);
            const quantity = parseInt(infoArr.splice(0, 1)[0]);
            let [name, ...phone] = infoArr.splice(-1, 1)[0].split(' ').reverse();
            phone = phone.reverse().join('').replace(/^\+7/, '8').replace(/[^0-9]/g, '')

            const address = infoArr.join(', ');

            let client = await Client.findOne({ where: { phone } });
            if (!client) {
                client = await Client.create({ name, phone });
            }
            const totalPrice = 1700 * quantity;
            const order = await Order.create({ quantity, totalPrice, clientId: client.id, address })

            const drivers = await Driver.findAll({});
            const buttons = [...drivers].map(el => [{ text: el.name, callback_data: JSON.stringify({ driverId: el.id, orderId: order.id }) }])

            await bot.sendMessage(msg.chat.id, 'Выберите водителя:', {
                reply_markup: {
                    inline_keyboard: buttons

                }
            })
        }

    })

    bot.on('callback_query', async (callback) => {
        const data = JSON.parse(callback.data);
        await Order.update({ driverId: data.driverId }, { where: { id: data.orderId } })
        bot.sendMessage(callback.from.id, 'Данные успешно внесены!')
    })

}

main()

process.on('uncaughtException', (err) => {
    console.log(err);
})


process.on('SIGINT', async () => {
    await sequelize.close();
    process.exit()
})