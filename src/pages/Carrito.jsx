import React, { useState, useEffect } from 'react';

const Carrito = () => {
  const [carrito, setCarrito] = useState([]);

  // 1. Cargar los datos del carrito al abrir la página
  useEffect(() => {
    const carritoGuardado = JSON.parse(localStorage.getItem('carrito')) || [];
    setCarrito(carritoGuardado);
  }, []);

  // 2. Función para eliminar un producto específico del carrito
  const eliminarDelCarrito = (idProducto, tiendaElegida) => {
    // Filtramos para dejar todos los productos MENOS el que queremos borrar
    const nuevoCarrito = carrito.filter(
      (item) => !(item.idProducto === idProducto && item.tiendaElegida === tiendaElegida)
    );
    
    // Actualizamos el estado y la memoria
    setCarrito(nuevoCarrito);
    localStorage.setItem('carrito', JSON.stringify(nuevoCarrito));
  };

  // 3. Función para calcular el total a pagar
  const calcularTotal = () => {
    return carrito.reduce((total, item) => total + (item.precioElegido * item.cantidad), 0);
  };

  // 4. Función para simular la compra
  const finalizarCompra = () => {
    if (carrito.length === 0) {
      alert("El carrito está vacío");
      return;
    }
    alert(`¡Gracias por tu compra en DHS! Total pagado: $${calcularTotal()}`);
    // Vaciamos el carrito después de comprar
    setCarrito([]);
    localStorage.removeItem('carrito');
  };

  return (
    <div className="carrito-container" style={{ padding: '20px' }}>
      <h2>Mi Carrito de Compras</h2>

      {carrito.length === 0 ? (
        <p>Tu carrito está vacío. ¡Ve al inicio y añade algunos productos!</p>
      ) : (
        <div className="carrito-contenido">
          {/* Lista de productos */}
          <div className="carrito-lista">
            {carrito.map((item, index) => (
              <div key={index} className="carrito-item">
                <div>
                  <h4>{item.nombre}</h4>
                  <p><strong>Vendido por:</strong> {item.tiendaElegida}</p>
                  <p><strong>Precio unitario:</strong> ${item.precioElegido}</p>
                  <p><strong>Cantidad:</strong> {item.cantidad}</p>
                </div>
                <div className="carrito-item-actions">
                  <p><strong>Subtotal:</strong> ${item.precioElegido * item.cantidad}</p>
                  <button 
                    onClick={() => eliminarDelCarrito(item.idProducto, item.tiendaElegida)}
                    className="btn-eliminar"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Resumen de la compra */}
          <div className="carrito-resumen">
            <h3>Total a pagar: ${calcularTotal()}</h3>
            <button 
              onClick={finalizarCompra}
              className="btn-primary"
            >
              Proceder al Pago
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Carrito;