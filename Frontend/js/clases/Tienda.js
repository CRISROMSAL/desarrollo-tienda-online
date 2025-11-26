/**
 * CLASE: Tienda
 * Esta clase es el "Gestor del Catálogo".
 * Se encarga de:
 * 1. Leer los datos de productos y categorías desde la memoria del navegador (LocalStorage).
 * 2. Filtrar estos datos (por categoría, por ID, destacados...).
 * 3. Generar el código HTML (renderizar) para mostrar las tarjetas en pantalla.
 */
export class Tienda {
    constructor() {
        // Clave para recuperar los datos guardados durante el Login.
        // Debe coincidir exactamente con la usada en Sesion.js
        this.storeKey = 'tienda_datos'; 
        
        // Cargamos los datos en memoria nada más crear la instancia de la clase
        this.datos = this.cargarDatos();
    }

    /**
     * Recupera y convierte el JSON gigante almacenado en LocalStorage.
     * Esto evita tener que pedir los datos al servidor cada vez que hacemos clic.
     */
    cargarDatos() {
        const datosGuardados = localStorage.getItem(this.storeKey);
        
        // Validación de seguridad: si no hay datos, algo fue mal en el Login
        if (!datosGuardados) {
            console.error("No hay datos de la tienda en LocalStorage");
            return null;
        }
        
        // Convertimos el texto JSON a un Objeto JavaScript manipulable
        return JSON.parse(datosGuardados);
    }

    // --- MÉTODOS DE BÚSQUEDA (GETTERS) ---

    /**
     * Devuelve la lista completa de categorías.
     */
    getCategorias() {
        // Operador ternario: si hay datos devuelve categorías, si no array vacío (para evitar errores)
        return this.datos ? this.datos.categorias : [];
    }

    /**
     * Filtra y devuelve solo los productos marcados como 'destacado: true'.
     * Se usa para el carrusel de la página principal.
     */
    getProductosDestacados() {
        if (!this.datos) return [];
        return this.datos.productos.filter(prod => prod.destacado === true);
    }

    /**
     * Filtra los productos que pertenecen a una categoría específica.
     * @param {number|string} idCategoria - El ID de la categoría a mostrar.
     */
    getProductosPorCategoria(idCategoria) {
        if (!this.datos) return [];
        // Usamos parseInt porque el ID puede venir como string desde la URL ("1")
        // y en el JSON es un número (1).
        return this.datos.productos.filter(prod => prod.id_categoria === parseInt(idCategoria));
    }

    /**
     * Busca un producto único por su ID.
     * Se usa para la página de detalle de producto.
     */
    getProductoPorId(id) {
        if (!this.datos) return null;
        // .find devuelve el primer elemento que coincide (o undefined)
        return this.datos.productos.find(prod => prod.id === parseInt(id));
    }

    // --- MÉTODOS DE RENDERIZADO (Generación de HTML) ---

    /**
     * Genera el HTML de las tarjetas de categorías y lo inyecta en la página.
     * @param {string} contenedorId - El ID del <div> donde se pintarán.
     */
    renderizarCategorias(contenedorId) {
        // Seleccionamos el contenedor del DOM
        const contenedor = document.getElementById(contenedorId);
        const categorias = this.getCategorias();

        // Si el contenedor no existe en esta página, salimos sin hacer nada
        if (!contenedor) return;

        // .map transforma cada objeto categoría en un string de HTML
        contenedor.innerHTML = categorias.map(cat => `
            <div class="card-category" onclick="window.location.href='categorias.html?cat=${cat.id}'">
                <img src="${cat.imagen}" alt="${cat.nombre}">
                <h3>${cat.nombre}</h3>
            </div>
        `).join(''); // .join('') une todos los strings en uno solo sin comas
    }

    /**
     * Genera el HTML de las tarjetas de productos.
     * IMPORTANTE: Esta función refleja el cambio de UX (Experiencia de Usuario).
     * El botón redirige a la ficha del producto en vez de añadir al carrito directamente,
     * obligando al usuario a elegir talla y color.
     */
    renderizarProductos(contenedorId, listaProductos) {
        const contenedor = document.getElementById(contenedorId);
        
        if (!contenedor) return;

        // Feedback visual si la lista está vacía (ej: categoría sin productos)
        if (listaProductos.length === 0) {
            contenedor.innerHTML = '<p>No hay productos disponibles.</p>';
            return;
        }

        // Generación dinámica de tarjetas
        contenedor.innerHTML = listaProductos.map(prod => `
            <article class="card-product">
                <img src="${prod.imagen}" alt="${prod.nombre}" onclick="window.location.href='producto.html?id=${prod.id}'" style="cursor:pointer;">
                
                <div class="card-info">
                    <h3 onclick="window.location.href='producto.html?id=${prod.id}'" style="cursor:pointer;">${prod.nombre}</h3>
                    
                    <p class="price">${parseFloat(prod.precio).toFixed(2)}€</p>
                    
                    <button class="btn-primary" onclick="window.location.href='producto.html?id=${prod.id}'">
                        VER OPCIONES
                    </button>
                </div>
            </article>
        `).join('');
    }
}