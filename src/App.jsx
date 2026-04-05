import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { usePushNotifications } from "./usePushNotifications";

const INIT_PRODUCTS = [
  {
    id: 1,
    name: "Mesa rectangular (8 pers.)",
    total: 20,
    rented: 10,
    price: 15.0,
    unit: "unidad",
  },
  {
    id: 2,
    name: "Silla plastico blanco",
    total: 200,
    rented: 80,
    price: 1.5,
    unit: "unidad",
  },
  {
    id: 3,
    name: "Inflable castillo grande",
    total: 3,
    rented: 2,
    price: 75.0,
    unit: "unidad",
  },
  {
    id: 4,
    name: "Inflable castillo mediano",
    total: 5,
    rented: 4,
    price: 55.0,
    unit: "unidad",
  },
  {
    id: 5,
    name: "Mantel blanco",
    total: 40,
    rented: 26,
    price: 5.0,
    unit: "unidad",
  },
  {
    id: 6,
    name: "Luz decorativa (set)",
    total: 10,
    rented: 2,
    price: 20.0,
    unit: "set",
  },
];

const INIT_RESERVATIONS = [
  {
    id: "RES-001",
    client: "Maria Rodriguez",
    phone: "+297744-5678",
    event: "Quinceanera Rodriguez",
    location: "Villa Rosario, Noord",
    delivery: "2026-04-05",
    pickup: "2026-04-06",
    status: "activa",
    items: [
      { name: "Mesa rectangular (8 pers.)", qty: 10, days: 1, price: 15.0 },
      { name: "Silla plastico blanco", qty: 80, days: 1, price: 1.5 },
      { name: "Inflable castillo grande", qty: 1, days: 1, price: 75.0 },
    ],
  },
  {
    id: "RES-002",
    client: "Aruba Bank N.V.",
    phone: "+297583-0000",
    event: "Evento Corporativo Aruba Bank",
    location: "Oranjestad Centro",
    delivery: "2026-04-07",
    pickup: "2026-04-08",
    status: "activa",
    items: [
      { name: "Mesa rectangular (8 pers.)", qty: 20, days: 1, price: 15.0 },
      { name: "Silla plastico blanco", qty: 150, days: 1, price: 1.5 },
    ],
  },
  {
    id: "RES-003",
    client: "Jose Maduro",
    phone: "+297741-2233",
    event: "Cumpleanos Maduro",
    location: "San Nicolas",
    delivery: "2026-04-03",
    pickup: "2026-04-03",
    status: "pendiente-recogida",
    items: [
      { name: "Silla plastico blanco", qty: 40, days: 1, price: 1.5 },
      { name: "Mesa rectangular (8 pers.)", qty: 5, days: 1, price: 15.0 },
    ],
  },
];

const COMPANY = {
  name: "Feliz RentEnterprise",
  address: "Pos chiquito 22B",
  phone: "+297 375 7020",
  email: "felizenterprise@gmail.com",
  taxId: "KvY # 46903.0",
  bank: "Aruba Bank N.V.",
  account: "2611730190",
};

function formatDate(d) {
  if (!d) return "-";
  var p = d.split("-");
  return p[2] + "/" + p[1] + "/" + p[0];
}
function daysBetween(a, b) {
  if (!a || !b) return 1;
  return Math.max(1, Math.ceil((new Date(b) - new Date(a)) / 86400000));
}
function resTotal(res) {
  return res.items.reduce(function (s, i) {
    return s + i.qty * daysBetween(res.delivery, res.pickup) * i.price;
  }, 0);
}
function isToday(d) {
  return d === new Date().toLocaleDateString("en-CA");
}
function isTomorrow(d) {
  var t = new Date();
  t.setDate(t.getDate() + 1);
  return d === t.toLocaleDateString("en-CA");
}
function alertLevel(res) {
  if (isToday(res.pickup)) return "danger";
  if (isTomorrow(res.pickup)) return "warning";
  return "info";
}
function buildWAMsg(r) {
  var when = isToday(r.pickup) ? "hoy" : "manana";
  var lines = r.items
    .map(function (i) {
      return "- " + i.name + ": " + i.qty;
    })
    .join("\n");
  return (
    "Hola " +
    r.client +
    ", recordatorio recogida evento " +
    r.event +
    " " +
    when +
    ".\n\nProductos:\n" +
    lines +
    "\n\nLugar: " +
    r.location +
    ".\nFeliz RentEnterprise."
  );
}
function buildWAInvoice(r, total) {
  return (
    "Hola " +
    r.client +
    ", factura evento " +
    r.event +
    ". Total: AWG " +
    (total * 1.015).toFixed(2) +
    " (BBO 1.5%). Feliz RentEnterprise."
  );
}

function generateInvoicePDF(reservation, invoiceNum, deposit, notes) {
  if (!deposit) deposit = 0;
  if (!notes) notes = "";
  var doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  var W = 210, M = 18, CW = W - M * 2;
  var y = 0;
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, W, 58, "F");
  doc.setFillColor(26, 26, 46);
  doc.rect(0, 58, W, 2, "F");
  doc.setFillColor(233, 69, 96);
  doc.rect(0, 60, W, 2, "F");
  doc.setFillColor(248, 249, 250);
  doc.rect(0, 62, W, 4, "F");
  try {
    doc.addImage(window.location.origin + "/fr.png", "JPEG", M, 6, 32, 32);
  } catch (e) {}
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(26, 26, 46);
  doc.text(COMPANY.name, M + 36, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(COMPANY.address, M + 36, 20);
  doc.text("Tel: " + COMPANY.phone + "  |  " + COMPANY.email, M + 36, 25);
  doc.text("COR / Tax ID: " + COMPANY.taxId, M + 36, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(233, 69, 96);
  doc.text("FACTURA", W - M, 16, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(invoiceNum, W - M, 24, { align: "right" });
  var td = new Date().toLocaleDateString("es-AW", { day: "2-digit", month: "long", year: "numeric" });
  doc.setFontSize(9);
  doc.text("Fecha: " + td, W - M, 31, { align: "right" });
  doc.text("Reserva: " + reservation.id, W - M, 37, { align: "right" });
  y = 74;
  var boxH = 38;
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(M, y, CW / 2 - 3, boxH, 2, 2, "F");
  doc.setDrawColor(222, 226, 230);
  doc.setLineWidth(0.3);
  doc.roundedRect(M, y, CW / 2 - 3, boxH, 2, 2, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(233, 69, 96);
  doc.text("CLIENTE", M + 4, y + 7);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(26, 26, 46);
  doc.text(reservation.client, M + 4, y + 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text("Tel: " + reservation.phone, M + 4, y + 21);
  doc.text("Evento: " + reservation.event, M + 4, y + 28);
  doc.text("Lugar: " + reservation.location, M + 4, y + 35);
  var ex = M + CW / 2 + 3;
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(ex, y, CW / 2 - 3, boxH, 2, 2, "F");
  doc.roundedRect(ex, y, CW / 2 - 3, boxH, 2, 2, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(233, 69, 96);
  doc.text("DETALLES DEL EVENTO", ex + 4, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(26, 26, 46);
  doc.text("Entrega: " + formatDate(reservation.delivery), ex + 4, y + 16);
  doc.text("Recogida: " + formatDate(reservation.pickup), ex + 4, y + 24);
  doc.text("Dias: " + (daysBetween(reservation.delivery, reservation.pickup) || 1), ex + 4, y + 32);
  y += boxH + 10;
  var subtotal = 0;
  var tableRows = reservation.items.map(function (item) {
    var days = daysBetween(reservation.delivery, reservation.pickup) || item.days || 1;
    var tot = item.qty * days * item.price;
    subtotal += tot;
    return [item.name, item.qty.toString(), days.toString(), "AWG " + item.price.toFixed(2), "AWG " + tot.toFixed(2)];
  });
  autoTable(doc, {
    startY: y,
    head: [["Descripcion", "Cant.", "Dias", "Precio Unit. AWG", "Total AWG"]],
    body: tableRows,
    margin: { left: M, right: M },
    theme: "grid",
    headStyles: { fillColor: [26, 26, 46], textColor: 255, fontStyle: "bold", fontSize: 8, halign: "center" },
    columnStyles: { 0: { cellWidth: CW * 0.38, halign: "left" }, 1: { cellWidth: CW * 0.1, halign: "center" }, 2: { cellWidth: CW * 0.1, halign: "center" }, 3: { cellWidth: CW * 0.22, halign: "right" }, 4: { cellWidth: CW * 0.2, halign: "right" } },
    bodyStyles: { fontSize: 9, textColor: [33, 37, 41] },
    alternateRowStyles: { fillColor: [248, 249, 250] },
    styles: { lineColor: [222, 226, 230], lineWidth: 0.3 },
  });
  y = doc.lastAutoTable.finalY + 6;
  var bboAmt = subtotal * 0.015;
  var totalDue = subtotal + bboAmt - deposit;
  doc.setFillColor(248, 249, 250);
  doc.rect(M, y, CW, 8, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text("Subtotal", M + 4, y + 5.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(26, 26, 46);
  doc.text("AWG " + subtotal.toFixed(2), M + CW - 2, y + 5.5, { align: "right" });
  y += 8;
  doc.setFillColor(248, 249, 250);
  doc.rect(M, y, CW, 8, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text("BBO (1.5%) - Belasting op Bedrijfsomzetten", M + 4, y + 5.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(26, 26, 46);
  doc.text("AWG " + bboAmt.toFixed(2), M + CW - 2, y + 5.5, { align: "right" });
  y += 10;
  if (deposit > 0) {
    doc.setFillColor(248, 249, 250);
    doc.rect(M, y, CW, 8, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text("Deposito pagado", M + 4, y + 5.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 26, 46);
    doc.text("- AWG " + deposit.toFixed(2), M + CW - 2, y + 5.5, { align: "right" });
    y += 10;
  }
  doc.setFillColor(233, 69, 96);
  doc.rect(M, y, CW, 1, "F");
  y += 1;
  doc.setFillColor(26, 26, 46);
  doc.rect(M, y, CW, 12, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("TOTAL A PAGAR", M + 4, y + 8);
  doc.setFontSize(13);
  doc.text("AWG " + totalDue.toFixed(2), M + CW - 2, y + 8, { align: "right" });
  y += 16;
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(M, y, CW, 22, 3, 3, "F");
  doc.setDrawColor(222, 226, 230);
  doc.setLineWidth(0.3);
  doc.roundedRect(M, y, CW, 22, 3, 3, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(233, 69, 96);
  doc.text("INFORMACION DE PAGO", M + 4, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);
  doc.text("Banco: " + COMPANY.bank + "  |  Cuenta: " + COMPANY.account + "  |  A nombre de: " + COMPANY.name, M + 4, y + 13);
  doc.text("Metodos: Efectivo - Transferencia bancaria - Tarjeta", M + 4, y + 19);
  y += 28;
  if (notes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(50, 50, 50);
    doc.text("Notas: ", M, y + 5);
    doc.setFont("helvetica", "normal");
    doc.text(notes, M + 14, y + 5);
    y += 10;
  }
  var pH = 297;
  doc.setDrawColor(222, 226, 230);
  doc.setLineWidth(0.3);
  doc.line(M, pH - 22, W - M, pH - 22);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(108, 117, 125);
  doc.text("Factura generada conforme a la regulacion fiscal de Aruba - DIMP (Departamento Impuesto y Aduana)", W / 2, pH - 15, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text("BBO registrado bajo la Landsverordening Belasting op Bedrijfsomzetten | " + COMPANY.name + " (c) " + new Date().getFullYear(), W / 2, pH - 9, { align: "center" });
  doc.save(invoiceNum + "_" + reservation.client.replace(/\s/g, "_") + ".pdf");
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  // Backgrounds
  bg0: "#0b0f1a", // page bg
  bg1: "#111827", // surface
  bg2: "#161d2e", // card
  bg3: "#1e2740", // elevated / input
  bgHov: "#1a2236", // hover state

  // Brand
  accent: "#e94560",
  accentDim: "rgba(233,69,96,0.12)",
  accentBorder: "rgba(233,69,96,0.35)",

  // Text
  t1: "#f0f2f8", // primary
  t2: "#8892a4", // secondary
  t3: "#4e5a70", // tertiary / placeholder

  // Borders
  b1: "rgba(255,255,255,0.07)",
  b2: "rgba(255,255,255,0.12)",

  // Semantic
  green: "#34d399",
  greenDim: "rgba(52,211,153,0.12)",
  greenBorder: "rgba(52,211,153,0.3)",
  amber: "#f59e0b",
  amberDim: "rgba(245,158,11,0.12)",
  amberBorder: "rgba(245,158,11,0.3)",
  red: "#f87171",
  redDim: "rgba(248,113,113,0.12)",
  redBorder: "rgba(248,113,113,0.3)",
  blue: "#60a5fa",
  blueDim: "rgba(96,165,250,0.12)",
  blueBorder: "rgba(96,165,250,0.3)",
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Inter', sans-serif;
  background: ${T.bg0};
  color: ${T.t1};
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

.app {
  max-width: 860px;
  margin: 0 auto;
  padding: 16px 14px 40px;
}

/* ── TOP BAR ── */
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: ${T.bg1};
  border: 1px solid ${T.b1};
  border-radius: 14px;
  margin-bottom: 14px;
}
.topbar-left { display: flex; align-items: center; gap: 10px; }
.accent-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: ${T.accent};
  box-shadow: 0 0 8px ${T.accent}88;
  flex-shrink: 0;
}
.topbar-title { font-size: 16px; font-weight: 600; color: ${T.t1}; letter-spacing: -0.01em; }
.topbar-sub { font-size: 11px; color: ${T.t3}; margin-top: 2px; }
.topbar-right { text-align: right; }
.topbar-date { font-size: 11px; color: ${T.t3}; }
.topbar-alert { font-size: 11px; color: ${T.accent}; font-weight: 500; margin-top: 3px; }
.topbar-alert.ok { color: ${T.green}; }

/* ── NAV TABS ── */
.tabs {
  display: flex;
  background: ${T.bg1};
  border: 1px solid ${T.b1};
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 16px;
  gap: 2px;
  overflow-x: auto;
  scrollbar-width: none;
}
.tabs::-webkit-scrollbar { display: none; }
.tab {
  flex: 1;
  min-width: 64px;
  padding: 7px 8px;
  font-size: 12px;
  font-weight: 500;
  border: none;
  background: none;
  border-radius: 8px;
  cursor: pointer;
  color: ${T.t3};
  transition: all .15s;
  white-space: nowrap;
  text-align: center;
}
.tab:hover { color: ${T.t2}; background: ${T.bgHov}; }
.tab.active {
  background: ${T.bg3};
  color: ${T.t1};
  border-bottom: 2px solid ${T.accent};
  padding-bottom: 5px;
}

/* ── CARDS ── */
.card {
  background: ${T.bg2};
  border: 1px solid ${T.b1};
  border-radius: 14px;
  padding: 18px;
  margin-bottom: 12px;
}

/* ── KPI METRICS ── */
.metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 12px;
}
.metric {
  background: ${T.bg2};
  border: 1px solid ${T.b1};
  border-radius: 12px;
  padding: 14px 16px;
  position: relative;
  overflow: hidden;
}
.metric::before {
  content: '';
  position: absolute;
  top: 0; left: 0;
  width: 3px; height: 100%;
  border-radius: 12px 0 0 12px;
}
.metric.neutral::before { background: ${T.t3}; }
.metric.alert::before   { background: ${T.accent}; }
.metric.income::before  { background: ${T.green}; }
.metric-label {
  font-size: 10px;
  color: ${T.t3};
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 500;
  margin-bottom: 6px;
}
.metric-val { font-size: 26px; font-weight: 600; color: ${T.t1}; letter-spacing: -0.02em; }
.metric-val.accent { color: ${T.accent}; }
.metric-val.green  { color: ${T.green};  }
.metric-hint { font-size: 10px; color: ${T.t3}; margin-top: 4px; }

/* ── SECTION TITLES ── */
.section-title {
  font-size: 11px;
  font-weight: 600;
  color: ${T.t3};
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* ── ALERT ITEMS (dashboard / alertas) ── */
.alert-item {
  border-left: 2px solid;
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 8px;
  background: ${T.bg3};
}
.alert-item.danger  { border-color: ${T.accent};  }
.alert-item.warning { border-color: ${T.amber};   }
.alert-item.info    { border-color: ${T.blue};    }
.alert-title { font-size: 13px; font-weight: 600; color: ${T.t1}; margin-bottom: 3px; }
.alert-sub   { font-size: 12px; color: ${T.t2}; }

/* ── BADGES ── */
.badge {
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 20px;
  font-weight: 500;
}
.badge-danger  { background: ${T.redDim};   color: ${T.red};   border: 1px solid ${T.redBorder};   }
.badge-warning { background: ${T.amberDim}; color: ${T.amber}; border: 1px solid ${T.amberBorder}; }
.badge-info    { background: ${T.blueDim};  color: ${T.blue};  border: 1px solid ${T.blueBorder};  }
.badge-success { background: ${T.greenDim}; color: ${T.green}; border: 1px solid ${T.greenBorder}; }

/* ── BUTTONS ── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 14px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid ${T.b2};
  border-radius: 8px;
  background: ${T.bg3};
  color: ${T.t2};
  cursor: pointer;
  transition: all .13s;
  white-space: nowrap;
  font-family: inherit;
}
.btn:hover { background: ${T.bgHov}; color: ${T.t1}; border-color: ${T.b2}; }

/* Primary — dark fill, used for main form submit */
.btn-primary {
  background: ${T.bg3};
  color: ${T.t1};
  border-color: ${T.b2};
}
.btn-primary:hover { background: #243050; }

/* Accent — brand red, one per section max */
.btn-accent {
  background: ${T.accentDim};
  color: ${T.accent};
  border-color: ${T.accentBorder};
}
.btn-accent:hover { background: rgba(233,69,96,0.2); }

/* Ghost green (WhatsApp) */
.btn-wa {
  background: rgba(52,211,153,0.08);
  color: ${T.green};
  border-color: ${T.greenBorder};
}
.btn-wa:hover { background: rgba(52,211,153,0.15); }

/* Ghost blue (Twilio) */
.btn-twilio {
  background: rgba(96,165,250,0.08);
  color: ${T.blue};
  border-color: ${T.blueBorder};
}
.btn-twilio:hover { background: rgba(96,165,250,0.15); }

.btn-sm { padding: 5px 11px; font-size: 11px; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

.row-actions { display: flex; gap: 6px; margin-top: 10px; flex-wrap: wrap; }

/* ── FORM ELEMENTS ── */
label {
  display: block;
  font-size: 11px;
  font-weight: 500;
  color: ${T.t3};
  margin-bottom: 5px;
  margin-top: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
input, select, textarea {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid ${T.b2};
  border-radius: 9px;
  font-size: 13px;
  background: ${T.bg3};
  color: ${T.t1};
  outline: none;
  font-family: inherit;
  transition: border-color .13s, box-shadow .13s;
}
input::placeholder { color: ${T.t3}; }
input:focus, select:focus, textarea:focus {
  border-color: rgba(233,69,96,0.5);
  box-shadow: 0 0 0 3px rgba(233,69,96,0.08);
}
select option { background: ${T.bg3}; color: ${T.t1}; }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

/* ── INVENTORY TABLE ── */
.inv-table-wrap {
  background: ${T.bg2};
  border: 1px solid ${T.b1};
  border-radius: 14px;
  overflow: hidden;
}
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th {
  font-size: 10px;
  font-weight: 600;
  color: ${T.t3};
  text-align: left;
  padding: 10px 14px;
  border-bottom: 1px solid ${T.b1};
  text-transform: uppercase;
  letter-spacing: 0.06em;
  background: ${T.bg1};
}
td {
  padding: 11px 14px;
  border-bottom: 1px solid ${T.b1};
  vertical-align: middle;
  color: ${T.t1};
}
tr:last-child td { border-bottom: none; }
tr:hover td { background: ${T.bgHov}; }

.progress { height: 4px; background: ${T.bg0}; border-radius: 2px; overflow: hidden; width: 60px; }
.progress-fill { height: 100%; border-radius: 2px; }

/* ── RESERVATION CARDS ── */
.res-card {
  background: ${T.bg2};
  border: 1px solid ${T.b1};
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 10px;
  transition: border-color .13s;
}
.res-card:hover { border-color: ${T.b2}; }
.res-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
.res-id {
  font-size: 10px;
  color: ${T.t3};
  font-family: 'JetBrains Mono', monospace;
  margin-bottom: 3px;
  letter-spacing: 0.05em;
}
.res-client { font-size: 14px; font-weight: 600; color: ${T.t1}; margin-bottom: 2px; }
.res-event  { font-size: 12px; color: ${T.t2}; }
.res-amount { font-size: 15px; font-weight: 600; color: ${T.green}; margin-top: 4px; }
.res-amount-sub { font-size: 10px; color: ${T.t3}; margin-top: 1px; }
.res-details {
  display: flex;
  gap: 16px;
  margin: 8px 0;
  font-size: 11px;
  color: ${T.t3};
}
.res-items {
  font-size: 12px;
  color: ${T.t2};
  background: ${T.bg3};
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 4px;
  line-height: 1.6;
}

/* ── EMPTY STATE ── */
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 28px 16px;
  color: ${T.t3};
  font-size: 13px;
}
.empty-icon {
  width: 36px; height: 36px;
  border-radius: 10px;
  background: ${T.bg3};
  display: flex; align-items: center; justify-content: center;
  font-size: 16px;
  color: ${T.t3};
}
.empty-label { font-weight: 500; color: ${T.t2}; }
.empty-sub { font-size: 11px; }

/* ── TOTAL SUMMARY BOX ── */
.total-box {
  background: ${T.bg3};
  border: 1px solid ${T.b1};
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 14px;
  font-size: 13px;
}
.total-row { display: flex; justify-content: space-between; padding: 3px 0; color: ${T.t2}; }
.total-row.main { color: ${T.t1}; font-weight: 600; border-top: 1px solid ${T.b1}; margin-top: 6px; padding-top: 8px; font-size: 14px; }

/* ── MODAL ── */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.65);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
  animation: fadeIn .18s ease;
  padding: 16px;
}
.modal-content {
  background: ${T.bg2};
  border: 1px solid ${T.b2};
  border-radius: 16px;
  max-width: 480px;
  width: 100%;
  max-height: 88vh;
  overflow: auto;
  animation: slideUp .22s ease;
}
.modal-header {
  background: ${T.bg1};
  border-bottom: 1px solid ${T.b1};
  padding: 18px 20px;
  border-radius: 16px 16px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-header h2 { font-size: 15px; font-weight: 600; color: ${T.t1}; }
.modal-close {
  background: none; border: none; color: ${T.t3};
  font-size: 20px; cursor: pointer; line-height: 1; padding: 2px;
}
.modal-close:hover { color: ${T.t1}; }
.modal-body { padding: 20px; }
.modal-section { margin-bottom: 18px; }
.modal-section-title {
  font-size: 10px; font-weight: 600; color: ${T.t3};
  text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 10px;
}
.modal-info { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.modal-info-item {
  background: ${T.bg3};
  border: 1px solid ${T.b1};
  border-radius: 8px;
  padding: 10px 12px;
}
.modal-info-label { font-size: 10px; color: ${T.t3}; margin-bottom: 3px; }
.modal-info-value { font-size: 13px; font-weight: 600; color: ${T.t1}; }
.modal-products {
  background: ${T.bg3};
  border: 1px solid ${T.b1};
  border-radius: 10px;
  overflow: hidden;
}
.modal-product-header {
  background: ${T.bg1};
  display: grid; grid-template-columns: 1fr 60px 80px;
  padding: 8px 14px;
  font-size: 10px; font-weight: 600; color: ${T.t3};
  text-transform: uppercase; letter-spacing: 0.05em;
}
.modal-product-row {
  display: grid; grid-template-columns: 1fr 60px 80px;
  padding: 10px 14px;
  border-top: 1px solid ${T.b1};
  font-size: 12px; color: ${T.t1};
}
.modal-product-qty   { color: ${T.blue};  font-weight: 600; text-align: center; }
.modal-product-price { color: ${T.green}; font-weight: 600; text-align: right;  }
.modal-total {
  background: ${T.bg1};
  border: 1px solid ${T.b1};
  border-radius: 10px;
  padding: 14px 16px;
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 12px;
}
.modal-total-label { font-size: 13px; color: ${T.t2}; }
.modal-total-value { font-size: 18px; font-weight: 700; color: ${T.green}; }

/* ── NOTIFICATION ── */
.notification {
  position: fixed; top: 16px; right: 16px;
  background: ${T.bg1};
  color: ${T.t1};
  padding: 12px 18px;
  border-radius: 12px;
  font-size: 13px;
  z-index: 9999;
  border: 1px solid ${T.b2};
  border-left: 3px solid ${T.accent};
  animation: slideIn .2s ease;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
}

/* ── INLINE DIVIDER ── */
.inv-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid ${T.b1};
}
.inv-row:last-child { border: none; }

@keyframes fadeIn  { from { opacity: 0 }             to { opacity: 1 } }
@keyframes slideUp { from { transform: translateY(24px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
@keyframes slideIn { from { transform: translateX(100%); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
`;

export default function App() {
  var initProducts = function () {
    var s = localStorage.getItem("aruba_products");
    return s ? JSON.parse(s) : INIT_PRODUCTS;
  };
  var initReservations = function () {
    var s = localStorage.getItem("aruba_reservations");
    return s ? JSON.parse(s) : INIT_RESERVATIONS;
  };
  var initCounter = function () {
    var s = localStorage.getItem("aruba_counter");
    return s ? parseInt(s) : 43;
  };

  var [tab, setTab] = useState("dashboard");
  var [products, setProducts] = useState(initProducts);
  var [reservations, setReservations] = useState(initReservations);
  var [notification, setNotification] = useState(null);
  var [showWelcome, setShowWelcome] = useState(false);
  var [invoiceCounter, setInvoiceCounter] = useState(initCounter);
  var [sendingWA, setSendingWA] = useState(false);
  var [selectedAlert, setSelectedAlert] = useState(null);
  var [form, setForm] = useState({
    client: "",
    phone: "",
    event: "",
    location: "",
    delivery: "",
    pickup: "",
    items: [{ name: "", qty: 1, days: 1, price: 0 }],
  });
  var [pForm, setPForm] = useState({
    name: "",
    total: 0,
    price: 0,
    unit: "unidad",
  });

  var { testNotification } = usePushNotifications(reservations);

  useEffect(
    function () {
      localStorage.setItem("aruba_products", JSON.stringify(products));
    },
    [products],
  );
  useEffect(
    function () {
      localStorage.setItem("aruba_reservations", JSON.stringify(reservations));
    },
    [reservations],
  );
  useEffect(
    function () {
      localStorage.setItem("aruba_counter", String(invoiceCounter));
    },
    [invoiceCounter],
  );

  var pickupAlerts = reservations.filter(function (r) {
    return (
      r.status !== "recogido" && (isToday(r.pickup) || isTomorrow(r.pickup))
    );
  });
  var deliveryAlerts = reservations.filter(function (r) {
    return (
      r.status !== "recogido" && (isToday(r.delivery) || isTomorrow(r.delivery))
    );
  });
  var lowStock = products.filter(function (p) {
    return (p.total - p.rented) / p.total < 0.25;
  });
  var activeRes = reservations.filter(function (r) {
    return r.status !== "recogido";
  }).length;
  var todayPickups = reservations.filter(function (r) {
    return isToday(r.pickup) && r.status !== "recogido";
  }).length;
  var todayDeliveries = reservations.filter(function (r) {
    return isToday(r.delivery) && r.status !== "recogido";
  }).length;
  var monthRevenue = reservations.reduce(function (s, r) {
    return s + resTotal(r);
  }, 0);

  useEffect(function () {
    if (pickupAlerts.length > 0 || deliveryAlerts.length > 0) {
      setShowWelcome(true);
    }
  }, [pickupAlerts.length, deliveryAlerts.length]);

  var todayPickupAlerts = pickupAlerts.filter(function (r) { return isToday(r.pickup); });
  var tomorrowPickupAlerts = pickupAlerts.filter(function (r) { return isTomorrow(r.pickup); });
  var todayDeliveryAlerts = deliveryAlerts.filter(function (r) { return isToday(r.delivery); });
  var tomorrowDeliveryAlerts = deliveryAlerts.filter(function (r) { return isTomorrow(r.delivery); });

  useEffect(
    function () {
      if (pickupAlerts.length > 0) {
        try {
          var ctx = new (window.AudioContext || window.webkitAudioContext)();
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 880;
          osc.type = "sine";
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          osc.start();
          osc.stop(ctx.currentTime + 0.3);
        } catch (e) {}
      }
    },
    [pickupAlerts.length],
  );

  function notify(msg) {
    setNotification(msg);
    setTimeout(function () {
      setNotification(null);
    }, 3500);
  }

  function markPickedUp(id) {
    var res = reservations.find(function (r) {
      return r.id === id;
    });
    if (res) {
      setProducts(function (prev) {
        return prev.map(function (p) {
          var m = res.items.find(function (i) {
            return i.name === p.name;
          });
          return m
            ? Object.assign({}, p, { rented: Math.max(0, p.rented - m.qty) })
            : p;
        });
      });
    }
    setReservations(function (prev) {
      return prev.map(function (r) {
        return r.id === id ? Object.assign({}, r, { status: "recogido" }) : r;
      });
    });
    notify("Recogida marcada como completada");
  }

  function markDelivered(id) {
    setReservations(function (prev) {
      return prev.map(function (r) {
        return r.id === id ? Object.assign({}, r, { status: "entregado" }) : r;
      });
    });
    notify("Entrega marcada como completada");
  }

  function openWhatsApp(phone, msg) {
    var clean = phone.replace(/\D/g, "");
    window.open(
      "https://wa.me/" + clean + "?text=" + encodeURIComponent(msg),
      "_blank",
    );
  }

  function sendTwilioReminder(res) {
    setSendingWA(true);
    fetch("http://localhost:3001/api/whatsapp-reminder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: res.phone,
        client: res.client,
        event: res.event,
        location: res.location,
        pickup: formatDate(res.pickup),
        items: res.items,
      }),
    })
      .then(function (r) {
        return r.json();
      })
      .then(function (d) {
        notify(
          d.success ? "Mensaje enviado por WhatsApp" : "Error: " + d.error,
        );
      })
      .catch(function () {
        notify("Error de conexion con el servidor");
      })
      .finally(function () {
        setSendingWA(false);
      });
  }

  function handleGeneratePDF(res) {
    var num = "FAC-2026-" + String(invoiceCounter).padStart(4, "0");
    setInvoiceCounter(function (c) {
      return c + 1;
    });
    generateInvoicePDF(res, num, 0, "");
    notify("Factura " + num + " descargada");
  }

  function addReservation() {
    if (!form.client || !form.delivery || !form.pickup) {
      notify("Completa cliente y fechas");
      return;
    }
    var id = "RES-" + String(reservations.length + 1).padStart(3, "0");
    setProducts(function (prev) {
      return prev.map(function (p) {
        var m = form.items.find(function (i) {
          return i.name === p.name;
        });
        return m ? Object.assign({}, p, { rented: p.rented + m.qty }) : p;
      });
    });
    setReservations(function (prev) {
      return prev.concat([
        Object.assign({}, form, { id: id, status: "activa" }),
      ]);
    });
    setForm({
      client: "",
      phone: "",
      event: "",
      location: "",
      delivery: "",
      pickup: "",
      items: [{ name: "", qty: 1, days: 1, price: 0 }],
    });
    notify("Reserva " + id + " creada");
    setTab("reservas");
  }

  function addProduct() {
    if (!pForm.name || !pForm.total || !pForm.price) {
      notify("Completa todos los campos");
      return;
    }
    setProducts(function (prev) {
      return prev.concat([
        Object.assign({}, pForm, { id: Date.now(), rented: 0 }),
      ]);
    });
    setPForm({ name: "", total: 0, price: 0, unit: "unidad" });
    notify("Producto agregado");
  }

  function updateFormItem(i, field, val) {
    setForm(function (f) {
      var items = f.items.slice();
      if (field === "name" && val) {
        var prod = products.find(function (p) {
          return p.name === val;
        });
        items[i] = Object.assign({}, items[i], {
          name: val,
          price: prod ? prod.price : items[i].price,
        });
      } else {
        items[i] = Object.assign({}, items[i]);
        items[i][field] = field === "name" ? val : Number(val);
      }
      return Object.assign({}, f, { items: items });
    });
  }
  function addFormItem() {
    setForm(function (f) {
      return Object.assign({}, f, {
        items: f.items.concat([{ name: "", qty: 1, days: 1, price: 0 }]),
      });
    });
  }
  function removeFormItem(i) {
    setForm(function (f) {
      return Object.assign({}, f, {
        items: f.items.filter(function (_, idx) {
          return idx !== i;
        }),
      });
    });
  }

  var totalAlerts = pickupAlerts.length + deliveryAlerts.length + lowStock.length;

  return (
    <>
      <style>{css}</style>
      {notification && <div className="notification">{notification}</div>}

      {showWelcome && (
        <div className="modal-overlay" onClick={function () { setShowWelcome(false); }}>
          <div className="modal-content" onClick={function (e) { e.stopPropagation(); }} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h2 style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>👋</span>
                Bienvenido a Feliz RentEnterprise
              </h2>
              <button className="modal-close" onClick={function () { setShowWelcome(false); }}>✕</button>
            </div>
            <div className="modal-body">
              {(pickupAlerts.length > 0 || deliveryAlerts.length > 0) ? (
                <>
                  <div style={{ marginBottom: 16, color: T.t2, fontSize: 13 }}>
                    Tienes <strong style={{ color: T.accent }}>{pickupAlerts.length + deliveryAlerts.length}</strong> alerta{pickupAlerts.length + deliveryAlerts.length !== 1 ? "s" : ""} pendiente{pickupAlerts.length + deliveryAlerts.length !== 1 ? "s" : ""} en los próximos días.
                  </div>

                  {todayDeliveryAlerts.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <span style={{ background: T.greenDim, color: T.green, border: "1px solid " + T.greenBorder, padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 500 }}>📦 ENTREGA HOY</span>
                        <span style={{ color: T.t2, fontSize: 12 }}>{todayDeliveryAlerts.length}</span>
                      </div>
                      {todayDeliveryAlerts.map(function (r) {
                        return (
                          <div key={r.id} style={{ background: T.bg3, borderRadius: 8, padding: "10px 12px", marginBottom: 6, borderLeft: "3px solid " + T.green }}>
                            <div style={{ fontWeight: 600, color: T.t1, marginBottom: 3 }}>{r.client}</div>
                            <div style={{ fontSize: 12, color: T.t2 }}>{r.event} · {r.location}</div>
                            <div style={{ fontSize: 11, color: T.t3, marginTop: 4 }}>
                              {r.items.map(function (i) { return i.qty + "× " + i.name; }).join(", ")}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {todayPickupAlerts.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <span className="badge badge-danger">🚚 RECOGIDA HOY</span>
                        <span style={{ color: T.t2, fontSize: 12 }}>{todayPickupAlerts.length}</span>
                      </div>
                      {todayPickupAlerts.map(function (r) {
                        return (
                          <div key={r.id} style={{ background: T.bg3, borderRadius: 8, padding: "10px 12px", marginBottom: 6, borderLeft: "3px solid " + T.accent }}>
                            <div style={{ fontWeight: 600, color: T.t1, marginBottom: 3 }}>{r.client}</div>
                            <div style={{ fontSize: 12, color: T.t2 }}>{r.event} · {r.location}</div>
                            <div style={{ fontSize: 11, color: T.t3, marginTop: 4 }}>
                              {r.items.map(function (i) { return i.qty + "× " + i.name; }).join(", ")}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {tomorrowDeliveryAlerts.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <span style={{ background: T.greenDim, color: T.green, border: "1px solid " + T.greenBorder, padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 500 }}>📦 ENTREGA MAÑANA</span>
                        <span style={{ color: T.t2, fontSize: 12 }}>{tomorrowDeliveryAlerts.length}</span>
                      </div>
                      {tomorrowDeliveryAlerts.map(function (r) {
                        return (
                          <div key={r.id} style={{ background: T.bg3, borderRadius: 8, padding: "10px 12px", marginBottom: 6, borderLeft: "3px solid " + T.green }}>
                            <div style={{ fontWeight: 600, color: T.t1, marginBottom: 3 }}>{r.client}</div>
                            <div style={{ fontSize: 12, color: T.t2 }}>{r.event} · {r.location}</div>
                            <div style={{ fontSize: 11, color: T.t3, marginTop: 4 }}>
                              {r.items.map(function (i) { return i.qty + "× " + i.name; }).join(", ")}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {tomorrowPickupAlerts.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <span className="badge badge-warning">🚚 RECOGIDA MAÑANA</span>
                        <span style={{ color: T.t2, fontSize: 12 }}>{tomorrowPickupAlerts.length}</span>
                      </div>
                      {tomorrowPickupAlerts.map(function (r) {
                        return (
                          <div key={r.id} style={{ background: T.bg3, borderRadius: 8, padding: "10px 12px", marginBottom: 6, borderLeft: "3px solid " + T.amber }}>
                            <div style={{ fontWeight: 600, color: T.t1, marginBottom: 3 }}>{r.client}</div>
                            <div style={{ fontSize: 12, color: T.t2 }}>{r.event} · {r.location}</div>
                            <div style={{ fontSize: 11, color: T.t3, marginTop: 4 }}>
                              {r.items.map(function (i) { return i.qty + "× " + i.name; }).join(", ")}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                    <button className="btn btn-primary" onClick={function () { setShowWelcome(false); setTab("alertas"); }} style={{ flex: 1 }}>
                      Ver alertas
                    </button>
                    <button className="btn" onClick={function () { setShowWelcome(false); }} style={{ flex: 1 }}>
                      Cerrar
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: T.t1, marginBottom: 6 }}>¡Todo al día!</div>
                  <div style={{ color: T.t2, fontSize: 13 }}>No hay alertas pendientes.</div>
                  <button className="btn btn-primary" onClick={function () { setShowWelcome(false); }} style={{ marginTop: 16 }}>
                    Continuar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="app">
        {/* TOP BAR */}
        <div className="topbar">
          <div className="topbar-left">
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 3, boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
              <img src="/fr.png" alt="Feliz RentEnterprise" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
            </div>
            <div>
              <div className="topbar-title">Feliz RentEnterprise</div>
              <div className="topbar-sub">
                Inventario y facturación · DIMP Aruba
              </div>
            </div>
          </div>
          <div className="topbar-right">
            <div className="topbar-date">
              {new Date().toLocaleDateString("es-AW", {
                weekday: "short",
                day: "2-digit",
                month: "short",
              })}
            </div>
            <div className={"topbar-alert" + (totalAlerts === 0 ? " ok" : "")}>
              {totalAlerts === 0
                ? "✓ Sin alertas"
                : `${deliveryAlerts.length > 0 ? "📦 " + deliveryAlerts.length : ""}${deliveryAlerts.length > 0 && pickupAlerts.length > 0 ? " · " : ""}${pickupAlerts.length > 0 ? "🚚 " + pickupAlerts.length : ""}`}
            </div>
            {import.meta.env.DEV && (
              <button
                onClick={testNotification}
                style={{
                  marginTop: 4,
                  fontSize: 10,
                  padding: "2px 6px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 5,
                  color: "#8892a4",
                  cursor: "pointer",
                  display: "block",
                }}
              >
                Test notif
              </button>
            )}
          </div>
        </div>

        {/* NAV */}
        <div className="tabs">
          {[
            ["dashboard", "Dashboard"],
            ["inventario", "Inventario"],
            ["nueva-reserva", "+ Reserva"],
            ["reservas", "Reservas"],
            [
              "alertas",
              `Alertas${totalAlerts > 0 ? " (" + totalAlerts + ")" : ""}`,
            ],
          ].map(function ([key, label]) {
            return (
              <button
                key={key}
                className={"tab" + (tab === key ? " active" : "")}
                onClick={function () {
                  setTab(key);
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* ── DASHBOARD ── */}
        {tab === "dashboard" && (
          <>
            <div className="metrics">
              <div className="metric neutral">
                <div className="metric-label">Reservas activas</div>
                <div className="metric-val">{activeRes}</div>
                <div className="metric-hint">en curso</div>
              </div>
              <div className={"metric" + (todayDeliveries > 0 ? " income" : " neutral")}>
                <div className="metric-label">Entregas hoy</div>
                <div className={"metric-val" + (todayDeliveries > 0 ? " green" : "")}>{todayDeliveries}</div>
                <div className="metric-hint">{todayDeliveries > 0 ? "pendientes" : "al día"}</div>
              </div>
              <div className={"metric" + (todayPickups > 0 ? " alert" : " neutral")}>
                <div className="metric-label">Recogidas hoy</div>
                <div className={"metric-val" + (todayPickups > 0 ? " accent" : "")}>{todayPickups}</div>
                <div className="metric-hint">{todayPickups > 0 ? "pendientes" : "al día"}</div>
              </div>
            </div>

            {deliveryAlerts.length > 0 && (
              <div className="card">
                <div className="section-title">
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: T.green }}>📦</span> Entregas próximas
                  </span>
                </div>
                {deliveryAlerts.map(function (r) {
                  var isTodayDelivery = isToday(r.delivery);
                  return (
                    <div key={r.id} className={"alert-item " + (isTodayDelivery ? "danger" : "warning")} style={{ borderLeftColor: isTodayDelivery ? T.green : T.amber }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div className="alert-title">{r.client} — {r.event}</div>
                        <span style={{ background: T.greenDim, color: T.green, border: "1px solid " + T.greenBorder, padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 500 }}>
                          {isTodayDelivery ? "ENTREGA HOY" : "ENTREGA MAÑANA"}
                        </span>
                      </div>
                      <div className="alert-sub" style={{ marginTop: 2 }}>
                        {r.location} · {r.items.map(function (i) { return i.qty + "× " + i.name; }).join(", ")}
                      </div>
                      <div className="row-actions">
                        <button className="btn btn-sm" style={{ background: T.greenDim, color: T.green, borderColor: T.greenBorder }} onClick={function () { markDelivered(r.id); }}>
                          Marcar entregado
                        </button>
                        <button className="btn btn-sm btn-accent" onClick={function () { handleGeneratePDF(r); }}>PDF</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {pickupAlerts.length > 0 && (
              <div className="card">
                <div className="section-title">
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: T.accent }}>🚚</span> Recogidas próximas
                  </span>
                </div>
                {pickupAlerts.map(function (r) {
                  return (
                    <div key={r.id} className={"alert-item " + alertLevel(r)}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div className="alert-title">{r.client} — {r.event}</div>
                        <span className={"badge badge-" + alertLevel(r)}>
                          {isToday(r.pickup) ? "RECOGIDA HOY" : "RECOGIDA MAÑANA"}
                        </span>
                      </div>
                      <div className="alert-sub" style={{ marginTop: 2 }}>
                        {r.location} · {r.items.map(function (i) { return i.qty + "× " + i.name; }).join(", ")}
                      </div>
                      <div className="row-actions">
                        <button className="btn btn-sm btn-wa" onClick={function () { openWhatsApp(r.phone, buildWAMsg(r)); }}>WhatsApp</button>
                        <button className="btn btn-sm btn-twilio" disabled={sendingWA} onClick={function () { sendTwilioReminder(r); }}>{sendingWA ? "Enviando…" : "Twilio WA"}</button>
                        <button className="btn btn-sm" onClick={function () { markPickedUp(r.id); }}>Marcar recogido</button>
                        <button className="btn btn-sm btn-accent" onClick={function () { handleGeneratePDF(r); }}>PDF</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {pickupAlerts.length === 0 && deliveryAlerts.length === 0 && (
              <div className="card">
                <div className="empty">
                  <div className="empty-icon">✓</div>
                  <div className="empty-label">Todo al día</div>
                  <div className="empty-sub">Sin entregas ni recogidas urgentes</div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── INVENTARIO ── */}
        {tab === "inventario" && (
          <>
            <div className="card">
              <div className="section-title">Agregar producto</div>
              <div className="form-row">
                <div>
                  <label>Nombre del producto</label>
                  <input value={pForm.name} onChange={function (e) { setPForm(function (f) { return Object.assign({}, f, { name: e.target.value }); }); }} placeholder="Ej: Silla Tiffany" />
                </div>
                <div>
                  <label>Unidad</label>
                  <select value={pForm.unit} onChange={function (e) { setPForm(function (f) { return Object.assign({}, f, { unit: e.target.value }); }); }}>
                    <option value="unidad">Unidad</option>
                    <option value="set">Set</option>
                    <option value="metro">Metro</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div>
                  <label>Cantidad total</label>
                  <input type="number" min="1" value={pForm.total} onChange={function (e) { setPForm(function (f) { return Object.assign({}, f, { total: +e.target.value }); }); }} />
                </div>
                <div>
                  <label>Precio por día (AWG)</label>
                  <input type="number" min="0" step="0.50" value={pForm.price} onChange={function (e) { setPForm(function (f) { return Object.assign({}, f, { price: +e.target.value }); }); }} />
                </div>
              </div>
              <button className="btn btn-accent" style={{ marginTop: 14 }} onClick={addProduct}>+ Agregar producto</button>
            </div>

            <div className="inv-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ padding: "10px 14px" }}>Producto</th>
                    <th>Total</th>
                    <th>Disponible</th>
                    <th>Precio / día</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(function (p) {
                    var avail = p.total - p.rented;
                    var pct = avail / p.total;
                    return (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 500 }}>{p.name}</td>
                        <td style={{ color: T.t2 }}>{p.total}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div className="progress">
                              <div className="progress-fill" style={{ width: pct * 100 + "%", background: pct < 0.15 ? T.accent : pct < 0.35 ? T.amber : T.green }} />
                            </div>
                            <span style={{ color: T.t2, fontSize: 12 }}>{avail}</span>
                          </div>
                        </td>
                        <td style={{ color: T.t2, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>AWG {p.price.toFixed(2)}</td>
                        <td>
                          <span className={"badge " + (pct < 0.15 ? "badge-danger" : pct < 0.35 ? "badge-warning" : "badge-success")}>
                            {pct < 0.15 ? "Crítico" : pct < 0.35 ? "Bajo" : "OK"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── INVENTARIO ── */}
        {tab === "inventario" && (
          <>
            <div className="card">
              <div className="section-title">Agregar producto</div>
              <div className="form-row">
                <div>
                  <label>Nombre del producto</label>
                  <input value={pForm.name} onChange={function (e) { setPForm(function (f) { return Object.assign({}, f, { name: e.target.value }); }); }} placeholder="Ej: Silla Tiffany" />
                </div>
                <div>
                  <label>Unidad</label>
                  <select value={pForm.unit} onChange={function (e) { setPForm(function (f) { return Object.assign({}, f, { unit: e.target.value }); }); }}>
                    <option value="unidad">Unidad</option>
                    <option value="set">Set</option>
                    <option value="metro">Metro</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div>
                  <label>Cantidad total</label>
                  <input type="number" min="1" value={pForm.total} onChange={function (e) { setPForm(function (f) { return Object.assign({}, f, { total: +e.target.value }); }); }} />
                </div>
                <div>
                  <label>Precio por día (AWG)</label>
                  <input type="number" min="0" step="0.50" value={pForm.price} onChange={function (e) { setPForm(function (f) { return Object.assign({}, f, { price: +e.target.value }); }); }} />
                </div>
              </div>
              <button className="btn btn-accent" style={{ marginTop: 14 }} onClick={addProduct}>+ Agregar producto</button>
            </div>

            <div className="inv-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ padding: "10px 14px" }}>Producto</th>
                    <th>Total</th>
                    <th>Disponible</th>
                    <th>Precio / día</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(function (p) {
                    var avail = p.total - p.rented;
                    var pct = avail / p.total;
                    return (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 500 }}>{p.name}</td>
                        <td style={{ color: T.t2 }}>{p.total}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div className="progress">
                              <div className="progress-fill" style={{ width: pct * 100 + "%", background: pct < 0.15 ? T.accent : pct < 0.35 ? T.amber : T.green }} />
                            </div>
                            <span style={{ color: T.t2, fontSize: 12 }}>{avail}</span>
                          </div>
                        </td>
                        <td style={{ color: T.t2, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>AWG {p.price.toFixed(2)}</td>
                        <td>
                          <span className={"badge " + (pct < 0.15 ? "badge-danger" : pct < 0.35 ? "badge-warning" : "badge-success")}>
                            {pct < 0.15 ? "Crítico" : pct < 0.35 ? "Bajo" : "OK"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── NUEVA RESERVA ── */}
        {tab === "nueva-reserva" && (
          <div className="card">
            <div className="section-title">Nueva reserva</div>
            <div className="form-row">
              <div>
                <label>Cliente</label>
                <input
                  value={form.client}
                  onChange={function (e) {
                    setForm(function (f) {
                      return Object.assign({}, f, { client: e.target.value });
                    });
                  }}
                  placeholder="Nombre completo"
                />
              </div>
              <div>
                <label>Teléfono</label>
                <input
                  value={form.phone}
                  onChange={function (e) {
                    setForm(function (f) {
                      return Object.assign({}, f, { phone: e.target.value });
                    });
                  }}
                  placeholder="+297 …"
                />
              </div>
            </div>
            <div className="form-row">
              <div>
                <label>Nombre del evento</label>
                <input
                  value={form.event}
                  onChange={function (e) {
                    setForm(function (f) {
                      return Object.assign({}, f, { event: e.target.value });
                    });
                  }}
                  placeholder="Ej: Quinceañera Rodriguez"
                />
              </div>
              <div>
                <label>Lugar / Dirección</label>
                <input
                  value={form.location}
                  onChange={function (e) {
                    setForm(function (f) {
                      return Object.assign({}, f, { location: e.target.value });
                    });
                  }}
                  placeholder="Ej: Noord, Aruba"
                />
              </div>
            </div>
            <div className="form-row">
              <div>
                <label>Fecha de entrega</label>
                <input
                  type="date"
                  value={form.delivery}
                  onChange={function (e) {
                    setForm(function (f) {
                      return Object.assign({}, f, { delivery: e.target.value });
                    });
                  }}
                />
              </div>
              <div>
                <label>Fecha de recogida</label>
                <input
                  type="date"
                  value={form.pickup}
                  onChange={function (e) {
                    setForm(function (f) {
                      return Object.assign({}, f, { pickup: e.target.value });
                    });
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: 18, marginBottom: 8 }}>
              <div className="section-title" style={{ marginBottom: 10 }}>
                Productos
              </div>
              {form.items.map(function (item, i) {
                return (
                  <div
                    key={i}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1fr 1fr 1fr auto",
                      gap: 6,
                      marginBottom: 6,
                      alignItems: "end",
                    }}
                  >
                    <div>
                      {i === 0 && <label>Producto</label>}
                      <select
                        value={item.name}
                        onChange={function (e) {
                          updateFormItem(i, "name", e.target.value);
                        }}
                      >
                        <option value="">Seleccionar…</option>
                        {products.map(function (p) {
                          return (
                            <option key={p.id} value={p.name}>
                              {p.name}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div>
                      {i === 0 && <label>Cantidad</label>}
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={function (e) {
                          updateFormItem(i, "qty", e.target.value);
                        }}
                      />
                    </div>
                    <div>
                      {i === 0 && <label>Precio AWG</label>}
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={item.price}
                        onChange={function (e) {
                          updateFormItem(i, "price", e.target.value);
                        }}
                      />
                    </div>
                    <div>
                      {i === 0 && <label>Subtotal</label>}
                      <input
                        readOnly
                        value={"AWG " + (item.qty * item.price).toFixed(2)}
                        style={{ background: T.bg0, color: T.t3 }}
                      />
                    </div>
                    <div>
                      {i === 0 && (
                        <label style={{ visibility: "hidden" }}>·</label>
                      )}
                      <button
                        className="btn btn-sm"
                        style={{ color: T.accent, borderColor: T.accentBorder }}
                        onClick={function () {
                          removeFormItem(i);
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
              <button
                className="btn btn-sm"
                style={{ marginTop: 6, marginBottom: 14 }}
                onClick={addFormItem}
              >
                + Agregar línea
              </button>
            </div>

            <div className="total-box">
              {(function () {
                var sub = form.items.reduce(function (s, i) {
                  return s + i.qty * i.price;
                }, 0);
                var bbo = sub * 0.015;
                return (
                  <>
                    <div className="total-row">
                      <span>Subtotal</span>
                      <span>AWG {sub.toFixed(2)}</span>
                    </div>
                    <div className="total-row">
                      <span>BBO 1.5% (DIMP)</span>
                      <span>AWG {bbo.toFixed(2)}</span>
                    </div>
                    <div className="total-row main">
                      <span>Total estimado</span>
                      <span>AWG {(sub * 1.015).toFixed(2)}</span>
                    </div>
                  </>
                );
              })()}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary" onClick={addReservation}>
                Guardar reserva
              </button>
              <button
                className="btn btn-accent"
                onClick={function () {
                  handleGeneratePDF(form);
                  addReservation();
                }}
              >
                Guardar y generar PDF
              </button>
            </div>
          </div>
        )}

        {/* ── RESERVAS ── */}
        {tab === "reservas" && (
          <>
            <div className="section-title" style={{ marginBottom: 12 }}>
              <span>Reservas ({reservations.length})</span>
            </div>
            {reservations.map(function (r) {
              var total = resTotal(r);
              var bbo = total * 0.015;
              return (
                <div key={r.id} className="res-card">
                  <div className="res-header">
                    <div>
                      <div className="res-id">{r.id}</div>
                      <div className="res-client">{r.client}</div>
                      <div className="res-event">
                        {r.event} · {r.location}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span
                        className={
                          "badge " +
                          (r.status === "recogido"
                            ? "badge-success"
                            : r.status === "pendiente-recogida"
                              ? "badge-danger"
                              : "badge-info")
                        }
                      >
                        {r.status === "recogido"
                          ? "Recogido"
                          : r.status === "pendiente-recogida"
                            ? "Pendiente recogida"
                            : "Activa"}
                      </span>
                      <div className="res-amount">
                        AWG {(total * 1.015).toFixed(2)}
                      </div>
                      <div className="res-amount-sub">
                        incl. BBO AWG {bbo.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="res-details">
                    <span>Entrega: {formatDate(r.delivery)}</span>
                    <span>Recogida: {formatDate(r.pickup)}</span>
                  </div>
                  <div className="res-items">
                    {r.items.map(function (it, i) {
                      return (
                        <span key={i} style={{ marginRight: 12 }}>
                          {it.qty}× {it.name}
                        </span>
                      );
                    })}
                  </div>
                  <div className="row-actions">
                    <button
                      className="btn btn-sm btn-accent"
                      onClick={function () {
                        handleGeneratePDF(r);
                      }}
                    >
                      PDF
                    </button>
                    <button
                      className="btn btn-sm btn-wa"
                      onClick={function () {
                        openWhatsApp(r.phone, buildWAInvoice(r, total));
                      }}
                    >
                      WhatsApp
                    </button>
                    <button
                      className="btn btn-sm btn-twilio"
                      disabled={sendingWA}
                      onClick={function () {
                        sendTwilioReminder(r);
                      }}
                    >
                      {sendingWA ? "Enviando…" : "Twilio WA"}
                    </button>
                    {r.status !== "recogido" && (
                      <button
                        className="btn btn-sm"
                        onClick={function () {
                          markPickedUp(r.id);
                        }}
                      >
                        Marcar recogido
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* ── ALERTAS ── */}
        {tab === "alertas" && (
          <>
            <div className="section-title">Alertas de recogida</div>
            {pickupAlerts.length === 0 ? (
              <div className="card">
                <div className="empty">
                  <div className="empty-icon">✓</div>
                  <div className="empty-label">Sin recogidas urgentes</div>
                  <div className="empty-sub">Todo está al día</div>
                </div>
              </div>
            ) : (
              pickupAlerts.map(function (r) {
                return (
                  <div key={r.id} className={"alert-item " + alertLevel(r)}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <div className="alert-title">
                        {r.client} — {r.event}
                      </div>
                      <span className={"badge badge-" + alertLevel(r)}>
                        {isToday(r.pickup) ? "HOY" : "Mañana"}
                      </span>
                    </div>
                    <div className="alert-sub">{r.location}</div>
                    <div className="alert-sub" style={{ marginTop: 2 }}>
                      {r.items
                        .map(function (i) {
                          return i.qty + "× " + i.name;
                        })
                        .join(" · ")}
                    </div>
                    <div className="row-actions">
                      <button
                        className="btn btn-sm"
                        style={{
                          background: "rgba(99,102,241,0.12)",
                          color: "#a5b4fc",
                          borderColor: "rgba(99,102,241,0.35)",
                        }}
                        onClick={function () {
                          setSelectedAlert(r);
                        }}
                      >
                        Ver detalle
                      </button>
                      <button
                        className="btn btn-sm btn-wa"
                        onClick={function () {
                          openWhatsApp(r.phone, buildWAMsg(r));
                        }}
                      >
                        WhatsApp
                      </button>
                      <button
                        className="btn btn-sm btn-twilio"
                        disabled={sendingWA}
                        onClick={function () {
                          sendTwilioReminder(r);
                        }}
                      >
                        {sendingWA ? "Enviando…" : "Twilio WA"}
                      </button>
                      <button
                        className="btn btn-sm btn-accent"
                        onClick={function () {
                          handleGeneratePDF(r);
                        }}
                      >
                        PDF
                      </button>
                      <button
                        className="btn btn-sm"
                        onClick={function () {
                          markPickedUp(r.id);
                        }}
                      >
                        Marcar recogido
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            <div className="section-title" style={{ marginTop: 20 }}>
              Alertas de inventario
            </div>
            {lowStock.length === 0 ? (
              <div className="card">
                <div className="empty">
                  <div className="empty-icon">✓</div>
                  <div className="empty-label">Inventario en buen estado</div>
                </div>
              </div>
            ) : (
              lowStock.map(function (p) {
                var avail = p.total - p.rented;
                return (
                  <div key={p.id} className="alert-item warning">
                    <div className="alert-title">Stock bajo · {p.name}</div>
                    <div className="alert-sub">
                      Disponible: {avail} de {p.total} unidades (
                      {Math.round((avail / p.total) * 100)}%)
                    </div>
                  </div>
                );
              })
            )}

            {/* MODAL */}
            {selectedAlert && (
              <div
                className="modal-overlay"
                onClick={function () {
                  setSelectedAlert(null);
                }}
              >
                <div
                  className="modal-content"
                  onClick={function (e) {
                    e.stopPropagation();
                  }}
                >
                  <div className="modal-header">
                    <h2>Detalle de recogida</h2>
                    <button
                      className="modal-close"
                      onClick={function () {
                        setSelectedAlert(null);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="modal-body">
                    <div className="modal-section">
                      <div className="modal-section-title">Cliente</div>
                      <div
                        style={{ fontSize: 16, fontWeight: 600, color: T.t1 }}
                      >
                        {selectedAlert.client}
                      </div>
                    </div>
                    <div className="modal-section">
                      <div className="modal-section-title">Información</div>
                      <div className="modal-info">
                        {[
                          ["Evento", selectedAlert.event],
                          ["Teléfono", selectedAlert.phone],
                          ["Ubicación", selectedAlert.location],
                          ["Fecha recogida", formatDate(selectedAlert.pickup)],
                        ].map(function ([label, val]) {
                          return (
                            <div key={label} className="modal-info-item">
                              <div className="modal-info-label">{label}</div>
                              <div className="modal-info-value">{val}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="modal-section">
                      <div className="modal-section-title">Productos</div>
                      <div className="modal-products">
                        <div className="modal-product-header">
                          <span>Producto</span>
                          <span style={{ textAlign: "center" }}>Cant.</span>
                          <span style={{ textAlign: "right" }}>Precio</span>
                        </div>
                        {selectedAlert.items.map(function (item, idx) {
                          var prod = products.find(function (p) {
                            return p.name === item.name;
                          });
                          return (
                            <div key={idx} className="modal-product-row">
                              <span>{item.name}</span>
                              <span className="modal-product-qty">
                                {item.qty}
                              </span>
                              <span className="modal-product-price">
                                AWG{" "}
                                {(
                                  item.price || (prod ? prod.price : 0)
                                ).toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="modal-total">
                        <span className="modal-total-label">Total</span>
                        <span className="modal-total-value">
                          AWG {resTotal(selectedAlert).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div
                      className="row-actions"
                      style={{ justifyContent: "center", marginTop: 4 }}
                    >
                      <button
                        className="btn btn-sm btn-wa"
                        onClick={function () {
                          openWhatsApp(
                            selectedAlert.phone,
                            buildWAMsg(selectedAlert),
                          );
                        }}
                      >
                        WhatsApp
                      </button>
                      <button
                        className="btn btn-sm btn-twilio"
                        onClick={function () {
                          sendTwilioReminder(selectedAlert);
                        }}
                      >
                        Twilio WA
                      </button>
                      <button
                        className="btn btn-sm btn-accent"
                        onClick={function () {
                          handleGeneratePDF(selectedAlert);
                        }}
                      >
                        PDF
                      </button>
                      <button
                        className="btn btn-sm"
                        onClick={function () {
                          markPickedUp(selectedAlert.id);
                          setSelectedAlert(null);
                        }}
                      >
                        Marcar recogido
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
