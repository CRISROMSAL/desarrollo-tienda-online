/**
 * CLASE: Sesion
 * Esta clase actúa como un "Gestor de Estado" del cliente.
 * Su responsabilidad es manejar la persistencia de datos en el navegador
 * (LocalStorage) para que la web "recuerde" al usuario, su token y su historial
 * entre recargas de página.
 */
export class Sesion {
    constructor() {
        // Definimos las claves constantes para el LocalStorage.
        // Usar variables evita errores tipográficos (typos) al escribir las claves varias veces.
        this.tokenKey = 'tienda_token';       // Almacena el JWT (JSON Web Token)
        this.userKey = 'tienda_usuario';      // Almacena datos básicos (ID, Nombre)
        this.storeKey = 'tienda_datos';       // Almacena el catálogo completo (Caché offline)
        this.vistosKey = 'productos_vistos';  // Almacena el array de IDs de historial
    }

    /**
     * Realiza la autenticación contra el servidor (Backend).
     * @param {string} usuario - El input del usuario.
     * @param {string} password - La contraseña.
     * @returns {Object} - Retorna { success: true/false } para que la UI decida qué mostrar.
     */
    async login(usuario, password) {
        try {
            // Hacemos una petición POST asíncrona al endpoint de login
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario, password }) // Convertimos el objeto JS a texto JSON
            });

            // Esperamos a que el servidor responda y convertimos la respuesta a objeto
            const data = await response.json();

            // Verificamos si la lógica del servidor devolvió algún error
            if (!data.error) {
                // ÉXITO: El servidor nos ha dado el Token y los datos.
                this.guardarDatosSesion(data);
                
                // Retornamos éxito para que el controlador (login.js) redirija al dashboard
                return { success: true }; 
            } else {
                // ERROR DE CREDENCIALES: Contraseña incorrecta o usuario no existe.
                // Retornamos el mensaje del servidor para mostrarlo en rojo en el HTML.
                return { success: false, mensaje: data.mensaje }; 
            }
        } catch (error) {
            // ERROR DE RED: El servidor está caído o no hay internet.
            console.error('Error:', error);
            return { success: false, mensaje: "Error de conexión con el servidor" };
        }
    }

    /**
     * Guarda toda la información recibida del login en el navegador.
     * Esto permite mantener la sesión activa aunque se cierre la pestaña.
     */
    guardarDatosSesion(data) {
        // Guardamos el token tal cual (es un string)
        localStorage.setItem(this.tokenKey, data.token);
        
        // Guardamos usuario y tienda convirtiéndolos a String (LocalStorage solo guarda texto)
        localStorage.setItem(this.userKey, JSON.stringify(data.usuario));
        localStorage.setItem(this.storeKey, JSON.stringify(data.tienda));
        
        // Si el servidor nos devuelve un historial previo, lo restauramos
        if (data.productosVistos) {
            localStorage.setItem(this.vistosKey, JSON.stringify(data.productosVistos));
        }
    }

    /**
     * Verifica si existe un token guardado.
     * Se usa en todas las páginas para proteger el acceso (Redirección si es false).
     */
    estaAutenticado() {
        return localStorage.getItem(this.tokenKey) !== null;
    }

    /**
     * Recupera los datos del usuario logueado.
     * @returns {Object|null} - El objeto usuario o null si no hay sesión.
     */
    getUsuario() {
        const user = localStorage.getItem(this.userKey);
        // JSON.parse convierte el texto guardado de vuelta a un Objeto JavaScript utilizable
        return user ? JSON.parse(user) : null;
    }

    /**
     * Recupera el Token JWT crudo.
     * Necesario para enviarlo en las cabeceras 'Authorization' de las peticiones privadas.
     */
    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    // --- NUEVOS MÉTODOS PARA "VISTOS RECIENTEMENTE" ---

    /**
     * Algoritmo para gestionar el historial de navegación (LIFO/Cola limitada).
     * @param {number|string} idProducto - El ID del producto que se acaba de visitar.
     */
    registrarProductoVisto(idProducto) {
        // 1. Recuperamos la lista actual del almacenamiento (o creamos una vacía)
        let vistos = JSON.parse(localStorage.getItem(this.vistosKey)) || [];
        
        // 2. Convertimos a entero para asegurar consistencia en las comparaciones
        const id = parseInt(idProducto);

        // 3. Evitamos duplicados: Si el producto ya estaba en la lista, lo borramos...
        // ...porque queremos moverlo a la posición 1 (el más reciente)
        vistos = vistos.filter(v => v !== id);

        // 4. Añadimos el nuevo ID al principio del array
        vistos.unshift(id);

        // 5. Limitamos el tamaño del historial a 4 elementos
        if (vistos.length > 4) {
            vistos = vistos.slice(0, 4); // Cortamos el array si excede el límite
        }

        // 6. Guardamos la lista actualizada en LocalStorage
        localStorage.setItem(this.vistosKey, JSON.stringify(vistos));
    }

    /**
     * Devuelve la lista de IDs de productos vistos para pintarlos en el Dashboard.
     */
    getProductosVistos() {
        return JSON.parse(localStorage.getItem(this.vistosKey)) || [];
    }

    /**
     * Cierra la sesión del usuario.
     * Borra todos los datos sensibles del navegador y redirige al Login.
     */
    logout() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        localStorage.removeItem(this.storeKey);
        localStorage.removeItem(this.vistosKey);
        localStorage.removeItem('carrito_compras'); // También limpiamos el carrito por seguridad
        
        // Forzamos la redirección a la página de entrada
        window.location.href = 'login.html';
    }
}