import mysql from 'mysql2/promise';

const dbMySQL = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
        rejectUnauthorized: false
    }
});

// Conexión al iniciar el servidor
dbMySQL.getConnection()
    .then(connection => {
        console.log('Base de datos MySQL conectada exitosamente (Inventario y Ventas)');
        connection.release();
    })
    .catch(error => {
        console.error('Error al conectar con MySQL:', error.message);
    });

export default dbMySQL;