import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

const Admin = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    imagen_url: ''
  });

  const [opciones, setOpciones] = useState([]);
  const [listaProductos, setListaProductos] = useState([]);
  const [tiendasHistorial, setTiendasHistorial] = useState([]);
  
  // 1. Estado para las estadísticas financieras
  const [estadisticas, setEstadisticas] = useState({
    ventasTotales: 0,
    gananciasPlataforma: 0,
    totalDineroMovido: 0,
    productosVendidos: 0
  });

  const cargarDatos = async () => {
    try {
      // Necesitamos el token porque la ruta de estadísticas está protegida para admins
      const token = localStorage.getItem('token');

      const [resProd, resTiendas, resStats] = await Promise.all([
        fetch('https://dark-horizon-shop.onrender.com/api/productos'),
        fetch('https://dark-horizon-shop.onrender.com/api/tiendas'),
        fetch('https://dark-horizon-shop.onrender.com/api/ventas/estadisticas', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!resProd.ok || !resTiendas.ok) {
        throw new Error('No se pudieron cargar los productos o las tiendas.');
      }

      const [dataProd, dataTiendas, dataStats] = await Promise.all([
        resProd.json(),
        resTiendas.json(),
        // Si resStats falló (ej. el token expiró), evitamos que rompa toda la página
        resStats.ok ? resStats.json() : Promise.resolve({}) 
      ]);

      setListaProductos(dataProd.productos || []);
      setTiendasHistorial(dataTiendas);
      
      if (resStats.ok) {
        setEstadisticas(dataStats);
      }
    } catch (error) {
      console.error('Error al cargar datos del inventario:', error);
      toast.error(error.message || 'Error al conectar con el servidor');
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const eliminarProducto = async (id) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este producto?")) {
      try {
        const res = await fetch(`https://dark-horizon-shop.onrender.com/api/productos/${id}`, {
          method: 'DELETE',
        });

        if (res.ok) {
          toast.success("Producto eliminado");
          cargarDatos();
        } else {
          const data = await res.json();
          toast.error(data.mensaje || "No se pudo eliminar el producto");
        }
      } catch (error) {
        console.error('Error al eliminar el producto:', error);
        toast.error("Error al conectar con el servidor");
      }
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const agregarTienda = () => {
    if (opciones.length < 3) {
      setOpciones([...opciones, { tienda: '', precio: '' }]);
    } else {
      toast.error("Máximo 3 tiendas permitidas por producto");
    }
  };

  const handleOpcionChange = (index, e) => {
    const nuevasOpciones = [...opciones];
    nuevasOpciones[index][e.target.name] = e.target.value;
    setOpciones(nuevasOpciones);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (opciones.length === 0) {
      return toast.error("Debes agregar al menos 1 precio/tienda");
    }

    const productoCompleto = { ...formData, opcionesCompra: opciones };

    try {
      const resp = await fetch('https://dark-horizon-shop.onrender.com/api/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productoCompleto)
      });

      if (resp.ok) {
        toast.success("Producto subido correctamente");
        setFormData({ nombre: '', descripcion: '', imagen_url: '' });
        setOpciones([]);
        e.target.reset();
        cargarDatos(); // Recargamos para actualizar las listas
      } else {
        const data = await resp.json();
        toast.error(data.mensaje || "No se pudo publicar el producto");
      }
    } catch (error) {
      console.error('Error al publicar el producto:', error);
      toast.error("Error al conectar con el servidor");
    }
  };

  return (
    <div className="admin-container">
      <h2>Panel de Control - DHS</h2>

      {/* --- 2. NUEVA SECCIÓN: ESTADÍSTICAS FINANCIERAS --- */}
      <div className="estadisticas-dashboard">
        <div className="stat-card">
          <h4>Ventas Realizadas</h4>
          <p>{estadisticas.ventasTotales}</p>
        </div>
        <div className="stat-card">
          <h4>Productos Vendidos</h4>
          <p>{estadisticas.productosVendidos}</p>
        </div>
        <div className="stat-card stat-ganancia">
          <h4>Rendimiento DHS (10%)</h4>
          <p>${Number(estadisticas.gananciasPlataforma).toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <h4>Total Dinero Movido</h4>
          <p>${Number(estadisticas.totalDineroMovido).toFixed(2)}</p>
        </div>
      </div>

      <hr />

      <h3>Publicar Nuevo Producto</h3>
      <form onSubmit={handleSubmit} className="admin-form">
        <input name="nombre" placeholder="Nombre del Producto" value={formData.nombre} onChange={handleChange} required />
        <textarea name="descripcion" placeholder="Descripción" value={formData.descripcion} onChange={handleChange} required />
        <input name="imagen_url" placeholder="URL de la imagen" value={formData.imagen_url} onChange={handleChange} required />

        <div className="tiendas-externas">
          <h3>Precios por Tienda (Máximo 3)</h3>
          <datalist id="lista-tiendas">
            {tiendasHistorial.map((tienda, index) => (
              <option key={index} value={tienda} />
            ))}
          </datalist>

          {opciones.map((op, index) => (
            <div key={index} className="tienda-row">
              <input
                name="tienda"
                list="lista-tiendas"
                placeholder="Tienda (Ej: Temu)"
                value={op.tienda}
                onChange={(e) => handleOpcionChange(index, e)}
                required
              />
              <input
                name="precio"
                type="number"
                min="0"
                step="0.01"
                placeholder="Precio"
                value={op.precio}
                onChange={(e) => handleOpcionChange(index, e)}
                required
              />
            </div>
          ))}

          {opciones.length < 3 && (
            <button type="button" onClick={agregarTienda} className="btn-secundario">
              + Añadir Tienda
            </button>
          )}
        </div>

        <button type="submit" className="btn-save">Publicar Producto en la Tienda</button>
      </form>

      <hr />

      <div className="gestion-productos">
        <h3>Productos en Inventario</h3>
        <div className="lista-admin">
          {listaProductos.map((prod) => (
            <div key={prod.id_producto} className="item-admin">
              <span>{prod.nombre}</span>
              <button 
                onClick={() => eliminarProducto(prod.id_producto)} 
                className="btn-eliminar"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Admin;