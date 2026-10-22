import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Barra = () => {
  const [usuario, setUsuario] = useState(null);
  const navigate = useNavigate();

  // Al cargar la barra, revisamos si hay un usuario en el localStorage
  useEffect(() => {
    const sincronizarUsuario = () => {
      const userGuardado = localStorage.getItem('usuarioActivo');
      setUsuario(userGuardado ? JSON.parse(userGuardado) : null);
    };

    sincronizarUsuario();
    window.addEventListener('usuarioActualizado', sincronizarUsuario);
    return () => window.removeEventListener('usuarioActualizado', sincronizarUsuario);
  }, []);

  // Función para limpiar el localStorage y cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem('usuarioActivo');
    setUsuario(null);
    toast.success("Sesión cerrada correctamente");
    navigate('/login');
  };

  return (
    <header>
      <h1>Dark Horizon Shop</h1>
      <nav>
        <ul className="menu">
          <li><Link to='/'>Inicio</Link></li>
          
          {/* Si el usuario existe, mostramos su nombre y botón de salir */}
          {usuario ? (
            <>
              {/* 1. MOSTRAR SOLO A CLIENTES: Carrito */}
              {usuario.tipoUsuario === 'cliente' && (
                <li><Link to='/carrito'>Carrito</Link></li>
              )}

              {/* 2. MOSTRAR SOLO A ADMINS: Panel de Control */}
              {usuario.tipoUsuario === 'admin' && (
                <li><Link to='/admin'>Panel Admin</Link></li>
              )}
              <li className="user-greeting">Hola, {usuario.nombre}</li>
              <li>
                <button onClick={handleLogout} className="btn-logout-link">
                  Cerrar Sesión
                </button>
              </li>
            </>
          ) : (
            // Si no hay usuario, mostramos los enlaces normales
            <>
              <li><Link to='/login'>Iniciar Sesión</Link></li>
              <li><Link to='/registro'>Registrarse</Link></li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Barra;