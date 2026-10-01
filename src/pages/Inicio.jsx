import React, { useState, useEffect } from 'react';
import Tarjeta from '../components/Tarjeta'; // Asegúrate de que la ruta sea correcta

const Inicio = () => {
  // 1. Estado para almacenar los productos que vienen de MongoDB
  const [productos, setProductos] = useState([]);

  // 2. Traer los productos reales de la base de datos al cargar la página
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const respuesta = await fetch('http://localhost:8000/api/productos');
        if (respuesta.ok) {
          const data = await respuesta.json();
          setProductos(data);
        } else {
          console.error("Error al cargar los productos de la base de datos");
        }
      } catch (error) {
        console.error("No se pudo conectar con el servidor", error);
      }
    };

    cargarProductos();
  }, []);

  // 3. Función inteligente para agregar al carrito
  const agregarAlCarrito = (producto, tienda, precio) => {
    // A. Leemos el carrito actual (si no hay nada, creamos un arreglo vacío)
    let carritoActual = JSON.parse(localStorage.getItem('carrito')) || [];

    // B. Verificamos si ESTE producto de ESTA tienda exacta ya está en el carrito
    const indiceExistente = carritoActual.findIndex(
      (item) => item.idProducto === producto._id && item.tiendaElegida === tienda
    );

    if (indiceExistente !== -1) {
      // Si ya existe (ej: ya tenía un Teclado de Amazon), solo le sumamos 1 a la cantidad
      carritoActual[indiceExistente].cantidad += 1;
    } else {
      // Si no existe, creamos el "paquete" con los datos que nos interesan
      const nuevoItem = {
        idProducto: producto._id,
        nombre: producto.nombre,
        imagen: producto.imagen,
        tiendaElegida: tienda,
        precioElegido: Number(precio),
        cantidad: 1
      };
      // Lo empujamos a la lista del carrito
      carritoActual.push(nuevoItem);
    }

    // C. Guardamos la nueva lista en la memoria del navegador
    localStorage.setItem('carrito', JSON.stringify(carritoActual));
    
    // Un mensajito para que el usuario sepa que funcionó
    alert(`Añadiste: ${producto.nombre} (Vendido por ${tienda})`);
  };

  return (
    <div className="inicio-container" style={{ padding: '20px' }}>
      <h2>Catálogo de Productos</h2>
      
      <div className="grid-productos">
        {/* Si hay productos, los mostramos. Si no, mostramos un mensaje de espera */}
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
    </div>
  );
};

export default Inicio;