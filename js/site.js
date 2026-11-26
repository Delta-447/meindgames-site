// Meind Games - the hero's landing: the mark slams down, sparks fly off it
// like a car's on impact, and the tyre marks draw under it. Everything else
// on the site stays still.
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

  if (!hero || reduced) { root.classList.remove("js"); return; }
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
})();
