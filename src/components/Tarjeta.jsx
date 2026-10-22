const Tarjeta = ({ producto, agregarAlCarrito }) => {
  return (
    <div className="tarjeta">
      <img src={producto.imagen} alt={producto.nombre} />
      <h3>{producto.nombre}</h3>
      
      <div className="opciones-precios">
        <p>Selecciona dónde comprar:</p>
        {/* Opciones de otras tiendas que cargó el Admin */}
        {producto.opcionesCompra.map((opcion, index) => (
          <button key={index} onClick={() => agregarAlCarrito(producto, opcion.tienda, opcion.precio)}>
            {opcion.tienda}: ${opcion.precio}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Tarjeta;