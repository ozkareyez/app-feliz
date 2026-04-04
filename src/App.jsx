import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


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
  name: "Feliz Enterprise",
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
    ".\nFeliz Enterprise."
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
    " (BBO 1.5%). Feliz Enterprise."
  );
}

function generateInvoicePDF(reservation, invoiceNum, deposit, notes) {
  if (!deposit) deposit = 0;
  if (!notes) notes = "";
  var doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  var W = 210,
    M = 18,
    CW = W - M * 2;
  var y = 0;

  doc.setFillColor(26, 26, 46);
  doc.rect(0, 0, W, 42, "F");
  doc.setFillColor(233, 69, 96);
  doc.rect(0, 42, W, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text(COMPANY.name, M, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 200);
  doc.text(COMPANY.address, M, 20);
  doc.text("Tel: " + COMPANY.phone + "  |  " + COMPANY.email, M, 25);
  doc.text("COR / Tax ID: " + COMPANY.taxId, M, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(233, 69, 96);
  doc.text("FACTURA", W - M, 16, { align: "right" });
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(invoiceNum, W - M, 24, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(170, 170, 190);
  var td = new Date().toLocaleDateString("es-AW", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  doc.text("Fecha: " + td, W - M, 31, { align: "right" });
  doc.text("Reserva: " + reservation.id, W - M, 36, { align: "right" });
  y = 50;

  var boxH = 34;
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(M, y, CW / 2 - 3, boxH, 2, 2, "F");
  doc.setDrawColor(222, 226, 230);
  doc.setLineWidth(0.3);
  doc.roundedRect(M, y, CW / 2 - 3, boxH, 2, 2, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(108, 117, 125);
  doc.text("CLIENTE", M + 4, y + 6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(33, 37, 41);
  doc.text(reservation.client, M + 4, y + 13);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text("Tel: " + reservation.phone, M + 4, y + 19);
  doc.text("Evento: " + reservation.event, M + 4, y + 25);
  doc.text("Lugar: " + reservation.location, M + 4, y + 31);

  var ex = M + CW / 2 + 3;
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(ex, y, CW / 2 - 3, boxH, 2, 2, "F");
  doc.roundedRect(ex, y, CW / 2 - 3, boxH, 2, 2, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(108, 117, 125);
  doc.text("DETALLES DEL EVENTO", ex + 4, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text("Entrega: " + formatDate(reservation.delivery), ex + 4, y + 13);
  doc.text("Recogida: " + formatDate(reservation.pickup), ex + 4, y + 19);
  doc.text(
    "Dias: " + (daysBetween(reservation.delivery, reservation.pickup) || 1),
    ex + 4,
    y + 25,
  );
  y += boxH + 8;

  var subtotal = 0;
  var tableRows = reservation.items.map(function (item) {
    var days =
      daysBetween(reservation.delivery, reservation.pickup) || item.days || 1;
    var tot = item.qty * days * item.price;
    subtotal += tot;
    return [
      item.name,
      item.qty.toString(),
      days.toString(),
      "AWG " + item.price.toFixed(2),
      "AWG " + tot.toFixed(2),
    ];
  });
  autoTable(doc, {
    startY: y,
    head: [["Descripcion", "Cant.", "Dias", "Precio Unit. AWG", "Total AWG"]],
    body: tableRows,
    margin: { left: M, right: M },
    theme: "grid",
    headStyles: {
      fillColor: [15, 52, 96],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 8,
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: CW * 0.38, halign: "left" },
      1: { cellWidth: CW * 0.1, halign: "center" },
      2: { cellWidth: CW * 0.1, halign: "center" },
      3: { cellWidth: CW * 0.22, halign: "right" },
      4: { cellWidth: CW * 0.2, halign: "right" },
    },
    bodyStyles: { fontSize: 8.5, textColor: [33, 37, 41] },
    alternateRowStyles: { fillColor: [248, 249, 250] },
    styles: { lineColor: [222, 226, 230], lineWidth: 0.3 },
  });
  y = doc.lastAutoTable.finalY + 4;

  var bboAmt = subtotal * 0.015;
  var totalDue = subtotal + bboAmt - deposit;

  function drawRow(label, value, hi) {
    if (hi) {
      doc.setFillColor(26, 26, 46);
      doc.rect(M, y, CW, 10, "F");
      doc.setDrawColor(233, 69, 96);
      doc.setLineWidth(0.8);
      doc.line(M, y, M + CW, y);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
    } else {
      doc.setFillColor(248, 249, 250);
      doc.rect(M, y, CW, 8, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(80, 80, 80);
    }
    doc.text(label, M + CW * 0.6 + 4, y + (hi ? 7 : 5.5));
    doc.setFont("helvetica", "bold");
    doc.setTextColor(hi ? 255 : 33, hi ? 255 : 37, hi ? 255 : 41);
    doc.text(value, M + CW - 2, y + (hi ? 7 : 5.5), { align: "right" });
    y += hi ? 10 : 8;
  }
  drawRow("Subtotal", "AWG " + subtotal.toFixed(2), false);
  drawRow(
    "BBO (1.5%) - Belasting op Bedrijfsomzetten",
    "AWG " + bboAmt.toFixed(2),
    false,
  );
  if (deposit > 0)
    drawRow("Deposito pagado", "- AWG " + deposit.toFixed(2), false);
  drawRow("TOTAL A PAGAR", "AWG " + totalDue.toFixed(2), true);
  y += 6;

  doc.setFillColor(248, 249, 250);
  doc.rect(M, y, CW, 18, "F");
  doc.setDrawColor(222, 226, 230);
  doc.setLineWidth(0.3);
  doc.rect(M, y, CW, 18, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(108, 117, 125);
  doc.text("INFORMACION DE PAGO", M + 4, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);
  doc.text(
    "Banco: " +
      COMPANY.bank +
      "  |  Cuenta: " +
      COMPANY.account +
      "  |  A nombre de: " +
      COMPANY.name,
    M + 4,
    y + 12,
  );
  doc.text(
    "Metodos: Efectivo - Transferencia bancaria - Tarjeta",
    M + 4,
    y + 17,
  );
  y += 22;
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
  doc.line(M, pH - 20, W - M, pH - 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(108, 117, 125);
  doc.text(
    "Factura generada conforme a la regulacion fiscal de Aruba - DIMP (Departamento Impuesto y Aduana)",
    W / 2,
    pH - 14,
    { align: "center" },
  );
  doc.setFont("helvetica", "normal");
  doc.text(
    "BBO registrado bajo la Landsverordening Belasting op Bedrijfsomzetten | " +
      COMPANY.name +
      " (c) " +
      new Date().getFullYear(),
    W / 2,
    pH - 9,
    { align: "center" },
  );
  doc.save(invoiceNum + "_" + reservation.client.replace(/\s/g, "_") + ".pdf");
}

const css = [
  "@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');",
  "*{box-sizing:border-box;margin:0;padding:0}",
  "body{font-family:'DM Sans',sans-serif;background:#f0f2f5;min-height:100vh}",
  ".app{max-width:900px;margin:0 auto;padding:12px}",
  ".topbar{background:#1a1a2e;color:#fff;border-radius:12px;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}",
  ".topbar-title{font-size:17px;font-weight:600}",
  ".topbar-sub{font-size:12px;color:#adb5bd;margin-top:2px}",
  ".accent-dot{display:inline-block;width:8px;height:8px;background:#e94560;border-radius:50%;margin-right:6px}",
  ".tabs{display:flex;gap:4px;margin-bottom:14px;background:#fff;border-radius:10px;padding:4px;border:0.5px solid #dee2e6}",
  ".tab{flex:1;padding:8px 4px;font-size:13px;font-weight:500;border:none;background:none;border-radius:7px;cursor:pointer;color:#6c757d;transition:all .15s}",
  ".tab.active{background:#1a1a2e;color:#fff}",
  ".card{background:#fff;border:0.5px solid #dee2e6;border-radius:12px;padding:16px;margin-bottom:12px}",
  ".metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px}",
  ".metric{background:#f8f9fa;border-radius:8px;padding:12px}",
  ".metric-label{font-size:11px;color:#6c757d;margin-bottom:4px}",
  ".metric-val{font-size:22px;font-weight:600;color:#212529}",
  ".metric-val.red{color:#dc3545}",
  ".metric-val.green{color:#198754}",
  ".alert-item{border-left:3px solid;border-radius:8px;padding:10px 14px;margin-bottom:8px;background:#f8f9fa}",
  ".alert-item.danger{border-color:#e94560}",
  ".alert-item.warning{border-color:#fd7e14}",
  ".alert-item.info{border-color:#0d6efd}",
  ".alert-title{font-size:13px;font-weight:600;margin-bottom:3px}",
  ".alert-sub{font-size:12px;color:#6c757d}",
  ".badge{display:inline-block;font-size:11px;padding:2px 9px;border-radius:20px;font-weight:500;margin-left:6px}",
  ".badge-danger{background:#fff0f0;color:#dc3545}",
  ".badge-warning{background:#fff8f0;color:#fd7e14}",
  ".badge-info{background:#e8f4ff;color:#0d6efd}",
  ".badge-success{background:#eafaf1;color:#198754}",
  ".row-actions{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}",
  ".btn{padding:6px 14px;font-size:12px;font-weight:500;border:0.5px solid #dee2e6;border-radius:8px;background:#fff;color:#212529;cursor:pointer;transition:all .12s}",
  ".btn:hover{background:#f8f9fa}",
  ".btn-primary{background:#1a1a2e;color:#fff;border-color:#1a1a2e}",
  ".btn-primary:hover{background:#0f3460}",
  ".btn-accent{background:#e94560;color:#fff;border-color:#e94560}",
  ".btn-accent:hover{opacity:.9}",
  ".btn-sm{padding:4px 10px;font-size:11px}",
  ".btn-wa{background:#25d366;color:#fff;border-color:#25d366}",
  "label{display:block;font-size:12px;color:#6c757d;margin-bottom:3px;margin-top:10px}",
  "input,select,textarea{width:100%;padding:8px 10px;border:0.5px solid #dee2e6;border-radius:8px;font-size:13px;background:#fff;color:#212529;outline:none}",
  "input:focus,select:focus,textarea:focus{border-color:#0f3460;box-shadow:0 0 0 2px rgba(15,52,96,.1)}",
  ".form-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}",
  ".inv-row{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:0.5px solid #dee2e6}",
  ".inv-row:last-child{border:none}",
  ".progress{height:5px;background:#f0f2f5;border-radius:3px;overflow:hidden;width:70px}",
  ".progress-fill{height:100%;border-radius:3px}",
  ".res-card{background:#fff;border:0.5px solid #dee2e6;border-radius:10px;padding:14px;margin-bottom:10px}",
  ".res-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px}",
  ".res-id{font-size:11px;color:#6c757d;font-family:'DM Mono',monospace}",
  ".res-client{font-size:14px;font-weight:600;margin-bottom:2px}",
  ".res-event{font-size:12px;color:#6c757d}",
  ".res-details{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:8px 0;font-size:12px;color:#6c757d}",
  ".res-items{font-size:12px;color:#212529;background:#f8f9fa;border-radius:6px;padding:8px;margin-bottom:8px}",
  ".section-title{font-size:14px;font-weight:600;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center}",
  "table{width:100%;border-collapse:collapse;font-size:13px}",
  "th{font-size:11px;font-weight:500;color:#6c757d;text-align:left;padding:6px 4px;border-bottom:0.5px solid #dee2e6}",
  "td{padding:10px 4px;border-bottom:0.5px solid #dee2e6;vertical-align:middle}",
  ".empty{text-align:center;color:#6c757d;font-size:13px;padding:2rem}",
  ".notification{position:fixed;top:16px;right:16px;background:#1a1a2e;color:#fff;padding:12px 18px;border-radius:10px;font-size:13px;z-index:999;border-left:3px solid #e94560;animation:slideIn .2s ease}",
  ".modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;animation:fadeIn .2s}",
  ".modal-content{background:#fff;border-radius:16px;max-width:500px;width:90%;max-height:85vh;overflow:auto;animation:slideUp .3s}",
  ".modal-header{background:#1a1a2e;color:#fff;padding:20px 24px;border-radius:16px 16px 0 0;position:relative}",
  ".modal-header h2{margin:0;font-size:18px;font-weight:600}",
  ".modal-close{position:absolute;right:16px;top:50%;transform:translateY(-50%);background:none;border:none;color:#fff;font-size:24px;cursor:pointer;opacity:0.8}",
  ".modal-body{padding:24px}",
  ".modal-section{margin-bottom:20px}",
  ".modal-section-title{font-size:12px;text-transform:uppercase;color:#888;margin-bottom:8px;letter-spacing:0.5px}",
  ".modal-info{display:grid;grid-template-columns:1fr 1fr;gap:12px}",
  ".modal-info-item{background:#f8f9fa;padding:12px;border-radius:8px}",
  ".modal-info-label{font-size:11px;color:#666;margin-bottom:4px}",
  ".modal-info-value{font-size:14px;font-weight:600;color:#1a1a2e}",
  ".modal-products{border:1px solid #e0e0e0;border-radius:10px;overflow:hidden}",
  ".modal-product-header{background:#f0f0f0;display:grid;grid-template-columns:1fr 80px 80px;padding:10px 16px;font-size:11px;font-weight:600;color:#666;text-transform:uppercase}",
  ".modal-product-row{display:grid;grid-template-columns:1fr 80px 80px;padding:12px 16px;border-top:1px solid #e0e0e0;font-size:13px}",
  ".modal-product-row:nth-child(even){background:#fafafa}",
  ".modal-product-qty{color:#2563eb;font-weight:600}",
  ".modal-product-price{color:#059669;font-weight:600}",
  ".modal-total{background:#1a1a2e;color:#fff;padding:16px;border-radius:10px;display:flex;justify-content:space-between;align-items:center;margin-top:16px}",
  ".modal-total-label{font-size:14px}",
  ".modal-total-value{font-size:20px;font-weight:700}",
  "@keyframes fadeIn{from{opacity:0}to{opacity:1}}",
  "@keyframes slideUp{from{transform:translateY(30px);opacity:0}to{transform:translateY(0);opacity:1}}",
  "@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}",
].join("\n");

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

  var tabState = useState("dashboard");
  var tab = tabState[0];
  var setTab = tabState[1];
  var prodState = useState(initProducts);
  var products = prodState[0];
  var setProducts = prodState[1];
  var resState = useState(initReservations);
  var reservations = resState[0];
  var setReservations = resState[1];
  var notifState = useState(null);
  var notification = notifState[0];
  var setNotification = notifState[1];
  var cntState = useState(initCounter);
  var invoiceCounter = cntState[0];
  var setInvoiceCounter = cntState[1];
  var waState = useState(false);
  var sendingWA = waState[0];
  var setSendingWA = waState[1];
  var alertState = useState(null);
  var selectedAlert = alertState[0];
  var setSelectedAlert = alertState[1];
  var formState = useState({
    client: "",
    phone: "",
    event: "",
    location: "",
    delivery: "",
    pickup: "",
    items: [{ name: "", qty: 1, days: 1, price: 0 }],
  });
  var form = formState[0];
  var setForm = formState[1];
  var pfState = useState({ name: "", total: 0, price: 0, unit: "unidad" });
  var pForm = pfState[0];
  var setPForm = pfState[1];

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
  var lowStock = products.filter(function (p) {
    return (p.total - p.rented) / p.total < 0.25;
  });
  var activeRes = reservations.filter(function (r) {
    return r.status !== "recogido";
  }).length;
  var todayPickups = reservations.filter(function (r) {
    return isToday(r.pickup) && r.status !== "recogido";
  }).length;
  var monthRevenue = reservations.reduce(function (s, r) {
    return s + resTotal(r);
  }, 0);

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
    notify("Factura " + num + " descargada en Descargas");
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

  return (
    <>
      <style>{css}</style>
      {notification && <div className="notification">{notification}</div>}
      <div className="app">
        <div className="topbar">
          <div>
            <div className="topbar-title">
              <span className="accent-dot" />
              Feliz Enterprise
            </div>
            <div className="topbar-sub">
              Sistema de inventario y facturacion - DIMP Aruba
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: 12, color: "#adb5bd" }}>
            <div>
              {new Date().toLocaleDateString("es-AW", {
                weekday: "long",
                day: "2-digit",
                month: "long",
              })}
            </div>
            <div style={{ color: "#e94560", fontWeight: 500 }}>
              {pickupAlerts.length} alerta{pickupAlerts.length !== 1 ? "s" : ""}{" "}
              activa{pickupAlerts.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        <div className="tabs">
          {[
            ["dashboard", "Dashboard"],
            ["inventario", "Inventario"],
            ["nueva-reserva", "Nueva reserva"],
            ["reservas", "Reservas"],
            [
              "alertas",
              "Alertas (" + (pickupAlerts.length + lowStock.length) + ")",
            ],
          ].map(function (p) {
            return (
              <button
                key={p[0]}
                className={"tab" + (tab === p[0] ? " active" : "")}
                onClick={function () {
                  setTab(p[0]);
                }}
              >
                {p[1]}
              </button>
            );
          })}
        </div>

        {tab === "dashboard" && (
          <>
            <div className="metrics">
              <div className="metric">
                <div className="metric-label">Reservas activas</div>
                <div className="metric-val">{activeRes}</div>
              </div>
              <div className="metric">
                <div className="metric-label">Recogidas hoy</div>
                <div
                  className={
                    "metric-val" + (todayPickups > 0 ? " red" : " green")
                  }
                >
                  {todayPickups}
                </div>
              </div>
              <div className="metric">
                <div className="metric-label">Ingresos estimados (AWG)</div>
                <div className="metric-val green">
                  {monthRevenue.toFixed(0)}
                </div>
              </div>
            </div>
            <div className="card">
              <div className="section-title">Recogidas proximas</div>
              {pickupAlerts.length === 0 && (
                <div className="empty">No hay recogidas urgentes</div>
              )}
              {pickupAlerts.map(function (r) {
                return (
                  <div key={r.id} className={"alert-item " + alertLevel(r)}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <div className="alert-title">
                        {r.client} - {r.event}
                      </div>
                      <span className={"badge badge-" + alertLevel(r)}>
                        {isToday(r.pickup) ? "HOY" : "Manana"}
                      </span>
                    </div>
                    <div className="alert-sub">
                      {r.location} -{" "}
                      {r.items
                        .map(function (i) {
                          return i.qty + "x " + i.name;
                        })
                        .join(", ")}
                    </div>
                    <div className="row-actions">
                      <button
                        className="btn btn-sm btn-wa"
                        onClick={function () {
                          openWhatsApp(r.phone, buildWAMsg(r));
                        }}
                      >
                        WhatsApp Web
                      </button>
                      <button
                        className="btn btn-sm"
                        disabled={sendingWA}
                        style={{
                          background: "#0088cc",
                          color: "#fff",
                          borderColor: "#0088cc",
                          opacity: sendingWA ? 0.7 : 1,
                        }}
                        onClick={function () {
                          sendTwilioReminder(r);
                        }}
                      >
                        {sendingWA ? "Enviando..." : "Twilio WA"}
                      </button>
                      <button
                        className="btn btn-sm"
                        onClick={function () {
                          markPickedUp(r.id);
                        }}
                      >
                        Marcar recogido
                      </button>
                      <button
                        className="btn btn-sm btn-accent"
                        onClick={function () {
                          handleGeneratePDF(r);
                        }}
                      >
                        Descargar factura PDF
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="card">
              <div className="section-title">Stock bajo</div>
              {lowStock.length === 0 && (
                <div className="empty">Todo el inventario esta bien</div>
              )}
              {lowStock.map(function (p) {
                var avail = p.total - p.rented;
                var pct = (avail / p.total) * 100;
                return (
                  <div key={p.id} className="inv-row">
                    <span style={{ fontSize: 13 }}>{p.name}</span>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <div className="progress">
                        <div
                          className="progress-fill"
                          style={{
                            width: pct + "%",
                            background: pct < 15 ? "#dc3545" : "#fd7e14",
                          }}
                        />
                      </div>
                      <span
                        className={
                          "badge " +
                          (pct < 15 ? "badge-danger" : "badge-warning")
                        }
                      >
                        {avail} / {p.total}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === "inventario" && (
          <>
            <div className="card">
              <div className="section-title">Agregar producto</div>
              <div className="form-row">
                <div>
                  <label>Nombre del producto</label>
                  <input
                    value={pForm.name}
                    onChange={function (e) {
                      setPForm(function (f) {
                        return Object.assign({}, f, { name: e.target.value });
                      });
                    }}
                    placeholder="Ej: Silla Tiffany"
                  />
                </div>
                <div>
                  <label>Unidad</label>
                  <select
                    value={pForm.unit}
                    onChange={function (e) {
                      setPForm(function (f) {
                        return Object.assign({}, f, { unit: e.target.value });
                      });
                    }}
                  >
                    <option value="unidad">Unidad</option>
                    <option value="set">Set</option>
                    <option value="metro">Metro</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div>
                  <label>Cantidad total</label>
                  <input
                    type="number"
                    min="1"
                    value={pForm.total}
                    onChange={function (e) {
                      setPForm(function (f) {
                        return Object.assign({}, f, { total: +e.target.value });
                      });
                    }}
                  />
                </div>
                <div>
                  <label>Precio por dia (AWG)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.50"
                    value={pForm.price}
                    onChange={function (e) {
                      setPForm(function (f) {
                        return Object.assign({}, f, { price: +e.target.value });
                      });
                    }}
                  />
                </div>
              </div>
              <button
                className="btn btn-primary"
                style={{ marginTop: 10 }}
                onClick={addProduct}
              >
                + Agregar producto
              </button>
            </div>
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <table>
                <thead>
                  <tr style={{ background: "#f8f9fa" }}>
                    <th style={{ padding: "10px 14px" }}>Producto</th>
                    <th style={{ padding: "10px 8px" }}>Total</th>
                    <th style={{ padding: "10px 8px" }}>Disponible</th>
                    <th style={{ padding: "10px 8px" }}>Precio/dia AWG</th>
                    <th style={{ padding: "10px 8px" }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(function (p) {
                    var avail = p.total - p.rented;
                    var pct = avail / p.total;
                    return (
                      <tr key={p.id}>
                        <td style={{ padding: "10px 14px", fontWeight: 500 }}>
                          {p.name}
                        </td>
                        <td style={{ padding: "10px 8px" }}>{p.total}</td>
                        <td style={{ padding: "10px 8px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <div className="progress">
                              <div
                                className="progress-fill"
                                style={{
                                  width: pct * 100 + "%",
                                  background:
                                    pct < 0.15
                                      ? "#dc3545"
                                      : pct < 0.35
                                        ? "#fd7e14"
                                        : "#198754",
                                }}
                              />
                            </div>
                            {avail}
                          </div>
                        </td>
                        <td style={{ padding: "10px 8px" }}>
                          AWG {p.price.toFixed(2)}
                        </td>
                        <td style={{ padding: "10px 8px" }}>
                          <span
                            className={
                              "badge " +
                              (pct < 0.15
                                ? "badge-danger"
                                : pct < 0.35
                                  ? "badge-warning"
                                  : "badge-success")
                            }
                          >
                            {pct < 0.15
                              ? "Critico"
                              : pct < 0.35
                                ? "Bajo"
                                : "OK"}
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
                <label>Telefono</label>
                <input
                  value={form.phone}
                  onChange={function (e) {
                    setForm(function (f) {
                      return Object.assign({}, f, { phone: e.target.value });
                    });
                  }}
                  placeholder="+297 ..."
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
                  placeholder="Ej: Quinceanera Rodriguez"
                />
              </div>
              <div>
                <label>Lugar / Direccion</label>
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
            <div
              style={{
                marginTop: 14,
                marginBottom: 6,
                fontSize: 13,
                fontWeight: 500,
              }}
            >
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
                      <option value="">Seleccionar...</option>
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
                      style={{ background: "#f8f9fa", color: "#6c757d" }}
                    />
                  </div>
                  <div>
                    {i === 0 && (
                      <label style={{ visibility: "hidden" }}>x</label>
                    )}
                    <button
                      className="btn btn-sm"
                      style={{ color: "#dc3545", borderColor: "#dc3545" }}
                      onClick={function () {
                        removeFormItem(i);
                      }}
                    >
                      x
                    </button>
                  </div>
                </div>
              );
            })}
            <button
              className="btn btn-sm"
              style={{ marginBottom: 10 }}
              onClick={addFormItem}
            >
              + Agregar linea
            </button>
            <div
              style={{
                background: "#f8f9fa",
                borderRadius: 8,
                padding: "10px 14px",
                marginBottom: 12,
                fontSize: 13,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Subtotal</span>
                <span style={{ fontWeight: 500 }}>
                  AWG{" "}
                  {form.items
                    .reduce(function (s, i) {
                      return s + i.qty * i.price;
                    }, 0)
                    .toFixed(2)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "#6c757d",
                  marginTop: 4,
                }}
              >
                <span>BBO 1.5% (DIMP)</span>
                <span>
                  AWG{" "}
                  {(
                    form.items.reduce(function (s, i) {
                      return s + i.qty * i.price;
                    }, 0) * 0.015
                  ).toFixed(2)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: 600,
                  marginTop: 6,
                  paddingTop: 6,
                  borderTop: "0.5px solid #dee2e6",
                }}
              >
                <span>Total estimado</span>
                <span>
                  AWG{" "}
                  {(
                    form.items.reduce(function (s, i) {
                      return s + i.qty * i.price;
                    }, 0) * 1.015
                  ).toFixed(2)}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary" onClick={addReservation}>
                Guardar reserva
              </button>
              <button className="btn btn-accent" onClick={addReservation}>
                Guardar y generar PDF
              </button>
            </div>
          </div>
        )}

        {tab === "reservas" && (
          <>
            <div className="section-title">
              Reservas ({reservations.length})
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
                        {r.event} - {r.location}
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
                      <div
                        style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}
                      >
                        AWG {(total * 1.015).toFixed(2)}
                      </div>
                      <div style={{ fontSize: 11, color: "#6c757d" }}>
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
                        <span key={i} style={{ marginRight: 10 }}>
                          {it.qty}x {it.name}
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
                      Descargar factura PDF
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
                      className="btn btn-sm"
                      disabled={sendingWA}
                      style={{
                        background: "#0088cc",
                        color: "#fff",
                        borderColor: "#0088cc",
                        opacity: sendingWA ? 0.7 : 1,
                      }}
                      onClick={function () {
                        sendTwilioReminder(r);
                      }}
                    >
                      {sendingWA ? "Enviando..." : "Twilio WA"}
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

        {tab === "alertas" && (
          <>
            <div className="section-title">Alertas de recogida</div>
            {pickupAlerts.length === 0 && (
              <div className="empty" style={{ marginBottom: 16 }}>
                No hay recogidas urgentes
              </div>
            )}
            {pickupAlerts.map(function (r) {
              return (
                <div key={r.id} className={"alert-item " + alertLevel(r)}>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <div className="alert-title">
                      {r.client} - {r.event}
                    </div>
                    <span className={"badge badge-" + alertLevel(r)}>
                      {isToday(r.pickup) ? "HOY" : "Manana"}
                    </span>
                  </div>
                  <div className="alert-sub">{r.location}</div>
                  <div className="alert-sub" style={{ marginTop: 2 }}>
                    {r.items
                      .map(function (i) {
                        return i.qty + "x " + i.name;
                      })
                      .join(" - ")}
                  </div>
                  <div className="row-actions">
                    <button
                      className="btn btn-sm"
                      style={{
                        background: "#6366f1",
                        color: "#fff",
                        borderColor: "#6366f1",
                      }}
                      onClick={function () {
                        setSelectedAlert(r);
                      }}
                    >
                      Ver
                    </button>
                    <button
                      className="btn btn-sm btn-wa"
                      onClick={function () {
                        openWhatsApp(r.phone, buildWAMsg(r));
                      }}
                    >
                      WhatsApp Web
                    </button>
                    <button
                      className="btn btn-sm"
                      disabled={sendingWA}
                      style={{
                        background: "#0088cc",
                        color: "#fff",
                        borderColor: "#0088cc",
                        opacity: sendingWA ? 0.7 : 1,
                      }}
                      onClick={function () {
                        sendTwilioReminder(r);
                      }}
                    >
                      {sendingWA ? "Enviando..." : "Twilio WA"}
                    </button>
                    <button
                      className="btn btn-sm btn-accent"
                      onClick={function () {
                        handleGeneratePDF(r);
                      }}
                    >
                      Factura PDF
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
            })}
            <div className="section-title" style={{ marginTop: 16 }}>
              Alertas de inventario
            </div>
            {lowStock.length === 0 && (
              <div className="empty">Inventario en buen estado</div>
            )}
            {lowStock.map(function (p) {
              var avail = p.total - p.rented;
              return (
                <div key={p.id} className="alert-item warning">
                  <div className="alert-title">Stock bajo - {p.name}</div>
                  <div className="alert-sub">
                    Disponible: {avail} de {p.total} unidades (
                    {Math.round((avail / p.total) * 100)}%)
                  </div>
                </div>
              );
            })}
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
                    <h2>Detalle de Recogida</h2>
                    <button
                      className="modal-close"
                      onClick={function () {
                        setSelectedAlert(null);
                      }}
                    >
                      x
                    </button>
                  </div>
                  <div className="modal-body">
                    <div className="modal-section">
                      <div className="modal-section-title">Cliente</div>
                      <div style={{ fontSize: 16, fontWeight: 600 }}>
                        {selectedAlert.client}
                      </div>
                    </div>
                    <div className="modal-section">
                      <div className="modal-section-title">Informacion</div>
                      <div className="modal-info">
                        <div className="modal-info-item">
                          <div className="modal-info-label">Evento</div>
                          <div className="modal-info-value">
                            {selectedAlert.event}
                          </div>
                        </div>
                        <div className="modal-info-item">
                          <div className="modal-info-label">Telefono</div>
                          <div className="modal-info-value">
                            {selectedAlert.phone}
                          </div>
                        </div>
                        <div className="modal-info-item">
                          <div className="modal-info-label">Ubicacion</div>
                          <div className="modal-info-value">
                            {selectedAlert.location}
                          </div>
                        </div>
                        <div className="modal-info-item">
                          <div className="modal-info-label">Fecha Recogida</div>
                          <div className="modal-info-value">
                            {selectedAlert.pickup}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="modal-section">
                      <div className="modal-section-title">Productos</div>
                      <div className="modal-products">
                        <div className="modal-product-header">
                          <span>Producto</span>
                          <span style={{ textAlign: "center" }}>Cantidad</span>
                          <span style={{ textAlign: "right" }}>Precio</span>
                        </div>
                        {selectedAlert.items.map(function (item, idx) {
                          var prod = products.find(function (p) {
                            return p.name === item.name;
                          });
                          return (
                            <div key={idx} className="modal-product-row">
                              <span>{item.name}</span>
                              <span
                                className="modal-product-qty"
                                style={{ textAlign: "center" }}
                              >
                                {item.qty}
                              </span>
                              <span
                                className="modal-product-price"
                                style={{ textAlign: "right" }}
                              >
                                $
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
                          ${resTotal(selectedAlert).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div
                      className="row-actions"
                      style={{ marginTop: 16, justifyContent: "center" }}
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
                        className="btn btn-sm"
                        style={{
                          background: "#0088cc",
                          color: "#fff",
                          borderColor: "#0088cc",
                        }}
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
                        Factura PDF
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
