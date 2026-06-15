"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export function useFaceDetection() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const faceDetectorRef = useRef<any>(null);
  const loadingPromiseRef = useRef<Promise<any> | null>(null);

  const initFaceDetection = useCallback(async () => {
    if (faceDetectorRef.current) return faceDetectorRef.current;
    if (loadingPromiseRef.current) return loadingPromiseRef.current;

    loadingPromiseRef.current = (async () => {
      try {
        // Dynamically import MediaPipe to ensure it only loads on client-side
        const { FaceDetector, FilesetResolver } = await import("@mediapipe/tasks-vision");
        
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );
        
        const detector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
            delegate: "GPU"
          },
          runningMode: "VIDEO"
        });
        
        faceDetectorRef.current = detector;
        setIsLoading(false);
        return detector;
      } catch (err: any) {
        console.error("Failed to initialize MediaPipe Face Detector:", err);
        setError("Could not load face privacy protection system.");
        setIsLoading(false);
        throw err;
      }
    })();

    return loadingPromiseRef.current;
  }, []);

  const detectFace = useCallback((video: HTMLVideoElement, timestamp: number) => {
    if (!faceDetectorRef.current) return null;
    try {
      const results = faceDetectorRef.current.detectForVideo(video, timestamp);
      return results;
    } catch (err) {
      console.error("Face detection frame execution error:", err);
      return null;
    }
  }, []);

  useEffect(() => {
    initFaceDetection().catch(() => {});
    
    return () => {
      // Cleanup
      if (faceDetectorRef.current) {
        try {
          faceDetectorRef.current.close();
        } catch (e) {
          console.error("Error closing FaceDetector:", e);
        }
        faceDetectorRef.current = null;
      }
      loadingPromiseRef.current = null;
    };
  }, [initFaceDetection]);

  return {
    isLoading,
    error,
    detectFace,
  };
}
