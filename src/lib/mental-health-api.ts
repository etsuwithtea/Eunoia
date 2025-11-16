/**
 * Mental Health Prediction API Client
 * สำหรับเชื่อมต่อกับ FastAPI backend
 */

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Types
export interface PredictionRequest {
  text: string;
}

export interface PredictionResponse {
  prediction: string;
  confidence: number;
  all_probabilities: Record<string, number>;
  preprocessed_text: string;
}

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
  available_categories: string[];
}

export interface ApiError {
  detail: string;
}

// Category labels mapping (Thai translations)
export const CATEGORY_LABELS: Record<string, string> = {
  'Anxiety': 'ภาวะวิตกกังวล',
  'SuicideWatch': 'ความเสี่ยงสูง - ต้องการความช่วยเหลือเร่งด่วน',
  'depression': 'ภาวะซึมเศร้า',
  'mentalhealth': 'โรคจิตเวช/ภาวะสุขภาพจิตที่ต้องการการดูแล',
  'wellbeing': 'สุขภาวะดี',
};

// Category descriptions
export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'Anxiety': 'อาจมีอาการของภาวะวิตกกังวล เช่น กังวลมากเกินไป กลัว ตื่นเต้นง่าย',
  'SuicideWatch': '⚠️ พบสัญญาณเสี่ยงสูง - ขอแนะนำให้ติดต่อผู้เชี่ยวชาญด้านสุขภาพจิตโดยด่วน',
  'depression': 'อาจมีอาการของภาวะซึมเศร้า เช่น เศร้า เหนื่อยหน่าย ไม่มีพลัง',
  'mentalhealth': 'พบสัญญาณของโรคจิตเวชหรือความผิดปกติทางจิต เช่น โรคอารมณ์สองขั้ว โรคจิตเภท BPD หรือความผิดปกติทางจิตอื่นๆ ควรปรึกษาจิตแพทย์',
  'wellbeing': 'แสดงสุขภาวะที่ดี มีความสุข และมีพลังในการดำเนินชีวิต',
};

// API Client Class
class MentalHealthAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * ทำนายหมวดหมู่สุขภาพจิตจากข้อความ
   */
  async predict(text: string): Promise<PredictionResponse> {
    if (!text || text.trim().length < 10) {
      throw new Error('กรุณากรอกข้อความอย่างน้อย 10 ตัวอักษร');
    }

    const response = await fetch(`${this.baseUrl}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: text.trim() }),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'เกิดข้อผิดพลาดในการทำนาย');
    }

    return response.json();
  }

  /**
   * ตรวจสอบสถานะของ API
   */
  async checkHealth(): Promise<HealthResponse> {
    const response = await fetch(`${this.baseUrl}/health`);

    if (!response.ok) {
      throw new Error('ไม่สามารถเชื่อมต่อกับ API ได้');
    }

    return response.json();
  }

  /**
   * ทดสอบการเชื่อมต่อ
   */
  async ping(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const mentalHealthAPI = new MentalHealthAPI();

// Helper function: แปลงความมั่นใจเป็นระดับ
export function getConfidenceLevel(confidence: number): {
  level: 'low' | 'medium' | 'high';
  label: string;
  color: string;
} {
  if (confidence >= 0.7) {
    return { level: 'high', label: 'ความมั่นใจสูง', color: 'text-green-600' };
  } else if (confidence >= 0.5) {
    return { level: 'medium', label: 'ความมั่นใจปานกลาง', color: 'text-yellow-600' };
  } else {
    return { level: 'low', label: 'ความมั่นใจต่ำ', color: 'text-gray-600' };
  }
}

// Helper function: จัดรูปแบบ probability เป็น percentage
export function formatProbability(probability: number): string {
  return `${(probability * 100).toFixed(1)}%`;
}
