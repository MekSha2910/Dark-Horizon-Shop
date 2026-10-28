import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

const Carrito = () => {
  const [carrito, setCarrito] = useState([]);

  useEffect(() => {
    const carritoGuardado = JSON.parse(localStorage.getItem('carrito')) || [];
    setCarrito(carritoGuardado);
  }, []);

  const eliminarDelCarrito = (idProducto, tiendaElegida) => {
    const nuevoCarrito = carrito.filter(
      (item) => !(item.idProducto === idProducto && item.tiendaElegida === tiendaElegida)
    );
    setCarrito(nuevoCarrito);
    localStorage.setItem('carrito', JSON.stringify(nuevoCarrito));
  };

  // Cálculos financieros
  const subtotal = carrito.reduce((total, item) => total + (item.precioElegido * item.cantidad), 0);
  const comision = subtotal * 0.10;
  const total = subtotal + comision;

  const finalizarCompra = async () => {
    if (carrito.length === 0) return toast.error("El carrito está vacío");

    const token = localStorage.getItem('token');
    
    if (!token) {
        // Por ahora lanzamos alerta, luego lo cambiaremos por el Modal de Login
        return toast.error("Debes iniciar sesión para realizar una compra");
    }

    // Adaptamos los nombres de las variables a lo que espera MySQL en el backend
    const carritoAdaptado = carrito.map(item => ({
        id_producto: item.idProducto,
        precio: item.precioElegido,
        cantidad: item.cantidad
    }));

    try {
        const respuesta = await fetch('https://dark-horizon-shop.onrender.com/api/ventas/procesar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ carrito: carritoAdaptado })
        });

        const data = await respuesta.json();

        if (respuesta.ok) {
            toast.success(`¡Compra exitosa! Número de orden: ${data.idVenta}`);
            setCarrito([]);
            localStorage.removeItem('carrito');
        } else {
            toast.error(data.mensaje);
        }
    } catch (error) {
        toast.error("Error al procesar el pago con el servidor");
    }
  };

  return (
    <div className="carrito-container">
      <h2>Mi Carrito de Compras</h2>

      {carrito.length === 0 ? (
        <p>Tu carrito está vacío.</p>
      ) : (
        <div className="carrito-contenido">
          <div className="carrito-lista">
            {carrito.map((item, index) => (
              <div key={index} className="carrito-item">
                <h4>{item.nombre}</h4>
                <p><strong>Tienda:</strong> {item.tiendaElegida}</p>
                <p>Precio unitario: ${item.precioElegido} x {item.cantidad}</p>
                <p>Subtotal producto: ${item.precioElegido * item.cantidad}</p>
                <button onClick={() => eliminarDelCarrito(item.idProducto, item.tiendaElegida)} className="btn-eliminar">
                  Quitar
                </button>
              </div>
            ))}
          </div>

          <div className="carrito-resumen">
            <h3>Resumen de Pago</h3>
            <p>Subtotal: ${subtotal.toFixed(2)}</p>
            <p>Comisión de plataforma (10%): ${comision.toFixed(2)}</p>
            <h2>Total a pagar: ${total.toFixed(2)}</h2>
            <button onClick={finalizarCompra} className="btn-primary">
              Simular Pago
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Carrito;