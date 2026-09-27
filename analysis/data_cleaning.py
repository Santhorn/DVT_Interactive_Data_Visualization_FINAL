import pandas as pd
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
RAW = BASE / "data" / "raw" / "_2568.csv"
OUT = BASE / "data" / "cleaned" / "_2568_cleaned.csv"

df = pd.read_csv(RAW, low_memory=False)

# 1) ลบคอลัมน์ที่ว่างทั้งคอลัมน์
empty_columns = [c for c in df.columns if df[c].isna().all()]
df = df.drop(columns=empty_columns)

# 2) เติมค่าว่างของข้อมูลเชิงหมวดหมู่ด้วย "ไม่ระบุ"
text_columns = df.select_dtypes(include=["object"]).columns
for col in text_columns:
    df[col] = df[col].replace("-", "ไม่ระบุ")
    df[col] = df[col].fillna("ไม่ระบุ")

# 3) เติม Age ที่หายด้วยค่ามัธยฐานของ Age
if df["Age"].isna().any():
    median_age = df["Age"].median()
    df["Age"] = df["Age"].fillna(median_age)

# 4) แปลงวันที่ให้อยู่ในรูปแบบ YYYY-MM-DD
df["Dead Date"] = pd.to_datetime(df["Dead Date"], errors="coerce").dt.strftime("%Y-%m-%d")

# 5) ไม่เติมพิกัด Acc La / Acclong เพราะการเดาพิกัดอาจทำให้ตำแหน่งเกิดเหตุผิด
df.to_csv(OUT, index=False, encoding="utf-8-sig")

print("สร้างไฟล์:", OUT)
print("ขนาดข้อมูล:", df.shape)
print("คอลัมน์ที่ถูกลบ:", empty_columns)
print("ค่าว่างทั้งหมดหลังทำความสะอาด:", int(df.isna().sum().sum()))
