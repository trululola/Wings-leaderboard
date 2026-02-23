const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTzNtqv5w4-BVu15h4JH4O1MLKD4LuSRlAVFDvKtpk-jccCeWlcIn7y9_2d9wQhFN1if8RUkjflG-RY/pub?output=csv";

async function loadLeaderboard() {
    try {
        const res = await fetch(CSV_URL);
        const text = await res.text();

        const rows = text.trim().split("\n").slice(1);

        const players = rows.map(r => {
            const [name, score] = r.split(",");
            return { name, score: Number(score.replace(/\./g,'')) };
        });

        players.sort((a,b)=> b.score - a.score);

        const container = document.getElementById("board");
        container.innerHTML = "";

        players.forEach((p,i)=>{
            container.innerHTML += `
                <div class="row">
                    <div class="rank">#${i+1}</div>
                    <div class="name">${p.name}</div>
                    <div class="score">${p.score.toLocaleString()}</div>
                </div>
            `;
        });

    } catch(err) {
        document.getElementById("board").innerHTML =
        "Error cargando hoja. Revisa el link CSV y que esté publicado.";
    }
}

loadLeaderboard();
setInterval(loadLeaderboard, 10000);
// ======= FULLSCREEN + DEBUG (pegar al final de script.js) =======

/*
  Requisitos:
  - Servir la página por HTTP(S) o localhost (no file://)
  - Abrir DevTools (F12) para ver logs si no funciona
*/

(function(){
    // URL friendly check
    const isFile = location.protocol === "file:";
    if (isFile) {
      console.warn("WARNING: página abierta con file:// — el fullscreen puede estar bloqueado. Sirve la página con Live Server o python -m http.server y prueba en http://localhost:5500");
    }
  
    // Debug helper
    function log(...args){ console.log("[LB-FS]", ...args); }
  
    // Try to request fullscreen on the element passed (default: document.documentElement)
    async function enterFullscreen(target = document.documentElement){
      try{
        if (!target) throw new Error("no target element");
        if (document.fullscreenElement) {
          log("Ya en fullscreen:", document.fullscreenElement);
          return;
        }
        log("Solicitando fullscreen para", target);
        await target.requestFullscreen();
        log("Fullscreen activado");
      }catch(err){
        console.error("[LB-FS] Error al pedir fullscreen:", err);
      }
    }
  
    async function exitFullscreen(){
      try{
        if (!document.fullscreenElement) {
          log("No hay fullscreen activo");
          return;
        }
        await document.exitFullscreen();
        log("Fullscreen salido");
      }catch(err){
        console.error("[LB-FS] Error al salir de fullscreen:", err);
      }
    }
  
    // Toggle
    async function toggleFullscreen(){
      if (document.fullscreenElement) await exitFullscreen();
      else await enterFullscreen();
    }
  
    // Attach dblclick to whole document (works on clicks anywhere)
    document.addEventListener("dblclick", async (ev) => {
      log("dblclick event fired (target):", ev.target);
      await toggleFullscreen();
    });
  
    // Fallback: add a small visible button (bottom-right) that force fullscreen on click.
    // Useful para debug y para usuarios que no consiguen el dblclick.
    const fsButtonId = "lb-fullscreen-btn";
    if (!document.getElementById(fsButtonId)){
      const btn = document.createElement("button");
      btn.id = fsButtonId;
      btn.textContent = "FULLSCREEN";
      Object.assign(btn.style, {
        position: "fixed",
        right: "12px",
        bottom: "12px",
        zIndex: 99999,
        padding: "8px 12px",
        borderRadius: "8px",
        border: "none",
        background: "rgba(0,0,0,0.55)",
        color: "#fff",
        fontWeight: 700,
        cursor: "pointer",
        boxShadow: "0 6px 18px rgba(0,0,0,0.4)"
      });
      btn.title = "Click para fullscreen (fallback). También funciona doble-click en la pantalla.";
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        log("Botón fullscreen click");
        await toggleFullscreen();
      });
      document.body.appendChild(btn);
    }
  
    // Optional: hide cursor when fullscreen
    document.addEventListener("fullscreenchange", () => {
      if (document.fullscreenElement) {
        document.documentElement.classList.add("lb-fullscreen");
        log("fullscreenchange: ON");
        // hide the button slightly (still clickable with mouse)
        const b = document.getElementById(fsButtonId);
        if (b) b.style.opacity = "0.5";
      } else {
        document.documentElement.classList.remove("lb-fullscreen");
        log("fullscreenchange: OFF");
        const b = document.getElementById(fsButtonId);
        if (b) b.style.opacity = "1";
      }
    });
  
    // Add CSS for lb-fullscreen to hide cursor (put this in CSS if you prefer)
    const styleId = "lb-fullscreen-style";
    if (!document.getElementById(styleId)){
      const s = document.createElement("style");
      s.id = styleId;
      s.textContent = `
        .lb-fullscreen { cursor: none !important; }
        #${fsButtonId} { transition: opacity .2s ease; }
      `;
      document.head.appendChild(s);
    }
  
    log("Fullscreen helper installed. dblclick anywhere or press the FULLSCREEN button.");
  })();
  