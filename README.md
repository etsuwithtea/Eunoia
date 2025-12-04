# Eunoia - Mental Health Assessment System

AI-powered mental health assessment tool ที่ใช้ BERT Transformer ในการวิเคราะห์ข้อความและประเมินภาวะสุขภาพจิต

---

## Features

- Mental Health Assessment - ประเมินสุขภาพจิตจากข้อความ
- AI-Powered Analysis - ใช้ BERT (bert-base-uncased) + Fine-tuning
- 5 Categories - วิเคราะห์ 5 หมวดหมู่: Anxiety, Depression, Mental Health, Suicide Watch, Wellbeing
- PDF and OCR Support - รองรับการอัปโหลด PDF และรูปภาพ
- Real-time Results - แสดงผลแบบ real-time พร้อม confidence scores
- GPU/CPU Auto-detection - รองรับทั้งเครื่องที่มี GPU และไม่มี GPU

---

## Tech Stack

### Frontend
- React + TypeScript
- Vite (Build Tool)
- Tailwind CSS
- shadcn/ui (UI Components)

### Backend
- FastAPI (Python Web Framework)
- PyTorch + Transformers (Hugging Face)
- Uvicorn (ASGI Server)

### ML Model
- Base Model: bert-base-uncased
- Dataset: Reddit Mental Health Dataset
- Categories: Anxiety, SuicideWatch, depression, mentalhealth, wellbeing
- Tokenizer: BERT Tokenizer with max_length 256

---

## Installation and Setup

### Prerequisites
- Node.js 18+ และ npm/bun
- Python 3.10+
- pip (Python package manager)
- (Optional) NVIDIA GPU with CUDA for faster training/inference

### Quick Start (Windows)

```powershell
# Setup ทั้งหมดด้วยคำสั่งเดียว
setup.bat
```

Script นี้จะ:
- ตรวจสอบ Node.js และ Python
- ติดตั้ง dependencies ทั้งหมด (npm + pip)
- สร้าง .env file
- แสดงขั้นตอนถัดไป

### Manual Setup

1. Clone repository

```bash
git clone https://github.com/etsuwithtea/Eunoia.git
cd Eunoia
```

2. ติดตั้ง Frontend dependencies

```bash
#ต้องมี node.js ก่อน https://nodejs.org/en/download
npm install
```

3. สร้าง Python virtual environment

```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux/Mac
source .venv/bin/activate
```

4. ติดตั้ง Python dependencies

```bash
# Training dependencies
pip install -r python/requirements.txt

# API dependencies
pip install -r python/api/requirements.txt
```

5. Train ML Model (ถ้ายังไม่มี model)

```bash
cd python
python train_gpu_transformer.py --data-path data/combined_dataset.parquet
```

หมายเหตุ:
- ถ้าไม่มี GPU จะใช้ CPU อัตโนมัติ (ช้ากว่า)
- ต้องมี dataset file ก่อน (run `python data_pipeline.py` ถ้ายังไม่มี)

6. รัน Backend API

```bash
cd python/api
python main.py
```

Backend จะรันที่: http://localhost:8000

7. รัน Frontend (Terminal ใหม่)

```bash
npm run dev
# หรือ
bun dev
```

Frontend จะรันที่: http://localhost:5173

---

## Usage

1. เปิดเว็บไซต์ที่ http://localhost:5173
2. ไปที่หน้า "ประเมินสุขภาพจิต"
3. พิมพ์ข้อความ (ภาษาอังกฤษ) หรืออัปโหลด PDF/รูปภาพ
4. กดปุ่ม "วิเคราะห์"
5. ดูผลการวิเคราะห์พร้อมคำแนะนำ

### ตัวอย่างข้อความ

Depression:
```
I feel so sad and hopeless lately. I can't seem to find joy in anything anymore.
Nothing makes me happy and I just want to sleep all day.
```

Anxiety:
```
I'm constantly worried about everything. My heart races and I can't stop thinking
about all the things that could go wrong. I feel restless all the time.
```

---

## API Endpoints

### POST /predict

ทำนายหมวดหมู่สุขภาพจิตจากข้อความ

Request:
```json
{
  "text": "I feel anxious and worried all the time"
}
```

Response:
```json
{
  "prediction": "Anxiety",
  "confidence": 0.87,
  "all_probabilities": {
    "Anxiety": 0.87,
    "depression": 0.05,
    "mentalhealth": 0.04,
    "SuicideWatch": 0.02,
    "wellbeing": 0.02
  },
  "preprocessed_text": "..."
}
```

### GET /health

ตรวจสอบสถานะของ API

Response:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "available_categories": ["Anxiety", "SuicideWatch", "depression", "mentalhealth", "wellbeing"]
}
```

API Documentation (Swagger): http://localhost:8000/docs

---

## Environment Variables

สร้างไฟล์ `.env` จาก `.env.example`:

```bash
cp .env.example .env
```

ตัวแปรที่ใช้:
- `MENTAL_MODEL_DIR` - path ไปยัง model directory (optional)

---

## Training Your Own Model

ถ้าต้องการ train model ใหม่:

1. เตรียม dataset

```bash
cd python
python data_pipeline.py
```

2. Train model

```bash
python train_gpu_transformer.py --data-path data/combined_dataset.parquet
```

Options:
- `--epochs` - จำนวน epochs (default: 3)
- `--model-name` - base model (default: bert-base-uncased)
- `--auto-batch` - auto scale batch size ตาม GPU VRAM
- `--resume` - resume training จาก checkpoint

---

## GPU vs CPU

- ถ้ามี NVIDIA GPU + CUDA: จะใช้ GPU อัตโนมัติ
- ถ้าไม่มี GPU: จะ fallback ไปใช้ CPU อัตโนมัติ (ช้ากว่าแต่ใช้งานได้)

ติดตั้ง PyTorch with CUDA:
```bash
pip install torch --index-url https://download.pytorch.org/whl/cu118
```

---

## Disclaimer

ระบบนี้เป็นเพียงเครื่องมือช่วยประเมินเบื้องต้นเท่านั้น ไม่ควรใช้แทนการวินิจฉัยทางการแพทย์

หากคุณหรือคนที่คุณรู้จักมีปัญหาด้านสุขภาพจิต กรุณาติดต่อ:
- สายด่วนสุขภาพจิต: 1323 (24 ชั่วโมง)
- โรงพยาบาล: ปรึกษาจิตแพทย์หรือนักจิตวิทยา

---


