export class Sesion {
    constructor() {
        // Claves para guardar datos en el navegador
        this.tokenKey = 'tienda_token';
        this.userKey = 'tienda_usuario';
        this.storeKey = 'tienda_datos'; // Aquí va el JSON gigante de la tienda
        this.vistosKey = 'productos_vistos';
    }

    /**
     * Envía usuario y contraseña al servidor.
     * Si es correcto, guarda TODOS los datos en LocalStorage.
     */
    async login(usuario, password) {
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ usuario, password })
            });

            const data = await response.json();

            if (!data.error) {
                // EXITO: Guardamos la "foto" completa de la tienda
                this.guardarDatosSesion(data);
                return true;
            } else {
                // ERROR: Credenciales malas
                alert(data.mensaje);
                return false;
            }
        } catch (error) {
            console.error('Error de conexión:', error);
            alert('Error al conectar con el servidor.');
            return false;
        }
    }

    /**
     * Método privado para organizar el guardado en LocalStorage
     */
    guardarDatosSesion(data) {
        localStorage.setItem(this.tokenKey, data.token);
        localStorage.setItem(this.userKey, JSON.stringify(data.usuario));
        
        // REQUISITO CLAVE: Guardamos productos y categorías para uso offline
        localStorage.setItem(this.storeKey, JSON.stringify(data.tienda));
        
        // Historial de vistos (si existe)
        if (data.productosVistos) {
            localStorage.setItem(this.vistosKey, JSON.stringify(data.productosVistos));
        }
    }

    /**
     * Verifica si hay alguien logueado
     */
    estaAutenticado() {
        return localStorage.getItem(this.tokenKey) !== null;
    }

    /**
     * Cierra sesión y limpia TODO (Requisito 8)
     */
    logout() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        localStorage.removeItem(this.storeKey);
        localStorage.removeItem(this.vistosKey);
        localStorage.removeItem('carrito_compras'); // Limpiamos carrito también
        
        window.location.href = 'login.html';
    }
}