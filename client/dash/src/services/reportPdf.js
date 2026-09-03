import { jsPDF } from 'jspdf';

const PALETTE = {
  navy: [16, 36, 56],
  green: [57, 114, 85],
  cream: [246, 241, 235],
  gold: [125, 100, 63],
  bg: [248, 249, 251],
  ink: [21, 34, 56],
  muted: [109, 120, 137],
  line: [226, 232, 237],
  white: [255, 255, 255],
};

const fmtMoney = (n = 0) => new Intl.NumberFormat('es-MX', {
  style: 'currency', currency: 'MXN', maximumFractionDigits: 0,
}).format(Number(n) || 0);

const fmtPct = (n = 0) => `${Math.round((Number(n) || 0) * 10) / 10}%`;
const safe = (v, fallback = '—') => (v === null || v === undefined || v === '' ? fallback : String(v));

function setText(doc, color = PALETTE.ink, size = 10, style = 'normal') {
  doc.setTextColor(...color);
  doc.setFont('helvetica', style);
  doc.setFontSize(size);
}

function roundedCard(doc, x, y, w, h, fill = PALETTE.white, stroke = PALETTE.line, r = 3) {
  doc.setFillColor(...fill);
  doc.setDrawColor(...stroke);
  doc.roundedRect(x, y, w, h, r, r, 'FD');
}

function sectionTitle(doc, title, subtitle, x, y, width) {
  setText(doc, PALETTE.ink, 12.5, 'bold');
  doc.text(title, x, y);
  if (subtitle) {
    setText(doc, PALETTE.muted, 8.2, 'normal');
    const lines = doc.splitTextToSize(subtitle, width);
    doc.text(lines, x, y + 5);
    return y + 5 + lines.length * 3.5;
  }
  return y + 4;
}

function addPageHeader(doc, periodLabel, pageNo) {
  doc.setFillColor(...PALETTE.navy);
  doc.rect(0, 0, 210, 16, 'F');
  setText(doc, PALETTE.white, 12, 'bold');
  doc.text('DASH', 14, 10.5);
  setText(doc, [222, 234, 226], 7.5, 'normal');
  doc.text('Casa Margot · Inteligencia comercial', 34, 10.5);
  setText(doc, PALETTE.white, 7.5, 'normal');
  doc.text(periodLabel || 'Periodo', 196, 10.5, { align: 'right' });

  setText(doc, PALETTE.muted, 7, 'normal');
  doc.text(`Página ${pageNo}`, 196, 287, { align: 'right' });
  doc.text('Generado desde DASH · Los resultados reflejan la información disponible en el sistema.', 14, 287);
}

function addMetricCard(doc, { x, y, w, title, value, helper, accent = PALETTE.green, disabled = false }) {
  roundedCard(doc, x, y, w, 29, disabled ? PALETTE.bg : PALETTE.white);
  doc.setFillColor(...accent);
  doc.roundedRect(x + 4, y + 5, 2.2, 19, 1, 1, 'F');
  setText(doc, PALETTE.muted, 7.5, 'bold');
  doc.text(title.toUpperCase(), x + 10, y + 9);
  setText(doc, disabled ? [155, 164, 174] : PALETTE.ink, 15, 'bold');
  doc.text(safe(value), x + 10, y + 18);
  setText(doc, PALETTE.muted, 6.8, 'normal');
  const lines = doc.splitTextToSize(helper || '', w - 14);
  doc.text(lines.slice(0, 2), x + 10, y + 23.5);
}

function addSimpleTable(doc, { x, y, width, columns, rows, rowHeight = 8, headerHeight = 8, maxRows = 10 }) {
  const visible = rows.slice(0, maxRows);
  doc.setFillColor(...PALETTE.navy);
  doc.roundedRect(x, y, width, headerHeight, 2, 2, 'F');
  let cursorX = x;
  columns.forEach(col => {
    setText(doc, PALETTE.white, 6.5, 'bold');
    doc.text(col.label, cursorX + 2.5, y + 5.3);
    cursorX += width * col.ratio;
  });

  visible.forEach((row, idx) => {
    const yy = y + headerHeight + idx * rowHeight;
    doc.setFillColor(...(idx % 2 ? PALETTE.bg : PALETTE.white));
    doc.setDrawColor(...PALETTE.line);
    doc.rect(x, yy, width, rowHeight, 'FD');
    let xx = x;
    columns.forEach(col => {
      const cellW = width * col.ratio;
      const raw = typeof col.value === 'function' ? col.value(row) : row[col.key];
      setText(doc, col.bold ? PALETTE.ink : [51, 65, 92], 6.7, col.bold ? 'bold' : 'normal');
      const lines = doc.splitTextToSize(safe(raw), cellW - 4);
      doc.text(lines.slice(0, 1), xx + 2.5, yy + 5.3);
      xx += cellW;
    });
  });

  return y + headerHeight + visible.length * rowHeight;
}

function bar(doc, x, y, width, value, max, color = PALETTE.green) {
  doc.setFillColor(...PALETTE.line);
  doc.roundedRect(x, y, width, 2.2, 1, 1, 'F');
  if (max > 0 && value > 0) {
    doc.setFillColor(...color);
    doc.roundedRect(x, y, Math.max(1, width * Math.min(value / max, 1)), 2.2, 1, 1, 'F');
  }
}

function drawLeverValue(lever) {
  if (!lever?.available) return '—';
  if (lever.key === 'ticket') return fmtMoney(lever.value);
  if (lever.key === 'recompra') return fmtPct(lever.value);
  return safe(lever.value, '0');
}

export function downloadDashboardReport(data, periodParams = {}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const periodLabel = data?.period?.label || `${periodParams.year || ''}`.trim() || 'Periodo';

  addPageHeader(doc, periodLabel, 1);

  setText(doc, PALETTE.ink, 22, 'bold');
  doc.text('Reporte ejecutivo', 14, 30);
  setText(doc, PALETTE.muted, 9, 'normal');
  doc.text('Lectura consolidada del periodo seleccionado', 14, 36);
  setText(doc, PALETTE.gold, 8, 'bold');
  doc.text(periodLabel, 196, 34, { align: 'right' });

  const levers = data?.levers || [];
  const cardGap = 4;
  const cardW = (182 - cardGap * 3) / 4;
  levers.slice(0, 4).forEach((lever, i) => {
    addMetricCard(doc, {
      x: 14 + i * (cardW + cardGap), y: 44, w: cardW,
      title: lever.name,
      value: drawLeverValue(lever),
      helper: lever.helper,
      disabled: !lever.available,
      accent: i === 1 ? PALETTE.gold : PALETTE.green,
    });
  });

  let y = sectionTitle(doc, 'Pulso del periodo', 'Resultados comerciales que pueden calcularse con la información disponible.', 14, 84, 182) + 3;
  const pulse = [
    ['Venta total', fmtMoney(data?.commercialSummary?.revenue)],
    ['Número de ventas', safe(data?.commercialSummary?.salesCount, '0')],
    ['Unidades / servicios', safe(data?.commercialSummary?.units, '0')],
    ['Clientes activos', safe(data?.commercialSummary?.activeClients, '0')],
    ['Clientes dormidos', safe(data?.commercialSummary?.dormantClients, '0')],
    ['Clientes inactivos', safe(data?.commercialSummary?.inactiveClients, '0')],
  ];
  const pulseW = (182 - 8) / 3;
  pulse.forEach((item, i) => {
    const row = Math.floor(i / 3), col = i % 3;
    roundedCard(doc, 14 + col * (pulseW + 4), y + row * 18, pulseW, 14, PALETTE.bg);
    setText(doc, PALETTE.muted, 6.8, 'bold');
    doc.text(item[0].toUpperCase(), 18 + col * (pulseW + 4), y + 5 + row * 18);
    setText(doc, PALETTE.ink, 11, 'bold');
    doc.text(item[1], 18 + col * (pulseW + 4), y + 11 + row * 18);
  });
  y += 39;

  y = sectionTitle(doc, 'Conversión comercial', 'Visibilidad del proceso desde contacto hasta recompra.', 14, y + 4, 182) + 4;
  const funnel = data?.funnel || [];
  const stepW = 182 / Math.max(funnel.length, 1);
  funnel.slice(0, 7).forEach((step, i) => {
    const x = 14 + i * stepW;
    doc.setDrawColor(...PALETTE.line);
    doc.setFillColor(...(step.available ? PALETTE.white : PALETTE.bg));
    doc.roundedRect(x, y, stepW - 2, 22, 2, 2, 'FD');
    setText(doc, step.available ? PALETTE.ink : [145, 154, 164], 6.5, 'bold');
    const title = doc.splitTextToSize(step.stage, stepW - 6);
    doc.text(title.slice(0, 2), x + 3, y + 6);
    setText(doc, step.available ? PALETTE.green : PALETTE.muted, 9.5, 'bold');
    doc.text(step.available ? safe(step.value, '0') : '—', x + 3, y + 17);
  });

  y += 31;
  y = sectionTitle(doc, 'Fuerza de ventas', 'Participación individual en el resultado comercial del periodo.', 14, y, 182) + 4;
  y = addSimpleTable(doc, {
    x: 14, y, width: 182,
    columns: [
      { label: 'Vendedor', ratio: .29, value: r => r.name, bold: true },
      { label: 'Venta', ratio: .2, value: r => fmtMoney(r.revenue) },
      { label: 'Unidades', ratio: .14, value: r => safe(r.units, '—') },
      { label: 'Ticket', ratio: .19, value: r => fmtMoney(r.avgTicket) },
      { label: '% periodo', ratio: .18, value: r => fmtPct(r.revenueShare) },
    ],
    rows: data?.salesForce || [], maxRows: 6,
  });

  doc.addPage();
  addPageHeader(doc, periodLabel, 2);
  y = 26;

  y = sectionTitle(doc, 'Top productos / servicios', 'Los productos con mayor peso comercial durante el periodo.', 14, y, 182) + 4;
  y = addSimpleTable(doc, {
    x: 14, y, width: 182,
    columns: [
      { label: '#', ratio: .07, value: r => r._rank },
      { label: 'Producto / servicio', ratio: .38, value: r => r.name, bold: true },
      { label: 'Categoría', ratio: .21, value: r => r.category },
      { label: 'Venta', ratio: .18, value: r => fmtMoney(r.revenue) },
      { label: '% periodo', ratio: .16, value: r => fmtPct(r.revenueShare) },
    ],
    rows: (data?.topProducts || []).map((r, i) => ({ ...r, _rank: i + 1 })), maxRows: 10,
  });

  // Visual concentration bars for top products
  const products = data?.topProducts || [];
  if (products.length) {
    const maxProduct = Math.max(...products.map(x => Number(x.revenue) || 0), 1);
    y += 6;
    setText(doc, PALETTE.muted, 7, 'bold');
    doc.text('CONCENTRACIÓN DE VENTA', 14, y);
    y += 4;
    products.slice(0, 5).forEach((p) => {
      setText(doc, PALETTE.ink, 7, 'normal');
      doc.text(doc.splitTextToSize(p.name, 58)[0], 14, y + 2);
      bar(doc, 76, y, 92, Number(p.revenue) || 0, maxProduct, PALETTE.green);
      setText(doc, PALETTE.muted, 6.5, 'bold');
      doc.text(fmtPct(p.revenueShare), 196, y + 2, { align: 'right' });
      y += 6;
    });
  }

  y += 6;
  y = sectionTitle(doc, 'Esfuerzo - resultado', 'DASH muestra estas relaciones únicamente cuando los datos permiten sostenerlas.', 14, y, 182) + 4;
  const effortAvailable = data?.effortResponses?.available && data?.effortResponses?.data?.length;
  if (effortAvailable) {
    y = addSimpleTable(doc, {
      x: 14, y, width: 182,
      columns: [
        { label: 'Esfuerzo', ratio: .46, value: r => r.name, bold: true },
        { label: 'Contactos', ratio: .16, value: r => safe(r.contacts, '0') },
        { label: 'Clientes', ratio: .16, value: r => safe(r.clients, '0') },
        { label: 'Ventas', ratio: .22, value: r => fmtMoney(r.sales) },
      ],
      rows: data.effortResponses.data, maxRows: 6,
    });
  } else {
    roundedCard(doc, 14, y, 182, 18, PALETTE.bg);
    setText(doc, PALETTE.ink, 8, 'bold');
    doc.text('Dato por activar', 19, y + 7);
    setText(doc, PALETTE.muted, 7, 'normal');
    doc.text('Al registrar esfuerzos y medios, DASH podrá comparar contactos, conversiones y venta relacionada.', 19, y + 13);
    y += 18;
  }

  doc.addPage();
  addPageHeader(doc, periodLabel, 3);
  y = 28;
  y = sectionTitle(doc, 'Preguntas para decidir', 'Señales que conviene discutir a partir de este periodo.', 14, y, 182) + 4;
  (data?.questions || []).slice(0, 8).forEach((q, i) => {
    roundedCard(doc, 14, y - 1, 182, 14, i % 2 ? PALETTE.bg : PALETTE.white);
    doc.setFillColor(...PALETTE.cream);
    doc.circle(19, y + 5.5, 2.5, 'F');
    setText(doc, PALETTE.gold, 6.8, 'bold');
    doc.text(String(i + 1), 19, y + 6.2, { align: 'center' });
    setText(doc, PALETTE.ink, 7.5, 'normal');
    const lines = doc.splitTextToSize(q, 164);
    doc.text(lines.slice(0, 2), 25, y + 4.2);
    y += 17;
  });

  const unavailable = data?.quality?.unavailable || [];
  if (unavailable.length) {
    y += 5;
    y = sectionTitle(doc, 'Potencial por desbloquear', 'Información adicional que aumentará la profundidad del análisis.', 14, y, 182) + 4;
    for (const item of unavailable.slice(0, 5)) {
      if (y > 262) break;
      roundedCard(doc, 14, y - 1, 182, 18, PALETTE.bg);
      setText(doc, PALETTE.green, 7.2, 'bold');
      doc.text(item.title, 19, y + 5);
      setText(doc, PALETTE.muted, 6.7, 'normal');
      const lines = doc.splitTextToSize(item.message, 170);
      doc.text(lines.slice(0, 2), 19, y + 10);
      y += 21;
    }
  }

  const filePeriod = String(periodLabel).replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+/g, '_').replace(/^_+|_+$/g, '');
  doc.save(`DASH_Casa_Margot_${filePeriod || 'Reporte'}.pdf`);
}