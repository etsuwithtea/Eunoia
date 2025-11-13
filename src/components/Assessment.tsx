import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Brain, Loader2, AlertCircle, FileText, Image as ImageIcon, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ResultDisplay from "./ResultDisplay";
import OcrZoneSelector from "./OcrZoneSelector";
import { toast } from "sonner";
import {
  extractTextFromPdf,
  extractTextFromImage,
  extractTextFromImageZone,
  type ExtractionProgress,
  type NormalizedOcrZone,
} from "@/lib/text-extraction";
import { 
  mentalHealthAPI, 
  CATEGORY_LABELS, 
  CATEGORY_DESCRIPTIONS,
  getConfidenceLevel 
} from "@/lib/mental-health-api";

const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_IMAGE_SIZE = 8 * 1024 * 1024; // 8MB

type OcrZone = NormalizedOcrZone & { id: string };

const createZoneId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `zone-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

// Type for analysis result
interface AnalysisResult {
  prediction: string;
  confidence: number;
  all_probabilities: Record<string, number>;
  preprocessed_text: string;
}

const Assessment = () => {
  const [text, setText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isPdfExtracting, setIsPdfExtracting] = useState(false);
  const [isImageExtracting, setIsImageExtracting] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<ExtractionProgress | null>(null);
  const [imageProgress, setImageProgress] = useState<ExtractionProgress | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [ocrImageElement, setOcrImageElement] = useState<HTMLImageElement | null>(null);
  const [ocrZones, setOcrZones] = useState<OcrZone[]>([]);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [ocrMode, setOcrMode] = useState<"full" | "zones">("full");

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const appendExtractedText = (extracted: string) => {
    if (!extracted) {
      toast.error("ไม่พบข้อความใหม่");
      return;
    }

    setText((prev) => {
      if (!prev.trim()) {
        return extracted;
      }

      return `${prev.trim()}\n\n${extracted}`;
    });
  };

  const clearImageSelection = () => {
    setSelectedImageFile(null);
    setOcrImageElement(null);
    setOcrZones([]);
    setImageProgress(null);
    setIsOcrModalOpen(false);
    setOcrMode("full");
    setImagePreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
      return null;
    });
  };

  const handleAddZone = (zone: NormalizedOcrZone) => {
    setOcrZones((prev) => [...prev, { ...zone, id: createZoneId() }]);
  };

  const handleRemoveZone = (id: string) => {
    setOcrZones((prev) => prev.filter((zone) => zone.id !== id));
  };

  const handleClearZones = () => setOcrZones([]);

  const openOcrModal = () => {
    if (!imagePreviewUrl) {
      toast.error("ยังไม่มีรูปภาพสำหรับ OCR");
      return;
    }

    if (!ocrImageElement) {
      toast.info("กำลังเตรียมรูปภาพ...", {
        description: "โปรดรอให้โหลดรูปเสร็จก่อน",
      });
      return;
    }

    setIsOcrModalOpen(true);
  };

  const handleModalOpenChange = (open: boolean) => {
    if (open && !imagePreviewUrl) {
      toast.error("ยังไม่มีรูปภาพสำหรับ OCR");
      return;
    }
    setIsOcrModalOpen(open);
  };

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.type !== "application/pdf") {
      toast.error("กรุณาเลือกไฟล์ PDF เท่านั้น");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_PDF_SIZE) {
      toast.error("ไฟล์ PDF ต้องมีขนาดไม่เกิน 10MB");
      event.target.value = "";
      return;
    }

    setIsPdfExtracting(true);
    setPdfProgress({ status: "กำลังเตรียมไฟล์ PDF...", progress: 0 });

    try {
      const extracted = await extractTextFromPdf(file, (progress) => setPdfProgress(progress));

      if (!extracted) {
        toast.error("ไม่พบข้อความในไฟล์ PDF");
      } else {
        appendExtractedText(extracted);
        toast.success("ดึงข้อความจาก PDF สำเร็จ");
      }
    } catch (error) {
      console.error(error);
      toast.error("ไม่สามารถอ่านข้อความจาก PDF ได้");
    } finally {
      setIsPdfExtracting(false);
      setPdfProgress(null);
      event.target.value = "";
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("ไฟล์รูปภาพต้องมีขนาดไม่เกิน 8MB");
      event.target.value = "";
      return;
    }

    setSelectedImageFile(file);
    setImageProgress(null);
    setOcrZones([]);
    setOcrImageElement(null);

    const nextUrl = URL.createObjectURL(file);
    setImagePreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
      return nextUrl;
    });

    const previewImage = new Image();
    previewImage.onload = () => {
      setOcrImageElement(previewImage);
      setIsOcrModalOpen(true);
      setOcrMode("full");
    };
    previewImage.onerror = () => {
      toast.error("ไม่สามารถแสดงรูปภาพนี้ได้");
      setImagePreviewUrl((currentUrl) => {
        if (currentUrl === nextUrl) {
          URL.revokeObjectURL(currentUrl);
          return null;
        }
        return currentUrl;
      });
      setSelectedImageFile(null);
      setOcrImageElement(null);
      setIsOcrModalOpen(false);
    };
    previewImage.src = nextUrl;

    toast.info("เพิ่มรูปภาพแล้ว", {
      description: "ลากเพื่อเลือกพื้นที่หรือกดแปลงทั้งรูปได้เลย",
    });

    event.target.value = "";
  };

  const handleExtractWholeImage = async () => {
    if (!selectedImageFile) {
      toast.error("กรุณาเลือกรูปภาพก่อน");
      return;
    }

    setIsImageExtracting(true);
    setImageProgress({ status: "กำลังแปลงรูปภาพทั้งรูป...", progress: 0 });

    try {
      const extracted = await extractTextFromImage(selectedImageFile, (progress) =>
        setImageProgress({
          status: `OCR ทั้งรูป: ${progress.status}`,
          progress: progress.progress,
        }),
      );

      if (!extracted) {
        toast.error("ไม่พบข้อความจากทั้งรูป");
      } else {
        appendExtractedText(extracted);
        toast.success("แปลงข้อความจากทั้งรูปสำเร็จ");
      }
    } catch (error) {
      console.error(error);
      toast.error("ไม่สามารถประมวลผลรูปภาพทั้งรูปได้");
    } finally {
      setIsImageExtracting(false);
      setImageProgress(null);
    }
  };

  const handleExtractSelectedZones = async () => {
    if (!ocrImageElement || !ocrZones.length) {
      toast.error("กรุณาเลือกรูปและกำหนดพื้นที่อย่างน้อย 1 จุด");
      return;
    }

    setIsImageExtracting(true);
    setImageProgress({ status: "กำลังประมวลผลพื้นที่ที่เลือก...", progress: 0 });

    try {
      const zoneResults: string[] = [];

      for (let i = 0; i < ocrZones.length; i++) {
        const zone = ocrZones[i];
        const extracted = await extractTextFromImageZone(ocrImageElement, zone, (progress) =>
          setImageProgress({
            status: `พื้นที่ ${i + 1}/${ocrZones.length}: ${progress.status}`,
            progress: progress.progress,
          }),
        );

        if (extracted) {
          zoneResults.push(`พื้นที่ ${i + 1}: ${extracted}`);
        }
      }

      const combined = zoneResults.join("\n\n").trim();
      if (!combined) {
        toast.error("ไม่พบข้อความจากพื้นที่ที่เลือก");
      } else {
        appendExtractedText(combined);
        toast.success("แปลงข้อความจากพื้นที่สำเร็จ");
      }
    } catch (error) {
      console.error(error);
      toast.error("ไม่สามารถประมวลผลพื้นที่ที่เลือกได้");
    } finally {
      setIsImageExtracting(false);
      setImageProgress(null);
    }
  };

  const handleAnalyze = async () => {
    if (!text.trim()) {
      toast.error("กรุณาป้อนข้อความก่อนวิเคราะห์");
      return;
    }

    if (text.trim().length < 10) {
      toast.error("กรุณาป้อนข้อความอย่างน้อย 10 ตัวอักษร");
      return;
    }

    setIsAnalyzing(true);

    try {
      // Check API health first
      const isConnected = await mentalHealthAPI.ping();
      if (!isConnected) {
        toast.error("ไม่สามารถเชื่อมต่อกับระบบวิเคราะห์ได้", {
          description: "กรุณาตรวจสอบว่า API server กำลังทำงานอยู่",
        });
        return;
      }

      // Call prediction API
      const apiResult = await mentalHealthAPI.predict(text);
      
      setResult(apiResult);
      toast.success("วิเคราะห์เสร็จสิ้น", {
        description: `ผลการวิเคราะห์: ${CATEGORY_LABELS[apiResult.prediction] || apiResult.prediction}`,
      });
    } catch (error) {
      console.error("Prediction error:", error);
      
      const errorMessage = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการวิเคราะห์";
      
      toast.error("ไม่สามารถวิเคราะห์ได้", {
        description: errorMessage,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setText("");
    setResult(null);
  };

  return (
    <div className="min-h-screen gradient-hero px-6 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-primary shadow-soft mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            ประเมินสุขภาพจิต
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            เขียนแบ่งปันความรู้สึกหรือเรื่องราวของคุณ
            ระบบจะวิเคราะห์และประเมินภาวะสุขภาพจิตของคุณ
          </p>
        </div>

        {!result ? (
          <Card className="p-8 shadow-card border-border animate-slide-up">
            <div className="space-y-6">
              {/* Info Alert */}
              <div className="flex items-start gap-3 p-4 bg-accent/50 rounded-lg border border-accent">
                <AlertCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-sm text-foreground">
                  <p className="font-medium mb-1">คำแนะนำในการป้อนข้อมูล</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>เขียนอย่างตรงไปตรงมาและเป็นธรรมชาติ</li>
                    <li>ไม่ต้องกังวลเรื่องความยาวของข้อความ</li>
                    <li>ข้อมูลของคุณจะถูกเก็บเป็นความลับ</li>
                  </ul>
                </div>
              </div>

              {/* File Inputs */}
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      อัปโหลดไฟล์ PDF
                    </label>
                    <Input
                      type="file"
                      accept="application/pdf"
                      onChange={handlePdfUpload}
                      disabled={isAnalyzing || isPdfExtracting}
                    />
                    {isPdfExtracting && pdfProgress ? (
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <span>{pdfProgress.status}</span>
                        <Progress value={pdfProgress.progress} />
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        รองรับเฉพาะไฟล์เอกสาร PDF ขนาดไม่เกิน 10MB
                      </p>
                    )}
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-primary" />
                      OCR จากรูปภาพ
                    </label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isAnalyzing || isImageExtracting}
                    />
                    {imagePreviewUrl ? (
                      <div className="flex gap-4 rounded-lg border border-dashed border-primary/30 bg-muted/30 p-4">
                        <div className="hidden h-28 w-28 overflow-hidden rounded-md border border-border/60 bg-background/70 sm:block">
                          <img
                            src={imagePreviewUrl}
                            alt="ตัวอย่างรูปภาพ OCR"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">รูปที่เลือก</p>
                            <p className="text-xs text-muted-foreground">
                              {selectedImageFile?.name ?? "ไฟล์รูป"} ·{" "}
                              {selectedImageFile
                                ? `${(selectedImageFile.size / 1024).toFixed(1)} KB`
                                : "ขนาดไม่ทราบ"}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={openOcrModal}
                              disabled={isAnalyzing || isImageExtracting}
                            >
                              เปิดหน้าต่าง OCR
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={clearImageSelection}
                              disabled={isImageExtracting}
                            >
                              ลบรูป
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {ocrZones.length
                              ? `มีพื้นที่ที่บันทึกไว้ ${ocrZones.length} จุด`
                              : "ยังไม่มีการเลือกพื้นที่ สามารถกำหนดได้ในหน้าต่าง OCR"}
                          </p>
                          {isImageExtracting && imageProgress && (
                            <div className="space-y-1 text-xs text-muted-foreground">
                              <span>{imageProgress.status}</span>
                              <Progress value={imageProgress.progress} />
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        รองรับภาพสกรีนช็อตหรือรูประบบสารสนเทศต่างๆ (ภาษาไทย/อังกฤษ) ขนาดไม่เกิน 8MB
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Text Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block">
                  ข้อความของคุณ
                </label>
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="เช่น: วันนี้ฉันรู้สึก..."
                  className="min-h-[250px] resize-none text-base border-input focus:border-primary transition-smooth"
                  disabled={isAnalyzing}
                />
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>{text.length} ตัวอักษร</span>
                  <span>แนะนำอย่างน้อย 50 ตัวอักษร</span>
                </div>
              </div>

              {/* Action Button */}
              <Button
                variant="hero"
                size="lg"
                onClick={handleAnalyze}
                disabled={isAnalyzing || !text.trim()}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    กำลังวิเคราะห์...
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5" />
                    เริ่มวิเคราะห์
                  </>
                )}
              </Button>
            </div>
          </Card>
        ) : (
          <ResultDisplay result={result} onReset={handleReset} />
        )}
      </div>
      <Dialog open={Boolean(isOcrModalOpen && imagePreviewUrl)} onOpenChange={handleModalOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>จัดการ OCR จากรูปภาพ</DialogTitle>
          <DialogDescription>
            {selectedImageFile?.name
              ? `ไฟล์ ${selectedImageFile.name} · ${
                  selectedImageFile ? `${(selectedImageFile.size / 1024).toFixed(1)} KB` : ""
                }`
              : "เลือกรูปภาพเพื่อเริ่มใช้งาน OCR"}
          </DialogDescription>
        </DialogHeader>

        {imagePreviewUrl ? (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={ocrMode === "full" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setOcrMode("full")}
                disabled={isImageExtracting}
              >
                โหมดแปลทั้งรูป
              </Button>
              <Button
                variant={ocrMode === "zones" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setOcrMode("zones")}
                disabled={isImageExtracting}
              >
                โหมดเลือกเฉพาะจุด ({ocrZones.length})
              </Button>
            </div>

            {ocrMode === "full" ? (
              <div className="space-y-3 rounded-lg border border-border/80 bg-muted/30 p-4">
                <p className="text-sm font-medium text-foreground">ตัวอย่างรูปภาพทั้งหมด</p>
                <p className="text-xs text-muted-foreground">
                  ระบบจะประมวลผลทุกข้อความในรูปเดียวกัน เหมาะกับเอกสารที่ต้องการเก็บข้อมูลทั้งหมด
                </p>
                <div className="max-h-[65vh] overflow-auto rounded-md border border-border/70 bg-background">
                  <img
                    src={imagePreviewUrl}
                    alt="ตัวอย่างรูปภาพเต็ม"
                    className="w-full object-contain"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2 rounded-lg border border-dashed border-primary/40 bg-muted/30 p-4">
                  <p className="text-sm font-medium text-foreground">ลากเพื่อเลือกข้อความ</p>
                  <p className="text-xs text-muted-foreground">
                    สามารถกำหนดหลายจุดได้ตามต้องการ แล้วค่อยกดแปลงเฉพาะพื้นที่ที่เลือก
                  </p>
                  <OcrZoneSelector
                    imageUrl={imagePreviewUrl}
                    zones={ocrZones}
                    onAddZone={handleAddZone}
                    disabled={isImageExtracting || !ocrImageElement}
                  />
                </div>
                <div className="space-y-2 rounded-lg border border-border/70 bg-muted/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">รายการพื้นที่ที่เลือก</p>
                    {ocrZones.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearZones}
                        disabled={isImageExtracting}
                      >
                        ลบทั้งหมด
                      </Button>
                    )}
                  </div>
                  {ocrZones.length ? (
                    <div className="max-h-48 space-y-2 overflow-auto pr-1">
                      {ocrZones.map((zone, index) => (
                        <div
                          key={zone.id}
                          className="flex items-center justify-between rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
                        >
                          <div>
                            <p className="font-medium text-foreground">พื้นที่ {index + 1}</p>
                            <p className="text-xs text-muted-foreground">
                              X {zone.x.toFixed(1)}% • Y {zone.y.toFixed(1)}% • ขนาด{" "}
                              {zone.width.toFixed(1)}% × {zone.height.toFixed(1)}%
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveZone(zone.id)}
                            disabled={isImageExtracting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      ยังไม่มีพื้นที่ที่เลือก เริ่มลากบนรูปด้านบนเพื่อกำหนดจุด OCR
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}

        <DialogFooter className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
          {isImageExtracting && imageProgress ? (
            <div className="flex-1 space-y-1 text-xs text-muted-foreground">
              <span>{imageProgress.status}</span>
              <Progress value={imageProgress.progress} />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {ocrMode === "full"
                ? "ระบบจะใช้ทั้งรูปภาพในการประมวลผล OCR"
                : "ต้องมีอย่างน้อย 1 พื้นที่ก่อนจะแปลงเฉพาะจุด"}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => setIsOcrModalOpen(false)} disabled={isImageExtracting}>
              ปิดหน้าต่าง
            </Button>
            <Button
              onClick={ocrMode === "full" ? handleExtractWholeImage : handleExtractSelectedZones}
              disabled={
                isAnalyzing ||
                isImageExtracting ||
                !selectedImageFile ||
                (ocrMode === "zones" && (!ocrImageElement || !ocrZones.length))
              }
            >
              {ocrMode === "full" ? "แปลงทั้งรูป" : `แปลงเฉพาะพื้นที่ (${ocrZones.length || 0})`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </div>
  );
};

export default Assessment;
