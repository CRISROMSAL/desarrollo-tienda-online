import { Sesion } from '/js/clases/Sesion.js';
import { Carrito } from '/js/clases/Carrito.js';

// Instanciamos
const sesion = new Sesion();
const carrito = new Carrito();

// 1. SEGURIDAD: Si no estás logueado, fuera
if (!sesion.estaAutenticado()) {
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    renderizarCarrito();
    configurarBotonCompra();
});

/**
 * Dibuja los productos en el HTML basándose en lo que hay en LocalStorage
 */
function renderizarCarrito() {
    const items = carrito.items; // Accedemos al array de productos
    const contenedor = document.getElementById('contenedor-items');
    const precioTotalElem = document.getElementById('total-precio');
    const subtotalElem = document.getElementById('subtotal-precio');

    // 1. Caso Carrito Vacío
    if (items.length === 0) {
        contenedor.innerHTML = `
            <div class="cart-empty">
                <p>Tu carrito está vacío.</p>
                <a href="dashboard.html" class="btn-primary">Ir a la Tienda</a>
            </div>
        `;
        precioTotalElem.textContent = '0.00€';
        subtotalElem.textContent = '0.00€';
        // Desactivar botón de compra
        const btnCompra = document.getElementById('btn-procesar-compra');
        if(btnCompra) {
            btnCompra.disabled = true;
            btnCompra.style.opacity = '0.5';
        }
        return;
    }

    // 2. Generar HTML de cada producto
    contenedor.innerHTML = items.map(item => `
        <article class="cart-item">
            <img src="${item.imagen}" alt="${item.nombre}" class="cart-img">
            
            <div class="cart-info">
                <h3>${item.nombre}</h3>
                <span class="price">${parseFloat(item.precio).toFixed(2)}€</span>
            </div>

            <div class="cart-controls">
                <div class="quantity-selector">
                    <button class="btn-qty" data-accion="restar" data-id="${item.id}">-</button>
                    <input type="text" value="${item.cantidad}" readonly>
                    <button class="btn-qty" data-accion="sumar" data-id="${item.id}">+</button>
                </div>
            </div>

            <div class="cart-subtotal">
                <strong>${(item.precio * item.cantidad).toFixed(2)}€</strong>
            </div>

            <button class="btn-delete" data-accion="eliminar" data-id="${item.id}" title="Eliminar">
                🗑️
            </button>
        </article>
    `).join('');

    // 3. Actualizar Totales
    const total = carrito.obtenerTotal().toFixed(2);
    precioTotalElem.textContent = `${total}€`;
    subtotalElem.textContent = `${total}€`;

    // 4. Reactivar listeners para los botones que acabamos de crear
    asignarEventos();
}

/**
 * Asigna funcionalidad a los botones de +, - y Eliminar
 */
function asignarEventos() {
    // Usamos delegación o querySelectorAll. Aquí haremos querySelectorAll
    document.querySelectorAll('.btn-qty, .btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            const accion = e.target.dataset.accion;

            // Buscamos el item actual
            const itemActual = carrito.items.find(i => i.id === id);

            if (accion === 'sumar') {
                carrito.cambiarCantidad(id, itemActual.cantidad + 1);
            } else if (accion === 'restar') {
                carrito.cambiarCantidad(id, itemActual.cantidad - 1);
            } else if (accion === 'eliminar') {
                if(confirm('¿Seguro que quieres eliminar este producto?')) {
                    carrito.eliminarProducto(id);
                }
            }

            // Volver a pintar todo para ver los cambios
            renderizarCarrito();
        });
    });
}

/**
 * Maneja el envío del pedido al servidor
 */
function configurarBotonCompra() {
    const btn = document.getElementById('btn-procesar-compra');
    const msgError = document.getElementById('mensaje-error');

    if (!btn) return;

    btn.addEventListener('click', async () => {
        if (carrito.items.length === 0) return;

        // Efecto visual de carga
        btn.textContent = 'Procesando...';
        btn.disabled = true;
        msgError.style.display = 'none';

        const usuario = sesion.getUsuario();
        const token = sesion.getToken();

        try {
            // PETICIÓN AL SERVIDOR (Requisito funcional)
            // Enviamos el carrito para que el backend valide que los precios son reales
            const response = await fetch('/api/carrito', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token // Token de seguridad
                },
                body: JSON.stringify({
                    usuario: usuario,
                    carrito: carrito.items
                })
            });

            const data = await response.json();

            if (!data.error) {
                // ÉXITO
                alert(`✅ ${data.mensaje}\nPedido ID: ${data.pedido.id}`);
                
                // Vaciar carrito y redirigir
                carrito.vaciar();
                window.location.href = 'dashboard.html';
            } else {
                // ERROR (Posible manipulación de precios)
                msgError.textContent = `Error: ${data.mensaje}`;
                msgError.style.display = 'block';
                btn.textContent = 'FINALIZAR COMPRA';
                btn.disabled = false;
            }

        } catch (error) {
            console.error(error);
            msgError.textContent = 'Error de conexión con el servidor.';
            msgError.style.display = 'block';
            btn.textContent = 'FINALIZAR COMPRA';
            btn.disabled = false;
        }
    });
}