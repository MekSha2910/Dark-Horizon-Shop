import mongoose from 'mongoose';

const productoSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    descripcion: { type: String, required: true },
    imagen: { type: String, required: true },
    // Lista de precios en otras tiendas (opcional)
    opcionesCompra: [{
        tienda: String, // Ej: Amazon
        precio: Number,
}]
}, { timestamps: true });

const Producto = mongoose.model('productos', productoSchema);
export default Producto;