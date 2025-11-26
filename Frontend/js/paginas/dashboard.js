/**
 * CONTROLADOR: dashboard.js
 * Este script controla la página principal (Home) de la tienda.
 * Al cargar, realiza las siguientes tareas:
 * 1. Verifica la seguridad (si no hay login, te expulsa).
 * 2. Muestra un saludo personalizado al usuario.
 * 3. Pinta las Categorías y los Productos Destacados.
 * 4. Pinta la sección "Vistos Recientemente" basada en el historial de sesión.
 * 5. Gestiona el botón de Cerrar Sesión.
 */

// Importamos las clases necesarias para la lógica de negocio
import { Sesion } from '/js/clases/Sesion.js';
import { Tienda } from '/js/clases/Tienda.js';
import { Carrito } from '/js/clases/Carrito.js';

// 1. Instanciamos las clases.
// Al hacer 'new Tienda()', se cargan los datos del LocalStorage automáticamente.
const sesion = new Sesion();
const tienda = new Tienda();
const carrito = new Carrito(); 

// 2. SEGURIDAD (Protección de Ruta)
// Antes de mostrar nada, verificamos si el usuario tiene permiso.
// Si no está autenticado, lo redirigimos forzosamente al Login.
if (!sesion.estaAutenticado()) {
    window.location.href = 'login.html';
}

// 3. INICIO DE LA LÓGICA VISUAL
// Esperamos a que todo el HTML esté cargado ('DOMContentLoaded') para manipularlo.
document.addEventListener('DOMContentLoaded', () => {
    
    // A) SALUDO DE BIENVENIDA
    // Recuperamos los datos del usuario guardados en LocalStorage
    const usuario = sesion.getUsuario();
    
    if (usuario) {
        const welcomeElem = document.getElementById('welcomeMsg');
        
        // Usamos el nombre real si existe, si no, usamos el nombre de usuario (fallback)
        const nombreAmostrar = usuario.nombre || usuario.usuario; 
        
        // Si encontramos el elemento H2, le ponemos el texto
        if (welcomeElem) welcomeElem.textContent = `Hola, ${nombreAmostrar}`;
    }

    // B) ACTUALIZAR CARRITO
    // Aseguramos que el numerito rojo del menú muestre la cantidad real de productos guardados
    carrito.actualizarContadorUI();

    // C) RENDERIZAR LA TIENDA (Categorías y Destacados)
    // Delegamos en la clase Tienda la tarea de generar el HTML de las categorías
    tienda.renderizarCategorias('categoriesContainer');
    
    // Obtenemos solo los productos marcados como 'destacado: true' y los pintamos
    const destacados = tienda.getProductosDestacados();
    tienda.renderizarProductos('featuredContainer', destacados);

    // D) RENDERIZAR VISTOS RECIENTEMENTE (Requisito del ejercicio)
    // 1. Pedimos a la Sesión la lista de IDs (ej: [1, 5, 2])
    const idsVistos = sesion.getProductosVistos();
    
    if (idsVistos.length > 0) {
        // 2. Transformamos esa lista de IDs en lista de Objetos Producto reales.
        // Usamos .map para buscar cada producto en la Tienda.
        // Usamos .filter(p => p !== null) por si acaso algún producto antiguo ya no existe.
        const productosVistos = idsVistos.map(id => tienda.getProductoPorId(id)).filter(p => p !== null);
        
        // 3. Reutilizamos la función de renderizar para pintar esta sección
        tienda.renderizarProductos('recentContainer', productosVistos);
    }

    // E) CONFIGURAR BOTÓN LOGOUT
    // Buscamos el botón de salir en el menú de navegación
    const btnLogout = document.getElementById('logoutBtn');
    
    if (btnLogout) {
        // Al hacer clic, llamamos al método logout de la sesión (que borra todo y redirige)
        btnLogout.addEventListener('click', () => {
            sesion.logout(); 
        });
    }

    
});