/**
 * authentication.js
 * Gestiona el token JWT y la autenticación del usuario
 */

const API_URL = 'http://localhost:3000/api';

// ============================================
// GESTIÓN DEL TOKEN
// ============================================

/**
 * Guarda el token en localStorage
 */
function guardarToken(token) {
  localStorage.setItem('token', token);
}

/**
 * Obtiene el token desde localStorage
 */
function obtenerToken() {
  return localStorage.getItem('token');
}

/**
 * Elimina el token de localStorage
 */
function eliminarToken() {
  localStorage.removeItem('token');
}

/**
 * Verifica si el usuario está autenticado
 */
function estaAutenticado() {
  return obtenerToken() !== null;
}

// ============================================
// GESTIÓN DE DATOS DE LA TIENDA
// ============================================

/**
 * Guarda los datos de la tienda en localStorage
 */
function guardarTienda(tienda) {
  localStorage.setItem('tienda', JSON.stringify(tienda));
}

/**
 * Obtiene los datos de la tienda desde localStorage
 */
function obtenerTienda() {
  const tienda = localStorage.getItem('tienda');
  return tienda ? JSON.parse(tienda) : null;
}

/**
 * Obtiene todas las categorías
 */
function obtenerCategorias() {
  const tienda = obtenerTienda();
  return tienda ? tienda.categorias : [];
}

/**
 * Obtiene todos los productos
 */
function obtenerProductos() {
  const tienda = obtenerTienda();
  return tienda ? tienda.productos : [];
}

/**
 * Obtiene un producto por ID
 */
function obtenerProductoPorId(id) {
  const productos = obtenerProductos();
  return productos.find(p => p.id === parseInt(id));
}

/**
 * Obtiene productos por categoría
 */
function obtenerProductosPorCategoria(idCategoria) {
  const productos = obtenerProductos();
  return productos.filter(p => p.id_categoria === parseInt(idCategoria));
}

/**
 * Obtiene productos destacados
 */
function obtenerProductosDestacados() {
  const productos = obtenerProductos();
  return productos.filter(p => p.destacado === true);
}

// ============================================
// GESTIÓN DEL USUARIO
// ============================================

/**
 * Guarda los datos del usuario en localStorage
 */
function guardarUsuario(usuario) {
  localStorage.setItem('usuario', JSON.stringify(usuario));
}

/**
 * Obtiene los datos del usuario desde localStorage
 */
function obtenerUsuario() {
  const usuario = localStorage.getItem('usuario');
  return usuario ? JSON.parse(usuario) : null;
}

/**
 * Elimina los datos del usuario
 */
function eliminarUsuario() {
  localStorage.removeItem('usuario');
}

// ============================================
// GESTIÓN DEL CARRITO
// ============================================

/**
 * Obtiene el carrito desde localStorage
 */
function obtenerCarrito() {
  const carrito = localStorage.getItem('carrito');
  return carrito ? JSON.parse(carrito) : [];
}

/**
 * Guarda el carrito en localStorage
 */
function guardarCarrito(carrito) {
  localStorage.setItem('carrito', JSON.stringify(carrito));
}

/**
 * Añade un producto al carrito
 */
function agregarAlCarrito(producto, cantidad = 1, talla = null, color = null) {
  const carrito = obtenerCarrito();
  
  // Buscar si el producto ya existe en el carrito
  const index = carrito.findIndex(item => 
    item.id === producto.id && 
    item.talla === talla && 
    item.color === color
  );

  if (index !== -1) {
    // Si existe, aumentar cantidad
    carrito[index].cantidad += cantidad;
  } else {
    // Si no existe, agregar nuevo item
    carrito.push({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      imagen: producto.imagen,
      cantidad: cantidad,
      talla: talla,
      color: color
    });
  }

  guardarCarrito(carrito);
  actualizarContadorCarrito();
  return carrito;
}

/**
 * Elimina un producto del carrito
 */
function eliminarDelCarrito(index) {
  const carrito = obtenerCarrito();
  carrito.splice(index, 1);
  guardarCarrito(carrito);
  actualizarContadorCarrito();
  return carrito;
}

/**
 * Actualiza la cantidad de un producto en el carrito
 */
function actualizarCantidadCarrito(index, cantidad) {
  const carrito = obtenerCarrito();
  if (cantidad <= 0) {
    return eliminarDelCarrito(index);
  }
  carrito[index].cantidad = cantidad;
  guardarCarrito(carrito);
  actualizarContadorCarrito();
  return carrito;
}

/**
 * Vacía el carrito
 */
function vaciarCarrito() {
  localStorage.removeItem('carrito');
  actualizarContadorCarrito();
}

/**
 * Calcula el total del carrito
 */
function calcularTotalCarrito() {
  const carrito = obtenerCarrito();
  return carrito.reduce((total, item) => total + (item.precio * item.cantidad), 0);
}

/**
 * Cuenta items del carrito
 */
function contarItemsCarrito() {
  const carrito = obtenerCarrito();
  return carrito.reduce((total, item) => total + item.cantidad, 0);
}

/**
 * Actualiza el contador visual del carrito
 */
function actualizarContadorCarrito() {
  const contador = document.getElementById('cart-count');
  if (contador) {
    const total = contarItemsCarrito();
    contador.textContent = total;
    contador.style.display = total > 0 ? 'flex' : 'none';
  }
}

// ============================================
// PRODUCTOS VISTOS RECIENTEMENTE
// ============================================

/**
 * Añade un producto a la lista de vistos recientemente
 */
function agregarProductoVisto(producto) {
  let vistos = obtenerProductosVistos();
  
  // Eliminar el producto si ya existe (para moverlo al principio)
  vistos = vistos.filter(p => p.id !== producto.id);
  
  // Añadir al principio
  vistos.unshift({
    id: producto.id,
    nombre: producto.nombre,
    precio: producto.precio,
    imagen: producto.imagen
  });
  
  // Limitar a 10 productos
  if (vistos.length > 10) {
    vistos = vistos.slice(0, 10);
  }
  
  localStorage.setItem('productos_vistos', JSON.stringify(vistos));
}

/**
 * Obtiene la lista de productos vistos recientemente
 */
function obtenerProductosVistos() {
  const vistos = localStorage.getItem('productos_vistos');
  return vistos ? JSON.parse(vistos) : [];
}

// ============================================
// CERRAR SESIÓN
// ============================================

/**
 * Cierra la sesión y limpia todo el localStorage
 */
function cerrarSesion() {
  localStorage.clear();
  window.location.href = 'login.html';
}

// ============================================
// PETICIONES HTTP CON TOKEN
// ============================================

/**
 * Realiza una petición GET con autenticación
 */
async function fetchConToken(url, method = 'GET', body = null) {
  const token = obtenerToken();
  
  const options = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    // Si el token es inválido, redirigir al login
    if (response.status === 401) {
      cerrarSesion();
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error en la petición:', error);
    return null;
  }
}

// ============================================
// VERIFICAR AUTENTICACIÓN AL CARGAR PÁGINA
// ============================================

/**
 * Verifica que el usuario esté autenticado
 * Si no lo está, redirige al login
 */
function verificarAutenticacion() {
  if (!estaAutenticado()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

/**
 * Muestra el nombre del usuario en el header
 */
function mostrarUsuarioEnHeader() {
  const usuario = obtenerUsuario();
  const userNameElement = document.getElementById('user-name');
  
  if (usuario && userNameElement) {
    userNameElement.textContent = usuario.nombre || usuario.usuario;
  }
}

// ============================================
// INICIALIZACIÓN
// ============================================

// Al cargar cualquier página (excepto login), verificar autenticación
if (window.location.pathname !== '/login.html' && !window.location.pathname.endsWith('/login.html')) {
  document.addEventListener('DOMContentLoaded', () => {
    if (verificarAutenticacion()) {
      mostrarUsuarioEnHeader();
      actualizarContadorCarrito();
    }
  });
}