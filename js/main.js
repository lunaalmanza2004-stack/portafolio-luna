// =========================================================
// main.js — Portafolio Luna Almanza (COMPLETO, sin Opiniones)
// - Scroll más LENTO y preciso (1.3s con easing)
// - Activo en navbar por sección visible
// - LinkedIn cards + normalización Drive
// - Thumbs de proyectos (Drive)
// =========================================================
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // ====== ICONOS (Lucide) ======
  if (window.lucide) lucide.createIcons();

  // ====== LINKS desde window.LINKS a <a data-link="..."> ======
  if (window.LINKS && typeof window.LINKS === 'object') {
    document.querySelectorAll('a[data-link]').forEach(a => {
      const key = a.getAttribute('data-link');
      const url = window.LINKS[key];
      if (url) a.setAttribute('href', url);
    });
  }

  // ====== Utilidades Google Drive ======
  function extractDriveId(url) {
    try {
      const u = new URL(url);
      if (!u.hostname.includes('drive.google.com')) return null;
      let id = null;
      const m1 = u.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (m1) id = m1[1];
      if (!id && u.searchParams.get('id')) id = u.searchParams.get('id');
      if (!id) {
        const m2 = u.pathname.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (m2) id = m2[1];
      }
      return id;
    } catch { return null; }
  }
  function normalizeDriveUrl(url) {
    if (!url) return url;
    const id = extractDriveId(url);
    return id ? `https://drive.google.com/uc?export=view&id=${id}` : url;
  }
  function driveAltUrl(url) {
    const id = extractDriveId(url);
    return id ? `https://lh3.googleusercontent.com/d/${id}=w1600` : null;
  }
  function fixDriveImages(scope=document) {
    scope.querySelectorAll('img').forEach(img => {
      if (img.dataset.fixedDrive) return;
      const src = img.getAttribute('src') || '';
      if (src.includes('drive.google.com')) {
        const original = src;
        img.src = normalizeDriveUrl(original);
        img.dataset.fixedDrive = '1';
        img.addEventListener('error', () => {
          const alt = driveAltUrl(original);
          if (alt) img.src = alt;
        }, { once:true });
      }
    });
  }

  // ====== Scroll personalizado (más lento/preciso) ======
  const SCROLL_MS = 1300; // velocidad de desplazamiento
  const EASE = t => t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2; // easeInOutCubic

  function smoothScrollTo(targetY, duration = SCROLL_MS) {
    const startY = window.pageYOffset;
    const delta = targetY - startY;
    const start = performance.now();

    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = EASE(t);
      window.scrollTo(0, startY + delta * eased);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function scrollToSection(id, offsetPx = 0) {
    const el = document.getElementById(id);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const y = window.pageYOffset + rect.top - offsetPx;
    smoothScrollTo(y);
  }

  // ====== NAV activo + listeners ======
  const navButtons = document.querySelectorAll('.nav-btn');

  const setActive = (id) => {
    navButtons.forEach(btn => {
      const isActive = btn.dataset.section === id;
      btn.classList.toggle('active', isActive);
    });
  };

  // Click handlers (todos clickeables ahora)
  navButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = btn.dataset.section;
      scrollToSection(id, 0);
    });
  });

  // Scroll Spy (usa 'avisos' en lugar de 'opiniones')
  const sectionIds = ['inicio','formacion','habilidades','proyectos','publicaciones','avisos','contacto'];
  const sections = sectionIds.map(id => document.getElementById(id)).filter(Boolean);

  const io = new IntersectionObserver((entries) => {
    let best = null, bestRatio = 0;
    for (const en of entries) {
      if (en.isIntersecting && en.intersectionRatio > bestRatio) {
        best = en.target; bestRatio = en.intersectionRatio;
      }
    }
    if (best) setActive(best.id);
  }, {
    root: null,
    threshold: Array.from({length: 21}, (_,i)=>i/20),
    rootMargin: "-25% 0px -55% 0px"
  });

  sections.forEach(sec => io.observe(sec));
  setActive('inicio');

  // ====== Publicaciones (LinkedIn) ======
  const publications = [
    {
      id: 1,
      title: "Detector de Somnolencia",
      description: "Monitorea tus ojos en tiempo real y muestra un HUD con fecha/hora, FPS y un progreso del tiempo con ojos cerrados.",
      author: "Luna Almanza",
      date: "5 Oct, 2025",
      image: "https://drive.google.com/file/d/1qP2Rck5yJHVIVWJZ94poQGsC154eq-UE/view?usp=drive_link",
      linkedinUrl: "https://www.linkedin.com/posts/luna-almanza_python-datascience-proyectopersonal-activity-7380762887042076672-e1V7?utm_source=share&utm_medium=member_desktop&rcm=ACoAAFJqFf4BVbxrQBbsyu1OyQ8knG3hB_LFjyA"
    },
    {
      id: 2,
      title: "¿Por qué π (pi) es un número irracional?",
      description: "π es la relación entre la circunferencia y el diámetro; repasa por qué no puede expresarse como fracción y qué implica en matemáticas.",
      author: "Luna Almanza",
      date: "7 Nov, 2025",
      image: "https://drive.google.com/file/d/1MS0aiPUkf2Bv5WklOHuDe53r4sHfed7Z/view?usp=sharing",
      linkedinUrl: "https://www.linkedin.com/posts/luna-almanza_por-qu%C3%A9-%CF%80-pi-es-un-n%C3%BAmero-irracional-activity-7392381228340953090-6Z_A?utm_source=share&utm_medium=member_desktop&rcm=ACoAAFJqFf4BVbxrQBbsyu1OyQ8knG3hB_LFjyA"
    },
    {
      id: 3,
      title: "ColorSense",
      description: "Hecho para apoyar a personas con discapacidad visual. ♿🔊",
      author: "Luna Almanza",
      date: "7 Nov, 2025",
      image: "https://drive.google.com/file/d/1ogTHLIlu0YS5QObrTXuuCKxOKFfqxJdx/view?usp=sharing",
      linkedinUrl: "https://www.linkedin.com/posts/luna-almanza_accesibilidad-computervision-datascience-activity-7392733811412873216-gPKq?utm_source=share&utm_medium=member_desktop&rcm=ACoAAFJqFf4BVbxrQBbsyu1OyQ8knG3hB_LFjyA"
    },
    {
      id: 4,
      title: "UX/UI: Diseñando Experiencias",
      description: "Analizador de Diseño Web — WCAG (Web Content Accessibility Guidelines).",
      author: "Luna Almanza",
      date: "12 Oct, 2024",
      image: "https://drive.google.com/file/d/1n0HU1kI1cfk-BLVkzHLkm1nCwbmnD7JQ/view?usp=sharing",
      linkedinUrl: "https://www.linkedin.com/posts/luna-almanza_webdesign-ux-accesibilidad-activity-7388319226761134081-hC3v?utm_source=share&utm_medium=member_desktop&rcm=ACoAAFJqFf4BVbxrQBbsyu1OyQ8knG3hB_LFjyA"
    },
    {
      id: 5,
      title: "Real: JSON es flexible",
      description: "Las bases relacionales piden estructura. Si metes todo en JSON, pierdes índices, validaciones y buen reporting.",
      author: "Luna Almanza",
      date: "3 Oct, 2025",
      image: "https://drive.google.com/file/d/1OwDx6oiFMN3EslDO2oQGRr03KTXVAJcW/view?usp=sharing",
      linkedinUrl: "https://www.linkedin.com/posts/luna-almanza_100-real-json-es-flexible-las-bases-relacionales-activity-7388760493450248192-JWM-?utm_source=share&utm_medium=member_desktop&rcm=ACoAAFJqFf4BVbxrQBbsyu1OyQ8knG3hB_LFjyA"
    },
    {
      id: 6,
      title: "Lo que dice la ciencia",
      description: "Cuando escuchas un sonido, se activa un circuito completo: oído interno + nervio auditivo + cerebro.",
      author: "Luna Almanza",
      date: "5 Nov, 2025",
      image: "https://drive.google.com/file/d/1WqYVqyX1W8cn3RvPNNC8lZGvSbs-Ugtc/view?usp=sharing",
      linkedinUrl: "https://www.linkedin.com/posts/luna-almanza_cuando-escuchas-un-sonido-no-solo-act%C3%BAa-activity-7392383993104691200-vLIq?utm_source=share&utm_medium=member_desktop&rcm=ACoAAFJqFf4BVbxrQBbsyu1OyQ8knG3hB_LFjyA"
    }
  ];

  function renderPublications() {
    const grid = document.getElementById('publications-grid');
    if (!grid) return;
    grid.innerHTML = '';
    for (const p of publications) {
      const imgUrl = normalizeDriveUrl(p.image);

      const card = document.createElement('div');
      card.className = "group bg-white border-2 border-gray-200 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:border-orange-500 hover:shadow-2xl hover:-translate-y-2";
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.minHeight = '405px';

      card.innerHTML = `
        <div class="relative overflow-hidden rounded-t-xl"
             style="height:14rem;background:linear-gradient(45deg,#ff7a18,#ff5400)">
          <img src="${imgUrl}" alt="${p.title}"
               style="width:100%;height:100%;object-fit:cover;object-position:center 40%;
                      display:block;transition:transform .3s,opacity .3s">
          <div class="absolute inset-0" style="background:linear-gradient(to top,rgba(0,0,0,.6),transparent);opacity:0;transition:opacity .3s"></div>
          <div class="absolute top-4 right-4 bg-orange-500 p-3 rounded-full"
               style="opacity:0;transition:all .3s;transform:translateY(8px)">
            <i data-lucide="external-link" class="w-5 h-5 text-white"></i>
          </div>
        </div>
        <div class="p-6">
          <div class="flex items-center gap-2 mb-3">
            <span class="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm">LinkedIn</span>
            <span class="text-sm text-gray-500">${p.date}</span>
          </div>
          <h3 class="text-xl text-black mb-2">${p.title}</h3>
          <p class="text-gray-600 mb-4 clamp-2">${p.description}</p>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-500">Por ${p.author}</span>
            <div class="flex items-center gap-2 text-orange-500">
              <span class="text-sm">Ver más</span>
              <i data-lucide="external-link" class="w-4 h-4"></i>
            </div>
          </div>
        </div>
      `;

      const header = card.firstElementChild;
      const imgEl  = header.querySelector('img');
      const gradEl = header.children[1];
      const pillEl = header.children[2];
      card.addEventListener('mouseenter', () => {
        imgEl.style.transform = 'scale(1.15)'; imgEl.style.opacity = '0.9';
        gradEl.style.opacity = '1'; pillEl.style.opacity = '1'; pillEl.style.transform = 'translateY(0)';
      });
      card.addEventListener('mouseleave', () => {
        imgEl.style.transform = 'scale(1.0)'; imgEl.style.opacity = '1';
        gradEl.style.opacity = '0'; pillEl.style.opacity = '0'; pillEl.style.transform = 'translateY(8px)';
      });

      const body = card.querySelector('.p-6');
      body.style.display = 'flex';
      body.style.flexDirection = 'column';
      body.style.flex = '1 1 auto';
      const footer = body.lastElementChild;
      footer.style.marginTop = 'auto';

      imgEl.addEventListener('error', () => {
        if (!imgEl.dataset.altTried) {
          const alt = driveAltUrl(p.image);
          if (alt) { imgEl.dataset.altTried = '1'; imgEl.src = alt; return; }
        }
        imgEl.style.opacity = 0; header.style.background = '#111827';
      });

      card.addEventListener('click', () => {
        window.open(p.linkedinUrl, '_blank', 'noopener,noreferrer');
      });

      grid.appendChild(card);
    }
    if (window.lucide) lucide.createIcons();
  }
  renderPublications();

  // ====== Proyectos: normalizar <img data-img="..."> (soporta Drive)
  (function initProjectThumbs(){
    const thumbs = document.querySelectorAll('.project-thumb img');
    thumbs.forEach(img => {
      const wanted = img.getAttribute('data-img');
      if (!wanted) return;
      const url = normalizeDriveUrl(wanted);
      img.src = url;

      img.addEventListener('error', () => {
        if (!img.dataset.altTried) {
          const alt = driveAltUrl(wanted);
          if (alt) { img.dataset.altTried = '1'; img.src = alt; return; }
        }
        img.style.opacity = 0;
        const header = img.closest('.project-thumb');
        if (header) header.style.background = '#111827';
      });
    });
  })();

  // Repara cualquier <img> Drive ya presente
  fixDriveImages(document);
});
