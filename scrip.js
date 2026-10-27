/* =========================================================
   Baby's Chic Shopie - lógica de la tienda
   Todo funciona dentro de index.html. Los datos (carrito,
   usuarios y pedidos) se guardan en el navegador con
   localStorage, como prototipo sin servidor.
   ========================================================= */

// ---------- 1. CATÁLOGO ----------
// Los productos y categorías están en productos.js
const nombreCategoria = slug => (categorias.find(c => c.slug === slug) || {}).nombre || slug;

const nombresEdad = { '0-6': '0 a 6 meses', '6-12': '6 a 12 meses', '12-24': '12 a 24 meses', '24-36': '2 a 3 años' };

const faqs = [
  { p: '¿Hacen envíos? ¿Cuánto cuesta?', r: 'Sí. Enviamos a domicilio en Cali y su área metropolitana (Jamundí, Yumbo, Palmira, Candelaria). El envío cuesta $8.000 y es gratis en compras desde $150.000. Llega en 1 a 3 días hábiles.', claves: ['envio', 'envios', 'domicilio', 'llega', 'entrega', 'demora', 'cuanto tarda'] },
  { p: '¿Cómo hago un cambio o devolución?', r: 'Tienes 15 días desde que recibes tu pedido para cambiar talla o producto. La prenda debe estar sin usar y con etiquetas. Si el producto llegó defectuoso, te devolvemos el dinero. Escríbenos por WhatsApp con tu número de pedido.', claves: ['cambio', 'cambiar', 'devolucion', 'devolver', 'reembolso', 'garantia', 'defectuoso'] },
  { p: '¿Qué medios de pago aceptan?', r: 'Tarjeta débito o crédito, PSE, Nequi, Daviplata y pago contraentrega en Cali. (En este prototipo el pago es simulado: no se cobra dinero real).', claves: ['pago', 'pagar', 'tarjeta', 'nequi', 'pse', 'contraentrega', 'daviplata', 'medios'] },
  { p: '¿Cómo elijo la talla correcta?', r: 'Guíate por la edad: 0-3M (hasta 6 kg), 3M (6-7 kg), 6M (7-8 kg), 9M (8-9 kg), 12M (9-10 kg), 18M (10-11 kg), 24M (11-12.5 kg), 3A (12.5-14 kg). Si tu bebé está entre dos tallas, elige la más grande.', claves: ['talla', 'tallas', 'medida', 'tamaño', 'kilos', 'peso'] },
  { p: '¿Necesito crear una cuenta para comprar?', r: 'Sí, crea tu cuenta con el botón "Ingresar". Así puedes ver el historial de tus pedidos en "Mis pedidos".', claves: ['cuenta', 'registro', 'registrar', 'login', 'ingresar', 'usuario', 'contraseña'] },
  { p: '¿Dónde están ubicados? ¿Cuál es el horario?', r: 'Somos una tienda 100% en línea de Santiago de Cali. Atendemos de lunes a sábado de 8 a.m. a 6 p.m. por WhatsApp (300 000 0000) y correo (contacto@babyschic.com).', claves: ['ubicacion', 'donde', 'direccion', 'horario', 'hora', 'whatsapp', 'telefono', 'contacto', 'correo', 'atienden'] }
];

// ---------- 2. UTILIDADES ----------
const $ = sel => document.querySelector(sel);
const precioCOP = n => '$' + n.toLocaleString('es-CO');
const sinTildes = t => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const buscarProducto = id => productos.find(p => p.id === Number(id));

function leer(clave, porDefecto) {
  try { return JSON.parse(localStorage.getItem(clave)) ?? porDefecto; } catch { return porDefecto; }
}
function guardar(clave, valor) {
  try { localStorage.setItem(clave, JSON.stringify(valor)); } catch { /* sin almacenamiento */ }
}

function aviso(texto) {
  const a = $('#aviso');
  a.textContent = texto;
  a.classList.add('visible');
  clearTimeout(a._t);
  a._t = setTimeout(() => a.classList.remove('visible'), 2500);
}

// ---------- 3. CATÁLOGO: categorías, búsqueda, filtros y "ver más" ----------
const lista = $('#lista-productos');
const POR_PAGINA = 12;
let mostrando = POR_PAGINA;

categorias.forEach(c => $('#filtro-categoria').insertAdjacentHTML('beforeend', `<option value="${c.slug}">${c.nombre}</option>`));

// Tarjetas de la sección "Categorías" (foto del primer producto nuevo de cada una)
$('#cat-grid').innerHTML = categorias.map(c => {
  const deCat = productos.filter(p => p.categoria === c.slug);
  const portada = deCat.find(p => p.img.includes('catalogo')) || deCat[0];
  return `<a href="#productos" class="cat" data-ir="${c.slug}">
      <img src="${portada.img}" alt="${c.nombre}" loading="lazy">
      <span>${c.nombre}<small>${deCat.length} productos</small></span>
    </a>`;
}).join('');

// "Desde $..." en las tarjetas de ofertas
document.querySelectorAll('[data-desde]').forEach(el => {
  const min = Math.min(...productos.filter(p => p.categoria === el.dataset.desde).map(p => p.precio));
  el.textContent = 'Desde ' + precioCOP(min);
});

// Botones rápidos encima del catálogo
$('#chips').innerHTML = `<button data-ir="">Todo</button>` +
  categorias.map(c => `<button data-ir="${c.slug}">${c.nombre}</button>`).join('');

function filtrados() {
  const texto = sinTildes($('#buscar').value.trim());
  const cat = $('#filtro-categoria').value;
  const edad = $('#filtro-edad').value;
  const orden = $('#ordenar').value;
  let res = productos.filter(p =>
    (!texto || sinTildes(p.nombre + ' ' + nombreCategoria(p.categoria) + ' ' + p.descripcion).includes(texto)) &&
    (!cat || p.categoria === cat) &&
    (!edad || p.edades.includes(edad))
  );
  if (orden === 'menor') res.sort((a, b) => a.precio - b.precio);
  if (orden === 'mayor') res.sort((a, b) => b.precio - a.precio);
  return res;
}

function mostrarProductos() {
  const res = filtrados();
  const cat = $('#filtro-categoria').value;
  const busqueda = $('#buscar').value.trim();
  $('#titulo-productos').textContent = busqueda ? `Resultados para "${busqueda}"` : cat ? nombreCategoria(cat) : 'Productos';
  document.querySelectorAll('#chips button').forEach(b => b.classList.toggle('activo', b.dataset.ir === cat));

  $('#resultado').textContent = res.length
    ? `${res.length} producto${res.length > 1 ? 's' : ''}`
    : 'No encontramos productos con esos filtros. Prueba con otra búsqueda.';

  lista.innerHTML = res.slice(0, mostrando).map(p => `
    <div class="product">
      <div class="product-img" data-detalle="${p.id}">
        <img src="${p.img}" alt="${p.nombre}" loading="lazy">
        ${p.stock <= 3 ? `<span class="pocas">¡Últimas ${p.stock}!</span>` : ''}
      </div>
      <div class="product-txt">
        <span class="etiqueta">${nombreCategoria(p.categoria)}</span>
        <h3 data-detalle="${p.id}">${p.nombre}</h3>
        <p class="desc-corta">${p.descripcion}</p>
        <p class="precio">${precioCOP(p.precio)}</p>
        <div class="product-botones">
          <button class="btn-2 btn-suave" data-detalle="${p.id}">Ver detalle</button>
          ${p.tallas.length > 1
            ? `<button class="btn-2" data-detalle="${p.id}">Elegir talla</button>`
            : `<button class="btn-2" data-agregar="${p.id}">Agregar al carrito</button>`}
        </div>
      </div>
    </div>`).join('');

  const faltan = res.length - mostrando;
  $('#ver-mas').style.display = faltan > 0 ? '' : 'none';
  $('#ver-mas').textContent = `Ver más productos (${Math.max(faltan, 0)} restantes)`;
}

// El buscador siempre busca en toda la tienda
$('#buscar').addEventListener('input', () => { $('#filtro-categoria').value = ''; });
['#buscar', '#filtro-categoria', '#filtro-edad', '#ordenar'].forEach(s =>
  $(s).addEventListener('input', () => { mostrando = POR_PAGINA; mostrarProductos(); }));
$('#ver-mas').addEventListener('click', () => { mostrando += POR_PAGINA; mostrarProductos(); });

// Lleva al usuario directo a la lista de productos de una categoría
function irACategoria(slug) {
  $('#filtro-categoria').value = slug;
  $('#buscar').value = '';
  $('#filtro-edad').value = '';
  mostrando = POR_PAGINA;
  mostrarProductos();
  history.replaceState(null, '', slug ? '#categoria-' + slug : '#productos');
  $('#productos').scrollIntoView({ behavior: 'smooth' });
}

// Si se abre un enlace como index.html#categoria-coches, filtra de una vez
function leerEnlace() {
  const m = location.hash.match(/^#categoria-(\w+)/);
  if (m && categorias.some(c => c.slug === m[1])) irACategoria(m[1]);
}
window.addEventListener('hashchange', leerEnlace);

// Botón "volver arriba" y sombra del menú al bajar
window.addEventListener('scroll', () => {
  $('#arriba').classList.toggle('visible', scrollY > 900);
  $('#barra').classList.toggle('con-sombra', scrollY > 10);
}, { passive: true });
$('#arriba').addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

// ---------- 4. MODAL Y PANEL ----------
function abrirModal(html) {
  $('#modal-contenido').innerHTML = html;
  $('#modal').classList.add('abierto');
  $('#fondo').classList.add('visible');
}
function cerrarTodo() {
  $('#modal').classList.remove('abierto');
  $('#panel-carrito').classList.remove('abierto');
  $('#fondo').classList.remove('visible');
}
$('#fondo').addEventListener('click', cerrarTodo);
document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarTodo(); });

function verDetalle(id) {
  const p = buscarProducto(id);
  const similares = productos.filter(x => x.categoria === p.categoria && x.id !== p.id).slice(0, 6);
  const unica = p.tallas.length === 1;
  abrirModal(`
    <div class="detalle">
      <img src="${p.img}" alt="${p.nombre}">
      <div class="detalle-info">
        <button class="miga" data-ir="${p.categoria}">${nombreCategoria(p.categoria)}</button>
        <h3>${p.nombre}</h3>
        <p class="precio grande">${precioCOP(p.precio)}</p>
        ${unica ? '' : `
        <p class="etq-talla">Talla <a href="#ayuda" data-faq="3" data-cerrar>Guía de tallas</a></p>
        <div class="tallas" role="radiogroup" aria-label="Talla">
          ${p.tallas.map((t, i) => `<button class="talla${i === 0 ? ' activa' : ''}" role="radio" aria-checked="${i === 0}">${t}</button>`).join('')}
        </div>`}
        <div class="detalle-accion">
          <button class="btn-1 ancho" data-agregar="${p.id}" data-con-talla>Agregar al carrito · ${precioCOP(p.precio)}</button>
        </div>
        <p class="detalle-desc">${p.descripcion}</p>
        <p class="detalle-meta">Edad: ${p.edades.map(e => nombresEdad[e]).join(', ')}${p.stock <= 3 ? ` · <b>¡Solo quedan ${p.stock}!</b>` : ''}</p>
        <p class="detalle-confianza">🚚 Envío en 1 a 3 días en Cali &nbsp;·&nbsp; 🔄 Cambios durante 15 días</p>
      </div>
    </div>
    ${similares.length ? `<h4 class="similares-titulo">También te puede gustar</h4>
    <div class="similares">${similares.map(x => `
      <button data-detalle="${x.id}"><img src="${x.img}" alt="" loading="lazy"><span>${x.nombre}</span><b>${precioCOP(x.precio)}</b></button>`).join('')}
    </div>` : ''}`);
  $('#modal-contenido').closest('.modal-caja').scrollTop = 0;
}

// Elegir talla con botones
document.addEventListener('click', e => {
  const t = e.target.closest('.talla');
  if (!t) return;
  t.parentElement.querySelectorAll('.talla').forEach(b => { b.classList.remove('activa'); b.setAttribute('aria-checked', 'false'); });
  t.classList.add('activa'); t.setAttribute('aria-checked', 'true');
});

// ---------- 5. CARRITO ----------
let carrito = leer('bcs_carrito', []);
const ENVIO = 8000, ENVIO_GRATIS = 150000;

function agregarAlCarrito(id, talla) {
  const p = buscarProducto(id);
  talla = talla || p.tallas[0];
  const item = carrito.find(i => i.id === p.id && i.talla === talla);
  const enCarrito = carrito.filter(i => i.id === p.id).reduce((s, i) => s + i.cantidad, 0);
  if (enCarrito >= p.stock) return aviso('No hay más unidades disponibles de este producto');
  if (item) item.cantidad++;
  else carrito.push({ id: p.id, talla, cantidad: 1 });
  actualizarCarrito();
  aviso(`${p.nombre}${talla !== 'Única' ? ' (' + talla + ')' : ''} se agregó al carrito`);
  const c = $('#btn-carrito');
  c.classList.remove('rebote'); void c.offsetWidth; c.classList.add('rebote');
}

function totales() {
  const subtotal = carrito.reduce((s, i) => s + buscarProducto(i.id).precio * i.cantidad, 0);
  const envio = subtotal === 0 || subtotal >= ENVIO_GRATIS ? 0 : ENVIO;
  return { subtotal, envio, total: subtotal + envio };
}

function actualizarCarrito() {
  guardar('bcs_carrito', carrito);
  $('#contador-carrito').textContent = carrito.reduce((s, i) => s + i.cantidad, 0);

  $('#items-carrito').innerHTML = carrito.length ? carrito.map((i, idx) => {
    const p = buscarProducto(i.id);
    return `
      <div class="item">
        <img src="${p.img}" alt="">
        <div>
          <p><b>${p.nombre}</b></p>
          <small>${i.talla !== 'Única' ? 'Talla ' + i.talla + ' · ' : ''}${precioCOP(p.precio)}</small>
          <div class="cantidad">
            <button data-menos="${idx}">−</button><span>${i.cantidad}</span><button data-mas="${idx}">+</button>
          </div>
        </div>
        <button class="borrar" data-borrar="${idx}" aria-label="Quitar">×</button>
      </div>`;
  }).join('') : '<p class="vacio">Tu carrito está vacío 🍼</p>';

  const t = totales();
  $('#subtotal').textContent = precioCOP(t.subtotal);
  $('#total').textContent = precioCOP(t.total);
  $('#nota-envio').textContent = t.subtotal === 0 ? '' :
    t.envio ? `Envío: ${precioCOP(t.envio)}. Te faltan ${precioCOP(ENVIO_GRATIS - t.subtotal)} para envío gratis.` : 'Envío: ¡gratis!';
  $('#btn-pagar').disabled = carrito.length === 0;
}

$('#btn-carrito').addEventListener('click', () => {
  $('#panel-carrito').classList.add('abierto');
  $('#fondo').classList.add('visible');
});

$('#items-carrito').addEventListener('click', e => {
  const d = e.target.dataset;
  if (d.borrar !== undefined) carrito.splice(d.borrar, 1);
  if (d.menos !== undefined) { carrito[d.menos].cantidad--; if (!carrito[d.menos].cantidad) carrito.splice(d.menos, 1); }
  if (d.mas !== undefined) {
    const i = carrito[d.mas], p = buscarProducto(i.id);
    const total = carrito.filter(x => x.id === i.id).reduce((s, x) => s + x.cantidad, 0);
    if (total < p.stock) i.cantidad++; else aviso('No hay más unidades disponibles');
  }
  actualizarCarrito();
});

$('#vaciar-carrito').addEventListener('click', () => { carrito = []; actualizarCarrito(); });

// ---------- 6. REGISTRO E INICIO DE SESIÓN (simulado) ----------
let usuario = leer('bcs_sesion', null);

function pintarUsuario() {
  $('#btn-usuario').textContent = usuario ? 'Hola, ' + usuario.nombre.split(' ')[0] : 'Ingresar';
}

function formularioCuenta(modo = 'login', despues) {
  const registro = modo === 'registro';
  abrirModal(`
    <h3>${registro ? 'Crear cuenta' : 'Iniciar sesión'}</h3>
    <form id="form-cuenta" class="formulario">
      ${registro ? '<input name="nombre" placeholder="Nombre completo" required>' : ''}
      <input type="email" name="correo" placeholder="Correo electrónico" required>
      <input type="password" name="clave" placeholder="Contraseña (mínimo 6 caracteres)" minlength="6" required>
      <p class="error" id="error-cuenta"></p>
      <button class="btn-1" type="submit">${registro ? 'Registrarme' : 'Entrar'}</button>
    </form>
    <p class="cambiar">${registro ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
      <a href="#" id="cambiar-modo">${registro ? 'Inicia sesión' : 'Regístrate'}</a></p>`);

  $('#cambiar-modo').onclick = e => { e.preventDefault(); formularioCuenta(registro ? 'login' : 'registro', despues); };

  $('#form-cuenta').onsubmit = e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    const usuarios = leer('bcs_usuarios', []);
    const existente = usuarios.find(u => u.correo === f.correo.toLowerCase());
    if (registro) {
      if (existente) return $('#error-cuenta').textContent = 'Ese correo ya está registrado.';
      usuario = { nombre: f.nombre, correo: f.correo.toLowerCase(), clave: btoa(f.clave) };
      usuarios.push(usuario);
      guardar('bcs_usuarios', usuarios);
    } else {
      if (!existente || existente.clave !== btoa(f.clave)) return $('#error-cuenta').textContent = 'Correo o contraseña incorrectos.';
      usuario = existente;
    }
    guardar('bcs_sesion', usuario);
    pintarUsuario();
    cerrarTodo();
    aviso('¡Bienvenida(o), ' + usuario.nombre.split(' ')[0] + '!');
    if (despues) despues();
  };
}

function menuUsuario() {
  abrirModal(`
    <h3>Mi cuenta</h3>
    <p>${usuario.nombre}<br><small>${usuario.correo}</small></p>
    <div class="botones">
      <button class="btn-1" id="ver-pedidos">Mis pedidos</button>
      <button class="btn-2" id="salir">Cerrar sesión</button>
    </div>`);
  $('#ver-pedidos').onclick = verPedidos;
  $('#salir').onclick = () => { usuario = null; guardar('bcs_sesion', null); pintarUsuario(); cerrarTodo(); aviso('Sesión cerrada'); };
}

$('#btn-usuario').addEventListener('click', () => usuario ? menuUsuario() : formularioCuenta());

// ---------- 7. PAGO SIMULADO Y PEDIDOS ----------
function checkout() {
  if (!carrito.length) return;
  if (!usuario) { aviso('Inicia sesión para finalizar tu compra'); return formularioCuenta('login', checkout); }
  const t = totales();
  abrirModal(`
    <h3>Finalizar compra</h3>
    <p class="nota">Pago simulado para fines académicos: no se realiza ningún cobro real.</p>
    <form id="form-pago" class="formulario">
      <input name="nombre" value="${usuario.nombre}" placeholder="Nombre de quien recibe" required>
      <input name="telefono" type="tel" pattern="[0-9 ]{7,15}" placeholder="Celular" required>
      <input name="direccion" placeholder="Dirección de entrega" required>
      <select name="ciudad" required>
        <option>Cali</option><option>Jamundí</option><option>Yumbo</option><option>Palmira</option><option>Candelaria</option>
      </select>
      <select name="pago" required>
        <option>Tarjeta débito/crédito</option><option>PSE</option><option>Nequi</option><option>Daviplata</option><option>Contraentrega</option>
      </select>
      <div class="resumen">
        <p>Subtotal: ${precioCOP(t.subtotal)}</p>
        <p>Envío: ${t.envio ? precioCOP(t.envio) : 'Gratis'}</p>
        <p class="total">Total a pagar: <b>${precioCOP(t.total)}</b></p>
      </div>
      <button class="btn-1" type="submit">Pagar ${precioCOP(t.total)}</button>
    </form>`);

  $('#form-pago').onsubmit = e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    const pedidos = leer('bcs_pedidos', []);
    const pedido = {
      numero: 'BCS-' + String(Date.now()).slice(-6),
      fecha: new Date().toLocaleDateString('es-CO'),
      correo: usuario.correo,
      items: carrito.map(i => ({ ...i, nombre: buscarProducto(i.id).nombre, precio: buscarProducto(i.id).precio })),
      ...t, ...f, estado: 'Confirmado'
    };
    pedidos.push(pedido);
    guardar('bcs_pedidos', pedidos);
    carrito = [];
    actualizarCarrito();
    abrirModal(`
      <div class="exito">
        <div class="check">✓</div>
        <h3>¡Gracias por tu compra!</h3>
        <p>Tu pedido <b>${pedido.numero}</b> fue confirmado.</p>
        <p>Lo entregaremos en ${pedido.direccion}, ${pedido.ciudad}, en 1 a 3 días hábiles.</p>
        <button class="btn-1" id="ir-pedidos">Ver mis pedidos</button>
      </div>`);
    $('#ir-pedidos').onclick = verPedidos;
  };
}
$('#btn-pagar').addEventListener('click', () => { $('#panel-carrito').classList.remove('abierto'); checkout(); });

function verPedidos() {
  if (!usuario) return formularioCuenta('login', verPedidos);
  const mios = leer('bcs_pedidos', []).filter(p => p.correo === usuario.correo).reverse();
  abrirModal(`
    <h3>Mis pedidos</h3>
    ${mios.length ? mios.map(p => `
      <div class="pedido">
        <p><b>${p.numero}</b> · ${p.fecha} · <span class="estado">${p.estado}</span></p>
        <ul>${p.items.map(i => `<li>${i.cantidad} × ${i.nombre} (${i.talla})</li>`).join('')}</ul>
        <p>Total: <b>${precioCOP(p.total)}</b> · ${p.pago}</p>
      </div>`).join('') : '<p>Aún no tienes pedidos.</p>'}`);
}

// ---------- 8. PREGUNTAS FRECUENTES Y CONTACTO ----------
$('#lista-faq').innerHTML = faqs.map(f => `<details><summary>${f.p}</summary><p>${f.r}</p></details>`).join('');

$('#link-pedidos').addEventListener('click', e => { e.preventDefault(); verPedidos(); });

$('#form-contacto').addEventListener('submit', e => {
  e.preventDefault();
  const mensajes = leer('bcs_mensajes', []);
  mensajes.push({ ...Object.fromEntries(new FormData(e.target)), fecha: new Date().toISOString() });
  guardar('bcs_mensajes', mensajes);
  e.target.reset();
  aviso('¡Mensaje enviado! Te responderemos pronto.');
});

// Los enlaces de Ayuda del pie de página abren la pregunta correspondiente
document.addEventListener('click', e => {
  const l = e.target.closest('[data-faq]');
  if (!l) return;
  const d = document.querySelectorAll('#lista-faq details')[l.dataset.faq];
  if (d) { d.open = true; setTimeout(() => d.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50); }
});

// ---------- 9. CLICS GENERALES (detalle, agregar, cerrar) ----------
document.addEventListener('click', e => {
  const el = e.target.closest('[data-ir], [data-detalle], [data-agregar], [data-cerrar]');
  if (!el) return;
  if (el.dataset.ir !== undefined) { e.preventDefault(); cerrarTodo(); return irACategoria(el.dataset.ir); }
  if (el.dataset.cerrar !== undefined) return cerrarTodo();
  if (el.dataset.detalle) return verDetalle(el.dataset.detalle);
  if (el.dataset.agregar) {
    const conTalla = el.dataset.conTalla !== undefined;
    const elegida = $('.talla.activa');
    const talla = conTalla ? (elegida ? elegida.textContent : buscarProducto(el.dataset.agregar).tallas[0]) : null;
    agregarAlCarrito(el.dataset.agregar, talla);
    if (talla) cerrarTodo();
  }
});

// Cerrar el menú del celular al tocar un enlace
document.querySelectorAll('.navbar a').forEach(a => a.addEventListener('click', () => $('#menu').checked = false));

// ---------- 10. ASISTENTE (responde solo con información de la tienda) ----------
const chat = $('#chat'), mensajesChat = $('#chat-mensajes');

function decir(texto, de = 'bot') {
  mensajesChat.insertAdjacentHTML('beforeend', `<div class="msg ${de}">${texto}</div>`);
  mensajesChat.scrollTop = mensajesChat.scrollHeight;
}

function tarjetas(lista) {
  return lista.map(p => `<button class="mini" data-detalle="${p.id}">
    <img src="${p.img}" alt=""><span>${p.nombre}<br><b>${precioCOP(p.precio)}</b></span></button>`).join('');
}

function responder(pregunta) {
  const q = sinTildes(pregunta);
  const tiene = (...pal) => pal.some(w => q.includes(w));

  if (tiene('hola', 'buenas', 'buenos dias', 'buenas tardes')) return '¡Hola! 👋 Soy Chicky. Puedo recomendarte productos, ayudarte con tallas o contarte sobre envíos, pagos y cambios.';
  if (tiene('gracias')) return '¡Con gusto! Si necesitas algo más, aquí estoy 💜';

  if (tiene('carrito', 'mi compra')) {
    const t = totales();
    return carrito.length ? `Tienes ${carrito.reduce((s, i) => s + i.cantidad, 0)} producto(s) en tu carrito por ${precioCOP(t.total)}.` : 'Tu carrito está vacío por ahora.';
  }
  if (tiene('pedido', 'mis compras', 'orden')) {
    if (!usuario) return 'Para consultar tus pedidos primero inicia sesión con el botón "Ingresar".';
    const ult = leer('bcs_pedidos', []).filter(p => p.correo === usuario.correo).pop();
    return ult ? `Tu último pedido es <b>${ult.numero}</b> (${ult.fecha}), estado: <b>${ult.estado}</b>. Llega en 1 a 3 días hábiles.` : 'Aún no tienes pedidos registrados.';
  }

  // Preguntas frecuentes y políticas
  const faq = faqs.find(f => f.claves.some(c => q.includes(c)));

  // Búsqueda en el catálogo: precio, edad, categoría o nombre
  let res = [...productos];
  let filtrado = false;
  const max = q.match(/(?:menos de|hasta|maximo|bajo)\s*\$?\s*([\d.]+)\s*(mil|k)?/);
  if (max) { let n = Number(max[1].replace(/\./g, '')); if (max[2] || n < 1000) n *= 1000; res = res.filter(p => p.precio <= n); filtrado = true; }
  const meses = q.match(/(\d+)\s*(mes|meses|año|años|ano|anos)/);
  if (meses) {
    const m = Number(meses[1]) * (meses[2].startsWith('a') ? 12 : 1);
    const rango = m < 6 ? '0-6' : m < 12 ? '6-12' : m < 24 ? '12-24' : '24-36';
    res = res.filter(p => p.edades.includes(rango)); filtrado = true;
  }
  if (tiene('recien nacid')) { res = res.filter(p => p.edades.includes('0-6')); filtrado = true; }
  const palabras = {
    vestido: 'ocasiones', tutu: 'ocasiones', fiesta: 'ocasiones', cumple: 'ocasiones', bautizo: 'ocasiones', gala: 'ocasiones', traje: 'ocasiones',
    conjunto: 'conjuntos', body: 'conjuntos', jardinero: 'conjuntos', sudadera: 'conjuntos',
    chupete: 'chupetes', biberon: 'chupetes', tetero: 'chupetes',
    coche: 'coches', caminador: 'coches',
    corral: 'sala', 'sala de juego': 'sala', tipi: 'sala', carpa: 'sala',
    juguete: 'juguetes', peluche: 'juguetes', cuna: 'juguetes', mueble: 'juguetes', closet: 'juguetes', montessori: 'juguetes',
    accesorio: 'accesorios', gorro: 'accesorios', balaca: 'accesorios', panalera: 'accesorios', cargador: 'accesorios', medias: 'accesorios',
    bano: 'bano', toalla: 'bano', bata: 'bano', champu: 'bano', colonia: 'bano', perfume: 'bano', pijama: 'bano', banera: 'bano',
    'silla de comer': 'comedor', comedor: 'comedor', plato: 'comedor', comer: 'comedor', vajilla: 'comedor' };
  for (const [pal, cat] of Object.entries(palabras)) {
    if (q.includes(pal) && cat) { res = res.filter(p => p.categoria === cat); filtrado = true; break; }
  }
  // Afina con palabras específicas de la pregunta (ej. "gemelos", "dinosaurio", "rosado")
  const comunes = ['tienen', 'quiero', 'busco', 'necesito', 'algun', 'alguna', 'tiene', 'venden', 'donde', 'cuanto', 'cuesta', 'para', 'bebes', 'bebe', 'niña', 'nina', 'niño', 'nino'];
  const claves = q.replace(/[¿?¡!.,]/g, '').split(/\s+/).filter(w => w.length > 4 && !comunes.includes(w))
    .map(w => w.replace(/(es|s)$/, ''));
  const puntaje = p => claves.filter(w => sinTildes(p.nombre + ' ' + p.descripcion).includes(w)).length;
  const mejor = Math.max(0, ...res.map(puntaje));
  const afinado = res.filter(p => puntaje(p) === mejor);
  if (filtrado && mejor > 0 && afinado.length < res.length) res = afinado;
  const porNombre = productos.filter(p => sinTildes(p.nombre).split(' ').some(w => w.length > 3 && q.includes(w)));
  if (porNombre.length && !filtrado) { res = porNombre; filtrado = true; }
  if (tiene('regalo', 'recomienda', 'recomendacion', 'sugiere', 'popular')) {
    if (!filtrado) res = [productos[0], productos.find(p => p.nombre.includes('Kit de Baño')), productos.find(p => p.nombre.includes('Caja de Medias'))].filter(Boolean);
    filtrado = true;
  }
  if (tiene('barato', 'economico')) { res.sort((a, b) => a.precio - b.precio); res = res.slice(0, 3); filtrado = true; }

  if (filtrado) {
    if (!res.length) return 'No tengo productos con esas características en el catálogo actual. Prueba con otra edad o precio, o escríbenos por WhatsApp al 300 000 0000.';
    const cats = [...new Set(res.map(p => p.categoria))];
    const verTodo = cats.length === 1 ? `<button class="mini-link" data-ir="${cats[0]}">Ver toda la categoría ${nombreCategoria(cats[0])} →</button>` : '';
    return `Encontré ${res.length} opción(es) para ti:<div class="minis">${tarjetas(res.slice(0, 4))}</div>${verTodo}`;
  }
  if (faq) return faq.r;

  // Sin respuesta segura: no inventa
  return 'No tengo esa información y prefiero no inventarla 🙈. Puedes preguntarme por productos, tallas, envíos, pagos o cambios, o escribirnos por WhatsApp al 300 000 0000.';
}

function enviarAlChat(texto) {
  if (!texto.trim()) return;
  decir(texto.replace(/</g, '&lt;'), 'yo');
  setTimeout(() => decir(responder(texto)), 400);
}

// Globo de bienvenida de Chicky (solo la primera visita)
setTimeout(() => {
  if (leer('bcs_globo', false) || chat.classList.contains('abierto')) return;
  $('#chat-globo').classList.add('visible');
  guardar('bcs_globo', true);
  setTimeout(() => $('#chat-globo').classList.remove('visible'), 7000);
}, 3000);
$('#chat-globo').addEventListener('click', () => $('#chat-boton').click());

$('#chat-boton').addEventListener('click', () => {
  $('#chat-globo').classList.remove('visible');
  chat.classList.toggle('abierto');
  if (!mensajesChat.children.length) decir('¡Hola! 👋 Soy <b>Chicky</b>, la asistente de Baby\'s Chic. ¿Qué estás buscando para tu bebé?');
  $('#chat-input').focus();
});
$('#chat-cerrar').addEventListener('click', () => chat.classList.remove('abierto'));
$('#chat-form').addEventListener('submit', e => { e.preventDefault(); enviarAlChat($('#chat-input').value); $('#chat-input').value = ''; });

['Vestidos para 1 año', 'Regalos de menos de 80 mil', '¿Cuánto cuesta el envío?', '¿Cómo elijo la talla?', 'Cambios y devoluciones']
  .forEach(s => $('#chat-sugerencias').insertAdjacentHTML('beforeend', `<button>${s}</button>`));
$('#chat-sugerencias').addEventListener('click', e => { if (e.target.tagName === 'BUTTON') enviarAlChat(e.target.textContent); });

// ---------- INICIO ----------
mostrarProductos();
actualizarCarrito();
pintarUsuario();
leerEnlace();
