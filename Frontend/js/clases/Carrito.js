/** 
 * CLASE: Carrito
 * Esta clase gestiona el estado del carrito de compras.
 * Sus responsabilidades son:
 * 1. Añadir, eliminar y modificar cantidades de productos.
 * 2. Persistir los datos en LocalStorage (para no perder el carrito al recargar).
 * 3. Calcular totales y actualizar el contador visual en el menú.
 * 4. Procesar la compra comunicándose con el Backend (API).
 */
import { Sesion } from '/js/clases/Sesion.js';

export class Carrito {
    constructor() {
        // Clave única para guardar el carrito en el navegador
        this.key = 'carrito_compras';
        
        // Intentamos recuperar lo que había guardado. Si no hay nada, iniciamos un array vacío [].
        this.items = JSON.parse(localStorage.getItem(this.key)) || [];
        
        // Instanciamos la Sesión porque la necesitaremos para comprobar si el usuario está logueado al comprar
        this.sesion = new Sesion();
    }

    /**
     * Añade un producto al carrito.
     * Si el producto ya existe, solo incrementa la cantidad.
     */
    agregarProducto(producto) {
        // Buscamos si el producto ya está en el array (por su ID)
        const existe = this.items.find(item => item.id === producto.id);
        
        if (existe) {
            // Si ya existe, sumamos 1 a la cantidad
            existe.cantidad++;
        } else {
            // Si es nuevo, lo añadimos al array con cantidad inicial de 1.
            // Usamos el operador spread (...) para copiar las propiedades del producto.
            this.items.push({ ...producto, cantidad: 1 });
        }
        
        // Guardamos los cambios y actualizamos el numerito del menú
        this.guardar();
        this.actualizarContadorUI();
    }

    /**
     * Elimina un producto completamente del carrito.
     * @param {number|string} id - El ID del producto a borrar.
     */
    eliminarProducto(id) {
        // Filtramos el array: nos quedamos con todos MENOS el que tiene ese ID.
        // Usamos != (no estricto) para que funcione tanto si el ID es texto ("1") o número (1).
        this.items = this.items.filter(item => item.id != id);
        
        this.guardar();
        this.actualizarContadorUI();
    }

    /**
     * Cambia la cantidad de un producto (+ o -).
     */
    cambiarCantidad(id, cantidad) {
        // Buscamos el producto
        const item = this.items.find(p => p.id == id);
        
        if (item) {
            item.cantidad = cantidad;
            
            // Si la cantidad llega a 0 o menos, lo borramos del todo
            if (item.cantidad <= 0) {
                this.eliminarProducto(id);
            } else {
                // Si es válida, solo guardamos
                this.guardar();
            }
        }
    }

    /**
     * Guarda el estado actual del carrito en LocalStorage.
     */
    guardar() {
        localStorage.setItem(this.key, JSON.stringify(this.items));
    }

    /**
     * Devuelve la lista de productos para que la página pueda pintarlos.
     */
    getItems() {
        return this.items;
    }

    /**
     * Actualiza el número rojo (badge) en el icono del carrito del menú.
     */
    actualizarContadorUI() {
        const contador = document.getElementById('cartCount');
        
        // Verificamos que el elemento existe en el HTML actual (por si estamos en una página sin menú)
        if (contador) {
            // Usamos .reduce para sumar las cantidades de todos los productos
            const totalItems = this.items.reduce((acc, item) => acc + item.cantidad, 0);
            contador.textContent = totalItems;
        }
    }

    /**
     * Calcula el precio total de todo el carrito.
     */
    calcularTotal() {
        // Sumamos (Precio * Cantidad) de cada item
        return this.items.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    }

    /**
     * Borra todo el carrito (se usa al finalizar la compra o al hacer Logout).
     */
    vaciar() {
        this.items = [];
        this.guardar();
        this.actualizarContadorUI();
    }

    /**
     * MÉTODO CLAVE: Finalizar Compra.
     * Envía el pedido al servidor de forma segura.
     * Devuelve un objeto { status, mensaje } en lugar de usar alerts.
     */
    async procesarCompra() {
        // 1. Validar Seguridad: ¿El usuario ha iniciado sesión?
        if (!this.sesion.estaAutenticado()) {
            return { status: false, mensaje: "Debes iniciar sesión para comprar." };
        }

        // 2. Validar Lógica: ¿El carrito está vacío?
        if (this.items.length === 0) {
            return { status: false, mensaje: "Tu carrito está vacío." };
        }

        try {
            // Recuperamos el Token JWT para enviarlo al servidor
            const token = this.sesion.getToken();
            
            // 3. Petición POST al servidor (Endpoint protegido)
            const response = await fetch('/api/carrito', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    // ¡IMPORTANTE! Enviamos el token en la cabecera Authorization
                    // Esquema 'Bearer <token>' es el estándar de la industria.
                    'Authorization': `Bearer ${token}`
                },
                // Enviamos los productos del carrito
                body: JSON.stringify({ carrito: this.items })
            });

            // Esperamos la respuesta del servidor
            const data = await response.json();

            // 4. Comprobamos el resultado
            if (response.ok && !data.error) {
                // ÉXITO: El servidor aceptó la compra y validó los precios.
                this.vaciar(); // Limpiamos el carrito local
                return { status: true, mensaje: "Pedido realizado con éxito" };
            } else {
                // ERROR DE NEGOCIO: El servidor rechazó la compra (ej: precios manipulados)
                return { status: false, mensaje: data.mensaje || "Error al procesar el pedido" };
            }

        } catch (error) {
            // ERROR TÉCNICO: Fallo de red
            console.error(error);
            return { status: false, mensaje: "Error de conexión con el servidor" };
        }
    }
}