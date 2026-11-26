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
        ringCount: 5,
        ringDelay: 230,
        ringDuration: 2450,
        maxRadius: Math.min(155, Math.max(105, width * 0.13))
      });

      if (rippleGroups.length > 5) rippleGroups.shift();
      if (!animationFrame) animationFrame = window.requestAnimationFrame(draw);
    }

    function drawRing(group, ringIndex) {
      var localAge = group.age - ringIndex * group.ringDelay;
      if (localAge <= 0 || localAge >= group.ringDuration) return;

      // 水波以接近恒定的相速度向外传播，只在起始阶段轻柔加速。
      var progress = localAge / group.ringDuration;
      var travel = progress < 0.12
        ? Math.pow(progress / 0.12, 0.78) * 0.12
        : progress;
      var radius = 3 + travel * group.maxRadius;

      // 波峰先渐显，再随着传播距离和时间自然衰减。
      var appear = Math.min(1, localAge / 210);
      var decay = Math.pow(1 - progress, 1.35);
      var ringStrength = (1 - ringIndex * 0.075) * appear * decay;
      var verticalRadius = radius * 0.97;

      // 很淡的宽波带提供水面折射感。
      ctx.beginPath();
      ctx.ellipse(group.x, group.y, radius, verticalRadius, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(" + green + "," + 0.075 * ringStrength + ")";
      ctx.lineWidth = 4.2;
      ctx.stroke();

      // 上沿高光与下沿阴影构成一个完整波峰，而不是普通描边圆。
      ctx.beginPath();
      ctx.ellipse(group.x, group.y - 0.75, radius, verticalRadius, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255," + 0.5 * ringStrength + ")";
      ctx.lineWidth = 1.15;
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(group.x, group.y + 0.9, radius + 0.7, verticalRadius + 0.55, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(" + green + "," + 0.3 * ringStrength + ")";
      ctx.lineWidth = 1.05;
      ctx.stroke();

      // 波峰外侧的弱反射，让每一圈边缘更柔和。
      ctx.beginPath();
      ctx.ellipse(group.x, group.y, radius + 2.2, verticalRadius + 2, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(" + green + "," + 0.06 * ringStrength + ")";
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    function draw(time) {
      var delta = lastTime ? Math.min(32, time - lastTime) : 16;
      lastTime = time;
      ctx.clearRect(0, 0, width, height);

      for (var i = rippleGroups.length - 1; i >= 0; i--) {
        var group = rippleGroups[i];
        group.age += delta;

        for (var ring = 0; ring < group.ringCount; ring++) {
          drawRing(group, ring);
        }

        var totalLife = group.ringDuration + (group.ringCount - 1) * group.ringDelay;
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
