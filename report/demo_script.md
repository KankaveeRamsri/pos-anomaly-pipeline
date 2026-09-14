# สคริปต์อัดคลิป Demo — Task 1-4

แผน: อัด **2 คลิปแยกกัน**
- **คลิป 1** = พูดตามสไลด์ทั้งหมด (เปิด PowerPoint → Presenter View → อ่านตาม Speaker Notes ที่มีอยู่แล้วในทุกหน้า) ไม่ต้องมีสคริปต์เพิ่มในไฟล์นี้
- **คลิป 2** = โชว์ demo จริงอย่างเดียว (ไม่ต้องพูดอธิบายเนื้อหาซ้ำ พูดสั้นๆแค่ชี้ว่ากำลังทำอะไร) ← ไฟล์นี้เป็น checklist สำหรับคลิปนี้

ทำเสร็จทั้ง 2 คลิปแล้วส่งไฟล์มาให้ต่อรวมเป็นคลิปเดียวได้

---

## เตรียมตัวก่อนอัดคลิป 2 (ทำครั้งเดียว ก่อนกด Record)

เปิดไว้ล่วงหน้า:
- [ ] Terminal
- [ ] Browser tab 1: Airflow UI → http://localhost:8080 (login admin/admin)
- [ ] Browser tab 2: Dashboard จริง → https://pos-anomaly-pipeline-duga3in95l2i7apb78xzee.streamlit.app/

**สำคัญ:** ทุกคำสั่ง terminal ในไฟล์นี้ ให้เริ่มจาก path นี้เสมอ — ถ้าเปิด terminal ใหม่ ให้รันบรรทัดนี้ก่อนอันดับแรกทุกครั้ง:
```bash
cd /Users/balast/dev/DataEng/pos-anomaly-pipeline
```

เช็คว่า container พร้อม:
```bash
docker-compose ps
```
ต้องเห็น 5 container status `Up` (ถ้าไม่ขึ้น ให้รัน `docker-compose up -d` รอ ~1 นาที)

ล้างข้อมูลเก่าให้ landing/processed ว่างสนิท และฐานข้อมูล local ว่าง (จะได้ demo ตั้งแต่ 0):
```bash
docker-compose exec -T postgres-data psql -U pos_user -d pos_data -c "TRUNCATE pos_transactions, pos_anomalies;"
rm -f data/landing/*.jsonl data/processed/*.jsonl
docker-compose exec -T airflow-webserver airflow dags unpause pos_ingestion_pipeline
```
> หมายเหตุ: Dashboard สาธารณะบน Neon เป็นฐานข้อมูลคนละตัว ไม่ถูกล้าง ใช้โชว์ Task 3 ได้เลยโดยไม่ต้องทำอะไรเพิ่ม

---

## ขั้นตอนอัดคลิป 2 (ทำตามลำดับนี้เป๊ะๆ — แต่ละขั้นรอให้เสร็จก่อนไปขั้นต่อไป)

### ขั้น 1 — โชว์ Deferrable Operator (จุดสำคัญสุดของ Task 2)

**เช็คก่อนว่า landing ว่างจริง:**
```bash
ls data/landing
```
ต้องไม่มีไฟล์ (ถ้ามีให้ลบตามคำสั่งด้านบนอีกที)

ไปที่ Airflow UI → คลิก `pos_ingestion_pipeline` → กด **Trigger DAG** (▶ มุมขวาบน)

รอ ~5 วินาที → คลิกเข้า task **`wait_for_new_file`** ในหน้า Grid → ดูช่อง State

**พูด:** "ตรงนี้จะเห็น state เป็น `deferred` เพราะยังไม่มีไฟล์เข้ามา ตัวระบบไม่ได้ยึดพื้นที่ประมวลผลไว้เฉยๆ ระหว่างรอครับ"

> เพราะ landing ว่าง จะไม่มีไฟล์ให้เจอ สถานะนี้จะ**ค้างอยู่แบบนี้ได้นาน** (ไม่หายไปเร็วๆ) มีเวลาถ่ายชัดๆ ไม่ต้องรีบ

---

### ขั้น 2 — ปล่อยให้ไฟล์แรกเข้ามา (ปลด deferred)

เปิด terminal อีกแท็บ (หรือสลับไป) รันคำสั่งนี้ — สร้างไฟล์ตัวอย่าง **1 ไฟล์ทันที**:
```bash
cd /Users/balast/dev/DataEng/pos-anomaly-pipeline/scripts
python3 workload_generator.py --once --landing-dir ../data/landing
```

**พูด:** "พอผมป้อนไฟล์เข้าไป ระบบจะตรวจพบและทำงานต่อทันที"

กลับไป Airflow UI รอ ~10-20 วินาที → รีเฟรชหน้า Grid → task `wait_for_new_file` จะเปลี่ยนเป็นสีเขียว (success) แล้ว task ต่อๆไปจะรันจนครบทุกกล่องเป็นสีเขียว

คลิกเข้า task **`check_and_alert`** → ดู Logs สั้นๆ
**พูด:** "นี่คือ log การแจ้งเตือน ตอนนี้เป็น dry-run เพราะยังไม่ผูก token จริง"

---

### ขั้น 3 — โชว์ Flash Sale (Task 1)

กลับไป terminal (folder `scripts`) รันคำสั่งนี้ **แล้วรอจนมันรันจบเอง** (ประมาณ 60 วินาที ห้ามกด Ctrl+C ก่อน):
```bash
python3 workload_generator.py --landing-dir ../data/landing --duration 60 \
  --base-rate 2 --flash-sale-at 15 --flash-sale-duration 15 --flash-sale-multiplier 10 \
  --late-arrival-rate 0.06 --duplicate-rate 0.04 --negative-amount-rate 0.04
```

**พูด (ตอนเห็นบรรทัด `FLASH SALE` ที่ t=15s):** "ตรงนี้คือช่วง Flash Sale อัตราพุ่งจาก 2 เป็น 20 ต่อวินาที คือ 10 เท่าตามที่ออกแบบไว้"

**รอจนบรรทัดสุดท้ายโชว์ `[workload_generator] done.` แล้วค่อยไปขั้นต่อไป — ห้ามข้ามขั้นนี้ตอนยังรันอยู่**

---

### ขั้น 4 — ปล่อยให้ Airflow กินไฟล์ที่เหลือให้หมด

ไปที่ Airflow UI → กด **Trigger DAG** อีกครั้ง (จะกินไฟล์ทั้งหมดที่ script ขั้น 3 สร้างไว้ในทีเดียว)

รอจนรันจบ (ทุกกล่องเขียว) แล้วเช็คว่า landing ว่างแล้วจริง:
```bash
cd /Users/balast/dev/DataEng/pos-anomaly-pipeline
ls data/landing
```
ต้อง**ไม่มีไฟล์เหลือ** (ถ้ายังมี ให้กด Trigger ซ้ำจนกว่าจะว่าง)

---

### ขั้น 5 — พิสูจน์ Idempotency (จุดสำคัญสุดอันดับ 2)

เช็คตัวเลขตั้งต้น:
```bash
docker-compose exec -T postgres-data psql -U pos_user -d pos_data -c "SELECT count(*) FROM pos_transactions;"
```
**พูด:** "ตอนนี้มีข้อมูล X แถวในฐานข้อมูล" (อ่านเลขที่เห็นจริง)

เอาไฟล์ที่ประมวลผลไปแล้วทั้งหมด **กลับมาวางที่ landing ใหม่** (จำลองว่า "ป้อนไฟล์เดิมซ้ำ"):
```bash
cp -p data/processed/*.jsonl data/landing/
```

ไปที่ Airflow UI → กด **Trigger DAG** อีกครั้ง → รอจนรันจบ (เขียวทุกกล่อง)

กลับ terminal เช็คตัวเลขอีกครั้ง:
```bash
docker-compose exec -T postgres-data psql -U pos_user -d pos_data -c "SELECT count(*) FROM pos_transactions;"
```
**พูด:** "เห็นไหมครับ ตัวเลขยังเป็น X เท่าเดิม ทั้งที่ผมป้อนไฟล์ชุดเดียวกันเข้าไปซ้ำ — นี่คือ Idempotency ตัวจริงครับ"

> ⚠️ ถ้าตัวเลขเปลี่ยนตรงนี้ แปลว่ามีไฟล์ใหม่หลุดเข้ามาปนระหว่างขั้นตอน (เช่น generator ยังรันไม่จบ หรือ landing ไม่ได้ว่างจริงก่อนขั้น 5) — กลับไปเช็คขั้น 4 อีกที

---

### ขั้น 6 — โชว์ Dashboard (Task 3)

สลับไป Browser tab 2 (public dashboard URL) — **ชี้ที่ address bar ให้เห็น `https://...streamlit.app` ชัดๆ**

**พูด:** "นี่คือ dashboard ที่ deploy ขึ้นสู่สาธารณะแล้วครับ ไม่ใช่ localhost"

- ชี้ตัวเลข KPI ด้านบน
- เลื่อนดูกราฟ — ถ้ามี flash sale spike ให้ชี้ตรงนั้น พร้อมจุด X สีแดง (anomaly)
- เลื่อนลงชี้ตาราง แถวพื้นหลังสีแดง = รายการผิดปกติ
- ลองขยับ slider "Moving average window" ให้เห็นกราฟขยับสดๆ

---

### ขั้น 7 — โชว์ผล Benchmark (Task 4)

กลับ terminal:
```bash
cat report/benchmark_results.csv
```
**พูด:** "นี่คือตัวเลขที่วัดได้จริงจากการทดสอบ 3 วิธีการรอไฟล์ ตรงตามที่อธิบายไว้ในสไลด์"

(ถ้าอยากโชว์เพิ่ม เปิดไฟล์ `report/architecture_report.md` เลื่อนให้ดูตารางเปรียบเทียบ 10,000 TPS สั้นๆ)

---

## Checklist ก่อนอัปโหลด
- [ ] เห็น state `deferred` ชัดเจนในขั้น 1
- [ ] เห็นเลขก่อน/หลังในขั้น 5 **เท่ากันเป๊ะ**
- [ ] เห็น URL dashboard เป็น public https ไม่ใช่ localhost
- [ ] เสียงชัด ไม่มีเสียงรบกวน

## เวลาโดยประมาณคลิป 2
| ขั้น | เวลา |
|---|---|
| ขั้น 1-2 (Deferrable) | 1.5 นาที |
| ขั้น 3-4 (Flash Sale) | 2 นาที |
| ขั้น 5 (Idempotency) | 1.5 นาที |
| ขั้น 6 (Dashboard) | 1.5 นาที |
| ขั้น 7 (Benchmark) | 1 นาที |
| **รวม** | **~7-8 นาที** |
