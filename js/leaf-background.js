window.addEventListener("load", function() {
    var c = document.createElement("canvas"),
        ctx = c.getContext("2d"),
        leaves = [],
        mouse = { x: null, y: null },
        w = window.innerWidth,
        h = window.innerHeight,
        rAF = window.requestAnimationFrame || function(f){ setTimeout(f, 1000/45) };

    c.id = "leaf-bg-canvas";
    c.style.cssText = "position:fixed;top:0;left:0;z-index:-1;pointer-events:none;opacity:0.45;width:100vw;height:100vh;";
    document.body.appendChild(c);

    function initLeaves() {
        leaves = [];
        var count = Math.min(50, Math.floor(w/30));
        for (var i = 0; i < count; i++) {
            leaves.push({
                x: Math.random()*w,
                y: Math.random()*h,
                size: Math.random()*15 + 10,
                speedX: Math.random() * 0.5 - 0.25,
                speedY: Math.random() * 0.5 + 0.2,
                angle: Math.random()*360,
                spin: Math.random()*0.5 - 0.25,
                flip: Math.random() * Math.PI,        // 3D 翻转角度
                flipSpeed: Math.random() * 0.05 + 0.01, // 翻转速度
                color: ["#c5d9c5","#9aba9a","#e3ebe3","#a8c0a8"][Math.floor(Math.random()*4)]
            });
        }
    }

    function resize() {
        w = window.innerWidth;
        h = window.innerHeight;
        c.width = w;
        c.height = h;
        initLeaves();
    }

    function drawLeaf(ctx, l) {
        ctx.beginPath();
        // 绘制叶子主体（贝塞尔曲线模拟叶形）
        ctx.moveTo(0, -l.size); 
        ctx.quadraticCurveTo(l.size * 0.6, -l.size * 0.3, 0, l.size); // 右半边
        ctx.quadraticCurveTo(-l.size * 0.6, -l.size * 0.3, 0, -l.size); // 左半边
        ctx.fillStyle = l.color;
        ctx.fill();
        
        // 绘制叶脉（可选，增加细节）
        ctx.beginPath();
        ctx.moveTo(0, -l.size);
        ctx.lineTo(0, l.size);
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    function draw() {
        ctx.clearRect(0, 0, w, h);
        for (var i = 0; i < leaves.length; i++) {
            var l = leaves[i];

            // 自然飘动
            l.x += l.speedX + Math.sin(l.y * 0.01) * 0.2;
            l.y += l.speedY;
            l.angle += l.spin;
            l.flip += l.flipSpeed; // 更新翻转角度

            // 鼠标排斥
            if(mouse.x !== null){
                var dx = l.x - mouse.x,
                    dy = l.y - mouse.y,
                    dist = Math.sqrt(dx*dx + dy*dy);
                if(dist < 100){
                    var force = (100 - dist) / 100 * 1; 
                    l.x += dx / dist * force;
                    l.y += dy / dist * force;
                }
            }

            if(l.y > h + 20){
                l.y = -20;
                l.x = Math.random() * w;
            }

            ctx.save();
            ctx.translate(l.x, l.y);
            ctx.rotate(l.angle * Math.PI / 180);
            
            // 模拟 3D 翻转效果：通过缩放 X 轴模拟叶片在空中翻滚
            var flipScale = Math.cos(l.flip);
            ctx.scale(flipScale, 1);
            
            drawLeaf(ctx, l);
            ctx.restore();
        }
        rAF(draw);
    }

    window.onmousemove = function(e){ mouse.x = e.clientX; mouse.y = e.clientY; };
    window.onmouseout = function(){ mouse.x = null; mouse.y = null; };
    window.onresize = resize;

    resize();
    initLeaves();
    draw();
});
