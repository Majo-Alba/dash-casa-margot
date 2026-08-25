const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
function paramsFor({type='month',index,year}={}){const p=new URLSearchParams({type});if(index)p.set('index',index);if(year)p.set('year',year);return p.toString();}
async function getJson(url,msg){const r=await fetch(url);if(!r.ok)throw new Error(msg);return r.json();}

export async function getDashboardData({ year, month, category = 'TODOS' } = {}) {const params=new URLSearchParams();if(year)params.append('year',year);if(month)params.append('month',month);if(category)params.append('category',category);return getJson(`${API_URL}/api/sales/dashboard?${params}`,'No se pudo cargar la información de DASH');}
export async function getCategories(){return getJson(`${API_URL}/api/sales/categories`,'No se pudieron cargar las categorías');}
export async function getVentasData({ year, month, category = 'TODOS' } = {}) {const params=new URLSearchParams();if(year)params.append('year',year);if(month)params.append('month',month);if(category)params.append('category',category);return getJson(`${API_URL}/api/sales/ventas?${params}`,'No se pudo cargar la información de ventas');}
export async function getIntelligenceOverview(q={}){return getJson(`${API_URL}/api/intelligence/overview?${paramsFor(q)}`,'No se pudo cargar la inteligencia esfuerzo-resultado');}
export async function getCasaMargotProducts(q={}){return getJson(`${API_URL}/api/intelligence/products?${paramsFor(q)}`,'No se pudo cargar Productos y Promociones');}
export async function getCasaMargotClients(q={}){return getJson(`${API_URL}/api/intelligence/clients?${paramsFor(q)}`,'No se pudo cargar Clientes');}
export async function getCasaMargotSales(q={}){return getJson(`${API_URL}/api/intelligence/sales?${paramsFor(q)}`,'No se pudo cargar Ventas');}
