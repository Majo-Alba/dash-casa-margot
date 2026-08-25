const axios = require('axios');
const { parse } = require('csv-parse/sync');

const SALES_CSV_URL = process.env.GOOGLE_SALES_CSV_URL || process.env.GOOGLE_SHEET_CSV_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQP8UBEa3_xdSq09C6Q8gX8BlCSZkI1tSZcEJFCeR-T4v1pBm1PVS8rToryrDupqqdql6Q_dhfOzrGN/pub?gid=513237590&single=true&output=csv';
const GOALS_CSV_URL = process.env.GOOGLE_GOALS_CSV_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQP8UBEa3_xdSq09C6Q8gX8BlCSZkI1tSZcEJFCeR-T4v1pBm1PVS8rToryrDupqqdql6Q_dhfOzrGN/pub?gid=364462872&single=true&output=csv';
const CLIENTS_CSV_URL = process.env.GOOGLE_CLIENTS_CSV_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQP8UBEa3_xdSq09C6Q8gX8BlCSZkI1tSZcEJFCeR-T4v1pBm1PVS8rToryrDupqqdql6Q_dhfOzrGN/pub?gid=0&single=true&output=csv';
// new jun23
const LEADS_CSV_URL = process.env.GOOGLE_LEADS_CSV_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQP8UBEa3_xdSq09C6Q8gX8BlCSZkI1tSZcEJFCeR-T4v1pBm1PVS8rToryrDupqqdql6Q_dhfOzrGN/pub?gid=675884750&single=true&output=csv';
// end jun23
const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const FULL_MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MONTH_COLUMN_NAMES = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];

function cleanKey(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function numberFrom(value) {
  if (value === null || value === undefined || value === '') return 0;

  const cleaned = String(value)
    .replace(/\$/g, '')
    .replace(/,/g, '')
    .replace(/\s/g, '')
    .replace(/%/g, '');

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function findValue(row, possibleKeys) {
  const normalized = Object.entries(row).reduce((acc, [key, value]) => {
    acc[cleanKey(key)] = value;
    return acc;
  }, {});

  for (const key of possibleKeys) {
    const found = normalized[cleanKey(key)];
    if (found !== undefined) return found;
  }

  return undefined;
}

function parseSaleDate(value) {
  if (!value) return null;

  const raw = String(value).trim();

  // ISO format: YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(raw)) {
    const [year, month, day] = raw.split(/[T\s-]/).map(Number);
    return new Date(year, month - 1, day || 1);
  }

  // Google Sheet format for DASH sales: MM/DD/YYYY
  if (/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(raw)) {
    const parts = raw.split(/[/-]/).map(Number);
    const month = parts[0];
    const day = parts[1];
    const year = parts[2] < 100 ? 2000 + parts[2] : parts[2];
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  return null;
}

function normalizeText(value, fallback = 'General') {
  const text = String(value || '').trim();
  return text || fallback;
}

function normalizeCategory(value) {
  const category = normalizeText(value, 'General');
  const normalized = cleanKey(category);

  if (normalized === 'giftcard' || normalized === 'giftcards' || normalized === 'tarjetaregalo' || normalized === 'tarjetasderegalo') {
    return 'Tarjeta de Regalo';
  }

  return category;
}

function normalizeSaleRow(row, index) {
  const rawDate = findValue(row, ['FECHA_VENTA', 'fecha venta', 'fecha', 'date']);
  const date = parseSaleDate(rawDate);

  const idCliente = normalizeText(
    findValue(row, ['ID_CLIENTE', 'cliente id', 'id cliente', 'cliente']),
    `CLIENTE_${index + 1}`
  );

  return {
    idVenta: normalizeText(findValue(row, ['ID_VENTA', 'id venta', 'venta']), `VENTA_${index + 1}`),
    idCliente,
    date,
    year: date ? date.getFullYear() : null,
    month: date ? date.getMonth() + 1 : null,
    monthLabel: date ? MONTHS[date.getMonth()] : '',
    amount: numberFrom(findValue(row, ['MONTO_VENTA', 'monto venta', 'monto', 'ventas', 'venta', 'ingresos'])),
    category: normalizeCategory(findValue(row, ['CATEGORIA_VENTA', 'categoria venta', 'categoría venta', 'categoria', 'categoría', 'familia'])),
    channel: normalizeText(findValue(row, ['CANAL', 'canal venta', 'canal de venta']), 'Sin canal'),
    seller: normalizeText(findValue(row, ['ID_VENDEDOR', 'VENDEDOR', 'id vendedor', 'vendedor', 'asesor']), 'Sin vendedor')
  };
}

function normalizeGoalRow(row) {
  const year = Number(findValue(row, ['AÑO', 'ANO', 'year', 'año'])) || null;
  const annualGoal = numberFrom(findValue(row, ['ANUAL', 'meta anual', 'objetivo anual']));

  const monthlyGoals = MONTH_COLUMN_NAMES.reduce((acc, monthName, index) => {
    acc[index + 1] = numberFrom(findValue(row, [monthName, FULL_MONTHS[index], MONTHS[index]]));
    return acc;
  }, {});

  return {
    year,
    annualGoal,
    monthlyGoals
  };
}

function pctChange(current, previous) {
  if (!previous) return current ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function roundMoney(value) {
  return Math.round(Number(value) || 0);
}

function sameMonth(row, year, month) {
  return row.year === Number(year) && row.month === Number(month);
}

function getPreviousPeriod(year, month) {
  if (Number(month) === 1) {
    return { year: Number(year) - 1, month: 12 };
  }

  return { year: Number(year), month: Number(month) - 1 };
}

async function fetchCsvRows(url) {
  const { data } = await axios.get(url, { timeout: 15000 });
  return parse(data, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true
  });
}

async function getSalesData() {
  const rows = await fetchCsvRows(SALES_CSV_URL);
  return rows
    .map(normalizeSaleRow)
    .filter((row) => row.date && row.year && row.month);
}

async function getGoalData() {
  const rows = await fetchCsvRows(GOALS_CSV_URL);
  return rows
    .map(normalizeGoalRow)
    .filter((row) => row.year);
}

// new jun22
async function getClientData() {

  const rows = await fetchCsvRows(
    CLIENTS_CSV_URL
  );

  return rows.map((row) => ({

    idCliente: normalizeText(
      findValue(row, [
        'ID_CLIENTE',
        'id cliente'
      ])
    ),

    nombreCliente: normalizeText(
      findValue(row, [
        'NOMBRE_CLIENTE',
        'nombre cliente',
        'cliente'
      ]),
      'Cliente sin nombre'
    )

  }));
}
// end jun22

// new jun23
async function getLeadData() {

  const rows = await fetchCsvRows(
    LEADS_CSV_URL
  );

  return rows.map((row, index) => {

    const rawDate =
      findValue(row, [
        'FECHA_INGRESO_LEAD',
        'fecha ingreso lead'
      ]);

    const date =
      parseSaleDate(rawDate);

    return {

      idLead: normalizeText(
        findValue(row, [
          'ID_LEAD'
        ]),
        `LEAD_${index + 1}`
      ),

      leadName: normalizeText(
        findValue(row, [
          'NOMBRE_LEAD'
        ]),
        'Lead sin nombre'
      ),

      status: normalizeText(
        findValue(row, [
          'ESTATUS_LEAD'
        ]),
        'Nuevo'
      ),

      date,

      year: date?.getFullYear(),
      month: date?.getMonth() + 1

    };
  });
}

function buildLeadStats(
  leadRows,
  selectedYear,
  selectedMonth
) {

  const selectedLeads =
    leadRows.filter(
      lead =>
        lead.year === selectedYear &&
        lead.month === selectedMonth
    );

  const activeStatuses = [
    'Nuevo',
    'Abierto',
    'Intento de Contacto',
    'En Proceso',
    'Contactado',
    'Oportunidad Generada',
    'Interesado',
    'Cultivar'
  ];

  const activeLeads =
    leadRows.filter(
      lead =>
        activeStatuses.includes(
          lead.status
        )
    );

  const converted =
    leadRows.filter(
      lead =>
        lead.status === 'Cliente'
    );

  const conversionRate =
    leadRows.length
      ? (converted.length * 100) /
        leadRows.length
      : 0;

  const statusBreakdown =
    {};

  leadRows.forEach(lead => {

    statusBreakdown[
      lead.status
    ] =
      (statusBreakdown[
        lead.status
      ] || 0) + 1;

  });

  return {

    totalLeads:
      leadRows.length,

    newLeads:
      selectedLeads.length,

    activeLeads:
      activeLeads.length,

    converted:
      converted.length,

    conversionRate,

    statusBreakdown:
      Object.entries(
        statusBreakdown
      ).map(([name,value]) => ({
        name,
        value
      }))

  };
}
// end jun23

async function getCategories() {
  const salesRows = await getSalesData();
  return [...new Set(salesRows.map((row) => row.category).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function filterByCategory(rows, category) {
  if (!category || category === 'TODOS') return rows;
  return rows.filter((row) => row.category === category);
}

function sumSales(rows) {
  return rows.reduce((sum, row) => sum + row.amount, 0);
}

function uniqueClients(rows) {
  return [...new Set(rows.map((row) => row.idCliente).filter(Boolean))];
}

function clientStats(allRows, selectedRows, currentYear, currentMonth, previousRows) {
  const currentClientIds = uniqueClients(selectedRows);

  const firstPurchase = new Map();
  allRows.forEach((row) => {
    const currentFirst = firstPurchase.get(row.idCliente);
    if (!currentFirst || row.date < currentFirst) {
      firstPurchase.set(row.idCliente, row.date);
    }
  });

  const newClientSet = new Set();
  const recurrentClientSet = new Set();

  currentClientIds.forEach((clientId) => {
    const firstDate = firstPurchase.get(clientId);
    if (firstDate && firstDate.getFullYear() === currentYear && firstDate.getMonth() + 1 === currentMonth) {
      newClientSet.add(clientId);
    } else {
      recurrentClientSet.add(clientId);
    }
  });

  const newRows = selectedRows.filter((row) => newClientSet.has(row.idCliente));
  const recurrentRows = selectedRows.filter((row) => recurrentClientSet.has(row.idCliente));

  const previousClientIds = uniqueClients(previousRows);
  const previousNewClientSet = new Set();
  const previousRecurrentClientSet = new Set();

  previousClientIds.forEach((clientId) => {
    const firstDate = firstPurchase.get(clientId);
    if (firstDate && firstDate.getFullYear() === getPreviousPeriod(currentYear, currentMonth).year && firstDate.getMonth() + 1 === getPreviousPeriod(currentYear, currentMonth).month) {
      previousNewClientSet.add(clientId);
    } else {
      previousRecurrentClientSet.add(clientId);
    }
  });

  const newClients = newClientSet.size;
  const recurrentClients = recurrentClientSet.size;
  const total = newClients + recurrentClients;
  const previousNewClients = previousNewClientSet.size;
  const previousRecurrentClients = previousRecurrentClientSet.size;
  const newRevenue = sumSales(newRows);
  const recurrentRevenue = sumSales(recurrentRows);

  return {
    total,
    newClients,
    recurrentClients,
    previousNewClients,
    previousRecurrentClients,
    newPct: total ? (newClients * 100) / total : 0,
    recurrentPct: total ? (recurrentClients * 100) / total : 0,
    newTicket: newClients ? newRevenue / newClients : 0,
    recurrentTicket: recurrentClients ? recurrentRevenue / recurrentClients : 0
  };
}

function groupBy(rows, field) {
  const map = new Map();

  rows.forEach((row) => {
    const key = row[field] || 'General';
    const current = map.get(key) || { name: key, value: 0 };
    current.value += row.amount;
    map.set(key, current);
  });

  return [...map.values()]
    .map((item) => ({ ...item, value: roundMoney(item.value) }))
    .sort((a, b) => b.value - a.value);
}

function getMonthlyGoal(goalRows, selectedYear, selectedMonth) {
  const goalRow = goalRows.find((row) => row.year === Number(selectedYear));

  if (!goalRow) {
    return {
      annualGoal: 0,
      monthlyGoal: 0
    };
  }

  return {
    annualGoal: goalRow.annualGoal,
    monthlyGoal: goalRow.monthlyGoals[selectedMonth] || 0
  };
}

function getGoalForMonth(goalRows, selectedYear, selectedMonth) {
  const goalRow = goalRows.find((row) => row.year === Number(selectedYear));
  if (!goalRow) return 0;
  return goalRow.monthlyGoals[selectedMonth] || 0;
}

function buildPerformance(rows, goalRows, selectedYear) {
  const lastYear = Number(selectedYear) - 1;

  return MONTHS.map((label, index) => {
    const month = index + 1;
    const currentRows = rows.filter((row) => sameMonth(row, selectedYear, month));
    const lastYearRows = rows.filter((row) => sameMonth(row, lastYear, month));

    return {
      month: label,
      sales: roundMoney(sumSales(currentRows)),
      lastYear: roundMoney(sumSales(lastYearRows)),
      goal: roundMoney(getGoalForMonth(goalRows, selectedYear, month))
    };
  });
}

function buildInsights({ salesGrowth, goalCompletion, clients, avgTicketGrowth }) {
  const insights = [];

  if (goalCompletion < 85) {
    insights.push({
      type: 'danger',
      title: 'Meta mensual en riesgo',
      text: `El cumplimiento está en ${Math.round(goalCompletion)}%; conviene revisar acciones comerciales de corto plazo.`
    });
  } else if (goalCompletion >= 100) {
    insights.push({
      type: 'success',
      title: 'Meta mensual superada',
      text: `El mes ya alcanzó ${Math.round(goalCompletion)}% de cumplimiento sobre la meta.`
    });
  } else {
    insights.push({
      type: 'warning',
      title: 'Meta mensual en progreso',
      text: `El avance está en ${Math.round(goalCompletion)}%; aún hay brecha por cerrar.`
    });
  }

  if (salesGrowth < 0) {
    insights.push({
      type: 'danger',
      title: 'Caída vs periodo anterior',
      text: `Las ventas bajaron ${Math.abs(Math.round(salesGrowth))}% contra el mes anterior.`
    });
  } else {
    insights.push({
      type: 'success',
      title: 'Crecimiento vs periodo anterior',
      text: `Las ventas crecieron ${Math.round(salesGrowth)}% contra el mes anterior.`
    });
  }

  if (clients.total === 0) {
    insights.push({
      type: 'warning',
      title: 'Clientes sin actividad',
      text: 'No se detectaron clientes con ventas durante este periodo.'
    });
  } else if (clients.newPct > 55) {
    insights.push({
      type: 'warning',
      title: 'Alta dependencia de clientes nuevos',
      text: `${Math.round(clients.newPct)}% de los clientes del mes son nuevos; revisa la recurrencia.`
    });
  } else if (avgTicketGrowth >= 0) {
    insights.push({
      type: 'success',
      title: 'Ticket promedio saludable',
      text: `El ticket promedio creció ${Math.round(avgTicketGrowth)}% vs el periodo anterior.`
    });
  } else {
    insights.push({
      type: 'warning',
      title: 'Ticket promedio a revisar',
      text: `El ticket promedio bajó ${Math.abs(Math.round(avgTicketGrowth))}% vs el periodo anterior.`
    });
  }

  return insights.slice(0, 3);
}

async function getDashboardData({ year, month, category = 'TODOS' } = {}) {
  const salesRows = await getSalesData();
  const goalRows = await getGoalData();

  const years = [...new Set(salesRows.map((row) => row.year).filter(Boolean))].sort((a, b) => b - a);
  const selectedYear = Number(year) || years[0] || new Date().getFullYear();
  const selectedMonth = Number(month) || new Date().getMonth() + 1;
  const selectedCategory = category || 'TODOS';

    // new jun23
    const leadRows = await getLeadData();
    const leadStats =
    buildLeadStats(
      leadRows,
      selectedYear,
      selectedMonth
    );
    // end jun23

  const rowsForSelectedCategory = filterByCategory(salesRows, selectedCategory);

  const previousPeriod = getPreviousPeriod(selectedYear, selectedMonth);

  const selectedRows = rowsForSelectedCategory.filter((row) => sameMonth(row, selectedYear, selectedMonth));
  const previousRows = rowsForSelectedCategory.filter((row) => sameMonth(row, previousPeriod.year, previousPeriod.month));
  // modif jun22
  // const yearRows = rowsForSelectedCategory.filter((row) => row.year === selectedYear);
  const yearRows = rowsForSelectedCategory.filter(
    (row) => row.year === selectedYear
  );
  
  const monthRows = rowsForSelectedCategory.filter(
    (row) =>
      row.year === selectedYear &&
      row.month === selectedMonth
  );
  // end modif jun22

  const monthlySales = sumSales(selectedRows);
  const previousSales = sumSales(previousRows);
  const events = selectedRows.length;
  const previousEvents = previousRows.length;
  const avgTicket = events ? monthlySales / events : 0;
  const previousAvgTicket = previousEvents ? previousSales / previousEvents : 0;

  const goals = getMonthlyGoal(goalRows, selectedYear, selectedMonth);
  const monthlyGoal = goals.monthlyGoal;
  const annualGoal = goals.annualGoal;
  const goalCompletion = monthlyGoal ? (monthlySales / monthlyGoal) * 100 : 0;

  const clients = clientStats(
    rowsForSelectedCategory,
    selectedRows,
    selectedYear,
    selectedMonth,
    previousRows
  );

  const totalYear = sumSales(yearRows);
  const monthsWithSales = new Set(yearRows.map((row) => row.month)).size || selectedMonth;
  const averageMonthlySales = totalYear / Math.max(monthsWithSales, 1);
  const annualProjection = totalYear + (12 - selectedMonth) * averageMonthlySales;

  const salesGrowth = pctChange(monthlySales, previousSales);
  const avgTicketGrowth = pctChange(avgTicket, previousAvgTicket);

  return {
    meta: {
      selectedYear,
      selectedMonth,
      selectedMonthLabel: `${FULL_MONTHS[selectedMonth - 1]} ${selectedYear}`,
      previousMonthLabel: `${FULL_MONTHS[previousPeriod.month - 1]} ${previousPeriod.year}`,
      selectedCategory,
      years
    },
    kpis: {
      monthlySales: roundMoney(monthlySales),
      salesGrowth,
      goalCompletion,
      monthlyGoal: roundMoney(monthlyGoal),
      newClients: clients.newClients,
      newClientsGrowth: pctChange(clients.newClients, clients.previousNewClients),
      recurrentClients: clients.recurrentClients,
      recurrentClientsGrowth: pctChange(clients.recurrentClients, clients.previousRecurrentClients),
      avgTicket: roundMoney(avgTicket),
      avgTicketGrowth
    },
    // new jun23
    leadStats,
    // end jun23
    performance: buildPerformance(rowsForSelectedCategory, goalRows, selectedYear),
    // modif jun22
    // categoryMix: groupBy(yearRows, 'category'),
    // channelMix: groupBy(yearRows, 'channel'),
    categoryMix: groupBy(monthRows, 'category'),
    channelMix: groupBy(monthRows, 'channel'),
    // end modif jun22
    clients: {
      total: clients.total,
      newClients: clients.newClients,
      recurrentClients: clients.recurrentClients,
      newPct: clients.newPct,
      recurrentPct: clients.recurrentPct,
      newTicket: roundMoney(clients.newTicket),
      recurrentTicket: roundMoney(clients.recurrentTicket)
    },
    projections: {
      annualProjection: roundMoney(annualProjection),
      annualGoal: roundMoney(annualGoal),
      gap: roundMoney(annualProjection - annualGoal)
    },
    insights: buildInsights({
      salesGrowth,
      goalCompletion,
      clients,
      avgTicketGrowth
    })
  };
}


function groupDetailed(rows, field) {
  const map = new Map();

  rows.forEach((row) => {
    const key = row[field] || 'General';
    const current = map.get(key) || {
      name: key,
      revenue: 0,
      transactions: 0,
      clients: new Set()
    };

    current.revenue += row.amount;
    current.transactions += 1;
    current.clients.add(row.idCliente);
    map.set(key, current);
  });

  return [...map.values()]
    .map((item) => ({
      name: item.name,
      revenue: roundMoney(item.revenue),
      transactions: item.transactions,
      clients: item.clients.size,
      avgTicket: item.transactions ? roundMoney(item.revenue / item.transactions) : 0
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

function getBestAndWeakestMonth(monthlyRows) {
  const monthsWithSales = monthlyRows.filter((row) => Number(row.sales || 0) > 0);

  if (!monthsWithSales.length) {
    return {
      bestMonth: 'Sin datos',
      weakestMonth: 'Sin datos'
    };
  }

  const best = [...monthsWithSales].sort((a, b) => b.sales - a.sales)[0];
  const weakest = [...monthsWithSales].sort((a, b) => a.sales - b.sales)[0];

  return {
    bestMonth: best.month,
    weakestMonth: weakest.month
  };
}

function buildSalesInsights({ salesGrowth, goalCompletion, bestMonth, topCategory, topSeller, sellerShare }) {
  const insights = [];

  if (salesGrowth >= 15) {
    insights.push({
      type: 'success',
      title: 'Crecimiento comercial fuerte',
      text: `Las ventas crecieron ${Math.round(salesGrowth)}% contra el mes anterior.`
    });
  } else if (salesGrowth < 0) {
    insights.push({
      type: 'danger',
      title: 'Contracción en ventas',
      text: `Las ventas bajaron ${Math.abs(Math.round(salesGrowth))}% contra el mes anterior.`
    });
  } else {
    insights.push({
      type: 'warning',
      title: 'Crecimiento moderado',
      text: `Las ventas crecieron ${Math.round(salesGrowth)}%; revisa palancas para acelerar.`
    });
  }

  if (goalCompletion >= 100) {
    insights.push({
      type: 'success',
      title: 'Meta mensual alcanzada',
      text: `El cumplimiento de meta está en ${Math.round(goalCompletion)}%.`
    });
  } else {
    insights.push({
      type: 'warning',
      title: 'Brecha vs meta',
      text: `Falta ${Math.max(0, Math.round(100 - goalCompletion))}% para cumplir la meta mensual.`
    });
  }

  if (topCategory?.name) {
    insights.push({
      type: 'success',
      title: 'Categoría líder',
      text: `${topCategory.name} concentra ${Math.round(topCategory.share || 0)}% de los ingresos del periodo.`
    });
  }

  if (topSeller?.name && sellerShare >= 55) {
    insights.push({
      type: 'warning',
      title: 'Dependencia de fuerza comercial',
      text: `${topSeller.name} concentra ${Math.round(sellerShare)}% de las ventas del periodo.`
    });
  }

  if (bestMonth && bestMonth !== 'Sin datos') {
    insights.push({
      type: 'success',
      title: 'Estacionalidad visible',
      text: `${bestMonth} es el mes con mejor desempeño dentro del año seleccionado.`
    });
  }

  return insights.slice(0, 4);
}

async function getSalesAnalytics({ year, month, category = 'TODOS' } = {}) {
  const salesRows = await getSalesData();
  const goalRows = await getGoalData();
  // new jun22
  const clientRows =
  await getClientData();

  const clientMap =
    new Map(
      clientRows.map(client => [
        client.idCliente,
        client.nombreCliente
      ])
    );
  // end jun22

  const years = [...new Set(salesRows.map((row) => row.year).filter(Boolean))].sort((a, b) => b - a);
  const selectedYear = Number(year) || years[0] || new Date().getFullYear();
  const selectedMonth = Number(month) || new Date().getMonth() + 1;
  const selectedCategory = category || 'TODOS';
  const previousPeriod = getPreviousPeriod(selectedYear, selectedMonth);

  const rowsForCategory = filterByCategory(salesRows, selectedCategory);
  const selectedRows = rowsForCategory.filter((row) => sameMonth(row, selectedYear, selectedMonth));
  const previousRows = rowsForCategory.filter((row) => sameMonth(row, previousPeriod.year, previousPeriod.month));
  const yearRows = rowsForCategory.filter((row) => row.year === selectedYear);
  const lastYearRows = rowsForCategory.filter((row) => row.year === selectedYear - 1);

  const monthlySales = sumSales(selectedRows);
  const previousSales = sumSales(previousRows);
  const monthlyGoal = getGoalForMonth(goalRows, selectedYear, selectedMonth);
  const annualGoal = getMonthlyGoal(goalRows, selectedYear, selectedMonth).annualGoal;
  const goalCompletion = monthlyGoal ? (monthlySales / monthlyGoal) * 100 : 0;
  const gapVsGoal = monthlySales - monthlyGoal;

  const transactions = selectedRows.length;
  const previousTransactions = previousRows.length;
  const avgTicket = transactions ? monthlySales / transactions : 0;
  const previousAvgTicket = previousTransactions ? previousSales / previousTransactions : 0;
  const uniqueClientCount = uniqueClients(selectedRows).length;
  const clients = clientStats(rowsForCategory, selectedRows, selectedYear, selectedMonth, previousRows);

  const history = MONTHS.map((label, index) => {
    const currentMonth = index + 1;
    const currentRows = rowsForCategory.filter((row) => sameMonth(row, selectedYear, currentMonth));
    const previousYearRows = rowsForCategory.filter((row) => sameMonth(row, selectedYear - 1, currentMonth));
    const currentGoal = getGoalForMonth(goalRows, selectedYear, currentMonth);

    return {
      month: label,
      sales: roundMoney(sumSales(currentRows)),
      lastYear: roundMoney(sumSales(previousYearRows)),
      goal: roundMoney(currentGoal),
      transactions: currentRows.length,
      avgTicket: currentRows.length ? roundMoney(sumSales(currentRows) / currentRows.length) : 0
    };
  });

  const yearTotal = sumSales(yearRows);
  const lastYearTotal = sumSales(lastYearRows);
  const ytdRows = yearRows.filter((row) => row.month <= selectedMonth);
  const lastYearYtdRows = lastYearRows.filter((row) => row.month <= selectedMonth);
  const ytdSales = sumSales(ytdRows);
  const lastYearYtdSales = sumSales(lastYearYtdRows);

  const categoryBreakdown = groupDetailed(selectedRows, 'category');
  const channelBreakdown = groupDetailed(selectedRows, 'channel');
  const sellerBreakdown = groupDetailed(selectedRows, 'seller');
  // modif jun22
  // const clientBreakdown = groupDetailed(selectedRows, 'idCliente').slice(0, 8);
  const clientBreakdown =
  groupDetailed(
    selectedRows,
    'idCliente'
  )
  .map(client => ({

    ...client,

    clientId: client.name,

    displayName:
      clientMap.get(client.name) ||
      client.name

  }))
  .slice(0,8);
  // end jun22

  const topCategory = categoryBreakdown[0] || null;
  const topSeller = sellerBreakdown[0] || null;
  const sellerShare = topSeller && monthlySales ? (topSeller.revenue * 100) / monthlySales : 0;
  const categoryShare = topCategory && monthlySales ? (topCategory.revenue * 100) / monthlySales : 0;
  const seasonality = getBestAndWeakestMonth(history);

  const monthlyGoalsTotal = MONTH_COLUMN_NAMES.reduce((sum, _month, index) => sum + getGoalForMonth(goalRows, selectedYear, index + 1), 0);

  return {
    meta: {
      selectedYear,
      selectedMonth,
      selectedMonthLabel: `${FULL_MONTHS[selectedMonth - 1]} ${selectedYear}`,
      previousMonthLabel: `${FULL_MONTHS[previousPeriod.month - 1]} ${previousPeriod.year}`,
      selectedCategory,
      years
    },
    kpis: {
      monthlySales: roundMoney(monthlySales),
      salesGrowth: pctChange(monthlySales, previousSales),
      transactions,
      transactionGrowth: pctChange(transactions, previousTransactions),
      avgTicket: roundMoney(avgTicket),
      avgTicketGrowth: pctChange(avgTicket, previousAvgTicket),
      uniqueClients: uniqueClientCount,
      newClients: clients.newClients,
      recurrentClients: clients.recurrentClients,
      goalCompletion,
      monthlyGoal: roundMoney(monthlyGoal),
      gapVsGoal: roundMoney(gapVsGoal),
      ytdSales: roundMoney(ytdSales),
      ytdGrowth: pctChange(ytdSales, lastYearYtdSales),
      yearTotal: roundMoney(yearTotal),
      yearGrowth: pctChange(yearTotal, lastYearTotal),
      annualGoal: roundMoney(annualGoal || monthlyGoalsTotal)
    },
    history,
    goalBars: history.map((row) => ({
      month: row.month,
      sales: row.sales,
      goal: row.goal,
      completion: row.goal ? (row.sales / row.goal) * 100 : 0,
      gap: row.sales - row.goal
    })),
    categoryBreakdown: categoryBreakdown.map((item) => ({
      ...item,
      share: monthlySales ? (item.revenue * 100) / monthlySales : 0
    })),
    channelBreakdown: channelBreakdown.map((item) => ({
      ...item,
      share: monthlySales ? (item.revenue * 100) / monthlySales : 0
    })),
    sellerBreakdown: sellerBreakdown.map((item) => ({
      ...item,
      share: monthlySales ? (item.revenue * 100) / monthlySales : 0
    })),
    clientBreakdown: clientBreakdown.map((item) => ({
      ...item,
      share: monthlySales ? (item.revenue * 100) / monthlySales : 0
    })),
    seasonality: {
      bestMonth: seasonality.bestMonth,
      weakestMonth: seasonality.weakestMonth,
      topCategory: topCategory ? { ...topCategory, share: categoryShare } : null,
      topSeller: topSeller ? { ...topSeller, share: sellerShare } : null
    },
    insights: buildSalesInsights({
      salesGrowth: pctChange(monthlySales, previousSales),
      goalCompletion,
      bestMonth: seasonality.bestMonth,
      topCategory: topCategory ? { ...topCategory, share: categoryShare } : null,
      topSeller,
      sellerShare
    })
  };
}

module.exports = {
  getDashboardData,
  getSalesAnalytics,
  getSalesData,
  getGoalData,
  getCategories
};
