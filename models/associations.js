const Client = require('./Client.js')
const Order = require('./Order.js')
const Driver = require('./Driver.js')


Driver.hasMany(Order, {foreignKey: 'driverId', allowNull: true})
Order.belongsTo(Driver, {foreignKey: 'driverId', allowNull: true})

Client.hasMany(Order, {foreignKey: 'clientId'});
Order.belongsTo(Client, {foreignKey: 'clientId'});


module.exports = { Driver, Order, Client };