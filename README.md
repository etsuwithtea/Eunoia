# 🧠 Reddit Mood Scan - Mental Health Assessment System

AI-powered mental health assessment tool ที่ใช้ Machine Learning ในการวิเคราะห์ข้อความและประเมินภาวะสุขภาพจิต

## 🌟 Features

- ✅ **Mental Health Assessment** - ประเมินสุขภาพจิตจากข้อความ
- ✅ **AI-Powered Analysis** - ใช้ Logistic Regression + TF-IDF Vectorization
- ✅ **4 Categories** - วิเคราะห์ 4 หมวดหมู่: Depression, Anxiety, Mental Health, Suicide Watch
- ✅ **PDF & OCR Support** - รองรับการอัปโหลด PDF และรูปภาพ
- ✅ **Real-time Results** - แสดงผลแบบ real-time พร้อม confidence scores
- ✅ **Responsive Design** - ใช้งานได้ทั้ง Desktop และ Mobile

## 🛠️ Tech Stack

### Frontend
- **React** + **TypeScript** - UI Framework
- **Vite** - Build Tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI Components
- **Sonner** - Toast Notifications

### Backend
- **FastAPI** - Python Web Framework
- **scikit-learn** - Machine Learning
- **pandas** - Data Processing
- **joblib** - Model Serialization
- **Uvicorn** - ASGI Server

### ML Model
- **Dataset:** Reddit Mental Health Dataset (Kaggle)
- **Algorithm:** Logistic Regression
- **Vectorization:** TF-IDF (5000 features)
- **Accuracy:** ~85-90% (ขึ้นอยู่กับ category)

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ และ npm
- Python 3.8+
- pip (Python package manager)

### 🚀 Quick Start (Windows - ใช้ Batch Scripts)

#### วิธีที่ 1: Setup ทั้งหมดด้วยคำสั่งเดียว
```powershell
# Double-click หรือรัน
setup.bat
```
Script นี้จะ:
- ✅ ตรวจสอบ Node.js และ Python
- ✅ ติดตั้ง dependencies ทั้งหมด (npm + pip)
- ✅ สร้าง .env file
- ✅ แสดงขั้นตอนถัดไป

#### วิธีที่ 2: Setup แบบแยกขั้นตอน

**1. ติดตั้ง Dependencies**
```powershell
install-frontend-deps.bat    # ติดตั้ง npm packages
install-python-deps.bat      # ติดตั้ง Python packages
```

**2. Train ML Model** (ครั้งแรกเท่านั้น)
- เปิด `python/kaggel-dataset-first-dataset.ipynb` ใน VS Code
- Run All Cells
- รอจนกว่า model จะถูก save ที่ `model/` folder

**3. รัน Application**

**วิธีง่ายสุด - รันทั้งคู่พร้อมกัน:**
```powershell
start-all.bat    # เปิด Backend + Frontend ในหน้าต่างแยกกัน
```

**หรือรันแยกกัน:**
```powershell
start-backend.bat     # รัน FastAPI backend (http://localhost:8000)
start-frontend.bat    # รัน Vite frontend (http://localhost:5173)
```

### 📋 Manual Setup (สำหรับ Linux/Mac หรือต้องการ control มากขึ้น)

1. **Clone repository**
   ```bash
   git clone https://github.com/PacharapolArdsang/reddit-mood-scan.git
   cd reddit-mood-scan
   ```

2. **ติดตั้ง Frontend dependencies**
   ```bash
   npm install
   ```

3. **ติดตั้ง Python dependencies**
   ```bash
   cd python/api
   pip install -r requirements.txt
   cd ../..
   ```

4. **Train ML Model** (ครั้งแรกเท่านั้น)
   - เปิด `python/kaggel-dataset-first-dataset.ipynb` ใน VS Code
   - Run All Cells
   - รอจนกว่า model จะถูก save ที่ `model/` folder

5. **สร้าง .env file**
   ```bash
   cp .env.example .env
   ```

6. **รัน Backend API**
   ```bash
   cd python/api
   python main.py
   ```
   Backend จะรันที่: http://localhost:8000

7. **รัน Frontend** (Terminal ใหม่)
   ```bash
   npm run dev
   ```
   Frontend จะรันที่: http://localhost:5173

## 📖 Documentation

อ่านคู่มือการใช้งานแบบละเอียดได้ที่: **[SETUP_GUIDE.md](./SETUP_GUIDE.md)**

## 🎯 Usage

1. เปิดเว็บไซต์ที่ http://localhost:5173
2. ไปที่หน้า "ประเมินสุขภาพจิต"
3. พิมพ์ข้อความ (ภาษาอังกฤษ) หรืออัปโหลด PDF/รูปภาพ
4. กดปุ่ม "วิเคราะห์"
5. ดูผลการวิเคราะห์พร้อมคำแนะนำ

### ตัวอย่างข้อความ

**Depression:**
```
I feel so sad and hopeless lately. I can't seem to find joy in anything anymore.
Nothing makes me happy and I just want to sleep all day.
```

**Anxiety:**
```
I'm constantly worried about everything. My heart races and I can't stop thinking
about all the things that could go wrong. I feel restless all the time.
```

## 📊 API Endpoints

### `POST /predict`
ทำนายหมวดหมู่สุขภาพจิตจากข้อความ

**Request:**
```json
{
  "text": "I feel anxious and worried all the time"
}
```

**Response:**
```json
{
  "prediction": "anxiety",
  "confidence": 0.87,
  "all_probabilities": {
    "anxiety": 0.87,
    "depression": 0.08,
    "mentalhealth": 0.03,
    "SuicideWatch": 0.02
  },
  "preprocessed_text": "..."
}
```

### `GET /health`
ตรวจสอบสถานะของ API

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "available_categories": ["depression", "anxiety", "mentalhealth", "SuicideWatch"]
}
```

API Documentation (Swagger): http://localhost:8000/docs

## 📁 Project Structure

```
reddit-mood-scan/
├── src/                          # Frontend source code
│   ├── components/               # React components
│   │   ├── Assessment.tsx        # Main assessment page
│   │   ├── ResultDisplay.tsx     # Results display
│   │   └── ui/                   # UI components (shadcn/ui)
│   ├── lib/
│   │   └── mental-health-api.ts  # API client
│   └── pages/                    # Page components
├── python/
│   ├── api/                      # FastAPI backend
│   │   ├── main.py               # API server
│   │   ├── predict.py            # Prediction logic
│   │   ├── requirements.txt      # Python dependencies
│   │   └── README.md             # API documentation
│   └── kaggel-dataset-first-dataset.ipynb  # ML training notebook
├── model/                        # Trained ML models
│   ├── mental_health_model.pkl
│   └── mental_health_vectorizer.pkl
├── Batch Scripts (Windows)       # Quick start scripts
│   ├── setup.bat                 # Complete setup (all-in-one)
│   ├── start-all.bat             # Start both backend & frontend
│   ├── start-backend.bat         # Start backend only
│   ├── start-frontend.bat        # Start frontend only
│   ├── install-python-deps.bat   # Install Python packages
│   └── install-frontend-deps.bat # Install npm packages
├── SETUP_GUIDE.md                # Detailed setup guide
└── README.md                     # This file
```

อ่านเพิ่มเติมใน [SETUP_GUIDE.md](./SETUP_GUIDE.md)

## ⚠️ Disclaimer

ระบบนี้เป็นเพียงเครื่องมือช่วยประเมินเบื้องต้นเท่านั้น **ไม่ควรใช้แทนการวินิจฉัยทางการแพทย์** 

หากคุณหรือคนที่คุณรู้จักมีปัญหาด้านสุขภาพจิต กรุณาติดต่อ:
- 📞 **สายด่วนสุขภาพจิต:** 1323 (24 ชั่วโมง)
- 🏥 **โรงพยาบาล:** ปรึกษาจิตแพทย์หรือนักจิตวิทยา
