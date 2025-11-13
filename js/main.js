// =========================================================
// main.js — Portafolio Luna Almanza (COMPLETO)
// - Botón "Opiniones" soportado (sección #6)
// - Scroll más LENTO y preciso (1.2–1.3s con easing)
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
  const SCROLL_MS = 1300;                   // velocidad de desplazamiento
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
    // Posición absoluta del elemento
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

  // Click handlers (evita los deshabilitados)
  navButtons.forEach(btn => {
    if (btn.classList.contains('nav-btn--disabled') || btn.getAttribute('aria-disabled') === 'true') return;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = btn.dataset.section;
      // offset pequeño por estética; tu header ya tiene padding, así que 0 está bien
      scrollToSection(id, 0);
    });
  });

  // Scroll Spy (incluye Opiniones como #6)
  const sectionIds = ['inicio','formacion','habilidades','proyectos','publicaciones','opiniones','contacto'];
  const sections = sectionIds.map(id => document.getElementById(id)).filter(Boolean);

  const io = new IntersectionObserver((entries) => {
    // elegimos la sección con mayor ratio visible
    let best = null, bestRatio = 0;
    for (const en of entries) {
      if (en.isIntersecting && en.intersectionRatio > bestRatio) {
        best = en.target; bestRatio = en.intersectionRatio;
      }
    }
    if (best) setActive(best.id);
  }, {
    // Hace el "activo" más estable mientras se centra la sección
    root: null,
    threshold: Array.from({length: 21}, (_,i)=>i/20),
    rootMargin: "-25% 0px -55% 0px"
  });

  sections.forEach(sec => io.observe(sec));
  setActive('inicio');

  // ====== Opiniones (localStorage) + Editar/Eliminar ======
  const OP_KEY = 'opiniones';
  const form = document.getElementById('opinion-form');
  const list = document.getElementById('opiniones-list');
  const ratingForm = document.getElementById('opinion-rating');
  let editingId = null;

  function applyStars(container, value) {
    const stars = container?.querySelectorAll?.('.star') || [];
    stars.forEach(st => st.classList.toggle('active', Number(st.dataset.value) <= value));
  }

  // Estrellas del formulario
  if (ratingForm) {
    ratingForm.addEventListener('mouseover', (e) => {
      const btn = e.target.closest('.star'); if (!btn) return;
      applyStars(ratingForm, Number(btn.dataset.value));
    });
    ratingForm.addEventListener('mouseleave', () => {
      applyStars(ratingForm, Number(ratingForm.dataset.value || 0));
    });
    ratingForm.addEventListener('click', (e) => {
      const btn = e.target.closest('.star'); if (!btn) return;
      const val = Number(btn.dataset.value);
      ratingForm.dataset.value = String(val);
      applyStars(ratingForm, val);
    });
  }

  const getOpiniones = () => {
    try { return JSON.parse(localStorage.getItem(OP_KEY) || '[]'); }
    catch { return []; }
  };
  const saveOpiniones = (arr) => localStorage.setItem(OP_KEY, JSON.stringify(arr));

  function projectTitle(pid) {
    const el = document.querySelector(`.project-card[data-project-id="${pid}"]`);
    return el?.dataset.title || pid || 'Proyecto';
  }
  function initialsFromName(name) {
    if (!name) return '🙂';
    const parts = name.trim().split(/\s+/).slice(0,2);
    const init = parts.map(p => p?.[0]?.toUpperCase() || '').join('');
    return init || '🙂';
  }
  function makeAvatarEl(name, avatarUrl) {
    const wrap = document.createElement('div');
    wrap.className = 'w-10 h-10 rounded-full overflow-hidden bg-orange-100 text-orange-700 flex items-center justify-center font-semibold shrink-0';
    if (avatarUrl) {
      const img = document.createElement('img');
      img.src = avatarUrl; img.alt = name ? `Foto de ${name}` : 'Foto de perfil';
      img.className = 'w-full h-full object-cover'; img.referrerPolicy = 'no-referrer';
      img.addEventListener('error', () => { wrap.textContent = initialsFromName(name); });
      wrap.appendChild(img);
    } else {
      wrap.textContent = initialsFromName(name);
    }
    return wrap;
  }
  function setSubmitLabel(editing) {
    const btn = form?.querySelector('button[type="submit"]');
    if (btn) btn.textContent = editing ? 'Guardar cambios' : 'Guardar';
  }
  function beginEdit(op) {
    if (!form) return;
    const sel = document.getElementById('opinion-project'); if (sel) sel.value = op.project;
    const nameEl = document.getElementById('opinion-name'); if (nameEl) nameEl.value = op.name || '';
    const avatarEl = document.getElementById('opinion-avatar'); if (avatarEl) avatarEl.value = op.avatar || '';
    const textEl = document.getElementById('opinion-text'); if (textEl) textEl.value = op.text || '';
    if (ratingForm) { ratingForm.dataset.value = String(op.rating || 0); applyStars(ratingForm, Number(op.rating || 0)); }
    editingId = op.ts; setSubmitLabel(true);
    scrollToSection('opiniones', 0);  // te lleva al form suavemente
    textEl?.focus();
  }
  function deleteOpinion(ts) {
    const arr = getOpiniones().filter(o => o.ts !== ts);
    saveOpiniones(arr);
    if (editingId === ts) {
      editingId = null; setSubmitLabel(false); form?.reset();
      if (ratingForm) { ratingForm.dataset.value = '0'; applyStars(ratingForm, 0); }
    }
    renderOpiniones();
  }
  function renderOpiniones() {
    if (!list) return;
    const data = getOpiniones().slice().reverse();
    list.innerHTML = '';
    if (data.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'p-4 border rounded-lg bg-white hover-card';
      empty.textContent = 'Aún no hay opiniones. ¡Sé la primera en opinar! 🙂';
      list.appendChild(empty); return;
    }
    for (const op of data) {
      const card = document.createElement('div');
      card.className = 'p-4 border rounded-lg bg-white hover-card';

      const top = document.createElement('div'); top.className = 'flex items-start gap-3';
      const avatar = makeAvatarEl(op.name, op.avatar);
      const body = document.createElement('div'); body.className = 'flex-1';

      const head = document.createElement('div'); head.className = 'flex items-center justify-between mb-1';
      const titleEl = document.createElement('div'); titleEl.className = 'font-semibold'; titleEl.textContent = projectTitle(op.project);
      const starsEl = document.createElement('div'); starsEl.className = 'text-orange-500';
      const rating = Number(op.rating || 0); starsEl.textContent = '★'.repeat(rating) + '☆'.repeat(5 - rating);

      head.appendChild(titleEl); head.appendChild(starsEl);

      const meta = document.createElement('div'); meta.className = 'text-xs text-gray-500 mb-2';
      const name = (op.name && op.name.trim()) ? op.name.trim() : 'Anónimo';
      meta.textContent = `${new Date(op.ts).toLocaleDateString()} — ${name}`;

      const text = document.createElement('p'); text.className = 'text-gray-800 whitespace-pre-line'; text.textContent = op.text || '';

      const actions = document.createElement('div'); actions.className = 'mt-3 flex gap-4 text-xs';
      const btnEdit = document.createElement('button'); btnEdit.type = 'button'; btnEdit.className = 'text-orange-600 hover:underline'; btnEdit.textContent = 'Editar';
      btnEdit.addEventListener('click', () => beginEdit(op));
      const btnDel = document.createElement('button'); btnDel.type = 'button'; btnDel.className = 'text-gray-500 hover:text-red-600'; btnDel.textContent = 'Eliminar';
      btnDel.addEventListener('click', () => deleteOpinion(op.ts));

      actions.appendChild(btnEdit); actions.appendChild(btnDel);
      body.appendChild(head); body.appendChild(meta); body.appendChild(text); body.appendChild(actions);
      top.appendChild(avatar); top.appendChild(body); card.appendChild(top); list.appendChild(card);
    }
  }
  renderOpiniones();

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const project = document.getElementById('opinion-project')?.value;
    const name = document.getElementById('opinion-name')?.value || '';
    const avatar = document.getElementById('opinion-avatar')?.value?.trim() || '';
    const text = document.getElementById('opinion-text')?.value?.trim();
    const rating = Number(ratingForm?.dataset.value || 0);
    if (!text) return;

    const arr = getOpiniones();
    if (editingId) {
      const idx = arr.findIndex(o => o.ts === editingId);
      if (idx !== -1) arr[idx] = { ...arr[idx], project, name, avatar, text, rating };
      editingId = null; setSubmitLabel(false);
    } else {
      arr.push({ project, name, avatar, text, rating, ts: Date.now() });
    }
    saveOpiniones(arr); form.reset();
    if (ratingForm) { ratingForm.dataset.value = '0'; applyStars(ratingForm, 0); }
    renderOpiniones();
  });

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

  // ====== Utilidades admin por consola ======
  window.Opiniones = {
    get: () => getOpiniones(),
    clear: () => { localStorage.removeItem(OP_KEY); renderOpiniones(); },
    count: () => getOpiniones().length,
    clearRatings: () => {
      Object.keys(localStorage).forEach(k => { if (k.startsWith('rating:')) localStorage.removeItem(k); });
    },
    clearAll: () => {
      window.Opiniones.clear();
      window.Opiniones.clearRatings();
    }
  };
});
