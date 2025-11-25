import { Sesion } from '/js/clases/Sesion.js';
import { Tienda } from '/js/clases/Tienda.js';
import { Carrito } from '/js/clases/Carrito.js';

// Instancias
const sesion = new Sesion();
const tienda = new Tienda();
const carrito = new Carrito();

// Variables para guardar la selección del usuario
let seleccionColor = null;
let seleccionTalla = null;
let productoActual = null;

// 1. Seguridad
if (!sesion.estaAutenticado()) {
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    carrito.actualizarContadorUI();

    // Obtener ID de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (!id) {
        window.location.href = 'dashboard.html';
        return;
    }

    // Cargar producto
    productoActual = tienda.getProductoPorId(id);

    if (productoActual) {
        renderizarProducto(productoActual);
        registrarVisita(id); // <--- Lógica de "Productos Vistos"
    } else {
        alert("Producto no encontrado");
        window.location.href = 'dashboard.html';
    }

    // Listener del botón Añadir
    document.getElementById('btnAgregar').addEventListener('click', agregarAlCarrito);
});

function renderizarProducto(prod) {
    document.title = `${prod.nombre} | Tienda Moda`;
    
    document.getElementById('imgDetalle').src = prod.imagen;
    document.getElementById('tituloDetalle').textContent = prod.nombre;
    document.getElementById('descDetalle').textContent = prod.descripcion;
    document.getElementById('precioDetalle').textContent = `${parseFloat(prod.precio).toFixed(2)}€`;

    // Stock visual
    const badge = document.getElementById('stockBadge');
    if (prod.stock < 5) {
        badge.textContent = `¡Solo quedan ${prod.stock}!`;
        badge.style.background = '#e74c3c'; // Rojo urgencia
    } else {
        badge.textContent = 'En Stock';
        badge.style.background = '#2ecc71'; // Verde
    }

    // Renderizar Colores
    const containerColores = document.getElementById('coloresContainer');
    if (prod.colores && prod.colores.length > 0) {
        containerColores.innerHTML = prod.colores.map(c => 
            `<button class="btn-option btn-color" data-val="${c}">${c}</button>`
        ).join('');
    } else {
        containerColores.innerHTML = '<span>Único</span>';
        seleccionColor = 'Único';
    }

    // Renderizar Tallas
    const containerTallas = document.getElementById('tallasContainer');
    if (prod.tallas && prod.tallas.length > 0) {
        containerTallas.innerHTML = prod.tallas.map(t => 
            `<button class="btn-option btn-talla" data-val="${t}">${t}</button>`
        ).join('');
    } else {
        containerTallas.innerHTML = '<span>Única</span>';
        seleccionTalla = 'Única';
    }

    // Activar lógica de selección (Click en botones)
    activarSelectores();
}

function activarSelectores() {
    // Selección de Color
    document.querySelectorAll('.btn-color').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Quitar clase activo a los demás
            document.querySelectorAll('.btn-color').forEach(b => b.classList.remove('selected'));
            // Poner activo al pulsado
            e.target.classList.add('selected');
            seleccionColor = e.target.dataset.val;
        });
    });

    // Selección de Talla
    document.querySelectorAll('.btn-talla').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.btn-talla').forEach(b => b.classList.remove('selected'));
            e.target.classList.add('selected');
            seleccionTalla = e.target.dataset.val;
        });
    });
}

function agregarAlCarrito() {
    // Validar que haya elegido talla y color
    if (!seleccionColor || !seleccionTalla) {
        alert("Por favor, selecciona un color y una talla.");
        return;
    }

    // Creamos un objeto específico con la variante elegida
    // (Opcional: podriamos modificar la clase carrito para soportar variantes, 
    // pero para este ejercicio simplificado usaremos el producto base)
    
    carrito.agregarProducto(productoActual);

    // Feedback visual
    const msg = document.getElementById('msgFeedback');
    msg.textContent = `¡${productoActual.nombre} añadido a la cesta!`;
    msg.style.display = 'block';
    
    // Ocultar mensaje a los 3 segundos
    setTimeout(() => {
        msg.style.display = 'none';
    }, 3000);
}

/**
 * REQUISITO: Productos Vistos Recientemente
 * Guarda en LocalStorage y avisa al servidor
 */
async function registrarVisita(idProducto) {
    const usuario = sesion.getUsuario();
    const key = 'productos_vistos';

    // 1. Guardar en LocalStorage
    let vistos = JSON.parse(localStorage.getItem(key)) || [];
    // Evitar duplicados consecutivos
    vistos = vistos.filter(id => id !== parseInt(idProducto));
    vistos.unshift(parseInt(idProducto)); // Añadir al principio
    // Limitar a 10
    if (vistos.length > 10) vistos.pop();
    
    localStorage.setItem(key, JSON.stringify(vistos));

    // 2. Enviar al Servidor (API que creamos en server.js)
    // Esto cumple el requisito: "Esta información puede ser utilizada para mostrar recomendaciones"
    try {
        await fetch('/api/productos-vistos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': sesion.getToken()
            },
            body: JSON.stringify({
                idProducto: parseInt(idProducto),
                idUsuario: usuario.id
            })
        });
        // No necesitamos hacer nada con la respuesta, es "fire and forget"
    } catch (error) {
        console.warn("No se pudo sincronizar vistos con el servidor");
    }
}