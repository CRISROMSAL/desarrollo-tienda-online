import { Sesion } from '/js/clases/Sesion.js';
import { Tienda } from '/js/clases/Tienda.js';
import { Carrito } from '/js/clases/Carrito.js';

const sesion = new Sesion();
const tienda = new Tienda();
const carrito = new Carrito();

if (!sesion.estaAutenticado()) {
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', async () => {
    
    carrito.actualizarContadorUI();

    // Importante: asegurar datos cargados
    if (!tienda.datos) {
        console.error("Error: No hay datos cargados en la tienda");
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const idCategoria = params.get('cat');

    if (!idCategoria) {
        window.location.href = 'dashboard.html';
        return;
    }

    // Buscar nombre categoría
    const infoCategoria = tienda.getCategorias().find(c => c.id == idCategoria);
    
    let nombreCategoria = "Categoría";
    if (infoCategoria) {
        nombreCategoria = infoCategoria.nombre; 
    }

    // Pintar Títulos
    const titulo = document.getElementById('categoryTitle');
    const desc = document.getElementById('categoryDesc');
    
    if(titulo) titulo.textContent = nombreCategoria.toUpperCase();
    if(desc) desc.textContent = `Explora nuestra selección de ${nombreCategoria}`;

    // Pintar Productos (El botón "Ver Opciones" ya viene puesto desde Tienda.js)
    const productosFiltrados = tienda.getProductosPorCategoria(idCategoria);
    tienda.renderizarProductos('productsContainer', productosFiltrados);
    
    // HEMOS BORRADO EL LISTENER DE 'CLICK' Y EL TOAST.
});