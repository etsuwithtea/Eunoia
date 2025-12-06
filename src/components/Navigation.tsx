import { Button } from "@/components/ui/button";
import { Brain, Home, Activity, Info } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 group"
          >
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center shadow-soft group-hover:shadow-lg transition-smooth">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="font-semibold text-foreground hidden sm:inline">
              Eunoia
            </span>
          </button>

          {/* Nav Links */}
          <div className="flex items-center gap-2">
            <Button
              variant={isActive("/") ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">หน้าแรก</span>
            </Button>
            <Button
              variant={isActive("/assessment") ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate("/assessment")}
              className="gap-2"
            >
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">ประเมิน</span>
            </Button>
            <Button
              variant={isActive("/about") ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate("/about")}
              className="gap-2"
            >
              <Info className="w-4 h-4" />
              <span className="hidden sm:inline">เกี่ยวกับ</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
