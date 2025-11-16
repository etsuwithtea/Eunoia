from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from predict import MentalHealthPredictor
import uvicorn

# Initialize FastAPI app
app = FastAPI(
    title="Mental Health Prediction API",
    description="API for predicting mental health categories from text using Reddit dataset model",
    version="1.0.0"
)

# Configure CORS to allow requests from Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite default port
        "http://localhost:5174",
        "http://localhost:8080",  # Alternative Vite port
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize predictor (will load model on startup)
try:
    predictor = MentalHealthPredictor()
except Exception as e:
    print(f"❌ Error loading model: {e}")
    predictor = None

# Request model
class PredictionRequest(BaseModel):
    text: str = Field(..., min_length=10, description="Text to analyze (minimum 10 characters)")

# Response model
class PredictionResponse(BaseModel):
    prediction: str
    confidence: float
    all_probabilities: dict
    preprocessed_text: str

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "running",
        "message": "Mental Health Prediction API",
        "model_loaded": predictor is not None
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """
    Predict mental health category from text
    
    - **text**: The text to analyze (minimum 10 characters)
    
    Returns prediction, confidence score, and probabilities for all categories
    """
    if predictor is None:
        raise HTTPException(
            status_code=500, 
            detail="Model not loaded. Please train the model first by running the notebook."
        )
    
    try:
        result = predictor.predict(request.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.get("/health")
async def health():
    """Detailed health check"""
    available_categories = []
    if predictor:
        # Get categories from id2label mapping (transformer model)
        available_categories = list(predictor.id2label.values()) if hasattr(predictor, 'id2label') else []
    
    return {
        "status": "healthy" if predictor is not None else "unhealthy",
        "model_loaded": predictor is not None,
        "available_categories": available_categories
    }

if __name__ == "__main__":
    # Run server
    print("\n🚀 Starting Mental Health Prediction API...")
    print("📝 Docs available at: http://localhost:8000/docs")
    print("🔍 Health check at: http://localhost:8000/health")
    uvicorn.run(app, host="0.0.0.0", port=8000)
