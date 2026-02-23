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
  // ---------- Remove injected "Top Spenders" banner aggressively ----------
(function removeInjectedHeaders() {
    const KEYWORDS = [
      "top spen",      // covers "top spenders"
      "semana actual",
      "top spenders",
      "top spender",
      "top spend",
      "top winners",
      "top spenders:",
      "topspenders"
    ].map(s => s.toLowerCase());
  
    // decide how many ancestor levels to hide (1..5). 3 is safe for most UIs.
    const MAX_ANCESTOR_LEVELS = 3;
  
    // helper: given a node, hide its ancestor up to levels
    function hideAncestor(node) {
      if (!node) return false;
      let el = node.nodeType === 1 ? node : node.parentElement;
      for (let i = 0; i < MAX_ANCESTOR_LEVELS && el; i++) {
        // skip hiding <body> or <html>
        if (el === document.body || el === document.documentElement) break;
        // if element already hidden skip
        if (el.dataset && el.dataset.__removed_banner === "1") return true;
        el.style.transition = "none";
        el.style.display = "none";
        if (el.dataset) el.dataset.__removed_banner = "1";
        console.log("[LB-HIDE] hidden ancestor:", el, "via child text node");
        return true;
      }
      return false;
    }
  
    // check a single text node / element for matches
    function checkNodeForKeywords(node) {
      try {
        const text = (node.textContent || "").trim().toLowerCase();
        if (!text) return false;
        // skip extremely long text blocks (perf)
        if (text.length > 4000) return false;
        for (const kw of KEYWORDS) {
          if (text.includes(kw)) {
            // Prefer to hide a nearby element: find nearest element ancestor with height
            let target = node.nodeType === 1 ? node : node.parentElement;
            // walk up a bit to find an element that looks like a header/container
            for (let j = 0; j < 4 && target; j++) {
              const rect = (target.getBoundingClientRect && target.getBoundingClientRect()) || {};
              const area = (rect.width || 0) * (rect.height || 0);
              if (area > 100 || target.tagName.toLowerCase().match(/h|div|header|section/)) break;
              target = target.parentElement;
            }
            // hide the chosen ancestor chain
            if (target) {
              // hide target first; if not enough, hide its parent a bit higher
              target.style.display = "none";
              if (target.dataset) target.dataset.__removed_banner = "1";
              console.log("[LB-HIDE] Hidden element matching keyword:", kw, target);
              return true;
            } else {
              // fallback: hide direct ancestor chain
              hideAncestor(node);
              return true;
            }
          }
        }
      } catch (e) {
        // ignore errors on weird nodes
        console.error("[LB-HIDE] checkNodeForKeywords error", e);
      }
      return false;
    }
  
    // scan the document for any small text-containing nodes quickly
    function scanAndRemove() {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          // filter out whitespace-only and script/template/style text
          if (!node || !node.parentElement) return NodeFilter.FILTER_REJECT;
          const tag = node.parentElement.tagName.toLowerCase();
          if (["script", "style", "noscript", "template"].includes(tag)) return NodeFilter.FILTER_REJECT;
          const txt = node.textContent.trim();
          if (!txt) return NodeFilter.FILTER_REJECT;
          if (txt.length > 2000) return NodeFilter.FILTER_REJECT; // avoid huge blocks
          return NodeFilter.FILTER_ACCEPT;
        }
      });
  
      let removed = 0;
      let node;
      while (walker.nextNode()) {
        node = walker.currentNode;
        if (checkNodeForKeywords(node)) removed++;
      }
      if (removed) console.log(`[LB-SCAN] removed ${removed} matching nodes`);
      return removed;
    }
  
    // Run initial scan (after short idle to let initial scripts load)
    setTimeout(() => {
      try { scanAndRemove(); } catch(e){ console.error(e); }
    }, 400);
  
    // Also run periodically a few times in the first 10s (covers widgets that load slightly later)
    const intervals = [1000, 2500, 4500, 8000];
    intervals.forEach(ms => setTimeout(() => { try { scanAndRemove(); } catch(e){} }, ms));
  
    // MutationObserver to catch late injections — runs indefinitely
    const observer = new MutationObserver((mutations) => {
      let count = 0;
      for (const m of mutations) {
        // check added nodes quickly:
        for (const n of m.addedNodes || []) {
          // If added node is element, check its subtree for keywords
          if (n.nodeType === 1) {
            // quick text check
            const txt = (n.textContent || "").toLowerCase();
            for (const kw of KEYWORDS) {
              if (txt.includes(kw)) {
                // hide the node (prefer its container)
                try {
                  n.style.display = "none";
                  if (n.dataset) n.dataset.__removed_banner = "1";
                  console.log("[LB-OBSERVE] Hidden added node containing keyword:", kw, n);
                  count++;
                  break;
                } catch (e){
                  console.error(e);
                }
              }
            }
          } else if (n.nodeType === 3) { // text node added
            if (checkNodeForKeywords(n)) count++;
          }
        }
        // also check if attribute changes introduced text
        if (m.type === "characterData" || m.type === "subtree") {
          // do a small scan in the changed subtree root
          try { scanAndRemove(); } catch(e){ console.error(e); }
        }
      }
      if (count) console.log(`[LB-OBSERVE] hid ${count} nodes from mutation observer`);
    });
  
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  
    // Small helper exposed for debugging in console
    window.__leaderboard_remove_banner = {
      scan: scanAndRemove,
      keywords: KEYWORDS,
      hideAncestor,
      stopObserver: () => { observer.disconnect(); console.log("Observer stopped"); },
      startObserver: () => { observer.observe(document.body, { childList: true, subtree: true, characterData: true }); console.log("Observer started"); }
    };
  
    console.log("[LB] banner removal installed — running scans and observer (check console for logs).");
  })();
  