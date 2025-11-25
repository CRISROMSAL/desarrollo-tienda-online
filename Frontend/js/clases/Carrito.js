export class Carrito {
    constructor() {
        this.key = 'carrito_compras'; // La clave para el LocalStorage
        this.items = this.cargarItems(); // Cargamos lo que hubiera guardado
    }

    /**
     * Carga los productos guardados en el navegador
     */
    cargarItems() {
        const guardado = localStorage.getItem(this.key);
        return guardado ? JSON.parse(guardado) : [];
    }

    /**
     * Guarda el estado actual en el navegador
     */
    guardar() {
        localStorage.setItem(this.key, JSON.stringify(this.items));
        this.actualizarContadorUI(); // Actualiza el numerito del menú
    }

    /**
     * Añade un producto. Si ya existe, aumenta su cantidad.
     * @param {Object} producto - Objeto con id, nombre, precio, imagen
     */
    agregarProducto(producto) {
        // Buscamos si el producto ya está en el carrito
        const existente = this.items.find(item => item.id === producto.id);

        if (existente) {
            // Si ya existe, solo sumamos 1 a la cantidad
            existente.cantidad++;
        } else {
            // Si es nuevo, lo añadimos con cantidad inicial 1
            // Aseguramos que precio sea número flotante
            this.items.push({
                ...producto,
                precio: parseFloat(producto.precio),
                cantidad: 1
            });
        }

        this.guardar();
        // Opcional: Podrías retornar true o lanzar una alerta visual aquí
        console.log("Producto añadido:", producto.nombre);
    }

    /**
     * Elimina un producto completamente del carrito por su ID
     */
    eliminarProducto(id) {
        this.items = this.items.filter(item => item.id !== parseInt(id));
        this.guardar();
    }

    /**
     * Cambia la cantidad de un producto específico (para la página cart.html)
     */
    cambiarCantidad(id, nuevaCantidad) {
        const item = this.items.find(i => i.id === parseInt(id));
        if (item) {
            item.cantidad = parseInt(nuevaCantidad);
            if (item.cantidad <= 0) {
                this.eliminarProducto(id);
            } else {
                this.guardar();
            }
        }
    }

    /**
     * Devuelve el precio total de todo el carrito
     */
    obtenerTotal() {
        return this.items.reduce((total, item) => total + (item.precio * item.cantidad), 0);
    }

    /**
     * Devuelve cuántos artículos hay en total (para el badge del menú)
     */
    obtenerCantidadTotal() {
        return this.items.reduce((total, item) => total + item.cantidad, 0);
    }

    /**
     * Vacía el carrito (ej. después de comprar)
     */
    vaciar() {
        this.items = [];
        localStorage.removeItem(this.key);
        this.actualizarContadorUI();
    }

    /**
     * Busca el elemento HTML del contador y lo actualiza
     */
    actualizarContadorUI() {
        const contador = document.getElementById('cartCount');
        if (contador) {
            contador.textContent = this.obtenerCantidadTotal();
        }
    }
}