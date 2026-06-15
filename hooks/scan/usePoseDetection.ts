"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export function usePoseDetection() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const poseLandmarkerRef = useRef<any>(null);
  const loadingPromiseRef = useRef<Promise<any> | null>(null);

  const initPoseDetection = useCallback(async () => {
    if (poseLandmarkerRef.current) return poseLandmarkerRef.current;
    if (loadingPromiseRef.current) return loadingPromiseRef.current;

    loadingPromiseRef.current = (async () => {
      try {
        // Dynamically import MediaPipe to ensure it only loads on client-side
        const { PoseLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
        
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );
        
        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numPoses: 1
        });
        
        poseLandmarkerRef.current = landmarker;
        setIsLoading(false);
        return landmarker;
      } catch (err: any) {
        console.error("Failed to initialize MediaPipe Pose Landmarker:", err);
        setError("Could not load pose estimation system.");
        setIsLoading(false);
        throw err;
      }
    })();

    return loadingPromiseRef.current;
  }, []);

  const detectPose = useCallback((video: HTMLVideoElement, timestamp: number) => {
    if (!poseLandmarkerRef.current) return null;
    try {
      const results = poseLandmarkerRef.current.detectForVideo(video, timestamp);
      return results;
    } catch (err) {
      console.error("Pose detection frame execution error:", err);
      return null;
    }
  }, []);

  useEffect(() => {
    initPoseDetection().catch(() => {});
    
    return () => {
      // Cleanup
      if (poseLandmarkerRef.current) {
        try {
          poseLandmarkerRef.current.close();
        } catch (e) {
          console.error("Error closing PoseLandmarker:", e);
        }
        poseLandmarkerRef.current = null;
      }
      loadingPromiseRef.current = null;
    };
  }, [initPoseDetection]);

  return {
    isLoading,
    error,
    detectPose,
  };
}
