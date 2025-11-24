const express = require('express');
const cors = require('cors');
const crypto = require('crypto'); // Necesario para tu JWT manual
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// CLAVE SECRETA (No la compartas en producción real)
const SECRET_KEY = 'miClaveSecretaSuperSegura2024TiendaModa';

// ============================================
// MIDDLEWARES GLOBALES
// ============================================
app.use(cors());
app.use(express.json());
// Servimos la carpeta 'public' que está un nivel arriba
app.use(express.static(path.join(__dirname, '../Frontend')));

// ============================================
// 🔐 FUNCIONES JWT MANUALES (Requisito Profesor)
// ============================================

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return Buffer.from(str, 'base64').toString('utf-8');
}

function crearFirma(header, payload) {
  const data = `${header}.${payload}`;
  return crypto
    .createHmac('sha256', SECRET_KEY)
    .update(data)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function generarToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerEncoded = base64UrlEncode(JSON.stringify(header));

  const now = Math.floor(Date.now() / 1000);
  const payloadCompleto = {
    ...payload,
    iat: now,
    exp: now + (24 * 60 * 60) // Expira en 24 horas
  };
  const payloadEncoded = base64UrlEncode(JSON.stringify(payloadCompleto));

  const signature = crearFirma(headerEncoded, payloadEncoded);

  return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

function verificarToken(token) {
  try {
    const partes = token.split('.');
    if (partes.length !== 3) return null;

    const [headerEncoded, payloadEncoded, signatureRecibida] = partes;
    const signatureCalculada = crearFirma(headerEncoded, payloadEncoded);
    
    if (signatureRecibida !== signatureCalculada) return null; // Firma inválida

    const payload = JSON.parse(base64UrlDecode(payloadEncoded));
    const now = Math.floor(Date.now() / 1000);
    
    if (payload.exp && payload.exp < now) return null; // Token expirado

    return payload;
  } catch (error) {
    return null;
  }
}

// Middleware de Protección
function middlewareAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ error: true, mensaje: 'Token no proporcionado' });
  }

  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : authHeader;

  const payload = verificarToken(token);
  
  if (!payload) {
    return res.status(401).json({ error: true, mensaje: 'Token inválido o expirado' });
  }

  req.usuario = payload; // Guardamos datos del usuario en la petición
  next();
}

// ============================================
// 📂 CARGAR DATOS JSON
// ============================================
let usuarios = [];
let tienda = {};
let productosVistosPorUsuario = {}; // Memoria volátil para vistos

function cargarDatos() {
  try {
    const usuariosPath = path.join(__dirname, 'data', 'usuarios.json');
    const tiendaPath = path.join(__dirname, 'data', 'tienda.json');
    
    usuarios = JSON.parse(fs.readFileSync(usuariosPath, 'utf-8')).usuarios;
    tienda = JSON.parse(fs.readFileSync(tiendaPath, 'utf-8'));
    
    console.log('✅ Datos cargados correctamente en memoria.');
  } catch (error) {
    console.error('❌ Error cargando datos:', error.message);
    process.exit(1);
  }
}

cargarDatos();

// ============================================
// 🚀 ENDPOINTS API
// ============================================

/**
 * LOGIN: Devuelve Token + TODA la Tienda (Categorías y Productos)
 * para cumplir el requisito de no consultar más al servidor.
 */
app.post('/api/login', (req, res) => {
  const { usuario, password } = req.body;
  console.log(`🔑 Login intentado por: ${usuario}`);

  const userFound = usuarios.find(u => u.usuario === usuario && u.password === password);

  if (!userFound) {
    return res.status(401).json({ error: true, mensaje: 'Credenciales incorrectas' });
  }

  // Generamos JWT Real
  const token = generarToken({
    id: userFound.id,
    usuario: userFound.usuario,
    nombre: userFound.nombre
  });

  // Inicializar historial si no existe
  if (!productosVistosPorUsuario[userFound.id]) {
    productosVistosPorUsuario[userFound.id] = [];
  }

  res.json({
    error: false,
    mensaje: 'Bienvenido a la tienda',
    token: token,
    usuario: { id: userFound.id, nombre: userFound.nombre },
    // AQUI ESTÁ LA CLAVE: Enviamos todo para guardar en LocalStorage
    tienda: tienda,
    productosVistos: productosVistosPorUsuario[userFound.id]
  });
});

/**
 * CARRITO: Valida precios en el servidor por seguridad.
 */
app.post('/api/carrito', middlewareAuth, (req, res) => {
    const { carrito } = req.body;
    const usuarioLogueado = req.usuario; // Viene del token

    console.log(`🛒 Procesando pedido de ${usuarioLogueado.usuario}`);

    if (!carrito || !Array.isArray(carrito) || carrito.length === 0) {
        return res.status(400).json({ error: true, mensaje: 'El carrito está vacío o es inválido' });
    }

    let totalReal = 0;
    const productosValidados = [];

    // Validamos cada item contra la base de datos original (tienda.json)
    for (const itemCliente of carrito) {
        const productoOriginal = tienda.productos.find(p => p.id === itemCliente.id);

        if (!productoOriginal) {
            return res.status(400).json({ error: true, mensaje: `Producto ID ${itemCliente.id} ya no existe.` });
        }

        // Validación de precio (Seguridad anti-hackeo)
        if (productoOriginal.precio !== itemCliente.precio) {
             return res.status(400).json({ 
                error: true, 
                mensaje: `Discrepancia de precio en ${productoOriginal.nombre}. Precio actual: ${productoOriginal.precio}€` 
            });
        }

        totalReal += productoOriginal.precio * itemCliente.cantidad;
        productosValidados.push({
            id: productoOriginal.id,
            nombre: productoOriginal.nombre,
            precio: productoOriginal.precio,
            cantidad: itemCliente.cantidad,
            subtotal: productoOriginal.precio * itemCliente.cantidad
        });
    }

    // Respuesta de éxito
    const pedidoId = `PED-${Date.now()}-${usuarioLogueado.id}`;
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
 * PRODUCTOS VISTOS: Registra historial en servidor (opcional, pero buena práctica)
 */
app.post('/api/productos-vistos', middlewareAuth, (req, res) => {
    const { idProducto } = req.body;
    const userId = req.usuario.id;

    if (!productosVistosPorUsuario[userId]) productosVistosPorUsuario[userId] = [];
    
    // Evitar duplicados consecutivos y limitar tamaño
    const lista = productosVistosPorUsuario[userId];
    const index = lista.indexOf(idProducto);
    
    if (index > -1) lista.splice(index, 1); // Lo quitamos de su posición actual
    lista.unshift(idProducto); // Lo ponemos al principio
    
    if (lista.length > 10) lista.pop(); // Mantener solo los últimos 10

    res.json({ error: false, status: 'ok' });
});

// Redirección si entran a la raíz
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

// Iniciar Servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor (Node + JWT Real) corriendo en http://localhost:${PORT}`);
});