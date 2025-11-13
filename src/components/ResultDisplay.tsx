import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertTriangle, RefreshCcw, Info, AlertOctagon } from "lucide-react";
import { 
  CATEGORY_LABELS, 
  CATEGORY_DESCRIPTIONS, 
  getConfidenceLevel, 
  formatProbability 
} from "@/lib/mental-health-api";

interface ResultProps {
  result: {
    prediction: string;
    confidence: number;
    all_probabilities: Record<string, number>;
    preprocessed_text: string;
  };
  onReset: () => void;
}

const ResultDisplay = ({ result, onReset }: ResultProps) => {
  const getStatusInfo = (prediction: string) => {
    const baseInfo = {
      depression: {
        title: "ภาวะซึมเศร้า",
        color: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-950/20",
        icon: <AlertTriangle className="w-8 h-8" />,
      },
      anxiety: {
        title: "ภาวะวิตกกังวล",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
        icon: <AlertTriangle className="w-8 h-8" />,
      },
      mentalhealth: {
        title: "สุขภาพจิตทั่วไป",
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950/20",
        icon: <Info className="w-8 h-8" />,
      },
      SuicideWatch: {
        title: "ความเสี่ยงสูง - ต้องการความช่วยเหลือเร่งด่วน",
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-950/20",
        icon: <AlertOctagon className="w-8 h-8" />,
      },
    };

    const info = baseInfo[prediction as keyof typeof baseInfo] || {
      title: "ไม่สามารถระบุได้",
      color: "text-muted-foreground",
      bgColor: "bg-muted",
      icon: <Info className="w-8 h-8" />,
    };

    return {
      ...info,
      description: CATEGORY_DESCRIPTIONS[prediction] || "ข้อมูลไม่เพียงพอสำหรับการวิเคราะห์",
    };
  };

  const status = getStatusInfo(result.prediction);
  const confidenceInfo = getConfidenceLevel(result.confidence);

  // Generate recommendations based on prediction
  const getRecommendations = (prediction: string): string[] => {
    const recommendations: Record<string, string[]> = {
      depression: [
        "ควรปรึกษาผู้เชี่ยวชาญด้านสุขภาพจิต เช่น นักจิตวิทยาหรือจิตแพทย์",
        "พยายามออกกำลังกายเบาๆ สม่ำเสมอ เช่น เดิน 20-30 นาทีต่อวัน",
        "รักษาตารางการนอนให้สม่ำเสมอ นอนหลับ 7-8 ชั่วโมงต่อคืน",
        "พูดคุยกับคนที่ไว้ใจได้ อย่าปิดกั้นความรู้สึก",
      ],
      anxiety: [
        "ฝึกเทคนิคการหายใจลึกๆ และการทำสมาธิ",
        "ลดการรับคาเฟอีนและแอลกอฮอล์",
        "ออกกำลังกายสม่ำเสมอเพื่อลดความเครียด",
        "หากอาการรุนแรง ควรปรึกษาผู้เชี่ยวชาญ",
      ],
      mentalhealth: [
        "รักษาสมดุลระหว่างการทำงานและพักผ่อน",
        "สร้างกิจกรรมที่ทำให้มีความสุข",
        "พูดคุยกับคนใกล้ชิดเกี่ยวกับความรู้สึก",
        "หากรู้สึกไม่สบายใจ อย่าลังเลที่จะขอความช่วยเหลือ",
      ],
      SuicideWatch: [
        "⚠️ กรุณาติดต่อสายด่วนสุขภาพจิต 1323 ทันที (24 ชั่วโมง)",
        "ไปพบจิตแพทย์หรือไปโรงพยาบาลโดยเร็วที่สุด",
        "บอกคนใกล้ชิดเกี่ยวกับความรู้สึกของคุณ",
        "อย่าอยู่คนเดียว หาคนที่ไว้ใจอยู่ด้วย",
      ],
    };

    return recommendations[prediction] || [
      "ดูแลสุขภาพกายและสุขภาพจิตของคุณ",
      "พักผ่อนให้เพียงพอ",
      "หากมีความกังวล ควรปรึกษาผู้เชี่ยวชาญ",
    ];
  };

  const recommendations = getRecommendations(result.prediction);

  return (
    <div className="space-y-6 animate-slide-up">;

      {/* Main Result Card */}
      <Card className={`p-8 shadow-card border-border ${status.bgColor}`}>
        <div className="flex flex-col items-center text-center">
          <div className={`mb-4 ${status.color}`}>{status.icon}</div>
          <h2 className={`text-3xl font-bold mb-2 ${status.color}`}>
            {status.title}
          </h2>
          <p className="text-muted-foreground mb-4">{status.description}</p>
          <div className="text-sm space-y-1">
            <div className="text-muted-foreground">
              ความมั่นใจในผลลัพธ์:{" "}
              <span className={`font-semibold ${confidenceInfo.color}`}>
                {formatProbability(result.confidence)} ({confidenceInfo.label})
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Detailed Scores */}
      <Card className="p-8 shadow-card border-border">
        <h3 className="text-xl font-semibold mb-6 text-foreground">
          รายละเอียดคะแนนทุกหมวดหมู่
        </h3>
        <div className="space-y-4">
          {Object.entries(result.all_probabilities).map(([key, value]) => (
            <div key={key}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-foreground">
                  {CATEGORY_LABELS[key] || key}
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatProbability(value)}
                </span>
              </div>
              <Progress value={value * 100} className="h-2" />
            </div>
          ))}
        </div>
      </Card>

      {/* Recommendations */}
      <Card className="p-8 shadow-card border-border">
        <h3 className="text-xl font-semibold mb-4 text-foreground">
          คำแนะนำ
        </h3>
        <ul className="space-y-3">
          {recommendations.map((rec, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full gradient-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold text-white">
                  {index + 1}
                </span>
              </div>
              <span className="text-foreground">{rec}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Disclaimer */}
      <Card className="p-6 bg-accent/30 border-accent">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm text-foreground">
            <p className="font-medium mb-1">ข้อจำกัดความรับผิดชอบ</p>
            <p className="text-muted-foreground">
              ระบบนี้เป็นเพียงเครื่องมือช่วยประเมินเบื้องต้นเท่านั้น
              ไม่ควรใช้แทนการวินิจฉัยทางการแพทย์
              หากมีความกังวลเกี่ยวกับสุขภาพจิต
              กรุณาปรึกษาผู้เชี่ยวชาญด้านสุขภาพจิตโดยตรง
            </p>
          </div>
        </div>
      </Card>

      {/* Reset Button */}
      <Button
        variant="soft"
        size="lg"
        onClick={onReset}
        className="w-full"
      >
        <RefreshCcw className="w-5 h-5" />
        ประเมินใหม่
      </Button>
    </div>
  );
};

export default ResultDisplay;
