import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Database, Cpu, Shield, Target, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-hero px-6 py-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-primary shadow-soft mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            เกี่ยวกับโครงงาน
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            ระบบวิเคราะห์สุขภาพจิตด้วย Deep Learning และ NLP
          </p>
        </div>

        {/* Overview */}
        <Card className="p-8 mb-8 shadow-card border-border animate-slide-up">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            ภาพรวมโครงงาน
          </h2>
          <p className="text-foreground leading-relaxed mb-4">
            โครงงานนี้มีวัตถุประสงค์เพื่อพัฒนาโมเดล Deep Learning
            ด้านประมวลผลภาษาธรรมชาติ (NLP)
            สำหรับการจำแนกภาวะสุขภาพจิตของผู้ใช้จากข้อความ
            โดยใช้ข้อมูลจากชุดข้อมูล Reddit Mental Health Dataset
            ซึ่งรวบรวมโพสต์จากกลุ่มผู้ใช้งานที่เกี่ยวข้องกับภาวะซึมเศร้า
            ความวิตกกังวล PTSD และสุขภาพจิตทั่วไป
          </p>
          <p className="text-foreground leading-relaxed">
            ระบบต้นแบบที่ได้สามารถประเมินและแสดงผลการวิเคราะห์สุขภาพจิตของผู้ใช้ได้แบบเรียลไทม์
            ช่วยสนับสนุนการคัดกรองผู้มีความเสี่ยงด้านสุขภาพจิตในเบื้องต้นได้อย่างแม่นยำและรวดเร็ว
          </p>
        </Card>

        {/* Technical Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <TechCard
            icon={<Database className="w-6 h-6" />}
            title="ชุดข้อมูล"
            description="Reddit Mental Health Dataset ที่รวบรวมโพสต์จากผู้ใช้งานจริง ครอบคลุมภาวะสุขภาพจิตที่หลากหลาย"
          />
          <TechCard
            icon={<Cpu className="w-6 h-6" />}
            title="เทคโนโลยี"
            description="Deep Learning และ NLP พร้อมเทคนิค TF-IDF สำหรับการแปลงข้อความเป็นเวกเตอร์"
          />
          <TechCard
            icon={<Target className="w-6 h-6" />}
            title="โมเดล"
            description="Logistic Regression และ Deep Learning Models ที่ผ่านการฝึกและปรับแต่งอย่างละเอียด"
          />
          <TechCard
            icon={<Shield className="w-6 h-6" />}
            title="ความปลอดภัย"
            description="ข้อมูลของผู้ใช้ได้รับการคุ้มครองและจัดการอย่างเหมาะสม"
          />
        </div>

        {/* Classification Categories */}
        <Card className="p-8 mb-8 shadow-card border-border">
          <h2 className="text-2xl font-semibold mb-6 text-foreground">
            หมวดหมู่การจำแนก
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CategoryCard
              title="ภาวะซึมเศร้า (Depression)"
              description="ระบุสัญญาณและรูปแบบการสื่อสารที่บ่งชี้ถึงภาวะซึมเศร้า"
            />
            <CategoryCard
              title="ภาวะวิตกกังวล (Anxiety)"
              description="ตรวจจับรูปแบบความคิดและการแสดงออกที่เกี่ยวข้องกับความวิตกกังวล"
            />
            <CategoryCard
              title="PTSD"
              description="วิเคราะห์เนื้อหาที่อาจเกี่ยวข้องกับภาวะความเครียดหลังเหตุการณ์สะเทือนขวัญ"
            />
            <CategoryCard
              title="สุขภาพจิตดี (Normal)"
              description="ประเมินความสมดุลและความเป็นปกติของสุขภาพจิต"
            />
          </div>
        </Card>

        {/* Objectives */}
        <Card className="p-8 mb-8 shadow-card border-border">
          <h2 className="text-2xl font-semibold mb-6 text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            วัตถุประสงค์
          </h2>
          <ul className="space-y-3">
            {[
              "พัฒนาโมเดล Deep Learning ที่มีความแม่นยำสูงในการจำแนกภาวะสุขภาพจิต",
              "สร้างระบบที่สามารถวิเคราะห์และแสดงผลแบบเรียลไทม์",
              "ช่วยสนับสนุนการคัดกรองเบื้องต้นสำหรับผู้มีความเสี่ยงด้านสุขภาพจิต",
              "ให้ข้อมูลและคำแนะนำที่เป็นประโยชน์แก่ผู้ใช้",
              "เพิ่มการเข้าถึงเครื่องมือประเมินสุขภาพจิตที่มีคุณภาพ",
            ].map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full gradient-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                </div>
                <span className="text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <Button
            variant="hero"
            size="lg"
            onClick={() => navigate("/assessment")}
          >
            <Brain className="w-5 h-5" />
            ทดลองใช้ระบบ
          </Button>
        </div>
      </div>
    </div>
  );
};

const TechCard = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => {
  return (
    <Card className="p-6 shadow-card border-border hover:shadow-soft transition-smooth">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl gradient-secondary flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold mb-2 text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </Card>
  );
};

const CategoryCard = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  return (
    <div className="p-4 bg-accent/30 rounded-xl border border-accent">
      <h3 className="font-semibold mb-2 text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
};

export default About;
