/**
 * CONTROLADOR: carrito.js
 * Este script gestiona la página de resumen de compra (checkout).
 * Sus responsabilidades son:
 * 1. Pintar la lista de productos añadidos (Renderizado).
 * 2. Gestionar los botones de sumar (+), restar (-) y eliminar.
 * 3. Calcular y mostrar el precio total.
 * 4. Enviar la orden de compra al servidor y gestionar la respuesta (Éxito/Error).
 */

import { Sesion } from '/js/clases/Sesion.js';
import { Carrito } from '/js/clases/Carrito.js';

// 1. Instanciamos las clases de lógica de negocio
const sesion = new Sesion();
const carrito = new Carrito();

// 2. SEGURIDAD: Si el usuario no está logueado, lo expulsamos al Login.
if (!sesion.estaAutenticado()) {
    window.location.href = 'login.html';
}

// 3. INICIO: Cuando el HTML termina de cargar
document.addEventListener('DOMContentLoaded', () => {
    renderizarCarrito();      // Pintamos los productos
    configurarBotonCompra();  // Preparamos el botón de "Finalizar Compra"
});

/**
 * Función principal que dibuja el HTML del carrito basándose en los datos del LocalStorage.
 */
function renderizarCarrito() {
    // Obtenemos los productos guardados
    const items = carrito.getItems();
    
    // Referencias a elementos del DOM
    const contenedor = document.getElementById('contenedor-items');
    const precioTotalElem = document.getElementById('total-precio');
    const subtotalElem = document.getElementById('subtotal-precio');
    const btnCompra = document.getElementById('btn-procesar-compra');

    // CASO A: El carrito está vacío
    if (items.length === 0) {
        // Inyectamos un mensaje amigable y un botón para volver a la tienda
        contenedor.innerHTML = `
            <div class="cart-empty">
                <p>Tu cesta está vacía.</p>
                <a href="dashboard.html" class="btn-primary" style="width:auto; padding: 10px 30px;">Ir a la Tienda</a>
            </div>
        `;
        // Reseteamos los precios a 0
        if(precioTotalElem) precioTotalElem.textContent = '0.00€';
        if(subtotalElem) subtotalElem.textContent = '0.00€';
        
        // Desactivamos visualmente el botón de compra
        if(btnCompra) {
            btnCompra.disabled = true;
            btnCompra.style.opacity = '0.5';
            btnCompra.style.cursor = 'not-allowed';
        }
        return; // Salimos de la función
    }

    // CASO B: Hay productos
    // Reactivamos el botón de compra
    if(btnCompra) {
        btnCompra.disabled = false;
        btnCompra.style.opacity = '1';
        btnCompra.style.cursor = 'pointer';
    }

    // Generamos el HTML para cada producto usando .map
    contenedor.innerHTML = items.map(item => `
        <article class="cart-item">
            <img src="${item.imagen}" alt="${item.nombre}" class="cart-img">
            
            <div class="cart-info">
                <h3>${item.nombre}</h3>
                <span class="price">${parseFloat(item.precio).toFixed(2)}€</span>
            </div>

            <div class="quantity-selector">
                <button class="btn-qty" data-accion="restar" data-id="${item.id}">-</button>
                <input type="text" value="${item.cantidad}" readonly>
                <button class="btn-qty" data-accion="sumar" data-id="${item.id}">+</button>
            </div>

            <div class="cart-subtotal">
                <strong>${(item.precio * item.cantidad).toFixed(2)}€</strong>
            </div>

            <button class="btn-delete" data-accion="eliminar" data-id="${item.id}" title="Eliminar">
                Eliminar
            </button>
        </article>
    `).join('');

    // Actualizamos el precio total global en la barra lateral
    const total = carrito.calcularTotal().toFixed(2);
    if(precioTotalElem) precioTotalElem.textContent = `${total}€`;
    if(subtotalElem) subtotalElem.textContent = `${total}€`;

    // IMPORTANTE: Como hemos borrado y creado el HTML de nuevo,
    // tenemos que volver a asignar los eventos 'click' a los botones nuevos.
    asignarEventosItems();
}

/**
 * Asigna la funcionalidad a los botones de +, - y Eliminar que acabamos de crear.
 */
function asignarEventosItems() {
    // Seleccionamos todos los botones de acción
    const botones = document.querySelectorAll('.btn-qty, .btn-delete');
    
    // Referencia al div donde mostraremos mensajes temporales
    const feedback = document.getElementById('checkoutFeedback'); 
    
    botones.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // .closest asegura que capturamos el botón aunque se haga click dentro
            const target = e.target.closest('button'); 
            
            // LÓGICA DE ID: El ID puede ser número (1) o texto compuesto ("1-Rojo-M").
            let id = target.dataset.id;
            if(!isNaN(id)) id = parseInt(id);

            const accion = target.dataset.accion;
            // Buscamos el producto en memoria
            const item = carrito.getItems().find(i => i.id == id);

            if (accion === 'sumar') {
                carrito.cambiarCantidad(id, item.cantidad + 1);
            } else if (accion === 'restar') {
                carrito.cambiarCantidad(id, item.cantidad - 1);
            } else if (accion === 'eliminar') {
                // --- BORRADO DIRECTO ---
                carrito.eliminarProducto(id);
                
                // UX: Mostramos un mensaje rojo temporal debajo del total
                if(feedback) {
                    feedback.textContent = "Producto eliminado";
                    feedback.className = 'feedback-msg error'; // Estilo rojo
                    feedback.style.display = 'block';
                    setTimeout(() => { feedback.style.display = 'none'; }, 2000);
                }
            }

            // Repintamos el carrito para reflejar los cambios
            renderizarCarrito();
            // Actualizamos el numerito del menú de navegación
            carrito.actualizarContadorUI();
        });
    });
}

/**
 * Gestiona el botón "FINALIZAR COMPRA".
 * Se comunica con la clase Carrito para enviar el pedido al servidor.
 */
function configurarBotonCompra() {
    const btnComprar = document.getElementById('btn-procesar-compra');
    const feedback = document.getElementById('checkoutFeedback'); 

    if (!btnComprar) return;

    btnComprar.addEventListener('click', async () => {
        // 1. Feedback Visual: Desactivamos botón y cambiamos texto
        btnComprar.disabled = true;
        const textoOriginal = btnComprar.textContent;
        btnComprar.textContent = "Procesando...";
        
        // Limpiamos mensajes anteriores
        if(feedback) feedback.style.display = 'none';

        // 2. Llamada Asíncrona: La clase Carrito habla con el servidor
        const resultado = await carrito.procesarCompra();

        // 3. Gestión de la Respuesta
        if (resultado.status) {
            // --- ÉXITO ---
            if(feedback) {
                feedback.textContent = resultado.mensaje;
                feedback.className = 'feedback-msg success'; // Estilo verde
                feedback.style.display = 'block';
            }
            
            // Vaciamos visualmente la lista
            renderizarCarrito();
            
            // Redirigimos al usuario tras 2 segundos
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
        } else {
            // --- ERROR ---
            if(feedback) {
                feedback.textContent = resultado.mensaje;
                feedback.className = 'feedback-msg error'; // Estilo rojo
                feedback.style.display = 'block';
            }
            // Restauramos el botón
            btnComprar.disabled = false;
            btnComprar.textContent = textoOriginal;
        }
    });
}