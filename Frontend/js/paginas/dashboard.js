// public/js/pages/dashboard.js
import { Sesion } from '/js/clases/Sesion.js';
// Ajusta estas rutas según funcionó antes (si usas rutas absolutas o relativas)
import { Tienda } from '/js/clases/Tienda.js'; 
import { Carrito } from '/js/clases/Carrito.js'; 

// 1. Instanciamos todas las clases necesarias
const sesion = new Sesion();
const tienda = new Tienda();
const carrito = new Carrito(); 

// 2. PROTECCIÓN DE RUTA (Si no hay token, fuera)
if (!sesion.estaAutenticado()) {
    window.location.href = 'login.html';
}

// 3. LÓGICA PRINCIPAL (Cuando el HTML ha cargado)
document.addEventListener('DOMContentLoaded', () => {
    
    // A) Mostrar mensaje de bienvenida
    const usuario = sesion.getUsuario();
    
    // Verificamos en consola qué datos tenemos (para depurar)
    console.log("Usuario logueado:", usuario); 

    if (usuario) {
        const welcomeElem = document.getElementById('welcomeMsg');
        // Usamos usuario.nombre si existe, si no, usamos usuario.usuario
        const nombreAmostrar = usuario.nombre || usuario.usuario; 
        
        if (welcomeElem) {
            welcomeElem.textContent = `Hola, ${nombreAmostrar}`;
        }
    }

    // B) ---> AQUÍ VA LA LÍNEA QUE PREGUNTABAS <---
    // Actualiza el número del carrito (0, 1, 2...) nada más entrar
    carrito.actualizarContadorUI();

    // C) Renderizar la tienda (Categorías y Destacados)
    tienda.renderizarCategorias('categoriesContainer');
    
    // Obtenemos destacados y los pintamos
    const destacados = tienda.getProductosDestacados();
    tienda.renderizarProductos('featuredContainer', destacados);

    // D) Configurar botón de Cerrar Sesión
    const btnLogout = document.getElementById('logoutBtn');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            sesion.logout(); 
        });
    }

    // E) ESCUCHADOR PARA BOTONES "AÑADIR AL CARRITO"
    document.body.addEventListener('click', (e) => {
        // Buscamos si el clic fue en el botón o en algo dentro del botón (icono)
        const btn = e.target.closest('.btn-add-cart');

        if (btn) {
            const idProducto = btn.dataset.id;
            const productoInfo = tienda.getProductoPorId(idProducto);

            if (productoInfo) {
                carrito.agregarProducto(productoInfo);
                
                // --- CAMBIO: USAMOS EL TOAST EN VEZ DE ALERT ---
                mostrarToast(`¡${productoInfo.nombre} añadido!`);
            }
        }
    });

    // Función para mostrar el Toast
    function mostrarToast(mensaje) {
        const toast = document.getElementById("toast-notification");
        if (toast) {
            toast.textContent = mensaje;
            toast.className = "toast show"; // Mostrar
            
            // Ocultar a los 3 segundos
            setTimeout(() => { 
                toast.className = toast.className.replace("show", ""); 
            }, 3000);
        }
    }
    });
