(function () {
  "use strict";

  function startFreshBackground() {
    if (document.getElementById("leaf-bg-canvas")) return;

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotion.matches) return;

    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    var leaves = [];
    var ripples = [];
    var pointer = { x: -1000, y: -1000, active: false };
    var width = 0;
    var height = 0;
    var dpr = 1;
    var running = true;
    var lastTime = performance.now();
    var palette = [
      "rgba(72, 139, 91, .25)",
      "rgba(111, 166, 112, .22)",
      "rgba(148, 190, 132, .20)",
      "rgba(61, 122, 82, .18)"
    ];

    canvas.id = "leaf-bg-canvas";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);

    function makeLeaf(fromTop) {
      var size = 7 + Math.random() * 10;
      return {
        x: Math.random() * width,
        y: fromTop ? -size * 2 : Math.random() * height,
        size: size,
        vx: (Math.random() - .5) * .12,
        vy: .08 + Math.random() * .18,
        phase: Math.random() * Math.PI * 2,
        sway: .2 + Math.random() * .35,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - .5) * .0025,
        color: palette[Math.floor(Math.random() * palette.length)]
      };
    }

    function resetLeaves() {
      leaves = [];
      var count = Math.max(14, Math.min(34, Math.round(width / 48)));
      if (width < 768) count = Math.min(count, 16);
      for (var i = 0; i < count; i++) leaves.push(makeLeaf(false));
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
      resetLeaves();
    }

    function drawLeaf(leaf) {
      ctx.save();
      ctx.translate(leaf.x, leaf.y);
      ctx.rotate(leaf.angle);
      ctx.beginPath();
      ctx.moveTo(0, -leaf.size);
      ctx.bezierCurveTo(leaf.size * .72, -leaf.size * .45, leaf.size * .62, leaf.size * .56, 0, leaf.size);
      ctx.bezierCurveTo(-leaf.size * .62, leaf.size * .56, -leaf.size * .72, -leaf.size * .45, 0, -leaf.size);
      ctx.fillStyle = leaf.color;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, -leaf.size * .72);
      ctx.lineTo(0, leaf.size * .72);
      ctx.strokeStyle = "rgba(255, 255, 255, .38)";
      ctx.lineWidth = .7;
      ctx.stroke();
      ctx.restore();
    }

    function updateLeaf(leaf, delta, time) {
      leaf.phase += .00045 * delta;
      leaf.x += (leaf.vx + Math.sin(leaf.phase + time * .00018) * leaf.sway) * delta;
      leaf.y += leaf.vy * delta;
      leaf.angle += leaf.spin * delta;

      if (pointer.active) {
        var dx = leaf.x - pointer.x;
        var dy = leaf.y - pointer.y;
        var distanceSquared = dx * dx + dy * dy;
        if (distanceSquared > 1 && distanceSquared < 15000) {
          var force = (1 - Math.sqrt(distanceSquared) / 123) * .045 * delta;
          leaf.x += dx * force;
          leaf.y += dy * force;
        }
      }

      if (leaf.y > height + leaf.size * 2 || leaf.x < -40 || leaf.x > width + 40) {
        Object.assign(leaf, makeLeaf(true));
      }
    }

    function drawRipples(delta) {
      for (var i = ripples.length - 1; i >= 0; i--) {
        var ripple = ripples[i];
        ripple.radius += delta * .07;
        ripple.alpha -= delta * .00065;
        if (ripple.alpha <= 0) {
          ripples.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(65, 133, 87, " + ripple.alpha + ")";
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    }

    function animate(time) {
      if (!running) return;
      var delta = Math.min(32, time - lastTime || 16.7);
      lastTime = time;
      ctx.clearRect(0, 0, width, height);
      for (var i = 0; i < leaves.length; i++) {
        updateLeaf(leaves[i], delta, time);
        drawLeaf(leaves[i]);
      }
      drawRipples(delta);
      window.requestAnimationFrame(animate);
    }

    window.addEventListener("pointermove", function (event) {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    }, { passive: true });

    document.addEventListener("pointerleave", function () {
      pointer.active = false;
    });

    window.addEventListener("pointerdown", function (event) {
      if (event.button !== undefined && event.button !== 0) return;
      ripples.push({ x: event.clientX, y: event.clientY, radius: 6, alpha: .28 });
      if (ripples.length > 5) ripples.shift();
    }, { passive: true });

    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", function () {
      running = !document.hidden;
      if (running) {
        lastTime = performance.now();
        window.requestAnimationFrame(animate);
      }
    });

    resize();
    window.requestAnimationFrame(animate);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startFreshBackground, { once: true });
  } else {
    startFreshBackground();
  }
})();
