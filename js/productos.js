/**
 * productos.js
 * Muestra el detalle de un producto específico
 */

let productoActual = null;

document.addEventListener('DOMContentLoaded', () => {
  // Verificar autenticación
  if (!verificarAutenticacion()) return;

  cargarProducto();
  configurarBotones();
});

/**
 * Carga el detalle del producto
 */
function cargarProducto() {
  const urlParams = new URLSearchParams(window.location.search);
  const productoId = urlParams.get('id');

  if (!productoId) {
    mostrarError('Producto no especificado');
    return;
  }

  // Obtener producto desde localStorage
  const producto = obtenerProductoPorId(productoId);

  if (!producto) {
    mostrarError('Producto no encontrado');
    return;
  }

  productoActual = producto;

  // Agregar a productos vistos
  agregarProductoVisto(producto);

  // Renderizar producto
  renderizarProducto(producto);

  // Cargar productos relacionados
  cargarProductosRelacionados(producto.id_categoria, producto.id);
}

/**
 * Renderiza el detalle del producto
 */
function renderizarProducto(producto) {
  const container = document.getElementById('producto-detalle');

  if (!container) return;

  const stockStatus = producto.stock === 0 ? 'agotado' : 
                      producto.stock < 5 ? 'bajo' : 'disponible';

  const stockText = producto.stock === 0 ? 'Agotado' :
                    producto.stock < 5 ? `Solo quedan ${producto.stock} unidades` :
                    `${producto.stock} unidades disponibles`;

  container.innerHTML = `
    <div class="producto-detalle-container">
      <div class="producto-imagen-principal">
        <img src="${producto.imagen}" alt="${producto.nombre}" onerror="this.src='images/placeholder.jpg'">
        ${producto.destacado ? '<span class="badge-destacado-large">Destacado</span>' : ''}
      </div>

      <div class="producto-info-principal">
        <h1 class="producto-titulo">${producto.nombre}</h1>
        
        <div class="producto-precio-container">
          <span class="precio-principal">${producto.precio.toFixed(2)}€</span>
          <span class="stock-badge ${stockStatus}">${stockText}</span>
        </div>

        <div class="producto-descripcion">
          <h3>Descripción</h3>
          <p>${producto.descripcion}</p>
        </div>

        ${producto.tallas && producto.tallas.length > 0 ? `
          <div class="producto-opciones">
            <label>Talla:</label>
            <div class="opciones-grid" id="tallas-opciones">
              ${producto.tallas.map(talla => `
                <button class="opcion-btn" data-value="${talla}">${talla}</button>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${producto.colores && producto.colores.length > 0 ? `
          <div class="producto-opciones">
            <label>Color:</label>
            <div class="opciones-grid" id="colores-opciones">
              ${producto.colores.map(color => `
                <button class="opcion-btn" data-value="${color}">${color}</button>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <div class="cantidad-selector">
          <label>Cantidad:</label>
          <div class="cantidad-controls">
            <button class="btn-cantidad" id="btn-disminuir">-</button>
            <input type="number" id="cantidad-input" value="1" min="1" max="${producto.stock}" readonly>
            <button class="btn-cantidad" id="btn-aumentar">+</button>
          </div>
        </div>

        <div class="producto-acciones">
          <button class="btn btn-primary btn-lg" id="btn-agregar-carrito" ${producto.stock === 0 ? 'disabled' : ''}>
            ${producto.stock === 0 ? 'Producto agotado' : 'Añadir al carrito'}
          </button>
          <button class="btn btn-secondary btn-lg" onclick="volverACategorias()">
            Seguir comprando
          </button>
        </div>
      </div>
    </div>
  `;

  // Configurar selectores de opciones
  configurarSelectoresOpciones();
  
  // Configurar cantidad
  configurarControlCantidad(producto.stock);

  // Configurar botón agregar al carrito
  configurarBotonAgregarCarrito(producto);
}

/**
 * Configura los selectores de talla y color
 */
function configurarSelectoresOpciones() {
  // Tallas
  const tallasOpciones = document.querySelectorAll('#tallas-opciones .opcion-btn');
  tallasOpciones.forEach(btn => {
    btn.addEventListener('click', function() {
      tallasOpciones.forEach(b => b.classList.remove('selected'));
      this.classList.add('selected');
    });
  });

  // Colores
  const coloresOpciones = document.querySelectorAll('#colores-opciones .opcion-btn');
  coloresOpciones.forEach(btn => {
    btn.addEventListener('click', function() {
      coloresOpciones.forEach(b => b.classList.remove('selected'));
      this.classList.add('selected');
    });
  });
}

/**
 * Configura el control de cantidad
 */
function configurarControlCantidad(stockMaximo) {
  const cantidadInput = document.getElementById('cantidad-input');
  const btnDisminuir = document.getElementById('btn-disminuir');
  const btnAumentar = document.getElementById('btn-aumentar');

  if (!cantidadInput || !btnDisminuir || !btnAumentar) return;

  btnDisminuir.addEventListener('click', () => {
    let cantidad = parseInt(cantidadInput.value);
    if (cantidad > 1) {
      cantidadInput.value = cantidad - 1;
    }
  });

  btnAumentar.addEventListener('click', () => {
    let cantidad = parseInt(cantidadInput.value);
    if (cantidad < stockMaximo) {
      cantidadInput.value = cantidad + 1;
    }
  });
}

/**
 * Configura el botón de agregar al carrito
 */
function configurarBotonAgregarCarrito(producto) {
  const btnAgregar = document.getElementById('btn-agregar-carrito');

  if (!btnAgregar || producto.stock === 0) return;

  btnAgregar.addEventListener('click', () => {
    const cantidad = parseInt(document.getElementById('cantidad-input').value);
    
    // Obtener talla seleccionada
    const tallaSeleccionada = document.querySelector('#tallas-opciones .opcion-btn.selected');
    const talla = tallaSeleccionada ? tallaSeleccionada.dataset.value : null;

    // Obtener color seleccionado
    const colorSeleccionado = document.querySelector('#colores-opciones .opcion-btn.selected');
    const color = colorSeleccionado ? colorSeleccionado.dataset.value : null;

    // Validar que se haya seleccionado talla (si aplica)
    if (producto.tallas && producto.tallas.length > 0 && !talla) {
      mostrarNotificacion('Por favor, selecciona una talla', 'warning');
      return;
    }

    // Validar que se haya seleccionado color (si aplica)
    if (producto.colores && producto.colores.length > 0 && !color) {
      mostrarNotificacion('Por favor, selecciona un color', 'warning');
      return;
    }

    // Agregar al carrito
    agregarAlCarrito(producto, cantidad, talla, color);
    
    // Mostrar notificación
    mostrarNotificacion('¡Producto añadido al carrito!', 'success');

    // Animar botón
    btnAgregar.classList.add('btn-success');
    btnAgregar.textContent = '✓ Añadido';
    
    setTimeout(() => {
      btnAgregar.classList.remove('btn-success');
      btnAgregar.textContent = 'Añadir al carrito';
    }, 2000);
  });
}

/**
 * Carga productos relacionados de la misma categoría
 */
function cargarProductosRelacionados(categoriaId, productoActualId) {
  const container = document.getElementById('productos-relacionados');

  if (!container) return;

  const relacionados = obtenerProductosPorCategoria(categoriaId)
    .filter(p => p.id !== productoActualId)
    .slice(0, 4);

  if (relacionados.length === 0) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';
  const grid = container.querySelector('.productos-relacionados-grid');

  if (!grid) return;

  grid.innerHTML = relacionados.map(producto => `
    <div class="product-card-small" onclick="verProducto(${producto.id})">
      <div class="product-image-small">
        <img src="${producto.imagen}" alt="${producto.nombre}" onerror="this.src='images/placeholder.jpg'">
      </div>
      <div class="product-info-small">
        <h4>${producto.nombre}</h4>
        <span class="price">${producto.precio.toFixed(2)}€</span>
      </div>
    </div>
  `).join('');
}

/**
 * Ver otro producto
 */
function verProducto(id) {
  window.location.href = `productos.html?id=${id}`;
}

/**
 * Volver a categorías
 */
function volverACategorias() {
  if (productoActual) {
    window.location.href = `categorias.html?id=${productoActual.id_categoria}`;
  } else {
    window.location.href = 'categorias.html';
  }
}

/**
 * Mostrar notificación
 */
function mostrarNotificacion(mensaje, tipo = 'info') {
  // Crear elemento de notificación
  const notificacion = document.createElement('div');
  notificacion.className = `notificacion notificacion-${tipo}`;
  notificacion.textContent = mensaje;
  
  document.body.appendChild(notificacion);
  
  // Mostrar con animación
  setTimeout(() => notificacion.classList.add('show'), 10);
  
  // Ocultar después de 3 segundos
  setTimeout(() => {
    notificacion.classList.remove('show');
    setTimeout(() => notificacion.remove(), 300);
  }, 3000);
}

/**
 * Mostrar error
 */
function mostrarError(mensaje) {
  const container = document.getElementById('producto-detalle');
  if (container) {
    container.innerHTML = `
      <div class="error-state">
        <h2>Error</h2>
        <p>${mensaje}</p>
        <button class="btn btn-primary" onclick="window.location.href='dashboard.html'">
          Volver al inicio
        </button>
      </div>
    `;
  }
}

/**
 * Configurar botones
 */
function configurarBotones() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('¿Estás segura de que deseas cerrar sesión?')) {
        cerrarSesion();
      }
    });
  }
}