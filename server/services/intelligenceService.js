const axios = require('axios');
const { parse } = require('csv-parse/sync');

const URLS = {
  contacts: process.env.CASA_MARGOT_CONTACTOS_CSV_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQflSJB-ZujBS1N52IYvn00EXtfvKbA5Vy3GPssKVyByrHsU-Mi-vfI5dAzRlp3pM3exvrs0mPHueEY/pub?gid=1892083109&single=true&output=csv',
  efforts: process.env.CASA_MARGOT_ESFUERZOS_CSV_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQflSJB-ZujBS1N52IYvn00EXtfvKbA5Vy3GPssKVyByrHsU-Mi-vfI5dAzRlp3pM3exvrs0mPHueEY/pub?gid=0&single=true&output=csv',
  clients: process.env.CASA_MARGOT_CLIENTES_CSV_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQflSJB-ZujBS1N52IYvn00EXtfvKbA5Vy3GPssKVyByrHsU-Mi-vfI5dAzRlp3pM3exvrs0mPHueEY/pub?gid=1780929486&single=true&output=csv',
  products: process.env.CASA_MARGOT_PRODUCTOS_CSV_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQflSJB-ZujBS1N52IYvn00EXtfvKbA5Vy3GPssKVyByrHsU-Mi-vfI5dAzRlp3pM3exvrs0mPHueEY/pub?gid=1062260323&single=true&output=csv',
  sales: process.env.CASA_MARGOT_VENTAS_CSV_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQflSJB-ZujBS1N52IYvn00EXtfvKbA5Vy3GPssKVyByrHsU-Mi-vfI5dAzRlp3pM3exvrs0mPHueEY/pub?gid=647095910&single=true&output=csv'
};
const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const FULL_MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const key = v => String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
const text = (v, fallback='') => String(v ?? '').trim() || fallback;
const num = v => { const n=Number(String(v ?? '').replace(/[$,%\s]/g,'').replace(/,/g,'')); return Number.isFinite(n)?n:0; };
function val(row,names){ const m={}; Object.entries(row||{}).forEach(([k,v])=>m[key(k)]=v); for(const n of names){ if(m[key(n)]!==undefined) return m[key(n)]; } return undefined; }
function date(v){
  if(!v) return null; const s=String(v).trim();
  if(/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(s)){const [m,d,y0]=s.split(/[/-]/).map(Number); const y=y0<100?2000+y0:y0; return new Date(y,m-1,d,12);}
  if(/^\d{4}-\d{1,2}-\d{1,2}/.test(s)){const [y,m,d]=s.slice(0,10).split('-').map(Number); return new Date(y,m-1,d,12);}
  const d=new Date(s); return Number.isNaN(d.getTime())?null:d;
}
async function csv(url){ const {data}=await axios.get(url,{timeout:20000}); if(!String(data||'').trim()) return []; return parse(data,{columns:true,skip_empty_lines:true,trim:true,bom:true,relax_column_count:true}); }

function periodFromQuery(q={}){
  const now=new Date(); const year=Number(q.year)||now.getFullYear(); const type=['month','bimonth','quarter','semester','year'].includes(q.type)?q.type:'month';
  let index=Math.max(1,Number(q.index)|| (type==='month'?now.getMonth()+1:1)); let startMonth=1,endMonth=12,label=String(year);
  if(type==='month'){index=Math.min(index,12);startMonth=endMonth=index;label=`${MONTHS[index-1]} ${year}`;}
  if(type==='bimonth'){index=Math.min(index,6);startMonth=(index-1)*2+1;endMonth=startMonth+1;label=`${MONTHS[startMonth-1]}-${MONTHS[endMonth-1]} ${year}`;}
  if(type==='quarter'){index=Math.min(index,4);startMonth=(index-1)*3+1;endMonth=startMonth+2;label=`Q${index} ${year}`;}
  if(type==='semester'){index=Math.min(index,2);startMonth=(index-1)*6+1;endMonth=startMonth+5;label=`S${index} ${year}`;}
  const start=new Date(year,startMonth-1,1,0,0,0,0); const end=new Date(year,endMonth,0,23,59,59,999);
  return {type,index,year,startMonth,endMonth,start,end,label};
}
const inPeriod=(d,p)=>d && d>=p.start && d<=p.end;
const diffPct=(a,b)=>b?((a-b)/b)*100:(a?100:0);
function previousPeriod(p){ const months=p.endMonth-p.startMonth+1; const end=new Date(p.start); end.setDate(0); end.setHours(23,59,59,999); const start=new Date(end.getFullYear(),end.getMonth()-months+1,1); return {...p,start,end,label:'periodo anterior'}; }

function normalizeSales(rows){return rows.map((r,i)=>({
 id:text(val(r,['ID_VENTA']),`VENTA_${i+1}`),clientId:text(val(r,['ID_CLIENTE'])),date:date(val(r,['FECHA_VENTA'])),status:text(val(r,['ESTADO_VENTA']),'Realizada'),productId:text(val(r,['ID_PRODUCTO'])),promotionId:text(val(r,['ID_PROMOCION'])),effortId:text(val(r,['ID_ESFUERZO'])),mediaOrigin:text(val(r,['MEDIO_ORIGEN']),'Desconocido'),seller:text(val(r,['ID_VENDEDOR']),'Sin vendedor'),branch:text(val(r,['SUCURSAL']),'Sin sucursal'),units:num(val(r,['CANTIDAD'])),amount:num(val(r,['MONTO_VENTA'])),isRepurchase:['si','sí','true','1','yes'].includes(key(val(r,['ES_RECOMPRA']))),isRecommended:['si','sí','true','1','yes'].includes(key(val(r,['ES_RECOMENDADO'])))
})).filter(x=>x.date && key(x.status)!=='cancelada' && key(x.status)!=='devuelta');}
function normalizeClients(rows){return rows.map((r,i)=>({id:text(val(r,['ID_CLIENTE']),`CLIENTE_${i+1}`),name:text(val(r,['NOMBRE_CLIENTE']),'Cliente'),joinDate:date(val(r,['FECHA_ALTA'])),seller:text(val(r,['ID_VENDEDOR']),'Sin vendedor'),segment:text(val(r,['SEGMENTO']))||'Sin segmento',branch:text(val(r,['ID_SUCURSAL']))||'Sin sucursal',mediaOrigin:text(val(r,['MEDIO_ORIGEN']),'Desconocido'),effortOrigin:text(val(r,['ID_ESFUERZO_ORIGEN']))}));}
function normalizeProducts(rows){return rows.map((r,i)=>({id:text(val(r,['ID_PRODUCTO']),`PROD_${i+1}`),unit:text(val(r,['UNIDAD_NEGOCIO']))||'General',category:text(val(r,['CATEGORIA']),'Sin categoría'),name:text(val(r,['NOMBRE_PRODUCTO']),'Producto sin nombre'),variant:text(val(r,['VARIANTE'])),packageId:text(val(r,['ID_PAQUETE'])),listPrice:num(val(r,['PRECIO_LISTA'])),branch:text(val(r,['SUCURSAL_DISPONIBLE']))}));}
function normalizeContacts(rows){return rows.map((r,i)=>({
 id:text(val(r,['ID_REGISTRO']),`REG_${i+1}`),personId:text(val(r,['ID_PERSONA'])),date:date(val(r,['FECHA_REGISTRO'])),type:text(val(r,['TIPO_RESULTADO'])),status:text(val(r,['ESTADO_RESULTADO'])),effortId:text(val(r,['ID_ESFUERZO'])),mediaId:text(val(r,['ID_MEDIO'])),media:text(val(r,['MEDIO_ESPECIFICO'])||val(r,['ID_MEDIO']),'Desconocido'),productId:text(val(r,['ID_PRODUCTO'])),promotionId:text(val(r,['ID_PROMOCION'])),seller:text(val(r,['ID_VENDEDOR']),'Sin vendedor'),quotedValue:num(val(r,['VALOR_COTIZADO']))
 })).filter(x=>x.date);}
function normalizeEfforts(rows){return rows.map((r,i)=>({
 id:text(val(r,['ID_ESFUERZO']),`ESF_${i+1}`),name:text(val(r,['NOMBRE_ESFUERZO']),'Esfuerzo sin nombre'),family:text(val(r,['FAMILIA_ESFUERZO']),'Sin familia'),lever:text(val(r,['PALANCA_PRINCIPAL'])),start:date(val(r,['FECHA_INICIO'])),end:date(val(r,['FECHA_FIN']))||date(val(r,['FECHA_INICIO'])),media:text(val(r,['MEDIOS'])),result:text(val(r,['RESULTADO']))
 })).filter(x=>x.start);}

function clientStatus(clientId,sales,asOf){
 const last=sales.filter(s=>s.clientId===clientId && s.date<=asOf).sort((a,b)=>b.date-a.date)[0]?.date;
 if(!last) return 'Sin compra'; const days=(asOf-last)/86400000;
 if(days>=183) return 'Inactivo'; if(days>=61) return 'Dormido'; return 'Activo';
}
function productStatus(productId,sales,asOf){ const last=sales.filter(s=>s.productId===productId && s.date<=asOf).sort((a,b)=>b.date-a.date)[0]?.date; return last && (asOf-last)/86400000<183?'Activo':'Inactivo'; }
function overlaps(aStart,aEnd,bStart,bEnd){return aStart<=bEnd && aEnd>=bStart;}
function daysBetweenInclusive(a,b){return Math.max(1,Math.round((b-a)/86400000)+1);}
function countContactType(rows,start,end){return rows.filter(r=>r.date>=start&&r.date<=end&&key(r.type)==='contacto').length;}
function salesSum(rows){return rows.reduce((a,s)=>a+s.amount,0);}
function unique(rows, field){return new Set(rows.map(x=>x[field]).filter(Boolean)).size;}
function yearsFrom(sales,clients=[]){return [...new Set([...sales.map(s=>s.date?.getFullYear()),...clients.map(c=>c.joinDate?.getFullYear())].filter(Boolean))].sort((a,b)=>b-a);}

function buildEffortAnalytics(efforts,contacts,sales,clients,p){
 const periodEfforts=efforts.filter(e=>overlaps(e.start,e.end,p.start,p.end));
 const data=periodEfforts.map(e=>{
   const duration=daysBetweenInclusive(e.start,e.end);
   const beforeEnd=new Date(e.start); beforeEnd.setDate(beforeEnd.getDate()-1); beforeEnd.setHours(23,59,59,999);
   const beforeStart=new Date(beforeEnd); beforeStart.setDate(beforeStart.getDate()-duration+1); beforeStart.setHours(0,0,0,0);
   const afterStart=new Date(e.end); afterStart.setDate(afterStart.getDate()+1); afterStart.setHours(0,0,0,0);
   const afterEnd=new Date(afterStart); afterEnd.setDate(afterEnd.getDate()+duration-1); afterEnd.setHours(23,59,59,999);
   const linked=contacts.filter(r=>r.effortId===e.id);
   const linkedContacts=linked.filter(r=>key(r.type)==='contacto').length;
   const contactClients=new Set(linked.filter(r=>key(r.type)==='cliente').map(r=>r.personId).filter(Boolean));
   const originClients=new Set(clients.filter(c=>c.effortOrigin===e.id).map(c=>c.id));
   const convertedClients=new Set([...contactClients,...originClients]).size;
   const linkedSales=sales.filter(s=>s.effortId===e.id).reduce((sum,s)=>sum+s.amount,0);
   return {id:e.id,name:e.name,before:countContactType(contacts,beforeStart,beforeEnd),during:countContactType(contacts,e.start,e.end),after:countContactType(contacts,afterStart,afterEnd),contacts:linkedContacts,clients:convertedClients,sales:linkedSales};
 });
 return data.sort((a,b)=>(b.clients*1000000+b.sales+b.contacts)-(a.clients*1000000+a.sales+a.contacts));
}
function buildEffortResponses(efforts,contacts,sales,clients,p){
 const periodEfforts=efforts.filter(e=>overlaps(e.start,e.end,p.start,p.end));
 return periodEfforts.map(e=>{const linked=contacts.filter(r=>r.effortId===e.id);const contactCount=linked.filter(r=>key(r.type)==='contacto').length;const contactClients=new Set(linked.filter(r=>key(r.type)==='cliente').map(r=>r.personId).filter(Boolean));const originClients=new Set(clients.filter(c=>c.effortOrigin===e.id).map(c=>c.id));const convertedClients=new Set([...contactClients,...originClients]).size;const linkedSales=sales.filter(s=>s.effortId===e.id).reduce((sum,s)=>sum+s.amount,0);return {id:e.id,name:e.name,contacts:contactCount,clients:convertedClients,sales:linkedSales};}).sort((a,b)=>(b.clients*1000000+b.sales+b.contacts)-(a.clients*1000000+a.sales+a.contacts));
}
function buildMediaAnalytics(contacts,clients,p){
 const current=contacts.filter(r=>inPeriod(r.date,p)); const map=new Map(); const ensure=name=>{if(!map.has(name))map.set(name,{name,contacts:0,clients:0});return map.get(name);};
 current.forEach(r=>{const x=ensure(r.media||'Desconocido');if(key(r.type)==='contacto')x.contacts++;if(key(r.type)==='cliente')x.clients++;});
 clients.filter(c=>inPeriod(c.joinDate,p)).forEach(c=>{const name=c.mediaOrigin||'Desconocido'; if(name&&key(name)!=='desconocido') ensure(name).clients++;});
 return [...map.values()].map(x=>({...x,conversion:x.contacts?x.clients/x.contacts*100:0})).sort((a,b)=>b.clients-a.clients||b.contacts-a.contacts);
}
function buildFunnel(rows,p){
 const current=rows.map(r=>({type:text(val(r,['TIPO_RESULTADO'])),status:text(val(r,['ESTADO_RESULTADO'])),date:date(val(r,['FECHA_REGISTRO']))})).filter(r=>inPeriod(r.date,p));
 const count=(types)=>current.filter(r=>types.includes(key(r.type))).length; const quoteRows=current.filter(r=>key(r.type)==='cotizacion'); const q=(kind)=>quoteRows.filter(r=>kind.includes(key(r.status))).length;
 return [{stage:'Contactos',value:count(['contacto']),available:true},{stage:'Leads Basura',value:current.filter(r=>['basura','leadbasura','descartado','noaplica'].includes(key(r.status))).length,available:true},{stage:'Prospectos',value:count(['prospecto']),available:true},{stage:'Citas / Visitas',value:count(['cita','visita']),available:true},{stage:'Cotizaciones',value:quoteRows.length,available:true,subcategories:[{name:'Ganadas',value:q(['aceptada','ganada'])},{name:'Pendientes',value:q(['preparacion','enviada','pendiente','seguimiento'])},{name:'Perdidas',value:q(['rechazada','vencida','perdida'])}]},{stage:'Clientes',value:count(['cliente']),available:true}];
}

async function loadAll(){
 const [contactRows,effortRows,clientRows,productRows,saleRows]=await Promise.all([csv(URLS.contacts),csv(URLS.efforts),csv(URLS.clients),csv(URLS.products),csv(URLS.sales)]);
 return {contactRows,effortRows,sales:normalizeSales(saleRows),clients:normalizeClients(clientRows),products:normalizeProducts(productRows),contacts:normalizeContacts(contactRows),efforts:normalizeEfforts(effortRows)};
}

async function getOverview(query={}){
 const p=periodFromQuery(query), prev=previousPeriod(p); const {contactRows,sales,clients,products,contacts,efforts}=await loadAll();
 const current=sales.filter(s=>inPeriod(s.date,p)), prior=sales.filter(s=>inPeriod(s.date,prev)); const currentRevenue=salesSum(current), priorRevenue=salesSum(prior);
 const avgTicket=current.length?currentRevenue/current.length:0, priorTicket=prior.length?priorRevenue/prior.length:0; const newClients=clients.filter(c=>inPeriod(c.joinDate,p)); const priorNew=clients.filter(c=>inPeriod(c.joinDate,prev));
 const statuses=clients.reduce((a,c)=>{const s=clientStatus(c.id,sales,p.end);a[s]=(a[s]||0)+1;return a;},{}); const activeClients=statuses.Activo||0;
 const repurchaseClientIds=new Set(current.filter(s=>s.isRepurchase).map(s=>s.clientId).filter(Boolean)); const repurchasePct=activeClients?repurchaseClientIds.size/activeClients*100:0;
 const priorActive=clients.filter(c=>clientStatus(c.id,sales,prev.end)==='Activo').length; const priorRepIds=new Set(prior.filter(s=>s.isRepurchase).map(s=>s.clientId).filter(Boolean)); const priorRepPct=priorActive?priorRepIds.size/priorActive*100:0;
 const sellerMap={}; current.forEach(s=>{const k=s.seller||'Sin vendedor'; if(!sellerMap[k]) sellerMap[k]={name:k,revenue:0,units:0,sales:0}; sellerMap[k].revenue+=s.amount;sellerMap[k].units+=s.units;sellerMap[k].sales++;});
 const salesForce=Object.values(sellerMap).map(x=>({...x,avgTicket:x.sales?x.revenue/x.sales:0,revenueShare:currentRevenue?x.revenue/currentRevenue*100:0})).sort((a,b)=>b.revenue-a.revenue);
 const productLookup=new Map(products.map(x=>[x.id,x])); const productMap={}; current.forEach(s=>{const prod=productLookup.get(s.productId)||{id:s.productId||'SIN_PRODUCTO',name:s.productId||'Sin producto',category:'Sin categoría'}; if(!productMap[prod.id]) productMap[prod.id]={id:prod.id,name:prod.name,category:prod.category,revenue:0,units:0,sales:0}; const x=productMap[prod.id];x.revenue+=s.amount;x.units+=s.units;x.sales++;});
 const topProducts=Object.values(productMap).map(x=>({...x,avgTicket:x.sales?x.revenue/x.sales:0,revenueShare:currentRevenue?x.revenue/currentRevenue*100:0})).sort((a,b)=>b.revenue-a.revenue).slice(0,10);
 const contactAvailable=contacts.length>0, effortAvailable=efforts.length>0; const effortAnalytics=effortAvailable&&contactAvailable?buildEffortAnalytics(efforts,contacts,sales,clients,p):[]; const mediaAnalytics=contactAvailable?buildMediaAnalytics(contacts,clients,p):[]; const effortResponses=effortAvailable?buildEffortResponses(efforts,contacts,sales,clients,p):[];
 const funnel=contactAvailable ? buildFunnel(contactRows,p) : [{stage:'Contactos',available:false},{stage:'Leads Basura',available:false},{stage:'Prospectos',available:false},{stage:'Citas / Visitas',available:false},{stage:'Cotizaciones',available:false,subcategories:[{name:'Ganadas',available:false},{name:'Pendientes',available:false},{name:'Perdidas',available:false}]},{stage:'Clientes',value:newClients.length,available:true},{stage:'Recompra',value:repurchaseClientIds.size,available:true}];
 const unavailable=[]; if(!contactAvailable) unavailable.push({key:'proceso',title:'Proceso comercial',message:'Activa contactos, prospectos, citas y cotizaciones registrando CONTACTOS_PROCESO.'}); if(!effortAvailable) unavailable.push({key:'esfuerzos',title:'Impacto de esfuerzos',message:'Registra esfuerzos para comparar resultados antes, durante y después.'}); unavailable.push({key:'demografia',title:'Perfil demográfico',message:'Agrega edad, sexo y/o segmento a CLIENTES para descubrir qué perfiles compran, recompran y elevan ticket.'});
 return {company:'Casa Margot',updatedAt:new Date().toISOString(),period:{...p,start:p.start.toISOString(),end:p.end.toISOString()},periodOptions:{years:yearsFrom(sales,clients)},levers:[{key:'clienteNuevo',name:'Cliente Nuevo',value:newClients.length,change:diffPct(newClients.length,priorNew.length),helper:'altas registradas en el periodo',icon:'users',available:true},{key:'ticket',name:'Ticket promedio',value:avgTicket,change:diffPct(avgTicket,priorTicket),helper:`${current.length} ventas registradas`,icon:'money',available:true},{key:'recompra',name:'Recompra',value:repurchasePct,change:diffPct(repurchasePct,priorRepPct),helper:`${repurchaseClientIds.size} de ${activeClients} clientes activos`,icon:'refresh',available:true,activeClients,repurchaseClients:repurchaseClientIds.size},{key:'recomendacion',name:'Recomendación',value:null,change:null,helper:'Dato no disponible · activa ES_RECOMENDADO',icon:'share',available:false}],commercialSummary:{revenue:currentRevenue,revenueChange:diffPct(currentRevenue,priorRevenue),salesCount:current.length,units:current.reduce((a,s)=>a+s.units,0),activeClients,dormantClients:statuses.Dormido||0,inactiveClients:statuses.Inactivo||0},funnel,salesForce,topProducts,demographics:{available:false,fields:[]},effortImpact:{available:effortAvailable&&contactAvailable,data:effortAnalytics},media:{available:contactAvailable,data:mediaAnalytics},effortResponses:{available:effortAvailable&&(contactAvailable||sales.some(s=>s.effortId)),data:effortResponses},quality:{contactsAvailable:contactAvailable,effortsAvailable:effortAvailable,clientsAvailable:clients.length>0,productsAvailable:products.length>0,salesAvailable:sales.length>0,unavailable},questions:buildQuestions({activeClients,repurchasePct,salesForce,topProducts,contactAvailable,effortAvailable})};
}

async function getProductsAnalytics(query={}){
 const p=periodFromQuery(query), prev=previousPeriod(p); const {sales,products,efforts,contacts}=await loadAll(); const current=sales.filter(s=>inPeriod(s.date,p)), prior=sales.filter(s=>inPeriod(s.date,prev)); const revenue=salesSum(current); const priorRevenue=salesSum(prior);
 const detail=products.map(prod=>{const allProd=sales.filter(s=>s.productId===prod.id&&s.date<=p.end);const rows=current.filter(s=>s.productId===prod.id);const priorRows=prior.filter(s=>s.productId===prod.id);const prodRevenue=salesSum(rows);const lastSale=allProd.sort((a,b)=>b.date-a.date)[0]?.date||null;return {...prod,status:productStatus(prod.id,sales,p.end),revenue:prodRevenue,previousRevenue:salesSum(priorRows),change:diffPct(prodRevenue,salesSum(priorRows)),transactions:rows.length,units:rows.reduce((a,s)=>a+s.units,0),avgTicket:rows.length?prodRevenue/rows.length:0,uniqueClients:unique(rows,'clientId'),revenueShare:revenue?prodRevenue/revenue*100:0,lastSale:lastSale?lastSale.toISOString():null};}).sort((a,b)=>b.revenue-a.revenue||a.name.localeCompare(b.name));
 const categoryMap={}; detail.forEach(x=>{const k=x.category||'Sin categoría';if(!categoryMap[k])categoryMap[k]={name:k,revenue:0,units:0,products:0};categoryMap[k].revenue+=x.revenue;categoryMap[k].units+=x.units;categoryMap[k].products++;});
 const categories=Object.values(categoryMap).map(x=>({...x,share:revenue?x.revenue/revenue*100:0})).sort((a,b)=>b.revenue-a.revenue);
 const active=detail.filter(x=>x.status==='Activo').length, inactive=detail.filter(x=>x.status==='Inactivo').length, sold=detail.filter(x=>x.transactions>0).length;
 return {company:'Casa Margot',period:{...p,start:p.start.toISOString(),end:p.end.toISOString()},periodOptions:{years:yearsFrom(sales)},kpis:{catalogProducts:products.length,activeProducts:active,inactiveProducts:inactive,soldProducts:sold,revenue,revenueChange:diffPct(revenue,priorRevenue),units:current.reduce((a,s)=>a+s.units,0)},topProducts:detail.slice(0,10),products:detail,categories,promotions:{available:false,data:[]},crossAnalysis:{effortsAvailable:efforts.length>0,mediaAvailable:contacts.length>0,recommendationAvailable:sales.some(s=>s.isRecommended),promotionsAvailable:false},unavailable:[{key:'promotions',title:'Promociones',message:'Agrega ID_PROMOCION y el catálogo de promociones para comparar ticket, volumen y conversión por oferta.'},...(!efforts.length?[{key:'efforts',title:'Producto × esfuerzo',message:'Registra ESFUERZOS para detectar qué acciones coinciden con mayor venta de cada producto.'}]:[]),...(!contacts.length?[{key:'media',title:'Producto × medio',message:'Registra medios de llegada para saber qué canales acercan clientes a cada producto o servicio.'}]:[])]};
}

async function getClientsAnalytics(query={}){
 const p=periodFromQuery(query), prev=previousPeriod(p); const {sales,clients}=await loadAll(); const current=sales.filter(s=>inPeriod(s.date,p)), prior=sales.filter(s=>inPeriod(s.date,prev)); const clientMap=new Map(clients.map(c=>[c.id,c])); const statusCounts={Activo:0,Dormido:0,Inactivo:0,'Sin compra':0};
 const rows=clients.map(c=>{const all=sales.filter(s=>s.clientId===c.id&&s.date<=p.end).sort((a,b)=>a.date-b.date);const periodSales=current.filter(s=>s.clientId===c.id);const lifetimeRevenue=salesSum(all);const periodRevenue=salesSum(periodSales);const status=clientStatus(c.id,sales,p.end);statusCounts[status]=(statusCounts[status]||0)+1;const last=all[all.length-1]?.date||null;return {...c,status,periodRevenue,periodSales:periodSales.length,periodUnits:periodSales.reduce((a,s)=>a+s.units,0),periodTicket:periodSales.length?periodRevenue/periodSales.length:0,lifetimeRevenue,lifetimePurchases:all.length,lastPurchase:last?last.toISOString():null,isNew:inPeriod(c.joinDate,p),repurchases:periodSales.filter(s=>s.isRepurchase).length};});
 const active=statusCounts.Activo||0; const repurchaseIds=new Set(current.filter(s=>s.isRepurchase).map(s=>s.clientId).filter(Boolean)); const priorActive=clients.filter(c=>clientStatus(c.id,sales,prev.end)==='Activo').length; const priorRepIds=new Set(prior.filter(s=>s.isRepurchase).map(s=>s.clientId).filter(Boolean));
 const acquisition=MONTHS.map((m,i)=>({month:m,clients:clients.filter(c=>c.joinDate&&c.joinDate.getFullYear()===p.year&&c.joinDate.getMonth()===i).length}));
 const sellerMap={}; rows.forEach(c=>{const k=c.seller||'Sin vendedor';if(!sellerMap[k])sellerMap[k]={name:k,clients:0,active:0,revenue:0};sellerMap[k].clients++;if(c.status==='Activo')sellerMap[k].active++;sellerMap[k].revenue+=c.periodRevenue;});
 return {company:'Casa Margot',period:{...p,start:p.start.toISOString(),end:p.end.toISOString()},periodOptions:{years:yearsFrom(sales,clients)},kpis:{totalClients:clients.length,newClients:rows.filter(x=>x.isNew).length,activeClients:active,dormantClients:statusCounts.Dormido||0,inactiveClients:statusCounts.Inactivo||0,repurchaseClients:repurchaseIds.size,repurchaseRate:active?repurchaseIds.size/active*100:0,repurchaseChange:diffPct(active?repurchaseIds.size/active*100:0,priorActive?priorRepIds.size/priorActive*100:0),periodRevenue:salesSum(current)},statusBreakdown:Object.entries(statusCounts).map(([name,value])=>({name,value})),acquisition,topClients:[...rows].sort((a,b)=>b.periodRevenue-a.periodRevenue).slice(0,10),clients:rows,sellerPortfolio:Object.values(sellerMap).sort((a,b)=>b.revenue-a.revenue),demographics:{available:false},unavailable:[{key:'demographics',title:'Perfil demográfico',message:'Edad, sexo y otros atributos todavía no están disponibles en CLIENTES.'},{key:'origin',title:'Origen del cliente',message:'Captura MEDIO_ORIGEN para saber qué medios traen clientes que después compran y recompran.'},{key:'effort',title:'Cliente × esfuerzo',message:'Captura ID_ESFUERZO_ORIGEN para relacionar altas, recuperación y recurrencia con acciones comerciales.'}]};
}

async function getSalesAnalytics(query={}){
 const p=periodFromQuery(query), prev=previousPeriod(p); const {sales,clients,products}=await loadAll(); const current=sales.filter(s=>inPeriod(s.date,p)), prior=sales.filter(s=>inPeriod(s.date,prev)); const revenue=salesSum(current), previousRevenue=salesSum(prior); const avgTicket=current.length?revenue/current.length:0, previousTicket=prior.length?previousRevenue/prior.length:0; const clientLookup=new Map(clients.map(c=>[c.id,c])); const productLookup=new Map(products.map(x=>[x.id,x]));
 const history=MONTHS.map((month,i)=>{const rows=sales.filter(s=>s.date.getFullYear()===p.year&&s.date.getMonth()===i);const ly=sales.filter(s=>s.date.getFullYear()===p.year-1&&s.date.getMonth()===i);const r=salesSum(rows);return {month,sales:r,lastYear:salesSum(ly),transactions:rows.length,avgTicket:rows.length?r/rows.length:0,goal:null};});
 const group=(field,lookup)=>{const m={};current.forEach(s=>{const raw=s[field]||'Desconocido';const meta=lookup?.get(raw);const name=meta?.name||raw;if(!m[raw])m[raw]={id:raw,name,revenue:0,transactions:0,units:0,clients:new Set()};m[raw].revenue+=s.amount;m[raw].transactions++;m[raw].units+=s.units;m[raw].clients.add(s.clientId);});return Object.values(m).map(x=>({...x,clients:x.clients.size,avgTicket:x.transactions?x.revenue/x.transactions:0,share:revenue?x.revenue/revenue*100:0})).sort((a,b)=>b.revenue-a.revenue);};
 const categoryMap={}; current.forEach(s=>{const prod=productLookup.get(s.productId);const k=prod?.category||'Sin categoría';if(!categoryMap[k])categoryMap[k]={name:k,revenue:0,transactions:0,clients:new Set()};categoryMap[k].revenue+=s.amount;categoryMap[k].transactions++;categoryMap[k].clients.add(s.clientId);}); const categoryBreakdown=Object.values(categoryMap).map(x=>({...x,clients:x.clients.size,avgTicket:x.transactions?x.revenue/x.transactions:0,share:revenue?x.revenue/revenue*100:0})).sort((a,b)=>b.revenue-a.revenue);
 const sellerBreakdown=group('seller'); const clientBreakdown=group('clientId',clientLookup).slice(0,10); const productBreakdown=group('productId',productLookup); const channelBreakdown=group('mediaOrigin').filter(x=>key(x.name)!=='desconocido');
 const monthsWithSales=history.filter(x=>x.sales>0);const best=monthsWithSales.length?[...monthsWithSales].sort((a,b)=>b.sales-a.sales)[0].month:'Sin datos';const weakest=monthsWithSales.length?[...monthsWithSales].sort((a,b)=>a.sales-b.sales)[0].month:'Sin datos'; const newClients=clients.filter(c=>inPeriod(c.joinDate,p)).length; const recurrentClients=new Set(current.filter(s=>s.isRepurchase).map(s=>s.clientId).filter(Boolean)).size;
 const ytd=sales.filter(s=>s.date.getFullYear()===p.year&&s.date<=p.end); const lastYtd=sales.filter(s=>s.date.getFullYear()===p.year-1&&s.date.getMonth()<=p.endMonth-1);
 return {company:'Casa Margot',meta:{selectedYear:p.year,selectedMonth:p.startMonth,selectedMonthLabel:p.label,previousMonthLabel:prev.label,years:yearsFrom(sales,clients),periodType:p.type,periodIndex:p.index},period:{...p,start:p.start.toISOString(),end:p.end.toISOString()},kpis:{monthlySales:revenue,salesGrowth:diffPct(revenue,previousRevenue),transactions:current.length,transactionGrowth:diffPct(current.length,prior.length),avgTicket,avgTicketGrowth:diffPct(avgTicket,previousTicket),uniqueClients:unique(current,'clientId'),newClients,recurrentClients,goalCompletion:null,monthlyGoal:null,gapVsGoal:null,ytdSales:salesSum(ytd),ytdGrowth:diffPct(salesSum(ytd),salesSum(lastYtd)),annualGoal:null},history,goalBars:history.map(x=>({...x,goal:null,completion:null,gap:null})),categoryBreakdown,productBreakdown,channelBreakdown,sellerBreakdown,clientBreakdown,seasonality:{bestMonth:best,weakestMonth:weakest,topCategory:categoryBreakdown[0]||null,topSeller:sellerBreakdown[0]||null},availability:{goals:false,channels:channelBreakdown.length>0,promotions:current.some(s=>s.promotionId),margin:false},insights:buildSalesInsightsCasa({revenueGrowth:diffPct(revenue,previousRevenue),avgTicketGrowth:diffPct(avgTicket,previousTicket),seller:sellerBreakdown[0],product:productBreakdown[0],channelAvailable:channelBreakdown.length>0})};
}
function buildSalesInsightsCasa({revenueGrowth,avgTicketGrowth,seller,product,channelAvailable}){const a=[];a.push({type:revenueGrowth>=0?'success':'danger',title:revenueGrowth>=0?'Ventas arriba del periodo anterior':'Ventas por debajo del periodo anterior',text:`La venta cambió ${Math.abs(revenueGrowth).toFixed(1)}% frente a la ventana comparable anterior.`});if(product)a.push({type:'success',title:'Producto líder',text:`${product.name} concentra ${product.share.toFixed(1)}% del ingreso del periodo.`});if(seller)a.push({type:seller.share>50?'warning':'success',title:'Concentración comercial',text:`${seller.name} representa ${seller.share.toFixed(1)}% de la venta del periodo.`});a.push({type:channelAvailable?'success':'warning',title:channelAvailable?'Origen de ventas disponible':'Canal de llegada por activar',text:channelAvailable?'Ya es posible comparar ventas por medio de origen.':'Casa Margot todavía no registra MEDIO_ORIGEN de forma confiable; al hacerlo se desbloqueará este cruce.'});return a.slice(0,4);}
function buildQuestions(x){const q=[]; if(x.salesForce[0])q.push(`${x.salesForce[0].name} concentra ${Math.round(x.salesForce[0].revenueShare)}% de la venta del periodo. ¿Es una fortaleza replicable o una dependencia comercial?`); if(x.topProducts[0])q.push(`${x.topProducts[0].name} es el producto/servicio con mayor venta del periodo. ¿Qué esfuerzos y perfiles de cliente explican su desempeño cuando esos datos estén disponibles?`); q.push(`${x.activeClients} clientes están activos y ${x.repurchasePct.toFixed(1)}% registró recompra en el periodo. ¿Qué acciones podrían elevar esa recurrencia?`); if(!x.contactAvailable)q.push('Aún no se registra el proceso previo a la venta. Capturar contactos y cotizaciones permitirá saber dónde se pierden oportunidades.'); if(!x.effortAvailable)q.push('Aún no hay esfuerzos registrados. Al activarlos, DASH podrá comparar qué cambió antes, durante y después de cada acción.'); return q;}

module.exports={getOverview,getProductsAnalytics,getClientsAnalytics,getSalesAnalytics,periodFromQuery};
