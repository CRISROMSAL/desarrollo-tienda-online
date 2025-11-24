/**
 * login.js
 * Maneja el formulario de login y autenticación
 */

const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
  // Si ya está autenticado, redirigir al dashboard
  if (estaAutenticado()) {
    window.location.href = 'dashboard.html';
    return;
  }

  const loginForm = document.getElementById('login-form');
  const errorMessage = document.getElementById('error-message');
  const loadingSpinner = document.getElementById('loading-spinner');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const usuario = document.getElementById('usuario').value.trim();
    const password = document.getElementById('password').value;

    // Validación básica
    if (!usuario || !password) {
      mostrarError('Por favor, completa todos los campos');
      return;
    }

    // Mostrar spinner y ocultar error
    loadingSpinner.style.display = 'block';
    errorMessage.style.display = 'none';

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ usuario, password })
      });

      const data = await response.json();

      if (data.error) {
        mostrarError(data.mensaje || 'Error al iniciar sesión');
        loadingSpinner.style.display = 'none';
        return;
      }

      // Login exitoso
      console.log('✅ Login exitoso');

      // Guardar token
      guardarToken(data.token);

      // Guardar datos del usuario
      guardarUsuario(data.usuario);

      // Guardar información de la tienda
      guardarTienda(data.tienda);

      // Mostrar mensaje de éxito
      mostrarExito('¡Bienvenido! Redirigiendo...');

      // Redirigir al dashboard
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);

    } catch (error) {
      console.error('❌ Error en el login:', error);
      mostrarError('Error de conexión con el servidor');
      loadingSpinner.style.display = 'none';
    }
  });

  /**
   * Muestra un mensaje de error
   */
  function mostrarError(mensaje) {
    errorMessage.textContent = mensaje;
    errorMessage.className = 'message error';
    errorMessage.style.display = 'block';
  }

  /**
   * Muestra un mensaje de éxito
   */
  function mostrarExito(mensaje) {
    errorMessage.textContent = mensaje;
    errorMessage.className = 'message success';
    errorMessage.style.display = 'block';
  }
});