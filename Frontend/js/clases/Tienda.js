export class Tienda {
    constructor() {
        this.storeKey = 'tienda_datos'; 
        this.datos = this.cargarDatos();
    }

    cargarDatos() {
        const datosGuardados = localStorage.getItem(this.storeKey);
        if (!datosGuardados) {
            console.error("No hay datos de la tienda en LocalStorage");
            return null;
        }
        return JSON.parse(datosGuardados);
    }

    getCategorias() {
        return this.datos ? this.datos.categorias : [];
    }

    getProductosDestacados() {
        if (!this.datos) return [];
        return this.datos.productos.filter(prod => prod.destacado === true);
    }

    getProductosPorCategoria(idCategoria) {
        if (!this.datos) return [];
        // Convertimos a int porque el ID viene como número
        return this.datos.productos.filter(prod => prod.id_categoria === parseInt(idCategoria));
    }

    getProductoPorId(id) {
        if (!this.datos) return null;
        return this.datos.productos.find(prod => prod.id === parseInt(id));
    }

    // --- RENDERIZADO ---

    renderizarCategorias(contenedorId) {
        const contenedor = document.getElementById(contenedorId);
        const categorias = this.getCategorias();

        if (!contenedor) return;

        contenedor.innerHTML = categorias.map(cat => `
            <div class="card-category" onclick="window.location.href='categorias.html?cat=${cat.id}'">
                <img src="${cat.imagen}" alt="${cat.nombre}">
                <h3>${cat.nombre}</h3>
            </div>
        `).join('');
    }

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