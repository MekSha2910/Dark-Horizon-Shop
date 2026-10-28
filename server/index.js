import jwt from 'jsonwebtoken';
import dbMySQL from './models/Mysql.js';
import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import User from './models/User.js';
import cors from 'cors';
import bcrypt from 'bcrypt';

// 1. Configurar dotenv para que Node pueda leer tu archivo .env
dotenv.config();

// 2. Inicializar la aplicación de Express
const app = express();
app.use(cors({
    origin: 'darkhorizontshop.netlify.app',
    credentials: true
})); // Esto permite que React se comunique con Node sin bloqueos

// 3. Usar body-parser para que tu servidor entienda los datos JSON que lleguen de React
app.use(bodyParser.json());

// RUTA PARA REGISTRAR USUARIOS
app.post('/api/users/register', async (req, res) => {
    try {
        const { nombre, apellido, tipoDocumento, numeroDocumento, correo, direccion, contraseña, tipoUsuario } = req.body;

        // Creamos una nueva instancia del usuario con los datos que vienen de React
        const nuevoUsuario = new User({
            nombre,
            apellido,
            tipoDocumento,
            numeroDocumento,
            correo,
            direccion,
            contraseña,
            tipoUsuario // Si no viene nada, por defecto será 'cliente'
        });

        // Guardamos en MongoDB
        await nuevoUsuario.save();
        
        res.status(201).json({ mensaje: "Usuario creado exitosamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al registrar usuario", error: error.message });
    }
});

// RUTA PARA INICIAR SESIÓN (LOGIN)
app.post('/api/users/login', async (req, res) => {
    try {
        // Acepta ambos nombres para mantener compatibilidad con el formulario actual.
        const correo = req.body.email ?? req.body.correo;
        const contraseña = req.body.password ?? req.body.contraseña;
        if (!correo || !contraseña) {
            return res.status(400).json({ mensaje: "Correo y contraseña son obligatorios" });
        }

        const usuario = await User.findOne({ correo });
        if (!usuario) {
            return res.status(400).json({ mensaje: "El correo no está registrado" });
        }

        const ahora = new Date();
        if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > ahora) {
            return res.status(403).json({
                mensaje: "Cuenta bloqueada por múltiples intentos fallidos. Intenta en 1 hora."
            });
        }

        // Al terminar el bloqueo, iniciar un nuevo periodo de intentos.
        if (usuario.bloqueadoHasta && usuario.bloqueadoHasta <= ahora) {
            usuario.intentosFallidos = 0;
            usuario.bloqueadoHasta = null;
        }

        const contraseñaValida = await bcrypt.compare(contraseña, usuario.contraseña);
        if (!contraseñaValida) {
            usuario.intentosFallidos += 1;
            if (usuario.intentosFallidos >= 3) {
                usuario.bloqueadoHasta = new Date(Date.now() + 60 * 60 * 1000);
            }
            await usuario.save();
            return res.status(usuario.bloqueadoHasta ? 403 : 401).json({
                mensaje: usuario.bloqueadoHasta
                    ? "Cuenta bloqueada por múltiples intentos fallidos. Intenta en 1 hora."
                    : "Credenciales incorrectas"
            });
        }

        usuario.intentosFallidos = 0;
        usuario.bloqueadoHasta = null;
        await usuario.save();

        // Generar el Token (Firma digital de la sesión)
        const token = jwt.sign(
            { id: usuario._id, tipoUsuario: usuario.tipoUsuario },
            process.env.JWT_SECRET || 'secreto_dhs_123', // En producción esto va en tu archivo .env
            { expiresIn: '2h' }
        );

        res.status(200).json({ 
            mensaje: "Inicio de sesión exitoso",
            token: token, // <-- Enviamos el token al frontend
            usuario: {
                id: usuario._id,
                nombre: usuario.nombre,
                correo: usuario.correo,
                tipoUsuario: usuario.tipoUsuario
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error en el servidor al iniciar sesión" });
    }
});

const verificarRolComprador = (req, res, next) => {
    // 1. Obtener el token de los encabezados (Headers) que enviará React
    const token = req.header('Authorization');
    
    // Si no hay token, es un usuario no registrado (Guest)
    if (!token) {
        return res.status(401).json({ 
            mensaje: "Debes iniciar sesión para realizar una compra",
            requiereLogin: true // El frontend usará esto para abrir tu modal de "INICIAR / REGISTRARSE"
        }); 
    }

    try {
        // 2. Desencriptar el token para ver quién es
        const verificado = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET || 'secreto_dhs_123');
        
        // 3. Bloquear si es administrador
        if (verificado.tipoUsuario === 'admin' || verificado.tipoUsuario === 'administrador') {
            return res.status(403).json({ mensaje: "Acción no disponible para administradores" });
        }
        
        // Si todo está bien, guardamos los datos del usuario en la petición y continuamos
        req.usuario = verificado; 
        next(); 
    } catch (error) {
        return res.status(401).json({ mensaje: "Sesión inválida o expirada. Por favor, inicia sesión nuevamente." });
    }
};

//Obtener lista de tiendas ya registradas para el autocompletado del Admin
app.get('/api/tiendas', async (req, res) => {
    try {
        const [tiendas] = await dbMySQL.query('SELECT DISTINCT nombre_tienda FROM opciones_tiendas');
        res.json(tiendas.map(t => t.nombre_tienda)); // Devolvemos un arreglo simple: ['Amazon', 'Temu']
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener tiendas" });
    }
});

// RUTA PARA TRAER PRODUCTOS (Con paginación de 24 productos)
app.get('/api/productos', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 24;
        const offset = (page - 1) * limit;

        const [productos] = await dbMySQL.query("SELECT * FROM productos WHERE estado = 'activo' LIMIT ? OFFSET ?", [limit, offset]);
        
        // Por cada producto, buscamos sus precios y se los incrustamos como arreglo
        for (let prod of productos) {
            const [opciones] = await dbMySQL.query('SELECT nombre_tienda as tienda, precio FROM opciones_tiendas WHERE id_producto = ?', [prod.id_producto]);
            prod.opcionesCompra = opciones;
        }

        const [totalRows] = await dbMySQL.query("SELECT COUNT(*) as count FROM productos WHERE estado = 'activo'");
        res.json({ productos, totalPages: Math.ceil(totalRows[0].count / limit), currentPage: page });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener productos desde MySQL" });
    }
});

// RUTA PARA AGREGAR UN PRODUCTO
app.post('/api/productos', async (req, res) => {
    const connection = await dbMySQL.getConnection();
    try {
        await connection.beginTransaction();
        await dbMySQL.query("UPDATE productos SET estado = 'inactivo' WHERE id_producto = ?", [id]);
        const { nombre, descripcion, stock, imagen_url, opcionesCompra } = req.body;
        // Guardamos el precio de la primera opción como precio de referencia en la tabla principal
        const precioBase = opcionesCompra.length > 0 ? opcionesCompra[0].precio : 0;

        const [resultado] = await connection.query(
            'INSERT INTO productos (nombre, descripcion, precio, stock, imagen_url) VALUES (?, ?, ?, ?, ?)',
            [nombre, descripcion, precioBase, stock || 10, imagen_url]
        );
        const idProducto = resultado.insertId;

        // Iteramos las tiendas elegidas y las insertamos en la tabla secundaria
        for (const opcion of opcionesCompra) {
            await connection.query(
                'INSERT INTO opciones_tiendas (id_producto, nombre_tienda, precio) VALUES (?, ?, ?)',
                [idProducto, opcion.tienda, opcion.precio]
            );
        }

        await connection.commit();
        res.status(201).json({ mensaje: "Producto publicado exitosamente" });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ mensaje: "Error al publicar producto" });
    } finally {
        connection.release();
    }
});

// RUTA PARA ELIMINAR UN PRODUCTO
app.delete('/api/productos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // En bases relacionales financieras, es mejor hacer un "borrado lógico" (inactivar) para no romper el historial de ventas
        await dbMySQL.query('UPDATE productos SET estado = "inactivo" WHERE id_producto = ?', [id]);
        res.json({ mensaje: "Producto eliminado correctamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al eliminar el producto en MySQL", error: error.message });
    }
});

// MIDDLEWARE PARA PROTEGER RUTAS DE ADMINISTRADOR
const verificarAdmin = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ mensaje: "Acceso denegado. Inicia sesión." });

    try {
        const verificado = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET || 'secreto_dhs_123');
        if (verificado.tipoUsuario !== 'admin' && verificado.tipoUsuario !== 'administrador') {
            return res.status(403).json({ mensaje: "Acceso denegado. Se requieren permisos de administrador." });
        }
        req.usuario = verificado;
        next();
    } catch (error) {
        return res.status(401).json({ mensaje: "Token inválido o expirado." });
    }
};

// RUTA PARA PROCESAR LA COMPRA (Solo clientes)
app.post('/api/ventas/procesar', verificarRolComprador, async (req, res) => {
    // Usamos una "transacción" SQL para asegurar que si falla un paso, no se guarde nada a medias
    const connection = await dbMySQL.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { carrito } = req.body; // React enviará el arreglo de productos
        const idUsuarioMongo = req.usuario.id;

        // 1. Calcular la matemática financiera
        let subtotal = 0;
        for (const item of carrito) {
            subtotal += (item.precio * item.cantidad);
        }
        const comisionDHS = subtotal * 0.10;
        const total = subtotal + comisionDHS;

        // 2. Insertar la venta general
        const [resultadoVenta] = await connection.query(
            'INSERT INTO ventas (id_usuario_mongo, subtotal, comision_plataforma, total) VALUES (?, ?, ?, ?)',
            [idUsuarioMongo, subtotal, comisionDHS, total]
        );
        const idVenta = resultadoVenta.insertId;

        // 3. Insertar los detalles y descontar el stock
        for (const item of carrito) {
            await connection.query(
                'INSERT INTO detalle_ventas (id_venta, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
                [idVenta, item.id_producto, item.cantidad, item.precio]
            );
            
            await connection.query(
                'UPDATE productos SET stock = stock - ? WHERE id_producto = ?',
                [item.cantidad, item.id_producto]
            );
        }

        // Si todo salió bien, confirmamos los cambios en la base de datos
        await connection.commit();
        res.status(201).json({ mensaje: "Compra realizada con éxito", idVenta });

    } catch (error) {
        // Si hay un error, revertimos cualquier cambio (rollback)
        await connection.rollback();
        console.error(error);
        res.status(500).json({ mensaje: "Error al procesar la compra", error: error.message });
    } finally {
        // Liberamos la conexión para que otros usuarios puedan comprar
        connection.release();
    }
});

// RUTA PARA ESTADÍSTICAS DE ADMINISTRADOR (Solo admins)
app.get('/api/ventas/estadisticas', verificarAdmin, async (req, res) => {
    try {
        const [stats] = await dbMySQL.query(`
            SELECT 
                COUNT(*) as total_ventas,
                SUM(comision_plataforma) as ganancias_dhs,
                SUM(total) as dinero_movido
            FROM ventas
        `);
        
        const [productosVendidos] = await dbMySQL.query(`
            SELECT SUM(cantidad) as total_productos FROM detalle_ventas
        `);

        res.json({
            ventasTotales: stats[0].total_ventas || 0,
            gananciasPlataforma: stats[0].ganancias_dhs || 0,
            totalDineroMovido: stats[0].dinero_movido || 0,
            productosVendidos: productosVendidos[0].total_productos || 0
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al obtener estadísticas" });
    }
});

// 4. Traer las variables de tu archivo .env
const PORT = process.env.PORT || 8000;
const MONGO_URL = process.env.mongo_URL;

// 5. Conectar a MongoDB usando Mongoose
mongoose.connect(MONGO_URL)
  .then(() => {
    // Si la conexión es exitosa, se ejecuta esto:
    console.log('¡Conexión exitosa a la base de datos de DHS en MongoDB!');
    
    // Solo encendemos el servidor Express si la base de datos conectó bien
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en el puerto ${PORT}`);
    });
  })
  .catch((error) => {
    // Si hay un error (por ejemplo, si no tienes Compass abierto o el servicio de Mongo apagado)
    console.error('Error conectando a MongoDB:', error);
  });