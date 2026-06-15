"use client";

/**
 * Capture frame from video, run face detection,
 * apply Gaussian blur over detected face region on a canvas,
 * and return the base64 JPEG data URL.
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
      const results = faceDetector.detectForVideo(video, performance.now());
      detections = results.detections || [];
    } catch (e) {
      console.error("Face detection during capture failed:", e);
    }
  }

  // 3. Apply Gaussian blur overlay over all detected faces
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

      // Save context state
      ctx.save();

      // Create oval clipping path for face
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
      ctx.clip();

      // Apply blur filter inside clip
      ctx.filter = "blur(20px)";

      // Redraw the original video frame to draw only the blurred face
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Restore clean context
      ctx.restore();
    });
  } else {
    // Fallback face blur at top center if detector missed it
    ctx.save();
    ctx.beginPath();
    const centerX = canvas.width / 2;
    const centerY = canvas.height * 0.17;
    const radiusX = canvas.width * 0.09;
    const radiusY = canvas.height * 0.08;
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    ctx.clip();
    ctx.filter = "blur(20px)";
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  // 4. Return blurred base64 JPEG
  return canvas.toDataURL("image/jpeg", 0.85);
}

// Return null to avoid rendering anything on live camera preview
export function FaceMaskCanvas(_props: any) {
  return null;
}
