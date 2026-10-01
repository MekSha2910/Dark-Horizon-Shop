import React from 'react'
import { useNavigate } from 'react-router-dom'

const Registro = () => {
  
  const [formData, setFormData] = React.useState({
    nombre: '',
    apellido: '',
    usuario: '',
    email: '',
    documento: '',
    numeroDocumento: '',
    password: '',
    fechaNacimiento: '',
    direccion: '',
    telefono: ''
  })

  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Adaptamos los datos del formulario (React) a lo que espera tu Base de Datos (Node/Mongo)
    const datosParaBackend = {
      nombre: formData.nombre,
      apellido: formData.apellido,
      tipoDocumento: formData.documento,
      numeroDocumento: formData.numeroDocumento,
      correo: formData.email, // Traducimos email a correo
      direccion: formData.direccion,
      contraseña: formData.password // Traducimos password a contraseña
      // Nota: 'usuario', 'fechaNacimiento' y 'telefono' no están en tu modelo User.js, 
      // así que no los enviamos (o tendrías que agregarlos a tu modelo User.js luego).
    };

    try {
      // 2. Hacemos la petición POST a tu servidor
      const respuesta = await fetch('http://localhost:8000/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosParaBackend),
      });

      // 3. Leemos la respuesta del servidor
      const data = await respuesta.json();

      if (respuesta.ok) {
        // Si el status es 201 (creado)
        alert('¡Registro exitoso en MongoDB! Ya puedes iniciar sesión.');
        navigate('/login');
      } else {
        // Si hay un error (ej. el correo o documento ya existe)
        alert(`Error al registrar: ${data.mensaje}`);
      }
    } catch (error) {
      console.error('Error en la petición:', error);
      alert('Hubo un error al intentar conectar con el servidor.');
    }
  };

  return (
    <div className="registro-container">
      <h2 className="registro-title">Registro</h2>
      <form onSubmit={handleSubmit} className="registro-form">
        <input name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Nombre" required className="registro-input" />
        <input name="apellido" value={formData.apellido} onChange={handleChange} placeholder="Apellido" required className="registro-input" />
        <input name="usuario" value={formData.usuario} onChange={handleChange} placeholder="Usuario" required className="registro-input" />
        <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" required className="registro-input" />
        <select name="documento" value={formData.documento} onChange={handleChange} required className="registro-input">
          <option value="">Tipo de documento</option>
          <option value="CC">Cédula de Ciudadanía</option>
          <option value="TI">Tarjeta de Identidad</option>
          <option value="CE">Cédula de Extranjería</option>
          <option value="PA">Pasaporte</option>
        </select>
        <input name="numeroDocumento" value={formData.numeroDocumento} onChange={handleChange} placeholder="Número de documento" required className="registro-input" />
        <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Contraseña" required className="registro-input" />
        <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} required className="registro-input" />
        <input name="direccion" value={formData.direccion} onChange={handleChange} placeholder="Dirección" className="registro-input" />
        <input name="telefono" value={formData.telefono} onChange={handleChange} placeholder="Teléfono" className="registro-input" />
        <button type="submit" className="registro-btn registro-btn-primary">Registrar</button>
      </form>
      <button type="button" onClick={() => navigate('/login')} className="registro-btn registro-btn-secondary">Volver al login</button>
    </div>
  )
}

export default Registro