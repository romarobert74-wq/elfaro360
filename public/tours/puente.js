/* =============================================================================
 * PUENTE 3DVista  —  El Faro 360  (navegación "Ir a" por NOMBRE)
 * =============================================================================
 * DÓNDE SE PEGA (una sola vez por tour):
 *   3DVista → seleccioná el TOUR → evento "Al comenzar / Begin" →
 *   acción "Ejecutar JavaScript" → pegá TODO este contenido.
 *
 * NOMBRES DE PANORAMAS:
 *   Poné a cada panorama un label simple y sin acentos (recepcion, piscina,
 *   sala-cata...). Ese mismo nombre va en el config.json (campo "panorama").
 *
 * CONTENEDOR DE LA BOTONERA:
 *   El WebFrame de la botonera debe estar dentro de un Container llamado
 *   BOTONERA-PPAL (o agregá el nombre a NOMBRES_CONTENEDOR abajo). El botón
 *   "Ir a" del skin muestra ese contenedor; al tocar un botón se oculta.
 * ========================================================================== */
(function () {
  'use strict';

  function responder(source, msg) {
    var payload = Object.assign({ source: 'faro-tour' }, msg);
    try { if (source) source.postMessage(payload, '*'); } catch (e) {}
    try {
      var ifr = document.getElementsByTagName('iframe');
      for (var i = 0; i < ifr.length; i++) {
        try { ifr[i].contentWindow.postMessage(payload, '*'); } catch (e) {}
      }
    } catch (e) {}
  }

  function getPlayer() {
    if (window.tour && tour.player) return tour.player;
    if (window.player) return window.player;
    if (window.tour) return window.tour;
    return null;
  }

  function todasLasPlaylists() {
    var pls = [];
    try { if (window.tour && tour.mainPlayList) pls.push(tour.mainPlayList); } catch (e) {}
    try {
      var p = getPlayer();
      if (p && p.getByClassName) {
        var arr = p.getByClassName('PlayList') || [];
        for (var i = 0; i < arr.length; i++) if (pls.indexOf(arr[i]) < 0) pls.push(arr[i]);
      }
    } catch (e) {}
    return pls;
  }

  function nombreDe(item) {
    var m; try { m = item.get('media'); } catch (e) { m = null; }
    var cands = [];
    try { cands.push(m && m.get('label')); } catch (e) {}
    try { cands.push(m && m.get('data') && m.get('data').label); } catch (e) {}
    try { cands.push(m && m.get('id')); } catch (e) {}
    try { cands.push(item && item.get('id')); } catch (e) {}
    for (var i = 0; i < cands.length; i++) if (cands[i]) return String(cands[i]);
    return '';
  }

  function normalizar(s) {
    return String(s || '').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, '-').trim();
  }

  function irA(nombre, source) {
    var objetivo = normalizar(nombre);
    var pls = todasLasPlaylists();
    var player = getPlayer();
    var metodos = [];
    for (var p = 0; p < pls.length; p++) {
      var items; try { items = pls[p].get('items') || []; } catch (e) { items = []; }
      for (var i = 0; i < items.length; i++) {
        if (normalizar(nombreDe(items[i])) === objetivo) {
          try { if (player && player.setMediaByIndex) { player.setMediaByIndex(pls[p], i); metodos.push('setMediaByIndex(pl,i)'); } } catch (e) {}
          if (!metodos.length) { try { if (player && player.setMediaByIndex) { player.setMediaByIndex(i); metodos.push('setMediaByIndex(i)'); } } catch (e) {} }
          try { pls[p].set('selectedIndex', i); metodos.push('selectedIndex#' + p); } catch (e) {}
          try { var media = items[i].get('media'); if (player && player.openMedia && media) { player.openMedia(media); metodos.push('openMedia'); } } catch (e) {}
          responder(source, { tipo: metodos.length ? 'mb-ir-a-ok' : 'mb-ir-a-fail', panorama: nombre, metodo: metodos.join(' + ') || '(ninguno)', playlist: p, indice: i });
          return;
        }
      }
    }
    responder(source, { tipo: 'mb-ir-a-fail', panorama: nombre, playlists: pls.length });
  }

  var NOMBRES_CONTENEDOR = ['BOTONERA-PPAL', 'BOTONERA-PRINCIPAL', 'BOTONERA'];

  function hallarPorNombre(nombres) {
    var player = getPlayer();
    if (!player || !player.getByClassName) return null;
    var clases = ['Container', 'Group', 'ViewerArea', 'WebFrame', 'Image', 'IconButton', 'ImageButton', 'TextBox', 'FlatPanoramaPlayer'];
    var objetivos = nombres.map(function (n) { return String(n).toLowerCase(); });
    for (var c = 0; c < clases.length; c++) {
      var arr = [];
      try { arr = player.getByClassName(clases[c]) || []; } catch (e) {}
      for (var i = 0; i < arr.length; i++) {
        var lab = '';
        try { lab = (arr[i].get('data') && arr[i].get('data').label) || ''; } catch (e) {}
        if (!lab) { try { lab = arr[i].get('id') || ''; } catch (e) {} }
        if (lab && objetivos.indexOf(String(lab).toLowerCase()) >= 0) return arr[i];
      }
    }
    return null;
  }

  function cerrarBotonera() {
    var cont = hallarPorNombre(NOMBRES_CONTENEDOR);
    if (cont) { try { cont.set('visible', false); return; } catch (e) {} }
    try {
      var player = getPlayer();
      var wfs = (player && player.getByClassName) ? (player.getByClassName('WebFrame') || []) : [];
      for (var i = 0; i < wfs.length; i++) {
        var url = ''; try { url = wfs[i].get('url') || ''; } catch (e) {}
        if (url.indexOf('ir-a') >= 0) { try { wfs[i].set('visible', false); } catch (e) {} }
      }
    } catch (e) {}
  }

  window.addEventListener('message', function (ev) {
    var d = ev.data;
    if (!d || typeof d !== 'object' || d.source !== 'faro-ir-a') return;
    if (d.tipo === 'mb-abrir') {
      var comp = hallarPorNombre([d.objetivo]);
      if (comp) {
        try { comp.set('visible', true); } catch (e) {}
        var kids = null;
        try { kids = comp.get('children'); } catch (e) {}
        if (!kids) { try { kids = comp.get('components'); } catch (e) {} }
        if (!kids) { try { kids = comp.get('items'); } catch (e) {} }
        if (kids && kids.length) for (var k = 0; k < kids.length; k++) { try { kids[k].set('visible', true); } catch (e) {} }
      }
    } else if (d.tipo === 'mb-cerrar-ir-a') { cerrarBotonera(); }
    else if (d.tipo === 'mb-ping') { responder(ev.source, { tipo: 'mb-pong' }); }
    else if (d.tipo === 'mb-ir-a') { irA(d.panorama, ev.source); }
  });

  responder(null, { tipo: 'mb-pong' });
})();
