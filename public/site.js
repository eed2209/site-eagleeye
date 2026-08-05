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

  /* palettes de particules selon le thème */
  var PALETTES = {
    dark:  { link: '142,110,220', hot: '71,207,230',  node: '163,121,238' },
    light: { link: '14,61,176',   hot: '29,116,232',  node: '22,83,216' }
  };
  function pal(){
    return document.documentElement.getAttribute('data-theme') === 'light'
      ? PALETTES.light : PALETTES.dark;
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
  var quiz = document.getElementById('quiz');
  var log = document.getElementById('scanLog');
  var results = document.getElementById('results');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Barème réel : 3 questions Visibilité, 3 Crédibilité, 4 Prospection.
     Chaque réponse vaut des points ; le score d'un axe = points / max × 100. */
  var QUESTIONS = [
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

  var FALLBACK_RECOS = [
    'Systématisez ce qui fonctionne : fixez-vous un rythme hebdomadaire de publication et de prospection.',
    'Passez à l’échelle : ajoutez l’emailing et la publicité à votre dispositif LinkedIn.',
    'Mesurez chaque étape : vues, taux de réponse, RDV. Ce qui se mesure s’améliore.'
  ];

  var STEPS = [
    'Analyse de vos réponses…',
    'Évaluation de votre visibilité…',
    'Évaluation de votre crédibilité…',
    'Calcul de votre potentiel de prospection…',
    'Comparaison avec les profils qui performent…',
    'Rapport généré.'
  ];

  var current = 0;
  var answers = [];

  function maxPts(q){
    return q.opts.reduce(function(m, o){ return Math.max(m, o[1]); }, 0);
  }

  function computeScores(){
    var sum = { vis: 0, cred: 0, pros: 0 }, max = { vis: 0, cred: 0, pros: 0 };
    QUESTIONS.forEach(function(q, i){
      sum[q.axis] += q.opts[answers[i]][1];
      max[q.axis] += maxPts(q);
    });
    var vis = Math.round(sum.vis / max.vis * 100);
    var cred = Math.round(sum.cred / max.cred * 100);
    var pros = Math.round(sum.pros / max.pros * 100);
    return { vis: vis, cred: cred, pros: pros, global: Math.round((vis + cred + pros) / 3) };
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
    return '<b>Profil solide.</b> Vous êtes prêt à passer à l’échelle avec une approche multicanale.';
  }

  /* ---- rendu du questionnaire ---- */
  function renderQuestion(){
    var q = QUESTIONS[current];
    document.getElementById('quizProgress').textContent = (current + 1) + '/' + QUESTIONS.length;
    document.getElementById('quizBarFill').style.width = Math.round(current / QUESTIONS.length * 100) + '%';
    document.getElementById('quizBack').disabled = current === 0;
    document.getElementById('quizQ').textContent = q.q;

    var opts = document.getElementById('quizOpts');
    opts.innerHTML = '';
    q.opts.forEach(function(o, i){
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'quiz-opt';
      b.textContent = o[0];
      b.addEventListener('click', function(){ answer(i); });
      opts.appendChild(b);
    });

    if (!reduced){
      var step = document.getElementById('quizStep');
      step.style.animation = 'none';
      void step.offsetWidth;
      step.style.animation = '';
    }
  }

  function answer(i){
    answers[current] = i;
    if (current < QUESTIONS.length - 1){
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
    [['Visibilité', s.vis], ['Crédibilité', s.cred], ['Prospection', s.pros]].forEach(function(pair){
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

    /* bouton RDV : transmet le score et les réponses à l'outil de prise de rendez-vous */
    var rdv = document.getElementById('rdvCta');
    if (rdv && RDV_URL){
      var q = 'eed_score=' + s.global + '&eed_vis=' + s.vis + '&eed_cred=' + s.cred + '&eed_pros=' + s.pros +
              '&eed_rep=' + answers.join('-') +
              '&utm_source=site&utm_medium=scanner&utm_campaign=diagnostic';
      rdv.href = RDV_URL + (RDV_URL.indexOf('?') === -1 ? '?' : '&') + q;
      rdv.style.display = 'flex';
    }
  }

  /* ---- navigation ---- */
  document.getElementById('startQuiz').addEventListener('click', function(){
    intro.style.display = 'none';
    quiz.style.display = 'flex';
    current = 0;
    answers = [];
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
      body: JSON.stringify({ email: emailInput.value, reponses: answers.join('-') })
    }).then(function(r){
      if (!r.ok) throw new Error('HTTP ' + r.status);
      form.style.display = 'none';
      ok.textContent = '✔ Audit envoyé ! Vérifiez votre boîte mail (et les indésirables la première fois).';
      ok.style.display = 'block';
    }).catch(function(){
      btn.disabled = false;
      btn.textContent = 'Recevoir mon rapport complet';
      ok.textContent = 'L’envoi a échoué. Réessayez dans un instant ou réservez directement un rendez-vous.';
      ok.style.display = 'block';
    });
  });

  document.getElementById('rescan').addEventListener('click', function(){
    results.style.display = 'none';
    intro.style.display = 'flex';
  });
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
