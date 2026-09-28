# Interactive Data Visualization Project — 2568

## 1. โครงสร้างโครงการ

```text
DVT_Interactive_Data_Visualization_FINAL/
├── data/
│   ├── raw/
│   │   └── _2568.csv
│   └── cleaned/
│       └── _2568_cleaned.csv
├── analysis/
│   ├── data_cleaning.py
│   ├── data_quality_summary.csv
│   ├── monthly_counts.csv
│   ├── weekday_counts.csv
│   ├── sex_counts.csv
│   ├── vehicle_counts.csv
│   ├── province_counts.csv
│   ├── cause_counts.csv
│   └── age_summary.csv
├── web/
│   ├── d3/
│   │   ├── index.html
│   │   ├── style.css
│   │   └── script.js
│   └── chartjs/
│       ├── index.html
│       ├── style.css
│       └── script.js
├── docs/
│   ├── Process_Report.pdf
│   ├── Contribution_Log.md
│   └── Meeting_Log.md
└── README.md
```

## 2. ชุดข้อมูล

- ข้อมูลดิบ: `data/raw/_2568.csv`
- ข้อมูลที่ทำความสะอาดแล้ว: `data/cleaned/_2568_cleaned.csv`
- จำนวนข้อมูล: 16,078 แถว
- ข้อมูลดิบมี 21 คอลัมน์
- ข้อมูล cleaned มี 16 คอลัมน์
- ข้อมูลเป็นสถิติผู้เสียชีวิตจากเหตุที่เกี่ยวข้องกับยานพาหนะ ปี พ.ศ. 2568 ตามไฟล์ที่กลุ่มได้รับ

> หมายเหตุ: ต้องเติมชื่อแหล่งข้อมูล/URL ต้นทางจริงของชุดข้อมูลในรายงานก่อนส่ง หากอาจารย์กำหนดให้ระบุ URL ของแหล่งข้อมูล

## 3. การทำความสะอาดข้อมูล

สคริปต์ `analysis/data_cleaning.py` ทำขั้นตอนหลักดังนี้
1. อ่าน `_2568.csv`
2. ลบคอลัมน์ที่ว่างทั้งคอลัมน์
3. แทนค่าว่างของข้อมูลเชิงหมวดหมู่ด้วย `ไม่ระบุ`
4. แทน `-` ในข้อมูลหมวดหมู่ด้วย `ไม่ระบุ`
5. เติม Age ที่หายด้วยค่ามัธยฐาน 45 ปี
6. แปลง Dead Date เป็นรูปแบบ YYYY-MM-DD
7. ไม่เติมค่าพิกัด Acc La / Acclong เพราะไม่ควรเดาตำแหน่งทางภูมิศาสตร์

## 4. Dashboard

ทั้งสองเวอร์ชันใช้ข้อมูล cleaned ชุดเดียวกัน และมีกราฟอย่างน้อย 4 รูปแบบ:
- Line Chart — แนวโน้มจำนวนผู้เสียชีวิตรายเดือน
- Donut Chart — สัดส่วนตามเพศ
- Bar Chart — จำนวนตามประเภทยานพาหนะ
- Horizontal Bar Chart — 10 จังหวัดที่มีจำนวนสูงสุด
- Bar Chart เพิ่มเติม — จำนวนตามวันในสัปดาห์

Interactivity:
- Filter เดือน / เพศ / จังหวัด / ยานพาหนะ
- Tooltip
- ปุ่มรีเซ็ตตัวกรอง
- Responsive layout

## 5. วิธีเปิดเว็บ

แนะนำใช้ VS Code + Live Server หรือ GitHub Pages

D3:
`web/d3/index.html`

Chart.js:
`web/chartjs/index.html`

ไม่ควรเปิดด้วย `file:///` หาก browser ปฏิเสธการโหลด CSV

## 6. Framework ตัวที่สอง

เลือก **Chart.js** เพราะสามารถสร้างกราฟมาตรฐานได้รวดเร็ว มีระบบ tooltip/legend/scale ในตัว และเหมาะกับ dashboard ที่ต้องการโค้ดกระชับ ขณะที่ D3.js ให้การควบคุม DOM และการออกแบบ visualization ในระดับละเอียดมากกว่า

## 7. ก่อนส่ง

- ใส่ชื่อสมาชิกจริงใน `docs/Contribution_Log.md`
- ใส่ข้อมูลการประชุมจริงใน `docs/Meeting_Log.md`
- ใส่แหล่งข้อมูลและ license จริง
- Push ทุกไฟล์ขึ้น GitHub
- ตั้ง Repository เป็น Public
- เปิด GitHub Pages ให้กับทั้ง D3 และ Chart.js
- นำ URL จริงไปใส่ในรายงาน/README


## สมาชิกกลุ่ม

| ลำดับ | ชื่อ-นามสกุล | รหัสนักศึกษา | บทบาท |
|---|---|---|---|
| 1 | นายสันต์ธร ตาป้อม | 68541207091-2 | สมาชิกกลุ่ม |
| 2 | นายดนุวัศ เกษรกอบแก้ว | 68541207056-5 | สมาชิกกลุ่ม |

> หมายเหตุ: บทบาทย่อยของแต่ละคนสามารถแก้ไขให้ตรงกับการทำงานจริงก่อนส่ง
>
> AI ที่ใช้ช่วยในการทำงาน 
chat gpt : https://chatgpt.com/share/6aba6f5c-fce0-83ec-a13b-a7bacfa0c087
gemmi : https://share.gemini.google/yrjLt6uvyUbO
