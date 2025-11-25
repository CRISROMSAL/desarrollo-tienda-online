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
                return true;
            } else {
                alert(data.mensaje);
                return false;
            }
        } catch (error) {
            console.error('Error:', error);
            return false;
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

    logout() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        localStorage.removeItem(this.storeKey);
        localStorage.removeItem(this.vistosKey);
        localStorage.removeItem('carrito_compras');
        
        window.location.href = 'login.html';
    }
}