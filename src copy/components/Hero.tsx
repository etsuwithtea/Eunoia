import { Button } from "@/components/ui/button";
import { Brain, Activity, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="min-h-screen gradient-hero flex items-center justify-center px-6 py-20">
      <div className="max-w-6xl mx-auto text-center animate-fade-in">
        {/* Icon */}
        <div className="mb-8 inline-flex items-center justify-center w-20 h-20 rounded-full gradient-primary shadow-soft">
          <Brain className="w-10 h-10 text-white" />
        </div>

        {/* Heading */}
        <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground leading-tight">
          ระบบประเมินสุขภาพจิต
          <br />
          <span className="gradient-primary bg-clip-text text-transparent">
            ด้วย AI
          </span>
        </h1>

        {/* Description */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          วิเคราะห์และประเมินภาวะสุขภาพจิตของคุณผ่านข้อความ 
          ด้วยเทคโนโลยี Deep Learning และ NLP 
          ที่พัฒนาจากข้อมูลจริง เพื่อการดูแลสุขภาพจิตที่ดีขึ้น
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Button
            variant="hero"
            size="lg"
            onClick={() => navigate("/assessment")}
            className="group"
          >
            เริ่มประเมิน
            <Activity className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          </Button>
          <Button
            variant="soft"
            size="lg"
            onClick={() => navigate("/about")}
          >
            เรียนรู้เพิ่มเติม
          </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto animate-slide-up">
          <FeatureCard
            icon={<Brain className="w-6 h-6" />}
            title="AI-Powered"
            description="วิเคราะห์ด้วย Deep Learning Model ที่ผ่านการฝึกฝนจากข้อมูลจริง"
          />
          <FeatureCard
            icon={<Activity className="w-6 h-6" />}
            title="Real-time"
            description="ผลลัพธ์แบบเรียลไทม์ ประมวลผลรวดเร็วและแม่นยำ"
          />
          <FeatureCard
            icon={<Heart className="w-6 h-6" />}
            title="ปลอดภัย"
            description="ข้อมูลของคุณได้รับการคุ้มครองและเป็นความลับ"
          />
        </div>
      </div>
    </section>
  );
};

const FeatureCard = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => {
  return (
    <div className="bg-card p-6 rounded-2xl shadow-card hover:shadow-soft transition-smooth border border-border">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl gradient-secondary mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2 text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
};

export default Hero;
