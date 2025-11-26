import { Sesion } from '/js/clases/Sesion.js';
import { Carrito } from '/js/clases/Carrito.js';

const sesion = new Sesion();
const carrito = new Carrito();

if (!sesion.estaAutenticado()) {
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    renderizarCarrito();
    configurarBotonCompra();
});

function renderizarCarrito() {
    const items = carrito.getItems();
    const contenedor = document.getElementById('contenedor-items');
    const precioTotalElem = document.getElementById('total-precio');
    const subtotalElem = document.getElementById('subtotal-precio');
    const btnCompra = document.getElementById('btn-procesar-compra');

    if (items.length === 0) {
        contenedor.innerHTML = `
            <div class="cart-empty">
                <p>Tu cesta está vacía.</p>
                <a href="dashboard.html" class="btn-primary" style="width:auto; padding: 10px 30px;">Ir a la Tienda</a>
            </div>
        `;
        if(precioTotalElem) precioTotalElem.textContent = '0.00€';
        if(subtotalElem) subtotalElem.textContent = '0.00€';
        
        if(btnCompra) {
            btnCompra.disabled = true;
            btnCompra.style.opacity = '0.5';
            btnCompra.style.cursor = 'not-allowed';
        }
        return;
    }

    if(btnCompra) {
        btnCompra.disabled = false;
        btnCompra.style.opacity = '1';
        btnCompra.style.cursor = 'pointer';
    }

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
                🗑️
            </button>
        </article>
    `).join('');

    const total = carrito.calcularTotal().toFixed(2);
    if(precioTotalElem) precioTotalElem.textContent = `${total}€`;
    if(subtotalElem) subtotalElem.textContent = `${total}€`;

    asignarEventosItems();
}

function asignarEventosItems() {
    const botones = document.querySelectorAll('.btn-qty, .btn-delete');
    // Usamos el div de feedback para avisar de que hemos borrado
    const feedback = document.getElementById('checkoutFeedback'); 
    
    botones.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.target.closest('button'); 
            // OJO: El ID ahora puede ser string (por las variantes), así que quitamos parseInt si es necesario,
            // pero si tus IDs son números puros, déjalo. Si usas variantes (1-rojo-M), usa string.
            // Para asegurar, lo tratamos como string si viene con guiones, o int si no.
            let id = target.dataset.id;
            // Si es solo número, lo convertimos
            if(!isNaN(id)) id = parseInt(id);

            const accion = target.dataset.accion;
            const item = carrito.getItems().find(i => i.id == id);

            if (accion === 'sumar') {
                carrito.cambiarCantidad(id, item.cantidad + 1);
            } else if (accion === 'restar') {
                carrito.cambiarCantidad(id, item.cantidad - 1);
            } else if (accion === 'eliminar') {
                // --- CAMBIO: SIN CONFIRM, BORRADO DIRECTO ---
                carrito.eliminarProducto(id);
                
                // Mostramos mensaje rojo temporal
                if(feedback) {
                    feedback.textContent = "🗑️ Producto eliminado";
                    feedback.className = 'feedback-msg error';
                    feedback.style.display = 'block';
                    setTimeout(() => { feedback.style.display = 'none'; }, 2000);
                }
            }

            renderizarCarrito();
            carrito.actualizarContadorUI();
        });
    });
}

function configurarBotonCompra() {
    const btnComprar = document.getElementById('btn-procesar-compra');
    const feedback = document.getElementById('checkoutFeedback'); 

    if (!btnComprar) return;

    btnComprar.addEventListener('click', async () => {
        btnComprar.disabled = true;
        const textoOriginal = btnComprar.textContent;
        btnComprar.textContent = "Procesando...";
        
        if(feedback) feedback.style.display = 'none';

        const resultado = await carrito.procesarCompra();

        if (resultado.status) {
            if(feedback) {
                feedback.textContent = "✅ " + resultado.mensaje;
                feedback.className = 'feedback-msg success'; 
                feedback.style.display = 'block';
            }
            renderizarCarrito();
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
        } else {
            if(feedback) {
                feedback.textContent = "❌ " + resultado.mensaje;
                feedback.className = 'feedback-msg error'; 
                feedback.style.display = 'block';
            }
            btnComprar.disabled = false;
            btnComprar.textContent = textoOriginal;
        }
    });
}