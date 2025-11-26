import { Sesion } from '/js/clases/Sesion.js';
import { Tienda } from '/js/clases/Tienda.js';
import { Carrito } from '/js/clases/Carrito.js';

const sesion = new Sesion();
const tienda = new Tienda();
const carrito = new Carrito(); 

if (!sesion.estaAutenticado()) {
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    
    // A) Bienvenida
    const usuario = sesion.getUsuario();
    if (usuario) {
        const welcomeElem = document.getElementById('welcomeMsg');
        const nombreAmostrar = usuario.nombre || usuario.usuario; 
        if (welcomeElem) welcomeElem.textContent = `Hola, ${nombreAmostrar}`;
    }

    // B) Contador carrito
    carrito.actualizarContadorUI();

    // C) Renderizar Tienda
    tienda.renderizarCategorias('categoriesContainer');
    
    const destacados = tienda.getProductosDestacados();
    tienda.renderizarProductos('featuredContainer', destacados);

    // D) Renderizar Vistos Recientemente
    const idsVistos = sesion.getProductosVistos();
    if (idsVistos.length > 0) {
        const productosVistos = idsVistos.map(id => tienda.getProductoPorId(id)).filter(p => p !== null);
        tienda.renderizarProductos('recentContainer', productosVistos);
    }

    // E) Botón Logout
    const btnLogout = document.getElementById('logoutBtn');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            sesion.logout(); 
        });
    }

    // HEMOS BORRADO EL LISTENER DE 'CLICK' Y EL TOAST 
    // PORQUE YA NO SE PUEDE COMPRAR DESDE AQUÍ.
});