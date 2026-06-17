const channels = ["FT/OH", "Banner", "Lamudi", "Rumah123", "OLX", "Instagram", "Tiktok", "Youtube"];
const metrics = ["Visit", "View", "Leads", "Offer"];
const blockCount = 4;
const form = document.querySelector("#vprForm");
const blocks = document.querySelector("#reportBlocks");
const preview = document.querySelector("#reportPreview");
const draftState = document.querySelector("#draftState");
const pdfLink = document.querySelector("#pdfLink");
let activePdfUrl = "";

function fieldName(block, metric, channel) {
  return `block${block}_${metric}_${channel.replace(/[^a-z0-9]/gi, "_")}`;
}

function value(name) {
  const el = form.elements[name];
  return el ? el.value.trim() : "";
}

function formatCurrencyValue(raw) {
  let text = String(raw || "").replace(/[^\d,]/g, "");
  if (!text) return "";
  const hasDecimal = text.includes(",");
  const parts = text.split(",");
  const integerDigits = parts.shift().replace(/^0+(?=\d)/, "");
  const decimalDigits = parts.join("").slice(0, 2);
  const formattedInteger = (integerDigits || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return hasDecimal ? `${formattedInteger}${decimalDigits ? `,${decimalDigits}` : ","}` : formattedInteger;
}

function formatCurrencyInput(input) {
  input.value = formatCurrencyValue(input.value);
}

function escapeHtml(text) {
  return String(text || "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char]));
}

function buildBlocks() {
  const frag = document.createDocumentFragment();
  for (let i = 1; i <= blockCount; i++) {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "panel";
    fieldset.innerHTML = `
      <legend>Listing ${i}</legend>
      <div class="block-head">
        <label>Propety Type
          <select name="block${i}_propertyType">
            <option value="">Pilih</option>
            <option value="Rumah">Rumah</option>
            <option value="Tanah">Tanah</option>
            <option value="Ruko">Ruko</option>
            <option value="Gedung">Gedung</option>
            <option value="Gudang">Gudang</option>
            <option value="Pabrik">Pabrik</option>
            <option value="Komersial">Komersial</option>
          </select>
        </label>
        <label>Listing Type
          <select name="block${i}_listingType">
            <option value="">Pilih</option>
            <option value="Sewa">Sewa</option>
            <option value="Jual">Jual</option>
          </select>
        </label>
        <label>Date Published<input name="block${i}_datePublished" type="date" /></label>
      </div>
      <label class="price-row">Price<input name="block${i}_price" inputmode="decimal" data-money /></label>
      <div class="metrics-title">Marketing Activity And Advertising</div>
      <div class="metric-scroll">
        <table class="metric-table">
          <thead><tr><th></th>${channels.map(c => `<th>${c}</th>`).join("")}</tr></thead>
          <tbody>
            ${metrics.map(metric => `<tr><td>${metric}</td>${channels.map(channel => `<td><input name="${fieldName(i, metric, channel)}" inputmode="numeric" /></td>`).join("")}</tr>`).join("")}
          </tbody>
        </table>
      </div>
      <label>Recommendation<textarea name="block${i}_recommendation"></textarea></label>
    `;
    frag.appendChild(fieldset);
  }
  blocks.appendChild(frag);
}

function readData() {
  const data = {
    vendorName: value("vendorName"),
    phone: value("phone"),
    agentName: value("agentName"),
    blocks: []
  };
  for (let i = 1; i <= blockCount; i++) {
    const block = {
      propertyType: value(`block${i}_propertyType`),
      listingType: value(`block${i}_listingType`),
      datePublished: value(`block${i}_datePublished`),
      price: value(`block${i}_price`),
      recommendation: value(`block${i}_recommendation`),
      metrics: {}
    };
    for (const metric of metrics) {
      block.metrics[metric] = {};
      for (const channel of channels) block.metrics[metric][channel] = value(fieldName(i, metric, channel));
    }
    data.blocks.push(block);
  }
  return data;
}

function show(text) {
  return text ? escapeHtml(text) : `<span class="empty">&nbsp;</span>`;
}

function renderPreview() {
  const data = readData();
  preview.innerHTML = `
    <div class="report-header">
      <h2 class="report-title">Vendor Performance Report</h2>
      <div class="raywhite-logo report-logo" aria-label="Ray White logo"><span>Ray White</span></div>
    </div>
    <div class="report-meta">
      <div class="report-line"><span>Vendor Name :</span><span>${show(data.vendorName)}</span></div>
      <div class="report-line"><span>phone :</span><span>${show(data.phone)}</span></div>
    </div>
    <div class="report-line"><span>Agent Name :</span><span>${show(data.agentName)}</span></div>
    ${data.blocks.map(block => `
      <section>
        <div class="report-row">
          <div class="report-line"><span>Propety Type :</span><span>${show(block.propertyType)}</span></div>
          <div class="report-line"><span>Listing Type :</span><span>${show(block.listingType)}</span></div>
        </div>
        <div class="report-row">
          <div class="report-line"><span>Price :</span><span>${show(block.price)}</span></div>
          <div class="report-line"><span>Date Published :</span><span>${show(block.datePublished)}</span></div>
        </div>
        <div class="report-section-title">Marketing Activity And Advertising</div>
        <table class="report-table">
          <thead><tr><th></th>${channels.map(c => `<th>${c}</th>`).join("")}</tr></thead>
          <tbody>${metrics.map(metric => `<tr><td>${metric}</td>${channels.map(channel => `<td>${show(block.metrics[metric][channel])}</td>`).join("")}</tr>`).join("")}</tbody>
        </table>
        <div class="report-reco"><strong>Recommendation :</strong>${show(block.recommendation)}</div>
      </section>
    `).join("")}
  `;
}

function saveDraft() {
  localStorage.setItem("vpr-report-draft", JSON.stringify(readData()));
  draftState.textContent = `Tersimpan ${new Date().toLocaleTimeString("id-ID", {hour: "2-digit", minute: "2-digit"})}`;
}

function loadDraft() {
  const raw = localStorage.getItem("vpr-report-draft");
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    for (const [key, val] of Object.entries(data)) {
      if (key !== "blocks" && form.elements[key]) form.elements[key].value = val || "";
    }
    (data.blocks || []).forEach((block, idx) => {
      const i = idx + 1;
      for (const key of ["propertyType", "listingType", "datePublished", "price", "recommendation"]) {
        const el = form.elements[`block${i}_${key}`];
        if (el) el.value = block[key] || "";
      }
      const priceEl = form.elements[`block${i}_price`];
      if (priceEl) formatCurrencyInput(priceEl);
      for (const metric of metrics) for (const channel of channels) {
        const el = form.elements[fieldName(i, metric, channel)];
        if (el) el.value = block.metrics?.[metric]?.[channel] || "";
      }
    });
    draftState.textContent = "Draft dimuat";
  } catch { localStorage.removeItem("vpr-report-draft"); }
}

function pdfEscape(text) {
  return String(text || "")
    .replace(/[^\x20-\x7E\r\n]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[\r\n]+/g, " ");
}

function wrapText(text, maxChars) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) { lines.push(line); line = word; }
    else line = next;
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function createPdf(data) {
  const width = 595.28, height = 841.89;
  let y = 804;
  const ops = [];
  const line = (x1, y1, x2, y2) => ops.push(`${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
  const rect = (x, yy, w, h) => ops.push(`${x.toFixed(2)} ${yy.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} ${h < 0 ? "re" : "re"} S`);
  const fillRect = (x, yy, w, h, color = "0.93 0.96 0.94") => ops.push(`${color} rg ${x.toFixed(2)} ${yy.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f 0 0 0 RG 0 0 0 rg`);
  const text = (x, yy, value, size = 9, bold = false) => ops.push(`BT /${bold ? "F2" : "F1"} ${size} Tf ${x.toFixed(2)} ${yy.toFixed(2)} Td (${pdfEscape(value)}) Tj ET`);
  const metaLine = (x, label, val) => { text(x, y, label, 9, true); line(x + 76, y - 2, x + 236, y - 2); text(x + 82, y, val, 9, false); };

  ops.push("0.75 w 0 0 0 RG");
  rect(36, 792, 372, 30); text(128, 803, "Vendor Performance Report", 16, true);
  fillRect(438, 792, 121, 30, "1 0.88 0"); rect(438, 792, 121, 30); text(460, 803, "Ray White", 15, true);
  y = 766;
  metaLine(40, "Vendor Name :", data.vendorName); metaLine(320, "Phone :", data.phone); y -= 22;
  metaLine(40, "Agent Name :", data.agentName); y -= 28;

  for (const block of data.blocks) {
    if (y < 220) break;
    metaLine(40, "Propety Type :", block.propertyType); metaLine(320, "Listing Type :", block.listingType); y -= 18;
    metaLine(40, "Price :", block.price); metaLine(320, "Date Published :", block.datePublished); y -= 22;
    fillRect(40, y - 18, 515, 20, "0.18 0.44 0.31"); text(222, y - 12, "Marketing Activity And Advertising", 9, true); y -= 18;

    const tableX = 40, tableW = 515, rowH = 19, firstW = 58, colW = (tableW - firstW) / channels.length;
    fillRect(tableX, y - rowH, tableW, rowH, "0.94 0.96 0.95");
    rect(tableX, y - rowH, tableW, rowH * 4);
    for (let r = 0; r <= 4; r++) line(tableX, y - rowH * r, tableX + tableW, y - rowH * r);
    line(tableX + firstW, y, tableX + firstW, y - rowH * 4);
    channels.forEach((channel, idx) => {
      const x = tableX + firstW + (idx * colW);
      line(x, y, x, y - rowH * 4);
      text(x + 3, y - 13, channel.length > 9 ? channel.slice(0, 9) : channel, 7, true);
    });
    metrics.forEach((metric, rIdx) => {
      const rowY = y - rowH * (rIdx + 1) - 13;
      text(tableX + 5, rowY, metric, 8, true);
      channels.forEach((channel, cIdx) => text(tableX + firstW + cIdx * colW + 5, rowY, block.metrics[metric][channel], 8, false));
    });
    y -= rowH * 4 + 18;
    text(40, y, "Recommendation :", 9, true);
    const lines = wrapText(block.recommendation, 92).slice(0, 3);
    lines.forEach((ln, idx) => text(122, y - idx * 12, ln, 9, false));
    y -= 48;
  }

  const stream = ops.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
  ];
  let pdf = "%PDF-1.4\n";
  const xref = [0];
  objects.forEach((obj, idx) => { xref.push(pdf.length); pdf += `${idx + 1} 0 obj\n${obj}\nendobj\n`; });
  const start = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  xref.slice(1).forEach(pos => { pdf += `${String(pos).padStart(10, "0")} 00000 n \n`; });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;
  return new Blob([pdf], {type: "application/pdf"});
}

function downloadPdf() {
  try {
    renderPreview();
    const data = readData();
    const blob = createPdf(data);
    if (activePdfUrl) URL.revokeObjectURL(activePdfUrl);
    const url = URL.createObjectURL(blob);
    activePdfUrl = url;
    const a = document.createElement("a");
    const cleanName = (data.vendorName || "vendor").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
    const fileName = `vendor-performance-report-${cleanName || "vendor"}.pdf`;
    pdfLink.href = url;
    pdfLink.download = fileName;
    pdfLink.hidden = false;
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    draftState.textContent = "PDF dibuat - jika tidak otomatis tersimpan, klik Buka PDF";
  } catch (error) {
    console.error(error);
    draftState.textContent = "PDF gagal dibuat";
    alert("PDF gagal dibuat. Cek kembali input lalu coba lagi.");
  }
}

buildBlocks();
loadDraft();
renderPreview();
form.addEventListener("input", event => {
  if (event.target.matches("[data-money]")) formatCurrencyInput(event.target);
  renderPreview();
  draftState.textContent = "Perubahan belum disimpan";
});
document.querySelector("#saveDraft").addEventListener("click", saveDraft);
document.querySelector("#downloadPdf").addEventListener("click", downloadPdf);
document.querySelector("#resetForm").addEventListener("click", () => {
  if (!confirm("Kosongkan semua input dan hapus draft?")) return;
  form.reset();
  localStorage.removeItem("vpr-report-draft");
  draftState.textContent = "Belum disimpan";
  renderPreview();
});

