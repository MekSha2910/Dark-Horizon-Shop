// server/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    tipoDocumento: { type: String, required: true },
    numeroDocumento: { type: String, required: true, unique: true },
    correo: { type: String, required: true, unique: true },
    direccion: { type: String },
    contraseña: { type: String, required: true },
    tipoUsuario: { 
        type: String, 
        enum: ['cliente', 'admin'], 
        default: 'cliente' 
    }
}, { timestamps: true });

// Esto encripta la contraseña solita antes de guardar en la DB
userSchema.pre('save', async function (next) {
    if (!this.isModified('contraseña')) return;
    const salt = await bcrypt.genSalt(10);
    this.contraseña = await bcrypt.hash(this.contraseña, salt);
});

const User = mongoose.model('users', userSchema);
export default User;