(function () {
  "use strict";

  function initClickRipple() {
    if (document.getElementById("click-ripple-canvas")) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    var rippleGroups = [];
    var width = 0;
    var height = 0;
    var dpr = 1;
    var animationFrame = 0;
    var lastTime = 0;
    var green = "72,145,94";

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

    function addRippleGroup(x, y) {
      rippleGroups.push({
        x: x,
        y: y,
        age: 0,
        rings: [
          { delay: 0, duration: 1450, radiusScale: 0.52 },
          { delay: 85, duration: 1850, radiusScale: 0.76 },
          { delay: 170, duration: 2400, radiusScale: 1, outer: true }
        ],
        maxRadius: Math.min(150, Math.max(105, width * 0.13))
      });

      if (rippleGroups.length > 5) rippleGroups.shift();
      if (!animationFrame) animationFrame = window.requestAnimationFrame(draw);
    }

    function drawRing(group, ring) {
      var localAge = group.age - ring.delay;
      if (localAge <= 0 || localAge >= ring.duration) return;

      // 水波以接近恒定的相速度向外传播，只在起始阶段轻柔加速。
      var progress = localAge / ring.duration;
      var travel = progress < 0.12
        ? Math.pow(progress / 0.12, 0.78) * 0.12
        : progress;
      var radius = 3 + travel * group.maxRadius * ring.radiusScale;

      // 波峰先渐显，再随着传播距离和时间自然衰减。
      var appear = Math.min(1, localAge / 210);
      var decay = Math.pow(1 - progress, ring.outer ? 1.55 : 1.3);
      var ringStrength = appear * decay;
      var verticalRadius = radius * 0.97;

      // 外圈末段逐步变宽、变浅、变柔，模拟波边向外消散。
      var dissipate = ring.outer ? Math.max(0, (progress - 0.62) / 0.38) : 0;
      var edgeAlpha = (ring.outer ? 0.29 : 0.34) * ringStrength * (1 - dissipate * 0.35);
      var edgeWidth = ring.outer ? 1.05 + dissipate * 3.2 : 1.05;

      // 上沿高光与下沿阴影构成一个完整波峰，而不是普通描边圆。
      ctx.beginPath();
      ctx.ellipse(group.x, group.y - 0.75, radius, verticalRadius, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255," + 0.38 * ringStrength * (1 - dissipate * 0.55) + ")";
      ctx.lineWidth = edgeWidth;
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(group.x, group.y + 0.9, radius + 0.7, verticalRadius + 0.55, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(" + green + "," + edgeAlpha + ")";
      ctx.lineWidth = edgeWidth;
      ctx.stroke();

      if (ring.outer && dissipate > 0) {
        ctx.save();
        ctx.shadowColor = "rgba(" + green + "," + 0.12 * ringStrength + ")";
        ctx.shadowBlur = 3 + dissipate * 7;
        ctx.beginPath();
        ctx.ellipse(group.x, group.y, radius + dissipate * 2.5, verticalRadius + dissipate * 2.2, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(" + green + "," + 0.055 * ringStrength * (1 - dissipate) + ")";
        ctx.lineWidth = 2 + dissipate * 3.5;
        ctx.stroke();
        ctx.restore();
      }
    }

    function draw(time) {
      var delta = lastTime ? Math.min(32, time - lastTime) : 16;
      lastTime = time;
      ctx.clearRect(0, 0, width, height);

      for (var i = rippleGroups.length - 1; i >= 0; i--) {
        var group = rippleGroups[i];
        group.age += delta;

        for (var ring = 0; ring < group.rings.length; ring++) {
          drawRing(group, group.rings[ring]);
        }

        var outerRing = group.rings[group.rings.length - 1];
        var totalLife = outerRing.delay + outerRing.duration;
        if (group.age >= totalLife) rippleGroups.splice(i, 1);
      }

      if (rippleGroups.length) {
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
      addRippleGroup(event.clientX, event.clientY);
    }

    window.addEventListener("pointerdown", handlePointer, { passive: true });
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden && animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
        lastTime = 0;
      } else if (!document.hidden && rippleGroups.length && !animationFrame) {
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
