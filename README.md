Este proyecto consiste en el desarrollo de una tienda online (SPA) construida desde cero utilizando JavaScript en el Frontend y Node.js en el Backend.

El objetivo principal ha sido crear una arquitectura robusta, segura y escalable sin depender de frameworks externos (como React o Angular), demostrando un dominio profundo de la manipulación del DOM, la gestión de estados asíncronos y la arquitectura de estilos profesional.

---

 Características Principales

* Autenticación Segura (JWT Manual): Implementación de Json Web Tokens construida desde cero (SHA256) para gestionar sesiones sin librerías externas.
* Gestión de Estado (Persistencia): El carrito y la sesión se mantienen activos tras recargar la página gracias al uso de localStorage.
* Seguridad: Validación de precios en el Backend para evitar manipulaciones del cliente.
* Carrito: Soporte para variantes de producto (Talla y Color) y cálculo de totales en tiempo real.
* Historial de Navegación: Funcionalidad de "Vistos Recientemente" 
* Arquitectura CSS Modular: Uso de SASS para un diseño mantenible y escalable.



 Arquitectura y Enfoque del Desarrollo

El proyecto se ha abordado siguiendo una separación estricta de responsabilidades (Patrón MVC ):

 1. Backend (server.js) 
Actúa como API REST y servidor de archivos estáticos.
* Seguridad: Implementa un middleware propio (`middlewareAuth`) que protege las rutas de compra.
* Lógica de Negocio: Al recibir un pedido, ignora los precios enviados por el frontend y busca los precios reales en la base de datos (tienda.json) para recalcular el total y evitar fraudes.
* Base de Datos: Utiliza archivos JSON como persistencia de datos ligera.

 2. Frontend - La Lógica (/js/clases/) 
Se ha optado por la Programación Orientada a Objetos (POO) para encapsular la lógica:
* Sesion.js: Gestiona el Login, el almacenamiento del Token y el historial de productos vistos.
* Tienda.js: Se encarga de descargar el catálogo una sola vez (caché) y renderizar dinámicamente el HTML de productos y categorías.
* Carrito.js: Administra el array de compras, gestiona cantidades, elimina items y se comunica con la API enviando el Token en las cabeceras.

 3. Frontend - Vistas y Controladores (/js/paginas/) 
Scripts específicos para cada página que conectan el HTML con las clases de lógica:
* login.js: Gestiona el formulario de entrada con feedback visual.
* dashboard.js: Coordina la pantalla principal, mostrando categorías, destacados y el historial.
* producto.js: Maneja la lógica de selección de variantes (Talla/Color) antes de permitir la compra.
* carrito.js: Renderiza el resumen de compra y gestiona el envío del pedido.

 4. Estilos (/css/scss/) 
Se ha migrado de un CSS monolítico a una arquitectura SASS (SCSS) modular:
* _variables.scss: Centraliza colores, fuentes y sombras.
* _components.scss: Estilos reutilizables (Botones, Tarjetas, Inputs).
* _layout.scss: Estructura principal (Navbar, Footer, Grids).
* main.scss: Archivo maestro que compila todo en un único CSS limpio.
