const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// CLAVE SECRETA para firmar JWT
const SECRET_KEY = 'miClaveSecretaSuperSegura2024TiendaModa';

// ============================================
// MIDDLEWARES GLOBALES
// ============================================
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

// ============================================
// FUNCIONES JWT MANUALES
// ============================================

/**
 * Codifica datos en Base64URL (formato JWT)
 */
function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Decodifica Base64URL a string
 */
function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return Buffer.from(str, 'base64').toString('utf-8');
}

/**
 * Crea la firma HMAC SHA256
 */
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

/**
 * GENERAR TOKEN JWT completo
 */
function generarToken(payload) {
  // 1. HEADER
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  const headerEncoded = base64UrlEncode(JSON.stringify(header));

  // 2. PAYLOAD
  const now = Math.floor(Date.now() / 1000);
  const payloadCompleto = {
    ...payload,
    iat: now,
    exp: now + (24 * 60 * 60) // 24 horas
  };
  const payloadEncoded = base64UrlEncode(JSON.stringify(payloadCompleto));

  // 3. SIGNATURE
  const signature = crearFirma(headerEncoded, payloadEncoded);

  // 4. TOKEN COMPLETO
  return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

/**
 * VERIFICAR TOKEN JWT
 */
function verificarToken(token) {
  try {
    const partes = token.split('.');
    if (partes.length !== 3) {
      return null;
    }

    const [headerEncoded, payloadEncoded, signatureRecibida] = partes;

    // Verificar firma
    const signatureCalculada = crearFirma(headerEncoded, payloadEncoded);
    if (signatureRecibida !== signatureCalculada) {
      console.log('❌ Firma inválida');
      return null;
    }

    // Decodificar payload
    const payload = JSON.parse(base64UrlDecode(payloadEncoded));

    // Verificar expiración
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      console.log('❌ Token expirado');
      return null;
    }

    return payload;
  } catch (error) {
    console.error('❌ Error verificando token:', error.message);
    return null;
  }
}

/**
 * MIDDLEWARE de autenticación
 */
function middlewareAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({
      error: true,
      mensaje: 'Token no proporcionado'
    });
  }

  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : authHeader;

  const payload = verificarToken(token);
  
  if (!payload) {
    return res.status(401).json({
      error: true,
      mensaje: 'Token inválido o expirado'
    });
  }

  req.usuario = payload;
  next();
}

// ============================================
// CARGAR DATOS JSON
// ============================================
let usuarios = [];
let tienda = {};

function cargarDatos() {
  try {
    const usuariosPath = path.join(__dirname, 'data', 'usuarios.json');
    const tiendaPath = path.join(__dirname, 'data', 'tienda.json');
    
    usuarios = JSON.parse(fs.readFileSync(usuariosPath, 'utf-8')).usuarios;
    tienda = JSON.parse(fs.readFileSync(tiendaPath, 'utf-8'));
    
    console.log('✅ Datos cargados correctamente');
    console.log(`   - ${usuarios.length} usuarios`);
    console.log(`   - ${tienda.categorias.length} categorías`);
    console.log(`   - ${tienda.productos.length} productos`);
  } catch (error) {
    console.error('❌ Error cargando datos:', error.message);
    process.exit(1);
  }
}

cargarDatos();

// ============================================
// EXPORTAR PARA USO EN RUTAS
// ============================================
module.exports = {
  app,
  generarToken,
  verificarToken,
  middlewareAuth,
  usuarios,
  tienda
};

// ============================================
// IMPORTAR RUTAS MODULARES
// ============================================
const loginRouter = require('./login');
const carritoRouter = require('./carrito');
const categoriaRouter = require('./categoria');
const dashboardRouter = require('./dashboard');
const productosRouter = require('./productos');

// Asignar rutas
app.use('/api', loginRouter);
app.use('/api', carritoRouter);
app.use('/api', categoriaRouter);
app.use('/api', dashboardRouter);
app.use('/api', productosRouter);

// ============================================
// RUTA RAÍZ
// ============================================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'login.html'));
});

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 ================================');
  console.log('🛍️  TIENDA ONLINE - SERVIDOR ACTIVO');
  console.log('🚀 ================================');
  console.log(`📡 Servidor: http://localhost:${PORT}`);
  console.log(`🔐 JWT: HS256 con expiración 24h`);
  console.log('🚀 ================================');
  console.log('');
});