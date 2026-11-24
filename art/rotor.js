// A swept blade is drawn in polar coordinates. The same cross-section is
// repeated around the shaft, while light stays fixed in screen space.
(() => {
  const panel = document.querySelector('.artboard');
  const canvas = panel.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const full = Math.PI * 2;
  let width, height, angle = -.3, target = angle, light = -.8;
  let previousX = null, frame = 0, scrollOffset = 0;

  function surface(t, u, phase) {
    const radius = .205 + .795 * t;
    const bend = .72 * Math.sin(t * 1.5) - .13 * t * t;
    const chord = .18 + .11 * Math.sin(t * Math.PI);
    const a = phase + bend + chord * u;
    return [radius * Math.cos(a), radius * Math.sin(a) - .09 * Math.sin(t * Math.PI) * Math.sin(u * Math.PI)];
  }
  function strip(phase, u) {
    for (let j = 0; j <= 26; j++) {
      const point = surface(j / 26, u, phase);
      if (j === 0) ctx.moveTo(...point);
      else ctx.lineTo(...point);
    }
  }
  function draw() {
    ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
    ctx.fillStyle = '#101216';
    ctx.fillRect(0, 0, width, height);
    const size = Math.min(width * .51, height * .62);
    ctx.translate(width * .53, height * .48);
    ctx.rotate(-.29);
    ctx.scale(size, size * .80);
    for (let i = 0; i < 46; i++) {
      const phase = full * i / 46 + angle + scrollOffset;
      const sheen = .5 + .5 * Math.cos(phase - light);
      ctx.beginPath();
      strip(phase, 0);
      for (let j = 26; j >= 0; j--) ctx.lineTo(...surface(j / 26, 1, phase));
      ctx.closePath();
      const tip = surface(1, 1, phase);
      const metal = ctx.createLinearGradient(0, 0, ...tip);
      metal.addColorStop(0, '#232932');
      metal.addColorStop(.37, 'hsl(215 12% ' + (21 + 37 * sheen) + '%)');
      metal.addColorStop(.75, 'hsl(35 11% ' + (25 + 55 * sheen) + '%)');
      metal.addColorStop(1, '#40464e');
      ctx.fillStyle = metal;
      ctx.fill();
      for (let k = 0; k < 7; k++) {
        ctx.beginPath();
        strip(phase, k / 7);
        ctx.lineWidth = (k === 0 ? 1.3 : .55) / size;
        ctx.strokeStyle = k === 0 ? 'rgba(244,242,230,.78)' : 'rgba(21,24,30,.55)';
        ctx.stroke();
      }
    }
    for (const [r, fill] of [[.22,'#939690'],[.207,'#1d2229'],[.17,'#575c5d'],[.161,'#13151a'],[.075,'#35383d'],[.055,'#0f1014']]) {
      ctx.beginPath(); ctx.arc(0,0,r,0,full); ctx.fillStyle=fill; ctx.fill();
    }
    ctx.strokeStyle = '#ff9466'; ctx.lineWidth = 1 / size;
    ctx.beginPath();ctx.arc(0,0,1.08,-2.1 + scrollOffset,-.65 + scrollOffset);ctx.stroke();
  }
  function render() {
    angle += (target - angle) * (reduced.matches ? 1 : .22);
    draw();
    frame = Math.abs(target-angle) > .001 ? requestAnimationFrame(render) : 0;
  }
  function update() { if (!frame) frame = requestAnimationFrame(render); }
  function resize() {
    width = panel.clientWidth; height = panel.clientHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    update();
  }
  panel.addEventListener('pointerdown', e => {
    previousX = e.clientX;
    panel.setPointerCapture(e.pointerId);
  });
  panel.addEventListener('pointermove', e => {
    if (previousX === null && e.pointerType !== 'mouse') return;
    if (previousX !== null) target += (e.clientX - previousX) / width * 2;
    previousX = e.clientX;
    const bounds = panel.getBoundingClientRect();
    light = Math.atan2(e.clientY - bounds.top - height / 2, e.clientX - bounds.left - width / 2);
    update();
  });
  for (const event of ['pointerup', 'pointercancel', 'pointerleave']) {
    panel.addEventListener(event, () => { previousX = null; });
  }
  addEventListener('scroll', () => {
    if (reduced.matches || scrollY > height + 160) return;
    scrollOffset = scrollY / Math.max(height,1) * .28;
    update();
  }, {passive:true});
  new ResizeObserver(resize).observe(panel);
  resize();
})();
