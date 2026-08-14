/* ================= Configuration ================= */
/* URL de l'outil de prise de RDV. Laisser vide tant qu'il n'est pas en ligne :
   le bouton RDV des résultats du scanner reste alors masqué.
   Exemple une fois déployé sur Hostinger : 'https://rdv.eagleeye.digital' */
var RDV_URL = '';

/* En local (tests), on pointe automatiquement vers l'outil de RDV lancé sur la même machine */
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
  RDV_URL = 'http://localhost:3000';
}

/* Sur le VPS Hostinger (domaine de test, avant branchement du domaine définitif) */
if (location.hostname === '186.240.144.188' || location.hostname === 'srv1864501.hstgr.cloud') {
  RDV_URL = 'https://srv1864501.hstgr.cloud:3443';
}

/* Liens directs vers la prise de RDV : tout <a data-rdv="..."> pointe vers
   l'outil (la valeur de data-rdv sert de traceur utm_medium). Masqué si
   l'outil n'est pas disponible (démo GitHub). */
(function(){
  var links = document.querySelectorAll('a[data-rdv]');
  for (var i = 0; i < links.length; i++){
    if (RDV_URL){
      links[i].href = RDV_URL + '/?utm_source=site&utm_medium=' + (links[i].getAttribute('data-rdv') || 'page') + '&utm_campaign=rdv';
    } else {
      links[i].style.display = 'none';
    }
  }
})();

/* ================= Thème clair / sombre ================= */
(function(){
  var root = document.documentElement;
  var btn = document.getElementById('themeBtn');
  if (!btn) return;
  function apply(t){
    root.setAttribute('data-theme', t);
    btn.textContent = t === 'light' ? '🌙' : '☀️';
    try{ localStorage.setItem('eed-theme', t); }catch(e){}
    window.dispatchEvent(new CustomEvent('eedtheme'));
  }
  var saved = null;
  try{ saved = localStorage.getItem('eed-theme'); }catch(e){}
  apply(saved === 'dark' ? 'dark' : 'light');    // clair par défaut
  btn.addEventListener('click', function(){
    apply(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
  });
})();

/* ================= Transition "rapace" entre les pages ================= */
(function(){
  var wipe = document.getElementById('wipe');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var busy = false;

  function pageWipe(go){
    if (reduced || !wipe || busy){ go(); return; }
    busy = true;
    wipe.classList.add('on', 'enter');
    setTimeout(function(){
      go();                                   // changement de page pendant que l'écran est couvert
      wipe.classList.remove('enter');
      wipe.classList.add('exit');
      setTimeout(function(){
        wipe.classList.remove('on', 'exit');
        busy = false;
      }, 580);
    }, 650);
  }

  /* démo : tous les liens internes jouent la transition (écoute en phase de capture,
     par délégation, pour passer avant tout autre gestionnaire) */
  document.addEventListener('click', function(e){
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || href === '#') return;
    var target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    e.stopPropagation();
    pageWipe(function(){
      var root = document.documentElement;
      var prev = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';      // saut instantané pendant que l'écran est couvert
      target.scrollIntoView({behavior: 'auto', block: 'start'});
      root.style.scrollBehavior = prev;
      try{ history.pushState(null, '', href); }catch(err){}
    });
  }, true);

  /* révélation au chargement : la page arrive derrière le rapace */
  if (!reduced && wipe){
    busy = true;
    wipe.classList.add('on', 'hold');
    setTimeout(function(){
      wipe.classList.remove('hold');
      wipe.classList.add('exit');
      setTimeout(function(){
        wipe.classList.remove('on', 'exit');
        busy = false;
      }, 580);
    }, 400);
  }
})();

/* ================= Bandeau : duplication pour boucle infinie ================= */
(function(){
  var track = document.getElementById('tickerTrack');
  if (!track) return;
  track.innerHTML = track.innerHTML + track.innerHTML;
})();

/* ================= Particules réseau (métaphore LinkedIn) ================= */
(function(){
  var canvas = document.getElementById('net');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var hero = canvas.parentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* palettes de particules selon le thème ; une page peut imposer la
     variante orange (A/B test) via window.EED_NET_PALETTE = 'orange' */
  var PALETTES = {
    dark:  { link: '142,110,220', hot: '71,207,230',  node: '163,121,238' },
    light: { link: '14,61,176',   hot: '29,116,232',  node: '22,83,216' }
  };
  var PALETTES_ORANGE = {
    dark:  { link: '255,140,60', hot: '255,122,0',  node: '255,166,77' },
    light: { link: '224,90,0',   hot: '255,106,0',  node: '234,88,12' }
  };
  function pal(){
    var set = window.EED_NET_PALETTE === 'orange' ? PALETTES_ORANGE : PALETTES;
    return document.documentElement.getAttribute('data-theme') === 'light'
      ? set.light : set.dark;
  }
  var C = pal();
  window.addEventListener('eedtheme', function(){ C = pal(); if (reduced) step(); });
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W, H, nodes = [], pulses = [], mouse = {x:-9999, y:-9999};
  var LINK = 150;

  function resize(){
    W = hero.clientWidth; H = hero.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var count = Math.min(90, Math.round(W * H / 16000));
    nodes = [];
    for (var i = 0; i < count; i++){
      nodes.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35,
        r: 1.4 + Math.random() * 2.2,
        hot: Math.random() < .12
      });
    }
  }

  function step(){
    ctx.clearRect(0, 0, W, H);
    var now = performance.now() * .001;
    for (var i = 0; i < nodes.length; i++){
      var a = nodes[i];
      for (var j = i + 1; j < nodes.length; j++){
        var b = nodes[j];
        var dx = a.x - b.x, dy = a.y - b.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < LINK * LINK){
          var t = 1 - Math.sqrt(d2) / LINK;
          /* pulsation douce, déphasée par paire de nœuds */
          var pulse = .7 + .3 * Math.sin(now * 1.6 + i * .7 + j * .35);
          if (a.hot && b.hot){
            /* lien "chaud" : pointillés qui s'écoulent le long de la connexion */
            ctx.strokeStyle = 'rgba(' + C.hot + ',' + (t * .4 * pulse) + ')';
            ctx.setLineDash([5, 7]);
            ctx.lineDashOffset = -now * 22;
          } else {
            ctx.strokeStyle = 'rgba(' + C.link + ',' + (t * .22 * pulse) + ')';
          }
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          ctx.setLineDash([]);
        }
      }
      var mdx = a.x - mouse.x, mdy = a.y - mouse.y;
      var md2 = mdx * mdx + mdy * mdy;
      if (md2 < LINK * LINK * 1.4){
        var mt = 1 - Math.sqrt(md2) / (LINK * 1.2);
        if (mt > 0){
          ctx.strokeStyle = 'rgba(' + C.hot + ',' + (mt * .4) + ')';
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
    }
    for (var p = pulses.length - 1; p >= 0; p--){
      var pu = pulses[p];
      pu.t += .018;
      if (pu.t >= 1){ pulses.splice(p, 1); continue; }
      var px = pu.a.x + (pu.b.x - pu.a.x) * pu.t;
      var py = pu.a.y + (pu.b.y - pu.a.y) * pu.t;
      ctx.fillStyle = 'rgba(' + C.hot + ',' + (1 - pu.t) * .9 + ')';
      ctx.beginPath(); ctx.arc(px, py, 2.6, 0, 7); ctx.fill();
    }
    for (var k = 0; k < nodes.length; k++){
      var n = nodes[k];
      if (n.hot){
        ctx.fillStyle = 'rgba(' + C.hot + ',.9)';
        ctx.shadowColor = 'rgba(' + C.hot + ',.8)';
        ctx.shadowBlur = 8;
      } else {
        ctx.fillStyle = 'rgba(' + C.node + ',.55)';
        ctx.shadowBlur = 0;
      }
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, 7); ctx.fill();
      ctx.shadowBlur = 0;
      n.x += n.vx; n.y += n.vy;
      if (n.x < -20) n.x = W + 20; else if (n.x > W + 20) n.x = -20;
      if (n.y < -20) n.y = H + 20; else if (n.y > H + 20) n.y = -20;
    }
  }

  function loop(){ step(); requestAnimationFrame(loop); }
  function spawnPulse(){
    var tries = 12;
    while (tries--){
      var a = nodes[Math.floor(Math.random() * nodes.length)];
      var b = nodes[Math.floor(Math.random() * nodes.length)];
      if (!a || !b || a === b) continue;
      var dx = a.x - b.x, dy = a.y - b.y;
      if (dx * dx + dy * dy < LINK * LINK){ pulses.push({a: a, b: b, t: 0}); break; }
    }
  }

  window.addEventListener('resize', resize);
  hero.addEventListener('pointermove', function(e){
    var r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  });
  hero.addEventListener('pointerleave', function(){ mouse.x = -9999; mouse.y = -9999; });

  resize();
  if (reduced){ step(); }
  else { loop(); setInterval(spawnPulse, 1600); }
})();

/* ================= Scanner — questionnaire 10 questions ================= */
(function(){
  var intro = document.getElementById('quizIntro');
  if (!intro) return;

  /* UTM de la page (pubs Meta…) : suivent le prospect jusqu'à l'admin */
  function pageUtm(){
    var out = {};
    try {
      var p = new URLSearchParams(location.search);
      ['utm_source', 'utm_medium', 'utm_campaign'].forEach(function(k){
        var v = p.get(k);
        if (v) out[k] = String(v).slice(0, 100);
      });
    } catch(e){}
    return out;
  }
  var quiz = document.getElementById('quiz');
  var log = document.getElementById('scanLog');
  var results = document.getElementById('results');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Deux scanners cohabitent :
     - v1 (accueil) : le Mini-Audit rapide — 10 questions, 3 axes.
     - v2 (/scan, /scan-b) : le lead magnet complet — 13 questions notées sur
       les 5 piliers 3C+2 + 4 de qualification + 1 ouverte.
     La page choisit via window.EED_SCANNER_VERSION = 2 (défaut : v1).
     Synchronisé avec backend/services/scanner.js (serveur) et l'admin. */
  var IS_V2 = window.EED_SCANNER_VERSION === 2;

  var QUESTIONS_V1 = [
    { axis: 'vis', q: 'Que dit le titre de votre profil LinkedIn ?',
      opts: [['Mon intitulé de poste (« Consultant », « Coach »…)', 0],
             ['Mon métier et ma cible', 5],
             ['Le bénéfice concret que j’apporte à mes clients', 10]],
      reco: 'Réécrivez votre titre : le bénéfice que vous apportez à vos clients, pas votre intitulé de poste.' },
    { axis: 'vis', q: 'À quelle fréquence publiez-vous du contenu ?',
      opts: [['Jamais ou presque', 0],
             ['Moins d’une fois par mois', 3],
             ['Environ une fois par semaine', 7],
             ['Plusieurs fois par semaine', 10]],
      reco: 'Publiez au moins une fois par semaine : un conseil concret pour votre cible suffit.' },
    { axis: 'vis', q: 'Photo professionnelle et bannière personnalisée ?',
      opts: [['Ni l’un ni l’autre', 0],
             ['Photo pro, mais bannière par défaut', 5],
             ['Les deux, alignées avec mon offre', 10]],
      reco: 'Ajoutez une photo pro et une bannière qui annonce votre promesse. C’est la première chose qu’on voit.' },
    { axis: 'cred', q: 'Combien de recommandations clients sont visibles sur votre profil ?',
      opts: [['Aucune', 0],
             ['Une ou deux', 5],
             ['Trois ou plus, récentes', 10]],
      reco: 'Demandez 2-3 recommandations à vos derniers clients satisfaits. C’est la preuve sociale n°1 sur LinkedIn.' },
    { axis: 'cred', q: 'Votre section « Infos » (le résumé en haut du profil)…',
      opts: [['Est vide ou presque', 0],
             ['Raconte mon parcours, comme un CV', 4],
             ['Parle des problèmes de mes clients et de mes résultats', 10]],
      reco: 'Réécrivez votre section Infos côté client : leur problème, votre méthode, une preuve chiffrée.' },
    { axis: 'cred', q: 'Partagez-vous des preuves de résultats (études de cas, chiffres, témoignages) ?',
      opts: [['Jamais', 0],
             ['Rarement', 5],
             ['Régulièrement', 10]],
      reco: 'Publiez une étude de cas chiffrée par mois : rien ne convainc plus qu’un résultat client réel.' },
    { axis: 'pros', q: 'Quelle est la taille de votre réseau ?',
      opts: [['Moins de 500 relations', 2],
             ['500 à 2 000', 6],
             ['2 000 à 5 000', 8],
             ['Plus de 5 000', 10]],
      reco: 'Élargissez votre réseau avec des profils qui ressemblent à vos clients. La portée de vos posts en dépend.' },
    { axis: 'pros', q: 'Envoyez-vous des demandes de connexion ciblées ?',
      opts: [['Jamais', 0],
             ['De temps en temps, sans message', 4],
             ['Régulièrement, avec un message personnalisé', 10]],
      reco: 'Envoyez 10 demandes ciblées par jour avec un message d’ouverture personnalisé, sans pitch.' },
    { axis: 'pros', q: 'Vos premiers messages aux nouveaux contacts parlent…',
      opts: [['Je n’envoie pas de message', 0],
             ['De mon offre et de mes services', 4],
             ['De leur activité et de leurs enjeux', 10]],
      reco: 'Ouvrez la conversation sur leurs enjeux, jamais sur votre offre. Le pitch vient plus tard.' },
    { axis: 'pros', q: 'Relancez-vous les contacts restés silencieux ?',
      opts: [['Jamais', 0],
             ['Parfois, au feeling', 5],
             ['Oui, avec un processus de relance', 10]],
      reco: 'Mettez en place 2 relances espacées : la majorité des réponses arrivent après la première relance.' }
  ];

  var QUESTIONS_V2 = [
    /* — Crédibilité — */
    { axis: 'cred', q: 'Tapez votre nom dans Google : que découvre un prospect ?',
      opts: [['Pas grand-chose, ou des homonymes', 0],
             ['Mon profil LinkedIn, avec mon intitulé de poste', 5],
             ['Mon profil, avec le bénéfice concret que j’apporte à mes clients', 10]],
      reco: 'Réécrivez votre titre : le bénéfice que vous apportez à vos clients, pas votre intitulé de poste.' },
    { axis: 'cred', q: 'À quelle fréquence publiez-vous, et avec quelle variété ?',
      opts: [['Jamais ou presque', 0],
             ['De temps en temps, quand l’inspiration vient', 3],
             ['Chaque semaine, mais souvent le même type de post', 7],
             ['Chaque semaine, en variant les angles (conseil, preuve, avis…)', 10]],
      reco: 'Publiez chaque semaine en variant les angles : un conseil, une preuve client, un avis tranché. Le même post en boucle lasse votre réseau.' },
    { axis: 'cred', q: 'Un visiteur de votre profil y trouve-t-il des preuves (recommandations, résultats chiffrés) ?',
      opts: [['Aucune preuve visible', 0],
             ['Quelques recommandations, anciennes', 5],
             ['Des recommandations récentes et des résultats chiffrés', 10]],
      reco: 'Affichez vos preuves : 2-3 recommandations récentes et un résultat client chiffré. C’est ce qui fait basculer la décision.' },
    /* — Connexions — */
    { axis: 'conn', q: 'Quelle est la taille de votre réseau ?',
      opts: [['Moins de 500 relations', 2],
             ['500 à 2 000', 6],
             ['2 000 à 5 000', 8],
             ['Plus de 5 000', 10]],
      reco: 'Élargissez votre réseau avec des profils qui ressemblent à vos clients. La portée de vos posts en dépend.' },
    { axis: 'conn', q: 'Combien de demandes de connexion ciblées envoyez-vous par mois ?',
      opts: [['Aucune, ou au hasard', 0],
             ['Quelques-unes, sans message', 4],
             ['Plusieurs dizaines, avec un message personnalisé', 8],
             ['Plus de 100, à la main ou avec un outil, toujours ciblées', 10]],
      reco: 'Envoyez des invitations ciblées chaque jour, avec un message personnalisé, sans pitch.' },
    { axis: 'conn', q: 'Votre réseau ressemble-t-il à vos clients idéaux ?',
      opts: [['Surtout des confrères et des connaissances', 0],
             ['Un mélange, sans logique particulière', 5],
             ['Majoritairement des profils qui ressemblent à mes clients', 10]],
      reco: 'Reconstruisez votre réseau autour de vos cibles : un réseau de confrères ne produit aucune opportunité.' },
    /* — Conquête — */
    { axis: 'conq', q: 'Vos premiers messages aux nouveaux contacts parlent…',
      opts: [['Je n’envoie pas de message', 0],
             ['De mon offre et de mes services', 4],
             ['De leur activité et de leurs enjeux', 10]],
      reco: 'Ouvrez la conversation sur leurs enjeux, jamais sur votre offre. Le pitch vient plus tard.' },
    { axis: 'conq', q: 'Combien de vraies conversations de prospection démarrez-vous chaque semaine ?',
      opts: [['Aucune, ou presque', 0],
             ['Une ou deux', 4],
             ['Cinq à dix', 8],
             ['Plus de dix', 10]],
      reco: 'Visez 10 nouvelles conversations par semaine : souvent le message est bon, il n’est simplement pas assez envoyé.' },
    { axis: 'conq', q: 'Relancez-vous les contacts restés silencieux ?',
      opts: [['Jamais', 0],
             ['Parfois, au feeling', 5],
             ['Oui, avec un processus de relance', 10]],
      reco: 'Mettez en place 2 relances espacées : la majorité des réponses arrivent après la première relance.' },
    /* — Conversion — */
    { axis: 'conv', q: 'Sur 10 rendez-vous, combien deviennent des clients ?',
      opts: [['Je ne mesure pas', 0],
             ['Moins de 2', 4],
             ['Entre 2 et 5', 7],
             ['Plus de 5', 10]],
      reco: 'Mesurez votre taux de transformation rendez-vous → clients : on ne règle pas ce qu’on ne mesure pas.' },
    { axis: 'conv', q: 'Votre offre : un prospect peut-il facilement la refuser ?',
      opts: [['Je vends surtout du temps (jours, séances…)', 0],
             ['J’ai une offre structurée, mais comparable à d’autres', 5],
             ['Ma promesse et mes garanties ne se trouvent pas ailleurs', 10]],
      reco: 'Rendez votre offre difficile à refuser : promesse claire, résultat mesurable, garantie. À nombre de rendez-vous égal, c’est le levier n°1.' },
    /* — Catalyse — */
    { axis: 'cata', q: 'Combien de temps votre prospection vous coûte-t-elle chaque jour ?',
      opts: [['Aucun : je ne prospecte pas', 0],
             ['Plus d’une heure, par à-coups', 4],
             ['Environ une heure, régulière', 7],
             ['Moins de 30 minutes, avec un système rodé', 10]],
      reco: 'Structurez une routine de prospection de 25 minutes par jour : régulière, outillée, tenable dans la durée.' },
    { axis: 'cata', q: 'Quelle place occupe l’intelligence artificielle dans votre prospection ?',
      opts: [['Aucune', 0],
             ['Elle m’aide à rédiger des posts ou des messages', 5],
             ['C’est un vrai collaborateur : ciblage, messages, relances, suivi', 10]],
      reco: 'Faites de l’IA un collaborateur : ciblage, préparation des messages, relances et suivi — pas seulement la rédaction de posts.' }
  ];

  /* Questions de qualification (v2 uniquement) : jamais notées */
  var QUALIF_V2 = [
    { q: 'Votre situation aujourd’hui ?',
      opts: ['Indépendant / solo', 'Dirigeant de TPE (2-10 personnes)', 'Salarié, en transition ou en lancement', 'Autre'] },
    { q: 'Votre objectif prioritaire à 90 jours ?',
      opts: ['Obtenir mes premiers clients via LinkedIn', 'Des rendez-vous plus réguliers', 'Mieux convertir mes rendez-vous', 'Déléguer et gagner du temps'] },
    { q: 'Votre principal obstacle aujourd’hui ?',
      opts: ['Le manque de temps', 'Je ne sais pas quoi dire ou publier', 'Peu de réponses à mes messages', 'Des rendez-vous qui ne signent pas'] },
    { q: 'Comment préférez-vous avancer ?',
      opts: ['Me former et avancer en autonomie', 'Être accompagné pas à pas', 'Déléguer un maximum', 'Je ne sais pas encore'] }
  ];

  var FALLBACK_RECOS = [
    'Systématisez ce qui fonctionne : fixez-vous un rythme hebdomadaire de publication et de prospection.',
    'Passez à l’échelle : ajoutez l’emailing et la publicité à votre dispositif LinkedIn.',
    'Mesurez chaque étape : vues, taux de réponse, RDV. Ce qui se mesure s’améliore.'
  ];

  var STEPS = IS_V2 ? [
    'Analyse de vos réponses…',
    'Crédibilité : votre profil vend-il pour vous ?',
    'Connexions : votre réseau contient-il vos clients ?',
    'Conquête : vos conversations démarrent-elles ?',
    'Conversion et catalyse : combien signent, à quel coût en temps ?',
    'Rapport généré.'
  ] : [
    'Analyse de vos réponses…',
    'Évaluation de votre visibilité…',
    'Évaluation de votre crédibilité…',
    'Calcul de votre potentiel de prospection…',
    'Comparaison avec les profils qui performent…',
    'Rapport généré.'
  ];

  var QUESTIONS = IS_V2 ? QUESTIONS_V2 : QUESTIONS_V1;
  var QUALIF = IS_V2 ? QUALIF_V2 : [];
  var PILLARS = IS_V2 ? ['cred', 'conn', 'conq', 'conv', 'cata'] : ['vis', 'cred', 'pros'];
  var TOTAL_STEPS = QUESTIONS.length + QUALIF.length + (IS_V2 ? 1 : 0); // v2 : + question ouverte

  var current = 0;
  var answers = [];
  var qualifAnswers = [];
  var openNote = '';

  function maxPts(q){
    return q.opts.reduce(function(m, o){ return Math.max(m, o[1]); }, 0);
  }

  function computeScores(){
    var sum = {}, max = {};
    PILLARS.forEach(function(p){ sum[p] = 0; max[p] = 0; });
    QUESTIONS.forEach(function(q, i){
      sum[q.axis] += q.opts[answers[i]][1];
      max[q.axis] += maxPts(q);
    });
    var s = { global: 0 };
    var total = 0;
    PILLARS.forEach(function(p){
      s[p] = Math.round(sum[p] / max[p] * 100);
      total += s[p];
    });
    s.global = Math.round(total / PILLARS.length);
    return s;
  }

  function computeRecos(){
    var weak = QUESTIONS.map(function(q, i){
      return { reco: q.reco, ratio: q.opts[answers[i]][1] / maxPts(q) };
    }).filter(function(c){ return c.ratio < 0.99; })
      .sort(function(a, b){ return a.ratio - b.ratio; })
      .slice(0, 3)
      .map(function(c){ return c.reco; });
    for (var i = 0; weak.length < 3; i++) weak.push(FALLBACK_RECOS[i]);
    return weak;
  }

  function verdictFor(g){
    if (g < 40) return '<b>Fondations à poser.</b> Bonne nouvelle : c’est ici que la progression est la plus rapide.';
    if (g < 60) return '<b>Potentiel sous-exploité.</b> Les bases sont là, mais votre prospection ne convertit pas à la hauteur de votre expertise.';
    if (g < 75) return '<b>Bonne machine, mal réglée.</b> Quelques ajustements ciblés peuvent doubler vos rendez-vous.';
    return IS_V2
      ? '<b>Machine en place.</b> Vous êtes prêt à passer à l’échelle sans y passer plus de temps.'
      : '<b>Profil solide.</b> Vous êtes prêt à passer à l’échelle avec une approche multicanale.';
  }

  /* Texte du bloc rendez-vous selon la tranche de score : l'argument varie,
     la destination est toujours la même — la conversation. */
  function rdvPitchFor(g){
    if (g < 40) return 'Vous n’avez pas besoin d’un grand programme, vous avez besoin de savoir par où commencer. 30 minutes pour poser votre feuille de route, avec votre diagnostic sous les yeux.';
    if (g < 75) return 'Votre machine existe, elle est mal réglée. On regarde ensemble les deux réglages qui débloqueront le plus de rendez-vous chez vous. 30 minutes, avec votre diagnostic sous les yeux.';
    return 'Votre socle est solide. La question devient le volume et la délégation : comment aller plus loin sans y passer plus de temps. 30 minutes pour en parler.';
  }

  /* ---- rendu du questionnaire : 13 notées, 4 qualification, 1 ouverte ---- */
  function renderQuestion(){
    document.getElementById('quizProgress').textContent = (current + 1) + '/' + TOTAL_STEPS;
    document.getElementById('quizBarFill').style.width = Math.round(current / TOTAL_STEPS * 100) + '%';
    document.getElementById('quizBack').disabled = current === 0;

    var opts = document.getElementById('quizOpts');
    opts.innerHTML = '';

    if (current < QUESTIONS.length){
      /* question notée */
      var q = QUESTIONS[current];
      document.getElementById('quizQ').textContent = q.q;
      q.opts.forEach(function(o, i){
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'quiz-opt';
        b.textContent = o[0];
        b.addEventListener('click', function(){ answers[current] = i; next(); });
        opts.appendChild(b);
      });
    } else if (current < QUESTIONS.length + QUALIF.length){
      /* question de qualification (non notée) */
      var k = current - QUESTIONS.length;
      var qq = QUALIF[k];
      document.getElementById('quizQ').textContent = qq.q;
      qq.opts.forEach(function(label, i){
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'quiz-opt';
        b.textContent = label;
        b.addEventListener('click', function(){ qualifAnswers[k] = i; next(); });
        opts.appendChild(b);
      });
    } else {
      /* question ouverte facultative */
      document.getElementById('quizQ').textContent = 'Un mot sur votre activité ? (facultatif)';
      var ta = document.createElement('textarea');
      ta.className = 'quiz-open';
      ta.rows = 3;
      ta.maxLength = 300;
      ta.placeholder = 'Votre métier, vos clients, ce qui vous amène…';
      ta.value = openNote;
      opts.appendChild(ta);
      var done = document.createElement('button');
      done.type = 'button';
      done.className = 'quiz-opt quiz-opt-main';
      done.textContent = 'Voir mon score';
      done.addEventListener('click', function(){ openNote = ta.value.trim().slice(0, 300); next(); });
      opts.appendChild(done);
    }

    if (!reduced){
      var step = document.getElementById('quizStep');
      step.style.animation = 'none';
      void step.offsetWidth;
      step.style.animation = '';
    }
  }

  function next(){
    if (current < TOTAL_STEPS - 1){
      current++;
      renderQuestion();
    } else {
      quiz.style.display = 'none';
      runAnalysis();
    }
  }

  /* ---- animation d'analyse puis résultats ---- */
  function runAnalysis(){
    var s = computeScores();
    var recos = computeRecos();
    document.getElementById('reportOk').style.display = 'none';
    document.getElementById('reportForm').style.display = 'flex';

    if (reduced){ showResults(s, recos); return; }

    log.style.display = 'flex';
    log.innerHTML = '';
    var bar = document.createElement('div');
    bar.className = 'scan-bar';
    bar.innerHTML = '<i></i>';

    STEPS.forEach(function(txt, i){
      var line = document.createElement('div');
      line.className = 'line';
      line.innerHTML = '<span class="st"></span><span>' + txt + '</span>';
      log.appendChild(line);
      setTimeout(function(){
        line.classList.add('on');
        bar.firstChild.style.width = Math.round(((i + 1) / STEPS.length) * 100) + '%';
        if (i > 0) log.children[i - 1].classList.add('done');
      }, 420 * (i + 1));
    });
    log.appendChild(bar);
    setTimeout(function(){ showResults(s, recos); }, 420 * STEPS.length + 650);
  }

  function ringSVG(val){
    var r = 44, c = 2 * Math.PI * r;
    return '<svg viewBox="0 0 104 104" aria-hidden="true">' +
      '<defs><linearGradient id="gr" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" style="stop-color:var(--g1)"/><stop offset="1" style="stop-color:var(--g2)"/></linearGradient></defs>' +
      '<circle cx="52" cy="52" r="' + r + '" fill="none" stroke="rgba(167,159,198,.18)" stroke-width="8"/>' +
      '<circle cx="52" cy="52" r="' + r + '" fill="none" stroke="url(#gr)" stroke-width="8" stroke-linecap="round" ' +
      'stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + (c * (1 - val / 100)).toFixed(1) + '" ' +
      'transform="rotate(-90 52 52)"/></svg>';
  }

  function showResults(s, recos){
    log.style.display = 'none';
    results.style.display = 'block';
    var ring = document.getElementById('scoreRing');
    ring.innerHTML = ringSVG(s.global) + '<span class="val">' + s.global + '</span>';
    document.getElementById('verdict').innerHTML = verdictFor(s.global);

    var bars = document.getElementById('bars');
    bars.innerHTML = '';
    (IS_V2
      ? [['Crédibilité', s.cred], ['Connexions', s.conn], ['Conquête', s.conq], ['Conversion', s.conv], ['Catalyse', s.cata]]
      : [['Visibilité', s.vis], ['Crédibilité', s.cred], ['Prospection', s.pros]]
    ).forEach(function(pair){
      var row = document.createElement('div');
      row.className = 'bar-row';
      row.innerHTML = '<span class="lab">' + pair[0] + '</span>' +
        '<span class="track"><span class="fill"></span></span>' +
        '<span class="num">' + pair[1] + '</span>';
      bars.appendChild(row);
      requestAnimationFrame(function(){
        requestAnimationFrame(function(){ row.querySelector('.fill').style.width = pair[1] + '%'; });
      });
    });

    var rc = document.getElementById('recos');
    rc.innerHTML = '';
    recos.forEach(function(txt, i){
      var li = document.createElement('li');
      li.innerHTML = '<span class="n">' + (i + 1) + '</span><span>' + txt + '</span>';
      rc.appendChild(li);
    });

    /* met en brillance l'étape du plan de vol correspondant au score */
    var stageIdx = s.global < 40 ? 0 : (s.global < 70 ? 1 : 2);
    document.querySelectorAll('.stage').forEach(function(st, i){
      st.classList.toggle('reco', i === stageIdx);
    });
    var flight = document.querySelector('.flight');
    if (flight) flight.classList.add('has-reco');

    var u = pageUtm();
    var rdv = document.getElementById('rdvCta');
    var pitch = document.getElementById('rdvPitch');

    if (IS_V2){
      /* v2 : une seule porte de sortie — le RDV, avec l'argument de la tranche.
         Exception : score faible + envie d'avancer en autonomie = pas de RDV
         poussé, le rapport par email suffit (protège l'agenda sans rien perdre). */
      var autonomy = s.global < 40 && qualifAnswers[3] === 0;
      if (pitch){
        pitch.textContent = rdvPitchFor(s.global);
        pitch.style.display = autonomy ? 'none' : 'block';
      }
      if (rdv && RDV_URL && !autonomy){
        var q2 = 'eed_score=' + s.global + '&eed_v=2' +
                '&eed_rep=' + answers.join('-') +
                '&eed_qual=' + qualifAnswers.join('-') +
                (window.EED_VARIANT ? '&eed_var=' + window.EED_VARIANT : '') +
                '&utm_source=' + encodeURIComponent(u.utm_source || 'site') +
                '&utm_medium=scanner' +
                '&utm_campaign=' + encodeURIComponent(u.utm_campaign || 'diagnostic');
        rdv.href = RDV_URL + (RDV_URL.indexOf('?') === -1 ? '?' : '&') + q2;
        rdv.style.display = 'flex';
      } else if (rdv) {
        rdv.style.display = 'none';
      }
    } else {
      /* v1 (accueil) : bouton RDV avec le score et les 3 axes, comme à l'origine */
      if (pitch) pitch.style.display = 'none';
      if (rdv && RDV_URL){
        var q1 = 'eed_score=' + s.global + '&eed_vis=' + s.vis + '&eed_cred=' + s.cred + '&eed_pros=' + s.pros +
                '&eed_rep=' + answers.join('-') +
                '&utm_source=' + encodeURIComponent(u.utm_source || 'site') +
                '&utm_medium=scanner' +
                '&utm_campaign=' + encodeURIComponent(u.utm_campaign || 'diagnostic');
        rdv.href = RDV_URL + (RDV_URL.indexOf('?') === -1 ? '?' : '&') + q1;
        rdv.style.display = 'flex';
      }
    }
  }

  /* ---- navigation ---- */
  document.getElementById('startQuiz').addEventListener('click', function(){
    intro.style.display = 'none';
    quiz.style.display = 'flex';
    current = 0;
    answers = [];
    qualifAnswers = [];
    openNote = '';
    renderQuestion();
  });

  document.getElementById('quizBack').addEventListener('click', function(){
    if (current > 0){ current--; renderQuestion(); }
  });

  document.getElementById('reportForm').addEventListener('submit', function(e){
    e.preventDefault();
    var form = this;
    var ok = document.getElementById('reportOk');
    var emailInput = form.querySelector('input[type="email"]');
    var btn = form.querySelector('button');

    /* Sans backend (démo GitHub), on garde le comportement de simulation */
    if (!RDV_URL){
      form.style.display = 'none';
      ok.style.display = 'block';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Envoi en cours…';
    fetch(RDV_URL + '/api/public/scanner-audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign(
        IS_V2
          ? { email: emailInput.value, reponses: answers.join('-'),
              qualif: qualifAnswers.join('-'), note: openNote,
              variant: window.EED_VARIANT || undefined }
          : { email: emailInput.value, reponses: answers.join('-') },
        pageUtm()))
    }).then(function(r){
      if (!r.ok) throw new Error('HTTP ' + r.status);
      form.style.display = 'none';
      ok.textContent = '✔ Audit envoyé ! Vérifiez votre boîte mail (et les indésirables la première fois).';
      ok.style.display = 'block';
    }).catch(function(){
      btn.disabled = false;
      btn.textContent = 'Recevoir mon plan d’action pour les 30 prochains jours';
      ok.textContent = 'L’envoi a échoué. Réessayez dans un instant ou réservez directement un rendez-vous.';
      ok.style.display = 'block';
    });
  });

  document.getElementById('rescan').addEventListener('click', function(){
    results.style.display = 'none';
    intro.style.display = 'flex';
  });
})();

/* ================= Témoignages vidéo Viméo : lecture au clic =================
   dnt=1 : mode « ne pas suivre » de Viméo, aucun cookie de pistage. */
(function(){
  var slots = document.querySelectorAll('.video-temo');
  if (!slots.length) return;
  var current = null;

  function stop(slot){
    var f = slot.querySelector('iframe');
    if (f) f.remove();
    slot.classList.remove('playing');
  }

  for (var i = 0; i < slots.length; i++)(function(slot){
    slot.addEventListener('click', function(){
      if (slot.classList.contains('playing')) return; // le player Viméo a la main
      if (current && current !== slot) stop(current); // une seule vidéo à la fois
      current = slot;
      var id = slot.getAttribute('data-vimeo-id');
      var h = slot.getAttribute('data-vimeo-h');
      var f = document.createElement('iframe');
      f.src = 'https://player.vimeo.com/video/' + id + '?' + (h ? 'h=' + h + '&' : '') +
              'autoplay=1&dnt=1&byline=0&title=0&portrait=0';
      f.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
      f.setAttribute('allowfullscreen', '');
      f.setAttribute('title', slot.getAttribute('aria-label') || 'Témoignage vidéo');
      slot.appendChild(f);
      slot.classList.add('playing');
    });
  })(slots[i]);
})();

/* ================= Carrousel équipe : un cran à la fois ================= */
(function(){
  var wrap = document.querySelector('.founder-slides');
  if (!wrap) return;
  var slides = wrap.querySelectorAll('.founder-slide');
  var dots = document.querySelectorAll('.founder-dot');
  if (slides.length < 2) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var idx = 0, timer = null;

  function show(i){
    idx = (i + slides.length) % slides.length;
    for (var k = 0; k < slides.length; k++){
      slides[k].classList.toggle('on', k === idx);
      if (dots[k]) dots[k].classList.toggle('on', k === idx);
    }
  }
  function stop(){ if (timer){ clearInterval(timer); timer = null; } }
  function start(){
    if (reduced) return; // pas de rotation auto si l'utilisateur préfère moins d'animations
    stop();
    timer = setInterval(function(){ show(idx + 1); }, 7500);
  }

  for (var d = 0; d < dots.length; d++)(function(i){
    dots[i].addEventListener('click', function(){ show(i); start(); });
  })(d);

  /* pause pendant la lecture : le survol fige la slide en cours */
  var section = document.querySelector('.founder');
  if (section){
    section.addEventListener('mouseenter', stop);
    section.addEventListener('mouseleave', start);
  }

  show(0);
  start();
})();

/* ================= Chaîne d'usine : étape active en cycle ================= */
(function(){
  var machines = document.querySelectorAll('.machine');
  var wrap = document.querySelector('.machines');
  if (!machines.length) return;
  var STEP_MS = 10000;   // durée d'affichage de chaque étape avant de passer à la suivante
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var idx = 0;
  var hovering = false;

  function setActive(i){
    machines.forEach(function(m, j){ m.classList.toggle('on', j === i); });
  }
  function clearActive(){
    machines.forEach(function(m){ m.classList.remove('on'); });
  }

  /* le survol prend la main : cycle éteint et en pause tant que la souris est sur les machines.
     La dernière machine survolée devient l'étape courante — elle reste allumée à la sortie. */
  wrap.addEventListener('mouseenter', function(){ hovering = true; clearActive(); });
  wrap.addEventListener('mouseleave', function(){ hovering = false; setActive(idx); });
  machines.forEach(function(m, j){
    m.addEventListener('mouseenter', function(){ idx = j; });
  });

  setActive(0);
  if (!reduced){
    setInterval(function(){
      if (hovering) return;
      idx = (idx + 1) % machines.length;
      setActive(idx);
    }, STEP_MS);
  }
})();
