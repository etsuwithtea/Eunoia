import { getDocument, GlobalWorkerOptions, type TextItem } from "pdfjs-dist";
import Tesseract from "tesseract.js";

import pdfWorker from "pdfjs-dist/build/pdf.worker?url";

GlobalWorkerOptions.workerSrc = pdfWorker;

export type ExtractionProgress = {
  status: string;
  progress: number;
};

export type NormalizedOcrZone = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ProgressHandler = (data: ExtractionProgress) => void;

const clampPercentage = (value: number) => Math.min(Math.max(value, 0), 100);

const normalizeZone = (zone: NormalizedOcrZone): NormalizedOcrZone => {
  const x = clampPercentage(zone.x);
  const y = clampPercentage(zone.y);
  const width = clampPercentage(zone.width);
  const height = clampPercentage(zone.height);

  return {
    x,
    y,
    width: Math.min(width, 100 - x),
    height: Math.min(height, 100 - y),
  };
};

export const extractTextFromPdf = async (
  file: File,
  onProgress?: ProgressHandler,
): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;

  const pageTexts: string[] = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    const pageText = textContent.items
      .map((item) => {
        if ("str" in item) {
          return (item as TextItem).str;
        }
        return "";
      })
      .join(" ");

    pageTexts.push(pageText.trim());

    if (onProgress) {
      onProgress({
        status: `กำลังอ่านข้อความจากหน้า ${pageNum}/${pdf.numPages}`,
        progress: Math.round((pageNum / pdf.numPages) * 100),
      });
    }
  }

  return pageTexts.join("\n\n").trim();
};

export const extractTextFromImage = async (
  file: File,
  onProgress?: ProgressHandler,
): Promise<string> => {
  const { data } = await Tesseract.recognize(file, "tha+eng", {
    logger: (message) => {
      if (onProgress && message.status && typeof message.progress === "number") {
        onProgress({
          status: message.status,
          progress: Math.round(message.progress * 100),
        });
      }
    },
  });

  return data.text.trim();
};

export const extractTextFromImageZone = async (
  image: HTMLImageElement,
  zone: NormalizedOcrZone,
  onProgress?: ProgressHandler,
): Promise<string> => {
  const normalizedZone = normalizeZone(zone);
  const { naturalWidth, naturalHeight } = image;

  if (!naturalWidth || !naturalHeight) {
    throw new Error("รูปภาพยังโหลดไม่เสร็จ");
  }

  const startXPx = Math.round((normalizedZone.x / 100) * naturalWidth);
  const startYPx = Math.round((normalizedZone.y / 100) * naturalHeight);

  const selectionWidthPx = Math.max(1, Math.round((normalizedZone.width / 100) * naturalWidth));
  const selectionHeightPx = Math.max(1, Math.round((normalizedZone.height / 100) * naturalHeight));
  const availableWidth = Math.max(1, naturalWidth - startXPx);
  const availableHeight = Math.max(1, naturalHeight - startYPx);
  const outputWidth = Math.min(selectionWidthPx, availableWidth);
  const outputHeight = Math.min(selectionHeightPx, availableHeight);

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    return "";
  }

  context.drawImage(
    image,
    startXPx,
    startYPx,
    outputWidth,
    outputHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  const { data } = await Tesseract.recognize(canvas, "tha+eng", {
    logger: (message) => {
      if (onProgress && message.status && typeof message.progress === "number") {
        onProgress({
          status: message.status,
          progress: Math.round(message.progress * 100),
        });
      }
    },
  });

  return data.text.trim();
};
