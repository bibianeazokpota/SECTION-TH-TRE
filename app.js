// ===============================
// HASH SHA-256
// ===============================
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// ===============================
// MOT DE PASSE ADMIN / SUPER ADMIN
// ===============================
const DEFAULT_ADMIN = "1234";
const DEFAULT_SUPER = "0000";

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
    const admin = localStorage.getItem("ADMIN_HASH");
    const superAdmin = localStorage.getItem("SUPER_HASH");
    const hash = await sha256(password);
    if (hash === superAdmin) return "super_admin";
    if (hash === admin) return "admin";
    return "refusé";
}

// ===============================
// DONNÉES GLOBALES
// ===============================
let membres = ["ASSABOU Fadil Cocobe"];
let currentPage = Number(localStorage.getItem("currentPage")) || 1;
let pagesData = JSON.parse(localStorage.getItem("pagesData") || "{}");
if (!pagesData[currentPage]) pagesData[currentPage] = {};
let data = pagesData[currentPage];

function savePages() {
    localStorage.setItem("pagesData", JSON.stringify(pagesData));
    localStorage.setItem("currentPage", currentPage);
}

// ===============================
// GESTION DES PAGES (CAHIER)
// ===============================
function reloadPage() {
    if (!pagesData[currentPage]) pagesData[currentPage] = {};
    data = pagesData[currentPage];
    document.getElementById("pageLabel").innerText = "Page " + currentPage;
    render();
    loadPages();
}

function changePage(step) {
    currentPage += step;
    if (currentPage < 1) currentPage = 1;
    if (!pagesData[currentPage]) pagesData[currentPage] = {};
    savePages();
    reloadPage();
}

function loadPages() {
    const selector = document.getElementById("pageSelector");
    const pages = Object.keys(pagesData).map(n => Number(n)).sort((a,b)=>a-b);
    selector.innerHTML = "";
    pages.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p;
        opt.textContent = "Page " + p;
        if (p === currentPage) opt.selected = true;
        selector.appendChild(opt);
    });
}

function jumpToPage(page) {
    currentPage = Number(page);
    if (!pagesData[currentPage]) pagesData[currentPage] = {};
    savePages();
    reloadPage();
}

// ===============================
// CHANGER CODE ADMIN
// ===============================
async function saveSecretCode() {
    const newCode = document.getElementById("secretCode").value.trim();
    if (!newCode) return alert("Le code ne peut pas être vide !");
    localStorage.setItem("ADMIN_HASH", await sha256(newCode));
    alert("✔ Nouveau code administrateur enregistré !");
}

// ===============================
// AFFICHER / MASQUER MOT DE PASSE
// ===============================
function toggleVisibility(id) {
    const field = document.getElementById(id);
    field.type = field.type === "password" ? "text" : "password";
}

// ===============================
// RENDER
// ===============================
function render() {
    const container = document.getElementById("members");
    container.innerHTML = "";
    membres.forEach((nom,i)=>{
        const statut = data[nom]?.statut || "Aucun";
        const heure = data[nom]?.heure || "—";
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
        </div>
        `;
        container.appendChild(card);
    });
}

// ===============================
// SET STATUS
// ===============================
async function setStatus(nom, statut) {
    const pwd = document.getElementById("password").value;
    const role = await login(pwd);
    if (role==="refusé") return alert("❌ Mot de passe incorrect !");
    pagesData[currentPage][nom] = { statut, heure: new Date().toLocaleTimeString() };
    savePages();
    reloadPage();
}

// ===============================
// EXPORT CSV
// ===============================
document.getElementById("downloadBtn").addEventListener("click",()=>{
    const headers = ["Nom","Statut","Heure"];
    const rows = membres.map(nom=>{
        const d = data[nom] || {statut:"Aucun",heure:""};
        return [nom,d.statut,d.heure];
    });
    const csv = [headers,...rows].map(r=>r.join(",")).join("\r\n");
    const blob = new Blob([csv],{type:"text/csv"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "presence_page_"+currentPage+".csv";
    a.click();
});

// ===============================
// AJOUT MEMBRE
// ===============================
document.getElementById("addMember").addEventListener("click",()=>{document.getElementById("modalAdd").classList.remove("hidden");});
document.getElementById("cancelNew").addEventListener("click",()=>{document.getElementById("modalAdd").classList.add("hidden");});
document.getElementById("saveNew").addEventListener("click",()=>{
    const name = document.getElementById("newName").value.trim();
    if(!name) return alert("Nom vide !");
    membres.push(name);
    document.getElementById("modalAdd").classList.add("hidden");
    render();
});

// ===============================
// RESET PAGE
// ===============================
document.getElementById("resetData").addEventListener("click",()=>{
    if(confirm("Voulez-vous vraiment réinitialiser cette page ?")){
        pagesData[currentPage]={};
        savePages();
        reloadPage();
    }
});

// ===============================
// MODE SOMBRE
// ===============================
document.getElementById("themeBtn").addEventListener("click",()=>{
    const current = document.documentElement.getAttribute("data-theme");
    document.documentElement.setAttribute("data-theme", current==="dark"?"":"dark");
});

// ===============================
// PREMIER AFFICHAGE
// ===============================
reloadPage();
