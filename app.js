// ===============================
// HASH SHA-256
// ===============================
async function sha256(message) {
  const msg = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msg);
  const bytes = Array.from(new Uint8Array(hashBuffer));
  return bytes.map(b => b.toString(16).padStart(2, "0")).join("");
}

// ===============================
// MOT DE PASSE ADMIN / SUPER ADMIN
// ===============================
const DEFAULT_ADMIN = "1234";
const DEFAULT_SUPER = "0000";

// Crée les codes par défaut seulement 1 fois
async function loadHashes() {
  if (!localStorage.getItem("ADMIN_HASH")) {
    localStorage.setItem("ADMIN_HASH", await sha256(DEFAULT_ADMIN));
  }
  if (!localStorage.getItem("SUPER_HASH")) {
    localStorage.setItem("SUPER_HASH", await sha256(DEFAULT_SUPER));
  }
}
loadHashes();

async function login(password) {
  const hash = await sha256(password);
  if (hash === localStorage.getItem("SUPER_HASH")) return "super_admin";
  if (hash === localStorage.getItem("ADMIN_HASH")) return "admin";
  return "refusé";
}

// ===============================
// DONNÉES GLOBALES
// ===============================
let membres = ["ASSABOU Fadil Cocobe"];

let currentPage = Number(localStorage.getItem("currentPage")) || 1;
let pagesData = JSON.parse(localStorage.getItem("pagesData") || "{}");

// création automatique
if (!pagesData[currentPage]) pagesData[currentPage] = {};
let data = pagesData[currentPage];

function savePages() {
  localStorage.setItem("pagesData", JSON.stringify(pagesData));
  localStorage.setItem("currentPage", currentPage);
}

// ===============================
// PAGE SUIVANTE / PRÉCÉDENTE
// ===============================
function reloadPage() {
  if (!pagesData[currentPage]) pagesData[currentPage] = {};
  data = pagesData[currentPage];
  document.getElementById("pageLabel").innerText = "Page " + currentPage;
  render();
  loadPages();
}

function changePage(n) {
  currentPage += n;
  if (currentPage < 1) currentPage = 1;
  if (!pagesData[currentPage]) pagesData[currentPage] = {};
  savePages();
  reloadPage();
}

function loadPages() {
  const sel = document.getElementById("pageSelector");
  sel.innerHTML = "";
  Object.keys(pagesData)
    .map(Number)
    .sort((a,b)=>a-b)
    .forEach(p => {
      const option = document.createElement("option");
      option.value = p;
      option.textContent = "Page " + p;
      if (p === currentPage) option.selected = true;
      sel.appendChild(option);
    });
}

function jumpToPage(p) {
  currentPage = Number(p);
  if (!pagesData[currentPage]) pagesData[currentPage] = {};
  savePages();
  reloadPage();
}

// ===============================
// CHANGER CODE ADMIN
// ===============================
async function saveSecretCode() {
  const val = document.getElementById("secretCode").value.trim();
  if (!val) return alert("Le code ne peut pas être vide !");
  localStorage.setItem("ADMIN_HASH", await sha256(val));
  alert("✔ Code administrateur enregistré !");
}

// ===============================
// AFFICHER / MASQUER MOT DE PASSE
// ===============================
function toggleVisibility(id) {
  const input = document.getElementById(id);
  input.type = input.type === "password" ? "text" : "password";
}

// ===============================
// AFFICHAGE MEMBRES
// ===============================
function render() {
  const container = document.getElementById("members");
  container.innerHTML = "";

  membres.forEach((nom, i) => {
    const d = data[nom] || {};
    const statut = d.statut || "Aucun";
    const heure = d.heure || "—";

    const card = document.createElement("div");
    card.className = "card";
    if(statut==="Présent") card.classList.add("present");
    if(statut==="Absent") card.classList.add("absent");
    if(statut==="Permission") card.classList.add("permission");

    card.innerHTML = `
      <div>
        <h3>${i+1}. ${nom}</h3>
        <div class="meta">
          <span class="status ${statut.toLowerCase()}">${statut}</span>
          <div>Heure: <strong>${heure}</strong></div>
        </div>
      </div>
      <div class="controls">
        <button onclick="setStatus('${nom}','Présent')">Présent</button>
        <button onclick="setStatus('${nom}','Absent')">Absent</button>
        <button onclick="setStatus('${nom}','Permission')">Permission</button>
      </div>`;
    
    container.appendChild(card);
  });
}

// ===============================
// SET STATUS
// ===============================
async function setStatus(nom, statut) {
  const pwd = document.getElementById("password").value.trim();
  const role = await login(pwd);

  if (role === "refusé") return alert("❌ Mot de passe incorrect !");
  
  pagesData[currentPage][nom] = {
    statut,
    heure: new Date().toLocaleTimeString()
  };

  savePages();
  reloadPage();
}

// ===============================
// EXPORT CSV
// ===============================
document.getElementById("downloadBtn").addEventListener("click", () => {
  const headers = ["Nom","Statut","Heure"];
  
  const rows = membres.map(nom=>{
    const d = data[nom] || {};
    return [nom, d.statut || "Aucun", d.heure || ""];
  });

  const csv = [headers, ...rows].map(r=>r.join(",")).join("\r\n");
  const blob = new Blob([csv], {type:"text/csv"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "presence_page_" + currentPage + ".csv";
  a.click();
});

// ===============================
// AJOUT MEMBRE
// ===============================
document.getElementById("addMember").addEventListener("click",()=>{
  document.getElementById("modalAdd").classList.remove("hidden");
});

document.getElementById("cancelNew").addEventListener("click",()=>{
  document.getElementById("modalAdd").classList.add("hidden");
});

document.getElementById("saveNew").addEventListener("click",()=>{
  const n = document.getElementById("newName").value.trim();
  if (!n) return alert("Nom vide !");
  membres.push(n);
  document.getElementById("modalAdd").classList.add("hidden");
  render();
});

// ===============================
// RESET PAGE
// ===============================
document.getElementById("resetData").addEventListener("click",()=>{
  if (confirm("Réinitialiser cette page ? ")) {
    pagesData[currentPage] = {};
    savePages();
    reloadPage();
  }
});

// ===============================
// MODE SOMBRE
// ===============================
document.getElementById("themeBtn").addEventListener("click",()=>{
  const cur = document.documentElement.getAttribute("data-theme");
  document.documentElement.setAttribute("data-theme", cur==="dark" ? "" : "dark");
});

// ===============================
// LANCEMENT
// ===============================
reloadPage();
