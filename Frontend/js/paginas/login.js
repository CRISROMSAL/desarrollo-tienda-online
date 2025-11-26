/**
 * CONTROLADOR: login.js
 * Este script conecta el formulario HTML de Login con la lógica de negocio (Sesion.js).
 * Su función es:
 * 1. Escuchar cuando el usuario pulsa "Entrar".
 * 2. Evitar que la página se recargue (comportamiento estándar de los formularios).
 * 3. Enviar los datos a la clase Sesion.
 * 4. Mostrar el resultado (Redirigir o mostrar error en rojo).
 */

// Importamos la clase Sesion para poder usar sus métodos de conexión
import { Sesion } from '/js/clases/Sesion.js';

// Creamos una instancia de la clase para usarla en este script
const sesion = new Sesion();

// Buscamos el formulario por su ID y escuchamos el evento 'submit' (envío)
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    
    // IMPORTANTE: e.preventDefault() evita que el formulario recargue la página.
    // Esto es fundamental para que nuestra web funcione como una "Single Page Application" (SPA)
    // y podamos manejar el error con JavaScript sin perder los datos escritos.
    e.preventDefault();

    // Capturamos lo que el usuario ha escrito en los campos de texto
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    
    // Capturamos el <div> vacío que preparamos en el HTML para mostrar mensajes
    const feedbackBox = document.getElementById('loginFeedback'); 

    // --- UX (Experiencia de Usuario) ---
    // Antes de intentar entrar, limpiamos cualquier mensaje de error anterior.
    // Así, si el usuario falla 2 veces, ve que el mensaje parpadea o se limpia.
    feedbackBox.style.display = 'none';   // Lo ocultamos
    feedbackBox.className = 'feedback-msg'; // Le quitamos la clase 'error' (roja) por si la tenía

    // Llamamos al método login de la clase Sesion.
    // Usamos 'await' porque es una operación de red (tarda unos milisegundos).
    // La variable 'resultado' guardará el objeto { success: true/false, mensaje: "..." }
    const resultado = await sesion.login(user, pass);

    // Evaluamos la respuesta del servidor
    if (resultado.success) {
        // --- CASO DE ÉXITO ---
        // Si el login es correcto, redirigimos al usuario a la página principal (Dashboard).
        window.location.href = 'dashboard.html';
    } else {
        // --- CASO DE ERROR ---
        // Si falla (contraseña mal), NO usamos alert().
        // Escribimos el mensaje del servidor en el div de feedback.
        feedbackBox.textContent = resultado.mensaje; // Ej: "Credenciales incorrectas"
        
        // Añadimos la clase CSS '.error' para que salga con fondo rojo y texto rojo oscuro
        feedbackBox.classList.add('error'); 
        
        // Hacemos visible el div para que el usuario lo vea
        feedbackBox.style.display = 'block'; 
    }
});