import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, CalendarDays, ChevronDown, Home, LineChart, Users, Package, Settings, DollarSign, Target, RotateCcw, ShoppingCart, AlertTriangle, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart as RLineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getCategories, getDashboardData } from '../services/api';
import { Funnel, Thermometer } from 'lucide-react';

const COLORS = ['#4d9661', '#203b5c', '#d9cbb8', '#c7ced6', '#8fa6b2'];
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const SHORT_MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const YEAR_OPTIONS = [2022, 2023, 2024, 2025, 2026, 2027];

const money = (n = 0) => new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0
}).format(Number(n) || 0);

const pct = (n = 0) => `${Math.round((Number(n) || 0) * 10) / 10}%`;

const fallbackData = {
  meta: {
    selectedMonth: 4,
    selectedYear: 2025,
    selectedMonthLabel: 'Abril 2025',
    previousMonthLabel: 'Marzo 2025',
    selectedCategory: 'TODOS',
    years: YEAR_OPTIONS
  },
  kpis: {
    monthlySales: 1250430,
    salesGrowth: 23.4,
    goalCompletion: 112,
    monthlyGoal: 1115000,
    newClients: 152,
    newClientsGrowth: 18.7,
    recurrentClients: 243,
    recurrentClientsGrowth: 12.3,
    avgTicket: 2850,
    avgTicketGrowth: 8.6
  },
  // new jun23
  leadStats: {
    totalLeads: 127,
    newLeads: 18,
    activeLeads: 79,
    converted: 11,
    conversionRate: 8.7,
    statusBreakdown: [
      { name:'Nuevo', value:14 },
      { name:'Contactado', value:21 },
      { name:'En Proceso', value:17 },
      { name:'Cliente', value:11 }
    ]
  },
  // end jun23
  performance: SHORT_MONTHS.map((m, i) => ({
    month: m,
    sales: [720000, 910000, 1080000, 1250430, 0, 0, 0, 0, 0, 0, 0, 0][i],
    lastYear: [420000, 520000, 650000, 540000, 660000, 580000, 650000, 740000, 770000, 840000, 920000, 980000][i],
    goal: 1100000 + i * 23000
  })),
  categoryMix: [
    { name: 'Servicios', value: 562694 },
    { name: 'Productos', value: 375129 },
    { name: 'Aparatología', value: 187565 },
    { name: 'Tarjeta de Regalo', value: 125043 }
  ],
  channelMix: [
    { name: 'Tienda', value: 525181 },
    { name: 'Online', value: 350120 },
    { name: 'WhatsApp', value: 225077 },
    { name: 'Marketplace', value: 100052 },
    { name: 'Otro', value: 50000 }
  ],
  clients: {
    total: 395,
    newClients: 152,
    recurrentClients: 243,
    newPct: 38,
    recurrentPct: 62,
    newTicket: 2350,
    recurrentTicket: 3150
  },
  projections: {
    annualProjection: 14850000,
    annualGoal: 13200000,
    gap: 1650000
  },
  insights: [
    { type: 'warning', title: 'Alta dependencia de clientes nuevos', text: 'El 38% de tus ingresos provienen de clientes nuevos.' },
    { type: 'danger', title: 'Caída en recurrencia', text: 'La tasa de clientes recurrentes bajó vs el promedio reciente.' },
    { type: 'success', title: 'Ticket promedio en crecimiento', text: 'Tu ticket promedio aumentó vs el mes anterior.' }
  ]
};

function growthClass(change = 0) {
  return Number(change) < 0 ? 'negative' : 'positive';
}

function growthIcon(change = 0) {
  return Number(change) < 0 ? '↓' : '↑';
}

function Sidebar({ selectedMonth, selectedYear }) {
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    { icon: Home, label: 'Resumen', path: '/summary' },
    { icon: LineChart, label: 'Ventas', path: '/ventas' },
    { icon: Users, label: 'Clientes', path: '/clientes' },
    { icon: Package, label: 'Productos', path: '/productos' },
    { icon: Settings, label: 'Canales', path: '/canales' }
  ];

  return <aside className="sidebar">
    <div className="logo">DAS<span>H</span><small>by Meridiano Conecta</small></div>

    <nav>
      {items.map((item) =>
        <button
          type="button"
          onClick={() => navigate(item.path)}
          className={location.pathname === item.path || (location.pathname === '/' && item.path === '/summary') ? 'active' : ''}
          key={item.label}
        >
          <item.icon size={18}/>{item.label}
        </button>
      )}
    </nav>

    <div className="sideFooter">
      <button type="button">Empresa Demo <ChevronDown size={16}/></button>
      <button type="button">
        Periodo actual:
        <b>{MONTHS[selectedMonth - 1]} {selectedYear}</b>
        <CalendarDays size={16}/>
      </button>
    </div>
  </aside>;
}

function KpiCard({ icon: Icon, title, value, change, helper }) {
  return <section className="kpiCard">
    <div className="kpiIcon"><Icon size={28}/></div>
    <div>
      <p>{title}</p>
      <h2>{value}</h2>
      <span className={growthClass(change)}>{growthIcon(change)} {pct(Math.abs(Number(change) || 0))}</span>
      <small>{helper}</small>
    </div>
  </section>;
}

function Section({ title, children, className = '' }) {
  return <section className={`panel ${className}`}><h3>{title}</h3>{children}</section>;
}

function SummaryScreen() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedCategory, setSelectedCategory] = useState('TODOS');
  const [categories, setCategories] = useState(['TODOS']);
  const [data, setData] = useState(fallbackData);
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  // NEW JUN22
  const [performanceView, setPerformanceView] = useState('total');
  // END JUN22

  const dateRef = useRef(null);

  useEffect(() => {
    getCategories()
      .then((rows) => {
        const cleanRows = Array.isArray(rows) ? rows.filter(Boolean) : [];
        setCategories(['TODOS', ...cleanRows]);
      })
      .catch(() => setCategories(['TODOS']));
  }, []);

  useEffect(() => {
    setLoading(true);

    getDashboardData({
      month: selectedMonth,
      year: selectedYear,
      category: selectedCategory
    })
      .then((incomingData) => {
        setData(incomingData || fallbackData);
      })
      .catch((error) => {
        console.error('[SummaryScreen] Dashboard error:', error);
        setData(fallbackData);
      })
      .finally(() => setLoading(false));
  }, [selectedMonth, selectedYear, selectedCategory]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (dateRef.current && !dateRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const monthLabel = MONTHS[selectedMonth - 1] || '';
  const shortMonth = SHORT_MONTHS[selectedMonth - 1] || '';
  const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
  const previousPeriodLabel = data?.meta?.previousMonthLabel || 'periodo anterior';

  const totalCategory = data.categoryMix?.reduce((sum, item) => sum + Number(item.value || 0), 0) || 1;
  const totalChannel = data.channelMix?.reduce((sum, item) => sum + Number(item.value || 0), 0) || 1;

  // NEW JUN22
  const performanceData =
  performanceView === 'categoria'
    ? (data.categoryMix || []).map(item => ({
        month: item.name,
        sales: item.value,
        lastYear: 0,
        goal: 0
      }))
    : performanceView === 'canal'
    ? (data.channelMix || []).map(item => ({
        month: item.name,
        sales: item.value,
        lastYear: 0,
        goal: 0
      }))
    : (data.performance || []);
  // END JUN22

  return <main className="appShell">
    <Sidebar selectedMonth={selectedMonth} selectedYear={selectedYear}/>

    <div className="dashboard">
      <header className="topbar">
        <div>
          <h1>¡Hola, Equipo!</h1>
          <p>
            Aquí tienes el resumen de tu negocio.
            {loading ? ' Cargando datos...' : ''}
          </p>
        </div>

        <div className="filters">
          <div className="dateFilter" ref={dateRef}>
            <button
              type="button"
              onClick={() => setShowDatePicker(!showDatePicker)}
            >
              <CalendarDays size={16}/>
              {`1 ${shortMonth} - ${lastDay} ${shortMonth} ${selectedYear}`}
              <ChevronDown size={16}/>
            </button>

            {showDatePicker &&
              <div className="dateDropdown">
                <label>Mes</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                >
                  {MONTHS.map((month, index) =>
                    <option key={month} value={index + 1}>{month}</option>
                  )}
                </select>

                <label>Año</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                >
                  {[...new Set([...(data.meta?.years || []), ...YEAR_OPTIONS, currentYear])]
                    .sort((a, b) => a - b)
                    .map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>
            }
          </div>

          <select
            className="categoryFilter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map((cat) =>
              <option key={cat} value={cat}>
                {cat === 'TODOS' ? 'Todos los productos' : cat}
              </option>
            )}
          </select>

          <button type="button" className="bell"><Bell size={20}/></button>
        </div>
      </header>

      <div className="kpiGrid">
        <KpiCard
          icon={DollarSign}
          title="Ventas del mes"
          value={money(data.kpis?.monthlySales)}
          change={data.kpis?.salesGrowth}
          helper={`vs ${previousPeriodLabel}`}
        />
        <KpiCard
          icon={Target}
          title="% Cumplimiento de meta"
          value={pct(data.kpis?.goalCompletion)}
          change={(data.kpis?.goalCompletion || 0) - 100}
          helper={`Meta: ${money(data.kpis?.monthlyGoal)}`}
        />
        <KpiCard
          icon={Users}
          title="Clientes nuevos"
          value={data.kpis?.newClients || 0}
          change={data.kpis?.newClientsGrowth}
          helper={`vs ${previousPeriodLabel}`}
        />
        <KpiCard
          icon={RotateCcw}
          title="Clientes recurrentes"
          value={data.kpis?.recurrentClients || 0}
          change={data.kpis?.recurrentClientsGrowth}
          helper={`vs ${previousPeriodLabel}`}
        />
        <KpiCard
          icon={ShoppingCart}
          title="Ticket promedio"
          value={money(data.kpis?.avgTicket)}
          change={data.kpis?.avgTicketGrowth}
          helper={`vs ${previousPeriodLabel}`}
        />
      </div>

      <div className="mainGrid">
        <Section title="DESEMPEÑO" className="performance">
          {/* MODIF JUN22 */}
          {/* <div className="tabs">
            <button type="button">Total</button>
            <button type="button">Por categoría</button>
            <button type="button">Por canal</button>
          </div> */}
          <div className="tabs">

            <button
              type="button"
              className={
                performanceView === 'total'
                  ? 'activeTab'
                  : ''
              }
              onClick={() =>
                setPerformanceView('total')
              }
            >
              Total
            </button>

            <button
              type="button"
              className={
                performanceView === 'categoria'
                  ? 'activeTab'
                  : ''
              }
              onClick={() =>
                setPerformanceView('categoria')
              }
            >
              Por categoría
            </button>

            <button
              type="button"
              className={
                performanceView === 'canal'
                  ? 'activeTab'
                  : ''
              }
              onClick={() =>
                setPerformanceView('canal')
              }
            >
              Por canal
            </button>

          </div>
          {/* END MODIF JUN22 */}

          <p>Ventas por mes · {monthLabel} {selectedYear}</p>
          <ResponsiveContainer width="100%" height={260}>
            {/* MODIF JUN22 */}
            {/* <RLineChart data={data.performance || []}> */}
            <RLineChart data={performanceData}>
            {/* END MODIF JUN22 */}
              <CartesianGrid vertical={false} strokeDasharray="4 6"/>
              <XAxis dataKey="month"/>
              <YAxis tickFormatter={(v) => `$${v / 1000000}M`}/>
              <Tooltip formatter={(v) => money(v)}/>
              {/* MODIF JUN22 */}
              {/* <Line type="monotone" dataKey="sales" name="Ventas actuales" stroke="#4d9661" strokeWidth={3}/>
              <Line type="monotone" dataKey="lastYear" name="Año anterior" stroke="#aeb8c5" strokeDasharray="7 7" strokeWidth={2}/>
              <Line type="monotone" dataKey="goal" name="Meta" stroke="#d9b27f" strokeDasharray="4 5" strokeWidth={2}/> */}
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#4d9661"
                strokeWidth={3}
              />

              {
                performanceView === 'total' &&
                <>
                  <Line
                    type="monotone"
                    dataKey="lastYear"
                    stroke="#aeb8c5"
                    strokeDasharray="7 7"
                    strokeWidth={2}
                  />

                  <Line
                    type="monotone"
                    dataKey="goal"
                    stroke="#d9b27f"
                    strokeDasharray="4 5"
                    strokeWidth={2}
                  />
                </>
              }
              {/* END MODIF JUN22 */}
            </RLineChart>
          </ResponsiveContainer>
        </Section>

        <Section title="MIX & DISTRIBUCIÓN">
          <div className="mixLayout">
            <ResponsiveContainer width="42%" height={245}>
              <PieChart>
                <Pie data={data.categoryMix || []} innerRadius={62} outerRadius={92} dataKey="value">
                  {(data.categoryMix || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>) }
                </Pie>
                <Tooltip formatter={(v) => money(v)}/>
              </PieChart>
            </ResponsiveContainer>

            <div className="legendList">
              {(data.categoryMix || []).map((item, i) =>
                <p key={item.name}>
                  <b style={{ background: COLORS[i % COLORS.length] }}/>
                  {item.name}
                  <span>{pct((Number(item.value || 0) / totalCategory) * 100)}</span>
                  <small>{money(item.value)}</small>
                </p>
              )}
            </div>

            <div className="bars">
              {(data.channelMix || []).map((item, i) =>
                <div className="barRow" key={item.name}>
                  <label>{item.name}</label>
                  <div>
                    <span style={{ width: `${(Number(item.value || 0) / totalChannel) * 100}%`, background: COLORS[i % COLORS.length] }}/>
                  </div>
                  <strong>{pct((Number(item.value || 0) / totalChannel) * 100)}</strong>
                </div>
              )}
            </div>
          </div>
        </Section>

        <Section title="CLIENTES" className="clients">
          <div className="clientCards">
            <div className="miniChart">
              {/* MODIF JUN22 */}
              {/* <ResponsiveContainer width="100%" height={150}> */}
              <ResponsiveContainer width="100%" height={180}>
              {/* END MODIF JUN22 */}
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Nuevos', value: data.clients?.newClients || 0 },
                      { name: 'Recurrentes', value: data.clients?.recurrentClients || 0 }
                    ]}
                    // MODIF JUN22
                    // innerRadius={42}
                    // outerRadius={66}
                    innerRadius={35}
                    outerRadius={55}
                    cx="50%"
                    cy="50%"
                    // END MODIF JUN22
                    dataKey="value"
                  >
                    <Cell fill="#4d9661"/>
                    <Cell fill="#203b5c"/>
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              <strong>{data.clients?.total || 0}<small>Total</small></strong>
            </div>

            <article>
              <p>Ticket promedio Nuevos</p>
              <h2>{money(data.clients?.newTicket)}</h2>
              <span>{pct(data.clients?.newPct)} del total</span>
            </article>

            <article>
              <p>Ticket promedio Recurrentes</p>
              <h2>{money(data.clients?.recurrentTicket)}</h2>
              <span>{pct(data.clients?.recurrentPct)} del total</span>
            </article>

            <article>
              <p>% Participación en clientes</p>
              <h2>{pct(data.clients?.newPct)}</h2>
              <div className="progress"><span style={{ width: `${data.clients?.newPct || 0}%` }}/></div>
              <h2>{pct(data.clients?.recurrentPct)}</h2>
              <div className="progress dark"><span style={{ width: `${data.clients?.recurrentPct || 0}%` }}/></div>
            </article>
          </div>
        </Section>

        {/* NEW JUN23 */}
        {/* <Section
          title="LEAD-O-METER"
          className="leadometer"
        >

          <div className="leadCards">

            <article>
              <p>Total Leads</p>
              <h2>
                {data.leadStats?.totalLeads || 0}
              </h2>
            </article>

            <article>
              <p>Nuevos Leads</p>
              <h2>
                {data.leadStats?.newLeads || 0}
              </h2>
            </article>

            <article>
              <p>Leads Activos</p>
              <h2>
                {data.leadStats?.activeLeads || 0}
              </h2>
            </article>

            <article>
              <p>Convertidos</p>
              <h2>
                {data.leadStats?.converted || 0}
              </h2>
            </article>

          </div>

          <div className="leadConversion">

            <h3>
              Conversión
            </h3>

            <strong>
              {pct(
                data.leadStats?.conversionRate
              )}
            </strong>

            <div className="progress">
              <span
                style={{
                  width:
                    `${Math.min(
                      data.leadStats?.conversionRate || 0,
                      100
                    )}%`
                }}
              />
            </div>

          </div>

          <ResponsiveContainer
            width="100%"
            height={250}
          >

            <BarChart
              data={
                data.leadStats
                  ?.statusBreakdown || []
              }
            >

              <CartesianGrid
                vertical={false}
              />

              <XAxis dataKey="name"/>

              <YAxis/>

              <Tooltip/>

              <Bar
                dataKey="value"
                fill="#203b5c"
                radius={[8,8,0,0]}
              />

            </BarChart>

          </ResponsiveContainer>

        </Section> */}
        {/* END JUN23 */}

        <Section title="ALERTAS / INSIGHTS">
          <div className="insights">
            {(data.insights || []).map((item) => {
              const Icon = item.type === 'danger' ? ArrowDownCircle : item.type === 'success' ? ArrowUpCircle : AlertTriangle;
              return <article className={item.type} key={item.title}>
                <Icon size={22}/>
                <div>
                  <b>{item.title}</b>
                  <p>{item.text}</p>
                </div>
                <ChevronDown size={18}/>
              </article>;
            })}
          </div>
        </Section>

        {/* NEW JUN23 */}
        <Section
          title="LEAD-O-METER"
          className="leadometer"
        >

          {/* <div className="leadCards">

            <article>
              <p>Total Leads</p>
              <h2>
                {data.leadStats?.totalLeads || 0}
              </h2>
            </article>

            <article>
              <p>Nuevos Leads</p>
              <h2>
                {data.leadStats?.newLeads || 0}
              </h2>
            </article>

            <article>
              <p>Leads Activos</p>
              <h2>
                {data.leadStats?.activeLeads || 0}
              </h2>
            </article>

            <article>
              <p>Convertidos</p>
              <h2>
                {data.leadStats?.converted || 0}
              </h2>
            </article>

          </div>

          <div className="leadConversion">

            <h3>
              Conversión
            </h3>

            <strong>
              {pct(
                data.leadStats?.conversionRate
              )}
            </strong>

            <div className="progress">
              <span
                style={{
                  width:
                    `${Math.min(
                      data.leadStats?.conversionRate || 0,
                      100
                    )}%`
                }}
              />
            </div>

          </div>

          <ResponsiveContainer
            width="100%"
            height={250}
          >

            <BarChart
              data={
                data.leadStats
                  ?.statusBreakdown || []
              }
            >

              <CartesianGrid
                vertical={false}
              />

              <XAxis dataKey="name"/>

              <YAxis/>

              <Tooltip/>

              <Bar
                dataKey="value"
                fill="#203b5c"
                radius={[8,8,0,0]}
              />

            </BarChart>

          </ResponsiveContainer> */}
          <div className="leadometerLayout">

<div className="leadometerLeft">

  <div className="leadCards">

    <article>
      <p>Total Leads</p>
      <h2>{data.leadStats?.totalLeads || 0}</h2>
    </article>

    <article>
      <p>Nuevos</p>
      <h2>{data.leadStats?.newLeads || 0}</h2>
    </article>

    <article>
      <p>Activos</p>
      <h2>{data.leadStats?.activeLeads || 0}</h2>
    </article>

    <article>
      <p>Convertidos</p>
      <h2>{data.leadStats?.converted || 0}</h2>
    </article>

  </div>

  <div className="leadConversion">

    <small>Conversión General</small>

    <strong>
      {pct(
        data.leadStats?.conversionRate
      )}
    </strong>

    <div className="progress">
      <span
        style={{
          width:
            `${Math.min(
              data.leadStats?.conversionRate || 0,
              100
            )}%`
        }}
      />
    </div>

  </div>

</div>

<div className="leadometerChart">

  <ResponsiveContainer
    width="100%"
    height={240}
  >
    <BarChart
      data={
        data.leadStats?.statusBreakdown || []
      }
    >
      <CartesianGrid vertical={false}/>
      <XAxis dataKey="name"/>
      <YAxis/>
      <Tooltip/>

      <Bar
        dataKey="value"
        fill="#203b5c"
        radius={[8,8,0,0]}
      />

    </BarChart>
  </ResponsiveContainer>

</div>

</div>

        </Section>
        {/* END JUN23 */}

        <Section title="PROYECCIONES" className="projections">
          <div className="projectionLayout">
            <ResponsiveContainer width="72%" height={230}>
              <AreaChart data={data.performance || []}>
                <CartesianGrid vertical={false} strokeDasharray="4 6"/>
                <XAxis dataKey="month"/>
                <YAxis tickFormatter={(v) => `$${v / 1000000}M`}/>
                <Tooltip formatter={(v) => money(v)}/>
                <Bar dataKey="sales" fill="#4d9661" opacity={0.32}/>
                <Area type="monotone" dataKey="goal" stroke="#d9b27f" fill="transparent" strokeDasharray="4 6"/>
              </AreaChart>
            </ResponsiveContainer>

            <div className="projectionCards">
              <article>
                <p>Proyección anual</p>
                <h2>{money(data.projections?.annualProjection)}</h2>
                <span>{pct(((data.projections?.annualProjection || 0) / (data.projections?.annualGoal || 1)) * 100)} de la meta anual</span>
                <div className="progress">
                  <span style={{ width: `${Math.min(((data.projections?.annualProjection || 0) / (data.projections?.annualGoal || 1)) * 100, 100)}%` }}/>
                </div>
              </article>

              <article className="green">
                <p>Meta anual</p>
                <h2>{money(data.projections?.annualGoal)}</h2>
                <span>Faltante / Excedente</span>
                <h3>{money(data.projections?.gap)}</h3>
              </article>
            </div>
          </div>
        </Section>
      </div>
    </div>
  </main>;
}

export default SummaryScreen;


// import { useEffect, useRef, useState } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { Bell, CalendarDays, ChevronDown, Home, LineChart, Users, Package, Settings, DollarSign, Target, RotateCcw, ShoppingCart, AlertTriangle, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
// import { Area, AreaChart, Bar, CartesianGrid, Cell, Line, LineChart as RLineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
// import { getCategories, getDashboardData } from '../services/api';

// const COLORS = ['#4d9661', '#203b5c', '#d9cbb8', '#c7ced6', '#8fa6b2'];
// const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
// const SHORT_MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
// const YEAR_OPTIONS = [2022, 2023, 2024, 2025, 2026, 2027];

// const money = (n = 0) => new Intl.NumberFormat('es-MX', {
//   style: 'currency',
//   currency: 'MXN',
//   maximumFractionDigits: 0
// }).format(Number(n) || 0);

// const pct = (n = 0) => `${Math.round((Number(n) || 0) * 10) / 10}%`;

// const fallbackData = {
//   meta: {
//     selectedMonth: 4,
//     selectedYear: 2025,
//     selectedMonthLabel: 'Abril 2025',
//     previousMonthLabel: 'Marzo 2025',
//     selectedCategory: 'TODOS',
//     years: YEAR_OPTIONS
//   },
//   kpis: {
//     monthlySales: 1250430,
//     salesGrowth: 23.4,
//     goalCompletion: 112,
//     monthlyGoal: 1115000,
//     newClients: 152,
//     newClientsGrowth: 18.7,
//     recurrentClients: 243,
//     recurrentClientsGrowth: 12.3,
//     avgTicket: 2850,
//     avgTicketGrowth: 8.6
//   },
//   performance: SHORT_MONTHS.map((m, i) => ({
//     month: m,
//     sales: [720000, 910000, 1080000, 1250430, 0, 0, 0, 0, 0, 0, 0, 0][i],
//     lastYear: [420000, 520000, 650000, 540000, 660000, 580000, 650000, 740000, 770000, 840000, 920000, 980000][i],
//     goal: 1100000 + i * 23000
//   })),
//   categoryMix: [
//     { name: 'Servicios', value: 562694 },
//     { name: 'Productos', value: 375129 },
//     { name: 'Aparatología', value: 187565 },
//     { name: 'Tarjeta de Regalo', value: 125043 }
//   ],
//   channelMix: [
//     { name: 'Tienda', value: 525181 },
//     { name: 'Online', value: 350120 },
//     { name: 'WhatsApp', value: 225077 },
//     { name: 'Marketplace', value: 100052 },
//     { name: 'Otro', value: 50000 }
//   ],
//   clients: {
//     total: 395,
//     newClients: 152,
//     recurrentClients: 243,
//     newPct: 38,
//     recurrentPct: 62,
//     newTicket: 2350,
//     recurrentTicket: 3150
//   },
//   projections: {
//     annualProjection: 14850000,
//     annualGoal: 13200000,
//     gap: 1650000
//   },
//   insights: [
//     { type: 'warning', title: 'Alta dependencia de clientes nuevos', text: 'El 38% de tus ingresos provienen de clientes nuevos.' },
//     { type: 'danger', title: 'Caída en recurrencia', text: 'La tasa de clientes recurrentes bajó vs el promedio reciente.' },
//     { type: 'success', title: 'Ticket promedio en crecimiento', text: 'Tu ticket promedio aumentó vs el mes anterior.' }
//   ]
// };

// function growthClass(change = 0) {
//   return Number(change) < 0 ? 'negative' : 'positive';
// }

// function growthIcon(change = 0) {
//   return Number(change) < 0 ? '↓' : '↑';
// }

// function Sidebar({ selectedMonth, selectedYear }) {
//   const navigate = useNavigate();
//   const location = useLocation();

//   const items = [
//     { icon: Home, label: 'Resumen', path: '/summary' },
//     { icon: LineChart, label: 'Ventas', path: '/ventas' },
//     { icon: Users, label: 'Clientes', path: '/clientes' },
//     { icon: Package, label: 'Productos', path: '/productos' },
//     { icon: Settings, label: 'Canales', path: '/canales' }
//   ];

//   return <aside className="sidebar">
//     <div className="logo">DAS<span>H</span><small>by Meridiano Conecta</small></div>

//     <nav>
//       {items.map((item) =>
//         <button
//           type="button"
//           onClick={() => navigate(item.path)}
//           className={location.pathname === item.path || (location.pathname === '/' && item.path === '/summary') ? 'active' : ''}
//           key={item.label}
//         >
//           <item.icon size={18}/>{item.label}
//         </button>
//       )}
//     </nav>

//     <div className="sideFooter">
//       <button type="button">Empresa Demo <ChevronDown size={16}/></button>
//       <button type="button">
//         Periodo actual:
//         <b>{MONTHS[selectedMonth - 1]} {selectedYear}</b>
//         <CalendarDays size={16}/>
//       </button>
//     </div>
//   </aside>;
// }

// function KpiCard({ icon: Icon, title, value, change, helper }) {
//   return <section className="kpiCard">
//     <div className="kpiIcon"><Icon size={28}/></div>
//     <div>
//       <p>{title}</p>
//       <h2>{value}</h2>
//       <span className={growthClass(change)}>{growthIcon(change)} {pct(Math.abs(Number(change) || 0))}</span>
//       <small>{helper}</small>
//     </div>
//   </section>;
// }

// function Section({ title, children, className = '' }) {
//   return <section className={`panel ${className}`}><h3>{title}</h3>{children}</section>;
// }

// function SummaryScreen() {
//   const today = new Date();
//   const currentYear = today.getFullYear();
//   const currentMonth = today.getMonth() + 1;

//   const [selectedMonth, setSelectedMonth] = useState(currentMonth);
//   const [selectedYear, setSelectedYear] = useState(currentYear);
//   const [selectedCategory, setSelectedCategory] = useState('TODOS');
//   const [categories, setCategories] = useState(['TODOS']);
//   const [data, setData] = useState(fallbackData);
//   const [loading, setLoading] = useState(true);
//   const [showDatePicker, setShowDatePicker] = useState(false);

//   const dateRef = useRef(null);

//   useEffect(() => {
//     getCategories()
//       .then((rows) => {
//         const cleanRows = Array.isArray(rows) ? rows.filter(Boolean) : [];
//         setCategories(['TODOS', ...cleanRows]);
//       })
//       .catch(() => setCategories(['TODOS']));
//   }, []);

//   useEffect(() => {
//     setLoading(true);

//     getDashboardData({
//       month: selectedMonth,
//       year: selectedYear,
//       category: selectedCategory
//     })
//       .then((incomingData) => {
//         setData(incomingData || fallbackData);
//       })
//       .catch((error) => {
//         console.error('[SummaryScreen] Dashboard error:', error);
//         setData(fallbackData);
//       })
//       .finally(() => setLoading(false));
//   }, [selectedMonth, selectedYear, selectedCategory]);

//   useEffect(() => {
//     function handleOutsideClick(event) {
//       if (dateRef.current && !dateRef.current.contains(event.target)) {
//         setShowDatePicker(false);
//       }
//     }

//     document.addEventListener('mousedown', handleOutsideClick);
//     return () => document.removeEventListener('mousedown', handleOutsideClick);
//   }, []);

//   const monthLabel = MONTHS[selectedMonth - 1] || '';
//   const shortMonth = SHORT_MONTHS[selectedMonth - 1] || '';
//   const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
//   const previousPeriodLabel = data?.meta?.previousMonthLabel || 'periodo anterior';

//   const totalCategory = data.categoryMix?.reduce((sum, item) => sum + Number(item.value || 0), 0) || 1;
//   const totalChannel = data.channelMix?.reduce((sum, item) => sum + Number(item.value || 0), 0) || 1;

//   return <main className="appShell">
//     <Sidebar selectedMonth={selectedMonth} selectedYear={selectedYear}/>

//     <div className="dashboard">
//       <header className="topbar">
//         <div>
//           <h1>¡Hola, Equipo!</h1>
//           <p>
//             Aquí tienes el resumen de tu negocio.
//             {loading ? ' Cargando datos...' : ''}
//           </p>
//         </div>

//         <div className="filters">
//           <div className="dateFilter" ref={dateRef}>
//             <button
//               type="button"
//               onClick={() => setShowDatePicker(!showDatePicker)}
//             >
//               <CalendarDays size={16}/>
//               {`1 ${shortMonth} - ${lastDay} ${shortMonth} ${selectedYear}`}
//               <ChevronDown size={16}/>
//             </button>

//             {showDatePicker &&
//               <div className="dateDropdown">
//                 <label>Mes</label>
//                 <select
//                   value={selectedMonth}
//                   onChange={(e) => setSelectedMonth(Number(e.target.value))}
//                 >
//                   {MONTHS.map((month, index) =>
//                     <option key={month} value={index + 1}>{month}</option>
//                   )}
//                 </select>

//                 <label>Año</label>
//                 <select
//                   value={selectedYear}
//                   onChange={(e) => setSelectedYear(Number(e.target.value))}
//                 >
//                   {[...new Set([...(data.meta?.years || []), ...YEAR_OPTIONS, currentYear])]
//                     .sort((a, b) => a - b)
//                     .map((year) => <option key={year} value={year}>{year}</option>)}
//                 </select>
//               </div>
//             }
//           </div>

//           <select
//             className="categoryFilter"
//             value={selectedCategory}
//             onChange={(e) => setSelectedCategory(e.target.value)}
//           >
//             {categories.map((cat) =>
//               <option key={cat} value={cat}>
//                 {cat === 'TODOS' ? 'Todos los productos' : cat}
//               </option>
//             )}
//           </select>

//           <button type="button" className="bell"><Bell size={20}/></button>
//         </div>
//       </header>

//       <div className="moduleShortcuts">
//         <button type="button" onClick={() => window.location.href = '/ventas'}><LineChart size={18}/> Ventas</button>
//         <button type="button" onClick={() => window.location.href = '/clientes'}><Users size={18}/> Clientes</button>
//         <button type="button" onClick={() => window.location.href = '/productos'}><Package size={18}/> Productos</button>
//         <button type="button" onClick={() => window.location.href = '/canales'}><Settings size={18}/> Canales</button>
//       </div>

//       <div className="kpiGrid">
//         <KpiCard
//           icon={DollarSign}
//           title="Ventas del mes"
//           value={money(data.kpis?.monthlySales)}
//           change={data.kpis?.salesGrowth}
//           helper={`vs ${previousPeriodLabel}`}
//         />
//         <KpiCard
//           icon={Target}
//           title="% Cumplimiento de meta"
//           value={pct(data.kpis?.goalCompletion)}
//           change={(data.kpis?.goalCompletion || 0) - 100}
//           helper={`Meta: ${money(data.kpis?.monthlyGoal)}`}
//         />
//         <KpiCard
//           icon={Users}
//           title="Clientes nuevos"
//           value={data.kpis?.newClients || 0}
//           change={data.kpis?.newClientsGrowth}
//           helper={`vs ${previousPeriodLabel}`}
//         />
//         <KpiCard
//           icon={RotateCcw}
//           title="Clientes recurrentes"
//           value={data.kpis?.recurrentClients || 0}
//           change={data.kpis?.recurrentClientsGrowth}
//           helper={`vs ${previousPeriodLabel}`}
//         />
//         <KpiCard
//           icon={ShoppingCart}
//           title="Ticket promedio"
//           value={money(data.kpis?.avgTicket)}
//           change={data.kpis?.avgTicketGrowth}
//           helper={`vs ${previousPeriodLabel}`}
//         />
//       </div>

//       <div className="mainGrid">
//         <Section title="PERFORMANCE" className="performance">
//           <div className="tabs">
//             <button type="button">Total</button>
//             <button type="button">Por categoría</button>
//             <button type="button">Por canal</button>
//           </div>

//           <p>Ventas por mes · {monthLabel} {selectedYear}</p>
//           <ResponsiveContainer width="100%" height={260}>
//             <RLineChart data={data.performance || []}>
//               <CartesianGrid vertical={false} strokeDasharray="4 6"/>
//               <XAxis dataKey="month"/>
//               <YAxis tickFormatter={(v) => `$${v / 1000000}M`}/>
//               <Tooltip formatter={(v) => money(v)}/>
//               <Line type="monotone" dataKey="sales" name="Ventas actuales" stroke="#4d9661" strokeWidth={3}/>
//               <Line type="monotone" dataKey="lastYear" name="Año anterior" stroke="#aeb8c5" strokeDasharray="7 7" strokeWidth={2}/>
//               <Line type="monotone" dataKey="goal" name="Meta" stroke="#d9b27f" strokeDasharray="4 5" strokeWidth={2}/>
//             </RLineChart>
//           </ResponsiveContainer>
//         </Section>

//         <Section title="MIX & DISTRIBUCIÓN">
//           <div className="mixLayout">
//             <ResponsiveContainer width="42%" height={245}>
//               <PieChart>
//                 <Pie data={data.categoryMix || []} innerRadius={62} outerRadius={92} dataKey="value">
//                   {(data.categoryMix || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>) }
//                 </Pie>
//                 <Tooltip formatter={(v) => money(v)}/>
//               </PieChart>
//             </ResponsiveContainer>

//             <div className="legendList">
//               {(data.categoryMix || []).map((item, i) =>
//                 <p key={item.name}>
//                   <b style={{ background: COLORS[i % COLORS.length] }}/>
//                   {item.name}
//                   <span>{pct((Number(item.value || 0) / totalCategory) * 100)}</span>
//                   <small>{money(item.value)}</small>
//                 </p>
//               )}
//             </div>

//             <div className="bars">
//               {(data.channelMix || []).map((item, i) =>
//                 <div className="barRow" key={item.name}>
//                   <label>{item.name}</label>
//                   <div>
//                     <span style={{ width: `${(Number(item.value || 0) / totalChannel) * 100}%`, background: COLORS[i % COLORS.length] }}/>
//                   </div>
//                   <strong>{pct((Number(item.value || 0) / totalChannel) * 100)}</strong>
//                 </div>
//               )}
//             </div>
//           </div>
//         </Section>

//         <Section title="CLIENTES" className="clients">
//           <div className="clientCards">
//             <div className="miniChart">
//               <ResponsiveContainer width="100%" height={150}>
//                 <PieChart>
//                   <Pie
//                     data={[
//                       { name: 'Nuevos', value: data.clients?.newClients || 0 },
//                       { name: 'Recurrentes', value: data.clients?.recurrentClients || 0 }
//                     ]}
//                     innerRadius={42}
//                     outerRadius={66}
//                     dataKey="value"
//                   >
//                     <Cell fill="#4d9661"/>
//                     <Cell fill="#203b5c"/>
//                   </Pie>
//                 </PieChart>
//               </ResponsiveContainer>

//               <strong>{data.clients?.total || 0}<small>Total</small></strong>
//             </div>

//             <article>
//               <p>Ticket promedio Nuevos</p>
//               <h2>{money(data.clients?.newTicket)}</h2>
//               <span>{pct(data.clients?.newPct)} del total</span>
//             </article>

//             <article>
//               <p>Ticket promedio Recurrentes</p>
//               <h2>{money(data.clients?.recurrentTicket)}</h2>
//               <span>{pct(data.clients?.recurrentPct)} del total</span>
//             </article>

//             <article>
//               <p>% Participación en clientes</p>
//               <h2>{pct(data.clients?.newPct)}</h2>
//               <div className="progress"><span style={{ width: `${data.clients?.newPct || 0}%` }}/></div>
//               <h2>{pct(data.clients?.recurrentPct)}</h2>
//               <div className="progress dark"><span style={{ width: `${data.clients?.recurrentPct || 0}%` }}/></div>
//             </article>
//           </div>
//         </Section>

//         <Section title="ALERTAS / INSIGHTS">
//           <div className="insights">
//             {(data.insights || []).map((item) => {
//               const Icon = item.type === 'danger' ? ArrowDownCircle : item.type === 'success' ? ArrowUpCircle : AlertTriangle;
//               return <article className={item.type} key={item.title}>
//                 <Icon size={22}/>
//                 <div>
//                   <b>{item.title}</b>
//                   <p>{item.text}</p>
//                 </div>
//                 <ChevronDown size={18}/>
//               </article>;
//             })}
//           </div>
//         </Section>

//         <Section title="PROYECCIONES" className="projections">
//           <div className="projectionLayout">
//             <ResponsiveContainer width="72%" height={230}>
//               <AreaChart data={data.performance || []}>
//                 <CartesianGrid vertical={false} strokeDasharray="4 6"/>
//                 <XAxis dataKey="month"/>
//                 <YAxis tickFormatter={(v) => `$${v / 1000000}M`}/>
//                 <Tooltip formatter={(v) => money(v)}/>
//                 <Bar dataKey="sales" fill="#4d9661" opacity={0.32}/>
//                 <Area type="monotone" dataKey="goal" stroke="#d9b27f" fill="transparent" strokeDasharray="4 6"/>
//               </AreaChart>
//             </ResponsiveContainer>

//             <div className="projectionCards">
//               <article>
//                 <p>Proyección anual</p>
//                 <h2>{money(data.projections?.annualProjection)}</h2>
//                 <span>{pct(((data.projections?.annualProjection || 0) / (data.projections?.annualGoal || 1)) * 100)} de la meta anual</span>
//                 <div className="progress">
//                   <span style={{ width: `${Math.min(((data.projections?.annualProjection || 0) / (data.projections?.annualGoal || 1)) * 100, 100)}%` }}/>
//                 </div>
//               </article>

//               <article className="green">
//                 <p>Meta anual</p>
//                 <h2>{money(data.projections?.annualGoal)}</h2>
//                 <span>Faltante / Excedente</span>
//                 <h3>{money(data.projections?.gap)}</h3>
//               </article>
//             </div>
//           </div>
//         </Section>
//       </div>
//     </div>
//   </main>;
// }

// export default SummaryScreen;
