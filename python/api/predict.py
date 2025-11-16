import re
import string
import json
import os
from pathlib import Path
from typing import Dict

# Fix OpenMP duplicate library warning
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

class MentalHealthPredictor:
    """Class for loading transformer model and making predictions"""
    
    def __init__(self, model_dir: str = None):
        """Initialize predictor by loading transformer model and tokenizer"""
        # Use absolute path if not provided
        if model_dir is None:
            # Get the directory of this file (api folder)
            current_dir = os.path.dirname(os.path.abspath(__file__))
            # Go up two levels to project root, then into model folder
            model_dir = os.path.join(os.path.dirname(os.path.dirname(current_dir)), "model", "transformer_distilbert")
        
        model_path = Path(model_dir)
        label_map_path = model_path / "label_map.json"
        
        # Load label mapping
        try:
            if label_map_path.exists():
                with open(label_map_path, 'r') as f:
                    self.id2label = json.load(f)
                    # Convert string keys to integers
                    self.id2label = {int(k): v for k, v in self.id2label.items()}
                    self.label2id = {v: int(k) for k, v in self.id2label.items()}
            else:
                # Fallback to default labels
                self.id2label = {0: "Anxiety", 1: "SuicideWatch", 2: "depression", 3: "mentalhealth"}
                self.label2id = {v: k for k, v in self.id2label.items()}
            
            # Load model and tokenizer
            self.tokenizer = AutoTokenizer.from_pretrained(model_dir)
            self.model = AutoModelForSequenceClassification.from_pretrained(model_dir)
            self.model.eval()  # Set to evaluation mode
            
            # Move to GPU if available
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            self.model.to(self.device)
            
            print(f"✅ Model loaded successfully from {model_dir}")
            print(f"✅ Using device: {self.device}")
            print(f"✅ Model can predict: {list(self.id2label.values())}")
        except FileNotFoundError as e:
            raise Exception(f"Model files not found. Please run training first. Error: {e}")
        except Exception as e:
            raise Exception(f"Error loading model: {e}")
    
    def preprocess_text(self, text: str) -> str:
        """Basic preprocessing - transformer handles most of it"""
        # Remove excessive whitespace
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
        
        # Tokenize
        inputs = self.tokenizer(
            processed_text,
            return_tensors="pt",
            truncation=True,
            max_length=256,
            padding=True
        )
        
        # Move inputs to device
        inputs = {k: v.to(self.device) for k, v in inputs.items()}
        
        # Predict (no gradient calculation needed)
        with torch.no_grad():
            outputs = self.model(**inputs)
            logits = outputs.logits
            probabilities = torch.softmax(logits, dim=-1)[0]
        
        # Get prediction
        predicted_class_id = torch.argmax(probabilities).item()
        prediction = self.id2label[predicted_class_id]
        confidence = probabilities[predicted_class_id].item()
        
        # Create probability dictionary
        prob_dict = {
            self.id2label[i]: float(probabilities[i].item())
            for i in range(len(probabilities))
        }
        
        # Sort by probability (highest first)
        prob_dict = dict(sorted(prob_dict.items(), key=lambda x: x[1], reverse=True))
        
        return {
            "prediction": prediction,
            "confidence": float(confidence),
            "all_probabilities": prob_dict,
            "preprocessed_text": processed_text
        }
