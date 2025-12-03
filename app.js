let membres=["ASSABOU Fadil Cocobe "];
let data={};
const passwordAdmin="1234";

function render(){
  const container=document.getElementById("members");
  container.innerHTML="";
  membres.forEach((nom,i)=>{
    const statut=data[nom]?data[nom].statut:"Aucun";
    const heure=data[nom]?data[nom].heure:"—";
    const card=document.createElement("div");
    card.className="card";
    if(statut==="Présent") card.classList.add("present");
    else if(statut==="Absent") card.classList.add("absent");
    else if(statut==="Permission") card.classList.add("permission");

    card.innerHTML=`
      <div>
        <h3>${i+1}. ${nom}</h3>
        <div class="meta">
          <span class="status ${statut.toLowerCase()}">${statut}</span>
          <div>Heure: <strong>${heure}</strong></div>
        </div>
      </div>
      <div class="controls">
        <button class="btn btn-present" onclick="setStatus('${nom}','Présent')">Présent</button>
        <button class="btn btn-absent" onclick="setStatus('${nom}','Absent')">Absent</button>
        <button class="btn btn-permission" onclick="setStatus('${nom}','Permission')">Permission</button>
      </div>
    `;
    container.appendChild(card);
  });
}
window.render=render;
render();

function setStatus(nom,statut){
  const pwd=document.getElementById("password").value;
  if(pwd!==passwordAdmin){alert("Mot de passe incorrect !");return;}
  data[nom]={statut,heure:new Date().toLocaleTimeString()};
  render();
}

document.getElementById("downloadBtn").addEventListener("click",()=>{
  const headers=["Nom","Statut","Heure"];
  const rows=membres.map(nom=>{
    const d=data[nom]||{statut:"Aucun",heure:""};
    return [nom,d.statut,d.heure];
  });
  const csv=[headers,...rows].map(r=>r.join(",")).join("\r\n");
  const blob=new Blob([csv],{type:"text/csv"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="presence.csv";
  a.click();
});

document.getElementById("addMember").addEventListener("click",()=>document.getElementById("modalAdd").classList.remove("hidden"));
document.getElementById("cancelNew").addEventListener("click",()=>document.getElementById("modalAdd").classList.add("hidden"));
document.getElementById("saveNew").addEventListener("click",()=>{
  const name=document.getElementById("newName").value.trim();
  if(!name)return alert("Nom vide !");
  membres.push(name);
  document.getElementById("modalAdd").classList.add("hidden");
  render();
});
document.getElementById("resetData").addEventListener("click",()=>{
  if(confirm("Réinitialiser la journée ?")){data={};render();}
});
document.getElementById("themeBtn").addEventListener("click",()=>{
  const current=document.documentElement.getAttribute("data-theme");
  if(current==="dark"){document.documentElement.removeAttribute("data-theme");}
  else{document.documentElement.setAttribute("data-theme","dark");}
});
