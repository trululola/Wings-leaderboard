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
// ===== FULLSCREEN DOBLE CLICK =====
document.addEventListener("dblclick", () => {

    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  
  });
  