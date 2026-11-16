/* Carte et horaires de Sam Cuisine : lit carte.txt et affiche la carte, les horaires et « Ouvert / Fermé ». */
(function (root) {
  'use strict';
  var JOURS = { dimanche: 0, lundi: 1, mardi: 2, mercredi: 3, jeudi: 4, vendredi: 5, samedi: 6 };
  var NOMS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function key(s) {
    return String(s).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  }
  function list(v) { return String(v || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean); }
  function telHref(v) {
    var d = String(v).replace(/[^\d+]/g, '');
    if (/^0\d{9}$/.test(d)) d = '+33' + d.slice(1);
    return /^\+?\d{6,15}$/.test(d) ? 'tel:' + d : null;
  }
  function applyInfos(inf) {
    if (typeof document === 'undefined') return;
    Object.keys(inf).forEach(function (k) {
      var v = inf[k];
      [].forEach.call(document.querySelectorAll('[data-i="' + k + '"]'), function (el) { el.textContent = v; });
      [].forEach.call(document.querySelectorAll('[data-list="' + k + '"]'), function (el) {
        var items = list(v);
        if (!items.length) return;
        if (el.tagName === 'UL') el.innerHTML = items.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
        else { var once = items.map(function (x) { return '<span>' + esc(x) + '</span><i>\u2726</i>'; }).join(''); el.innerHTML = once + once; }
      });
    });
    if (inf.telephone) {
      var href = telHref(inf.telephone);
      if (href) [].forEach.call(document.querySelectorAll('a[href^="tel:"]'), function (a) { a.setAttribute('href', href); });
    }
    var an = document.getElementById('annonce');
    if (an) an.hidden = !(inf.annonce && inf.annonce.trim());
  }
  function photoOk(p) { return /^img\/[a-z0-9_-]+\.(webp|jpe?g|png)$/i.test(p); }

  function parse(text) {
    var tabs = [], hours = [], infos = {}, tab = null, card = null, inHours = false, inInfos = false;
    String(text).replace(/\r/g, '').split('\n').forEach(function (raw) {
      var line = raw.trim();
      if (!line || line.charAt(0) === '#') return;
      if (line.indexOf('==') === 0) {
        var name = line.replace(/^=+/, '').trim();
        inHours = /^horaires$/i.test(name);
        inInfos = /^infos$/i.test(name);
        if (!inHours && !inInfos) { tab = { name: name, cards: [] }; tabs.push(tab); card = null; }
        return;
      }
      if (inInfos) {
        var k = line.indexOf(':');
        if (k > 0) infos[key(line.slice(0, k))] = line.slice(k + 1).trim();
        return;
      }
      if (inHours) {
        var h = line.split('|');
        var day = JOURS[(h[0] || '').trim().toLowerCase()];
        if (day !== undefined) hours.push({ day: day, label: h[0].trim(), text: (h.slice(1).join('|') || '').trim() });
        return;
      }
      if (!tab) { tab = { name: 'La carte', cards: [] }; tabs.push(tab); }
      if (line.indexOf('--') === 0) {
        var c = line.replace(/^-+/, '').split('|').map(function (x) { return x.trim(); });
        card = { title: c[0], sub: '', photo: '', items: [] };
        c.slice(1).forEach(function (x) {
          if (/^photo\s*=/i.test(x)) card.photo = x.replace(/^photo\s*=\s*/i, '');
          else if (x && !card.sub) card.sub = x;
        });
        tab.cards.push(card);
        return;
      }
      if (!card) { card = { title: '', sub: '', photo: '', items: [] }; tab.cards.push(card); }
      var m;
      if ((m = line.match(/^note\s*:\s*(.*)$/i))) { card.items.push({ type: 'note', text: m[1] }); return; }
      if ((m = line.match(/^tags\s*:\s*(.*)$/i))) {
        card.items.push({ type: 'tags', list: m[1].split(',').map(function (x) { return x.trim(); }).filter(Boolean) });
        return;
      }
      var f = line.split('|').map(function (x) { return x.trim(); });
      var isNew = f.slice(1).some(function (x) { return /^nouveau$/i.test(x); });
      f = f.map(function (x) { return /^nouveau$/i.test(x) ? '' : x; });
      var price = f[1] || '', qty = null;
      if (/;/.test(price) || /^x\s*\d/i.test(price)) {
        qty = price.split(';').map(function (x) {
          var q = x.trim().match(/^(x\s*\d+)\s+(.*)$/i);
          return q ? { n: q[1].replace(/\s+/g, ''), p: q[2] } : { n: '', p: x.trim() };
        }).filter(function (q) { return q.p; });
        price = '';
      }
      card.items.push({ type: 'dish', name: f[0], price: price, desc: f[2] || '', isNew: isNew, qty: qty });
    });
    return { tabs: tabs, hours: hours, infos: infos };
  }

  function renderCard(c) {
    var h = '<div class="card">';
    if (c.photo && photoOk(c.photo)) h += '<div class="cover"><img src="' + esc(c.photo) + '" alt="' + esc(c.title) + '" loading="lazy"></div>';
    h += '<div class="in">';
    if (c.title) h += '<h3>' + esc(c.title) + (c.sub ? ' <em>' + esc(c.sub) + '</em>' : '') + '</h3>';
    c.items.forEach(function (it) {
      if (it.type === 'note') h += '<p class="note">' + esc(it.text) + '</p>';
      else if (it.type === 'tags') h += '<div class="tags">' + it.list.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>';
      else {
        h += '<div class="row"><span class="n">' + esc(it.name) + (it.isNew ? ' <i class="new">Nouveau</i>' : '') + '</span><span class="dots"></span>' +
          (it.price ? '<span class="p">' + esc(it.price) + '</span>' : '') + '</div>';
        if (it.qty && it.qty.length) h += '<div class="qty" style="grid-template-columns:repeat(' + Math.min(it.qty.length, 4) + ',1fr)">' +
          it.qty.map(function (q) { return '<span>' + esc(q.n) + '<b>' + esc(q.p) + '</b></span>'; }).join('') + '</div>';
        if (it.desc) h += '<p class="d">' + esc(it.desc) + '</p>';
      }
    });
    return h + '</div></div>';
  }

  function renderCarte(data) {
    var t = '<div class="tabs" role="tablist" aria-label="Catégories de la carte">', p = '';
    data.tabs.forEach(function (tab, i) {
      var n = i + 1;
      t += '<button class="tab" type="button" role="tab" aria-selected="' + (i === 0) + '" aria-controls="p' + n + '" id="t' + n + '"' + (i ? ' tabindex="-1"' : '') + '>' + esc(tab.name) + '</button>';
      p += '<div class="panel" id="p' + n + '" role="tabpanel" aria-labelledby="t' + n + '"' + (i ? ' hidden' : '') + '><div class="cols">' +
        tab.cards.map(renderCard).join('') + '</div></div>';
    });
    return t + '</div>' + p;
  }

  function renderHours(data) {
    return data.hours.map(function (d) {
      var off = /ferm/i.test(d.text);
      return '<div data-d="' + d.day + '"' + (off ? ' class="off"' : '') + '><span>' + esc(d.label) + '</span><b>' + esc(d.text) + '</b></div>';
    }).join('');
  }

  function slots(text) {
    var out = [], re = /(\d{1,2})\s*h\s*(\d{2})?\s*[–—-]\s*(\d{1,2})\s*h\s*(\d{2})?/gi, m;
    while ((m = re.exec(text))) {
      var a = (+m[1]) * 60 + (+(m[2] || 0)), b = (+m[3]) * 60 + (+(m[4] || 0));
      if (b <= a) b += 24 * 60;
      out.push([a, b]);
    }
    return out;
  }
  function fmt(m) { m = m % 1440; var h = Math.floor(m / 60), mm = m % 60; return h + 'h' + (mm ? String(mm).padStart(2, '0') : ''); }

  function initTabs(scope) {
    var tabs = [].slice.call(scope.querySelectorAll('.tab'));
    function show(t) {
      tabs.forEach(function (x) {
        var on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(x.getAttribute('aria-controls')); if (panel) panel.hidden = !on;
      });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { show(t); });
      t.addEventListener('keydown', function (e) {
        var k = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (k) { var n = tabs[(i + k + tabs.length) % tabs.length]; show(n); n.focus(); }
      });
    });
  }

  function updateStatus() {
    var rows = [].slice.call(document.querySelectorAll('#hours [data-d]')), H = {};
    for (var d = 0; d < 7; d++) H[d] = [];
    rows.forEach(function (r) { H[+r.getAttribute('data-d')] = slots(r.textContent); r.classList.remove('today'); });
    var st = document.getElementById('status'), tx = document.getElementById('statusText');
    try {
      var parts = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
      var get = function (t) { return (parts.find(function (p) { return p.type === t; }) || {}).value; };
      var wd = { 'dim.': 0, 'lun.': 1, 'mar.': 2, 'mer.': 3, 'jeu.': 4, 'ven.': 5, 'sam.': 6 }[get('weekday')];
      var now = parseInt(get('hour'), 10) * 60 + parseInt(get('minute'), 10);
      var row = document.querySelector('#hours [data-d="' + wd + '"]'); if (row) row.classList.add('today');
      if (!st || !tx) return;
      var prev = H[(wd + 6) % 7].find(function (s) { return s[1] > 1440 && now < s[1] - 1440; });
      var open = prev ? [0, prev[1] - 1440] : H[wd].find(function (s) { return now >= s[0] && now < s[1]; });
      st.classList.toggle('closed', !open);
      if (open) { tx.textContent = 'Ouvert maintenant · jusqu’à ' + fmt(open[1]); return; }
      var next = H[wd].find(function (s) { return now < s[0]; });
      if (next) { tx.textContent = 'Fermé · ouvre à ' + fmt(next[0]); return; }
      for (var i = 1; i <= 7; i++) { var dd = (wd + i) % 7; if (H[dd].length) { tx.textContent = 'Fermé · ouvre ' + (i === 1 ? 'demain' : NOMS[dd]) + ' à ' + fmt(H[dd][0][0]); return; } }
      tx.textContent = 'Horaires sur demande';
    } catch (e) { }
  }

  function apply(data) {
    var carte = document.getElementById('carte-app'), hours = document.getElementById('hours');
    if (carte && data.tabs.length) { carte.innerHTML = renderCarte(data); initTabs(carte); }
    if (hours && data.hours.length) hours.innerHTML = renderHours(data);
    applyInfos(data.infos || {});
    updateStatus();
  }

  var api = { parse: parse, renderCarte: renderCarte, renderHours: renderHours, slots: slots };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; return; }
  root.SamCarte = api;

  // Au chargement : carte déjà présente dans la page ; on relit carte.txt pour avoir la dernière version.
  var carte = document.getElementById('carte-app');
  if (carte) initTabs(carte);
  updateStatus();
  if (location.protocol !== 'file:' && window.fetch) {
    fetch('carte.txt', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.text() : null; })
      .then(function (t) { if (t) apply(parse(t)); }).catch(function () { });
  }
})(this);
