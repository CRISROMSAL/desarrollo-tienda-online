import { Sesion } from '/js/clases/Sesion.js';
import { Tienda } from '/js/clases/Tienda.js';
import { Carrito } from '/js/clases/Carrito.js';

// Instancias
const sesion = new Sesion();
const tienda = new Tienda();
const carrito = new Carrito();

// 1. Seguridad
if (!sesion.estaAutenticado()) {
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    // Actualizar contador del carrito
    carrito.actualizarContadorUI();

    // 2. OBTENER EL ID DE LA URL
    // Esto lee lo que hay después del signo ? (ej: categorias.html?id=1)
    const urlParams = new URLSearchParams(window.location.search);
    const categoriaId = urlParams.get('id');

    if (!categoriaId) {
        // Si alguien entra sin ID, lo mandamos al dashboard
        window.location.href = 'dashboard.html';
        return;
    }

    cargarCategoria(categoriaId);
});

function cargarCategoria(id) {
    // A) Buscar información de la categoría
    const todasLasCategorias = tienda.getCategorias();
    const infoCategoria = todasLasCategorias.find(c => c.id === parseInt(id));

    if (infoCategoria) {
        // Poner Título y Descripción en el HTML
        document.getElementById('categoryTitle').textContent = infoCategoria.nombre;
        document.getElementById('categoryDesc').textContent = infoCategoria.descripcion;
        document.title = `${infoCategoria.nombre} | Tienda Moda`;
    } else {
        document.getElementById('categoryTitle').textContent = "Categoría no encontrada";
    }

    // B) Buscar productos de esa categoría
    const productosFiltrados = tienda.getProductosPorCategoria(id);
    
    // C) Renderizarlos
    tienda.renderizarProductos('productsContainer', productosFiltrados);

    // D) Activar botones de compra (Delegación de eventos en el body)
    activarBotonesCompra();
}

function activarBotonesCompra() {
    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-add-cart')) {
            const idProducto = e.target.dataset.id;
            const productoInfo = tienda.getProductoPorId(idProducto);

            if (productoInfo) {
                carrito.agregarProducto(productoInfo);
                alert(`¡${productoInfo.nombre} añadido al carrito!`);
            }
        }
    });
}