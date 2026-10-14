(function() {
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');

  let width, height;
  let particles = [];
  
  const config = {
    particleCount: 90,
    baseSpeed: 1.2,
    linkRadius: 120,
    colorPrimary: '#00f3ff',
    colorSecondary: '#ff007f',
    mouseRadius: 150
  };

  const mouse = {
    x: null,
    y: null,
    isHovered: false
  };

  const palettes = {
    cyan: { primary: '#00f3ff', secondary: '#ff007f' },
    velvet: { primary: '#ff2a5f', secondary: '#ffd700' },
    aurora: { primary: '#00ffaa', secondary: '#00c8ff' },
    violet: { primary: '#b026ff', secondary: '#00e1ff' }
  };

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.isHovered = true;
  });

  window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
    mouse.isHovered = false;
  });

  window.addEventListener('click', (e) => {
    particles.forEach(p => {
      const dx = p.x - e.clientX;
      const dy = p.y - e.clientY;
      const dist = Math.hypot(dx, dy);
      if (dist < 200 && dist > 0) {
        const force = (200 - dist) / 15;
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
      }
    });
  });

  class Particle {
    constructor() {
      this.init();
    }

    init() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.3 + Math.random() * 0.7) * config.baseSpeed;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.radius = 1.2 + Math.random() * 2.2;
      this.colorType = Math.random() > 0.4 ? 'primary' : 'secondary';
      this.pulse = Math.random() * Math.PI;
      this.pulseSpeed = 0.02 + Math.random() * 0.03;
    }

    update() {
      this.pulse += this.pulseSpeed;
      const currentRadius = this.radius + Math.sin(this.pulse) * 0.6;

      const currentSpeed = Math.hypot(this.vx, this.vy);
      const maxSpeed = config.baseSpeed * 2.5;
      if (currentSpeed > maxSpeed) {
        this.vx = (this.vx / currentSpeed) * maxSpeed;
        this.vy = (this.vy / currentSpeed) * maxSpeed;
      }

      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0) { this.x = 0; this.vx *= -1; }
      if (this.x > width) { this.x = width; this.vx *= -1; }
      if (this.y < 0) { this.y = 0; this.vy *= -1; }
      if (this.y > height) { this.y = height; this.vy *= -1; }

      if (mouse.isHovered && mouse.x !== null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist < config.mouseRadius && dist > 0) {
          const normalX = dx / dist;
          const normalY = dy / dist;
          const factor = (config.mouseRadius - dist) / config.mouseRadius;

          this.vx += normalX * factor * 0.18 - normalY * factor * 0.15;
          this.vy += normalY * factor * 0.18 + normalX * factor * 0.15;
        }
      }

      return currentRadius;
    }

    draw(r) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, Math.max(0.2, r), 0, Math.PI * 2);
      ctx.fillStyle = this.colorType === 'primary' ? config.colorPrimary : config.colorSecondary;
      ctx.shadowBlur = 10;
      ctx.shadowColor = ctx.fillStyle;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function initParticles() {
    particles = [];
    for (let i = 0; i < config.particleCount; i++) {
      particles.push(new Particle());
    }
  }
  initParticles();

  function animate() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const r = particles[i].update();
      particles[i].draw(r);

      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.hypot(dx, dy);

        if (dist < config.linkRadius) {
          const alpha = (1 - dist / config.linkRadius) * 0.45;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = particles[i].colorType === 'primary' 
            ? hexToRgba(config.colorPrimary, alpha) 
            : hexToRgba(config.colorSecondary, alpha);
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      if (mouse.isHovered && mouse.x !== null) {
        const mdx = particles[i].x - mouse.x;
        const mdy = particles[i].y - mouse.y;
        const mdist = Math.hypot(mdx, mdy);
        if (mdist < config.linkRadius * 1.3) {
          const mAlpha = (1 - mdist / (config.linkRadius * 1.3)) * 0.65;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = hexToRgba(config.colorPrimary, mAlpha);
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  function hexToRgba(hex, alpha) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
  }

  const sliderCount = document.getElementById('slider-count');
  const valCount = document.getElementById('val-count');
  sliderCount.addEventListener('input', (e) => {
    config.particleCount = parseInt(e.target.value);
    valCount.textContent = config.particleCount;
    initParticles();
  });

  const sliderSpeed = document.getElementById('slider-speed');
  const valSpeed = document.getElementById('val-speed');
  sliderSpeed.addEventListener('input', (e) => {
    const raw = parseFloat(e.target.value) / 10;
    config.baseSpeed = raw;
    valSpeed.textContent = raw.toFixed(1) + 'x';
    particles.forEach(p => {
      const angle = Math.atan2(p.vy, p.vx);
      const spd = (0.3 + Math.random() * 0.7) * config.baseSpeed;
      p.vx = Math.cos(angle) * spd;
      p.vy = Math.sin(angle) * spd;
    });
  });

  const sliderRadius = document.getElementById('slider-radius');
  const valRadius = document.getElementById('val-radius');
  sliderRadius.addEventListener('input', (e) => {
    config.linkRadius = parseInt(e.target.value);
    valRadius.textContent = config.linkRadius + 'px';
  });

  const themeButtons = document.querySelectorAll('.theme-btn');
  themeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      themeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const themeName = btn.getAttribute('data-theme');

      if (themeName === 'cyan') {
        document.documentElement.removeAttribute('data-theme');
      } else {
        document.documentElement.setAttribute('data-theme', themeName);
      }

      const palette = palettes[themeName];
      if (palette) {
        config.colorPrimary = palette.primary;
        config.colorSecondary = palette.secondary;
      }
    });
  });

  const controlPanel = document.getElementById('control-panel');
  const panelCloseBtn = document.getElementById('panel-close-btn');
  const panelOpenPill = document.getElementById('panel-open-pill');

  panelCloseBtn.addEventListener('click', () => {
    controlPanel.classList.add('minimized');
    panelOpenPill.style.display = 'flex';
  });

  panelOpenPill.addEventListener('click', () => {
    controlPanel.classList.remove('minimized');
    panelOpenPill.style.display = 'none';
  });

  const resumeModal = document.getElementById('resume-modal-backdrop');
  const openResumeBtn = document.getElementById('open-resume-btn');
  const closeResumeBtn = document.getElementById('modal-close-btn');

  openResumeBtn.addEventListener('click', () => {
    resumeModal.classList.add('active');
  });

  closeResumeBtn.addEventListener('click', () => {
    resumeModal.classList.remove('active');
  });

  resumeModal.addEventListener('click', (e) => {
    if (e.target === resumeModal) {
      resumeModal.classList.remove('active');
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && resumeModal.classList.contains('active')) {
      resumeModal.classList.remove('active');
    }
  });
})();
