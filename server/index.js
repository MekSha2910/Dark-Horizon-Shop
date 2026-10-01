import Producto from './models/Producto.js';
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
app.use(cors()); // Esto permite que React se comunique con Node sin bloqueos

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
        // Recibimos el correo y la contraseña desde React
        const { correo, contraseña } = req.body;

        // 1. Buscamos si existe un usuario con ese correo en la base de datos
        const usuario = await User.findOne({ correo: correo });
        if (!usuario) {
            return res.status(400).json({ mensaje: "El correo no está registrado" });
        }

        // 2. Si el usuario existe, comparamos la contraseña escrita con la guardada (encriptada)
        const contraseñaValida = await bcrypt.compare(contraseña, usuario.contraseña);
        if (!contraseñaValida) {
            return res.status(400).json({ mensaje: "Contraseña incorrecta" });
        }

        // 3. Si todo está correcto, enviamos un mensaje de éxito y los datos básicos del usuario
        res.status(200).json({ 
            mensaje: "Inicio de sesión exitoso",
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

// RUTA PARA AGREGAR UN PRODUCTO (Solo el Admin la usará)
app.post('/api/productos', async (req, res) => {
    try {
        const nuevoProducto = new Producto(req.body);
        await nuevoProducto.save();
        res.status(201).json({ mensaje: "Producto publicado exitosamente" });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al publicar producto", error });
    }
});

// RUTA PARA TRAER TODOS LOS PRODUCTOS (Para la página de Inicio)
app.get('/api/productos', async (req, res) => {
    try {
        const productos = await Producto.find();
        res.json(productos);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener productos" });
    }
});

// RUTA PARA ELIMINAR UN PRODUCTO
app.delete('/api/productos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Producto.findByIdAndDelete(id);
        res.json({ mensaje: "Producto eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al eliminar el producto", error });
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