import { Sesion } from '/js/clases/Sesion.js';
import { Tienda } from '/js/clases/Tienda.js';
import { Carrito } from '/js/clases/Carrito.js';

const sesion = new Sesion();
const tienda = new Tienda();
const carrito = new Carrito();

// Seguridad
if (!sesion.estaAutenticado()) {
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Contador del carrito
    carrito.actualizarContadorUI();

    // 2. Cargar datos de la tienda (Espera a tenerlos)
    // No hace falta await tienda.cargarDatos() si el constructor ya lo hace, 
    // pero aseguramos que tienda.datos no sea null.
    if (!tienda.datos) {
        console.error("Error: No hay datos cargados en la tienda");
        return;
    }

    // 3. Leer ID de la categoría (ej: ?cat=1)
    const params = new URLSearchParams(window.location.search);
    const idCategoria = params.get('cat');

    if (!idCategoria) {
        window.location.href = 'dashboard.html';
        return;
    }

    // 4. Buscar el NOMBRE de la categoría usando el ID (Para el título)
    // El ID viene como string "1", lo comparamos flexiblemente (==) con el número
    const infoCategoria = tienda.getCategorias().find(c => c.id == idCategoria);
    
    let nombreCategoria = "Categoría";
    if (infoCategoria) {
        nombreCategoria = infoCategoria.nombre; // Ej: "Tops"
    }

    // 5. Pintar Títulos
    const titulo = document.getElementById('categoryTitle');
    const desc = document.getElementById('categoryDesc');
    
    if(titulo) titulo.textContent = nombreCategoria.toUpperCase();
    if(desc) desc.textContent = `Explora nuestra selección de ${nombreCategoria}`;

    // 6. Filtrar y Pintar Productos (Usando el ID)
    const productosFiltrados = tienda.getProductosPorCategoria(idCategoria);
    tienda.renderizarProductos('productsContainer', productosFiltrados);

    // 7. Configurar botones
    configurarBotonesAdd();
});

function configurarBotonesAdd() {
    document.body.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-add-cart');

        if (btn) {
            const id = btn.dataset.id;
            const producto = tienda.getProductoPorId(id);

            if (producto) {
                carrito.agregarProducto(producto);
                mostrarToast(`¡${producto.nombre} añadido!`);
            }
        }
    });
}

function mostrarToast(mensaje) {
    const toast = document.getElementById("toast-notification");
    if (toast) {
        toast.textContent = mensaje;
        toast.className = "toast show";
        setTimeout(() => { 
            toast.className = toast.className.replace("show", ""); 
        }, 3000);
    }
}