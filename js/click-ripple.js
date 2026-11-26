(function () {
  "use strict";

  function initClickRipple() {
    if (document.getElementById("click-ripple-canvas")) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    var ripples = [];
    var width = 0;
    var height = 0;
    var dpr = 1;
    var animationFrame = 0;
    var lastTime = 0;

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

    function easeOutCubic(value) {
      return 1 - Math.pow(1 - value, 3);
    }

    function draw(time) {
      var delta = lastTime ? Math.min(time - lastTime, 32) : 16;
      lastTime = time;
      ctx.clearRect(0, 0, width, height);

      for (var i = ripples.length - 1; i >= 0; i--) {
        var ripple = ripples[i];
        ripple.elapsed += delta;
        var progress = Math.min(ripple.elapsed / ripple.duration, 1);
        var eased = easeOutCubic(progress);
        var alpha = (1 - progress) * 0.38;

        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, 8 + eased * 58, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(72, 145, 94, " + alpha + ")";
        ctx.lineWidth = 2 - progress * 1.2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, 4 + eased * 36, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(151, 198, 157, " + alpha * 0.75 + ")";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        if (progress >= 1) ripples.splice(i, 1);
      }

      if (ripples.length) {
        animationFrame = window.requestAnimationFrame(draw);
      } else {
        animationFrame = 0;
        lastTime = 0;
        ctx.clearRect(0, 0, width, height);
      }
    }

    function addRipple(event) {
      if (event.isPrimary === false) return;
      if (event.button !== undefined && event.button !== 0) return;

      ripples.push({
        x: event.clientX,
        y: event.clientY,
        elapsed: 0,
        duration: 720
      });

      if (ripples.length > 8) ripples.shift();
      if (!animationFrame) animationFrame = window.requestAnimationFrame(draw);
    }

    window.addEventListener("pointerdown", addRipple, { passive: true });
    window.addEventListener("resize", resize, { passive: true });
    resize();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initClickRipple, { once: true });
  } else {
    initClickRipple();
  }
})();
