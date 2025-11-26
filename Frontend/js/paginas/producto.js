/**
 * CONTROLADOR: producto.js
 * Este script gestiona la página de detalle de un producto individual.
 * Sus responsabilidades son:
 * 1. Leer el ID del producto de la URL (ej: producto.html?id=1).
 * 2. Buscar los datos del producto usando la clase Tienda.
 * 3. Renderizar la información (Foto, Precio, Descripción).
 * 4. Generar dinámicamente los botones de Talla y Color.
 * 5. Gestionar la selección del usuario y validar antes de añadir al carrito.
 */

import { Sesion } from '/js/clases/Sesion.js';
import { Tienda } from '/js/clases/Tienda.js';
import { Carrito } from '/js/clases/Carrito.js';

// Instanciamos las clases necesarias
const sesion = new Sesion();
const tienda = new Tienda();
const carrito = new Carrito();

// Variables de estado para controlar qué ha elegido el usuario
let productoActual = null;  // Guardará el objeto producto completo
let seleccionColor = null;  // Guardará el color elegido (ej: "Rojo")
let seleccionTalla = null;  // Guardará la talla elegida (ej: "M")

// SEGURIDAD: Si no hay usuario logueado, lo mandamos al login
if (!sesion.estaAutenticado()) {
    window.location.href = 'login.html';
}

// Al cargar la página, iniciamos la lógica
document.addEventListener('DOMContentLoaded', () => {
    // Actualizamos el número del carrito en el menú
    carrito.actualizarContadorUI();
    // Cargamos los datos del producto
    cargarProducto();
});

/**
 * Lee la URL, busca el producto y si existe, llama a pintarlo.
 */
function cargarProducto() {
    // URLSearchParams nos permite leer lo que hay después del '?' en la dirección web
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    // Si alguien entra sin ID (ej: borrando la URL), lo devolvemos al inicio
    if (!id) {
        window.location.href = 'dashboard.html';
        return;
    }

    // Buscamos el producto en la "memoria" (LocalStorage) a través de la clase Tienda
    productoActual = tienda.getProductoPorId(id);

    // Si el ID no existe en nuestra base de datos
    if (!productoActual) {
        alert("Producto no encontrado"); // Fallback de seguridad
        window.location.href = 'dashboard.html';
        return;
    }

    // Si todo va bien, pintamos el HTML
    renderizarDetalle();
}

/**
 * Rellena el HTML con los datos del producto y genera los botones de opciones.
 */
function renderizarDetalle() {
    // Inyectamos texto e imagen en el HTML estático
    document.getElementById('imgDetalle').src = productoActual.imagen;
    document.getElementById('tituloDetalle').textContent = productoActual.nombre;
    document.getElementById('precioDetalle').textContent = `${productoActual.precio}€`;
    // El operador || "Sin descripción" es un fallback por si el campo viene vacío
    document.getElementById('descDetalle').textContent = productoActual.descripcion || "Sin descripción";

    // --- RENDERIZADO DINÁMICO DE COLORES ---
    const coloresContainer = document.getElementById('coloresContainer');
    if (productoActual.colores) {
        // Recorremos el array de colores (ej: ["Rosa", "Blanco"])
        productoActual.colores.forEach(color => {
            // Creamos un botón <button> en memoria
            const btn = document.createElement('button');
            btn.textContent = color;
            btn.className = 'btn-option'; // Clase CSS para el estilo
            
            // Asignamos el evento click a este botón específico
            btn.onclick = () => {
                // 1. Quitamos la clase 'selected' de todos los botones (reseteo visual)
                document.querySelectorAll('#coloresContainer .btn-option').forEach(b => b.classList.remove('selected'));
                // 2. Ponemos la clase 'selected' solo a este (feedback visual)
                btn.classList.add('selected');
                // 3. Guardamos la elección en la variable global
                seleccionColor = color;
            };
            // Añadimos el botón al HTML real
            coloresContainer.appendChild(btn);
        });
    }

    // --- RENDERIZADO DINÁMICO DE TALLAS ---
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

    // Configurar el botón de comprar
    document.getElementById('btnAgregar').addEventListener('click', agregarAlCarrito);

    // HISTORIAL: Registramos que el usuario ha visto este producto (Requisito "Vistos Recientemente")
    sesion.registrarProductoVisto(productoActual.id);
}

/**
 * Gestiona el clic en "Añadir a la Cesta".
 * Valida y crea el producto con variantes.
 */
function agregarAlCarrito() {
    // 1. VALIDACIÓN: Obligamos a elegir color y talla
    if (!seleccionColor || !seleccionTalla) {
        // Usamos la función de feedback inline (mensaje rojo) en vez de alert
        mostrarFeedback("Por favor, selecciona un color y una talla.", "error");
        return;
    }

    // 2. CREACIÓN DEL OBJETO VARIANTE
    // El producto en el carrito es distinto al del catálogo porque tiene talla/color específicos.
    const productoVariante = {
        ...productoActual, // Copiamos todas las propiedades originales (precio, imagen...)
        // Generamos un ID compuesto único para diferenciar "Camisa Roja M" de "Camisa Azul L"
        id: `${productoActual.id}-${seleccionColor}-${seleccionTalla}`, 
        // Modificamos el nombre para que el usuario vea qué eligió en el carrito
        nombre: `${productoActual.nombre} (${seleccionColor}, ${seleccionTalla})`,
        variantColor: seleccionColor,
        variantTalla: seleccionTalla
    };

    // 3. Llamamos a la clase Carrito para guardarlo
    carrito.agregarProducto(productoVariante);

    // 4. Mostramos mensaje de éxito (verde)
    mostrarFeedback(`¡${productoActual.nombre} añadido a la cesta!`, "success");
}

/**
 * Función auxiliar para mostrar mensajes en pantalla (Inline Validation).
 * Sustituye a los antiguos 'alerts'.
 * @param {string} texto - El mensaje a mostrar.
 * @param {string} tipo - 'success' (verde) o 'error' (rojo).
 */
function mostrarFeedback(texto, tipo) {
    const msg = document.getElementById('msgFeedback'); // Elemento <p> en el HTML
    
    if (msg) {
        msg.textContent = texto;
        // Cambiamos la clase CSS dinámicamente
        msg.className = 'feedback-msg ' + tipo; 
        msg.style.display = 'block';

        // Si es un mensaje de éxito, lo ocultamos automáticamente a los 3 segundos
        if (tipo === 'success') {
            setTimeout(() => {
                msg.style.display = 'none';
            }, 3000);
        }
    } else {
        console.error("No encuentro el elemento msgFeedback en el HTML");
    }
}