const Sequelize = require('sequelize')

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'balonodb.db'
})


module.exports = { sequelize, DataTypes: Sequelize.DataTypes }