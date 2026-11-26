(function () {
  "use strict";

  function initClickRipple() {
    if (document.getElementById("click-ripple-canvas")) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    var waves = [];
    var drops = [];
    var width = 0;
    var height = 0;
    var dpr = 1;
    var animationFrame = 0;
    var lastTime = 0;
    var green = [72, 145, 94];

    canvas.id = "click-ripple-canvas";
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:999",
      "width:100vw",
      "height:100vh",
      "pointer-events:none"
    ].join(";");
    document.body.appendChild(canvas);

    function rgba(alpha) {
      return "rgba(" + green[0] + "," + green[1] + "," + green[2] + "," + alpha + ")";
    }

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function createSplash(x, y) {
      waves.push({ x: x, y: y, age: 0, life: 1250 });

      for (var i = 0; i < 7; i++) {
        var angle = Math.PI * (1.08 + Math.random() * 0.84);
        var speed = 34 + Math.random() * 62;
        drops.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 25,
          size: 1.2 + Math.random() * 2.2,
          age: 0,
          life: 520 + Math.random() * 260
        });
      }

      if (waves.length > 8) waves.shift();
      if (drops.length > 56) drops.splice(0, drops.length - 56);
      if (!animationFrame) animationFrame = window.requestAnimationFrame(draw);
    }

    function drawWave(wave) {
      var progress = Math.min(wave.age / wave.life, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var radius = 7 + eased * Math.min(118, width * 0.2);
      var fade = Math.pow(1 - progress, 1.7);
      var lens = ctx.createRadialGradient(
        wave.x,
        wave.y,
        Math.max(0, radius - 14),
        wave.x,
        wave.y,
        radius + 10
      );

      lens.addColorStop(0, "rgba(255,255,255,0)");
      lens.addColorStop(0.56, rgba(0.018 * fade));
      lens.addColorStop(0.72, rgba(0.095 * fade));
      lens.addColorStop(0.8, "rgba(255,255,255," + 0.22 * fade + ")");
      lens.addColorStop(0.88, rgba(0.16 * fade));
      lens.addColorStop(1, "rgba(255,255,255,0)");

      ctx.fillStyle = lens;
      ctx.beginPath();
      ctx.arc(wave.x, wave.y, radius + 11, 0, Math.PI * 2);
      ctx.fill();

      // 上沿高光与下沿阴影共同形成水面折射感。
      ctx.beginPath();
      ctx.ellipse(wave.x, wave.y - 0.7, radius, radius * 0.94, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255," + 0.55 * fade + ")";
      ctx.lineWidth = 1.35;
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(wave.x, wave.y + 1.1, radius + 1.8, radius * 0.94 + 1.2, 0, 0, Math.PI * 2);
      ctx.strokeStyle = rgba(0.32 * fade);
      ctx.lineWidth = 1.1;
      ctx.stroke();

      // 两道延迟出现的内圈模拟连续波峰。
      for (var ring = 1; ring <= 2; ring++) {
        var delay = ring * 0.12;
        var ringProgress = Math.max(0, Math.min(1, (progress - delay) / (1 - delay)));
        if (!ringProgress) continue;

        var ringRadius = 4 + (1 - Math.pow(1 - ringProgress, 3)) * radius * (0.62 - ring * 0.12);
        var ringAlpha = (1 - ringProgress) * fade * (0.26 - ring * 0.055);
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = rgba(ringAlpha);
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // 点击瞬间的水面高光。
      if (progress < 0.18) {
        var flash = 1 - progress / 0.18;
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, 2.5 + progress * 22, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255," + 0.5 * flash + ")";
        ctx.fill();
      }
    }

    function drawDrop(drop, delta) {
      drop.age += delta;
      var seconds = delta / 1000;
      drop.x += drop.vx * seconds;
      drop.y += drop.vy * seconds;
      drop.vy += 245 * seconds;

      var alpha = Math.max(0, 1 - drop.age / drop.life);
      ctx.beginPath();
      ctx.ellipse(drop.x, drop.y, drop.size * 0.68, drop.size, 0, 0, Math.PI * 2);
      ctx.fillStyle = rgba(0.48 * alpha);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(drop.x - 0.35, drop.y - 0.45, Math.max(0.45, drop.size * 0.22), 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255," + 0.62 * alpha + ")";
      ctx.fill();
    }

    function draw(time) {
      var delta = lastTime ? Math.min(32, time - lastTime) : 16;
      lastTime = time;
      ctx.clearRect(0, 0, width, height);

      for (var i = waves.length - 1; i >= 0; i--) {
        waves[i].age += delta;
        drawWave(waves[i]);
        if (waves[i].age >= waves[i].life) waves.splice(i, 1);
      }

      for (var j = drops.length - 1; j >= 0; j--) {
        drawDrop(drops[j], delta);
        if (drops[j].age >= drops[j].life) drops.splice(j, 1);
      }

      if (waves.length || drops.length) {
        animationFrame = window.requestAnimationFrame(draw);
      } else {
        animationFrame = 0;
        lastTime = 0;
        ctx.clearRect(0, 0, width, height);
      }
    }

    function handlePointer(event) {
      if (event.isPrimary === false) return;
      if (event.button !== undefined && event.button !== 0) return;
      createSplash(event.clientX, event.clientY);
    }

    window.addEventListener("pointerdown", handlePointer, { passive: true });
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden && animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
        lastTime = 0;
      } else if (!document.hidden && (waves.length || drops.length) && !animationFrame) {
        animationFrame = window.requestAnimationFrame(draw);
      }
    });

    resize();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initClickRipple, { once: true });
  } else {
    initClickRipple();
  }
})();
