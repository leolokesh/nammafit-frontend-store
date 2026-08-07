/**
 * Fast client-side MediaPipe Pose landmark validation for uploaded images.
 * Uses a singleton landmarker instance and silences C++ WASM stdout logs to prevent Next.js dev overlays.
 */
let globalPoseLandmarkerPromise: Promise<any> | null = null;

async function getGlobalImagePoseLandmarker() {
  if (globalPoseLandmarkerPromise) return globalPoseLandmarkerPromise;

  globalPoseLandmarkerPromise = (async () => {
    try {
      const { PoseLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );
      const landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
        },
        runningMode: "IMAGE",
        numPoses: 1
      });
      return landmarker;
    } catch (err) {
      console.warn("[MEDIAPIPE LANDMARKER INIT WARNING]", err);
      return null;
    }
  })();

  return globalPoseLandmarkerPromise;
}

export async function validateUploadedPhotoPose(dataUrl: string, photoLabel: string = "uploaded photo"): Promise<{ isValid: boolean; error?: string }> {
  if (!dataUrl) return { isValid: true };

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = async () => {
      try {
        const landmarker = await getGlobalImagePoseLandmarker();
        if (!landmarker) {
          resolve({ isValid: true });
          return;
        }

        // Draw image onto a standardized 512x512 canvas matching MediaPipe input tensor specs
        const canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({ isValid: true });
          return;
        }
        ctx.drawImage(img, 0, 0, 512, 512);

        let result: any = null;

        // Temporarily intercept console.error to filter out MediaPipe's C++ WASM "INFO:" startup log
        // which Next.js Dev Server mistake for a JS runtime crash and triggers the dev overlay
        const originalConsoleError = console.error;
        console.error = (...args: any[]) => {
          const msg = String(args[0] || "");
          if (msg.includes("TensorFlow") || msg.includes("XNNPACK") || msg.includes("INFO:")) {
            return; // Suppress C++ WASM info log from triggering Next.js dev overlay
          }
          originalConsoleError.apply(console, args);
        };

        try {
          result = landmarker.detect(canvas);
        } catch (e) {
          result = null;
        } finally {
          console.error = originalConsoleError;
        }

        if (result && result.landmarks && result.landmarks.length > 0 && result.landmarks[0].length >= 6) {
          resolve({ isValid: true });
        } else {
          resolve({
            isValid: false,
            error: `No human posture detected in ${photoLabel}. The image appears to contain a car, object, or non-human subject. Please select a clear photo of yourself.`
          });
        }
      } catch (err) {
        // Fallback: resolve true on any exception so user flow is not interrupted
        resolve({ isValid: true });
      }
    };
    img.onerror = () => resolve({ isValid: true });
    img.src = dataUrl;
  });
}
