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
// ======= FULLSCREEN + DEBUG (robusto) =======
(function(){
    function log(...args){ console.log('[LB-FS]', ...args); }
  
    if(location.protocol === 'file:'){
      console.warn('[LB-FS] Page opened via file:// — fullscreen may be blocked. Serve locally (python -m http.server) or use GitHub Pages.');
    }
  
    async function enterFullscreen(target = document.documentElement){
      try{
        if(document.fullscreenElement){
          log('already fullscreen');
          return;
        }
        log('requestFullscreen on', target);
        await (target.requestFullscreen ? target.requestFullscreen() : Promise.reject(new Error('requestFullscreen not supported')));
        log('fullscreen ok');
      }catch(err){
        console.error('[LB-FS] enter error', err);
        // show a tiny on-screen message to the user
        if(!document.getElementById('lb-fs-err')){
          const msg = document.createElement('div');
          msg.id = 'lb-fs-err';
          msg.textContent = 'Fullscreen blocked — mira la consola.';
          Object.assign(msg.style, { position:'fixed', left:12, top:12, zIndex:999999, background:'rgba(0,0,0,.7)', color:'#fff', padding:'8px 10px', borderRadius:6 });
          document.body.appendChild(msg);
          setTimeout(()=>msg.remove(), 5000);
        }
      }
    }
  
    async function exitFullscreen(){
      try{ if(!document.fullscreenElement) return; await document.exitFullscreen(); }catch(e){ console.error('[LB-FS] exit error', e); }
    }
  
    async function toggle(){
      if(document.fullscreenElement) await exitFullscreen();
      else await enterFullscreen();
    }
  
    // Use capture:true so elements that call stopPropagation() won't block us
    document.addEventListener('dblclick', async (ev) => {
      log('dblclick captured target=', ev.target);
      await toggle();
    }, { capture: true, passive: true });
  
    // also attach to window as backup
    window.addEventListener('dblclick', async (ev) => {
      log('window dblclick target=', ev.target);
      await toggle();
    }, { passive: true });
  
    // Fallback button for manual test (always visible)
    const fsButtonId = 'lb-fullscreen-btn';
    if(!document.getElementById(fsButtonId)){
      const btn = document.createElement('button');
      btn.id = fsButtonId;
      btn.textContent = 'FULLSCREEN';
      Object.assign(btn.style, {
        position: 'fixed', right: '12px', bottom: '12px', zIndex: 999999,
        padding: '8px 12px', borderRadius: '8px', border: 'none',
        background: 'rgba(0,0,0,0.6)', color: '#fff', fontWeight: 700, cursor: 'pointer'
      });
      btn.title = 'Click para fullscreen (fallback)';
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        log('fs button click');
        await toggle();
      });
      document.body.appendChild(btn);
    }
  
    // Add small style to hide cursor when fullscreen (optional)
    const styleId = 'lb-fs-style';
    if(!document.getElementById(styleId)){
      const s = document.createElement('style'); s.id = styleId;
      s.textContent = `.lb-fullscreen { cursor: none !important } #${fsButtonId} { transition: opacity .2s }`;
      document.head.appendChild(s);
    }
    document.addEventListener('fullscreenchange', ()=> {
      if(document.fullscreenElement) document.documentElement.classList.add('lb-fullscreen');
      else document.documentElement.classList.remove('lb-fullscreen');
    });
  
    log('Fullscreen helper installed — double-click or press the FULLSCREEN button.');
  })();
  