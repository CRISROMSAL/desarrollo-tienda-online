const express = require('express');
const router = express.Router();
const { middlewareAuth, tienda } = require('./server');

/**
 * POST /api/carrito
 * Valida los precios del carrito antes de procesar el pedido
 * REQUIERE AUTENTICACIÓN
 */
router.post('/carrito', middlewareAuth, (req, res) => {
  const { productos: productosCarrito } = req.body;

  console.log('🛒 Validando carrito del usuario:', req.usuario.username);

  // Validar formato del carrito
  if (!productosCarrito || !Array.isArray(productosCarrito)) {
    return res.status(400).json({
      error: true,
      mensaje: 'Formato de carrito inválido'
    });
  }

  if (productosCarrito.length === 0) {
    return res.status(400).json({
      error: true,
      mensaje: 'El carrito está vacío'
    });
  }

  // Validar cada producto del carrito
  let precioTotalReal = 0;
  const errores = [];
  const productosValidados = [];

  for (const item of productosCarrito) {
    // Buscar el producto original en la tienda
    const productoReal = tienda.productos.find(p => p.id === item.id);

    if (!productoReal) {
      errores.push(`Producto con ID ${item.id} no existe`);
      continue;
    }

    // Verificar que el precio no haya sido manipulado
    if (productoReal.precio !== item.precio) {
      errores.push(
        `⚠️ Precio manipulado en "${productoReal.nombre}". ` +
        `Real: ${productoReal.precio}€, Recibido: ${item.precio}€`
      );
      continue;
    }

    // Verificar stock disponible
    if (item.cantidad > productoReal.stock) {
      errores.push(
        `Stock insuficiente para "${productoReal.nombre}". ` +
        `Disponible: ${productoReal.stock}, Solicitado: ${item.cantidad}`
      );
      continue;
    }

    // Calcular subtotal
    const subtotal = productoReal.precio * item.cantidad;
    precioTotalReal += subtotal;

    productosValidados.push({
      id: productoReal.id,
      nombre: productoReal.nombre,
      precio: productoReal.precio,
      cantidad: item.cantidad,
      subtotal: subtotal
    });
  }

  // Si hay errores de validación
  if (errores.length > 0) {
    console.log('❌ Validación del carrito fallida');
    errores.forEach(err => console.log('   -', err));
    
    return res.status(400).json({
      error: true,
      mensaje: 'Error en la validación del carrito',
      errores: errores
    });
  }

  // Todo correcto - Generar pedido
  const pedido = {
    id: `PED-${Date.now()}`,
    fecha: new Date().toISOString(),
    usuario: req.usuario.username,
    productos: productosValidados,
    total: precioTotalReal
  };

  console.log('✅ Carrito validado correctamente');
  console.log(`   Total: ${precioTotalReal.toFixed(2)}€`);
  console.log(`   Productos: ${productosValidados.length}`);

  res.json({
    error: false,
    mensaje: '¡Pedido procesado correctamente!',
    pedido: pedido
  });
});

module.exports = router;