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

### Quick Start

#### Windows

```powershell
# Setup library ทั้งหมดด้วยคำสั่งเดียว
setup.bat
```

Script นี้จะ:
- ตรวจสอบ Node.js และ Python
- ตรวจสอบและติดตั้ง Visual C++ Redistributable (จำเป็นสำหรับ PyTorch)
- สร้าง Python virtual environment
- Upgrade pip, setuptools, wheel
- ติดตั้ง dependencies ทั้งหมด (Python + Frontend)
- แสดงวิธีใช้งาน

#### macOS / Linux

```bash
# Setup library ทั้งหมดด้วยคำสั่งเดียว
chmod +x setup.sh
./setup.sh
```

Script นี้จะ:
- ตรวจสอบ Node.js 18+ และ Python 3.10+
- สร้าง Python virtual environment
- ติดตั้ง dependencies ทั้งหมด (Python + Frontend)
- สร้าง .env file (ถ้ายังไม่มี)

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
```

เปิดใช้งาน virtual environment:

```bash
# Windows - วิธีที่ 1 (แนะนำ)
activate.bat

# Windows - วิธีที่ 2
.venv\Scripts\activate

# Linux/Mac
source .venv/bin/activate
```

**หมายเหตุ (Windows):** ใช้ `activate.bat` จะเปิด virtual environment ให้อัตโนมัติและพร้อมใช้งาน

4. ติดตั้ง Python dependencies

**สำคัญ (Windows):** ต้องมี [Visual C++ Redistributable](https://aka.ms/vs/17/release/vc_redist.x64.exe) สำหรับ PyTorch
(setup.bat จะติดตั้งให้อัตโนมัติ แต่ถ้า manual setup ต้องติดตั้งเอง)

```bash
# Upgrade pip และ build tools ก่อน
pip install --upgrade pip setuptools wheel

# ติดตั้ง Python dependencies (รวม training + API)
pip install -r python/requirements.txt
```

**หมายเหตุ:**
- ไฟล์ `python/requirements.txt` จะรวม API dependencies ด้วยแล้ว (ใช้ `-r api/requirements.txt`)
- บน Windows ถ้าติดตั้งไม่สำเร็จ อาจต้องติดตั้งตัว [Visual C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)

5. Train ML Model (ถ้ายังไม่มี model โหลด Raw Data ที่ python\data_pipeline.py)

```bash
cd python
python train_gpu_transformer.py --data-path data/combined_dataset.parquet
```

หมายเหตุ:
- ถ้าไม่มี GPU จะใช้ CPU อัตโนมัติ (แต่จะช้ากว่ามากๆ)
- ต้องมี dataset file ก่อน (run `python data_pipeline.py` ถ้ายังไม่มี)

6. รัน Backend API

```bash
# Windows (แนะนำ - ใช้ python ใน virtual environment)
.venv\Scripts\python.exe python\api\main.py

# Linux/Mac (หลัง activate virtual environment)
python python/api/main.py
```

**หมายเหตุ (Windows):**
- ต้องใช้ `.venv\Scripts\python.exe` เพื่อให้แน่ใจว่าใช้ Python ใน virtual environment
- หรือใช้ `activate.bat` ก่อน แล้วค่อยรัน `python python\api\main.py`

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

สร้างไฟล์ `.env` จาก `.env.example` (ถ้ายังไม่มี):

```bash
# Windows (CMD)
copy .env.example .env

# Windows (PowerShell)
Copy-Item .env.example .env

# Linux/Mac
cp .env.example .env
```

**หมายเหตุ:** `setup.bat` และ `setup.sh` จะสร้าง `.env` ให้อัตโนมัติแล้ว

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

### ติดตั้ง PyTorch with CUDA (Optional - สำหรับ GPU)

ถ้าต้องการติดตั้ง PyTorch แบบระบุ CUDA version เอง:

```bash
# CUDA 12.1 (แนะนำสำหรับ GPU ใหม่)
pip install torch --index-url https://download.pytorch.org/whl/cu121

# CUDA 11.8 (สำหรับ GPU รุ่นเก่า)
pip install torch --index-url https://download.pytorch.org/whl/cu118

# CPU only (ไม่มี GPU)
pip install torch --index-url https://download.pytorch.org/whl/cpu
```

ตรวจสอบ CUDA version ที่รองรับ: https://pytorch.org/get-started/locally/




