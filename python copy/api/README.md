# Mental Health Prediction API

FastAPI backend สำหรับการทำนายสุขภาพจิตจากข้อความ โดยใช้ ML model ที่ train จาก Reddit Mental Health Dataset

## 📋 ขั้นตอนการติดตั้งและใช้งาน

### 1. Train Model (ทำครั้งแรกเท่านั้น)

เปิดและรันโน้ตบุ๊ค:
```
python/kaggel-dataset-first-dataset.ipynb
```

ไฟล์ที่จะถูกสร้าง:
- `model/mental_health_model.pkl`
- `model/mental_health_vectorizer.pkl`

### 2. ติดตั้ง Dependencies

เปิด Terminal และรันคำสั่ง:

```powershell
cd python/api
pip install -r requirements.txt
```

### 3. รัน API Server

```powershell
python main.py
```

หรือใช้ uvicorn โดยตรง:
```powershell
uvicorn main:app --reload
```

Server จะรันที่: `http://localhost:8000`

### 4. ทดสอบ API

**ผ่าน Browser:**
- Docs (Swagger UI): http://localhost:8000/docs
- Health check: http://localhost:8000/health

**ผ่าน curl:**
```powershell
curl -X POST "http://localhost:8000/predict" `
  -H "Content-Type: application/json" `
  -d '{"text": "I have been feeling really anxious and depressed lately"}'
```

**ผ่าน PowerShell:**
```powershell
$body = @{
    text = "I have been feeling really anxious and depressed lately"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/predict" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

## 🔌 API Endpoints

### `POST /predict`
ทำนายหมวดหมู่สุขภาพจิตจากข้อความ

**Request Body:**
```json
{
  "text": "Your text here (minimum 10 characters)"
}
```

**Response:**
```json
{
  "prediction": "depression",
  "confidence": 0.85,
  "all_probabilities": {
    "depression": 0.85,
    "anxiety": 0.10,
    "mentalhealth": 0.03,
    "SuicideWatch": 0.02
  },
  "preprocessed_text": "processed text"
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

## 📁 โครงสร้างไฟล์

```
python/api/
├── main.py              # FastAPI application
├── predict.py           # Prediction logic
├── requirements.txt     # Python dependencies
└── README.md           # This file
```

## 🔧 Configuration

ปรับแต่งใน `main.py`:
- **Port**: เปลี่ยน `port=8000` ในบรรทัดสุดท้าย
- **CORS origins**: เพิ่ม/ลบ origins ใน `allow_origins`
- **Model path**: แก้ไขใน `predict.py` constructor

## 🚨 Troubleshooting

**Q: Model not found error?**
A: รัน notebook `kaggel-dataset-first-dataset.ipynb` ก่อนเพื่อ train และ save model

**Q: Import errors?**
A: ติดตั้ง dependencies: `pip install -r requirements.txt`

**Q: CORS errors จาก frontend?**
A: ตรวจสอบว่า port ของ Vite ตรงกับที่ระบุใน `allow_origins`

## 💡 เชื่อมต่อกับ Frontend

ตัวอย่างการเรียกใช้จาก React/TypeScript:

```typescript
async function predictMentalHealth(text: string) {
  const response = await fetch('http://localhost:8000/predict', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });
  
  const data = await response.json();
  return data;
}
```
