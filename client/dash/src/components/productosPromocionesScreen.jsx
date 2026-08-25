import { useEffect, useState } from 'react';
import { Boxes, PackageCheck, PackageX, ShoppingBag, TrendingUp, LockKeyhole } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AppSidebar from './AppSidebar';
import PeriodSelector from './PeriodSelector';
import { getCasaMargotProducts } from '../services/api';

const money=(n=0)=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(Number(n)||0);
const pct=(n=0)=>`${Math.round((Number(n)||0)*10)/10}%`;
const fallback={company:'Casa Margot',period:{label:'Periodo'},periodOptions:{years:[2026]},kpis:{},topProducts:[],products:[],categories:[],unavailable:[]};
function Empty({title,text}){return <div className="unavailableState"><LockKeyhole size={22}/><div><b>{title}</b><p>{text}</p></div><span>Dato por activar</span></div>}
function Kpi({icon:Icon,title,value,helper}){return <article className="secondaryKpi"><span><Icon size={22}/></span><div><small>{title}</small><b>{value}</b><p>{helper}</p></div></article>}

export default function ProductosPromocionesScreen(){
 const now=new Date();const [period,setPeriod]=useState({type:'month',index:now.getMonth()+1,year:now.getFullYear()});const [data,setData]=useState(fallback);const [loading,setLoading]=useState(true);
 useEffect(()=>{setLoading(true);getCasaMargotProducts(period).then(setData).catch(e=>{console.error(e);setData(fallback)}).finally(()=>setLoading(false))},[period.type,period.index,period.year]);
 const years=data.periodOptions?.years?.length?data.periodOptions.years:[period.year];
 return <main className="appShell"><AppSidebar/><div className="dashboard secondaryDashboard">
  <header className="topbar"><div><p className="eyebrow">Casa Margot · Portafolio comercial</p><h1>Productos y Promociones</h1><p>Qué se vende, cuánto aporta y qué productos están perdiendo actividad. {loading?'Actualizando datos…':''}</p></div><PeriodSelector {...period} label={data.period?.label} years={years} onChange={setPeriod}/></header>
  <div className="secondaryKpiGrid"><Kpi icon={Boxes} title="Productos en catálogo" value={data.kpis?.catalogProducts||0} helper="Productos / servicios registrados"/><Kpi icon={PackageCheck} title="Activos" value={data.kpis?.activeProducts||0} helper="Vendidos en los últimos 6 meses"/><Kpi icon={PackageX} title="Inactivos" value={data.kpis?.inactiveProducts||0} helper="Sin venta en 6 meses"/><Kpi icon={ShoppingBag} title="Vendidos en periodo" value={data.kpis?.soldProducts||0} helper={`${data.kpis?.units||0} unidades / servicios`}/><Kpi icon={TrendingUp} title="Venta del portafolio" value={money(data.kpis?.revenue)} helper={`${pct(data.kpis?.revenueChange)} vs periodo anterior`}/></div>
  <div className="secondaryGrid">
   <section className="panel secondaryWide"><div className="panelTitle"><div><h3>Top 10 productos / servicios</h3><p>Los productos con mayor ingreso dentro del periodo seleccionado.</p></div></div><div className="dataTable"><div className="dataRow productHead"><span>Producto</span><span>Categoría</span><span>Venta</span><span>Unidades</span><span>Ticket</span><span>% ingreso</span></div>{(data.topProducts||[]).map(x=><div className="dataRow productHead" key={x.id}><b>{x.name}</b><span>{x.category}</span><span>{money(x.revenue)}</span><span>{x.units||0}</span><span>{money(x.avgTicket)}</span><strong>{pct(x.revenueShare)}</strong></div>)}</div></section>
   <section className="panel"><div className="panelTitle"><div><h3>Mix por categoría</h3><p>Qué familias concentran la venta.</p></div></div><ResponsiveContainer width="100%" height={285}><BarChart data={data.categories||[]} layout="vertical"><CartesianGrid horizontal={false} strokeDasharray="4 6"/><XAxis type="number" tickFormatter={v=>`$${Math.round(v/1000)}k`}/><YAxis type="category" dataKey="name" width={110}/><Tooltip formatter={v=>money(v)}/><Bar dataKey="revenue" fill="#4d9661" radius={[0,7,7,0]}/></BarChart></ResponsiveContainer></section>
   <section className="panel"><div className="panelTitle"><div><h3>Salud del portafolio</h3><p>Productos activos vs productos que necesitan revisión.</p></div></div><div className="healthCards"><article><small>Activos</small><b>{data.kpis?.activeProducts||0}</b><span>Con venta reciente</span></article><article className="sleep"><small>Inactivos</small><b>{data.kpis?.inactiveProducts||0}</b><span>6+ meses sin venta</span></article></div></section>
   <section className="panel secondaryWide"><div className="panelTitle"><div><h3>Catálogo completo</h3><p>Estado inferido, comportamiento del periodo y última venta disponible.</p></div></div><div className="catalogTableWrap"><table className="catalogTable"><thead><tr><th>Producto</th><th>Categoría</th><th>Precio lista</th><th>Estado</th><th>Venta periodo</th><th>Unidades</th><th>Ticket</th><th>Clientes</th><th>Última venta</th></tr></thead><tbody>{(data.products||[]).map(x=><tr key={x.id}><td><b>{x.name}</b><small>{x.id}</small></td><td>{x.category}</td><td>{money(x.listPrice)}</td><td><span className={`statusPill ${x.status==='Activo'?'active':'inactive'}`}>{x.status}</span></td><td>{money(x.revenue)}</td><td>{x.units||0}</td><td>{money(x.avgTicket)}</td><td>{x.uniqueClients||0}</td><td>{x.lastSale?new Date(x.lastSale).toLocaleDateString('es-MX'):'Sin venta'}</td></tr>)}</tbody></table></div></section>
   <section className="panel secondaryWide"><div className="panelTitle"><div><h3>Promociones y cruces por desbloquear</h3><p>Capacidades visibles aun cuando Casa Margot todavía no captura estos datos.</p></div></div><div className="activationList">{(data.unavailable||[]).map(x=><Empty key={x.key} title={x.title} text={x.message}/>)}</div></section>
  </div>
 </div></main>;
}
