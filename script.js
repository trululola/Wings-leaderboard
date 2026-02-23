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
// ------------- REMOVE "TOP SPENDERS" BANNER (robusto) -------------
(function installBannerRemover(){
    const KEYWORDS = [/top spen/i, /top spender/i, /semana actual/i, /top spend/i];
  
    function matchesKeyword(text){
      if(!text) return false;
      const low = text.toLowerCase();
      return KEYWORDS.some(rx => rx.test(low));
    }
  
    function scanAndRemove(){
      let removed = 0;
      document.querySelectorAll("body *").forEach(el=>{
        try{
          const txt = (el.innerText || "").trim();
          if(!txt) return;
          if(matchesKeyword(txt)){
            // intenta eliminar el ancestro apropiado (no solo la etiqueta interna)
            let node = el;
            // sube hasta encontrar un nodo de tamaño razonable o body
            for(let i=0;i<4 && node.parentElement; i++){
              if(node.getBoundingClientRect().width > 40 && node.getBoundingClientRect().height > 8) break;
              node = node.parentElement;
            }
            node.remove();
            removed++;
          }
        }catch(e){}
      });
      if(removed) console.log("[LB-REMOVER] removed", removed, "elements");
    }
  
    // run once at load
    window.addEventListener('load', ()=> setTimeout(scanAndRemove, 300));
  
    // guardamos referencia para debug
    window.__lb_remove_topspenders = { scan: scanAndRemove };
  
    // observe DOM changes (in case script injects later)
    const obs = new MutationObserver((mut)=>{
      // avoid doing heavy scan on every single mutation; run debounced
      if(window.__lb_remove_banner_timeout) clearTimeout(window.__lb_remove_banner_timeout);
      window.__lb_remove_banner_timeout = setTimeout(()=>{ scanAndRemove(); }, 180);
    });
    obs.observe(document.documentElement || document.body, { childList:true, subtree:true });
    window.__lb_remove_topspenders.observer = obs;
  })();
  