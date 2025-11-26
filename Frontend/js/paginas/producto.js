import { Sesion } from '/js/clases/Sesion.js';
import { Tienda } from '/js/clases/Tienda.js';
import { Carrito } from '/js/clases/Carrito.js';

const sesion = new Sesion();
const tienda = new Tienda();
const carrito = new Carrito();

let productoActual = null;
let seleccionColor = null;
let seleccionTalla = null;

// Protección
if (!sesion.estaAutenticado()) {
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    carrito.actualizarContadorUI();
    cargarProducto();
});

function cargarProducto() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
        window.location.href = 'dashboard.html';
        return;
    }

    productoActual = tienda.getProductoPorId(id);

    if (!productoActual) {
        alert("Producto no encontrado"); // Este solo sale si hackean la URL, pero bueno.
        window.location.href = 'dashboard.html';
        return;
    }

    renderizarDetalle();
}

function renderizarDetalle() {
    document.getElementById('imgDetalle').src = productoActual.imagen;
    document.getElementById('tituloDetalle').textContent = productoActual.nombre;
    document.getElementById('precioDetalle').textContent = `${productoActual.precio}€`;
    document.getElementById('descDetalle').textContent = productoActual.descripcion || "Sin descripción";

    // Renderizar Colores
    const coloresContainer = document.getElementById('coloresContainer');
    if (productoActual.colores) {
        productoActual.colores.forEach(color => {
            const btn = document.createElement('button');
            btn.textContent = color;
            btn.className = 'btn-option';
            btn.onclick = () => {
                document.querySelectorAll('#coloresContainer .btn-option').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                seleccionColor = color;
            };
            coloresContainer.appendChild(btn);
        });
    }

    // Renderizar Tallas
    const tallasContainer = document.getElementById('tallasContainer');
    if (productoActual.tallas) {
        productoActual.tallas.forEach(talla => {
            const btn = document.createElement('button');
            btn.textContent = talla;
            btn.className = 'btn-option';
            btn.onclick = () => {
                document.querySelectorAll('#tallasContainer .btn-option').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                seleccionTalla = talla;
            };
            tallasContainer.appendChild(btn);
        });
    }

    // Configurar Botón Añadir
    document.getElementById('btnAgregar').addEventListener('click', agregarAlCarrito);
}

function agregarAlCarrito() {
    // 1. Validar selección
    if (!seleccionColor || !seleccionTalla) {
        mostrarFeedback("⚠️ Por favor, selecciona un color y una talla.", "error");
        return;
    }

    // 2. Añadir al carrito
    // Creamos un clon del producto con la variante específica
    const productoVariante = {
        ...productoActual,
        id: `${productoActual.id}-${seleccionColor}-${seleccionTalla}`, // ID único para variante
        nombre: `${productoActual.nombre} (${seleccionColor}, ${seleccionTalla})`,
        variantColor: seleccionColor,
        variantTalla: seleccionTalla
    };

    carrito.agregarProducto(productoVariante);

    // 3. Feedback visual (SIN ALERT)
    mostrarFeedback(`✅ ¡${productoActual.nombre} añadido a la cesta!`, "success");
}

// Función auxiliar para pintar el mensaje verde/rojo
function mostrarFeedback(texto, tipo) {
    const msg = document.getElementById('msgFeedback'); // Asegúrate que este <p> existe en tu HTML
    
    if (msg) {
        msg.textContent = texto;
        // Reseteamos clases y añadimos la nueva (feedback-msg viene del CSS que pusimos antes)
        msg.className = 'feedback-msg ' + tipo; 
        msg.style.display = 'block';

        // Si es éxito, que desaparezca a los 3 segundos
        if (tipo === 'success') {
            setTimeout(() => {
                msg.style.display = 'none';
            }, 3000);
        }
    } else {
        console.error("No encuentro el elemento msgFeedback en el HTML");
    }
}