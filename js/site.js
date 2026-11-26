// Meind Games: the hero's landing (the mark slams down, sparks fly off it and
// the tyre marks draw under it; tap the M to see it again), gameplay video that
// only plays on screen, the car-talk card, the road down the side of the page
// with the Tensai Sprint as the scroll position, and five hidden coins.
(function () {
  var root = document.documentElement;
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hero = document.querySelector(".hero");

  // gameplay videos only play while on screen, and never for reduced motion
  var videos = document.querySelectorAll("video[data-loop]");
  videos.forEach(function (v) {
    if (reduced) { v.removeAttribute("autoplay"); v.pause(); return; }
    if (!("IntersectionObserver" in window)) return;
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else v.pause();
      });
    }, { threshold: 0.2 }).observe(v);
  });

  // ---- car talk: real-world facts and quotes, one at a time, shuffled after the first
  document.querySelectorAll("[data-tips]").forEach(function (card) {
    var items = JSON.parse(card.querySelector("[data-talk]").textContent);
    var body = card.querySelector("[data-tip]"), count = card.querySelector("[data-tip-count]");
    var kind = card.querySelector("[data-tip-kind]");
    var order = [0], i = 0;
    var rest = items.map(function (_, k) { return k; }).slice(1);
    while (rest.length) order.push(rest.splice(Math.floor(Math.random() * rest.length), 1)[0]);
    card.querySelector("[data-tip-next]").addEventListener("click", function () {
      i = (i + 1) % order.length;
      body.innerHTML = items[order[i]];
      var quote = items[order[i]].indexOf("<blockquote") === 0;
      kind.textContent = quote ? "Quote" : "Fun fact";
      card.classList.toggle("is-fact", !quote);
      count.textContent = (i + 1) + " / " + items.length;
      body.classList.remove("flip"); void body.offsetWidth; body.classList.add("flip");
    });
  });

  // ---- the road down the side: the Tensai Sprint is the scroll position.
  // It glides to where the page is rather than jumping there, turns to face
  // the way you scroll, and leans a little when you scroll fast.
  var meter = document.querySelector("[data-meter]");
  if (meter) {
    var car = meter.querySelector("img");
    var shown = 0, road = 0, lean = 0, facing = 0, faceTo = 0, lastY = window.scrollY, mraf = 0;
    // the stretch of road the car can use: below the notch, above the search bar and home bar
    var band = document.createElement("i");
    band.className = "meter-band";
    meter.appendChild(band);
    function lane() {
      var b = band.getBoundingClientRect(), m = meter.getBoundingClientRect();
      var top = Math.max(b.top, m.top), bottom = Math.min(b.bottom, m.bottom, window.innerHeight);
      var vv = window.visualViewport;
      if (vv && Math.abs(vv.scale - 1) < 0.01) bottom = Math.min(bottom, vv.offsetTop + vv.height);
      return { top: top - m.top + 8, span: Math.max(0, bottom - top - car.offsetHeight - 16) };
    }
    function goal() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    }
    function frame() {
      mraf = 0;
      var target = goal(), dy = window.scrollY - lastY;
      lastY = window.scrollY;
      if (dy > 1) faceTo = 0; else if (dy < -1) faceTo = 180;
      var ease = reduced ? 1 : 0.075;                       // how quickly the car catches up
      var before = shown;
      shown += (target - shown) * ease;
      var speed = shown - before;                           // its own speed, not the wheel's
      lean += ((reduced ? 0 : Math.max(-9, Math.min(9, speed * 900))) - lean) * 0.12;
      facing += (faceTo - facing) * (reduced ? 1 : 0.14);
      road += speed * 2600;                                 // the road rolls at the car's pace
      var L = lane();
      car.style.transform = "translate3d(-50%," + (L.top + shown * L.span).toFixed(1) + "px,0) rotate(" + (facing + lean).toFixed(1) + "deg)";
      meter.style.setProperty("--road", (-road).toFixed(1) + "px");
      var moving = Math.abs(target - shown) > 0.0004 || Math.abs(lean) > 0.05 || Math.abs(faceTo - facing) > 0.5;
      if (moving) mraf = requestAnimationFrame(frame);
    }
    function kick() { if (!mraf) mraf = requestAnimationFrame(frame); }
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);
    if (window.visualViewport) window.visualViewport.addEventListener("resize", kick);
    // grab the road (or the car) to drive the page yourself
    var dragging = false;
    function seek(e) {
      var r = meter.getBoundingClientRect(), L = lane();
      var p = L.span > 0 ? Math.min(1, Math.max(0, (e.clientY - r.top - L.top - car.offsetHeight / 2) / L.span)) : 0;
      window.scrollTo(0, p * (document.documentElement.scrollHeight - window.innerHeight));
    }
    meter.addEventListener("pointerdown", function (e) { dragging = true; meter.setPointerCapture(e.pointerId); seek(e); e.preventDefault(); });
    meter.addEventListener("pointermove", function (e) { if (dragging) seek(e); });
    ["pointerup", "pointercancel"].forEach(function (n) { meter.addEventListener(n, function () { dragging = false; }); });
    window.addEventListener("hashchange", function () { setTimeout(kick, 30); });
    shown = goal(); frame();
  }

  // ---- five coins hidden around the page
  var coins = document.querySelectorAll("[data-coin]");
  var counter = document.querySelector("[data-coin-count]");
  if (coins.length && counter) {
    var found = 0, total = coins.length, text = counter.querySelector("[data-coin-text]");
    coins.forEach(function (c) {
      c.addEventListener("click", function () {
        if (c.classList.contains("got")) return;
        c.classList.add("got");
        found++;
        counter.hidden = false;
        text.textContent = found < total
          ? found + " of " + total + " hidden coins found"
          : "All " + total + " found! Only 1,099,995 more for the Taurion Evo.";
        setTimeout(function () { c.style.visibility = "hidden"; }, 520);
      });
    });
  }

  // (with reduced motion the stylesheet already shows the hero at rest)
  if (!hero || reduced) return;
  root.classList.add("play");

  // sparks on the slam
  var canvas = document.getElementById("sparks");
  var mark = hero.querySelector(".hero-mark");
  if (!canvas || !mark || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var sparks = [];
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  function size() {
    var r = hero.getBoundingClientRect();
    canvas.width = r.width * dpr;
    canvas.height = r.height * dpr;
  }

  function burst() {
    size();
    var h = hero.getBoundingClientRect();
    var m = mark.getBoundingClientRect();
    var baseY = m.bottom - h.top - m.height * 0.15;
    for (var i = 0; i < 34; i++) {
      var side = i % 2 ? 1 : -1;
      var x = m.left - h.left + m.width / 2 + side * m.width * (0.25 + Math.random() * 0.25);
      var a = (10 + Math.random() * 65) * Math.PI / 180;
      var s = 420 + Math.random() * 760;
      sparks.push({ x: x, y: baseY, vx: side * Math.cos(a) * s, vy: -Math.sin(a) * s,
                    life: 0.45 + Math.random() * 0.5, age: 0, w: 1.6 + Math.random() * 2.2 });
    }
    var last = performance.now();
    function frame(now) {
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      var alive = 0;
      sparks.forEach(function (p) {
        if (p.age >= p.life) return;
        alive++;
        p.age += dt;
        var drag = Math.exp(-2.2 * dt);
        p.vx *= drag; p.vy = p.vy * drag + 1300 * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        var k = p.age / p.life;
        var len = Math.max(6, Math.min(36, Math.hypot(p.vx, p.vy) * 0.03));
        var ang = Math.atan2(p.vy, p.vx);
        ctx.strokeStyle = "rgba(255," + Math.round(240 - 56 * k) + "," + Math.round(190 - 160 * k) + "," + (1 - k * k) + ")";
        ctx.lineWidth = p.w;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(p.x - Math.cos(ang) * len, p.y - Math.sin(ang) * len);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      });
      if (alive) requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    requestAnimationFrame(frame);
  }

  // the slam lands 0.57 s in (see .play .hero-mark in site.css)
  setTimeout(burst, 570);

  // tap the M and it slams down again
  var slamBtn = hero.querySelector(".slam");
  if (slamBtn) slamBtn.addEventListener("click", function () {
    mark.classList.remove("reslam"); mark.style.animation = "none"; void mark.offsetWidth; mark.style.animation = "";
    mark.classList.add("reslam");
    setTimeout(burst, 420);
  });
})();
