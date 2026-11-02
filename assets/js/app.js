const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const KEY="jdevhost.v2.servers", ACT="jdevhost.v2.activity";let servers=load(KEY,[]),activity=load(ACT,[]),selected=null,editing=null,activeTab="config";
function load(k,f){try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}}function save(){localStorage.setItem(KEY,JSON.stringify(servers));localStorage.setItem(ACT,JSON.stringify(activity));}
function esc(x){return String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function note(msg){activity.unshift({msg,time:new Date().toLocaleString("pt-BR")});activity=activity.slice(0,12);save();renderActivity()}
function renderActivity(){$("#activity").innerHTML=activity.length?activity.map(a=>'<div class="event"><i></i><span>'+esc(a.msg)+'<br><span class="muted">'+esc(a.time)+'</span></span></div>').join(""):'<div class="muted">Nenhuma atividade ainda.</div>'}
function gameCode(s){return s.game==="Minecraft"?"MC":s.game==="Terraria"?"TE":s.game==="Valheim"?"VH":"SRV"}
function totalMods(){return servers.reduce((n,s)=>n+(s.mods||[]).length,0)}
function card(s){return '<article class="server"><div class="servermain"><div class="gameicon">'+gameCode(s)+'</div><div><h3>'+esc(s.name)+'</h3><p>'+esc(s.game)+' · '+esc(s.version||"Versão não definida")+' · '+esc(s.loader)+'</p></div></div><div class="serveractions"><span class="pill">'+(s.mods||[]).length+' mods/plugins</span><button class="btn light" data-open="'+s.id+'">Gerenciar</button></div></article>'}
function empty(){return '<div class="empty"><div class="emptyicon">＋</div><h3>Nenhum servidor cadastrado</h3><p>Seu painel está vazio. Crie seu primeiro servidor para configurar versão, loader, memória, porta, mods e plugins.</p><button class="btn" data-create>＋ Criar primeiro servidor</button></div>'}
function render(){const html=servers.length?servers.map(card).join(""):empty();$("#homeServers").innerHTML=html;$("#allServers").innerHTML=html;$("#statTotal").textContent=servers.length;$("#statMods").textContent=totalMods();renderActivity();$$("[data-open]").forEach(b=>b.onclick=()=>openDetail(b.dataset.open));$$("[data-create]").forEach(b=>b.onclick=()=>openServerModal());renderGlobalMods()}
function showPage(p){const pages={home:"homePage",servers:"serversPage",detail:"detailPage",mods:"modsPage",infra:"infraPage",settings:"settingsPage"};Object.values(pages).forEach(id=>$("#"+id).classList.add("hidden"));if(p==="console"){ $("#homePage").classList.remove("hidden");$("#consoleLog").scrollIntoView({behavior:"smooth",block:"center"}) }else $("#"+pages[p]).classList.remove("hidden");$("#pageTitle").textContent=({home:"Visão geral",servers:"Servidores",detail:"Gerenciar servidor",mods:"Mods e plugins",infra:"Infraestrutura",settings:"Configurações"})[p];$$("[data-page]").forEach(b=>b.classList.toggle("active",b.dataset.page===p))}
$$("[data-page]").forEach(b=>b.onclick=()=>showPage(b.dataset.page));$("#seeServers").onclick=()=>showPage("servers");$("#newServer").onclick=()=>openServerModal();$("#newServer2").onclick=()=>openServerModal();
function openServerModal(id){editing=id||null;const s=id?servers.find(x=>x.id===id):null;$("#serverModalTitle").textContent=s?"Editar servidor":"Criar servidor";$("#sName").value=s?.name||"";$("#sGame").value=s?.game||"Minecraft";$("#sVersion").value=s?.version||"";$("#sLoader").value=s?.loader||"Vanilla";$("#sRam").value=s?.ram||2;$("#sPort").value=s?.port||25565;$("#sDescription").value=s?.description||"";$("#serverModal").classList.add("show")}
function closeModal(id){$("#"+id).classList.remove("show")}
$("#cancelServer").onclick=()=>closeModal("serverModal");$("#serverModal").onclick=e=>{if(e.target.id==="serverModal")closeModal("serverModal")};
$("#serverForm").onsubmit=e=>{e.preventDefault();const data={name:$("#sName").value.trim(),game:$("#sGame").value,version:$("#sVersion").value.trim(),loader:$("#sLoader").value,ram:Number($("#sRam").value),port:Number($("#sPort").value),description:$("#sDescription").value.trim()};if(editing){Object.assign(servers.find(x=>x.id===editing),data);note("Configurações de "+data.name+" atualizadas.")}else{servers.push({...data,id:crypto.randomUUID(),mods:[]});note("Servidor "+data.name+" cadastrado.")}save();render();closeModal("serverModal");if(editing){selected=editing;openDetail(selected)}else showPage("servers")};
function openDetail(id){selected=id;const s=servers.find(x=>x.id===id);if(!s)return;$("#detailName").textContent=s.name;$("#detailIcon").textContent=gameCode(s);$("#detailSub").textContent=s.game+" · "+(s.version||"Sem versão")+" · "+s.loader;$("#tabConfig").innerHTML='<div class="grid2"><div><div class="muted">Jogo</div><b>'+esc(s.game)+'</b></div><div><div class="muted">Versão</div><b>'+esc(s.version||"Não definida")+'</b></div><div><div class="muted">Loader</div><b>'+esc(s.loader)+'</b></div><div><div class="muted">Memória</div><b>'+s.ram+' GB</b></div><div><div class="muted">Porta</div><b>'+s.port+'</b></div><div><div class="muted">Mods / plugins</div><b>'+(s.mods||[]).length+'</b></div></div><p class="muted" style="margin-top:18px">'+esc(s.description||"Sem descrição.")+'</p><div style="display:flex;gap:8px;margin-top:15px"><button class="btn" disabled title="Conecte o agente Linux para iniciar">Iniciar servidor</button><button class="btn light" disabled>Parar</button></div><p class="muted">Ações de execução bloqueadas até conectar o agente.</p>';renderModsTab(s);renderDetailConsole();showPage("detail");$$("[data-tab]").forEach(b=>b.classList.toggle("active",b.dataset.tab===activeTab));setTab(activeTab)}
function setTab(t){activeTab=t;["config","mods","console"].forEach(x=>$("#tab"+x[0].toUpperCase()+x.slice(1)).classList.toggle("hidden",x!==t));$$("[data-tab]").forEach(b=>b.classList.toggle("active",b.dataset.tab===t))}
$$("[data-tab]").forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
$("#editServer").onclick=()=>openServerModal(selected);$("#deleteServer").onclick=()=>{const s=servers.find(x=>x.id===selected);if(!s||!confirm('Excluir "'+s.name+'" e os registros de mods associados?'))return;servers=servers.filter(x=>x.id!==selected);note("Servidor "+s.name+" removido.");save();render();showPage("servers")};
function renderModsTab(s){$("#tabMods").innerHTML='<div class="panelhead"><div><h2>Mods e plugins</h2><span class="muted">'+(s.mods||[]).length+' itens cadastrados</span></div><button class="btn" id="addMod">＋ Adicionar</button></div><div class="notice">Minecraft: use o mesmo loader e versões compatíveis entre servidor e mods. Paper, Purpur e Spigot usam plugins, não mods Forge/Fabric. A instalação no host depende do agente.</div>'+(s.mods?.length?s.mods.map(m=>'<div class="modrow"><div><div class="modname">'+esc(m.name)+'</div><div class="modmeta">'+esc(m.type)+' · '+esc(m.version||"versão não informada")+' · '+esc(m.loader||"compatibilidade não informada")+(m.fileName?' · '+esc(m.fileName):"")+'</div></div><button class="btn danger" data-removemod="'+m.id+'">Remover</button></div>').join(""):'<div class="empty"><div class="emptyicon">◇</div><h3>Nenhum mod ou plugin</h3><p>Adicione arquivos .jar e registre a versão e compatibilidade.</p></div>');$("#addMod").onclick=()=>openModModal();$$("[data-removemod]").forEach(b=>b.onclick=()=>removeMod(b.dataset.removemod))}
function renderGlobalMods(){const all=servers.flatMap(s=>(s.mods||[]).map(m=>({...m,serverName:s.name})));$("#modsGlobal").innerHTML=all.length?all.map(m=>'<div class="modrow"><div><div class="modname">'+esc(m.name)+'</div><div class="modmeta">'+esc(m.serverName)+' · '+esc(m.type)+' · '+esc(m.version||"sem versão")+'</div></div><span class="pill">'+esc(m.loader||"Sem loader")+'</span></div>').join(""):'<div class="empty"><div class="emptyicon">◇</div><h3>Sua biblioteca está vazia</h3><p>Crie um servidor e adicione mods ou plugins dentro da página de gerenciamento dele.</p><button class="btn" data-create>＋ Criar servidor</button></div>'}
function openModModal(){if(!selected)return;$("#modForm").reset();$("#modModal").classList.add("show")}$("#cancelMod").onclick=()=>closeModal("modModal");$("#modModal").onclick=e=>{if(e.target.id==="modModal")closeModal("modModal")};
$("#modForm").onsubmit=async e=>{e.preventDefault();const file=$("#mFile").files[0];let fileName="",fileSize=0;if(file){fileName=file.name;fileSize=file.size;try{await putFile(selected,file)}catch(err){alert("Não foi possível guardar o arquivo no navegador: "+err.message);return}}const s=servers.find(x=>x.id===selected);s.mods=s.mods||[];s.mods.push({id:crypto.randomUUID(),name:$("#mName").value.trim(),version:$("#mVersion").value.trim(),type:$("#mType").value,loader:$("#mLoader").value.trim(),url:$("#mUrl").value.trim(),fileName,fileSize});save();note("Item "+$("#mName").value.trim()+" adicionado à biblioteca de "+s.name+".");render();openDetail(selected);setTab("mods");closeModal("modModal")};
function removeMod(id){const s=servers.find(x=>x.id===selected);s.mods=s.mods.filter(m=>m.id!==id);save();note("Item removido da biblioteca de "+s.name+".");render();openDetail(selected);setTab("mods")}
function renderDetailConsole(){$("#detailConsole").innerHTML='<div><span class="dim">[AGENT]</span> Nenhum agente conectado.</div><div><span class="dim">[INFO]</span> Console real ficará disponível após configurar o agente.</div>'}
$("#consoleLog").insertAdjacentHTML("beforeend",'<div><span class="dim">[INFO]</span> Nenhum servidor cadastrado.</div>');
$("#clearData").onclick=()=>{if(!confirm("Apagar todos os servidores e dados locais deste painel?"))return;servers=[];activity=[];save();render();showPage("home")};
const DB="jdevhost-files";function openDB(){return new Promise((res,rej)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore("mods");r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}async function putFile(serverId,file){const db=await openDB();return new Promise((res,rej)=>{const tx=db.transaction("mods","readwrite");tx.objectStore("mods").put(file,serverId+":"+file.name);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)})}
render();showPage("home");
/* CurseForge — a chave da API fica exclusivamente no Cloudflare Worker. */
const CURSE_API="https://jdev-host-curseforge.joaoferreiraneto0711.workers.dev";
let curseIndex=0,curseTotal=0,curseLastQuery="";
const curseLoaderByServer={"Forge":"1","Fabric":"4","Quilt":"5","NeoForge":"6"};
function curseServerOptions(){
 const sel=$("#curseServer"); if(!sel)return;
 const current=sel.value;
 const minecraft=servers.filter(s=>s.game==="Minecraft");
 sel.innerHTML=minecraft.length?minecraft.map(s=>'<option value="'+esc(s.id)+'">'+esc(s.name)+'</option>').join(""):'<option value="">Nenhum servidor Minecraft cadastrado</option>';
 if(minecraft.some(s=>s.id===current))sel.value=current;
 const s=minecraft.find(x=>x.id===sel.value)||minecraft[0];
 if(s){$("#curseVersion").value=s.version||"";$("#curseLoader").value=curseLoaderByServer[s.loader]||"0";}
}
function curseStatus(message,error=false){const el=$("#curseStatus");el.textContent=message;el.classList.toggle("curse-error",error)}
function curseUrl(path,params={}){const u=new URL(CURSE_API+path);Object.entries(params).forEach(([k,v])=>{if(v!==""&&v!==null&&v!==undefined)u.searchParams.set(k,String(v))});return u.toString()}
async function curseFetch(path,params={}){
 const response=await fetch(curseUrl(path,params),{headers:{Accept:"application/json"}});
 let body;try{body=await response.json()}catch{throw new Error("Resposta inválida do serviço CurseForge.")}
 if(!response.ok)throw new Error(body.message||body.error||("Erro HTTP "+response.status));
 return body;
}
function curseFormatDownloads(n){return Number(n||0).toLocaleString("pt-BR")}
function curseRenderResults(items){
 const root=$("#curseResults");
 if(!items.length){root.innerHTML='<div class="empty"><h3>Nenhum mod encontrado</h3><p>Tente outro termo ou ajuste a versão e o modloader.</p></div>';return}
 root.innerHTML=items.map(m=>'<article class="curse-card"><div class="curse-modtop">'+(m.logo?.thumbnailUrl?'<img src="'+esc(m.logo.thumbnailUrl)+'" alt="" loading="lazy">':'<div class="curse-placeholder">CF</div>')+'<div class="curse-modinfo"><h4>'+esc(m.name)+'</h4><p>'+esc(m.authors?.[0]?.name||"Autor não informado")+' · '+curseFormatDownloads(m.downloadCount)+' downloads</p></div></div><p class="curse-summary">'+esc((m.summary||"Sem descrição disponível.").slice(0,220))+'</p><div class="curse-actions"><a href="'+(m.links?.websiteUrl||("https://www.curseforge.com/minecraft/mc-mods/"+encodeURIComponent(m.slug||"")))+'" target="_blank" rel="noopener noreferrer">Página oficial</a><button class="btn light" data-curse-files="'+m.id+'">Ver arquivos</button></div><div class="curse-files hidden" id="curseFiles-'+m.id+'"></div></article>').join("");
 root.querySelectorAll("[data-curse-files]").forEach(b=>b.onclick=()=>curseLoadFiles(b.dataset.curseFiles,b));
}
async function curseSearch(reset=true){
 const server=servers.find(s=>s.id===$("#curseServer").value);
 if(!server){curseStatus("Cadastre um servidor Minecraft para pesquisar mods.",true);return}
 if(reset)curseIndex=0;
 const params={gameId:432,classId:6,index:curseIndex,pageSize:12,sortField:2,sortOrder:"desc",searchFilter:$("#curseQuery").value.trim(),gameVersion:$("#curseVersion").value.trim(),modLoaderType:$("#curseLoader").value};
 if(!params.gameVersion)delete params.modLoaderType;
 curseLastQuery=JSON.stringify(params);
 curseStatus("Pesquisando mods no CurseForge...");
 $("#curseResults").innerHTML="";
 try{
  const body=await curseFetch("/mods/search",params);
  const items=body.data||[];
  curseTotal=body.pagination?.totalCount||0;
  curseRenderResults(items);
  const page=Math.floor(curseIndex/12)+1;
  $("#cursePage").textContent="Página "+page+" · "+curseTotal.toLocaleString("pt-BR")+" resultados";
  $("#cursePrev").disabled=curseIndex===0;
  $("#curseNext").disabled=curseIndex+12>=curseTotal||items.length<12;
  curseStatus(items.length+" mods encontrados. Escolha “Ver arquivos” para conferir a versão compatível.");
 }catch(err){curseStatus("Não foi possível pesquisar: "+err.message+" Confira se o segredo CURSEFORGE_API_KEY foi salvo no Worker.",true)}
}
async function curseLoadFiles(modId,button){
 const server=servers.find(s=>s.id===$("#curseServer").value);if(!server)return;
 const target=$("#curseFiles-"+modId);target.classList.remove("hidden");target.innerHTML='<span class="muted">Carregando arquivos compatíveis...</span>';button.disabled=true;
 const params={index:0,pageSize:20,gameVersion:$("#curseVersion").value.trim(),modLoaderType:$("#curseLoader").value};
 if(!params.gameVersion)delete params.modLoaderType;
 try{
  const body=await curseFetch("/mods/"+encodeURIComponent(modId)+"/files",params);
  const files=(body.data||[]).filter(f=>f.isAvailable!==false);
  if(!files.length){target.innerHTML='<p class="muted">Nenhum arquivo disponível com esses filtros. Confira versão e modloader.</p>';return}
  target.innerHTML=files.map(f=>'<div class="curse-file"><div><b>'+esc(f.displayName||f.fileName||("Arquivo "+f.id))+'</b><small>'+esc(f.fileName||"")+' · '+(f.fileDate?new Date(f.fileDate).toLocaleDateString("pt-BR"):"data não informada")+' · '+curseFormatDownloads(f.downloadCount)+' downloads</small></div><button class="btn" data-curse-add="'+f.id+'" data-mod="'+modId+'" data-filename="'+esc(f.fileName||f.displayName||"mod.jar")+'" data-display="'+esc(f.displayName||"")+'">Adicionar</button></div>').join("");
  target.querySelectorAll("[data-curse-add]").forEach(add=>add.onclick=()=>curseAddFile(add,server));
 }catch(err){target.innerHTML='<p class="curse-error">Erro ao carregar arquivos: '+esc(err.message)+'</p>'}
 finally{button.disabled=false}
}
function curseAddFile(button,server){
 const fileId=Number(button.dataset.curseAdd),modId=Number(button.dataset.mod),fileName=button.dataset.filename;
 const s=servers.find(x=>x.id===server.id);if(!s)return;
 s.mods=s.mods||[];
 if(s.mods.some(m=>m.curseforgeFileId===fileId)){curseStatus("Esse arquivo já está na biblioteca de "+s.name+".",true);return}
 s.mods.push({id:crypto.randomUUID(),name:button.dataset.display||fileName.replace(/\\.(jar|zip)$/i,""),version:"CurseForge #"+fileId,type:"Mod",loader:($("#curseLoader option:checked")?.textContent||"Qualquer")+" · Minecraft "+($("#curseVersion").value.trim()||"versão não filtrada"),fileName,curseforgeId:modId,curseforgeFileId:fileId,source:"CurseForge",url:"https://www.curseforge.com/minecraft/mc-mods"});
 save();note(fileName+" adicionado à biblioteca de "+s.name+" via CurseForge.");render();curseStatus("Adicionado à biblioteca de "+s.name+". O download/instalação no host ainda depende do agente Linux.");
}
$("#curseSearchForm")?.addEventListener("submit",e=>{e.preventDefault();curseSearch(true)});
$("#cursePrev")?.addEventListener("click",()=>{curseIndex=Math.max(0,curseIndex-12);curseSearch(false)});
$("#curseNext")?.addEventListener("click",()=>{curseIndex+=12;curseSearch(false)});
$("#curseServer")?.addEventListener("change",()=>{curseServerOptions()});
const oldRender=render;render=function(){oldRender();curseServerOptions()};

/* Catálogo oficial de versões e loaders do Minecraft via CurseForge. */
const mcCatalog={versions:[],loadersByVersion:new Map(),loaded:false};
const MC_LOADER_NAMES={1:"Forge",2:"Cauldron",3:"LiteLoader",4:"Fabric",5:"Quilt",6:"NeoForge"};
async function mcApi(path,params={}){return curseFetch(path,params)}
async function loadMinecraftVersions(){
 const selects=[$("#sVersion"),$("#curseVersion")].filter(Boolean);
 selects.forEach(s=>{s.innerHTML='<option value="">Carregando versões...</option>'});
 try{
  const body=await mcApi("/minecraft/version");
  const raw=Array.isArray(body.data)?body.data:[];
  mcCatalog.versions=[...new Set(raw.map(v=>v.versionString||v.name||v.gameVersion).filter(Boolean))];
  mcCatalog.loaded=true;
  if(!mcCatalog.versions.length)throw new Error("A API não retornou versões.");
  const opts='<option value="">Selecione a versão</option>'+mcCatalog.versions.map(v=>'<option value="'+esc(v)+'">'+esc(v)+'</option>').join("");
  selects.forEach(s=>s.innerHTML=opts);
  if($("#sVersion"))$("#sVersion").value=servers.find(s=>s.game==="Minecraft"&&s.version)?.version||"";
  if($("#curseVersion"))$("#curseVersion").value=servers.find(s=>s.game==="Minecraft"&&s.version)?.version||"";
  await Promise.all([updateServerLoaderOptions($("#sVersion")?.value),updateCurseLoaderOptions($("#curseVersion")?.value)]);
 }catch(err){
  selects.forEach(s=>s.innerHTML='<option value="">Não foi possível carregar versões</option>');
  curseStatus("Não foi possível carregar o catálogo de versões do Minecraft: "+err.message,true);
 }
}
async function getLoadersForVersion(version){
 if(!version)return [];
 if(mcCatalog.loadersByVersion.has(version))return mcCatalog.loadersByVersion.get(version);
 const body=await mcApi("/minecraft/modloader",{version});
 const list=Array.isArray(body.data)?body.data:[];
 const seen=new Map();
 list.forEach(item=>{const type=Number(item.type);if(type>0&&!seen.has(type))seen.set(type,{type,name:MC_LOADER_NAMES[type]||("Loader "+type),latest:!!item.latest,recommended:!!item.recommended})});
 const result=[...seen.values()].sort((a,b)=>a.type-b.type);
 mcCatalog.loadersByVersion.set(version,result);
 return result;
}
function preserveOption(select,value,options){
 const exists=options.some(o=>o.value===String(value));
 return exists?String(value):(options[0]?.value||"");
}
async function updateServerLoaderOptions(version){
 const select=$("#sLoader");if(!select)return;
 const old=select.value;
 const fixed=[{value:"Vanilla",label:"Vanilla"},{value:"Paper",label:"Paper"},{value:"Purpur",label:"Purpur"},{value:"Spigot",label:"Spigot"},{value:"Outro",label:"Outro"}];
 let dynamic=[];
 try{dynamic=(await getLoadersForVersion(version)).map(x=>({value:x.name,label:x.name+(x.recommended?" · recomendado":"")}))}
 catch(e){console.warn("Falha ao consultar loaders para versão",version,e)}
 const options=[...fixed.slice(0,1),...dynamic,...fixed.slice(1)];
 select.innerHTML=options.map(o=>'<option value="'+esc(o.value)+'">'+esc(o.label)+'</option>').join("");
 select.value=preserveOption(select,old,options);
}
async function updateCurseLoaderOptions(version,preferred){
 const select=$("#curseLoader");if(!select)return;
 select.innerHTML='<option value="0">Carregando loaders...</option>';
 let loaders=[];
 try{loaders=await getLoadersForVersion(version)}catch(e){console.warn("Falha ao consultar modloaders",e)}
 const options=[{value:"0",label:"Qualquer loader"},...loaders.map(l=>({value:String(l.type),label:l.name+(l.recommended?" · recomendado":"")}))];
 select.innerHTML=options.map(o=>'<option value="'+o.value+'">'+esc(o.label)+'</option>').join("");
 if(preferred!==undefined)select.value=String(preferred);
}
$("#sVersion")?.addEventListener("change",()=>updateServerLoaderOptions($("#sVersion").value));
$("#curseVersion")?.addEventListener("change",async()=>{await updateCurseLoaderOptions($("#curseVersion").value);});
const originalOpenServerModal=openServerModal;
openServerModal=function(id){originalOpenServerModal(id);const s=id?servers.find(x=>x.id===id):null;if(s?.game==="Minecraft"){if(s.version)$("#sVersion").value=s.version;updateServerLoaderOptions(s.version).then(()=>{if(s.loader)$("#sLoader").value=s.loader})}else updateServerLoaderOptions($("#sVersion").value)};
const originalCurseServerOptions=curseServerOptions;
curseServerOptions=function(){
 const sel=$("#curseServer");if(!sel)return;
 const current=sel.value;
 const minecraft=servers.filter(s=>s.game==="Minecraft");
 sel.innerHTML=minecraft.length?minecraft.map(s=>'<option value="'+esc(s.id)+'">'+esc(s.name)+'</option>').join(""):'<option value="">Nenhum servidor Minecraft cadastrado</option>';
 if(minecraft.some(s=>s.id===current))sel.value=current;
 const s=minecraft.find(x=>x.id===sel.value)||minecraft[0];
 if(s){
  $("#curseVersion").value=s.version||"";
  updateCurseLoaderOptions(s.version,MC_LOADER_NAMES[s.loader] ? curseLoaderByServer[s.loader] : "0");
 }
};
loadMinecraftVersions();
