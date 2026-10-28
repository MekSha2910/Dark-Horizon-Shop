import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Login = () => {
  // 1. Estado para guardar los datos del formulario de login
  const [formData, setFormData] = React.useState({
    email: '',
    password: ''
  });

  const navigate = useNavigate();

  // 2. Manejador para actualizar el estado cuando el usuario escribe
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // 3. Lógica para verificar el inicio de sesión con MongoDB
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Preparamos los datos tal como los espera el backend
    const datosLogin = {
      correo: formData.email,
      contraseña: formData.password
    };

    try {
      // Hacemos la petición POST a nuestra nueva ruta de login
      const respuesta = await fetch('https://dark-horizon-shop.onrender.com/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosLogin),
      });

      const data = await respuesta.json();
      console.log("Datos que recibo del servidor:", data.usuario);
      if (respuesta.ok) {
        // 1. Guardamos el perfil para que la barra de navegación sepa quién eres
        localStorage.setItem('usuarioActivo', JSON.stringify(data.usuario));
        
        // 2. ¡ESTA ES LA LÍNEA CRÍTICA! Guardamos la llave de seguridad para poder comprar
        localStorage.setItem('token', data.token); 
        
        window.dispatchEvent(new Event('usuarioActualizado'));
        toast.success(`¡Bienvenido de nuevo, ${data.usuario.nombre}!`);

        // Redireccion dependiendo el usuario
        if (data.usuario.tipoUsuario === 'admin') {
          console.log("Detectado como Admin, redirigiendo...");
          navigate('/admin'); 
        } else {
          console.log("Detectado como Cliente, redirigiendo...");
          navigate('/'); 
        }
        
      } else {
        toast.error(data.mensaje || 'No se pudo iniciar sesión.');
      }
    } catch (error) {
      console.error('Error en el login:', error);
      toast.error('Hubo un error al intentar conectar con el servidor.');
    }
  };

  return (
    <div className="login-container">
      <h2>Iniciar Sesión</h2>
      
      <form onSubmit={handleSubmit} className="login-form">
        <div className="input-group">
          <input 
            type="email" 
            name="email" 
            value={formData.email} 
            onChange={handleChange} 
            placeholder="Ingresa tu email" 
            required 
            className="login-input"
          />
        </div>

        <div className="input-group">
          <input 
            type="password" 
            name="password" 
            value={formData.password} 
            onChange={handleChange} 
            placeholder="Ingresa tu contraseña" 
            required 
            className="login-input"
          />
        </div>

        <button type="submit" className="login-btn login-btn-primary">
          Ingresar
        </button>
      </form>

      <button 
        type="button" 
        onClick={() => navigate('/registro')} 
        className="login-btn login-btn-secondary"
      >
        ¿No tienes cuenta? Regístrate
      </button>
    </div>
  );
};

export default Login;