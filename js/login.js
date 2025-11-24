const express = require('express');
const router = express.Router();
const { generarToken, usuarios, tienda } = require('./server');

/**
 * POST /api/login
 * Autentica al usuario y devuelve token + info completa de la tienda
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  console.log('🔐 Intento de login:', username);

  // Validar campos obligatorios
  if (!username || !password) {
    return res.status(400).json({
      error: true,
      mensaje: 'Usuario y contraseña son obligatorios'
    });
  }

  // Buscar usuario en la base de datos
  const usuario = usuarios.find(
    u => u.username === username && u.password === password
  );

  if (!usuario) {
    console.log('❌ Login fallido: credenciales incorrectas');
    return res.status(401).json({
      error: true,
      mensaje: 'Usuario o contraseña incorrectos'
    });
  }

  // Generar token JWT
  const token = generarToken({
    id: usuario.id,
    username: usuario.username
  });

  console.log('✅ Login exitoso:', username);

  // Responder con token y TODA la información de la tienda
  res.json({
    error: false,
    mensaje: 'Login exitoso',
    token: token,
    usuario: {
      id: usuario.id,
      username: usuario.username
    },
    tienda: {
      categorias: tienda.categorias,
      productos: tienda.productos
    }
  });
});

module.exports = router;