export class Tienda {
    constructor() {
        this.storeKey = 'tienda_datos'; // La misma clave que usamos en Sesion.js
        this.datos = this.cargarDatos();
    }

    /**
     * Recupera el JSON gigante del LocalStorage
     */
    cargarDatos() {
        const datosGuardados = localStorage.getItem(this.storeKey);
        if (!datosGuardados) {
            console.error("No hay datos de la tienda en LocalStorage");
            return null;
        }
        return JSON.parse(datosGuardados);
    }

    /**
     * Devuelve todas las categorías
     */
    getCategorias() {
        return this.datos ? this.datos.categorias : [];
    }

    /**
     * Devuelve SOLO los productos marcados como 'destacado: true'
     */
    getProductosDestacados() {
        if (!this.datos) return [];
        return this.datos.productos.filter(prod => prod.destacado === true);
    }

    /**
     * Devuelve todos los productos de una categoría específica
     */
    getProductosPorCategoria(idCategoria) {
        if (!this.datos) return [];
        // Convertimos a int por si acaso vienen como string
        return this.datos.productos.filter(prod => prod.id_categoria === parseInt(idCategoria));
    }

    /**
     * Busca un producto por su ID
     */
    getProductoPorId(id) {
        if (!this.datos) return null;
        return this.datos.productos.find(prod => prod.id === parseInt(id));
    }

    // --- MÉTODOS DE RENDERIZADO (Generan HTML) ---

    /**
     * Pinta las categorías en el Dashboard
     */
    renderizarCategorias(contenedorId) {
        const contenedor = document.getElementById(contenedorId);
        const categorias = this.getCategorias();

        if (!contenedor) return;

        contenedor.innerHTML = categorias.map(cat => `
            <div class="card-category" onclick="window.location.href='categorias.html?id=${cat.id}'">
                <img src="${cat.imagen}" alt="${cat.nombre}">
                <h3>${cat.nombre}</h3>
            </div>
        `).join('');
    }

    /**
     * Pinta los productos (FALTABA ESTA FUNCIÓN)
     * Se usa tanto en Dashboard como en Categorías
     */
    renderizarProductos(contenedorId, listaProductos) {
        const contenedor = document.getElementById(contenedorId);
        
        if (!contenedor) return;

        if (listaProductos.length === 0) {
            contenedor.innerHTML = '<p>No hay productos disponibles.</p>';
            return;
        }

        contenedor.innerHTML = listaProductos.map(prod => `
            <article class="card-product">
                <img src="${prod.imagen}" alt="${prod.nombre}" onclick="window.location.href='producto.html?id=${prod.id}'" style="cursor:pointer;">
                
                <div class="card-info">
                    <h3 onclick="window.location.href='producto.html?id=${prod.id}'" style="cursor:pointer;">${prod.nombre}</h3>
                    <p class="price">${parseFloat(prod.precio).toFixed(2)}€</p>
                    <button class="btn-add-cart" data-id="${prod.id}">Añadir</button>
                </div>
            </article>
        `).join('');
    }
}