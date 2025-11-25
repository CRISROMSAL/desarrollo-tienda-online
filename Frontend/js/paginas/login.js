// public/js/paginas/login.js
import { Sesion } from '/js/clases/Sesion.js';

// Instanciamos la clase (Programación Orientada a Objetos)
const sesion = new Sesion();

// Verificamos si ya estaba logueado para redirigir directamente
if (sesion.estaAutenticado()) {
    window.location.href = 'dashboard.html';
}

// Esperamos a que el HTML cargue completamente
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault(); // Evita que la página se recargue sola

            // Obtenemos los valores de los inputs
            // ¡ASEGÚRATE QUE EN TU HTML LOS INPUTS TENGAN ESTOS IDs!
            const usuarioInput = document.getElementById('username').value;
            const passwordInput = document.getElementById('password').value;

            // Llamamos a la clase Sesion
            const exito = await sesion.login(usuarioInput, passwordInput);

            if (exito) {
                // Si todo fue bien, redirigimos al Dashboard
                window.location.href = 'dashboard.html';
            }
        });
    } else {
        console.error('No se encontró el formulario con id="loginForm"');
    }
});