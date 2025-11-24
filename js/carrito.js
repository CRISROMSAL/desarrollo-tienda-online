/**
 * carrito.js
 * Gestiona el carrito de compras y el proceso de checkout
 */

const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
  // Verificar autenticación
  if (!verificarAutenticacion()) return;

  cargarCarrito();
  configurarBotones();
});

/**
 * Carga y renderiza el carrito
 */
function cargarCarrito() {
  const carrito = obtenerCarrito();
  renderizarCarrito(carrito);
  actualizarResumen();
}

/**
 * Renderiza los items del carrito
 */
function renderizarCarrito(carrito) {
  const container = document.getElementById('carrito-items');

  if (!container) return;

  if (carrito.length === 0) {
    mostrarCarritoVacio();
    return;
  }

  container.innerHTML = carrito.map((item, index) => `
    <div class="carrito-item" data-index="${index}">
      <div class="item-imagen">
        <img src="${item.imagen}" alt="${item.nombre}" onerror="this.src='images/placeholder.jpg'">
      </div>
      
      <div class="item-info">
        <h3 class="item-nombre">${item.nombre}</h3>
        <div class="item-detalles">
          ${item.talla ? `<span class="detalle">Talla: ${item.talla}</span>` : ''}
          ${item.color ? `<span class="detalle">Color: ${item.color}</span>` : ''}
        </div>
        <span class="item-precio">${item.precio.toFixed(2)}€</span>
      </div>

      <div class="item-cantidad">
        <button class="btn-cantidad-cart" onclick="cambiarCantidad(${index}, -1)">-</button>
        <input type="number" value="${item.cantidad}" min="1" readonly class="cantidad-display">
        <button class="btn-cantidad-cart" onclick="cambiarCantidad(${index}, 1)">+</button>
      </div>

      <div class="item-subtotal">
        <span class="subtotal-precio">${(item.precio * item.cantidad).toFixed(2)}€</span>
      </div>

      <div class="item-acciones">
        <button class="btn-eliminar" onclick="eliminarItem(${index})" title="Eliminar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      </div>
    </div>
  `).join('');
}

/**
 * Muestra mensaje de carrito vacío
 */
function mostrarCarritoVacio() {
  const container = document.getElementById('carrito-items');
  const resumen = document.getElementById('carrito-resumen');

  if (container) {
    container.innerHTML = `
      <div class="carrito-vacio">
        <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        <h2>Tu carrito está vacío</h2>
        <p>¡Descubre nuestros productos y añade tus favoritos!</p>
        <button class="btn btn-primary btn-lg" onclick="window.location.href='dashboard.html'">
          Ir a la tienda
        </button>
      </div>
    `;
  }

  if (resumen) {
    resumen.style.display = 'none';
  }
}

/**
 * Actualiza el resumen del pedido
 */
function actualizarResumen() {
  const carrito = obtenerCarrito();
  
  if (carrito.length === 0) {
    return;
  }

  const subtotal = calcularTotalCarrito();
  const envio = subtotal >= 50 ? 0 : 5.99;
  const total = subtotal + envio;

  const resumenContainer = document.getElementById('carrito-resumen');
  
  if (!resumenContainer) return;

  resumenContainer.style.display = 'block';
  resumenContainer.innerHTML = `
    <h2>Resumen del pedido</h2>
    
    <div class="resumen-linea">
      <span>Subtotal (${contarItemsCarrito()} artículos)</span>
      <span>${subtotal.toFixed(2)}€</span>
    </div>

    <div class="resumen-linea">
      <span>Envío</span>
      <span>${envio === 0 ? 'GRATIS' : envio.toFixed(2) + '€'}</span>
    </div>

    ${subtotal < 50 ? `
      <div class="resumen-nota">
        <small>¡Solo ${(50 - subtotal).toFixed(2)}€ más para envío gratis!</small>
      </div>
    ` : ''}

    <div class="resumen-total">
      <span>Total</span>
      <span class="total-precio">${total.toFixed(2)}€</span>
    </div>

    <button class="btn btn-primary btn-lg btn-block" id="btn-finalizar">
      Finalizar compra
    </button>

    <button class="btn btn-secondary btn-block" onclick="window.location.href='dashboard.html'">
      Seguir comprando
    </button>

    <div class="metodos-pago">
      <small>Métodos de pago seguros</small>
      <div class="payment-icons">
        <span>💳</span>
        <span>🔒</span>
      </div>
    </div>
  `;

  // Configurar botón de finalizar compra
  const btnFinalizar = document.getElementById('btn-finalizar');
  if (btnFinalizar) {
    btnFinalizar.addEventListener('click', finalizarCompra);
  }
}

/**
 * Cambia la cantidad de un producto
 */
function cambiarCantidad(index, cambio) {
  const carrito = obtenerCarrito();
  const nuevaCantidad = carrito[index].cantidad + cambio;

  if (nuevaCantidad < 1) {
    if (confirm('¿Deseas eliminar este producto del carrito?')) {
      eliminarItem(index);
    }
    return;
  }

  // Verificar stock disponible
  const producto = obtenerProductoPorId(carrito[index].id);
  if (producto && nuevaCantidad > producto.stock) {
    mostrarNotificacion(`Solo quedan ${producto.stock} unidades disponibles`, 'warning');
    return;
  }

  actualizarCantidadCarrito(index, nuevaCantidad);
  cargarCarrito();
}

/**
 * Elimina un item del carrito
 */
function eliminarItem(index) {
  if (confirm('¿Estás segura de que deseas eliminar este producto?')) {
    eliminarDelCarrito(index);
    cargarCarrito();
    mostrarNotificacion('Producto eliminado del carrito', 'info');
  }
}

/**
 * Finaliza la compra
 */
async function finalizarCompra() {
  const carrito = obtenerCarrito();

  if (carrito.length === 0) {
    mostrarNotificacion('El carrito está vacío', 'warning');
    return;
  }

  // Mostrar loading
  const btnFinalizar = document.getElementById('btn-finalizar');
  const textoOriginal = btnFinalizar.textContent;
  btnFinalizar.disabled = true;
  btnFinalizar.textContent = 'Procesando...';

  try {
    // Preparar datos del carrito para validación
    const productosCarrito = carrito.map(item => ({
      id: item.id,
      precio: item.precio,
      cantidad: item.cantidad
    }));

    // Enviar al servidor para validación
    const token = obtenerToken();
    const response = await fetch(`${API_URL}/carrito/validar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        productos: productosCarrito
      })
    });

    const data = await response.json();

    if (data.error) {
      mostrarNotificacion(data.mensaje || 'Error al procesar el pedido', 'error');
      btnFinalizar.disabled = false;
      btnFinalizar.textContent = textoOriginal;
      
      // Mostrar errores específicos
      if (data.errores && data.errores.length > 0) {
        const erroresHTML = data.errores.map(err => `<li>${err}</li>`).join('');
        mostrarModal('Error en el pedido', `<ul class="error-list">${erroresHTML}</ul>`);
      }
      return;
    }

    // Pedido exitoso
    console.log('✅ Pedido procesado:', data.pedido);

    // Limpiar carrito
    vaciarCarrito();

    // Mostrar confirmación
    mostrarModalExito(data.pedido);

  } catch (error) {
    console.error('❌ Error al finalizar compra:', error);
    mostrarNotificacion('Error de conexión con el servidor', 'error');
    btnFinalizar.disabled = false;
    btnFinalizar.textContent = textoOriginal;
  }
}

/**
 * Muestra modal de éxito
 */
function mostrarModalExito(pedido) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content modal-success">
      <div class="modal-icon">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#4caf50" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      </div>
      <h2>¡Pedido realizado con éxito!</h2>
      <p>Tu pedido <strong>${pedido.id}</strong> ha sido procesado correctamente</p>
      <div class="pedido-resumen">
        <p><strong>Total:</strong> ${pedido.total}€</p>
        <p><strong>Productos:</strong> ${pedido.productos.length} artículos</p>
      </div>
      <div class="modal-actions">
        <button class="btn btn-primary btn-lg" onclick="window.location.href='dashboard.html'">
          Volver a la tienda
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('show'), 10);
}

/**
 * Muestra modal genérico
 */
function mostrarModal(titulo, contenido) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <h2>${titulo}</h2>
      <div class="modal-body">${contenido}</div>
      <div class="modal-actions">
        <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">
          Cerrar
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('show'), 10);
}

/**
 * Mostrar notificación
 */
function mostrarNotificacion(mensaje, tipo = 'info') {
  const notificacion = document.createElement('div');
  notificacion.className = `notificacion notificacion-${tipo}`;
  notificacion.textContent = mensaje;
  
  document.body.appendChild(notificacion);
  setTimeout(() => notificacion.classList.add('show'), 10);
  
  setTimeout(() => {
    notificacion.classList.remove('show');
    setTimeout(() => notificacion.remove(), 300);
  }, 3000);
}

/**
 * Configurar botones
 */
function configurarBotones() {
  // Botón de cerrar sesión
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('¿Estás segura de que deseas cerrar sesión?')) {
        cerrarSesion();
      }
    });
  }

  // Botón vaciar carrito
  const vaciarBtn = document.getElementById('vaciar-carrito-btn');
  if (vaciarBtn) {
    vaciarBtn.addEventListener('click', () => {
      if (confirm('¿Estás segura de que deseas vaciar el carrito?')) {
        vaciarCarrito();
        cargarCarrito();
        mostrarNotificacion('Carrito vaciado', 'info');
      }
    });
  }
}