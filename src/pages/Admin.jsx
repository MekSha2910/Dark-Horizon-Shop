import React, { useState, useEffect } from 'react';

const Admin = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    imagen: ''
  });

  const [opciones, setOpciones] = useState([]); // Para las tiendas externas

  const [listaProductos, setListaProductos] = useState([]);

  // 1. Función para cargar la lista de productos
  const cargarProductos = async () => {
    const res = await fetch('http://localhost:8000/api/productos');
    const data = await res.json();
    setListaProductos(data);
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  // 2. Función para eliminar producto
  const eliminarProducto = async (id) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este producto?")) {
      try {
        const res = await fetch(`http://localhost:8000/api/productos/${id}`, {
          method: 'DELETE',
        });

        if (res.ok) {
          alert("Producto eliminado");
          cargarProductos(); // Recargamos la lista para que desaparezca el que borramos
        }
      } catch (error) {
        alert("Error al eliminar");
      }
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Función para añadir una nueva fila de tienda externa
  const agregarTienda = () => {
    setOpciones([...opciones, { tienda: '', precio: '' }]);
  };

  const handleOpcionChange = (index, e) => {
    const nuevasOpciones = [...opciones];
    nuevasOpciones[index][e.target.name] = e.target.value;
    setOpciones(nuevasOpciones);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const productoCompleto = { ...formData, opcionesCompra: opciones };

    try {
      const resp = await fetch('http://localhost:8000/api/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productoCompleto)
      });

      if (resp.ok) {
        alert("Producto subido correctamente");
        // Limpiar formulario
        setFormData({ nombre: '', descripcion: '', imagen: ''});
        setOpciones([]);
      }
    } catch (error) {
      alert("Error al conectar con el servidor");
    }
  };

  return (
    <div className="admin-container">
      <h2>Panel de Inventario - DHS</h2>
      <form onSubmit={handleSubmit} className="admin-form">
        <input name="nombre" placeholder="Nombre del Producto" onChange={handleChange} required />
        <textarea name="descripcion" placeholder="Descripción" onChange={handleChange} required />
        <input name="imagen" placeholder="URL de la imagen" onChange={handleChange} required />

        <div className="tiendas-externas">
          <h3>Comparativa de precios (Opcional)</h3>
          {opciones.map((op, index) => (
            <div key={index} className="tienda-row">
              <input name="tienda" placeholder="Tienda (Ej: Amazon)" onChange={(e) => handleOpcionChange(index, e)} />
              <input name="precio" type="number" placeholder="Precio" onChange={(e) => handleOpcionChange(index, e)} />
            </div>
          ))}
          <button type="button" onClick={agregarTienda}>+ Añadir Tienda Externa</button>
        </div>

        <button type="submit" className="btn-save">Publicar Producto en la Tienda</button>
      </form>

    <hr />

      {/*SECCIÓN: GESTIÓN DE PRODUCTOS*/}
      <div className="gestion-productos">
        <h3>Productos en Inventario</h3>
        <div className="lista-admin">
          {listaProductos.map((prod) => (
            <div key={prod._id} className="item-admin">
              <span>{prod.nombre}</span>
              <button 
                onClick={() => eliminarProducto(prod._id)} 
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