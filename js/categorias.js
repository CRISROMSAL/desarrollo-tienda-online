/**
 * categorias.js
 * Muestra los productos de una categoría específica
 */

document.addEventListener('DOMContentLoaded', () => {
  // Verificar autenticación
  if (!verificarAutenticacion()) return;

  cargarCategoria();
  configurarBotones();
});

/**
 * Carga los datos de la categoría y sus productos
 */
function cargarCategoria() {
  const urlParams = new URLSearchParams(window.location.search);
  const categoriaId = urlParams.get('id');

  if (!categoriaId) {
    // Si no hay ID, mostrar todas las categorías
    mostrarTodasLasCategorias();
    return;
  }

  // Obtener datos desde localStorage
  const categorias = obtenerCategorias();
  const categoria = categorias.find(c => c.id === parseInt(categoriaId));

  if (!categoria) {
    mostrarError('Categoría no encontrada');
    return;
  }

  // Obtener productos de esta categoría
  const productos = obtenerProductosPorCategoria(categoriaId);

  // Mostrar información de la categoría
  mostrarInfoCategoria(categoria, productos.length);

  // Renderizar productos
  renderizarProductos(productos);
}

/**
 * Muestra todas las categorías disponibles
 */
function mostrarTodasLasCategorias() {
  const container = document.getElementById('productos-container');
  const categoriaInfo = document.getElementById('categoria-info');
  
  // Ocultar info de categoría
  if (categoriaInfo) {
    categoriaInfo.style.display = 'none';
  }

  // Cambiar título
  const pageTitle = document.querySelector('.page-title');
  if (pageTitle) {
    pageTitle.textContent = 'Todas las Categorías';
  }

  const categorias = obtenerCategorias();

  container.innerHTML = `
    <div class="categorias-grid">
      ${categorias.map(categoria => {
        const productosCount = obtenerProductosPorCategoria(categoria.id).length;
        return `
          <div class="category-card-large" onclick="verCategoria(${categoria.id})">
            <div class="category-image-large">
              <img src="${categoria.imagen}" alt="${categoria.nombre}" onerror="this.src='images/placeholder.jpg'">
            </div>
            <div class="category-content">
              <h2>${categoria.nombre}</h2>
              <p>${categoria.descripcion}</p>
              <div class="category-footer">
                <span class="product-count">${productosCount} productos</span>
                <button class="btn btn-primary">Ver productos</button>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Muestra la información de la categoría
 */
function mostrarInfoCategoria(categoria, totalProductos) {
  const categoriaInfo = document.getElementById('categoria-info');
  const pageTitle = document.querySelector('.page-title');

  if (pageTitle) {
    pageTitle.textContent = categoria.nombre;
  }

  if (categoriaInfo) {
    categoriaInfo.innerHTML = `
      <div class="categoria-header">
        <div class="categoria-descripcion">
          <h2>${categoria.nombre}</h2>
          <p>${categoria.descripcion}</p>
          <span class="producto-count">${totalProductos} productos disponibles</span>
        </div>
      </div>
    `;
    categoriaInfo.style.display = 'block';
  }
}

/**
 * Renderiza los productos de la categoría
 */
function renderizarProductos(productos) {
  const container = document.getElementById('productos-container');

  if (!container) return;

  if (productos.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No hay productos disponibles en esta categoría</p>
        <button class="btn btn-primary" onclick="volverACategorias()">
          Ver todas las categorías
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="productos-grid">
      ${productos.map(producto => `
        <div class="product-card" data-id="${producto.id}">
          <div class="product-image">
            <img src="${producto.imagen}" alt="${producto.nombre}" onerror="this.src='images/placeholder.jpg'">
            ${producto.destacado ? '<span class="badge-destacado">Destacado</span>' : ''}
            ${producto.stock < 5 && producto.stock > 0 ? '<span class="badge-stock">¡Últimas unidades!</span>' : ''}
            ${producto.stock === 0 ? '<span class="badge-agotado">Agotado</span>' : ''}
          </div>
          <div class="product-info">
            <h3 class="product-name">${producto.nombre}</h3>
            <p class="product-description">${producto.descripcion}</p>
            <div class="product-details">
              <div class="product-meta">
                ${producto.tallas ? `<span class="meta-item">Tallas: ${producto.tallas.join(', ')}</span>` : ''}
                ${producto.colores ? `<span class="meta-item">Colores: ${producto.colores.join(', ')}</span>` : ''}
              </div>
            </div>
            <div class="product-footer">
              <span class="product-price">${producto.precio.toFixed(2)}€</span>
              <button class="btn btn-primary btn-sm" onclick="verDetalleProducto(${producto.id})" ${producto.stock === 0 ? 'disabled' : ''}>
                ${producto.stock === 0 ? 'Agotado' : 'Ver detalle'}
              </button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Ver detalle de un producto
 */
function verDetalleProducto(id) {
  window.location.href = `productos.html?id=${id}`;
}

/**
 * Ver productos de una categoría
 */
function verCategoria(id) {
  window.location.href = `categorias.html?id=${id}`;
}

/**
 * Volver a la página de categorías
 */
function volverACategorias() {
  window.location.href = 'categorias.html';
}

/**
 * Mostrar mensaje de error
 */
function mostrarError(mensaje) {
  const container = document.getElementById('productos-container');
  if (container) {
    container.innerHTML = `
      <div class="error-state">
        <p>${mensaje}</p>
        <button class="btn btn-primary" onclick="volverACategorias()">
          Ver todas las categorías
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