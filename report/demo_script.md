# สคริปต์อัดคลิป Demo — Task 1-4

เป้าหมาย: วิดีโอ ~12-15 นาที ครอบคลุม Task 1-4 ตามที่โจทย์ระบุ ("ส่ง Link video presentation เฉพาะ Task 1-4")
เปิดไฟล์นี้ไว้บนจอที่สอง (หรือ print) ระหว่างอัด — เป็น checklist ทีละขั้น ไม่ต้องท่องจำ

---

## เตรียมตัวก่อนกดอัด (5-10 นาทีก่อนหน้า)

### 1. เตรียมหน้าจอ/แท็บให้พร้อม
เปิดไว้ล่วงหน้า สลับไปมาได้ทันทีตอนอัด:
- [ ] Terminal (อยู่ที่ `/Users/balast/dev/DataEng/pos-anomaly-pipeline`)
- [ ] Browser tab 1: Airflow UI → http://localhost:8080 (login admin/admin ไว้ล่วงหน้า)
- [ ] Browser tab 2: Dashboard จริง → https://pos-anomaly-pipeline-duga3in95l2i7apb78xzee.streamlit.app/
- [ ] สไลด์ `pos_pipeline_presentation.pptx` เปิดโหมด Presenter/Slideshow
- [ ] โปรแกรมอัดหน้าจอ (QuickTime: File → New Screen Recording) พร้อมไมค์

### 2. เช็คว่าระบบพร้อมรัน
```bash
cd /Users/balast/dev/DataEng/pos-anomaly-pipeline
docker-compose ps
```
ต้องเห็นทั้ง 5 container status `Up` (ถ้าเผลอปิดเครื่องไปแล้ว ให้รัน `docker-compose up -d` แล้วรอ ~1 นาที)

### 3. (แนะนำ) รีเซ็ตข้อมูล local ให้ว่าง เพื่อให้ตอนอัดเห็นข้อมูล "เกิดขึ้นสด ๆ" ต่อหน้ากล้อง
```bash
docker-compose exec -T postgres-data psql -U pos_user -d pos_data -c "TRUNCATE pos_transactions, pos_anomalies;"
rm -f data/landing/*.jsonl data/processed/*.jsonl 2>/dev/null
```
> หมายเหตุ: dashboard สาธารณะบน Neon จะยังมีข้อมูล 542 แถวเดิมอยู่ (คนละฐานข้อมูลกับ local) — ใช้ตอนโชว์ Task 3/4 ได้เลยไม่ต้องรีเซ็ต

### 4. Unpause DAG (เผื่อ pause ค้างจากรอบทดสอบก่อนหน้า)
```bash
docker-compose exec -T airflow-webserver airflow dags unpause pos_ingestion_pipeline
```

---

## บทพูด + ขั้นตอนการอัด

### 🎬 ส่วนที่ 1 — เปิดคลิป (30 วินาที)
**พูด:** แนะนำตัว — "สวัสดีครับ ผมนายกันต์กวี รามศรี รหัสนักศึกษา 6900102365 นำเสนองาน Real-Time Data Pipeline Architecture & Anomaly Detection System for Enterprise POS ครับ"

**แสดง:** สไลด์หน้า 1 (Title)

---

### 🎬 ส่วนที่ 2 — Agenda + Architecture (1 นาที)
**พูด:** อธิบายสั้น ๆ ว่าจะพูด 4 Task อะไรบ้าง แล้วโชว์ภาพรวมสถาปัตยกรรม

**แสดง:** สไลด์หน้า 2 (Agenda) → หน้า 3 (Architecture diagram)
พูดไล่ตาม diagram: "ข้อมูลเริ่มจาก Workload Generator → ตกไฟล์ที่ Landing Directory → Airflow DAG ดึงเข้า Postgres → ต่อกับ Dashboard และมี Alert แยกออกไปเมื่อเจอ anomaly"

---

### 🎬 ส่วนที่ 3 — Task 1: Workload Generator (2 นาที)
**แสดง:** สไลด์หน้า 4-5 (พูดสั้น ๆ ว่ามี 4 edge case อะไรบ้าง)

**สลับไป Terminal — รันจริงให้ดู:**
```bash
cd /Users/balast/dev/DataEng/pos-anomaly-pipeline/scripts
python3 workload_generator.py --landing-dir ../data/landing --duration 60 \
  --base-rate 2 --flash-sale-at 15 --flash-sale-duration 15 --flash-sale-multiplier 10 \
  --late-arrival-rate 0.06 --duplicate-rate 0.04 --negative-amount-rate 0.04
```
**พูดระหว่างรอ (script รันประมาณ 60 วินาที):**
- ชี้ที่ log บรรทัด `FLASH SALE` ตอน t=15s: "ตรงนี้คือ flash sale จำลอง อัตราพุ่งจาก 2 เป็น 20 ต่อวินาที คือ 10 เท่าตามโจทย์"
- ชี้ `anomalies_injected` ที่เพิ่มขึ้นเรื่อย ๆ: "นี่คือ anomaly ที่ inject เข้าไปโดยตั้งใจ — duplicate, negative amount, late arrival"

**เปิดไฟล์ตัวอย่างให้ดู (รอ script รันเสร็จ หรือเปิด terminal อีกแท็บ):**
```bash
cat ../data/landing/*.jsonl | head -3
```
ชี้ให้เห็นโครงสร้าง JSON หนึ่งบรรทัด = หนึ่ง transaction

---

### 🎬 ส่วนที่ 4 — Task 2: Airflow Ingestion Pipeline (4-5 นาที — ส่วนสำคัญที่สุด)
**แสดง:** สไลด์หน้า 6 (overview 4 feature) พูดไล่สั้น ๆ

**สลับไป Airflow UI (http://localhost:8080):**

1. คลิกเข้า DAG `pos_ingestion_pipeline` → แท็บ **Graph** ชี้ให้เห็น task ทั้งหมด: `wait_for_new_file → list_landing_files → extract_and_validate → load_to_postgres → [archive_files, check_and_alert]`
   **พูด:** "นี่คือ TaskFlow API ที่ใช้ @dag/@task decorator ทั้งหมด"

2. Trigger DAG ด้วยตัวเอง (ปุ่ม ▶ มุมขวาบน → Trigger DAG)

3. **จุดไฮไลต์ (สำคัญ — ตรงกับสไลด์หน้า 7):** รีเฟรชหน้า Grid เร็ว ๆ แล้วคลิกที่ task `wait_for_new_file` ให้เห็น state เป็น **`deferred`** (สีพิเศษต่างจาก running)
   **พูด:** "ตรงนี้คือหัวใจของ Task 2 — Deferrable Operator ครับ สังเกตว่า state คือ `deferred` ไม่ใช่ `running` แปลว่า worker slot ถูกคืนกลับไปแล้ว ตัว Triggerer process จะจัดการรอไฟล์แทน ต่างจาก FileSensor แบบเดิมที่ mode='poke' จะครอบครอง slot ตลอดเวลาที่รอ"

4. รอ DAG รันจนจบ (สัก 1-2 นาที ถ้ามีไฟล์จาก Task 1 รออยู่แล้วจะเร็ว) → ชี้ทุก task เป็นสีเขียว (success)

5. **Proof ของ Idempotency (ตรงกับสไลด์หน้า 8) — สลับกลับ Terminal:**
   ```bash
   docker-compose exec -T postgres-data psql -U pos_user -d pos_data -c "SELECT count(*) FROM pos_transactions;"
   ```
   จดตัวเลขไว้ (สมมติ X) แล้ว **trigger DAG ซ้ำอีกรอบ** (โดยไม่มีไฟล์ใหม่ หรือ copy ไฟล์เดิมกลับเข้า landing):
   ```bash
   cp -p data/processed/*.jsonl data/landing/
   ```
   กลับไป Airflow UI → Trigger DAG อีกครั้ง → รอจบ → กลับ Terminal รันคำสั่งนับแถวซ้ำ
   **พูด:** "เห็นไหมครับ ตัวเลขยังเท่าเดิมคือ X แถว ทั้งที่ผมป้อนไฟล์เดิมเข้าไปซ้ำ — นี่คือผลจาก `ON CONFLICT (transaction_id) DO UPDATE` ที่ทำให้ rerun กี่ครั้งข้อมูลก็ไม่ซ้ำซ้อน"

6. **Alerting (สไลด์หน้า 9):** คลิกเข้า task `check_and_alert` → ดู Logs
   **พูด:** "ตรงนี้คือ log การแจ้งเตือน ตอนนี้รันแบบ dry-run เพราะยังไม่ได้ใส่ Telegram token จริง แต่ logic การตรวจจับและส่งข้อความพร้อมใช้งานครบแล้ว"

---

### 🎬 ส่วนที่ 5 — Task 3: Live Dashboard (2 นาที)
**แสดง:** สไลด์หน้า 10-11 พูดสั้น ๆ ถึง feature (Moving Average, Anomaly Highlight)

**สลับไป Browser tab 2 (public dashboard URL) — ชี้ที่ address bar ให้เห็น `https://...streamlit.app` ชัด ๆ:**
**พูด:** "นี่คือ dashboard ตัวจริงที่ deploy ผ่าน HTTPS domain สาธารณะแล้วครับ ไม่ใช่ localhost"

- ชี้ KPI แถวบน (Total revenue, Transactions, Anomalies)
- ชี้กราฟ Revenue over time — ถ้ามี flash sale spike ให้ชี้ตรงนั้นเลย พร้อมจุด X สีแดงคือ anomaly
- เลื่อนลงชี้ตาราง transaction ที่แถว anomaly กลายเป็นพื้นหลังสีแดง
- ลองขยับ slider "Moving average window" ให้เห็นกราฟเปลี่ยนสด ๆ

---

### 🎬 ส่วนที่ 6 — Task 4: Benchmark & Report (2-3 นาที)
**แสดง:** สไลด์หน้า 12 (methodology) → 13 (ผลลัพธ์จริง) → 14 (scalability proposal)

**พูดตอนหน้า 13:** "ตัวเลขในตารางนี้มาจากการรันจริงบนเครื่องผม ไม่ใช่ผลจำลอง — เห็นได้ว่า state ของ sensor ตรงตามที่ออกแบบไว้ทุกโหมด: poke ค้างที่ running ตลอด, reschedule สลับ, deferrable ไปที่ deferred"

**พูดตอนหน้า 14:** สรุปสั้น ๆ ว่าถ้าต้องขยายไป 10,000 TPS จะเปลี่ยน component ไหนบ้าง (Kafka, Flink, Columnar DB) — ไม่ต้องอ่านทุกแถว เลือกพูด 2-3 แถวที่สำคัญ เช่น Ingestion Transport กับ Analytics Store

---

### 🎬 ส่วนที่ 7 — ปิดคลิป (30-45 วินาที)
**แสดง:** สไลด์หน้า 15 (Summary เทียบ rubric) → หน้า 16 (Thank you)

**พูด:** สรุปภาพรวมสั้น ๆ ว่าระบบทำอะไรได้ครบตามโจทย์บ้าง แล้วขอบคุณ

---

## Checklist ก่อนอัปโหลด
- [ ] เสียงชัด ไม่มีเสียงรบกวน
- [ ] เห็น URL จริงของ Airflow (localhost:8080 โอเค เพราะรันบนเครื่อง) และ Dashboard (ต้องเป็น public URL ไม่ใช่ localhost)
- [ ] เห็น `deferred` state ของ sensor อย่างน้อย 1 ครั้งชัดเจน (จุดสำคัญสุดของ Task 2)
- [ ] เห็นตัวเลขก่อน/หลัง rerun DAG เท่ากัน (proof idempotency)
- [ ] พูดครบทั้ง 4 Task ตามลำดับ
- [ ] อัปโหลด YouTube (ตั้ง Unlisted) หรือ Google Drive (เปิดสิทธิ์ "Anyone with the link") แล้วเอา link ไปส่ง

## เวลารวมโดยประมาณ
| ส่วน | เวลา |
|---|---|
| เปิดคลิป + Agenda + Architecture | 1.5 นาที |
| Task 1 | 2 นาที |
| Task 2 | 4-5 นาที |
| Task 3 | 2 นาที |
| Task 4 | 2-3 นาที |
| ปิดคลิป | 0.5 นาที |
| **รวม** | **~12-15 นาที** |
