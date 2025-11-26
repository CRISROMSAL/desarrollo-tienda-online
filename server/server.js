
// IMPORTACIÓN DE MÓDULOS (Librerías necesarias)

const express = require('express'); // Importamos Express para crear el servidor web
const cors = require('cors');       // Importamos CORS para permitir peticiones desde el navegador
const crypto = require('crypto');   // Importamos Crypto para la encriptación manual (JWT)
const fs = require('fs');           // Importamos FileSystem para leer archivos del disco (.json)
const path = require('path');       // Importamos Path para manejar rutas de carpetas en Windows/Linux

// Inicializamos la aplicación de Express
const app = express();
// Definimos el puerto donde escuchará el servidor
const PORT = 3000;

// CLAVE SECRETA: Se usa para firmar digitalmente los tokens.
// Si alguien no tiene esta clave, no puede crear tokens válidos.
const SECRET_KEY = 'miClaveSecretaSuperSegura2024TiendaModa';


// MIDDLEWARES GLOBALES (Configuración inicial)

app.use(cors());          // Habilitamos CORS para evitar bloqueos de seguridad del navegador
app.use(express.json());  // Habilitamos la lectura de datos en formato JSON (para leer req.body)

// CONFIGURACIÓN DE ARCHIVOS ESTÁTICOS
// Le decimos al servidor que la carpeta '../Frontend' contiene la página web.
// __dirname es la carpeta actual (Backend). Subimos un nivel y entramos a Frontend.
app.use(express.static(path.join(__dirname, '../Frontend')));


//  FUNCIONES JWT MANUALES (Lógica de Seguridad)


// Función auxiliar: Codifica un texto a Base64 compatible con URL
function base64UrlEncode(str) {
  return Buffer.from(str)       // Convierte el texto a buffer binario
    .toString('base64')         // Lo pasa a Base64 estándar
    .replace(/\+/g, '-')        // Reemplaza '+' por '-' (seguro para URL)
    .replace(/\//g, '_')        // Reemplaza '/' por '_' (seguro para URL)
    .replace(/=/g, '');         // Elimina el relleno '=' del final
}

// Función auxiliar: Decodifica de Base64Url a texto normal
function base64UrlDecode(str) {
  // Restauramos los caracteres originales de Base64
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  // Añadimos el relleno '=' si falta para completar bloques de 4 caracteres
  while (str.length % 4) {
    str += '=';
  }
  // Decodificamos a texto legible (utf-8)
  return Buffer.from(str, 'base64').toString('utf-8');
}

// Función criptográfica: Crea la FIRMA del token
function crearFirma(header, payload) {
  // Unimos cabecera y datos con un punto
  const data = `${header}.${payload}`;
  // Usamos el módulo crypto para crear un hash HMAC con SHA256 y nuestra clave secreta
  return crypto
    .createHmac('sha256', SECRET_KEY)
    .update(data)        // Metemos los datos
    .digest('base64')    // Obtenemos el resultado en Base64
    .replace(/\+/g, '-') // Lo hacemos seguro para URL
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Función principal: Genera un Token nuevo cuando el usuario hace Login
function generarToken(payload) {
  // 1. HEADER: Definimos el algoritmo (HS256) y el tipo (JWT)
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerEncoded = base64UrlEncode(JSON.stringify(header));

  // 2. PAYLOAD: Datos del usuario + Fecha de expiración
  const now = Math.floor(Date.now() / 1000); // Hora actual en segundos
  const payloadCompleto = {
    ...payload,               // Copiamos los datos del usuario (id, nombre...)
    iat: now,                 // "Issued At" (Creado ahora)
    exp: now + (24 * 60 * 60) // "Expiration" (Caduca en 24 horas)
  };
  const payloadEncoded = base64UrlEncode(JSON.stringify(payloadCompleto));

  // 3. SIGNATURE: Creamos la firma para evitar falsificaciones
  const signature = crearFirma(headerEncoded, payloadEncoded);

  // Devolvemos el token completo: Header.Payload.Firma
  return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

// Función de verificación: Comprueba si un token recibido es válido
function verificarToken(token) {
  try {
    // Separamos el token en sus 3 partes
    const partes = token.split('.');
    if (partes.length !== 3) return null; // Si no tiene 3 partes, es falso

    const [headerEncoded, payloadEncoded, signatureRecibida] = partes;
    
    // Recalculamos la firma nosotros mismos con nuestra clave
    const signatureCalculada = crearFirma(headerEncoded, payloadEncoded);
    
    // Si la firma que llega no es igual a la calculada, el token está manipulado
    if (signatureRecibida !== signatureCalculada) return null; 

    // Decodificamos el payload para ver los datos
    const payload = JSON.parse(base64UrlDecode(payloadEncoded));
    const now = Math.floor(Date.now() / 1000);
    
    // Comprobamos si el token ha caducado
    if (payload.exp && payload.exp < now) return null; 

    return payload; // Todo correcto, devolvemos los datos del usuario
  } catch (error) {
    return null; // Si hay cualquier error, denegamos el acceso
  }
}

// MIDDLEWARE DE PROTECCIÓN
// Se ejecuta antes de las rutas privadas para bloquear accesos no autorizados
function middlewareAuth(req, res, next) {
  // Buscamos el token en la cabecera 'Authorization'
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    // Si no hay cabecera, error 401
    return res.status(401).json({ error: true, mensaje: 'Token no proporcionado' });
  }

  // Limpiamos el prefijo 'Bearer ' si viene en la cabecera
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : authHeader;

  // Verificamos el token
  const payload = verificarToken(token);
  
  if (!payload) {
    // Si la verificación falla, error 401
    return res.status(401).json({ error: true, mensaje: 'Token inválido o expirado' });
  }

  // Si es válido, guardamos la info del usuario en la petición (req) y dejamos pasar
  req.usuario = payload; 
  next(); // Pasa a la siguiente función (el endpoint real)
}


// CARGAR DATOS JSON (Base de datos en memoria)

let usuarios = []; // Array para guardar usuarios
let tienda = {};   // Objeto para guardar productos y categorías
let productosVistosPorUsuario = {}; // Objeto para guardar el historial de vistos

// Función para leer los archivos del disco duro
function cargarDatos() {
  try {
    // Definimos las rutas absolutas a los archivos JSON
    const usuariosPath = path.join(__dirname, 'data', 'usuarios.json');
    const tiendaPath = path.join(__dirname, 'data', 'tienda.json');
    
    // Leemos los archivos y los convertimos de Texto a Objeto JS (JSON.parse)
    usuarios = JSON.parse(fs.readFileSync(usuariosPath, 'utf-8')).usuarios;
    tienda = JSON.parse(fs.readFileSync(tiendaPath, 'utf-8'));
    
    console.log(' Datos cargados correctamente en memoria.');
  } catch (error) {
    // Si falla (ej: no existen los archivos), apagamos el servidor
    console.error(' Error cargando datos:', error.message);
    process.exit(1);
  }
}

// Ejecutamos la carga de datos al arrancar
cargarDatos();


// ENDPOINTS API (Rutas)


/**
 * LOGIN: (POST /api/login)
 * Recibe usuario y contraseña, devuelve Token y datos.
 */
app.post('/api/login', (req, res) => {
  const { usuario, password } = req.body; // Extraemos datos del cuerpo
  console.log(` Login intentado por: ${usuario}`);

  // Buscamos si el usuario existe en nuestro array cargado
  const userFound = usuarios.find(u => u.usuario === usuario && u.password === password);

  if (!userFound) {
    // Si no existe, error 401
    return res.status(401).json({ error: true, mensaje: 'Credenciales incorrectas' });
  }

  // Si existe, generamos su Token
  const token = generarToken({
    id: userFound.id,
    usuario: userFound.usuario,
    nombre: userFound.nombre
  });

  // Preparamos su historial de vistos (si no tenía, creamos array vacío)
  if (!productosVistosPorUsuario[userFound.id]) {
    productosVistosPorUsuario[userFound.id] = [];
  }

  // Respondemos al cliente con todo lo necesario
  res.json({
    error: false,
    mensaje: 'Bienvenido a la tienda',
    token: token,
    usuario: { id: userFound.id, nombre: userFound.nombre },
    // ESTRATEGIA: Enviamos toda la tienda para guardarla en LocalStorage
    tienda: tienda,
    productosVistos: productosVistosPorUsuario[userFound.id]
  });
});

/**
 * CARRITO: (POST /api/carrito)
 * Ruta protegida. Valida y procesa la compra.
 */
app.post('/api/carrito', middlewareAuth, (req, res) => {
    const { carrito } = req.body; // Extraemos el carrito enviado por el cliente
    const usuarioLogueado = req.usuario; // Extraemos el usuario del token verificado

    console.log(`🛒 Procesando pedido de ${usuarioLogueado.usuario}`);

    // Validación básica: que el carrito no esté vacío
    if (!carrito || !Array.isArray(carrito) || carrito.length === 0) {
        return res.status(400).json({ error: true, mensaje: 'El carrito está vacío o es inválido' });
    }

    let totalReal = 0; // Acumulador para el precio calculado en servidor
    const productosValidados = [];

    // Iteramos sobre cada producto del pedido
    for (const itemCliente of carrito) {
        
        // --- LÓGICA DE LIMPIEZA DE ID ---
        // El cliente envía "1-Rojo-M", pero en la BD el producto es el ID 1.
        let idParaBuscar = itemCliente.id;
        
        // Si es un string y tiene guión, nos quedamos con la parte de la izquierda
        if (typeof idParaBuscar === 'string' && idParaBuscar.includes('-')) {
            idParaBuscar = idParaBuscar.split('-')[0]; 
        }
        
        // Convertimos a número para buscar en el JSON
        const idReal = parseInt(idParaBuscar);

        // Buscamos el producto original en la memoria del servidor
        const productoOriginal = tienda.productos.find(p => p.id === idReal);

        if (!productoOriginal) {
            // Si no existe en la BD, rechazamos la compra
            return res.status(400).json({ error: true, mensaje: `Producto ID ${itemCliente.id} ya no existe.` });
        }

        // SEGURIDAD DE PRECIOS 
        // Comprobamos que el precio enviado por el cliente coincide con el real
        if (parseFloat(productoOriginal.precio) !== parseFloat(itemCliente.precio)) {
             // Si no coinciden, es un intento de hackeo o error
             return res.status(400).json({ 
                error: true, 
                mensaje: `Discrepancia de precio en ${productoOriginal.nombre}. Precio actual: ${productoOriginal.precio}€` 
            });
        }

        // Sumamos al total usando el precio fiable (el de la BD)
        totalReal += productoOriginal.precio * itemCliente.cantidad;
        
        // Añadimos a la lista de productos validados
        productosValidados.push({
            id: productoOriginal.id,
            nombre: itemCliente.nombre, // Mantenemos el nombre con variante (ej: Rosa, M)
            precio: productoOriginal.precio,
            cantidad: itemCliente.cantidad,
            subtotal: productoOriginal.precio * itemCliente.cantidad
        });
    }

    // Generamos un ID único de pedido
    const pedidoId = `PED-${Date.now()}-${usuarioLogueado.id}`;
    
    // Enviamos la respuesta de éxito
    res.json({
        error: false,
        mensaje: 'Pedido completado con éxito',
        pedido: {
            id: pedidoId,
            cliente: usuarioLogueado.nombre,
            total: totalReal.toFixed(2),
            productos: productosValidados
        }
    });
});

/**
 * HISTORIAL: (POST /api/productos-vistos)
 * Guarda qué productos ve el usuario.
 */
app.post('/api/productos-vistos', middlewareAuth, (req, res) => {
    const { idProducto } = req.body;
    const userId = req.usuario.id;

    // Inicializamos array si no existe
    if (!productosVistosPorUsuario[userId]) productosVistosPorUsuario[userId] = [];
    
    // Lógica FIFO (First In, First Out)
    const lista = productosVistosPorUsuario[userId];
    const index = lista.indexOf(idProducto);
    
    // Si ya estaba en la lista, lo quitamos para volver a ponerlo al principio
    if (index > -1) lista.splice(index, 1);
    
    // Lo añadimos al principio
    lista.unshift(idProducto);
    
    // Limitamos la lista a 10 elementos para no llenar la memoria
    if (lista.length > 10) lista.pop();

    res.json({ error: false, status: 'ok' });
});

// Ruta por defecto: Si entran a la raíz, redirigimos al login
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

// ARRANCAR EL SERVIDOR
app.listen(PORT, () => {
  console.log(` Servidor (Node + JWT Real) corriendo en http://localhost:${PORT}`);
});