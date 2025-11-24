/**
 * dashboard.js
 * Muestra los productos destacados y categorías
 */

document.addEventListener('DOMContentLoaded', () => {
  // Verificar autenticación
  if (!verificarAutenticacion()) return;

  cargarDashboard();
  configurarBotones();
});

/**
 * Carga los datos del dashboard
 */
function cargarDashboard() {
  const usuario = obtenerUsuario();
  const productosDestacados = obtenerProductosDestacados();
  const categorias = obtenerCategorias();

  // Mostrar mensaje de bienvenida
  const welcomeMessage = document.getElementById('welcome-message');
  if (welcomeMessage) {
    welcomeMessage.textContent = `¡Bienvenida, ${usuario.nombre || usuario.usuario}!`;
  }

  // Renderizar productos destacados
  renderizarProductosDestacados(productosDestacados);

  // Renderizar categorías
  renderizarCategorias(categorias);

  // Renderizar productos vistos recientemente
  renderizarProductosVistos();
}

/**
 * Renderiza los productos destacados
 */
function renderizarProductosDestacados(productos) {
  const container = document.getElementById('productos-destacados');
  
  if (!container) return;

  if (productos.length === 0) {
    container.innerHTML = '<p class="empty-message">No hay productos destacados</p>';
    return;
  }

  container.innerHTML = productos.map(producto => `
    <div class="product-card" data-id="${producto.id}">
      <div class="product-image">
        <img src="${producto.imagen}" alt="${producto.nombre}" onerror="this.src='images/placeholder.jpg'">
        <span class="badge-destacado">Destacado</span>
      </div>
      <div class="product-info">
        <h3 class="product-name">${producto.nombre}</h3>
        <p class="product-description">${producto.descripcion}</p>
        <div class="product-footer">
          <span class="product-price">${producto.precio.toFixed(2)}€</span>
          <button class="btn btn-primary btn-sm" onclick="verDetalleProducto(${producto.id})">
            Ver detalle
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

/**
 * Renderiza las categorías
 */
function renderizarCategorias(categorias) {
  const container = document.getElementById('categorias-grid');
  
  if (!container) return;

  if (categorias.length === 0) {
    container.innerHTML = '<p class="empty-message">No hay categorías disponibles</p>';
    return;
  }

  container.innerHTML = categorias.map(categoria => `
    <div class="category-card" onclick="verCategoria(${categoria.id})">
      <div class="category-image">
        <img src="${categoria.imagen}" alt="${categoria.nombre}" onerror="this.src='images/placeholder.jpg'">
      </div>
      <div class="category-info">
        <h3>${categoria.nombre}</h3>
        <p>${categoria.descripcion}</p>
      </div>
    </div>
  `).join('');
}

/**
 * Renderiza productos vistos recientemente
 */
function renderizarProductosVistos() {
  const container = document.getElementById('productos-vistos');
  
  if (!container) return;

  const vistos = obtenerProductosVistos();

  if (vistos.length === 0) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';
  const grid = container.querySelector('.productos-vistos-grid');
  
  if (!grid) return;

  grid.innerHTML = vistos.slice(0, 4).map(producto => `
    <div class="product-card-mini" onclick="verDetalleProducto(${producto.id})">
      <img src="${producto.imagen}" alt="${producto.nombre}" onerror="this.src='images/placeholder.jpg'">
      <div class="product-mini-info">
        <h4>${producto.nombre}</h4>
        <span class="price">${producto.precio.toFixed(2)}€</span>
      </div>
    </div>
  `).join('');
}

/**
 * Ver detalle de producto
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
 * Configura los botones de la interfaz
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

  // Botón ver todas las categorías
  const verCategoriasBtn = document.getElementById('ver-categorias-btn');
  if (verCategoriasBtn) {
    verCategoriasBtn.addEventListener('click', () => {
      window.location.href = 'categorias.html';
    });
  }
}