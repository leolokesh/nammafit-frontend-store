"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export function useCamera() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string | undefined>(undefined);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [error, setError] = useState<string | null>(null);
  
  const webcamRef = useRef<any>(null);

  // Check and list video devices
  const updateDevices = useCallback(async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(d => d.kind === "videoinput");
      setDevices(videoDevices);
      
      // Select best default device (e.g. back camera if on mobile)
      if (videoDevices.length > 0 && !activeDeviceId) {
        // Find environment camera if possible
        const backCamera = videoDevices.find(d => 
          d.label.toLowerCase().includes("back") || 
          d.label.toLowerCase().includes("rear") || 
          d.label.toLowerCase().includes("environment")
        );
        if (backCamera) {
          setActiveDeviceId(backCamera.deviceId);
          setFacingMode("environment");
        } else {
          setActiveDeviceId(videoDevices[0].deviceId);
          setFacingMode("user");
        }
      }
    } catch (err) {
      console.error("Error enumerating devices:", err);
    }
  }, [activeDeviceId]);

  // Request camera permission
  const requestPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode === "environment" ? { ideal: "environment" } : "user" }
      });
      setHasPermission(true);
      setError(null);
      
      // Clean up temporary permission stream
      stream.getTracks().forEach(t => t.stop());
      
      await updateDevices();
    } catch (err: any) {
      console.error("Camera permission denied or error:", err);
      setHasPermission(false);
      setError(err?.message || "Could not access camera. Please enable permissions.");
    }
  }, [facingMode, updateDevices]);

  // Handle stream startup
  const handleUserMedia = useCallback(() => {
    setHasPermission(true);
    setError(null);
    updateDevices();
  }, [updateDevices]);

  // Handle stream error
  const handleUserMediaError = useCallback((err: any) => {
    console.error("Webcam error callback:", err);
    setHasPermission(false);
    setError("Failed to initialize camera. Make sure no other apps are using it.");
  }, []);

  // Switch facing mode
  const toggleFacingMode = useCallback(() => {
    setFacingMode(prev => (prev === "user" ? "environment" : "user"));
    setActiveDeviceId(undefined); // Reset active device to let browser select ideal face
  }, []);

  // Initialize permission check
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.mediaDevices) {
      setError("Camera API is not supported in this browser.");
      setHasPermission(false);
      return;
    }
    
    // Attempt permission request immediately
    requestPermission();
  }, [requestPermission]);

  return {
    webcamRef,
    hasPermission,
    devices,
    activeDeviceId,
    facingMode,
    error,
    toggleFacingMode,
    requestPermission,
    handleUserMedia,
    handleUserMediaError,
  };
}
