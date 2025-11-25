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
    // Usamos delegación de eventos (document.body) porque los botones se crearon dinámicamente
    document.body.addEventListener('click', (e) => {
        // Verificamos si lo que se pulsó tiene la clase 'btn-add-cart'
        if (e.target.classList.contains('btn-add-cart')) {
            const idProducto = e.target.dataset.id;
            
            // Buscamos los datos completos del producto en la Tienda
            const productoInfo = tienda.getProductoPorId(idProducto);

            if (productoInfo) {
                // Lo añadimos al carrito
                carrito.agregarProducto(productoInfo);
                
                // Feedback visual para el usuario
                alert(`¡${productoInfo.nombre} añadido al carrito!`);
            } else {
                console.error("Error: Producto no encontrado en memoria");
            }
        }
    });
});