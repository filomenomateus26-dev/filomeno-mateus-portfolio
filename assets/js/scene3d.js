/* =====================================================================
   EXPERIÊNCIA 3D — WebGL nativo, sem bibliotecas externas.
   Uma nuvem de partículas atravessa a página e muda de forma a cada
   secção (esfera → nó → ecrãs → hélice → galáxia). Também adiciona
   inclinação 3D aos cartões e profundidade aos projetos.
   ===================================================================== */
(function(){
  const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
  const finePointer = matchMedia("(hover:hover) and (pointer:fine)").matches;

  /* ---------- Cena de partículas ---------- */
  (function(){
    const canvas = document.createElement("canvas");
    canvas.className = "scene3d";
    canvas.setAttribute("aria-hidden", "true");
    const gl = canvas.getContext("webgl", { alpha:true, antialias:false, premultipliedAlpha:true, powerPreference:"low-power" });
    if (!gl) return;
    document.body.prepend(canvas);
    document.documentElement.classList.add("has-3d");

    const N = innerWidth < 700 ? 1800 : 3200;
    const TAU = Math.PI * 2;
    const rnd = () => Math.random();
    const shapes = [new Float32Array(N*3), new Float32Array(N*3), new Float32Array(N*3), new Float32Array(N*3), new Float32Array(N*3)];
    const seeds = new Float32Array(N);
    const set = (arr, i, x, y, z) => { arr[i*3] = x; arr[i*3+1] = y; arr[i*3+2] = z; };

    for (let i = 0; i < N; i++){
      seeds[i] = rnd();

      // 0 — esfera (Fibonacci) com uma casca interior
      const k = i / N, phi = Math.acos(1 - 2*k), th = Math.PI * (1 + Math.sqrt(5)) * i;
      const r0 = i % 5 === 0 ? 0.62 : 1;
      set(shapes[0], i, r0*Math.cos(th)*Math.sin(phi), r0*Math.cos(phi), r0*Math.sin(th)*Math.sin(phi));

      // 1 — nó tórico (2,3): websites, conteúdo e apps entrelaçados
      const t = k * TAU, p = 2, q = 3;
      const cx = (0.62 + 0.28*Math.cos(q*t)) * Math.cos(p*t);
      const cy = (0.62 + 0.28*Math.cos(q*t)) * Math.sin(p*t);
      const cz = 0.28 * Math.sin(q*t);
      const a = rnd()*TAU, tr = 0.09 * Math.sqrt(rnd());
      set(shapes[1], i, cx + tr*Math.cos(a), cy + tr*Math.sin(a), cz + tr*Math.cos(a+1.3));

      // 2 — três "ecrãs" empilhados em profundidade: os projetos
      const layer = i % 3, onEdge = rnd() < 0.55;
      let x, y;
      if (onEdge){
        const e = rnd()*4.6, w = 1.1, h = 0.7;
        if (e < 2.2){ x = (e/2.2*2-1)*w; y = rnd()<.5 ? -h : h; }
        else { x = rnd()<.5 ? -w : w; y = ((e-2.2)/2.4*2-1)*h; }
      } else {
        x = (rnd()*2-1)*1.1; y = (rnd()*2-1)*0.7;
        if (rnd() < 0.6) y = 0.7 - 0.14 - Math.floor(rnd()*4)*0.16 + (rnd()-.5)*0.02; // linhas de "conteúdo"
      }
      set(shapes[2], i, x*0.82 + (layer-1)*0.22, y*0.82 + (layer-1)*0.16, (layer-1)*0.55);

      // 3 — dupla hélice com degraus: o processo
      const u = k * 2 - 1, ang = u * TAU * 1.6;
      if (i % 4 === 0){
        const s = rnd()*2-1;
        set(shapes[3], i, Math.cos(ang)*0.5*s, u*1.15, Math.sin(ang)*0.5*s);
      } else {
        const side = i % 2 ? 0 : Math.PI, j = (rnd()-.5)*0.05;
        set(shapes[3], i, Math.cos(ang+side)*0.5 + j, u*1.15 + j, Math.sin(ang+side)*0.5 + j);
      }

      // 4 — galáxia em espiral: o contacto
      const arm = i % 3, rr = Math.pow(rnd(), 0.6) * 1.15;
      const ga = arm/3*TAU + rr*3.2 + (rnd()-.5)*0.45/(rr+0.3);
      set(shapes[4], i, Math.cos(ga)*rr, (rnd()-.5)*0.1*(1.2-rr), Math.sin(ga)*rr);
    }

    const vs = `
      attribute vec3 a0,a1,a2,a3,a4; attribute float aSeed;
      uniform float uT,uMorph,uAspect,uPR,uSize,uScale; uniform vec2 uRot,uOff; uniform vec4 uTilt;
      varying float vSeed,vDepth;
      float w(float i){ return clamp(1.0-abs(uMorph-i),0.0,1.0); }
      void main(){
        vec3 p = a0*w(0.)+a1*w(1.)+a2*w(2.)+a3*w(3.)+a4*w(4.);
        float pulse = sin(uT*1.3 + aSeed*6.2831 + p.y*3.0);
        p += normalize(p+vec3(.0001)) * pulse * 0.022;
        float ry = uRot.x + uT*0.11, rx = uRot.y;
        p = vec3(p.x*cos(ry)+p.z*sin(ry), p.y, -p.x*sin(ry)+p.z*cos(ry));
        p = vec3(p.x, p.y*cos(rx)-p.z*sin(rx), p.y*sin(rx)+p.z*cos(rx));
        // inclinação extra por forma (a galáxia deita-se, os ecrãs ficam de frente)
        p = vec3(p.x, p.y*uTilt.x - p.z*uTilt.y, p.y*uTilt.y + p.z*uTilt.x);
        float z = p.z + 3.0;
        gl_Position = vec4(p.x*uScale/uAspect, p.y*uScale, 0.0, z);
        gl_Position.xy += uOff*z;
        gl_PointSize = (1.4 + aSeed*2.6) * uPR * uSize * (3.0/z);
        vSeed = aSeed; vDepth = clamp((z-2.0)/2.0,0.0,1.0);
      }`;
    const fs = `
      precision mediump float;
      uniform float uAlpha; varying float vSeed,vDepth;
      void main(){
        float d = length(gl_PointCoord-0.5);
        float a = smoothstep(0.5,0.0,d) * uAlpha * (1.0-vDepth*0.65);
        vec3 c = mix(vec3(1.0,0.54,0.24), vec3(1.0,0.76,0.29), vSeed);
        c = mix(c, vec3(0.75,0.12,0.14), vDepth*0.7);
        gl_FragColor = vec4(c*a, a);
      }`;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.remove(); document.documentElement.classList.remove("has-3d"); return; }
    gl.useProgram(prog);

    const attr = (name, data, size) => {
      const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, name); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    };
    shapes.forEach((s, i) => attr("a"+i, s, 3));
    attr("aSeed", seeds, 1);
    const U = {};
    ["uT","uMorph","uAspect","uPR","uSize","uScale","uRot","uOff","uTilt","uAlpha"].forEach(n => U[n] = gl.getUniformLocation(prog, n));

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.clearColor(0,0,0,0);

    // Cada secção tem uma forma, posição e intensidade.
    const ids = ["home","services","projects","process","contact"];
    const sections = ids.map(id => document.getElementById(id));
    const layout = wide => [
      { off:[wide ? 0.42 : 0, wide ? 0.02 : 0.28], alpha:1,    tilt:0 },
      { off:[wide ? 0.55 : 0.35, 0.35],            alpha:.45,  tilt:.3 },
      { off:[wide ? -0.55 : -0.3, 0.3],            alpha:.4,   tilt:0 },
      { off:[wide ? 0.6 : 0.4, 0],                 alpha:.55,  tilt:0 },
      { off:[wide ? -0.5 : 0, wide ? 0 : 0.4],     alpha:.55,  tilt:1.05 }
    ];
    let L = layout(innerWidth >= 900);

    let W = 0, H = 0, pr = 1;
    function resize(){
      pr = Math.min(devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight;
      canvas.width = Math.round(W*pr); canvas.height = Math.round(H*pr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      L = layout(W >= 900);
      if (reduce) draw(0);
    }

    // Progresso contínuo entre secções (0 = hero … 4 = contacto)
    function target(){
      const mid = H*0.5;
      let m = 0;
      for (let i = 0; i < sections.length; i++){
        const s = sections[i]; if (!s) continue;
        const rc = s.getBoundingClientRect(), top = rc.top, h = rc.height || 1;
        if (mid >= top) m = i + Math.min(1, (mid-top)/h) * (i < sections.length-1 ? 1 : 0);
      }
      // mantém a forma estável no centro da secção, transita só no fim
      const i = Math.floor(m), f = m - i;
      return i + Math.max(0, (f-0.55)/0.45);
    }

    const st = { morph:target(), rx:0, ry:0, mx:0, my:0, scroll:0 };
    addEventListener("pointermove", e => { st.mx = e.clientX/W*2-1; st.my = e.clientY/H*2-1; }, { passive:true });

    const lerp = (a,b,t) => a + (b-a)*t;
    function draw(time){
      const m = st.morph, i = Math.min(4, Math.floor(m)), f = m - i, j = Math.min(4, i+1);
      const a = L[i], b = L[j];
      const ox = lerp(a.off[0], b.off[0], f), oy = lerp(a.off[1], b.off[1], f);
      const tilt = lerp(a.tilt, b.tilt, f);
      // dimensão: maior no hero, mais contida nas outras secções
      const size = Math.min(W, H) / 900 * 1.6 + 0.5;
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(U.uT, time/1000);
      gl.uniform1f(U.uMorph, m);
      gl.uniform1f(U.uAspect, W/H);
      gl.uniform1f(U.uPR, pr);
      gl.uniform1f(U.uSize, size);
      gl.uniform1f(U.uScale, 2.1 * Math.min(1, Math.max(W/H, 0.55)));
      gl.uniform2f(U.uRot, st.rx, st.ry);
      gl.uniform2f(U.uOff, ox, oy);
      gl.uniform4f(U.uTilt, Math.cos(tilt), Math.sin(tilt), 0, 0);
      gl.uniform1f(U.uAlpha, lerp(a.alpha, b.alpha, f) * (W < 700 ? .7 : 1) * 0.55);
      gl.drawArrays(gl.POINTS, 0, N);
    }

    let running = false, raf = 0;
    function frame(time){
      st.morph = lerp(st.morph, target(), 0.06);
      st.rx = lerp(st.rx, st.mx*0.5, 0.04);
      st.ry = lerp(st.ry, st.my*0.3, 0.04);
      draw(time);
      raf = requestAnimationFrame(frame);
    }
    function start(){ if (running || reduce) return; running = true; raf = requestAnimationFrame(frame); }
    function stop(){ running = false; cancelAnimationFrame(raf); }

    addEventListener("resize", resize);
    resize();
    if (reduce){
      addEventListener("scroll", () => { st.morph = target(); draw(0); }, { passive:true });
      draw(0);
    } else {
      document.addEventListener("visibilitychange", () => document.hidden ? stop() : start());
      start();
    }
    canvas.addEventListener("webglcontextlost", e => { e.preventDefault(); stop(); });
  })();

  /* ---------- Inclinação 3D nos cartões ---------- */
  if (finePointer && !reduce){
    document.querySelectorAll("[data-tilt]").forEach(el => {
      const max = parseFloat(el.dataset.tilt) || 8;
      let raf = 0;
      el.addEventListener("pointermove", e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left)/r.width, y = (e.clientY - r.top)/r.height;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          el.style.setProperty("--ry", ((x-.5)*max*2).toFixed(2)+"deg");
          el.style.setProperty("--rx", ((.5-y)*max*2).toFixed(2)+"deg");
          el.style.setProperty("--gx", (x*100).toFixed(1)+"%");
          el.style.setProperty("--gy", (y*100).toFixed(1)+"%");
          el.classList.add("tilting");
        });
      });
      el.addEventListener("pointerleave", () => {
        cancelAnimationFrame(raf);
        el.classList.remove("tilting");
        el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg");
      });
    });
  }

  /* ---------- Projetos entram com profundidade ao fazer scroll ---------- */
  if (!reduce){
    const items = Array.from(document.querySelectorAll(".case .vis"));
    if (!items.length) return;
    let ticking = false;
    function update(){
      ticking = false;
      const h = innerHeight;
      items.forEach(el => {
        const r = el.getBoundingClientRect();
        const p = Math.max(-1, Math.min(1, (r.top + r.height/2 - h/2) / (h/2 + r.height/2)));
        el.style.setProperty("--sp", p.toFixed(3));
      });
    }
    const req = () => { if (!ticking){ ticking = true; requestAnimationFrame(update); } };
    addEventListener("scroll", req, { passive:true });
    addEventListener("resize", req);
    update();
  }
})();
