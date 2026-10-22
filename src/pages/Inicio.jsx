import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Tarjeta from '../components/Tarjeta';
import { toast } from 'sonner';

const Inicio = () => {
  const [productos, setProductos] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [mostrarModalAuth, setMostrarModalAuth] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const respuesta = await fetch(`http://localhost:8000/api/productos?page=${currentPage}`);
        if (respuesta.ok) {
          const data = await respuesta.json();
          setProductos((data.productos || []).map((producto) => ({
            ...producto,
            _id: producto.id_producto,
            imagen: producto.imagen_url
          })));
          setTotalPages(data.totalPages);
        } else {
          console.error("Error al cargar los productos de la base de datos");
        }
      } catch (error) {
        console.error("No se pudo conectar con el servidor", error);
      }
    };
    cargarProductos();
  }, [currentPage]);

  const agregarAlCarrito = (producto, tienda, precio) => {
    const token = localStorage.getItem('token');
    const usuarioActivo = JSON.parse(localStorage.getItem('usuarioActivo'));

    // 1. Validar PRIMERO si es administrador para bloquearle la acción
    if (usuarioActivo && (usuarioActivo.tipoUsuario === 'admin' || usuarioActivo.tipoUsuario === 'administrador')) {
      toast.error("Acción no permitida para administradores");
      return;
    }

    // 2. Si no es admin, verificamos que realmente tenga un token válido (cliente logueado)
    if (!token || !usuarioActivo) {
      setMostrarModalAuth(true);
      return;
    }

    // 3. Si pasa ambas validaciones, es un cliente válido y procedemos
    let carritoActual = JSON.parse(localStorage.getItem('carrito')) || [];
    const indiceExistente = carritoActual.findIndex(
      (item) => item.idProducto === producto._id && item.tiendaElegida === tienda
    );

    if (indiceExistente !== -1) {
      carritoActual[indiceExistente].cantidad += 1;
    } else {
      carritoActual.push({
        idProducto: producto._id,
        nombre: producto.nombre,
        imagen: producto.imagen,
        tiendaElegida: tienda,
        precioElegido: Number(precio),
        cantidad: 1
      });
    }

    localStorage.setItem('carrito', JSON.stringify(carritoActual));
    toast.success(`Añadiste: ${producto.nombre} (Vendido por ${tienda})`);
  };

  const obtenerNumerosPaginacion = () => {
    let paginas = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i <= 5 || i === totalPages || i % 5 === 0 || i === currentPage) {
        paginas.push(i);
      }
    }
    paginas = [...new Set(paginas)].sort((a, b) => a - b);
    const paginasConSaltos = [];
    for (let i = 0; i < paginas.length; i++) {
      paginasConSaltos.push(paginas[i]);
      if (paginas[i + 1] && paginas[i + 1] - paginas[i] > 1) {
        paginasConSaltos.push('...');
      }
    }
    return paginasConSaltos;
  };

  return (
    <div className="inicio-container">
      <h2>Catálogo de Productos</h2>
      
      <div className="grid-productos">
        {productos.length > 0 ? (
          productos.map((prod) => (
            <Tarjeta 
              key={prod._id} 
              producto={prod} 
              agregarAlCarrito={agregarAlCarrito} 
            />
          ))
        ) : (
          <p>Cargando productos o no hay productos disponibles...</p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="paginacion-container">
          <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="btn-pagina">&lt;</button>
          
          {obtenerNumerosPaginacion().map((pag, index) => (
            <button 
              key={index}
              onClick={() => pag !== '...' && setCurrentPage(pag)}
              disabled={pag === '...'}
              className={`btn-pagina ${pag === currentPage ? 'active' : ''}`}
            >
              {pag}
            </button>
          ))}
          
          <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="btn-pagina">&gt;</button>
        </div>
      )}

      {/* --- MINI VENTANA (MODAL) DE AUTENTICACIÓN --- */}
      {mostrarModalAuth && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>¡Atención!</h3>
            <p>Debes iniciar sesión para poder agregar productos a tu carrito y realizar compras.</p>
            
            <div className="modal-buttons">
              <button onClick={() => navigate('/login')} className="btn-modal btn-modal-login">
                INICIAR SESIÓN
              </button>
              <button onClick={() => navigate('/registro')} className="btn-modal btn-modal-registro">
                REGISTRARSE
              </button>
              <button onClick={() => setMostrarModalAuth(false)} className="btn-modal btn-modal-cancelar">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inicio;