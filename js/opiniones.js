/* js/opiniones.js
   Maneja Opiniones en un archivo separado.
   - Si configuras SUPABASE_URL/ANON_KEY -> DB real
   - Si no, funciona con localStorage
*/
(function () {
  const CONFIG = {
    SUPABASE_URL: "",       // <- pega aquí tu Project URL de Supabase (opcional)
    SUPABASE_ANON_KEY: "",  // <- pega aquí tu anon public key (opcional)
  };

  const OP_KEY = "opiniones";
  let sb = null; // cliente supabase (si hay config)

  // ===== Utilidades base =====
  const $ = (s, r = document) => r.querySelector(s);
  const $all = (s, r = document) => Array.from(r.querySelectorAll(s));

  function lsGet() { try { return JSON.parse(localStorage.getItem(OP_KEY) || "[]"); } catch { return []; } }
  function lsSet(arr) { localStorage.setItem(OP_KEY, JSON.stringify(arr)); }

  function projectTitle(pid) {
    const el = document.querySelector(`.project-card[data-project-id="${pid}"]`);
    return el?.dataset.title || pid;
  }

  function applyStars(container, value) {
    if (!container) return;
    $all(".star", container).forEach(st => {
      const v = Number(st.dataset.value);
      st.classList.toggle("active", v <= value);
    });
  }

  async function ensureSupabase() {
    if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY) return null;
    if (!window.supabase) {
      await new Promise((res, rej) => {
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.47.10/dist/umd/supabase.js";
        s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
    }
    return window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
  }

  // ===== Acceso a datos =====
  async function dbFetch(limit = 200) {
    if (!sb) return lsGet().slice(-limit).reverse();
    const { data, error } = await sb.from("opiniones")
      .select("project,name,text,rating,ts,created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) { console.warn("[opiniones] fetch error:", error); return []; }
    return data;
  }

  async function dbInsert(op) {
    if (!sb) { const arr = lsGet(); arr.push(op); lsSet(arr); return { ok: true }; }
    const { error } = await sb.from("opiniones").insert(op);
    if (error) { console.warn("[opiniones] insert error:", error); return { ok: false, error }; }
    return { ok: true };
  }

  // ===== Render =====
  async function renderOpiniones() {
    const list = $("#opiniones-list"); if (!list) return;
    list.innerHTML = '<div class="text-sm text-gray-400">Cargando opiniones…</div>';
    const data = await dbFetch(200);
    if (!data.length) {
      list.innerHTML = '<div class="p-4 border rounded-lg bg-white hover-card">Aún no hay opiniones. ¡Sé la primera en opinar! 🙂</div>';
      return;
    }
    list.innerHTML = "";
    for (const op of data) {
      const card = document.createElement("div");
      card.className = "p-4 border rounded-lg bg-white hover-card";
      const stars = "★".repeat(op.rating || 0) + "☆".repeat(5 - (op.rating || 0));
      const name = op.name?.trim() ? op.name.trim() : "Anónimo";
      const fecha = op.created_at ? new Date(op.created_at)
                   : (op.ts ? new Date(op.ts) : new Date());
      card.innerHTML = `
        <div class="flex items-center justify-between mb-1">
          <div class="font-semibold">${projectTitle(op.project)}</div>
          <div class="text-orange-500">${stars}</div>
        </div>
        <div class="text-xs text-gray-500 mb-2">${fecha.toLocaleDateString()}</div>
        <p class="text-gray-800 whitespace-pre-line">${op.text}</p>
        <div class="text-xs text-gray-500 mt-2">— ${name}</div>
      `;
      list.appendChild(card);
    }
  }

  // ===== Formulario =====
  function initForm() {
    const form = $("#opinion-form");
    const ratingForm = $("#opinion-rating");
    if (!form) return;

    // Estrellas del form
    if (ratingForm) {
      ratingForm.addEventListener("mouseover", (e) => {
        const btn = e.target.closest(".star"); if (!btn) return;
        applyStars(ratingForm, Number(btn.dataset.value));
      });
      ratingForm.addEventListener("mouseleave", () => {
        applyStars(ratingForm, Number(ratingForm.dataset.value || 0));
      });
      ratingForm.addEventListener("click", (e) => {
        const btn = e.target.closest(".star"); if (!btn) return;
        const val = Number(btn.dataset.value);
        ratingForm.dataset.value = String(val);
        applyStars(ratingForm, val);
      });
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const project = $("#opinion-project").value;
      const name = $("#opinion-name").value;
      const text = $("#opinion-text").value.trim();
      const rating = Number($("#opinion-rating")?.dataset.value || 0);
      if (!text) return;

      const op = { project, name, text, rating, ts: Date.now() };
      const res = await dbInsert(op);
      if (res.ok) {
        form.reset();
        if (ratingForm) { ratingForm.dataset.value = "0"; applyStars(ratingForm, 0); }
        await renderOpiniones();
      } else {
        alert("No se pudo guardar. Intenta de nuevo.");
      }
    });
  }

  // ===== API pública =====
  async function init(options = {}) {
    // permitir config por parámetro si quieres
    if (options.supabaseUrl) CONFIG.SUPABASE_URL = options.supabaseUrl;
    if (options.supabaseAnonKey) CONFIG.SUPABASE_ANON_KEY = options.supabaseAnonKey;

    try { sb = await ensureSupabase(); } catch (e) { console.warn("Supabase no cargó:", e); sb = null; }
    initForm();
    renderOpiniones();
  }

  // Exponer en window
  window.Opiniones = { init, render: renderOpiniones };
})();
// --- PROMEDIO DE ESTRELLAS POR PROYECTO (basado en opiniones guardadas) ---
function avgForProject(pid) {
  const all = getOpiniones();
  const vals = all
    .filter(op => op.project === pid && Number(op.rating) > 0)
    .map(op => Number(op.rating));
  if (vals.length === 0) return null;
  const sum = vals.reduce((a,b)=>a+b,0);
  return sum / vals.length;
}

function currentDisplayRating(pid) {
  const avg = avgForProject(pid);
  if (avg !== null) return Math.round(avg); // redondeo al entero más cercano
  // si no hay opiniones, muestro tu rating local (el que marcas al tocar las estrellas del card)
  return Number(localStorage.getItem(ratingKey(pid)) || 0);
}

function updateProjectAverages() {
  document.querySelectorAll('.project-card').forEach(card => {
    const pid = card.dataset.projectId;
    const stars = card.querySelector('.rating-stars');
    if (!stars) return;
    const avg = avgForProject(pid);
    const val = currentDisplayRating(pid);
    applyStars(stars, val);
    if (avg !== null) {
      const count = getOpiniones().filter(op => op.project === pid && Number(op.rating) > 0).length;
      stars.setAttribute('title', `${avg.toFixed(1)} / 5 (${count} opiniones)`);
    } else {
      stars.removeAttribute('title');
    }
  });
}
