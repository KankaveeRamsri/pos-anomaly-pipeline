const pptxgen = require("pptxgenjs");

const PRIMARY = "1E2761";   // navy
const SECONDARY = "CADCFC"; // ice blue
const WHITE = "FFFFFF";
const ALERT = "B3261E";     // accent red, reserved for anomaly/alert emphasis
const MUTED = "5B6472";     // muted gray for captions/body on white
const CARD_BG = "F3F5FB";   // very light navy tint for cards on white bg

const TITLE_FONT = "Cambria";
const BODY_FONT = "Calibri";

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 in

pres.defineSlideMaster({
  title: "DARK",
  background: { color: PRIMARY },
  objects: [
    { text: { text: "", options: { x: 0, y: 0, w: 0.1, h: 0.1 } } },
  ],
  slideNumber: { x: 12.65, y: 7.1, color: SECONDARY, fontFace: BODY_FONT, fontSize: 10 },
});

pres.defineSlideMaster({
  title: "LIGHT",
  background: { color: WHITE },
  slideNumber: { x: 12.65, y: 7.1, color: MUTED, fontFace: BODY_FONT, fontSize: 10 },
});

function addKicker(slide, text, opts = {}) {
  slide.addText(text.toUpperCase(), {
    x: opts.x ?? 0.6, y: opts.y ?? 0.4, w: opts.w ?? 6, h: 0.35,
    fontFace: BODY_FONT, fontSize: 12, bold: true, color: opts.color ?? ALERT,
    charSpacing: 2, isTextBox: true, margin: 0,
  });
}

function addTitle(slide, text, opts = {}) {
  slide.addText(text, {
    x: opts.x ?? 0.6, y: opts.y ?? 0.72, w: opts.w ?? 12.1, h: opts.h ?? 0.9,
    fontFace: TITLE_FONT, fontSize: opts.fontSize ?? 30, bold: true,
    color: opts.color ?? PRIMARY, isTextBox: true, margin: 0,
  });
}

function addFooterNote(slide, text) {
  slide.addText(text, {
    x: 0.6, y: 7.1, w: 9, h: 0.3, fontFace: BODY_FONT, fontSize: 9,
    color: MUTED, isTextBox: true, margin: 0,
  });
}

/* ============================= 1. TITLE ============================= */
{
  const s = pres.addSlide({ masterName: "DARK" });
  s.addShape(pres.ShapeType.ellipse, { x: 10.6, y: -1.6, w: 4.8, h: 4.8, fill: { color: "26307A" }, line: { type: "none" } });
  s.addShape(pres.ShapeType.ellipse, { x: -1.4, y: 5.2, w: 3.6, h: 3.6, fill: { color: "26307A" }, line: { type: "none" } });

  s.addText("REAL-TIME DATA PIPELINE ARCHITECTURE", {
    x: 0.9, y: 1.7, w: 11.5, h: 0.5, fontFace: BODY_FONT, fontSize: 14, bold: true,
    color: SECONDARY, charSpacing: 3, isTextBox: true, margin: 0,
  });
  s.addText("Real-Time Data Pipeline Architecture & Anomaly Detection\nSystem for Enterprise POS", {
    x: 0.9, y: 2.2, w: 11.5, h: 1.9, fontFace: TITLE_FONT, fontSize: 40, bold: true,
    color: WHITE, isTextBox: true, margin: 0, lineSpacing: 46,
  });
  s.addText("Task 1-4: Workload Generation · Resilient Airflow Ingestion · Live Analytics Dashboard · Architectural Benchmark Report", {
    x: 0.9, y: 4.05, w: 10.8, h: 0.6, fontFace: BODY_FONT, fontSize: 14, italic: true,
    color: SECONDARY, isTextBox: true, margin: 0,
  });

  s.addShape(pres.ShapeType.rect, { x: 0.9, y: 5.4, w: 5.6, h: 1.35, fill: { color: "141B4D" }, line: { type: "none" } });
  s.addText([
    { text: "นายกันต์กวี รามศรี", options: { fontSize: 16, bold: true, color: WHITE, breakLine: true } },
    { text: "รหัสนักศึกษา 6900102365", options: { fontSize: 13, color: SECONDARY, breakLine: true } },
    { text: "นำเสนอวันที่ 15 กันยายน 2569", options: { fontSize: 13, color: SECONDARY } },
  ], { x: 1.15, y: 5.55, w: 5.1, h: 1.1, fontFace: BODY_FONT, isTextBox: true, margin: 0, valign: "middle" });
}

/* ============================= 2. AGENDA ============================= */
{
  const s = pres.addSlide({ masterName: "LIGHT" });
  addKicker(s, "Agenda");
  addTitle(s, "วัตถุประสงค์และขอบเขตการนำเสนอ");

  const items = [
    ["01", "Task 1 — Advanced Workload & Edge Case Generation", "จำลอง Flash Sale, Late-Arriving Data และ Data Quality Issues ในระบบ POS จริง"],
    ["02", "Task 2 — Resilient Airflow Ingestion Pipeline", "Deferrable Operator, TaskFlow API, Idempotency และ Dynamic Alerting"],
    ["03", "Task 3 — Live Analytics Dashboard & Secure Deployment", "Streamlit Dashboard พร้อม Moving Average และ Anomaly Highlighting"],
    ["04", "Task 4 — Architectural Report & Performance Analysis", "Benchmark เชิงตัวเลข และข้อเสนอสถาปัตยกรรมสำหรับ 10,000 TPS"],
  ];
  let y = 1.95;
  items.forEach(([num, head, sub]) => {
    s.addShape(pres.ShapeType.roundRect, { x: 0.6, y, w: 12.1, h: 1.15, rectRadius: 0.08, fill: { color: CARD_BG }, line: { type: "none" } });
    s.addShape(pres.ShapeType.ellipse, { x: 0.95, y: y + 0.28, w: 0.6, h: 0.6, fill: { color: PRIMARY }, line: { type: "none" } });
    s.addText(num, { x: 0.95, y: y + 0.28, w: 0.6, h: 0.6, align: "center", valign: "middle", fontFace: BODY_FONT, fontSize: 16, bold: true, color: WHITE, isTextBox: true, margin: 0 });
    s.addText(head, { x: 1.85, y: y + 0.14, w: 10.5, h: 0.42, fontFace: BODY_FONT, fontSize: 16, bold: true, color: PRIMARY, isTextBox: true, margin: 0 });
    s.addText(sub, { x: 1.85, y: y + 0.56, w: 10.5, h: 0.42, fontFace: BODY_FONT, fontSize: 12.5, color: MUTED, isTextBox: true, margin: 0 });
    y += 1.3;
  });
}

/* ============================= 3. ARCHITECTURE OVERVIEW ============================= */
{
  const s = pres.addSlide({ masterName: "LIGHT" });
  addKicker(s, "System Overview");
  addTitle(s, "ภาพรวมสถาปัตยกรรมของระบบ (End-to-End)");

  const boxes = [
    ["1", "Workload\nGenerator", "Python script"],
    ["2", "Landing\nDirectory", "JSONL batch files"],
    ["3", "Airflow DAG", "Deferrable Sensor\n+ TaskFlow API"],
    ["4", "PostgreSQL", "pos_transactions\n(idempotent upsert)"],
    ["5", "Streamlit\nDashboard", "Moving avg +\nanomaly highlight"],
  ];
  const boxW = 2.05, gap = 0.36, startX = 0.65, boxY = 2.55, boxH = 1.5;
  boxes.forEach((b, i) => {
    const x = startX + i * (boxW + gap);
    s.addShape(pres.ShapeType.roundRect, { x, y: boxY, w: boxW, h: boxH, rectRadius: 0.08, fill: { color: i === 2 ? PRIMARY : CARD_BG }, line: { type: "none" } });
    s.addShape(pres.ShapeType.ellipse, { x: x + boxW / 2 - 0.22, y: boxY + 0.18, w: 0.44, h: 0.44, fill: { color: i === 2 ? SECONDARY : PRIMARY }, line: { type: "none" } });
    s.addText(b[0], { x: x + boxW / 2 - 0.22, y: boxY + 0.18, w: 0.44, h: 0.44, align: "center", valign: "middle", fontFace: BODY_FONT, fontSize: 14, bold: true, color: i === 2 ? PRIMARY : WHITE, isTextBox: true, margin: 0 });
    s.addText(b[1], { x: x + 0.05, y: boxY + 0.68, w: boxW - 0.1, h: 0.5, align: "center", fontFace: BODY_FONT, fontSize: 12.5, bold: true, color: i === 2 ? WHITE : PRIMARY, isTextBox: true, margin: 0 });
    s.addText(b[2], { x: x + 0.05, y: boxY + 1.14, w: boxW - 0.1, h: 0.36, align: "center", fontFace: BODY_FONT, fontSize: 9.5, color: i === 2 ? SECONDARY : MUTED, isTextBox: true, margin: 0 });
    if (i < boxes.length - 1) {
      s.addText("→", { x: x + boxW, y: boxY, w: gap, h: boxH, align: "center", valign: "middle", fontFace: BODY_FONT, fontSize: 22, bold: true, color: PRIMARY, isTextBox: true, margin: 0 });
    }
  });

  s.addShape(pres.ShapeType.roundRect, { x: 4.85, y: 4.55, w: 3.65, h: 0.95, rectRadius: 0.08, fill: { color: "FBEAEA" }, line: { type: "none" } });
  s.addText("↑", { x: 4.85, y: 4.15, w: 3.65, h: 0.4, align: "center", fontFace: BODY_FONT, fontSize: 16, bold: true, color: ALERT, isTextBox: true, margin: 0 });
  s.addText("Anomaly Alert → Telegram / Slack Webhook", { x: 5.0, y: 4.7, w: 3.35, h: 0.65, align: "center", valign: "middle", fontFace: BODY_FONT, fontSize: 12, bold: true, color: ALERT, isTextBox: true, margin: 0 });

  s.addText("ทุกขั้นตอนออกแบบให้ Idempotent — รัน DAG ซ้ำกี่ครั้ง ข้อมูลใน PostgreSQL จะไม่ซ้ำซ้อน (ยืนยันด้วยการทดสอบจริง)", {
    x: 0.65, y: 5.9, w: 12.1, h: 0.5, fontFace: BODY_FONT, fontSize: 13, italic: true, color: MUTED, isTextBox: true, margin: 0,
  });
}

/* ============================= 4. TASK 1 - GENERATOR ============================= */
{
  const s = pres.addSlide({ masterName: "LIGHT" });
  addKicker(s, "Task 1");
  addTitle(s, "Advanced Workload & Edge Case Generation");
  s.addText("จำลองสถานการณ์จริงของระบบ POS ด้วย Python script (scripts/workload_generator.py) เพิ่มเติมจากยอดขายปกติ", {
    x: 0.6, y: 1.55, w: 12.1, h: 0.5, fontFace: BODY_FONT, fontSize: 14, color: MUTED, isTextBox: true, margin: 0,
  });

  const cases = [
    ["⚡", "Flash Sale", "ยอดขายพุ่งสูงขึ้น 10 เท่าชั่วขณะ (configurable burst window)", ALERT],
    ["↺", "Late-Arriving Data", "event_time ล่าช้ากว่าเวลาจริง จำลอง Network/Device Latency", PRIMARY],
    ["ID", "Duplicate Transaction ID", "ยิง transaction_id ซ้ำจากรายการก่อนหน้าโดยตั้งใจ", PRIMARY],
    ["−", "Negative Total Amount", "จำลอง Total Amount ติดลบ เพื่อทดสอบ Data Quality Validation", ALERT],
  ];
  let x = 0.6;
  cases.forEach(([icon, head, desc, color]) => {
    const w = 2.95, gap = 0.2, h = 3.1, y = 2.35;
    s.addShape(pres.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.08, fill: { color: CARD_BG }, line: { type: "none" } });
    s.addShape(pres.ShapeType.ellipse, { x: x + w / 2 - 0.4, y: y + 0.3, w: 0.8, h: 0.8, fill: { color }, line: { type: "none" } });
    s.addText(icon, { x: x + w / 2 - 0.4, y: y + 0.3, w: 0.8, h: 0.8, align: "center", valign: "middle", fontFace: BODY_FONT, fontSize: icon.length > 1 ? 18 : 26, bold: true, color: WHITE, isTextBox: true, margin: 0 });
    s.addText(head, { x: x + 0.15, y: y + 1.3, w: w - 0.3, h: 0.75, align: "center", fontFace: BODY_FONT, fontSize: 14, bold: true, color: PRIMARY, isTextBox: true, margin: 0 });
    s.addText(desc, { x: x + 0.2, y: y + 2.0, w: w - 0.4, h: 1.0, align: "center", fontFace: BODY_FONT, fontSize: 11, color: MUTED, isTextBox: true, margin: 0 });
    x += w + gap;
  });

  addFooterNote(s, "scripts/workload_generator.py — CLI configurable: --flash-sale-at, --late-arrival-rate, --duplicate-rate, --negative-amount-rate");
}

/* ============================= 5. TASK 1 - RESULTS ============================= */
{
  const s = pres.addSlide({ masterName: "LIGHT" });
  addKicker(s, "Task 1 — ผลการทดลองจริง");
  addTitle(s, "ผลการรัน Workload Generator บนระบบจริง");

  s.addChart(pres.ChartType.bar, [{
    name: "Records ต่อ Batch (5 วินาที)",
    labels: ["ปกติ\n(t=0-20s)", "Flash Sale\n(t=25-40s)", "กลับสู่ปกติ\n(t=45-95s)"],
    values: [10, 100, 10],
  }], {
    x: 0.6, y: 1.7, w: 6.3, h: 4.6,
    chartColors: [SECONDARY, ALERT, SECONDARY],
    showTitle: true, title: "อัตรา Transaction ต่อ Batch — พุ่งขึ้น 10 เท่าช่วง Flash Sale",
    titleFontSize: 13, titleColor: PRIMARY, titleFontFace: BODY_FONT,
    showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 12, dataLabelColor: PRIMARY,
    catAxisLabelColor: MUTED, valAxisLabelColor: MUTED, valAxisHidden: false,
    valGridLine: { color: "E3E7F0", size: 1 }, catGridLine: { style: "none" },
    showLegend: false, barGapWidthPct: 40,
  });

  const stats = [["560", "Total Records\nที่สร้างทั้งหมด"], ["62", "Anomalies\nที่ Inject โดยตั้งใจ"], ["10×", "Peak Multiplier\nช่วง Flash Sale"]];
  let sy = 1.85;
  stats.forEach(([num, label]) => {
    s.addShape(pres.ShapeType.roundRect, { x: 7.25, y: sy, w: 5.45, h: 1.25, rectRadius: 0.08, fill: { color: CARD_BG }, line: { type: "none" } });
    s.addText(num, { x: 7.5, y: sy + 0.12, w: 2.0, h: 1.0, valign: "middle", fontFace: TITLE_FONT, fontSize: 34, bold: true, color: PRIMARY, isTextBox: true, margin: 0 });
    s.addText(label, { x: 9.5, y: sy, w: 3.05, h: 1.25, valign: "middle", fontFace: BODY_FONT, fontSize: 12.5, color: MUTED, isTextBox: true, margin: 0 });
    sy += 1.45;
  });
  s.addText("ทดสอบจริงด้วยคำสั่ง: python workload_generator.py --duration 100 --flash-sale-at 25 --flash-sale-multiplier 10", {
    x: 7.25, y: sy + 0.05, w: 5.45, h: 0.9, fontFace: "Courier New", fontSize: 9.5, color: MUTED, isTextBox: true, margin: 0,
  });
}

/* ============================= 6. TASK 2 - OVERVIEW ============================= */
{
  const s = pres.addSlide({ masterName: "LIGHT" });
  addKicker(s, "Task 2");
  addTitle(s, "Resilient Airflow Ingestion Pipeline");
  s.addText("dags/pos_ingestion_pipeline.py — ออกแบบตามมาตรฐาน Clean Code ด้วย TaskFlow API", {
    x: 0.6, y: 1.55, w: 12.1, h: 0.5, fontFace: BODY_FONT, fontSize: 14, color: MUTED, isTextBox: true, margin: 0,
  });

  const feats = [
    ["Deferrable Operator", "FileSensor(deferrable=True) แทน mode='poke' — คืน Worker Slot ระหว่างรอไฟล์"],
    ["TaskFlow API + XCom", "@dag / @task decorator ส่งข้อมูลระหว่าง task ผ่าน XCom ตลอด pipeline"],
    ["Idempotency & Cleanse", "INSERT ... ON CONFLICT DO UPDATE — รัน DAG ซ้ำข้อมูลไม่ซ้ำซ้อน 100%"],
    ["Dynamic Alerting", "แจ้งเตือนอัตโนมัติผ่าน Telegram/Slack Webhook เมื่อพบ Anomaly"],
  ];
  let y = 2.3;
  feats.forEach(([head, desc], i) => {
    s.addShape(pres.ShapeType.roundRect, { x: 0.6, y, w: 12.1, h: 1.0, rectRadius: 0.08, fill: { color: i % 2 === 0 ? CARD_BG : WHITE }, line: i % 2 === 0 ? { type: "none" } : { color: "E3E7F0", width: 1 } });
    s.addShape(pres.ShapeType.roundRect, { x: 0.85, y: y + 0.22, w: 0.14, h: 0.56, fill: { color: PRIMARY }, line: { type: "none" }, rectRadius: 0.02 });
    s.addText(head, { x: 1.2, y: y + 0.1, w: 3.6, h: 0.8, valign: "middle", fontFace: BODY_FONT, fontSize: 14.5, bold: true, color: PRIMARY, isTextBox: true, margin: 0 });
    s.addText(desc, { x: 4.9, y: y + 0.1, w: 7.6, h: 0.8, valign: "middle", fontFace: BODY_FONT, fontSize: 12.5, color: MUTED, isTextBox: true, margin: 0 });
    y += 1.15;
  });
}

/* ============================= 7. TASK 2 - DEFERRABLE COMPARISON ============================= */
{
  const s = pres.addSlide({ masterName: "LIGHT" });
  addKicker(s, "Task 2 — Resource Optimization");
  addTitle(s, "Deferrable Operator vs. FileSensor แบบดั้งเดิม");

  const cols = [
    ["mode='poke'", "running\n(ตลอดการรอ)", "ครอบครอง Worker Slot ตลอดเวลา", "CADCFC"],
    ["mode='reschedule'", "up_for_reschedule", "คืน Slot ระหว่างรอบ poke_interval", "CADCFC"],
    ["deferrable=True", "deferred", "คืน Slot ทั้งหมด — Triggerer จัดการแทน", PRIMARY],
  ];
  const w = 3.85, gap = 0.28, startX = 0.6, y = 1.9, h = 3.55;
  cols.forEach(([head, state, desc, color], i) => {
    const x = startX + i * (w + gap);
    const isDeferrable = i === 2;
    s.addShape(pres.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.08, fill: { color: isDeferrable ? PRIMARY : CARD_BG }, line: { type: "none" } });
    s.addText(head, { x: x + 0.25, y: y + 0.25, w: w - 0.5, h: 0.5, fontFace: BODY_FONT, fontSize: 15, bold: true, color: isDeferrable ? WHITE : PRIMARY, isTextBox: true, margin: 0 });
    s.addShape(pres.ShapeType.roundRect, { x: x + 0.25, y: y + 0.9, w: w - 0.5, h: 0.55, rectRadius: 0.06, fill: { color: isDeferrable ? SECONDARY : WHITE }, line: { type: "none" } });
    s.addText(`state = "${state}"`, { x: x + 0.25, y: y + 0.9, w: w - 0.5, h: 0.55, align: "center", valign: "middle", fontFace: "Courier New", fontSize: 11.5, bold: true, color: PRIMARY, isTextBox: true, margin: 0 });
    s.addText(desc, { x: x + 0.25, y: y + 1.75, w: w - 0.5, h: 1.5, fontFace: BODY_FONT, fontSize: 12.5, color: isDeferrable ? SECONDARY : MUTED, isTextBox: true, margin: 0 });
  });

  s.addText("✓ ยืนยันด้วยการรันจริง: benchmark_sensors.py วัด task_states_seen ของทั้ง 3 DAG ตรงตามที่ออกแบบไว้ทุกกรณี", {
    x: 0.6, y: 5.75, w: 12.1, h: 0.5, fontFace: BODY_FONT, fontSize: 13, bold: true, color: PRIMARY, isTextBox: true, margin: 0,
  });
}

/* ============================= 8. TASK 2 - IDEMPOTENCY ============================= */
{
  const s = pres.addSlide({ masterName: "LIGHT" });
  addKicker(s, "Task 2 — Idempotency & Data Cleanse");
  addTitle(s, "รัน DAG ซ้ำกี่ครั้ง ข้อมูลก็ไม่ซ้ำซ้อน");

  s.addShape(pres.ShapeType.roundRect, { x: 0.6, y: 1.8, w: 6.9, h: 3.5, rectRadius: 0.08, fill: { color: "1A1F3D" }, line: { type: "none" } });
  s.addText([
    { text: "INSERT INTO pos_transactions (...)\n", options: { color: SECONDARY } },
    { text: "VALUES (...)\n", options: { color: WHITE } },
    { text: "ON CONFLICT (transaction_id)\n", options: { color: "FFD166", bold: true } },
    { text: "DO UPDATE SET\n", options: { color: "FFD166", bold: true } },
    { text: "    total_amount = EXCLUDED.total_amount,\n    is_anomaly    = EXCLUDED.is_anomaly,\n    updated_at    = now()\n", options: { color: WHITE } },
    { text: "RETURNING (xmax = 0) AS was_insert;", options: { color: SECONDARY } },
  ], { x: 0.9, y: 2.05, w: 6.3, h: 3.0, fontFace: "Courier New", fontSize: 12.5, isTextBox: true, margin: 0, lineSpacing: 20 });

  s.addShape(pres.ShapeType.roundRect, { x: 7.75, y: 1.8, w: 4.95, h: 1.6, rectRadius: 0.08, fill: { color: CARD_BG }, line: { type: "none" } });
  s.addText("ผลทดสอบจริง (reprocess ไฟล์เดิมซ้ำ 2 ครั้ง)", { x: 7.95, y: 1.95, w: 4.55, h: 0.4, fontFace: BODY_FONT, fontSize: 12, bold: true, color: PRIMARY, isTextBox: true, margin: 0 });
  s.addText([
    { text: "58 ", options: { fontSize: 30, bold: true, color: PRIMARY } },
    { text: " → ", options: { fontSize: 20, color: MUTED } },
    { text: "58", options: { fontSize: 30, bold: true, color: PRIMARY } },
    { text: "  rows (ไม่เปลี่ยน)", options: { fontSize: 13, color: MUTED } },
  ], { x: 7.95, y: 2.35, w: 4.55, h: 0.9, valign: "middle", fontFace: BODY_FONT, isTextBox: true, margin: 0 });

  s.addShape(pres.ShapeType.roundRect, { x: 7.75, y: 3.6, w: 4.95, h: 1.7, rectRadius: 0.08, fill: { color: "FBEAEA" }, line: { type: "none" } });
  s.addText("Anomaly ไม่ถูกทิ้ง แต่ถูก Flag ไว้ตรวจสอบ", { x: 7.95, y: 3.75, w: 4.55, h: 0.4, fontFace: BODY_FONT, fontSize: 12, bold: true, color: ALERT, isTextBox: true, margin: 0 });
  s.addText("duplicate_in_batch · late_arrival · negative_total_amount\nบันทึกลง pos_anomalies พร้อม UNIQUE(transaction_id, anomaly_type) ป้องกัน log ซ้ำ", {
    x: 7.95, y: 4.15, w: 4.55, h: 1.1, fontFace: BODY_FONT, fontSize: 12, color: "7A2E28", isTextBox: true, margin: 0,
  });

  addFooterNote(s, "late_arrival วัดจาก file landing time (mtime) ไม่ใช่ wall-clock ขณะประมวลผล — เพื่อให้ผล deterministic ทุกครั้งที่ rerun");
}

/* ============================= 9. TASK 2 - ALERTING ============================= */
{
  const s = pres.addSlide({ masterName: "LIGHT" });
  addKicker(s, "Task 2 — Dynamic Alerting");
  addTitle(s, "ระบบแจ้งเตือนอัตโนมัติเมื่อพบ Anomaly");

  const steps = [
    ["1", "load_to_postgres", "นับจำนวน anomaly ที่พบในแต่ละ batch ผ่าน XCom summary"],
    ["2", "check_and_alert", "ตรวจสอบ anomaly_count > 0 แล้วประกอบข้อความแจ้งเตือน"],
    ["3", "Webhook Dispatch", "ส่งผ่าน Telegram Bot API หรือ Slack Incoming Webhook"],
  ];
  let x = 0.6;
  const w = 3.85, gap = 0.28, y = 2.1, h = 2.1;
  steps.forEach(([n, head, desc]) => {
    s.addShape(pres.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.08, fill: { color: CARD_BG }, line: { type: "none" } });
    s.addShape(pres.ShapeType.ellipse, { x: x + 0.25, y: y + 0.25, w: 0.5, h: 0.5, fill: { color: PRIMARY }, line: { type: "none" } });
    s.addText(n, { x: x + 0.25, y: y + 0.25, w: 0.5, h: 0.5, align: "center", valign: "middle", fontFace: BODY_FONT, fontSize: 14, bold: true, color: WHITE, isTextBox: true, margin: 0 });
    s.addText(head, { x: x + 0.25, y: y + 0.9, w: w - 0.5, h: 0.45, fontFace: BODY_FONT, fontSize: 14, bold: true, color: PRIMARY, isTextBox: true, margin: 0 });
    s.addText(desc, { x: x + 0.25, y: y + 1.35, w: w - 0.5, h: 0.65, fontFace: BODY_FONT, fontSize: 11.5, color: MUTED, isTextBox: true, margin: 0 });
    if (x < 9) s.addText("→", { x: x + w, y, w: gap, h, align: "center", valign: "middle", fontFace: BODY_FONT, fontSize: 20, bold: true, color: PRIMARY, isTextBox: true, margin: 0 });
    x += w + gap;
  });

  s.addShape(pres.ShapeType.roundRect, { x: 0.6, y: 4.55, w: 12.1, h: 1.45, rectRadius: 0.08, fill: { color: "1A1F3D" }, line: { type: "none" } });
  s.addText([
    { text: "POS anomaly alert: ", options: { color: "FFD166", bold: true, breakLine: false } },
    { text: "6 anomalous transaction(s) out of 30 in this batch (24 new, 6 reloaded).\n", options: { color: WHITE } },
    { text: "# ไม่มี BOT token → ระบบ log ข้อความเดียวกันแบบ dry-run โดยไม่ทำให้ DAG fail", options: { color: SECONDARY, italic: true } },
  ], { x: 0.9, y: 4.75, w: 11.5, h: 1.1, fontFace: "Courier New", fontSize: 12, isTextBox: true, margin: 0, lineSpacing: 20 });
}

/* ============================= 10. TASK 3 - DASHBOARD ============================= */
{
  const s = pres.addSlide({ masterName: "LIGHT" });
  addKicker(s, "Task 3");
  addTitle(s, "Live Analytics Dashboard (Streamlit)");

  s.addChart(pres.ChartType.bar, [{
    name: "Revenue (THB)",
    labels: ["46:30", "46:45", "47:00", "47:15", "47:30", "47:45", "48:00", "48:15"],
    values: [1150, 3764, 25677, 24198, 3233, 4433, 3274, 1093],
  }], {
    x: 0.6, y: 1.65, w: 7.6, h: 3.5,
    chartColors: [PRIMARY],
    showTitle: true, title: "ยอดขายรายช่วงเวลา (ข้อมูลจริงจาก pos_data) — Flash Sale ชัดเจน",
    titleFontSize: 12.5, titleColor: PRIMARY, titleFontFace: BODY_FONT,
    showValue: false, catAxisLabelColor: MUTED, valAxisLabelColor: MUTED,
    valGridLine: { color: "E3E7F0", size: 1 }, catGridLine: { style: "none" }, showLegend: false,
  });
  s.addText("Dashboard คำนวณ Moving Average ซ้อนทับกราฟยอดขาย และไฮไลต์แถวที่เป็น Anomaly ด้วยสีแดงในตาราง Transaction", {
    x: 0.6, y: 5.25, w: 7.6, h: 0.7, fontFace: BODY_FONT, fontSize: 12, color: MUTED, isTextBox: true, margin: 0,
  });

  const kpis = [["542", "Transactions Loaded"], ["58", "Flagged Anomalies"], ["10.7%", "Anomaly Rate"]];
  let ky = 1.7;
  kpis.forEach(([num, label]) => {
    s.addShape(pres.ShapeType.roundRect, { x: 8.5, y: ky, w: 4.2, h: 1.05, rectRadius: 0.08, fill: { color: CARD_BG }, line: { type: "none" } });
    s.addText(num, { x: 8.7, y: ky, w: 1.7, h: 1.05, valign: "middle", fontFace: TITLE_FONT, fontSize: 26, bold: true, color: PRIMARY, isTextBox: true, margin: 0 });
    s.addText(label, { x: 10.4, y: ky, w: 2.15, h: 1.05, valign: "middle", fontFace: BODY_FONT, fontSize: 11.5, color: MUTED, isTextBox: true, margin: 0 });
    ky += 1.25;
  });
}

/* ============================= 11. TASK 3 - DEPLOYMENT ============================= */
{
  const s = pres.addSlide({ masterName: "LIGHT" });
  addKicker(s, "Task 3 — Secure Deployment");
  addTitle(s, "การเปิดใช้งาน Dashboard ผ่าน HTTPS Domain");

  const rows = [
    ["Dashboard Code", "dashboard/app.py พร้อม requirements.txt", "เสร็จสมบูรณ์"],
    ["Public Database", "PostgreSQL บน Neon (Serverless) — migrate ข้อมูลจริง 542 แถว", "เสร็จสมบูรณ์"],
    ["Public HTTPS Deploy", "Streamlit Community Cloud เชื่อมกับ GitHub Repo", "เสร็จสมบูรณ์ — Live"],
  ];
  let y = 1.85;
  rows.forEach(([head, detail, status]) => {
    s.addShape(pres.ShapeType.roundRect, { x: 0.6, y, w: 12.1, h: 1.0, rectRadius: 0.08, fill: { color: CARD_BG }, line: { type: "none" } });
    s.addShape(pres.ShapeType.ellipse, { x: 0.9, y: y + 0.25, w: 0.5, h: 0.5, fill: { color: PRIMARY }, line: { type: "none" } });
    s.addText("✓", { x: 0.9, y: y + 0.25, w: 0.5, h: 0.5, align: "center", valign: "middle", fontFace: BODY_FONT, fontSize: 16, bold: true, color: WHITE, isTextBox: true, margin: 0 });
    s.addText(head, { x: 1.65, y: y + 0.08, w: 4.0, h: 0.85, valign: "middle", fontFace: BODY_FONT, fontSize: 14, bold: true, color: PRIMARY, isTextBox: true, margin: 0 });
    s.addText(detail, { x: 5.75, y: y + 0.08, w: 4.6, h: 0.85, valign: "middle", fontFace: BODY_FONT, fontSize: 11.5, color: MUTED, isTextBox: true, margin: 0 });
    s.addText(status, { x: 10.45, y: y + 0.08, w: 2.15, h: 0.85, valign: "middle", fontFace: BODY_FONT, fontSize: 11.5, bold: true, color: PRIMARY, isTextBox: true, margin: 0 });
    y += 1.18;
  });

  s.addShape(pres.ShapeType.roundRect, { x: 0.6, y: 5.35, w: 12.1, h: 1.2, rectRadius: 0.08, fill: { color: PRIMARY }, line: { type: "none" } });
  s.addText("LIVE DASHBOARD URL", { x: 0.9, y: 5.5, w: 6, h: 0.4, fontFace: BODY_FONT, fontSize: 12, bold: true, color: SECONDARY, charSpacing: 1.5, isTextBox: true, margin: 0 });
  s.addText("pos-anomaly-pipeline-duga3in95l2i7apb78xzee.streamlit.app", {
    x: 0.9, y: 5.85, w: 11.5, h: 0.55, fontFace: "Courier New", fontSize: 17, bold: true, color: WHITE, isTextBox: true, margin: 0,
  });

  addFooterNote(s, "Architecture: GitHub (source) → Streamlit Community Cloud (hosting + HTTPS) → Neon PostgreSQL (public serverless DB) — ข้อมูลจาก local pipeline ถูก migrate ขึ้นจริง");
}

/* ============================= 12. TASK 4 - METHODOLOGY ============================= */
{
  const s = pres.addSlide({ masterName: "LIGHT" });
  addKicker(s, "Task 4 — Benchmark Methodology");
  addTitle(s, "วิธีการวัดผล Poke vs Reschedule vs Deferrable");

  s.addText("dags/sensor_benchmark_dags.py — สร้าง 3 DAG ที่เหมือนกันทุกจุด ต่างกันเฉพาะ Sensor Mode เพื่อตัดตัวแปรกวน", {
    x: 0.6, y: 1.55, w: 12.1, h: 0.5, fontFace: BODY_FONT, fontSize: 13.5, color: MUTED, isTextBox: true, margin: 0,
  });

  const steps = [
    "Trigger ทั้ง 3 DAG โดยยังไม่มี trigger file (บังคับให้ sensor ต้องรอจริง)",
    "สุ่มตัวอย่างทุก 5 วินาที เป็นเวลา 30 วินาที: Task State + docker stats (CPU/Memory) ของ scheduler และ triggerer container",
    "วาง trigger file เพื่อปลด sensor แล้วบันทึก final DAG run state",
    "เขียนผลลง report/benchmark_results.csv สำหรับวิเคราะห์ต่อ",
  ];
  let y = 2.45;
  steps.forEach((t, i) => {
    s.addShape(pres.ShapeType.ellipse, { x: 0.6, y, w: 0.44, h: 0.44, fill: { color: PRIMARY }, line: { type: "none" } });
    s.addText(String(i + 1), { x: 0.6, y, w: 0.44, h: 0.44, align: "center", valign: "middle", fontFace: BODY_FONT, fontSize: 13, bold: true, color: WHITE, isTextBox: true, margin: 0 });
    s.addText(t, { x: 1.25, y: y - 0.05, w: 11.4, h: 0.6, valign: "middle", fontFace: BODY_FONT, fontSize: 13.5, color: PRIMARY, isTextBox: true, margin: 0 });
    y += 0.78;
  });

  s.addShape(pres.ShapeType.roundRect, { x: 0.6, y: 5.75, w: 12.1, h: 0.75, rectRadius: 0.08, fill: { color: CARD_BG }, line: { type: "none" } });
  s.addText("รันจริงบน docker-compose stack (Airflow 2.10.3 + Postgres 15) ในโปรเจกต์นี้ — ไม่ใช่ผลจำลอง", {
    x: 0.85, y: 5.75, w: 11.6, h: 0.75, valign: "middle", fontFace: BODY_FONT, fontSize: 13, bold: true, color: PRIMARY, isTextBox: true, margin: 0,
  });
}

/* ============================= 13. TASK 4 - BENCHMARK RESULTS ============================= */
{
  const s = pres.addSlide({ masterName: "LIGHT" });
  addKicker(s, "Task 4 — ผลการทดลองจริง");
  addTitle(s, "ผลลัพธ์ Benchmark: Worker Slot Occupancy");

  const headerOpts = { fill: { color: PRIMARY }, color: WHITE, bold: true, fontFace: BODY_FONT, fontSize: 12, align: "center", valign: "middle" };
  const cellOpts = { fontFace: BODY_FONT, fontSize: 12, color: PRIMARY, valign: "middle", align: "center" };
  const rows = [
    [
      { text: "Sensor Mode", options: headerOpts },
      { text: "Task State ระหว่างรอ", options: headerOpts },
      { text: "Avg CPU\nScheduler", options: headerOpts },
      { text: "Avg CPU\nTriggerer", options: headerOpts },
      { text: "Worker Slot", options: headerOpts },
    ],
    [
      { text: "poke", options: { ...cellOpts, fill: { color: CARD_BG }, bold: true } },
      { text: "running", options: { ...cellOpts, fill: { color: CARD_BG } } },
      { text: "10.71%", options: { ...cellOpts, fill: { color: CARD_BG } } },
      { text: "1.71%", options: { ...cellOpts, fill: { color: CARD_BG } } },
      { text: "ครอบครองตลอด", options: { ...cellOpts, fill: { color: CARD_BG }, color: ALERT, bold: true } },
    ],
    [
      { text: "reschedule", options: { ...cellOpts, fill: { color: WHITE }, bold: true } },
      { text: "up_for_reschedule", options: { ...cellOpts, fill: { color: WHITE } } },
      { text: "21.19%", options: { ...cellOpts, fill: { color: WHITE } } },
      { text: "2.02%", options: { ...cellOpts, fill: { color: WHITE } } },
      { text: "คืนบางส่วน", options: { ...cellOpts, fill: { color: WHITE }, bold: true } },
    ],
    [
      { text: "deferrable", options: { ...cellOpts, fill: { color: SECONDARY }, bold: true } },
      { text: "deferred", options: { ...cellOpts, fill: { color: SECONDARY } } },
      { text: "13.87%", options: { ...cellOpts, fill: { color: SECONDARY } } },
      { text: "5.35%", options: { ...cellOpts, fill: { color: SECONDARY } } },
      { text: "คืนทั้งหมด", options: { ...cellOpts, fill: { color: SECONDARY }, bold: true } },
    ],
  ];
  s.addTable(rows, { x: 0.6, y: 1.75, w: 12.1, h: 2.2, colW: [2.4, 3.1, 2.2, 2.2, 2.2], border: { type: "solid", color: "FFFFFF", pt: 2 }, autoPage: false });

  s.addText("ข้อสรุปสำคัญ: task_states_seen ตรงตามการออกแบบทุกกรณี — เป็นตัวชี้วัดที่แม่นยำกว่า CPU% ที่ขนาดการทดสอบเล็ก เพราะ CPU% ที่ scheduler ถูกครอบงำโดย housekeeping ของ Airflow เอง ไม่ใช่ sensor loop", {
    x: 0.6, y: 4.25, w: 12.1, h: 0.8, fontFace: BODY_FONT, fontSize: 12.5, color: MUTED, isTextBox: true, margin: 0,
  });

  s.addShape(pres.ShapeType.roundRect, { x: 0.6, y: 5.2, w: 12.1, h: 1.3, rectRadius: 0.08, fill: { color: "1A1F3D" }, line: { type: "none" } });
  s.addText("ที่ Scale ใหญ่ (หลายสิบ/หลายร้อย DAG run รอพร้อมกัน): poke ต้องใช้ 1 worker slot ต่อการรอ 1 ครั้งเสมอ, reschedule ต้อง requeue ผ่าน scheduler ทุกรอบ poke_interval, ส่วน deferrable ใช้เพียงหน่วยความจำเล็กน้อยใน Triggerer เท่านั้น", {
    x: 0.9, y: 5.4, w: 11.5, h: 0.95, valign: "middle", fontFace: BODY_FONT, fontSize: 12.5, color: WHITE, isTextBox: true, margin: 0,
  });
}

/* ============================= 14. TASK 4 - SCALABILITY ============================= */
{
  const s = pres.addSlide({ masterName: "LIGHT" });
  addKicker(s, "Task 4 — Scalability Proposal");
  addTitle(s, "ข้อเสนอสถาปัตยกรรมสำหรับ 10,000 Transactions/วินาที");

  const headerOpts = { fill: { color: PRIMARY }, color: WHITE, bold: true, fontFace: BODY_FONT, fontSize: 11.5, valign: "middle" };
  const cellOpts = { fontFace: BODY_FONT, fontSize: 11, color: PRIMARY, valign: "middle" };
  const rows = [
    [{ text: "Layer", options: headerOpts }, { text: "ปัจจุบัน (Assignment)", options: headerOpts }, { text: "ที่ 10,000 TPS", options: headerOpts }],
    [{ text: "Ingestion Transport", options: { ...cellOpts, fill: CARD_BG, bold: true } }, { text: "File landing + FileSensor", options: { ...cellOpts, fill: CARD_BG } }, { text: "Apache Kafka (partition by store_id)", options: { ...cellOpts, fill: CARD_BG, bold: true, color: ALERT } }],
    [{ text: "Processing", options: { ...cellOpts, fill: WHITE, bold: true } }, { text: "Airflow batch DAG ทุก 2 นาที", options: { ...cellOpts, fill: WHITE } }, { text: "Flink / Kafka Streams (continuous)", options: { ...cellOpts, fill: WHITE, bold: true, color: ALERT } }],
    [{ text: "Idempotency", options: { ...cellOpts, fill: CARD_BG, bold: true } }, { text: "ON CONFLICT DO UPDATE (Postgres)", options: { ...cellOpts, fill: CARD_BG } }, { text: "Kafka exactly-once + upsert key", options: { ...cellOpts, fill: CARD_BG } }],
    [{ text: "Analytics Store", options: { ...cellOpts, fill: WHITE, bold: true } }, { text: "PostgreSQL (row-store)", options: { ...cellOpts, fill: WHITE } }, { text: "ClickHouse / Druid / BigQuery (columnar)", options: { ...cellOpts, fill: WHITE, bold: true, color: ALERT } }],
    [{ text: "Anomaly Detection", options: { ...cellOpts, fill: CARD_BG, bold: true } }, { text: "Python task ต่อ DAG run", options: { ...cellOpts, fill: CARD_BG } }, { text: "Streaming CEP (rolling z-score)", options: { ...cellOpts, fill: CARD_BG } }],
    [{ text: "Alerting", options: { ...cellOpts, fill: WHITE, bold: true } }, { text: "Airflow task → Webhook", options: { ...cellOpts, fill: WHITE } }, { text: "Dedicated consumer บน anomaly topic", options: { ...cellOpts, fill: WHITE } }],
  ];
  s.addTable(rows, { x: 0.6, y: 1.8, w: 12.1, h: 4.5, colW: [2.6, 4.5, 5.0], border: { type: "solid", color: "FFFFFF", pt: 2 }, autoPageLineWeight: 0.5 });

  addFooterNote(s, "เหตุผล: หน่วยงานเดิมคือ \"1 DAG run ต่อ 1 ไฟล์\" ที่ 10,000 TPS หน่วยงานต้องเปลี่ยนเป็น \"stream processing ต่อเนื่อง\" — เป็นการเปลี่ยนเชิงคุณภาพ ไม่ใช่แค่ scale infra เดิมให้ใหญ่ขึ้น");
}

/* ============================= 15. SUMMARY ============================= */
{
  const s = pres.addSlide({ masterName: "LIGHT" });
  addKicker(s, "Summary");
  addTitle(s, "สรุปผลลัพธ์เทียบกับเกณฑ์การประเมิน");

  const rows = [
    ["System Resilience & Data Quality", "30%", "Idempotency ยืนยันด้วยการทดสอบจริง (58→58) · Anomaly ถูก flag ไม่ถูกทิ้ง"],
    ["Advanced Airflow Architecture", "25%", "Deferrable Operator + TaskFlow API + XCom ยืนยัน state จริงตรงตามออกแบบ"],
    ["Architectural Report & Trade-offs", "25%", "Benchmark ตัวเลขจริง + ข้อเสนอ Scalability สำหรับ 10,000 TPS"],
    ["Dashboard & Public Deployment", "20%", "Live บน Streamlit Cloud ผ่าน HTTPS จริง · Neon PostgreSQL สาธารณะ"],
  ];
  let y = 1.9;
  rows.forEach(([head, pct, note], i) => {
    s.addShape(pres.ShapeType.roundRect, { x: 0.6, y, w: 12.1, h: 1.1, rectRadius: 0.08, fill: { color: CARD_BG }, line: { type: "none" } });
    s.addShape(pres.ShapeType.roundRect, { x: 0.6, y, w: 1.55, h: 1.1, rectRadius: 0.08, fill: { color: PRIMARY }, line: { type: "none" } });
    s.addText(pct, { x: 0.6, y, w: 1.55, h: 1.1, align: "center", valign: "middle", fontFace: TITLE_FONT, fontSize: 22, bold: true, color: WHITE, isTextBox: true, margin: 0 });
    s.addText(head, { x: 2.35, y: y + 0.1, w: 9.9, h: 0.45, fontFace: BODY_FONT, fontSize: 14.5, bold: true, color: PRIMARY, isTextBox: true, margin: 0 });
    s.addText(note, { x: 2.35, y: y + 0.55, w: 9.9, h: 0.5, fontFace: BODY_FONT, fontSize: 11.5, color: MUTED, isTextBox: true, margin: 0 });
    y += 1.28;
  });
}

/* ============================= 16. THANK YOU ============================= */
{
  const s = pres.addSlide({ masterName: "DARK" });
  s.addShape(pres.ShapeType.ellipse, { x: -1.6, y: -1.8, w: 5.2, h: 5.2, fill: { color: "26307A" }, line: { type: "none" } });
  s.addShape(pres.ShapeType.ellipse, { x: 10.8, y: 4.8, w: 4.2, h: 4.2, fill: { color: "26307A" }, line: { type: "none" } });

  s.addText("ขอบคุณครับ", { x: 0.9, y: 2.7, w: 11.5, h: 1.1, fontFace: TITLE_FONT, fontSize: 44, bold: true, color: WHITE, isTextBox: true, margin: 0 });
  s.addText("Q & A", { x: 0.9, y: 3.65, w: 11.5, h: 0.6, fontFace: BODY_FONT, fontSize: 18, color: SECONDARY, charSpacing: 4, isTextBox: true, margin: 0 });

  s.addText([
    { text: "นายกันต์กวี รามศรี", options: { fontSize: 14, bold: true, color: WHITE, breakLine: true } },
    { text: "รหัสนักศึกษา 6900102365", options: { fontSize: 12, color: SECONDARY } },
  ], { x: 0.9, y: 6.4, w: 6, h: 0.7, fontFace: BODY_FONT, isTextBox: true, margin: 0 });
}

pres.writeFile({ fileName: "/Users/balast/dev/DataEng/pos-anomaly-pipeline/slides/pos_pipeline_presentation.pptx" }).then(() => {
  console.log("Deck written.");
});
