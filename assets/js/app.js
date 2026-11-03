const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const KEY="jdevhost.v2.servers", ACT="jdevhost.v2.activity";let servers=load(KEY,[]),activity=load(ACT,[]),selected=null,editing=null,activeTab="config";
function load(k,f){try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}}function save(){localStorage.setItem(KEY,JSON.stringify(servers));localStorage.setItem(ACT,JSON.stringify(activity));}
function esc(x){return String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function note(msg){activity.unshift({msg,time:new Date().toLocaleString("pt-BR")});activity=activity.slice(0,12);save();renderActivity()}
function renderActivity(){$("#activity").innerHTML=activity.length?activity.map(a=>'<div class="event"><i></i><span>'+esc(a.msg)+'<br><span class="muted">'+esc(a.time)+'</span></span></div>').join(""):'<div class="muted">Nenhuma atividade ainda.</div>'}
function gameLabel(s){return s.game==="MinecraftJava"?"Minecraft Java":s.game==="MinecraftBedrock"?"Minecraft Bedrock":s.game==="BeamNG"?"BeamNG.drive (BeamMP)":s.game==="ETS2"?"Euro Truck Simulator 2 (Convoy)":s.game||"Outro"}
function gameCode(s){return s.game==="MinecraftJava"?"JAVA":s.game==="MinecraftBedrock"?"BED":s.game==="BeamNG"?"BMG":s.game==="ETS2"?"ETS":"SRV"}
function totalMods(){return servers.reduce((n,s)=>n+(s.mods||[]).length,0)}
function card(s){return '<article class="server"><div class="servermain"><div class="gameicon">'+gameCode(s)+'</div><div><h3>'+esc(s.name)+'</h3><p>'+esc(gameLabel(s))+' · '+esc(s.version||"Versão não definida")+' · '+esc(s.loader)+(s.loaderVersion?' '+esc(s.loaderVersion):'')+'</p></div></div><div class="serveractions"><span class="pill">'+(s.mods||[]).length+' mods/plugins</span><button class="btn light" data-open="'+s.id+'">Gerenciar</button></div></article>'}
function empty(){return '<div class="empty"><div class="emptyicon">＋</div><h3>Nenhum servidor cadastrado</h3><p>Seu painel está vazio. Crie seu primeiro servidor para configurar versão, loader, memória, porta, mods e plugins.</p><button class="btn" data-create>＋ Criar primeiro servidor</button></div>'}
function render(){const html=servers.length?servers.map(card).join(""):empty();$("#homeServers").innerHTML=html;$("#allServers").innerHTML=html;$("#statTotal").textContent=servers.length;$("#statMods").textContent=totalMods();renderActivity();$("[data-open]").forEach(b=>b.onclick=()=>openDetail(b.dataset.open));$("[data-create]").forEach(b=>b.onclick=()=>openServerModal());renderGlobalMods();$("#modsGlobal [data-create]").forEach(b=>b.onclick=()=>openServerModal());if(typeof curseServerOptions==="function")curseServerOptions()}
function closeMobileNav(){const side=$("#sideNav"),backdrop=$("#sideBackdrop"),toggle=$("#mobileMenu");side?.classList.remove("open");backdrop?.classList.remove("show");document.body.classList.remove("nav-open");toggle?.setAttribute("aria-expanded","false")}
function showPage(p){closeMobileNav();if(p==="mods"&&typeof curseServerOptions==="function")curseServerOptions();const pages={home:"homePage",servers:"serversPage",detail:"detailPage",mods:"modsPage",infra:"infraPage",pterodactyl:"pterodactylPage",settings:"settingsPage"};Object.values(pages).forEach(id=>$("#"+id).classList.add("hidden"));if(p==="console"){ $("#homePage").classList.remove("hidden");$("#consoleLog").scrollIntoView({behavior:"smooth",block:"center"}) }else $("#"+pages[p]).classList.remove("hidden");$("#pageTitle").textContent=({home:"Visão geral",servers:"Servidores",detail:"Gerenciar servidor",mods:"Mods e plugins",infra:"Infraestrutura",pterodactyl:"Pterodactyl",settings:"Configurações",console:"Console"})[p];$$("[data-page]").forEach(b=>b.classList.toggle("active",b.dataset.page===p))}
$$("[data-page]").forEach(b=>b.onclick=()=>showPage(b.dataset.page));$("#seeServers").onclick=()=>showPage("servers");$("#newServer").onclick=()=>openServerModal();$("#newServer2").onclick=()=>openServerModal();
function openServerModal(id){editing=id||null;const s=id?servers.find(x=>x.id===id):null;$("#serverModalTitle").textContent=s?"Editar servidor":"Criar servidor";$("#sName").value=s?.name||"";$("#sGame").value=s?.game||"MinecraftJava";$("#sVersion").value=s?.version||"";$("#sLoader").value=s?.loader||"Vanilla";if($("#sLoaderVersion"))$("#sLoaderVersion").value=s?.loaderVersion||"";$("#sRam").value=s?.ram||2;$("#sPort").value=s?.port||25565;$("#sDescription").value=s?.description||"";$("#serverModal").classList.add("show")}
function closeModal(id){$("#"+id).classList.remove("show")}
$("#cancelServer").onclick=()=>closeModal("serverModal");$("#serverModal").onclick=e=>{if(e.target.id==="serverModal")closeModal("serverModal")};
$("#serverForm").onsubmit=e=>{e.preventDefault();const data={name:$("#sName").value.trim(),game:$("#sGame").value,version:$("#sVersion").value.trim(),loader:$("#sLoader").value,loaderVersion:$("#sLoaderVersion")?.value||"",ram:Number($("#sRam").value),port:Number($("#sPort").value),description:$("#sDescription").value.trim()};if(editing){Object.assign(servers.find(x=>x.id===editing),data);note("Configurações de "+data.name+" atualizadas.")}else{servers.push({...data,id:crypto.randomUUID(),mods:[]});note("Servidor "+data.name+" cadastrado.")}save();render();closeModal("serverModal");if(editing){selected=editing;openDetail(selected)}else showPage("servers")};
function openDetail(id){selected=id;const s=servers.find(x=>x.id===id);if(!s)return;$("#detailName").textContent=s.name;$("#detailIcon").textContent=gameCode(s);$("#detailSub").textContent=gameLabel(s)+" · "+(s.version||"Sem versão")+" · "+s.loader;$("#tabConfig").innerHTML='<div class="manager-status"><div><small>STATUS DO SERVIDOR</small><strong id="serverRuntimeStatus">'+esc(s.status||"Não iniciado")+'</strong></div><span class="pill">Monitoramento aguardando integração</span></div><div class="resource-grid"><article class="resource-card"><small>CPU</small><strong>—</strong><span>Sem telemetria</span><div class="resource-track"><i></i></div></article><article class="resource-card"><small>Memória RAM</small><strong>—</strong><span>Limite: '+s.ram+' GB</span><div class="resource-track"><i></i></div></article><article class="resource-card"><small>Armazenamento</small><strong>—</strong><span>Aguardando leitura do host</span><div class="resource-track"><i></i></div></article><article class="resource-card"><small>Mods / plugins</small><strong>'+(s.mods||[]).length+'</strong><span>Itens na biblioteca</span><div class="resource-track"><i></i></div></article></div><div class="manager-section"><div class="panelhead"><h3>Controles</h3><span class="muted">Ações do servidor</span></div><div class="manager-actions"><button class="btn" id="startServerBtn">Iniciar</button><button class="btn light" id="stopServerBtn">Parar</button><button class="btn light" id="editServerShortcut">Editar configuração</button></div><p class="muted" id="runtimeHint">Conecte o agente Linux para controlar o servidor e receber métricas reais.</p></div><div class="manager-section"><div class="panelhead"><h3>Detalhes da instância</h3></div><div class="grid2"><div><div class="muted">Jogo</div><b>'+esc(gameLabel(s))+'</b></div><div><div class="muted">Versão</div><b>'+esc(s.version||"Não definida")+'</b></div><div><div class="muted">Loader</div><b>'+esc(s.loader)+'</b></div><div><div class="muted">Memória configurada</div><b>'+s.ram+' GB</b></div><div><div class="muted">Porta</div><b>'+s.port+'</b></div><div><div class="muted">Descrição</div><b>'+esc(s.description||"Sem descrição.")+'</b></div></div></div>';renderModsTab(s);renderDetailConsole();showPage("detail");$$("[data-tab]").forEach(b=>b.classList.toggle("active",b.dataset.tab===activeTab));setTab(activeTab)}
function setTab(t){activeTab=t;["config","mods","console"].forEach(x=>$("#tab"+x[0].toUpperCase()+x.slice(1)).classList.toggle("hidden",x!==t));$$("[data-tab]").forEach(b=>b.classList.toggle("active",b.dataset.tab===t))}
$$("[data-tab]").forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
$("#editServer").onclick=()=>openServerModal(selected);document.addEventListener("click",e=>{const button=e.target instanceof Element?e.target.closest("#editServerShortcut"):null;if(button)openServerModal(selected)});$("#deleteServer").onclick=()=>{const s=servers.find(x=>x.id===selected);if(!s)return;if(["running","starting","stopping"].includes(s.status)){alert("Pare o servidor antes de excluí-lo.");return}if(!confirm('Excluir "'+s.name+'" e os registros de mods associados?'))return;servers=servers.filter(x=>x.id!==selected);note("Servidor "+s.name+" removido.");save();render();showPage("servers")};
function analyzeCompatibility(server){
 const items=server.mods||[],javaServer=server.game==="MinecraftJava";
 if(!javaServer)return {checks:[],summary:"A análise automática está disponível para Minecraft Java."};
 const pluginServer=["Paper","Purpur","Spigot"].includes(server.loader);
 const checks=items.map(m=>{
  const meta=String(m.loader||"").toLowerCase(),name=String(m.name||"").toLowerCase();
  const isPlugin=String(m.type||"").toLowerCase()==="plugin";
  const issues=[];
  if(pluginServer&&!isPlugin)issues.push("Servidor de plugins: confira se este arquivo é realmente um plugin.");
  if(!pluginServer&&isPlugin)issues.push("Plugin selecionado para um servidor que não usa Paper/Spigot/Purpur.");
  if(meta&&server.loader&&!meta.includes(String(server.loader).toLowerCase()))issues.push("Loader informado não corresponde ao servidor.");
  if(meta&&server.version&&!meta.includes(String(server.version).toLowerCase()))issues.push("Versão do Minecraft não aparece nos dados cadastrados.");
  const known=!!meta;
  return {id:m.id,name:m.name||"Item sem nome",issues,status:issues.length?"review":known?"check":"unknown"};
 });
 const duplicates=new Map();
 items.forEach(m=>{const key=String(m.name||m.fileName||"").trim().toLowerCase();if(key)duplicates.set(key,(duplicates.get(key)||0)+1)});
 duplicates.forEach((count,key)=>{if(count>1)checks.forEach(c=>{const m=items.find(x=>x.id===c.id);if(String(m?.name||m?.fileName||"").trim().toLowerCase()===key){c.status="review";c.issues.push("Possível item duplicado na biblioteca.")}})});
 return {checks,summary:checks.some(c=>c.status==="review")?"Há itens que merecem revisão.":checks.some(c=>c.status==="unknown")?"Alguns itens não têm metadados suficientes.":"Nenhuma divergência textual encontrada."};
}
function renderModsTab(s){
 const result=analyzeCompatibility(s);
 const checks=result.checks;
 const diagnostic=checks.length?'<section class="compat-box"><div class="compat-head"><div><h3>Verificação preliminar</h3><p>'+esc(result.summary)+'</p></div><span class="pill">'+checks.filter(c=>c.status==="review").length+' para revisar</span></div>'+checks.map(c=>'<div class="compat-row"><span class="compat-dot '+c.status+'"></span><div><b>'+esc(c.name)+'</b><small>'+esc(c.issues.length?c.issues.join(" "):c.status==="check"?"Dados cadastrados coincidem com a configuração.":"Compatibilidade não informada; confira a página do projeto.")+'</small></div></div>').join("")+'<p class="compat-foot">Esta verificação compara apenas os dados cadastrados no painel. Ela não substitui a validação oficial do arquivo nem garante que o mod iniciará corretamente.</p></section>':'<div class="notice">Adicione mods ou plugins para habilitar a verificação preliminar de compatibilidade.</div>';
 $("#tabMods").innerHTML='<div class="panelhead"><div><h2>Mods e plugins</h2><span class="muted">'+(s.mods||[]).length+' itens cadastrados</span></div><button class="btn" id="addMod">＋ Adicionar</button></div>'+diagnostic+'<div class="notice">Minecraft: use o mesmo loader e versões compatíveis entre servidor e mods. Paper, Purpur e Spigot usam plugins, não mods Forge/Fabric. A instalação no host depende do agente.</div>'+(s.mods?.length?s.mods.map(m=>'<div class="modrow"><div><div class="modname">'+esc(m.name)+'</div><div class="modmeta">'+esc(m.type)+' · '+esc(m.version||"versão não informada")+' · '+esc(m.loader||"compatibilidade não informada")+(m.fileName?' · '+esc(m.fileName):"")+'</div></div><button class="btn danger" data-removemod="'+m.id+'">Remover</button></div>').join(""):'<div class="empty"><div class="emptyicon">◇</div><h3>Nenhum mod ou plugin</h3><p>Adicione arquivos .jar e registre a versão e compatibilidade.</p></div>');
 $("#addMod").onclick=()=>openModModal();$("[data-removemod]").forEach(b=>b.onclick=()=>removeMod(b.dataset.removemod))
}
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
function isMinecraftJavaServer(server){const game=String(server?.game||"").trim().toLowerCase().replace(/[ _-]/g,"");const loader=String(server?.loader||"").trim().toLowerCase();return ["minecraftjava","minecraft","java","minecraftjav a"].includes(game)||(["forge","fabric","neoforge","quilt","paper","purpur","spigot","vanilla"].includes(loader)&&(!game||game.includes("minecraft")));}
function curseServerOptions(){
 const sel=$("#curseServer"); if(!sel)return;
 const current=sel.value;
 const minecraft=servers.filter(isMinecraftJavaServer);
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
 const selects=[$("#curseVersion")].filter(Boolean);if($("#sGame")?.value==="MinecraftJava"&&$("#sVersion"))selects.unshift($("#sVersion"));
 selects.forEach(s=>{s.innerHTML='<option value="">Carregando versões...</option>'});
 try{
  const body=await mcApi("/minecraft/version",{sortDescending:true});
  const raw=Array.isArray(body.data)?body.data:[];
  mcCatalog.versions=[...new Set(raw.map(v=>v.versionString||v.name||v.gameVersion).filter(Boolean))];
  mcCatalog.loaded=true;
  if(!mcCatalog.versions.length)throw new Error("A API não retornou versões.");
  const opts='<option value="">Selecione a versão</option>'+mcCatalog.versions.map(v=>'<option value="'+esc(v)+'">'+esc(v)+'</option>').join("");
  selects.forEach(s=>s.innerHTML=opts);
  if($("#sVersion"))$("#sVersion").value=servers.find(s=>s.game==="MinecraftJava"&&s.version)?.version||"";
  if($("#curseVersion"))$("#curseVersion").value=servers.find(s=>s.game==="MinecraftJava"&&s.version)?.version||"";
  await Promise.all([updateServerLoaderOptions($("#sVersion")?.value),updateCurseLoaderOptions($("#curseVersion")?.value)]);
 }catch(err){
  selects.forEach(s=>s.innerHTML='<option value="">Não foi possível carregar versões</option>');
  curseStatus("Não foi possível carregar o catálogo de versões do Minecraft: "+err.message,true);
 }
}
async function getLoadersForVersion(version){
 if(!version)return [];
 if(mcCatalog.loadersByVersion.has(version))return mcCatalog.loadersByVersion.get(version);
 const body=await mcApi("/minecraft/modloader",{version,includeAll:true});
 const list=Array.isArray(body.data)?body.data:[];
 const result=list.filter(item=>Number(item.type)>0&&item.name).sort((a,b)=>{
  if(!!a.recommended!==!!b.recommended)return a.recommended?-1:1;
  if(!!a.latest!==!!b.latest)return a.latest?-1:1;
  return String(b.dateModified||"").localeCompare(String(a.dateModified||""));
 });
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
 try{
  const all=await getLoadersForVersion(version);
  const types=[...new Set(all.map(x=>Number(x.type)))];
  dynamic=types.map(type=>({value:MC_LOADER_NAMES[type]||("Loader "+type),label:MC_LOADER_NAMES[type]||("Loader "+type)}));
 }catch(e){console.warn("Falha ao consultar loaders para versão",version,e)}
 const options=[...fixed.slice(0,1),...dynamic,...fixed.slice(1)];
 select.innerHTML=options.map(o=>'<option value="'+esc(o.value)+'">'+esc(o.label)+'</option>').join("");
 select.value=preserveOption(select,old,options);
 await updateServerLoaderVersions(version,select.value);
}
async function updateServerLoaderVersions(version,loader,preferred){
 const select=$("#sLoaderVersion");if(!select)return;
 const type=Object.keys(MC_LOADER_NAMES).find(k=>MC_LOADER_NAMES[k]===loader);
 if(!version||!type){
  select.innerHTML='<option value="">Não se aplica</option>';select.disabled=true;return;
 }
 select.disabled=false;select.innerHTML='<option value="">Carregando versões...</option>';
 try{
  const all=await getLoadersForVersion(version);
  const builds=all.filter(x=>Number(x.type)===Number(type));
  if(!builds.length){select.innerHTML='<option value="">Nenhuma versão disponível</option>';select.disabled=true;return}
  select.innerHTML=builds.map(x=>{
   const label=(x.forgeVersion||x.name)+(x.recommended?" · recomendado":x.latest?" · mais recente":"");
   return '<option value="'+esc(x.name)+'">'+esc(label)+'</option>';
  }).join("");
  const target=preferred||select.dataset.preferred||"";
  if(target&&builds.some(x=>x.name===target))select.value=target;
  else select.selectedIndex=0;
  select.dataset.preferred="";
 }catch(e){select.innerHTML='<option value="">Falha ao carregar versões</option>';select.disabled=true;console.warn(e)}
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
$("#sLoader")?.addEventListener("change",()=>updateServerLoaderVersions($("#sVersion").value,$("#sLoader").value));
$("#curseVersion")?.addEventListener("change",async()=>{await updateCurseLoaderOptions($("#curseVersion").value);});
const originalOpenServerModal=openServerModal;
openServerModal=function(id){originalOpenServerModal(id);const s=id?servers.find(x=>x.id===id):null;if(s?.game==="MinecraftJava"){if(s.version)$("#sVersion").value=s.version;updateServerLoaderOptions(s.version).then(()=>{if(s.loader)$("#sLoader").value=s.loader;return updateServerLoaderVersions(s.version,$("#sLoader").value,s.loaderVersion)})}else updateServerLoaderOptions($("#sVersion").value)};
const originalCurseServerOptions=curseServerOptions;
curseServerOptions=function(){
 const sel=$("#curseServer");if(!sel)return;
 const current=sel.value;
 const minecraft=servers.filter(isMinecraftJavaServer);
 sel.innerHTML=minecraft.length?minecraft.map(s=>'<option value="'+esc(s.id)+'">'+esc(s.name)+'</option>').join(""):'<option value="">Nenhum servidor Minecraft cadastrado</option>';
 if(minecraft.some(s=>s.id===current))sel.value=current;
 const s=minecraft.find(x=>x.id===sel.value)||minecraft[0];
 if(s){
  $("#curseVersion").value=s.version||"";
  updateCurseLoaderOptions(s.version,curseLoaderByServer[s.loader]||"0");
 }
};
loadMinecraftVersions();


/* Conexão segura com a API Cloudflare do JDev Host. */
const API_DEFAULT = "https://jdev-host-api.joaoferreiraneto0711.workers.dev";
const API_TOKEN_KEY = "jdevhost.api.panelToken";
const API_BASE_KEY = "jdevhost.api.base";
let apiConnected = false;
let agentConnected = false;
let apiSyncing = false;
let syncTimer = null;

function apiBase(){return ($("#apiBase")?.value || localStorage.getItem(API_BASE_KEY) || API_DEFAULT).trim().replace(/\/+$/,"")}
function apiToken(){return localStorage.getItem(API_TOKEN_KEY)||""}
function apiMessage(message,error=false){
 const el=$("#apiMessage");if(!el)return;
 el.textContent=message;el.classList.toggle("error",!!error);
}
async function apiFetch(path,options={}){
 const token=options.token || apiToken();
 const method=String(options.method||"GET").toUpperCase();
 const headers={Accept:"application/json",...(options.headers||{})};
 if(options.body!==undefined&&!headers["Content-Type"])headers["Content-Type"]="application/json";
 if(token)headers.Authorization="Bearer "+token;
 let response;
 try{response=await fetch(apiBase()+path,{...options,method,headers})}
 catch(error){throw new Error("Falha de rede ao acessar a API ("+apiBase()+"): "+error.message)}
 const data=await response.json().catch(()=>({error:"Resposta inválida da API."}));
 if(!response.ok){const error=new Error(data.error||("Erro HTTP "+response.status));error.status=response.status;throw error}
 return data;
}
function apiPayload(s){
 return {id:s.id,name:s.name,game:s.game,version:s.version||"",loader:s.loader||"",loaderVersion:s.loaderVersion||"",ram:s.ram||1,port:s.port||25565,description:s.description||"",settings:{mods:(s.mods||[]).map(m=>({id:m.id,name:m.name,version:m.version,type:m.type,loader:m.loader,fileName:m.fileName,fileSize:m.fileSize,curseforgeId:m.curseforgeId,curseforgeFileId:m.curseforgeFileId,source:m.source,url:m.url}))}};
}
async function syncLocalServers(){
 if(!apiToken()||apiSyncing)return;
 apiSyncing=true;
 try{
  const remote=await apiFetch("/api/servers");
  const remoteIds=new Set(remote.map(s=>s.id));
  for(const s of servers){
   if(!["ETS2","BeamNG","MinecraftJava","MinecraftBedrock"].includes(s.game))continue;
   const payload=apiPayload(s);
   if(remoteIds.has(s.id))await apiFetch("/api/servers/"+s.id,{method:"PUT",body:JSON.stringify(payload)});
   else await apiFetch("/api/servers",{method:"POST",body:JSON.stringify(payload)});
  }
 }catch(error){console.warn("Sincronização JDev Host:",error);apiMessage("Falha ao sincronizar: "+error.message,true)}
 finally{apiSyncing=false}
}
async function syncRemoteServers(){
 const remote=await apiFetch("/api/servers");
 const localById=new Map(servers.map(s=>[s.id,s]));
 for(const r of remote){
  const cfg=r.config||JSON.parse(r.config_json||"{}");
  const previous=localById.get(r.id)||{};
  const mods=cfg.settings?.mods||previous.mods||[];
  const item={...previous,id:r.id,name:r.name,game:cfg.game,version:cfg.version||"",loader:cfg.loader||"",loaderVersion:cfg.loaderVersion||"",ram:cfg.ram||1,port:cfg.port||25565,description:cfg.description||"",mods,status:r.status};
  const idx=servers.findIndex(s=>s.id===r.id);
  if(idx>=0)servers[idx]=item;else servers.push(item);
 }
 save();
 render();
}
async function refreshApiStatus(){
 if(!apiToken())return;
 try{
  const data=await apiFetch("/api/status");
  apiConnected=true;agentConnected=!!data.agent?.connected;
  const statusText=agentConnected?"Agente conectado":"API conectada · agente offline";
  $("#agentStatus").textContent=statusText;
  $("#agentSide").textContent=agentConnected?"Agente Linux: conectado":"Agente Linux: desconectado";
  $("#apiMessage").textContent="API conectada. "+(agentConnected?"Agente Linux online.":"Aguardando o agente Linux no notebook.");
  $("#pairAgent").disabled=false;
  const stat=$("#agentStatus");if(stat)stat.title=data.agent?.lastSeen||"";
  const hint=$("#runtimeHint");if(hint)hint.textContent=agentConnected?"Agente online. Você pode iniciar ou parar este servidor.":"Conexão com a API OK; ações de execução aguardam o agente Linux.";
  const start=$("#startServerBtn"),stop=$("#stopServerBtn");
  if(start)start.disabled=!agentConnected;
  if(stop)stop.disabled=!agentConnected;
  for(const remoteServer of (data.servers||[])){const local=servers.find(s=>s.id===remoteServer.id);if(local)local.status=remoteServer.status}
  const running=data.runtime?.active_server_id;
  const runningServer=servers.find(s=>s.id===running);
  const runningLabel=runningServer?.name||"Nenhum";
  const statRun=document.querySelector("#homePage .stat:nth-child(2) strong");
  if(statRun)statRun.textContent=running?"1":"0";
  const statHost=document.querySelector("#homePage .stat:nth-child(4) strong");
  if(statHost)statHost.textContent=agentConnected?"Online":"Offline";
  const hostLabel=document.querySelector("#homePage .stat:nth-child(4) span");
  if(hostLabel)hostLabel.textContent=agentConnected?"Notebook conectado":"Agente host";
  return data;
 }catch(error){
  apiConnected=false;agentConnected=false;
  $("#agentStatus").textContent="API desconectada";
  $("#agentSide").textContent="Agente Linux: desconectado";
  if($("#pairAgent"))$("#pairAgent").disabled=true;
  return null;
 }
}
async function connectApi(){
 const input=$("#apiCredential").value.trim();
 localStorage.setItem(API_BASE_KEY,apiBase());
 if(!input){apiMessage("Cole o código inicial ou o token do painel.",true);return}
 apiMessage("Verificando a API...");
 try{
  const health=await fetch(apiBase()+"/health",{headers:{Accept:"application/json"}});
  if(!health.ok)throw new Error("A API respondeu HTTP "+health.status+" em /health.");
  const healthData=await health.json().catch(()=>null);
  if(!healthData?.ok)throw new Error("O endereço respondeu, mas não confirmou ser a API JDev Host.");
  apiMessage("API online. Validando credencial...");
  let token=input;
  try{
   await apiFetch("/api/status",{token});
  }catch(authError){
   if(authError.status!==401)throw authError;
   const claim=await fetch(apiBase()+"/api/claim",{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({setupCode:input})});
   const data=await claim.json().catch(()=>({}));
   if(!claim.ok)throw new Error(data.error||("Falha ao validar o código inicial (HTTP "+claim.status+")."));
   if(!data.panelToken)throw new Error("A API não retornou o token do painel.");
   token=data.panelToken;
  }
  localStorage.setItem(API_TOKEN_KEY,token);
  $("#apiCredential").value="";
  await syncRemoteServers();
  await syncLocalServers();
  const status=await refreshApiStatus();
  if(!status)throw new Error("Credencial salva, mas não foi possível carregar o status da API.");
  apiMessage("API conectada. Configurações sincronizadas.");
 }catch(error){apiMessage("Não foi possível conectar: "+error.message,true)}
}
$("#connectApi")?.addEventListener("click",connectApi);
$("#disconnectApi")?.addEventListener("click",()=>{
 localStorage.removeItem(API_TOKEN_KEY);apiConnected=false;agentConnected=false;
 $("#agentStatus").textContent="Agente desconectado";$("#agentSide").textContent="Agente Linux: desconectado";
 $("#pairAgent").disabled=true;apiMessage("Token removido deste navegador.");
});
$("#apiBase")?.addEventListener("change",()=>localStorage.setItem(API_BASE_KEY,apiBase()));
$("#pairAgent")?.addEventListener("click",async()=>{
 try{
  const result=await apiFetch("/api/agent/pair",{method:"POST",body:JSON.stringify({name:"JDev Host Linux"})});
  $("#agentTokenOutput").textContent="ID do dispositivo: "+result.deviceId+"\\nToken do agente (guarde com segurança):\\n"+result.deviceToken;
  $("#agentTokenOutput").classList.remove("hidden");
 }catch(error){apiMessage("Não foi possível gerar a credencial: "+error.message,true)}
});
document.addEventListener("click",async event=>{
 const button=event.target instanceof Element?event.target.closest("#startServerBtn, #stopServerBtn"):null;
 if(button){
  const start=button.id==="startServerBtn";
  if(!apiToken()){apiMessage("Conecte o painel à API nas Configurações.",true);showPage("settings");return}
  if(!agentConnected){apiMessage("A API está conectada, mas o agente do notebook ainda está offline.",true);return}
  try{
   const result=await apiFetch("/api/servers/"+selected+"/"+(start?"start":"stop"),{method:"POST",body:"{}"});
   const hint=$("#runtimeHint");if(hint)hint.textContent=start?"Inicialização enviada ao notebook.":"Parada enviada ao notebook.";
   await refreshApiStatus();
  }catch(error){const hint=$("#runtimeHint");if(hint)hint.textContent=error.message}
 }
});
$("#serverForm")?.addEventListener("submit",()=>{if(apiToken())setTimeout(syncLocalServers,250)});
$("#modForm")?.addEventListener("submit",()=>{if(apiToken())setTimeout(syncLocalServers,900)});
$("#deleteServer")?.addEventListener("click",()=>{
 const deletedId=selected;
 if(apiToken())setTimeout(()=>{if(!servers.some(s=>s.id===deletedId))apiFetch("/api/servers/"+deletedId,{method:"DELETE"}).catch(error=>apiMessage("Falha ao excluir no servidor remoto: "+error.message,true))},250);
});
const originalSave=save;
save=function(){
 originalSave();
 if(apiToken()){
  clearTimeout(syncTimer);
  syncTimer=setTimeout(syncLocalServers,1000);
 }
};
function updateGameForm(){
 const game=$("#sGame")?.value;
 const version=$("#sVersion"),loader=$("#sLoader"),loaderVersion=$("#sLoaderVersion");
 if(!version||!loader)return;
 if(game==="MinecraftJava"){
  if(mcCatalog.versions.length){
   const selected=version.value;
   version.innerHTML='<option value="">Selecione a versão</option>'+mcCatalog.versions.map(v=>'<option value="'+esc(v)+'">'+esc(v)+'</option>').join("");
   if(selected&&mcCatalog.versions.includes(selected))version.value=selected;
  }
  updateServerLoaderOptions(version.value);
  return;
 }
 const options={
  MinecraftBedrock:{version:[["","Selecione a versão"],["latest","Mais recente"]],loader:[["Bedrock","Bedrock Dedicated Server"]],port:19132,ram:2},
  BeamNG:{version:[["latest","Mais recente"]],loader:[["BeamMP","BeamMP Dedicated Server"]],port:30814,ram:2},
  ETS2:{version:[["latest","Mais recente"]],loader:[["Convoy","Servidor dedicado Convoy"]],port:27015,ram:2}
 }[game]||{version:[["latest","Mais recente"]],loader:[["default","Padrão"]],port:25565,ram:1};
 version.innerHTML=options.version.map(([v,l])=>'<option value="'+v+'">'+l+'</option>').join("");
 loader.innerHTML=options.loader.map(([v,l])=>'<option value="'+v+'">'+l+'</option>').join("");
 if(loaderVersion){loaderVersion.innerHTML='<option value="">Não se aplica</option>';loaderVersion.disabled=true}
 $("#sPort").value=options.port;$("#sRam").value=options.ram;
}
$("#sGame")?.addEventListener("change",updateGameForm);
const previousOpenServerModal=openServerModal;
openServerModal=function(serverId){
 previousOpenServerModal(serverId);
 const s=serverId?servers.find(x=>x.id===serverId):null;
 updateGameForm();
 if(s){
  $("#sVersion").value=s.version||$("#sVersion").value;
  $("#sLoader").value=s.loader||$("#sLoader").value;
  $("#sRam").value=s.ram||$("#sRam").value;
  $("#sPort").value=s.port||$("#sPort").value;
  if($("#sLoaderVersion"))$("#sLoaderVersion").value=s.loaderVersion||"";
  if(s.game==="MinecraftJava")updateServerLoaderOptions(s.version).then(()=>{ $("#sLoader").value=s.loader||$("#sLoader").value; return updateServerLoaderVersions(s.version,s.loader,s.loaderVersion); });
 }
};
if($("#apiBase"))$("#apiBase").value=localStorage.getItem(API_BASE_KEY)||API_DEFAULT;
if(apiToken()){
 $("#apiCredential").placeholder="Token salvo neste navegador";
 syncRemoteServers()
  .then(()=>refreshApiStatus())
  .then(status=>{if(!status)apiMessage("Token salvo, mas a API não respondeu ou recusou a credencial. Verifique o endereço e conecte novamente.",true)})
  .catch(error=>{apiMessage("Falha ao carregar dados da API: "+error.message,true);console.error("JDev Host API:",error)});
}


/* Acesso ao painel Pterodactyl: a chave da API nunca fica no navegador. */
const PTERO_URL_KEY="jdevhost.pterodactyl.panelUrl";
function normalizePteroUrl(value){
 const raw=String(value||"").trim();
 if(!raw)return "";
 const url=new URL(raw);
 if(url.protocol!=="https:"||url.username||url.password)throw new Error("Informe um endereço HTTPS válido, sem usuário ou senha.");
 return url.origin;
}
const pteroUrlInput=$("#pteroPanelUrl");
if(pteroUrlInput)pteroUrlInput.value=localStorage.getItem(PTERO_URL_KEY)||"";
function savePteroPanelUrl(){
 try{
  const value=normalizePteroUrl(pteroUrlInput?.value);
  if(!value)throw new Error("Informe o endereço do painel Pterodactyl.");
  localStorage.setItem(PTERO_URL_KEY,value);
  pteroUrlInput.value=value;
  alert("Endereço do Pterodactyl salvo neste navegador.");
 }catch(error){alert(error.message)}
}
$("#savePteroUrl")?.addEventListener("click",savePteroPanelUrl);
$("#openPteroPanel")?.addEventListener("click",()=>{
 try{
  const value=normalizePteroUrl(pteroUrlInput?.value||localStorage.getItem(PTERO_URL_KEY));
  if(!value)throw new Error("Salve primeiro o endereço HTTPS do painel Pterodactyl.");
  localStorage.setItem(PTERO_URL_KEY,value);
  if(pteroUrlInput)pteroUrlInput.value=value;
  window.open(value,"_blank","noopener,noreferrer");
 }catch(error){alert(error.message)}
});

/* Menu lateral no celular */
$("#mobileMenu")?.addEventListener("click",()=>{
 const side=$("#sideNav"),backdrop=$("#sideBackdrop"),toggle=$("#mobileMenu");
 const open=!side.classList.contains("open");
 side.classList.toggle("open",open);backdrop.classList.toggle("show",open);
 document.body.classList.toggle("nav-open",open);
 toggle.setAttribute("aria-expanded",String(open));
});
$("#sideBackdrop")?.addEventListener("click",closeMobileNav);
document.addEventListener("keydown",event=>{if(event.key==="Escape")closeMobileNav()});
