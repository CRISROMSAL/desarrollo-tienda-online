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
app.use(express.static(path.join(__dirname, '..')));

// ============================================
// FUNCIONES JWT MANUALES
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
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  const headerEncoded = base64UrlEncode(JSON.stringify(header));

  const now = Math.floor(Date.now() / 1000);
  const payloadCompleto = {
    ...payload,
    iat: now,
    exp: now + (24 * 60 * 60)
  };
  const payloadEncoded = base64UrlEncode(JSON.stringify(payloadCompleto));

  const signature = crearFirma(headerEncoded, payloadEncoded);

  return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

function verificarToken(token) {
  try {
    const partes = token.split('.');
    if (partes.length !== 3) {
      return null;
    }

    const [headerEncoded, payloadEncoded, signatureRecibida] = partes;

    const signatureCalculada = crearFirma(headerEncoded, payloadEncoded);
    if (signatureRecibida !== signatureCalculada) {
      console.log('❌ Firma inválida');
      return null;
    }

    const payload = JSON.parse(base64UrlDecode(payloadEncoded));

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
// ENDPOINTS API
// ============================================

// 🔐 LOGIN
app.post('/api/login', (req, res) => {
  const { usuario, password } = req.body;

  console.log('🔐 Intento de login:', usuario);

  if (!usuario || !password) {
    return res.status(400).json({
      error: true,
      mensaje: 'Usuario y contraseña son requeridos'
    });
  }

  const usuarioEncontrado = usuarios.find(
    u => u.usuario === usuario && u.password === password
  );

  if (!usuarioEncontrado) {
    console.log('❌ Login fallido');
    return res.status(401).json({
      error: true,
      mensaje: 'Credenciales incorrectas'
    });
  }

  const token = generarToken({
    id: usuarioEncontrado.id,
    usuario: usuarioEncontrado.usuario,
    nombre: usuarioEncontrado.nombre
  });

  console.log('✅ Login exitoso:', usuario);

  res.json({
    error: false,
    mensaje: 'Login exitoso',
    token: token,
    usuario: {
      id: usuarioEncontrado.id,
      usuario: usuarioEncontrado.usuario,
      nombre: usuarioEncontrado.nombre
    },
    tienda: {
      categorias: tienda.categorias,
      productos: tienda.productos
    }
  });
});

// 🏠 DASHBOARD
app.get('/api/dashboard', middlewareAuth, (req, res) => {
  console.log('📊 Dashboard solicitado por:', req.usuario.usuario);

  const destacados = tienda.productos.filter(p => p.destacado === true);

  res.json({
    error: false,
    usuario: req.usuario,
    productosDestacados: destacados,
    categorias: tienda.categorias,
    estadisticas: {
      totalProductos: tienda.productos.length,
      totalCategorias: tienda.categorias.length,
      productosDestacados: destacados.length
    }
  });
});

// 📂 CATEGORÍAS
app.get('/api/categorias', middlewareAuth, (req, res) => {
  console.log('📂 Categorías solicitadas por:', req.usuario.usuario);

  res.json({
    error: false,
    categorias: tienda.categorias
  });
});

app.get('/api/categorias/:id', middlewareAuth, (req, res) => {
  const categoriaId = parseInt(req.params.id);
  
  console.log('📂 Categoría solicitada:', categoriaId);

  const categoria = tienda.categorias.find(c => c.id === categoriaId);

  if (!categoria) {
    return res.status(404).json({
      error: true,
      mensaje: 'Categoría no encontrada'
    });
  }

  const productosCategoria = tienda.productos.filter(
    p => p.id_categoria === categoriaId
  );

  res.json({
    error: false,
    categoria: categoria,
    productos: productosCategoria
  });
});

// 🛍️ PRODUCTOS
app.get('/api/productos', middlewareAuth, (req, res) => {
  console.log('🛍️ Productos solicitados');

  res.json({
    error: false,
    productos: tienda.productos
  });
});

app.get('/api/productos/destacados', middlewareAuth, (req, res) => {
  console.log('⭐ Productos destacados solicitados');

  const destacados = tienda.productos.filter(p => p.destacado === true);

  res.json({
    error: false,
    productos: destacados
  });
});

app.get('/api/productos/:id', middlewareAuth, (req, res) => {
  const productoId = parseInt(req.params.id);
  
  console.log('🛍️ Producto solicitado:', productoId);

  const producto = tienda.productos.find(p => p.id === productoId);

  if (!producto) {
    return res.status(404).json({
      error: true,
      mensaje: 'Producto no encontrado'
    });
  }

  res.json({
    error: false,
    producto: producto
  });
});

// 🛒 CARRITO - VALIDACIÓN
app.post('/api/carrito/validar', middlewareAuth, (req, res) => {
  const { productos: productosCarrito } = req.body;

  console.log('🛒 Validando carrito de:', req.usuario.usuario);

  if (!productosCarrito || !Array.isArray(productosCarrito)) {
    return res.status(400).json({
      error: true,
      mensaje: 'Formato de carrito inválido'
    });
  }

  if (productosCarrito.length === 0) {
    return res.status(400).json({
      error: true,
      mensaje: 'El carrito está vacío'
    });
  }

  let precioTotalReal = 0;
  const errores = [];
  const productosValidados = [];

  for (const item of productosCarrito) {
    const productoReal = tienda.productos.find(p => p.id === item.id);

    if (!productoReal) {
      errores.push(`Producto con ID ${item.id} no existe`);
      continue;
    }

    if (productoReal.precio !== item.precio) {
      errores.push(
        `Precio manipulado en "${productoReal.nombre}". ` +
        `Real: ${productoReal.precio}€, Recibido: ${item.precio}€`
      );
      continue;
    }

    if (item.cantidad > productoReal.stock) {
      errores.push(
        `Stock insuficiente para "${productoReal.nombre}". ` +
        `Disponible: ${productoReal.stock}, Solicitado: ${item.cantidad}`
      );
      continue;
    }

    const subtotal = productoReal.precio * item.cantidad;
    precioTotalReal += subtotal;

    productosValidados.push({
      id: productoReal.id,
      nombre: productoReal.nombre,
      precio: productoReal.precio,
      cantidad: item.cantidad,
      subtotal: subtotal
    });
  }

  if (errores.length > 0) {
    console.log('❌ Validación fallida');
    return res.status(400).json({
      error: true,
      mensaje: 'Error en la validación del carrito',
      errores: errores
    });
  }

  const pedido = {
    id: `PED-${Date.now()}`,
    fecha: new Date().toISOString(),
    usuario: req.usuario.usuario,
    productos: productosValidados,
    total: precioTotalReal.toFixed(2)
  };

  console.log('✅ Carrito validado - Total:', pedido.total + '€');

  res.json({
    error: false,
    mensaje: '¡Pedido procesado correctamente!',
    pedido: pedido
  });
});

// ============================================
// RUTA RAÍZ
// ============================================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'login.html'));
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