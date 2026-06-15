"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { Camera, RefreshCw, Loader2, AlertTriangle, ArrowLeft } from "lucide-react";
import { useCamera } from "@/hooks/scan/useCamera";
import { usePoseDetection } from "@/hooks/scan/usePoseDetection";
import { useFaceDetection } from "@/hooks/scan/useFaceDetection";
import { PoseValidator, ValidationResult } from "./PoseValidator";
import { CameraOverlay } from "./CameraOverlay";
import { FaceMaskCanvas, captureAndMaskFace } from "./FaceMaskCanvas";

interface CameraViewProps {
  type: "front" | "side";
  onCapture: (imageSrc: string, landmarks: any) => void;
  onCancel: () => void;
}

export function CameraView({ type, onCapture, onCancel }: CameraViewProps) {
  const camera = useCamera();
  const poseEngine = usePoseDetection();
  const faceEngine = useFaceDetection();
  
  const [faceDetections, setFaceDetections] = useState<any[]>([]);
  const [validation, setValidation] = useState<ValidationResult>({ isValid: false, issues: ["Initializing pose detection..."] });
  const [isCapturing, setIsCapturing] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(-1);
  const latestLandmarksRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep track of dimensions for canvas overlay sizing
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Frame processing loop
  const processFrame = useCallback(() => {
    const webcam = camera.webcamRef.current;
    if (webcam && webcam.video && webcam.video.readyState === 4) {
      const video = webcam.video;
      const currentTime = video.currentTime;
      
      // Only process when a new video frame is rendered
      if (currentTime !== lastTimeRef.current) {
        lastTimeRef.current = currentTime;
        const timestamp = performance.now();

        // 1. Detect Pose
        const poseResult = poseEngine.detectPose(video, timestamp);
        let poseLandmarks: any[] = [];
        if (poseResult && poseResult.landmarks && poseResult.landmarks.length > 0) {
          poseLandmarks = poseResult.landmarks[0];
        }
        latestLandmarksRef.current = poseLandmarks;

        // 2. Validate Pose
        const validationResult = type === "front"
          ? PoseValidator.validateFrontPose(poseLandmarks)
          : PoseValidator.validateSidePose(poseLandmarks);

        // 3. Detect Face for live privacy mask overlay
        const faceResult = faceEngine.detectFace(video, timestamp);
        const detections = faceResult ? (faceResult.detections || []) : [];

        // 4. Update states
        setFaceDetections(detections);
        setValidation(validationResult);
      }
    }
    requestRef.current = requestAnimationFrame(processFrame);
  }, [camera.webcamRef, poseEngine, faceEngine, type]);

  // Start frame loop once models are ready
  useEffect(() => {
    if (!poseEngine.isLoading && !faceEngine.isLoading && camera.hasPermission) {
      requestRef.current = requestAnimationFrame(processFrame);
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [poseEngine.isLoading, faceEngine.isLoading, camera.hasPermission, processFrame]);

  // Click handler to run capture with face masking applied in memory
  const handleCapture = async () => {
    const webcam = camera.webcamRef.current;
    if (!webcam || !webcam.video) return;
    
    setIsCapturing(true);
    try {
      // Access direct face detector vision tasks instance from hook
      const rawDetectorPromise = faceEngine.detectFace;
      // Get the hidden face detector ref inside faceEngine
      // We can use the helper we created in FaceMaskCanvas which handles local canvas detection
      // We'll pass the video element. It handles detection fallbacks internally as well
      const maskedBase64 = await captureAndMaskFace(webcam.video, (faceEngine as any).faceDetectorRef?.current);
      
      onCapture(maskedBase64, latestLandmarksRef.current);
    } catch (e) {
      console.error("Capture failed:", e);
    } finally {
      setIsCapturing(false);
    }
  };

  const isModelLoading = poseEngine.isLoading || faceEngine.isLoading;

  return (
    <div className="flex flex-col h-[75vh] min-h-[500px] max-h-[640px] text-slate-100 select-none">
      {/* Header action bar */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <button
          onClick={onCancel}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors py-1 cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Exit Scan</span>
        </button>
        <div className="flex items-center gap-3">
          {camera.devices.length > 1 && (
            <button
              onClick={camera.toggleFacingMode}
              className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs"
              title="Switch Camera"
            >
              <RefreshCw size={13} />
              <span className="hidden sm:inline">Switch Camera</span>
            </button>
          )}
        </div>
      </div>

      {/* Main camera window wrapper */}
      <div className="flex-1 relative bg-slate-950/80 rounded-3xl overflow-hidden mt-4 border border-white/5 flex items-center justify-center min-h-0" ref={containerRef}>
        
        {/* Webcam stream */}
        {camera.hasPermission ? (
          <Webcam
            audio={false}
            ref={camera.webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              facingMode: camera.facingMode,
              width: { ideal: 640 },
              height: { ideal: 480 },
            }}
            onUserMedia={camera.handleUserMedia}
            onUserMediaError={camera.handleUserMediaError}
            className="w-full h-full object-cover pointer-events-none"
          />
        ) : null}

        {/* Real-time solid face privacy mask canvas */}
        {camera.hasPermission && !isModelLoading && (
          <FaceMaskCanvas
            detections={faceDetections}
            width={dimensions.width}
            height={dimensions.height}
          />
        )}

        {/* SVG outline overlay guide */}
        {camera.hasPermission && !isModelLoading && (
          <CameraOverlay type={type} />
        )}

        {/* Permission Denied/Error Screen */}
        {camera.error && (
          <div className="absolute inset-0 bg-slate-950 p-8 flex flex-col items-center justify-center text-center gap-4 z-40">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
              <AlertTriangle size={24} />
            </div>
            <h4 className="font-semibold text-slate-200 text-sm">Camera Connection Required</h4>
            <p className="text-xs text-slate-500 max-w-[260px] leading-relaxed">
              We need access to your camera to capture body outlines. Please enable camera permissions.
            </p>
            <button
              onClick={camera.requestPermission}
              className="px-4 py-2 rounded-xl bg-[#285A48] hover:bg-[#408a71] text-xs font-bold transition-all cursor-pointer"
            >
              Grant Permission
            </button>
          </div>
        )}

        {/* Loading Spinner for Models */}
        {(isModelLoading || camera.hasPermission === null) && !camera.error && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-40 text-center px-6">
            <Loader2 className="w-8 h-8 animate-spin text-[#B0E4CC]" />
            <h4 className="text-xs font-medium text-slate-300">Initializing Vision Engine...</h4>
            <p className="text-[10px] text-slate-500 max-w-[200px] leading-snug">
              Downloading face privacy and pose estimation models from MediaPipe CDN
            </p>
          </div>
        )}
      </div>

      {/* Footer validation status & capture trigger */}
      <div className="pt-4 flex flex-col items-center gap-3">
        {/* Real-time pose validation feedback */}
        {!isModelLoading && camera.hasPermission && (
          <div className="h-8 flex items-center justify-center text-center">
            {validation.isValid ? (
              <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 animate-bounce">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                ✓ Ready to Capture
              </div>
            ) : (
              <div className="px-3 py-1 rounded-full bg-slate-900/60 border border-white/5 text-[10px] text-slate-400 font-medium">
                {validation.issues[0]}
              </div>
            )}
          </div>
        )}

        {/* Circular Capture button */}
        <button
          onClick={handleCapture}
          disabled={!validation.isValid || isCapturing || isModelLoading}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg border transition-all duration-300 cursor-pointer ${
            validation.isValid && !isCapturing && !isModelLoading
              ? "bg-[#B0E4CC] border-white text-slate-950 scale-100 hover:scale-105 active:scale-95 shadow-[#B0E4CC]/20"
              : "bg-slate-900/40 border-white/5 text-slate-700 cursor-not-allowed scale-90"
          }`}
          title="Capture Image"
        >
          {isCapturing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Camera className="w-6 h-6" />
          )}
        </button>
      </div>
    </div>
  );
}
