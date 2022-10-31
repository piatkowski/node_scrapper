const mysql = require('mysql');

module.exports.createConnection = () => mysql.createConnection({
    host: '',
    port: 8889,
    user: 'root',
    password: '',
    database: ''
});