import { Sesion } from './Sesion.js';

export class Carrito {
    constructor() {
        this.key = 'carrito_compras';
        this.items = JSON.parse(localStorage.getItem(this.key)) || [];
        this.sesion = new Sesion();
    }

    agregarProducto(producto) {
        const existe = this.items.find(item => item.id === producto.id);
        
        if (existe) {
            existe.cantidad++;
        } else {
            this.items.push({ ...producto, cantidad: 1 });
        }
        
        this.guardar();
        this.actualizarContadorUI();
    }

    eliminarProducto(id) {
        this.items = this.items.filter(item => item.id != id);
        this.guardar();
        this.actualizarContadorUI();
    }

    cambiarCantidad(id, cantidad) {
        const item = this.items.find(p => p.id == id);
        if (item) {
            item.cantidad = cantidad;
            if (item.cantidad <= 0) this.eliminarProducto(id);
            else this.guardar();
        }
    }

    guardar() {
        localStorage.setItem(this.key, JSON.stringify(this.items));
    }

    getItems() {
        return this.items;
    }

    actualizarContadorUI() {
        const contador = document.getElementById('cartCount');
        if (contador) {
            const totalItems = this.items.reduce((acc, item) => acc + item.cantidad, 0);
            contador.textContent = totalItems;
        }
    }

    calcularTotal() {
        return this.items.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    }

    vaciar() {
        this.items = [];
        this.guardar();
        this.actualizarContadorUI();
    }

    // ESTA ES LA FUNCIÓN CLAVE PARA EVITAR ALERTS
    async procesarCompra() {
        // 1. Validar si hay usuario
        if (!this.sesion.estaAutenticado()) {
            return { status: false, mensaje: "Debes iniciar sesión para comprar." };
        }

        // 2. Validar carrito vacío
        if (this.items.length === 0) {
            return { status: false, mensaje: "Tu carrito está vacío." };
        }

        try {
            const token = this.sesion.getToken();
            
            // 3. Petición al servidor
            const response = await fetch('/api/carrito', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ carrito: this.items })
            });

            const data = await response.json();

            if (response.ok && !data.error) {
                // ÉXITO: Vaciamos carrito
                this.vaciar();
                return { status: true, mensaje: "Pedido realizado con éxito" };
            } else {
                // ERROR DEL SERVIDOR
                return { status: false, mensaje: data.mensaje || "Error al procesar el pedido" };
            }

        } catch (error) {
            console.error(error);
            return { status: false, mensaje: "Error de conexión con el servidor" };
        }
    }
}