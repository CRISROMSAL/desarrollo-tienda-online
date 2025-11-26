import { Sesion } from '/js/clases/Sesion.js';

const sesion = new Sesion();

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    const feedbackBox = document.getElementById('loginFeedback'); // El div nuevo

    // Limpiamos mensajes anteriores
    feedbackBox.style.display = 'none';
    feedbackBox.className = 'feedback-msg';

    // Llamamos a la sesión (ahora nos devuelve un objeto, no un alert)
    const resultado = await sesion.login(user, pass);

    if (resultado.success) {
        // Éxito: Redirigimos
        window.location.href = 'dashboard.html';
    } else {
        // Error: Mostramos el mensaje en línea
        feedbackBox.textContent = resultado.mensaje; // "Credenciales incorrectas"
        feedbackBox.classList.add('error'); // Pone estilo rojo
        feedbackBox.style.display = 'block'; // Lo hace visible
    }
});