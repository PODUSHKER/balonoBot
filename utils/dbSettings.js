// Импортируем Sequelize — ORM для работы с базой данных
const Sequelize = require('sequelize');

// Создаём подключение к базе данных SQLite с файлом "balonodb.db"
const sequelize = new Sequelize({
    dialect: 'sqlite',            // Указываем, что используется SQLite
    storage: 'balonodb.db'        // Путь до файла базы данных
});

// Экспортируем объект sequelize и типы данных Sequelize для использования в моделях
module.exports = {
    sequelize,
    DataTypes: Sequelize.DataTypes
};