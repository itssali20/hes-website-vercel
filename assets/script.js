(function(){
  if(window.__hesHomeInit) return; window.__hesHomeInit = true;
  var G = window.gsap;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var useG = !!G && !reduce;
  if(useG && window.ScrollTrigger) G.registerPlugin(ScrollTrigger);

  function refresh(){ if(window.ScrollTrigger) ScrollTrigger.refresh(); }

  /* ---------- photos fade in only once they really load ---------- */
  document.querySelectorAll('.ph img').forEach(function(img){
    if(img.complete && img.naturalWidth > 0) img.classList.add('ok');
    else img.addEventListener('load', function(){ img.classList.add('ok'); });
  });

  /* ---------- keep ScrollTrigger's positions honest on a long, image-heavy
     page: images/fonts finishing late shift the page height, which can leave
     later sections' reveal-triggers pointing at stale (too-early) positions
     so they never fire and that content stays invisible. Re-measure once
     everything has actually settled. ---------- */
  window.addEventListener('load', refresh);
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  window.addEventListener('load', function(){ setTimeout(refresh, 600); setTimeout(refresh, 1800); });

  /* ---------- absolute fail-safe: whatever the cause, nothing on this page
     should be able to stay permanently invisible. If a [data-rise]/
     [data-rise-row]/[data-hero] element's reveal animation never ran (stale
     trigger, blocked CDN, any future edge case), force it visible after a
     few seconds instead of leaving a dead gap on the page. ---------- */
  function unstick(){
    document.querySelectorAll('[data-rise],[data-rise-row],[data-hero],.bookrow .bk').forEach(function(el){
      if(parseFloat(window.getComputedStyle(el).opacity) < 0.05 && el.getBoundingClientRect().top < window.innerHeight){
        el.style.opacity = '1'; el.style.transform = 'none';
      }
    });
  }
  setTimeout(unstick, 2500);
  var unstickT;
  window.addEventListener('scroll', function(){ clearTimeout(unstickT); unstickT = setTimeout(unstick, 1500); }, {passive:true});

  /* ---------- height animation helper (works with or without GSAP) ---------- */
  function setOpen(el, open, done){
    if(open){
      var target = el.scrollHeight;
      el.style.visibility = 'visible';
      if(useG){ G.fromTo(el, {height:0}, {height:target, duration:.42, ease:'power2.out',
        onComplete:function(){ el.style.height=''; refresh(); if(done) done(); }}); }
      else { el.style.height=''; refresh(); if(done) done(); }
    } else {
      if(useG){ G.fromTo(el, {height:el.scrollHeight}, {height:0, duration:.32, ease:'power2.in',
        onComplete:function(){ el.style.height=''; el.style.visibility=''; refresh(); if(done) done(); }}); }
      else { el.style.height=''; el.style.visibility=''; refresh(); if(done) done(); }
    }
  }

  /* ---------- header search panel ---------- */
  var st = document.getElementById('searchToggle'), sp = document.getElementById('searchPanel');
  st.addEventListener('click', function(){
    var open = sp.classList.toggle('open');
    st.setAttribute('aria-expanded', open ? 'true' : 'false');
    setOpen(sp, open, function(){ if(open){ var i = document.getElementById('q-top'); if(i) i.focus(); } });
  });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && sp.classList.contains('open')){ st.click(); st.focus(); }
  });

  /* ---------- mobile nav ---------- */
  var burger = document.getElementById('burger'), nav = document.getElementById('nav');
  burger.addEventListener('click', function(){
    var open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.textContent = open ? 'Close' : 'Menu';
  });

  /* ---------- sticky header shadow ---------- */
  var mh = document.getElementById('masthead');
  var onScroll = function(){ mh.classList.toggle('stuck', window.scrollY > 8); };
  onScroll(); window.addEventListener('scroll', onScroll, {passive:true});

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq').forEach(function(faq){
    var btn = faq.querySelector('button'), panel = faq.querySelector('.a');
    btn.addEventListener('click', function(){
      var willOpen = !faq.classList.contains('open');
      document.querySelectorAll('.faq.open').forEach(function(other){
        if(other !== faq){
          other.classList.remove('open');
          other.querySelector('button').setAttribute('aria-expanded','false');
          setOpen(other.querySelector('.a'), false);
        }
      });
      faq.classList.toggle('open', willOpen);
      btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      setOpen(panel, willOpen);
    });
  });

  /* ---------- hero carousel ---------- */
  var car = document.getElementById('carousel');
  if(car){
    var slides = car.querySelectorAll('[data-slide]');
    var idx = 0, timer = null;
    function go(n, manual){
      if(n === idx) return;
      var prev = slides[idx];
      idx = (n + slides.length) % slides.length;
      var next = slides[idx];
      next.classList.add('on');
      prev.classList.remove('on');
      if(useG){
        G.fromTo(next, {opacity:0}, {opacity:1, duration:.7, ease:'power2.out'});
        G.fromTo(next.querySelector('.cap'), {y:18, opacity:0}, {y:0, opacity:1, duration:.6, delay:.1, ease:'power3.out'});
      }
      if(manual) restart();
    }
    function restart(){ clearInterval(timer); if(!reduce) timer = setInterval(function(){ go(idx + 1); }, 5200); }
    document.getElementById('cprev').addEventListener('click', function(){ go(idx - 1, true); });
    document.getElementById('cnext').addEventListener('click', function(){ go(idx + 1, true); });
    car.addEventListener('mouseenter', function(){ clearInterval(timer); });
    car.addEventListener('mouseleave', restart);
    restart();
  }

  /* ---------- potency ladder ---------- */
  var ladder = document.getElementById('ladder');
  if(ladder){
    var chips = ladder.querySelectorAll('span'), li = 2;
    setInterval(function(){
      chips[li].classList.remove('on');
      li = (li + 1) % chips.length;
      chips[li].classList.add('on');
    }, 2200);
  }


  /* ---------- modals ---------- */
  var lastFocus = null;
  function openModal(id){
    var m = document.getElementById(id); if(!m) return;
    lastFocus = document.activeElement;
    document.querySelectorAll('.modal.open').forEach(function(o){ o.classList.remove('open'); });
    m.classList.add('open'); document.body.style.overflow = 'hidden';
    var f = m.querySelector('input[type=search]') || m.querySelector('.mclose'); if(f) f.focus({preventScroll:true});
  }
  function closeModal(m){
    m.classList.remove('open'); document.body.style.overflow = '';
    if(lastFocus) lastFocus.focus();
  }
  document.querySelectorAll('[data-modal]').forEach(function(el){
    el.addEventListener('click', function(e){ e.preventDefault(); openModal(el.getAttribute('data-modal')); });
  });
  document.querySelectorAll('.modal').forEach(function(m){
    m.addEventListener('click', function(e){ if(e.target === m) closeModal(m); });
    m.querySelector('.mclose').addEventListener('click', function(){ closeModal(m); });
  });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape'){ var m = document.querySelector('.modal.open'); if(m) closeModal(m); }
  });

  /* ---------- books dropdown (click / touch) ---------- */
  var bdd = document.getElementById('booksdd');
  if(bdd){
    var bb = bdd.querySelector('.ddbtn');
    bb.addEventListener('click', function(){
      var o = bdd.classList.toggle('open'); bb.setAttribute('aria-expanded', o ? 'true' : 'false');
    });
    document.addEventListener('click', function(e){ if(!bdd.contains(e.target)){ bdd.classList.remove('open'); bb.setAttribute('aria-expanded','false'); } });
  }

  /* ---------- articles dropdown (caret toggles on touch; hover works via CSS) ---------- */
  var add = document.getElementById('articlesdd');
  if(add){
    var acb = add.querySelector('.ddcaret');
    acb.addEventListener('click', function(){
      var o = add.classList.toggle('open'); acb.setAttribute('aria-expanded', o ? 'true' : 'false');
    });
    document.addEventListener('click', function(e){ if(!add.contains(e.target)){ add.classList.remove('open'); acb.setAttribute('aria-expanded','false'); } });
  }


  /* ---------- article filter ---------- */
  var af = document.getElementById('afilter');
  if(af){
    af.addEventListener('input', function(){
      var q = af.value.trim().toLowerCase();
      document.querySelectorAll('#m-articles .acat').forEach(function(d){
        var n = 0;
        d.querySelectorAll('li').forEach(function(li){
          var hit = !q || li.textContent.toLowerCase().indexOf(q) > -1;
          li.style.display = hit ? '' : 'none'; if(hit) n++;
        });
        d.style.display = n ? '' : 'none';
        if(q) d.open = n > 0;
      });
    });
  }

  /* ---------- design notes ---------- */
  var nb = document.getElementById('notesbtn');
  if(nb) nb.addEventListener('click', function(){
    var on = document.body.classList.toggle('notes');
    nb.setAttribute('aria-pressed', on ? 'true' : 'false');
    nb.textContent = on ? 'Design notes: on' : 'Design notes: off';
    refresh();
  });


  /* ---------- shipping estimator ---------- */
  (function(){
    var dest = document.getElementById('ship-dest');
    var heavy = document.getElementById('ship-heavy');
    var pharm = document.getElementById('ship-pharm');
    var insWrap = document.getElementById('ship-insurewrap');
    var calc = document.getElementById('ship-calc');
    var result = document.getElementById('ship-result');
    if(!dest || !calc) return;

    function toggleInsurance(){
      insWrap.classList.toggle('show', dest.value !== 'us');
    }
    dest.addEventListener('change', toggleInsurance);
    toggleInsurance();

    function li(html){ return '<li><span class="ico">ICON</span><span class="txt">' + html + '</span></li>'; }

    calc.addEventListener('click', function(){
      var d = dest.value;
      var isHeavy = heavy.checked;
      var isPharm = pharm.checked;
      var insured = true;
      var insEl = document.querySelector('input[name="ship-ins"]:checked');
      if(insEl) insured = insEl.value === 'insured';

      var amt = '', notes = [], fine = '';

      if(d === 'us'){
        amt = isHeavy ? '$8.50 or a bit more' : '$8.50 flat rate';
        notes.push('This flat rate applies even when your order totals over $30 or over $75.');
        if(isHeavy) notes.push('Your order includes liquid or external-use remedies. These are heavier, so the actual cost can run a little above $8.50 &mdash; we\'ll confirm before it ships.');
        if(isPharm) notes.push('One or more items ship directly from the pharmacy. Some pharmacies charge more for faster shipment (often via UPS) &mdash; this is noted on the product page.');
        fine = 'We work to keep shipping as low as possible, though shipping costs generally have risen in recent years.';
      } else if(d === 'ca'){
        amt = insured ? 'around $35 (insured)' : 'around $28 or less (uninsured)';
        notes.push('Orders under 4 lbs often qualify for our lower-cost fixed-rate padded envelope.');
        if(!insured) notes.push('Uninsured parcels are often 20% or more cheaper. Loss is extremely rare in our experience, but by choosing uninsured you accept that small risk.');
        fine = 'We\'ll email you the precise cost based on your order\'s exact weight before it ships.';
      } else {
        amt = insured ? '$40&ndash;$56 (insured)' : 'roughly $32&ndash;$45 (uninsured)';
        notes.push('Cost depends on your country and your order\'s overall weight.');
        notes.push('Orders under 4 lbs often qualify for our lower-cost fixed-rate padded envelope.');
        if(!insured) notes.push('Uninsured parcels are often 20% or more cheaper. Loss is extremely rare in our experience, but by choosing uninsured you accept that small risk.');
        fine = 'Email us at email@homeopathic.com and we\'ll confirm the precise cost to your country.';
      }

      var html = '<div class="amt">Estimated shipping: ' + amt + '</div>';
      html += '<ul>' + notes.map(function(n){ return li(n).replace('ICON', 'GOLDCHECK'); }).join('') + '</ul>';
      html += '<p class="fine">' + fine + '</p>';
      html = html.split('GOLDCHECK').join('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m4 12 5.5 5.5L20 7"/></svg>');
      result.innerHTML = html;
      result.classList.add('show');
    });
  })();

  document.querySelectorAll('form.nform').forEach(function(f){
    f.addEventListener('submit', function(e){
      e.preventDefault();
      if(!f.checkValidity()){ f.reportValidity(); return; }
      var success = document.getElementById('nl-success');
      f.style.display = 'none';
      if(success) success.hidden = false;
    });
  });

  /* ============================= GSAP ============================= */
  if(!useG) return;

  var tl = G.timeline({defaults:{ease:'power3.out'}});
  tl.fromTo('[data-hero]', {y:26, opacity:0}, {y:0, opacity:1, duration:.8, stagger:.1});

  if(document.querySelector('#carousel')) G.to('#carousel .slide.on .ph img', {scale:1.06, duration:16, ease:'none', repeat:-1, yoyo:true});

  if(!window.ScrollTrigger) return;

  /* remedy marquee */
  var track = document.getElementById('track');
  if(track){
    track.innerHTML += track.innerHTML;
    G.to(track, {xPercent:-50, duration:44, ease:'none', repeat:-1});
  }

  /* section reveals */
  ScrollTrigger.batch('[data-rise]', {
    start:'top 93%', once:true,
    onEnter:function(batch){
      G.fromTo(batch, {y:24, opacity:0}, {y:0, opacity:1, duration:.7, stagger:.07, ease:'power2.out', overwrite:true});
    }
  });

  /* card-row reveals: opacity-only, no y-shift, no stagger drift — so cards
     sitting side-by-side in the same grid row can never appear vertically
     offset from one another mid-animation (fade happens in place). */
  ScrollTrigger.batch('[data-rise-row]', {
    start:'top 93%', once:true,
    onEnter:function(batch){
      G.fromTo(batch, {opacity:0}, {opacity:1, duration:.5, stagger:.04, ease:'power1.out', overwrite:true});
    }
  });

  /* count-ups */
  document.querySelectorAll('[data-count]').forEach(function(el){
    var end = parseInt(el.getAttribute('data-count'), 10), obj = {n:0};
    ScrollTrigger.create({trigger:el, start:'top 90%', once:true, onEnter:function(){
      G.to(obj, {n:end, duration:1.3, ease:'power2.out', onUpdate:function(){ el.textContent = Math.round(obj.n); }});
    }});
  });

  /* book covers fan in */
  if(document.querySelector('.bookrow .bk')) ScrollTrigger.create({trigger:'.bookrow', start:'top 90%', once:true, onEnter:function(){
    G.fromTo('.bookrow .bk', {y:44, rotate:-5, opacity:0}, {y:0, rotate:0, opacity:1, duration:.7, stagger:.08, ease:'back.out(1.4)', clearProps:'all'});
  }});

  /* portrait ring slow spin */
  if(document.querySelector('.auth-portrait .ring')) G.to('.auth-portrait .ring', {rotate:360, duration:70, ease:'none', repeat:-1});

  /* globe pins pulse */
  if(document.querySelector('.globe-art .pin')) G.to('.globe-art .pin', {scale:1.5, opacity:.5, duration:1.5, ease:'sine.inOut', repeat:-1, yoyo:true, stagger:.35});
})();
