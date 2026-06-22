"use client";

/**
 * Capture frame from video, run face detection,
 * apply Gaussian blur over detected face region on a canvas,
 * and return the base64 JPEG data URL.
 */
export async function captureAndMaskFace(
  video: HTMLVideoElement,
  faceDetector: any,
  poseLandmarks?: any[]
): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not initialize 2D canvas context");

  // 1. Draw current video frame to canvas
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  let masked = false;

  // 2. Try drawing solid black oval using pose landmarks (primary & highly robust)
  if (poseLandmarks && poseLandmarks.length > 0) {
    // MediaPipe pose face landmarks are indices 0 to 10
    const facePoints = poseLandmarks.slice(0, 11).filter(pt => pt && (pt.visibility === undefined || pt.visibility > 0.15));
    if (facePoints.length > 0) {
      const xs = facePoints.map(p => p.x);
      const ys = facePoints.map(p => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      let boxW = maxX - minX;
      let boxH = maxY - minY;

      // Enforce minimum box dimensions to ensure head is covered fully
      if (boxW < 0.05) boxW = 0.05;
      if (boxH < 0.05) boxH = 0.05;

      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;

      // Make sure the width radius is proportional to the height radius to cover side-profile turns properly
      const rY = boxH * 1.6 * canvas.height;
      const rX = Math.max(boxW * 1.6 * canvas.width, rY * 0.9);

      const centerX = cx * canvas.width;
      // Shift center slightly upwards to cover forehead/hair
      const centerY = (cy - boxH * 0.15) * canvas.height;

      ctx.fillStyle = "#000000"; // Absolute black for the file output
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, rX, rY, 0, 0, 2 * Math.PI);
      ctx.fill();

      masked = true;
    }
  }

  // 3. Fallback: Detect face in canvas frame using face detector
  if (!masked) {
    let detections: any[] = [];
    if (faceDetector) {
      try {
        const results = faceDetector.detectForVideo(video, performance.now());
        detections = results.detections || [];
      } catch (e) {
        console.error("Face detection during capture failed:", e);
      }
    }

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
      masked = true;
    }
  }

  // 4. Ultimate fallback: draw a black oval at top center if face detector and pose landmarks failed
  if (!masked) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height * 0.22; // Adjusted lower down from 0.17 to be more centered on face
    const radiusX = canvas.width * 0.10;  // Slightly larger fallback width
    const radiusY = canvas.height * 0.09; // Slightly larger fallback height

    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    ctx.fill();
  }

  // 5. Return masked base64 JPEG
  return canvas.toDataURL("image/jpeg", 0.85);
}

// Return null to avoid rendering anything on live camera preview
export function FaceMaskCanvas(_props: any) {
  return null;
}
