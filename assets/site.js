/* HES — inner-page behaviour: cart, filters, search, tabs, forms. */
(function(){
  var ROOT = document.body.getAttribute('data-root') || '';
  var LS_KEY = 'hes_cart_v1';
  function $(s, c){ return (c||document).querySelector(s); }
  function $$(s, c){ return [].slice.call((c||document).querySelectorAll(s)); }
  function money(n){ return '$' + (Math.round(n*100)/100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

  /* ---------------- cart store (per-browser, works without a server) ---------------- */
  var mem = {};
  function load(){ try{ return JSON.parse(localStorage.getItem(LS_KEY)) || {}; }catch(e){ return mem; } }
  function save(c){ mem = c; try{ localStorage.setItem(LS_KEY, JSON.stringify(c)); }catch(e){} paintCount(); }
  function count(c){ c = c || load(); var n = 0; for(var k in c) n += c[k].q; return n; }
  function subtotal(c){ c = c || load(); var t = 0; for(var k in c) t += c[k].q * c[k].p; return t; }
  function paintCount(bump){
    var n = count();
    $$('.cartlink b').forEach(function(b){ b.textContent = n; });
    if(bump) $$('.cartlink').forEach(function(a){ a.classList.remove('bump'); void a.offsetWidth; a.classList.add('bump'); });
  }
  function add(item, q){
    var c = load();
    if(c[item.s]) c[item.s].q += q; else { item.q = q; c[item.s] = item; }
    save(c); paintCount(true); toast(item, q);
  }
  window.HESCart = {load:load, save:save, add:add, count:count, subtotal:subtotal};
  paintCount();

  /* ---------------- toast ---------------- */
  var toastEl, toastT;
  function toast(item, q){
    if(!toastEl){
      toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role','status');
      document.body.appendChild(toastEl);
    }
    toastEl.innerHTML = '<span class="ti"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m4 12 5.5 5.5L20 7"/></svg></span>' +
      '<span class="tt"><b>Added to cart' + (q > 1 ? ' ×' + q : '') + '</b><span>' + esc(item.n) + '</span></span>' +
      '<a href="' + ROOT + 'cart.html">View cart</a>';
    toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function(){ toastEl.classList.remove('show'); }, 3600);
  }

  /* ---------------- add-to-cart buttons ---------------- */
  document.addEventListener('click', function(e){
    var b = e.target.closest('[data-add]'); if(!b) return;
    e.preventDefault();
    var item = {s:b.dataset.slug, n:b.dataset.name, p:parseFloat(b.dataset.price)||0, i:b.dataset.img||'', u:b.dataset.url||'', t:b.dataset.type||'book', v:b.dataset.cv||'cv0', a:b.dataset.auth||''};
    var q = 1, qi = b.closest('[data-buy]'); qi = qi && qi.querySelector('.qty input');
    if(qi) q = Math.max(1, parseInt(qi.value, 10) || 1);
    add(item, q);
    b.classList.add('added');
    var old = b.innerHTML;
    if(!b.dataset.keep){ b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m4 12 5.5 5.5L20 7"/></svg>' + (b.classList.contains('btn') ? ' Added' : ''); }
    setTimeout(function(){ b.classList.remove('added'); if(!b.dataset.keep) b.innerHTML = old; }, 1600);
    if(b.dataset.go) location.href = ROOT + b.dataset.go;
  });

  /* qty steppers */
  document.addEventListener('click', function(e){
    var b = e.target.closest('.qty button'); if(!b) return;
    var inp = b.parentNode.querySelector('input');
    var v = (parseInt(inp.value, 10) || 1) + (b.dataset.d === '-' ? -1 : 1);
    inp.value = Math.max(parseInt(inp.min || 1, 10), Math.min(99, v));
    inp.dispatchEvent(new Event('change', {bubbles:true}));
  });

  /* ---------------- product thumbnails for cart/search (image or generated cover) ---------------- */
  function thumb(it){
    var t = it.t || 'book', v = it.v || 'cv0';
    if(it.i) return thumbCover(it, t, v) + '<img src="' + esc(it.i) + '" alt="" loading="lazy" onerror="this.remove()">';
    return thumbCover(it, t, v);
  }
  function thumbCover(it, t, v){
    if(t === 'med') return '<span class="cover med ' + v + '"><span class="cap"></span><span class="lab"><span class="ct">' + esc(it.n) + '</span></span></span>';
    if(t === 'av') return '<span class="cover av ' + v + '"><span class="play"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5Z"/></svg></span><span class="ct">' + esc(it.n) + '</span></span>';
    return '<span class="cover ' + v + '"><span class="ct">' + esc(it.n) + '</span></span>';
  }

  /* ---------------- category page: filter + sort ---------------- */
  var grid = $('#pgrid');
  if(grid){
    var cards = $$('.pcard', grid), qIn = $('#pfilter'), sortSel = $('#psort'), cnt = $('#pcount'), none = $('#pnone');
    function apply(){
      var q = (qIn && qIn.value || '').trim().toLowerCase(), shown = 0;
      cards.forEach(function(c){
        var hit = !q || c.dataset.search.indexOf(q) > -1;
        c.style.display = hit ? '' : 'none'; if(hit) shown++;
      });
      var mode = sortSel ? sortSel.value : 'featured';
      var sorted = cards.slice().sort(function(a, b){
        if(mode === 'low') return (+a.dataset.price || 1e9) - (+b.dataset.price || 1e9);
        if(mode === 'high') return (+b.dataset.price) - (+a.dataset.price);
        if(mode === 'az') return a.dataset.name.localeCompare(b.dataset.name);
        if(mode === 'sale') return (+b.dataset.save) - (+a.dataset.save);
        return (+a.dataset.idx) - (+b.dataset.idx);
      });
      sorted.forEach(function(c){ grid.appendChild(c); });
      if(none){ grid.appendChild(none); none.style.display = shown ? 'none' : ''; }
      if(cnt) cnt.textContent = shown;
    }
    if(qIn) qIn.addEventListener('input', apply);
    if(sortSel) sortSel.addEventListener('change', apply);
  }

  /* ---------------- tabs ---------------- */
  $$('.tabs').forEach(function(t){
    var btns = $$('.tabbtns button', t), panels = $$('.tabpanel', t);
    btns.forEach(function(b, i){
      b.addEventListener('click', function(){
        btns.forEach(function(x, j){ x.setAttribute('aria-selected', j === i ? 'true' : 'false'); panels[j].hidden = j !== i; });
      });
    });
  });

  /* ---------------- segmented (account login/register) ---------------- */
  $$('.segs').forEach(function(s){
    var btns = $$('button', s);
    btns.forEach(function(b){
      b.addEventListener('click', function(){
        btns.forEach(function(x){ x.setAttribute('aria-selected', x === b ? 'true' : 'false'); var p = document.getElementById(x.dataset.panel); if(p) p.hidden = x !== b; });
      });
    });
    if(/[?&]tab=register/.test(location.search)){ var r = btns.filter(function(b){ return b.dataset.panel === 'p-register'; })[0]; if(r) r.click(); }
  });

  /* ---------------- article filters (chips + text) ---------------- */
  var ag = $('#agrid');
  if(ag){
    var acards = $$('[data-cat]', ag), chips = $$('.chip[data-filter]'), af = $('#artfilter'), acnt = $('#acount'), cur = 'all';
    function aapply(){
      var q = (af && af.value || '').trim().toLowerCase(), n = 0;
      acards.forEach(function(c){
        var hit = (cur === 'all' || c.dataset.cat === cur) && (!q || c.dataset.title.indexOf(q) > -1);
        c.style.display = hit ? '' : 'none'; if(hit) n++;
      });
      if(acnt) acnt.textContent = n;
      var none = $('#anone'); if(none) none.style.display = n ? 'none' : '';
    }
    chips.forEach(function(ch){
      ch.addEventListener('click', function(){
        cur = ch.dataset.filter;
        chips.forEach(function(x){ x.setAttribute('aria-pressed', x === ch ? 'true' : 'false'); });
        aapply();
      });
    });
    if(af) af.addEventListener('input', aapply);
  }

  /* ---------------- links filter ---------------- */
  var lf = $('#linkfilter');
  if(lf){
    lf.addEventListener('input', function(){
      var q = lf.value.trim().toLowerCase();
      $$('.lsec').forEach(function(sec){
        var n = 0;
        $$('.lk', sec).forEach(function(l){ var hit = !q || l.textContent.toLowerCase().indexOf(q) > -1; l.style.display = hit ? '' : 'none'; if(hit) n++; });
        sec.style.display = n ? '' : 'none';
      });
    });
  }

  /* ---------------- info-page TOC highlight + progress ---------------- */
  (function(){
    var links = $$('.pg-toc a, .toc a');
    if(!links.length) return;
    var secs = links.map(function(a){ return document.getElementById(a.getAttribute('href').slice(1)); });
    var bar = $('#pg-progress'), main = $('.pg-main') || $('.prose');
    function onScroll(){
      var y = window.scrollY + 150, cur = 0;
      secs.forEach(function(s, i){ if(s && s.getBoundingClientRect().top + window.scrollY <= y) cur = i; });
      links.forEach(function(a, i){ a.classList.toggle('on', i === cur); });
      if(bar && main){
        var r = main.getBoundingClientRect(), total = r.height - window.innerHeight * .6;
        bar.style.width = Math.max(0, Math.min(100, (-r.top + 120) / Math.max(1, total) * 100)) + '%';
      }
    }
    window.addEventListener('scroll', onScroll, {passive:true}); onScroll();
  })();

  /* ---------------- share (copy link) ---------------- */
  $$('[data-copy]').forEach(function(b){
    b.addEventListener('click', function(){
      var done = function(){ b.setAttribute('title', 'Link copied!'); b.style.background = 'var(--green)'; b.style.color = '#fff'; };
      if(navigator.clipboard) navigator.clipboard.writeText(location.href).then(done, done); else done();
    });
  });

  /* ---------------- demo forms (newsletter, contact, account) ---------------- */
  $$('form[data-demo]').forEach(function(f){
    f.addEventListener('submit', function(e){
      e.preventDefault();
      if(!f.checkValidity()){ f.reportValidity(); return; }
      var ok = document.getElementById(f.dataset.demo);
      f.style.display = 'none';
      if(ok){ ok.hidden = false; ok.scrollIntoView({behavior:'smooth', block:'center'}); }
    });
  });

  /* ---------------- CART PAGE ---------------- */
  var cartRoot = $('#cart-root');
  function shipCost(dest, sub){
    if(!sub) return 0;
    if(dest === 'ca') return 35; if(dest === 'intl') return 48;
    return 8.5;
  }
  function renderCart(){
    if(!cartRoot) return;
    var c = load(), keys = Object.keys(c);
    if(!keys.length){
      cartRoot.innerHTML = '<div class="cartbox"><div class="cart-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.3"/><circle cx="19" cy="20" r="1.3"/><path d="M2 3h3l2.4 11.6a1.8 1.8 0 0 0 1.8 1.4h8.6a1.8 1.8 0 0 0 1.8-1.4L21.5 7H6"/></svg><h2>Your cart is empty</h2><p>Browse our books, medicines, kits and e-courses — everything is hand-picked by Dana Ullman and our team.</p><a class="btn btn-green" href="' + ROOT + 'shop.html">Visit the store <em>&rarr;</em></a></div></div>';
      $('#cart-summary') && ($('#cart-summary').style.display = 'none');
      return;
    }
    $('#cart-summary') && ($('#cart-summary').style.display = '');
    var rows = keys.map(function(k){
      var it = c[k];
      return '<div class="citem" data-k="' + esc(k) + '"><a class="th" href="' + ROOT + esc(it.u) + '">' + thumb(it) + '</a>' +
        '<div><a class="nm" href="' + ROOT + esc(it.u) + '">' + esc(it.n) + '</a><div class="row"><span class="qty sm"><button type="button" data-d="-" aria-label="Decrease">&minus;</button><input type="number" min="1" max="99" value="' + it.q + '" aria-label="Quantity"><button type="button" data-d="+" aria-label="Increase">+</button></span><span class="unit">' + money(it.p) + ' each</span><button class="rm" type="button">Remove</button></div></div>' +
        '<div class="lt">' + money(it.p * it.q) + '</div></div>';
    }).join('');
    cartRoot.innerHTML = '<div class="cartbox"><div class="hd"><h2>Your cart <span class="muted" style="font-size:16px">(' + count(c) + ')</span></h2><button type="button" id="cart-clear">Clear cart</button></div>' + rows + '</div>';
    paintSummary();
  }
  function paintSummary(){
    var s = subtotal(), dest = ($('#ship-to') || {}).value || 'us', sh = shipCost(dest, s);
    var set = function(id, v){ var el = document.getElementById(id); if(el) el.textContent = v; };
    set('sum-sub', money(s)); set('sum-ship', s ? money(sh) + (dest === 'us' ? '' : ' (est.)') : '—'); set('sum-total', money(s + sh));
    set('sum-count', count());
  }
  if(cartRoot){
    renderCart();
    cartRoot.addEventListener('change', function(e){
      var inp = e.target.closest('.citem input'); if(!inp) return;
      var k = inp.closest('.citem').dataset.k, c = load();
      c[k].q = Math.max(1, Math.min(99, parseInt(inp.value, 10) || 1)); save(c); renderCart();
    });
    cartRoot.addEventListener('click', function(e){
      if(e.target.closest('.rm')){ var k = e.target.closest('.citem').dataset.k, c = load(); delete c[k]; save(c); renderCart(); }
      if(e.target.id === 'cart-clear'){ save({}); renderCart(); }
    });
    var st = $('#ship-to'); if(st) st.addEventListener('change', paintSummary);
  }

  /* ---------------- CHECKOUT PAGE ---------------- */
  var co = $('#checkout-lines');
  if(co){
    var c = load(), keys = Object.keys(c);
    if(!keys.length){ co.innerHTML = '<p class="muted">Your cart is empty. <a href="' + ROOT + 'shop.html" style="color:var(--green);font-weight:700">Visit the store &rarr;</a></p>'; }
    else co.innerHTML = keys.map(function(k){ var it = c[k]; return '<div class="ln"><span>' + esc(it.n) + ' <span class="muted">×' + it.q + '</span></span><b>' + money(it.p * it.q) + '</b></div>'; }).join('');
    var dsel = $('#co-country');
    function coTotals(){
      var s = subtotal(), d = dsel ? dsel.value : 'us', sh = shipCost(d, s);
      $('#co-sub').textContent = money(s); $('#co-ship').textContent = s ? money(sh) : '—'; $('#co-total').textContent = money(s + sh);
    }
    if(dsel) dsel.addEventListener('change', coTotals); coTotals();
    var cf = $('#checkout-form');
    if(cf) cf.addEventListener('submit', function(e){
      e.preventDefault(); if(!cf.checkValidity()){ cf.reportValidity(); return; }
      var num = 'HES-' + String(Date.now()).slice(-6);
      $('#co-num').textContent = num;
      $('#co-wrap').hidden = true; $('#co-done').hidden = false; save({}); window.scrollTo({top:0, behavior:'smooth'});
    });
  }

  /* ---------------- SEARCH PAGE ---------------- */
  var sr = $('#search-results');
  if(sr && window.HES_DATA){
    var params = new URLSearchParams(location.search), q = (params.get('s') || '').trim();
    var inp = $('#q-page'); if(inp) inp.value = q;
    var P = HES_DATA.products, A = HES_DATA.articles;
    var SYN = {'teething':'teeth|infant|baby|child|chamomilla','hay fever':'allerg|sinus','potency':'potenc|30c|200c|kit','family kit':'family|kit','flu':'flu|influenz|oscillo','cold':'cold|flu|sinus','sleep':'sleep|calm|stress','stress':'stress|calm|rescue|emotional','injury':'arnica|traumeel|injur|sprain|musculoskeletal|pain','pain':'pain|arnica|traumeel|relief','women':'women|woman|pregnan|menopause|cyclease','children':'child|infant|kids|baby','allergy':'allerg|sinus','digestion':'indigestion|acidil|digest|nux'};
    function terms(q){
      var ql = q.toLowerCase(), extra = [];
      for(var k in SYN){ if(ql.indexOf(k) > -1) extra = extra.concat(SYN[k].split('|')); }
      return {words: ql.split(/\s+/).filter(Boolean), extra: extra};
    }
    function score(text, t){
      text = text.toLowerCase(); var s = 0;
      t.words.forEach(function(w){ if(text.indexOf(w) > -1) s += 3; });
      if(t.words.length > 1 && text.indexOf(t.words.join(' ')) > -1) s += 4;
      t.extra.forEach(function(w){ if(text.indexOf(w) > -1) s += 1; });
      return s;
    }
    var prodHits = [], artHits = [];
    if(q){
      var t = terms(q);
      prodHits = P.map(function(p){ return [score(p.n + ' ' + p.a + ' ' + p.k, t), p]; }).filter(function(x){ return x[0] > 0; }).sort(function(a, b){ return b[0] - a[0]; }).map(function(x){ return x[1]; });
      artHits = A.map(function(a){ return [score(a.t + ' ' + a.c, t), a]; }).filter(function(x){ return x[0] > 0; }).sort(function(a, b){ return b[0] - a[0]; }).map(function(x){ return x[1]; });
    }
    var head = $('#search-head');
    if(head) head.innerHTML = q ? 'Results for <i>&ldquo;' + esc(q) + '&rdquo;</i>' : 'Search the <i>store &amp; library</i>';
    var sub = $('#search-sub');
    if(sub) sub.textContent = q ? (prodHits.length + ' products and ' + artHits.length + ' articles found') : 'Search 1,000+ medicines, books, kits, e-courses and free articles.';
    function pcard(p){
      var price = p.p ? '<span class="kprice"><span class="now">' + money(p.p) + '</span>' + (p.r && p.r > p.p ? '<span class="was">' + money(p.r) + '</span>' : '') + '</span>' : '<span class="kprice"><span class="now" style="font-size:13px">Ask us</span></span>';
      return '<article class="pcard"><a class="pimg2" href="' + ROOT + p.u + '" tabindex="-1" aria-hidden="true">' + thumb(p) + '</a><div class="pbody"><a class="ptitle" href="' + ROOT + p.u + '">' + esc(p.n) + '</a><span class="pauth">' + esc(p.a || p.cl) + '</span><div class="pfoot">' + price +
        (p.p ? '<button class="addbtn" type="button" data-add data-slug="' + esc(p.s) + '" data-name="' + esc(p.n) + '" data-price="' + p.p + '" data-img="' + esc(p.i) + '" data-url="' + esc(p.u) + '" data-type="' + p.t + '" data-cv="' + p.v + '" aria-label="Add to cart"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.3"/><circle cx="19" cy="20" r="1.3"/><path d="M2 3h3l2.4 11.6a1.8 1.8 0 0 0 1.8 1.4h8.6a1.8 1.8 0 0 0 1.8-1.4L21.5 7H6"/></svg></button>' : '') + '</div></div></article>';
    }
    function acard(a){
      return '<a class="acard2" href="' + (a.x ? a.u : ROOT + a.u) + '"' + (a.x ? ' target="_blank" rel="noopener"' : '') + '><span class="ab"><span class="cat">' + esc(a.c) + '</span><h3>' + esc(a.t) + '</h3><span class="go">' + (a.x ? 'Read on homeopathic.com ↗' : 'Read article &rarr;') + '</span></span></a>';
    }
    var tabs = $$('.srtabs .chip'), mode = 'all';
    function paint(){
      var html = '';
      if(!q){ html = '<div class="empty-res"><b>What are you looking for?</b>Try a remedy, a symptom, an author or a book title — for example <a href="?s=arnica" style="color:var(--green);font-weight:700">Arnica</a>, <a href="?s=teething" style="color:var(--green);font-weight:700">teething</a> or <a href="?s=Ullman" style="color:var(--green);font-weight:700">Ullman</a>.</div>'; sr.innerHTML = html; return; }
      if(mode !== 'articles'){
        html += '<h2 style="font-size:28px;font-weight:400;margin:6px 0 18px">Products <span class="muted" style="font-size:16px">(' + prodHits.length + ')</span></h2>';
        html += prodHits.length ? '<div class="pgrid2">' + prodHits.slice(0, mode === 'all' ? 24 : 200).map(pcard).join('') + '</div>' : '<div class="empty-res"><b>No products matched.</b>Try a broader word, or browse the <a href="' + ROOT + 'shop.html" style="color:var(--green);font-weight:700">full store</a>.</div>';
      }
      if(mode !== 'products'){
        html += '<h2 style="font-size:28px;font-weight:400;margin:40px 0 18px">Free articles <span class="muted" style="font-size:16px">(' + artHits.length + ')</span></h2>';
        html += artHits.length ? '<div class="agrid">' + artHits.slice(0, mode === 'all' ? 9 : 200).map(acard).join('') + '</div>' : '<div class="empty-res"><b>No articles matched.</b>Browse all <a href="' + ROOT + 'articles.html" style="color:var(--green);font-weight:700">150+ free articles</a>.</div>';
      }
      sr.innerHTML = html;
    }
    tabs.forEach(function(ch){ ch.addEventListener('click', function(){ mode = ch.dataset.mode; tabs.forEach(function(x){ x.setAttribute('aria-pressed', x === ch ? 'true' : 'false'); }); paint(); }); });
    paint();
  }
})();
