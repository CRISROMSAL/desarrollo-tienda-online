/**
 * CONTROLADOR: categorias.js
 * Este script gestiona la página de listado de productos por categoría.
 * Su lógica principal se basa en leer la URL para saber qué mostrar.
 * Ejemplo: Si la URL es 'categorias.html?cat=1', muestra solo los Tops.
 */

import { Sesion } from '/js/clases/Sesion.js';
import { Tienda } from '/js/clases/Tienda.js';
import { Carrito } from '/js/clases/Carrito.js';

// Instanciamos las clases principales
const sesion = new Sesion();
const tienda = new Tienda();
const carrito = new Carrito();

// SEGURIDAD: Verificación de sesión activa
if (!sesion.estaAutenticado()) {
    window.location.href = 'login.html';
}

// Evento principal: Se ejecuta cuando el HTML ha terminado de cargar
document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Actualizamos el contador del carrito en el header
    carrito.actualizarContadorUI();

    // 2. Validación de seguridad de datos
    // Nos aseguramos de que el objeto 'tienda.datos' no sea null antes de intentar leerlo.
    if (!tienda.datos) {
        console.error("Error: No hay datos cargados en la tienda");
        return;
    }

    // 3. Captura del parámetro de la URL
    // URLSearchParams nos permite leer lo que va después del '?' en la barra de direcciones.
    const params = new URLSearchParams(window.location.search);
    const idCategoria = params.get('cat'); // Obtenemos el valor de 'cat' (ej: 1)

    // Si el usuario entra sin especificar categoría, lo mandamos al Dashboard
    if (!idCategoria) {
        window.location.href = 'dashboard.html';
        return;
    }

    // 4. Buscar la información de la categoría (para el título)
    // Buscamos en el array de categorías cuál coincide con el ID de la URL.
    // Usamos '==' (comparación flexible) porque el ID de la URL es texto ("1") y en el JSON es número (1).
    const infoCategoria = tienda.getCategorias().find(c => c.id == idCategoria);
    
    let nombreCategoria = "Categoría";
    if (infoCategoria) {
        nombreCategoria = infoCategoria.nombre; // Ej: "Tops"
    }

    // 5. Inyectar los textos en el HTML (DOM)
    const titulo = document.getElementById('categoryTitle');
    const desc = document.getElementById('categoryDesc');
    
    if(titulo) titulo.textContent = nombreCategoria.toUpperCase();
    if(desc) desc.textContent = `Explora nuestra selección de ${nombreCategoria}`;

    // 6. Filtrar y Renderizar Productos
    // Pedimos a la Tienda solo los productos que coincidan con este ID de categoría
    const productosFiltrados = tienda.getProductosPorCategoria(idCategoria);
    
    // Usamos el método reutilizable renderizarProductos para pintar las tarjetas.
    // Recuerda: Los botones generados ahora dicen "VER OPCIONES" y llevan a la ficha del producto.
    tienda.renderizarProductos('productsContainer', productosFiltrados);
    
    // NOTA: No necesitamos listeners de 'click' adicionales porque la navegación se maneja directamente en el HTML generado por Tienda.js (window.location...).
});