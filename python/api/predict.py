import re
import string
import joblib
import os
from typing import Dict

class MentalHealthPredictor:
    """Class for loading model and making predictions"""
    
    def __init__(self, model_dir: str = None):
        """Initialize predictor by loading model and vectorizer"""
        # Use absolute path if not provided
        if model_dir is None:
            # Get the directory of this file (api folder)
            current_dir = os.path.dirname(os.path.abspath(__file__))
            # Go up two levels to project root, then into model folder
            model_dir = os.path.join(os.path.dirname(os.path.dirname(current_dir)), "model")
        
        self.model_path = os.path.join(model_dir, "mental_health_model.pkl")
        self.vectorizer_path = os.path.join(model_dir, "mental_health_vectorizer.pkl")
        
        # Load model and vectorizer
        try:
            self.model = joblib.load(self.model_path)
            self.vectorizer = joblib.load(self.vectorizer_path)
            print(f"✅ Model loaded successfully from {self.model_path}")
            print(f"✅ Vectorizer loaded successfully from {self.vectorizer_path}")
            print(f"Model can predict: {self.model.classes_}")
        except FileNotFoundError as e:
            raise Exception(f"Model files not found. Please run the training notebook first. Error: {e}")
    
    def preprocess_text(self, text: str) -> str:
        """Preprocess text using the same method as training"""
        text = text.lower()
        text = re.sub(f"[{re.escape(string.punctuation)}]", "", text)
        text = re.sub(r"\s+", " ", text).strip()
        return text
    
    def predict(self, text: str) -> Dict:
        """
        Predict mental health category from text
        
        Args:
            text: User input text
            
        Returns:
            Dictionary with prediction and probabilities
        """
        # Preprocess
        processed_text = self.preprocess_text(text)
        
        # Vectorize
        text_vec = self.vectorizer.transform([processed_text])
        
        # Predict
        prediction = self.model.predict(text_vec)[0]
        probabilities = self.model.predict_proba(text_vec)[0]
        
        # Create probability dictionary
        prob_dict = {
            class_name: float(prob) 
            for class_name, prob in zip(self.model.classes_, probabilities)
        }
        
        # Sort by probability (highest first)
        prob_dict = dict(sorted(prob_dict.items(), key=lambda x: x[1], reverse=True))
        
        return {
            "prediction": prediction,
            "confidence": float(max(probabilities)),
            "all_probabilities": prob_dict,
            "preprocessed_text": processed_text
        }
