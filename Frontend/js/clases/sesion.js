export class Sesion {
    constructor() {
        this.tokenKey = 'tienda_token';
        this.userKey = 'tienda_usuario';
        this.storeKey = 'tienda_datos';
        this.vistosKey = 'productos_vistos';
    }

    async login(usuario, password) {
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, password })
        });

        const data = await response.json();

        if (!data.error) {
            this.guardarDatosSesion(data);
            // Devuelve éxito
            return { success: true }; 
        } else {
            // Devuelve fallo y el mensaje del servidor
            return { success: false, mensaje: data.mensaje }; 
        }
    } catch (error) {
        console.error('Error:', error);
        return { success: false, mensaje: "Error de conexión con el servidor" };
    }
}

    guardarDatosSesion(data) {
        localStorage.setItem(this.tokenKey, data.token);
        localStorage.setItem(this.userKey, JSON.stringify(data.usuario));
        localStorage.setItem(this.storeKey, JSON.stringify(data.tienda));
        if (data.productosVistos) {
            localStorage.setItem(this.vistosKey, JSON.stringify(data.productosVistos));
        }
    }

    estaAutenticado() {
        return localStorage.getItem(this.tokenKey) !== null;
    }

    // ESTA ES LA FUNCIÓN QUE TE FALTABA Y DABA EL ERROR
    getUsuario() {
        const user = localStorage.getItem(this.userKey);
        return user ? JSON.parse(user) : null;
    }

    // ESTA TAMBIÉN ES IMPORTANTE
    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    // --- NUEVOS MÉTODOS PARA "VISTOS RECIENTEMENTE" ---

    registrarProductoVisto(idProducto) {
        // 1. Recuperamos la lista actual (o array vacío)
        let vistos = JSON.parse(localStorage.getItem(this.vistosKey)) || [];
        
        // 2. Convertimos a entero para asegurar
        const id = parseInt(idProducto);

        // 3. Eliminamos el ID si ya existía (para ponerlo luego al principio)
        vistos = vistos.filter(v => v !== id);

        // 4. Añadimos el nuevo al principio
        vistos.unshift(id);

        // 5. Limitamos a los últimos 4 productos
        if (vistos.length > 4) {
            vistos = vistos.slice(0, 4);
        }

        // 6. Guardamos en LocalStorage
        localStorage.setItem(this.vistosKey, JSON.stringify(vistos));
    }

    getProductosVistos() {
        return JSON.parse(localStorage.getItem(this.vistosKey)) || [];
    }


    logout() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        localStorage.removeItem(this.storeKey);
        localStorage.removeItem(this.vistosKey);
        localStorage.removeItem('carrito_compras');
        
        window.location.href = 'login.html';
    }
}