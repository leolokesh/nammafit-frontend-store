"use client";

import React, { useEffect, useRef } from "react";

interface FaceMaskCanvasProps {
  detections: any[];
  width: number;
  height: number;
}

export function FaceMaskCanvas({ detections, width, height }: FaceMaskCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (!detections || detections.length === 0) return;

    detections.forEach((detection) => {
      const box = detection.boundingBox;
      if (!box) return;

      // Extract coordinates (supporting both absolute and normalized)
      let originX = box.originX;
      let originY = box.originY;
      let boxWidth = box.width;
      let boxHeight = box.height;

      // Detect if coordinates are normalized
      if (originX >= 0 && originX <= 1 && boxWidth >= 0 && boxWidth <= 1) {
        originX = originX * width;
        originY = originY * height;
        boxWidth = boxWidth * width;
        boxHeight = boxHeight * height;
      }

      // Draw solid black oval to hide identity in preview
      const centerX = originX + boxWidth / 2;
      const centerY = originY + boxHeight / 2;
      
      // Scale up the oval slightly to cover hair, chin, and ears
      const radiusX = (boxWidth / 2) * 1.35;
      const radiusY = (boxHeight / 2) * 1.5;

      ctx.fillStyle = "#020617"; // Dark background color
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
      ctx.fill();

      // Add a subtle border glow
      ctx.strokeStyle = "rgba(176,228,204,0.3)";
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }, [detections, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 w-full h-full z-15 pointer-events-none"
    />
  );
}

/**
 * Capture frame from video, run face detection (using the active face detector instance),
 * apply solid black oval face mask over face, and return masked base64 JPEG data URL.
 */
export async function captureAndMaskFace(
  video: HTMLVideoElement,
  faceDetector: any
): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not initialize 2D canvas context");

  // 1. Draw current video frame to canvas
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // 2. Detect face in canvas frame
  let detections: any[] = [];
  if (faceDetector) {
    try {
      const results = faceDetector.detectForVideo(canvas, performance.now());
      detections = results.detections || [];
    } catch (e) {
      console.error("Face detection during capture failed:", e);
    }
  }

  // 3. Draw black oval over all detected faces
  if (detections.length > 0) {
    detections.forEach((detection) => {
      const box = detection.boundingBox;
      if (!box) return;

      let originX = box.originX;
      let originY = box.originY;
      let boxWidth = box.width;
      let boxHeight = box.height;

      // Handle normalized coords if returned
      if (originX >= 0 && originX <= 1 && boxWidth >= 0 && boxWidth <= 1) {
        originX = originX * canvas.width;
        originY = originY * canvas.height;
        boxWidth = boxWidth * canvas.width;
        boxHeight = boxHeight * canvas.height;
      }

      const centerX = originX + boxWidth / 2;
      const centerY = originY + boxHeight / 2;
      const radiusX = (boxWidth / 2) * 1.35;
      const radiusY = (boxHeight / 2) * 1.5;

      ctx.fillStyle = "#000000"; // Absolute black for the file output
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
      ctx.fill();
    });
  } else {
    // If MediaPipe didn't run or missed the face, apply a fallback mask at the top-center
    // of where a head outline normally is positioned in our guide overlay
    const centerX = canvas.width / 2;
    const centerY = canvas.height * 0.17; // Approx head height in frame
    const radiusX = canvas.width * 0.09;  // Scaled oval width
    const radiusY = canvas.height * 0.08; // Scaled oval height

    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    ctx.fill();
  }

  // 4. Return masked base64 JPEG
  return canvas.toDataURL("image/jpeg", 0.85);
}
