/* ================= Gestion du consentement aux cookies (RGPD / CNIL) =================
   Rien n'est chargé tant que le visiteur n'a pas donné son accord :
   - « Mesure d'audience »  -> Google Analytics 4 (gtag.js)
   - « Marketing »          -> pixel Meta (uniquement sur /scan et /scan-b)

   Le choix est mémorisé dans localStorage (eed-consent). Tant qu'aucun choix
   n'a été fait, le bandeau s'affiche. Un lien « Gérer mes cookies » (pied de
   page) rappelle le panneau à tout moment via window.EEDConsent.open().

   L'ID Google Analytics se règle dans Base.astro (window.EED_GA4_ID).
   Tant qu'il est vide, la catégorie reste proposée mais ne charge rien. */
(function () {
  'use strict';

  var STORAGE_KEY = 'eed-consent';
  var VERSION = 1; // incrémenter pour redemander le consentement après un changement de politique

  /* file d'attente des rappels par catégorie, déclenchés quand le consentement est accordé */
  var listeners = { analytics: [], marketing: [] };

  /* ---------- Lecture / écriture de l'état ---------- */
  function read() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || data.v !== VERSION) return null; // politique changée -> on redemande
      return data;
    } catch (e) { return null; }
  }

  function write(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        v: VERSION,
        analytics: !!state.analytics,
        marketing: !!state.marketing,
        ts: new Date().toISOString()
      }));
    } catch (e) {}
  }

  /* ---------- Suppression des cookies tiers quand on retire un consentement ---------- */
  function deleteCookie(name) {
    var host = location.hostname;
    var domains = ['', host, '.' + host];
    /* on tente aussi le domaine racine (ex. .eagleeye.digital) */
    var parts = host.split('.');
    if (parts.length > 2) domains.push('.' + parts.slice(-2).join('.'));
    domains.forEach(function (d) {
      document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' +
        (d ? '; domain=' + d : '');
    });
  }
  function clearAnalyticsCookies() {
    document.cookie.split(';').forEach(function (c) {
      var n = c.split('=')[0].trim();
      if (n.indexOf('_ga') === 0) deleteCookie(n); // _ga, _ga_XXXX, _gid, _gat…
    });
    deleteCookie('_gid'); deleteCookie('_gat');
  }
  function clearMarketingCookies() {
    deleteCookie('_fbp'); deleteCookie('_fbc'); deleteCookie('fr');
  }

  /* ---------- Déclenchement des chargements ---------- */
  function fire(cat) {
    var cbs = listeners[cat];
    listeners[cat] = []; // déclenché une seule fois
    cbs.forEach(function (cb) { try { cb(); } catch (e) {} });
  }

  /* Chargement de Google Analytics 4 (seulement si un ID est configuré) */
  var gaLoaded = false;
  function loadGA() {
    if (gaLoaded) return;
    var id = window.EED_GA4_ID;
    if (!id || id.indexOf('G-') !== 0) return; // pas encore configuré : on ne charge rien
    gaLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', id, { anonymize_ip: true });
  }
  listeners.analytics.push(loadGA);

  /* ---------- Application d'un état ---------- */
  function apply(state, previous) {
    if (state.analytics) {
      fire('analytics');
    } else if (previous && previous.analytics) {
      clearAnalyticsCookies(); // on retire un consentement déjà donné
    }
    if (state.marketing) {
      fire('marketing');
    } else if (previous && previous.marketing) {
      clearMarketingCookies();
    }
  }

  /* ---------- API publique ---------- */
  var api = {
    /* état courant (ou null si aucun choix fait) */
    get: function () { return read(); },

    /* enregistre un rappel déclenché dès que la catégorie est (ou devient) acceptée */
    onGrant: function (cat, cb) {
      if (!listeners[cat]) return;
      var state = read();
      if (state && state[cat]) { try { cb(); } catch (e) {} }
      else listeners[cat].push(cb);
    },

    /* enregistre un choix (depuis le bandeau) */
    save: function (state) {
      var previous = read();
      write(state);
      /* si on retire un consentement déjà accordé, un rechargement garantit
         que les scripts tiers déjà injectés ne continuent pas de tourner */
      var downgraded = previous &&
        ((previous.analytics && !state.analytics) || (previous.marketing && !state.marketing));
      apply(state, previous);
      hideBanner();
      if (downgraded) location.reload();
    },

    /* (ré)ouvre le panneau de préférences */
    open: function () { showBanner(true); }
  };
  window.EEDConsent = api;
  /* signale aux scripts chargés plus tôt (ex. pixel Meta en <head>) que l'API est prête */
  try { document.dispatchEvent(new Event('eedconsent:ready')); } catch (e) {}

  /* ---------- Interface : bandeau + panneau ---------- */
  var root = null;

  function buildBanner() {
    if (root) return;
    var state = read() || { analytics: false, marketing: false };
    root = document.createElement('div');
    root.className = 'cc';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-live', 'polite');
    root.setAttribute('aria-label', 'Gestion des cookies');
    root.innerHTML =
      '<div class="cc-card">' +
        '<div class="cc-main">' +
          '<p class="cc-text"><strong>Cookies.</strong> Mesure d\'audience et efficacité de nos campagnes. ' +
            '<a href="/politique-de-confidentialite/">En savoir plus</a>.</p>' +
        '</div>' +
        '<div class="cc-prefs" hidden>' +
          '<label class="cc-row"><span><b>Nécessaires</b><br><small>Indispensables au fonctionnement du site. Toujours actifs.</small></span>' +
            '<input type="checkbox" checked disabled></label>' +
          '<label class="cc-row"><span><b>Mesure d\'audience</b><br><small>Google Analytics : pages vues, sources de trafic (données anonymisées).</small></span>' +
            '<input type="checkbox" id="cc-analytics"' + (state.analytics ? ' checked' : '') + '></label>' +
          '<label class="cc-row"><span><b>Marketing</b><br><small>Pixel Meta sur nos pages publicitaires, pour mesurer nos campagnes.</small></span>' +
            '<input type="checkbox" id="cc-marketing"' + (state.marketing ? ' checked' : '') + '></label>' +
        '</div>' +
        '<div class="cc-actions">' +
          '<button type="button" class="cc-btn cc-ghost" data-cc="refuse">Tout refuser</button>' +
          '<button type="button" class="cc-btn cc-ghost" data-cc="custom">Personnaliser</button>' +
          '<button type="button" class="cc-btn cc-ghost" data-cc="save" hidden>Enregistrer mes choix</button>' +
          '<button type="button" class="cc-btn cc-primary" data-cc="accept">Tout accepter</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(root);

    root.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('[data-cc]') : null;
      if (!btn) return;
      var action = btn.getAttribute('data-cc');
      if (action === 'accept') api.save({ analytics: true, marketing: true });
      else if (action === 'refuse') api.save({ analytics: false, marketing: false });
      else if (action === 'custom') togglePrefs(true);
      else if (action === 'save') api.save({
        analytics: root.querySelector('#cc-analytics').checked,
        marketing: root.querySelector('#cc-marketing').checked
      });
    });
  }

  function togglePrefs(show) {
    if (!root) return;
    root.querySelector('.cc-prefs').hidden = !show;
    root.querySelector('[data-cc="custom"]').hidden = show;
    root.querySelector('[data-cc="save"]').hidden = !show;
  }

  function showBanner(prefs) {
    buildBanner();
    root.classList.add('on');
    togglePrefs(!!prefs);
  }
  function hideBanner() {
    if (root) root.classList.remove('on');
  }

  /* ---------- Démarrage ---------- */
  var saved = read();
  if (saved) {
    apply(saved, null); // consentement déjà donné : on recharge ce qui a été accepté
  } else {
    /* pas encore de choix : on affiche le bandeau dès que le DOM est prêt */
    if (document.body) showBanner(false);
    else document.addEventListener('DOMContentLoaded', function () { showBanner(false); });
  }
})();
