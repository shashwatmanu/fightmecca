'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { getPoseLandmarker, PoseLandmarkerResult } from '@/lib/motion/pose-landmarker';
import { convertMediaPipeToCanonicalLandmarks, RawMediaPipeLandmark, MEDIAPIPE_LANDMARKS } from '@/lib/motion/mediapipe-adapter';
import { Landmark } from '@/types/motion';
import { calculateFpsFromWindow } from '@/lib/motion/quality';

interface WebcamCanvasOverlayProps {
  isActive: boolean; // Camera active flag
  isMirrored?: boolean;
  onPoseFrame: (landmarks: Landmark[], timestampMs: number, fps: number) => void;
  onEngineReady?: (isReady: boolean) => void;
  onError: (errorMsg: string) => void;
  onStartCamera?: () => void;
}

// MediaPipe pose connections for rendering skeleton overlay
const SKELETON_CONNECTIONS: Array<[number, number]> = [
  // Torso & Shoulders
  [MEDIAPIPE_LANDMARKS.LEFT_SHOULDER, MEDIAPIPE_LANDMARKS.RIGHT_SHOULDER],
  [MEDIAPIPE_LANDMARKS.LEFT_SHOULDER, MEDIAPIPE_LANDMARKS.LEFT_HIP],
  [MEDIAPIPE_LANDMARKS.RIGHT_SHOULDER, MEDIAPIPE_LANDMARKS.RIGHT_HIP],
  [MEDIAPIPE_LANDMARKS.LEFT_HIP, MEDIAPIPE_LANDMARKS.RIGHT_HIP],
  // Left Arm
  [MEDIAPIPE_LANDMARKS.LEFT_SHOULDER, MEDIAPIPE_LANDMARKS.LEFT_ELBOW],
  [MEDIAPIPE_LANDMARKS.LEFT_ELBOW, MEDIAPIPE_LANDMARKS.LEFT_WRIST],
  // Right Arm
  [MEDIAPIPE_LANDMARKS.RIGHT_SHOULDER, MEDIAPIPE_LANDMARKS.RIGHT_ELBOW],
  [MEDIAPIPE_LANDMARKS.RIGHT_ELBOW, MEDIAPIPE_LANDMARKS.RIGHT_WRIST],
  // Left Leg
  [MEDIAPIPE_LANDMARKS.LEFT_HIP, MEDIAPIPE_LANDMARKS.LEFT_KNEE],
  [MEDIAPIPE_LANDMARKS.LEFT_KNEE, MEDIAPIPE_LANDMARKS.LEFT_ANKLE],
  // Right Leg
  [MEDIAPIPE_LANDMARKS.RIGHT_HIP, MEDIAPIPE_LANDMARKS.RIGHT_KNEE],
  [MEDIAPIPE_LANDMARKS.RIGHT_KNEE, MEDIAPIPE_LANDMARKS.RIGHT_ANKLE],
];

export function WebcamCanvasOverlay({
  isActive,
  isMirrored = true,
  onPoseFrame,
  onEngineReady,
  onError,
  onStartCamera,
}: WebcamCanvasOverlayProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const activeGenIdRef = useRef<number>(0); // Generation ID for race-condition prevention
  const lastVideoTimeRef = useRef<number>(-1);
  const processedFrameCountRef = useRef<number>(0);
  const measurementWindowStartMsRef = useRef<number>(0);
  const currentMeasuredFpsRef = useRef<number>(0.0);

  // Store callback references in refs to break React state-feedback loops completely
  const onPoseFrameRef = useRef(onPoseFrame);
  const onEngineReadyRef = useRef(onEngineReady);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onPoseFrameRef.current = onPoseFrame;
  }, [onPoseFrame]);

  useEffect(() => {
    onEngineReadyRef.current = onEngineReady;
  }, [onEngineReady]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isLoadingModel, setIsLoadingModel] = useState<boolean>(false);

  // Enumerate video devices
  const refreshDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices.filter((d) => d.kind === 'videoinput');
      setDevices(videoInputs);
      if (videoInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
    } catch (e) {
      console.warn('Device enumeration error:', e);
    }
  }, [selectedDeviceId]);

  // Clear canvas rendering
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  // Draw skeleton overlay on canvas
  const drawSkeleton = useCallback((landmarks: Landmark[], width: number, height: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.clearRect(0, 0, width, height);
    if (!landmarks || landmarks.length === 0) return;

    const lmMap = new Map(landmarks.map((l) => [l.landmark_id, l]));

    // Draw connection lines
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#2ecc71'; // Green accent line

    for (const [startId, endId] of SKELETON_CONNECTIONS) {
      const p1 = lmMap.get(startId);
      const p2 = lmMap.get(endId);

      if (p1 && p2 && p1.confidence > 0.3 && p2.confidence > 0.3) {
        ctx.beginPath();
        ctx.moveTo(p1.x * width, p1.y * height);
        ctx.lineTo(p2.x * width, p2.y * height);
        ctx.stroke();
      }
    }

    // Draw joint dots
    for (const lm of landmarks) {
      if (lm.confidence < 0.3) continue;

      ctx.beginPath();
      ctx.arc(lm.x * width, lm.y * height, 5, 0, 2 * Math.PI);
      ctx.fillStyle = lm.confidence >= 0.6 ? '#2ecc71' : '#f39c12';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    }
  }, []);

  // Stop camera tracks cleanly & reset state atomically
  const stopCameraStream = useCallback(() => {
    activeGenIdRef.current++; // Invalidate any pending async getUserMedia calls
    processedFrameCountRef.current = 0;
    measurementWindowStartMsRef.current = 0;
    currentMeasuredFpsRef.current = 0.0;

    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
      try {
        videoRef.current.load();
      } catch (e) {
        // Ignore load interruption
      }
    }

    clearCanvas();

    if (onEngineReadyRef.current) {
      onEngineReadyRef.current(false);
    }
    if (onPoseFrameRef.current) {
      onPoseFrameRef.current([], performance.now(), 0);
    }
  }, [clearCanvas]);

  // Combined Camera Lifecycle & Pose Inference Loop
  useEffect(() => {
    if (!isActive) {
      stopCameraStream();
      setIsLoadingModel(false);
      return;
    }

    let isCancelled = false;
    const currentGen = ++activeGenIdRef.current;

    async function initCameraAndInference() {
      setIsLoadingModel(true);

      try {
        const isMobileScreen = typeof window !== 'undefined' && window.innerWidth < 768;
        const constraints: MediaStreamConstraints = {
          video: selectedDeviceId 
            ? { deviceId: { exact: selectedDeviceId } } 
            : isMobileScreen
            ? { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 1280 } }
            : { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        };

        // 1. Acquire MediaStream
        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        // Check if cancelled during getUserMedia await
        if (isCancelled || activeGenIdRef.current !== currentGen) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        // 2. Attach stream to video element
        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          // Wait until video metadata is loaded before attempting play()
          await new Promise<void>((resolve) => {
            if (!videoRef.current) return resolve();
            if (videoRef.current.readyState >= 1) {
              resolve();
            } else {
              const handleMetadata = () => {
                if (videoRef.current) videoRef.current.onloadedmetadata = null;
                resolve();
              };
              videoRef.current.onloadedmetadata = handleMetadata;
            }
          });

          if (isCancelled || activeGenIdRef.current !== currentGen) {
            stream.getTracks().forEach((t) => t.stop());
            if (videoRef.current) videoRef.current.srcObject = null;
            return;
          }

          // Safely attempt play()
          try {
            await videoRef.current.play();
          } catch (playErr: any) {
            if (playErr.name !== 'AbortError') {
              console.warn('Video play interrupted:', playErr);
            }
          }
        }

        await refreshDevices();

        // 3. Initialize PoseLandmarker singleton
        const landmarker = await getPoseLandmarker();

        if (isCancelled || activeGenIdRef.current !== currentGen) {
          return;
        }

        // Signal engine readiness to parent component
        if (onEngineReadyRef.current) {
          onEngineReadyRef.current(true);
        }

        // 4. Start requestAnimationFrame Loop
        function detectionLoop() {
          if (isCancelled || activeGenIdRef.current !== currentGen || !videoRef.current) {
            return;
          }

          const video = videoRef.current;

          if (video.readyState >= 2 && !video.paused && video.currentTime !== lastVideoTimeRef.current) {
            lastVideoTimeRef.current = video.currentTime;
            const now = performance.now();

            if (measurementWindowStartMsRef.current === 0) {
              measurementWindowStartMsRef.current = now;
            }

            processedFrameCountRef.current += 1;
            const elapsedMs = now - measurementWindowStartMsRef.current;

            if (elapsedMs >= 1000) {
              const calculatedFps = calculateFpsFromWindow(processedFrameCountRef.current, elapsedMs);
              currentMeasuredFpsRef.current = calculatedFps;
              console.log("[FPS-DIAG]", {
                processedFrameCount: processedFrameCountRef.current,
                measurementWindowStartMs: measurementWindowStartMsRef.current,
                now,
                elapsedMs: now - measurementWindowStartMsRef.current,
                calculatedFps,
              });
              processedFrameCountRef.current = 0;
              measurementWindowStartMsRef.current = now;
            }

            const currentFps = currentMeasuredFpsRef.current;

            try {
              const results: PoseLandmarkerResult = landmarker.detectForVideo(video, now);

              if (results && results.landmarks && results.landmarks.length > 0) {
                const rawLms = results.landmarks[0] as RawMediaPipeLandmark[];
                const canonicalLms = convertMediaPipeToCanonicalLandmarks(rawLms);

                drawSkeleton(canonicalLms, video.videoWidth || 640, video.videoHeight || 480);
                if (onPoseFrameRef.current) {
                  onPoseFrameRef.current(canonicalLms, now, currentFps);
                }
              } else {
                drawSkeleton([], video.videoWidth || 640, video.videoHeight || 480);
                if (onPoseFrameRef.current) {
                  onPoseFrameRef.current([], now, currentFps);
                }
              }
            } catch (e) {
              console.warn('Pose detection error in loop:', e);
            }
          }

          if (isActive && !isCancelled && activeGenIdRef.current === currentGen) {
            animFrameIdRef.current = requestAnimationFrame(detectionLoop);
          }
        }

        animFrameIdRef.current = requestAnimationFrame(detectionLoop);
      } catch (err: any) {
        if (isCancelled || activeGenIdRef.current !== currentGen) return;

        stopCameraStream();

        if (onErrorRef.current) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            onErrorRef.current('Camera permission denied. Please allow camera access in your browser settings.');
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            onErrorRef.current('No camera device found on this system.');
          } else {
            onErrorRef.current(`Camera initialization error: ${err.message || 'Unable to access camera'}`);
          }
        }
      } finally {
        if (!isCancelled && activeGenIdRef.current === currentGen) {
          setIsLoadingModel(false);
        }
      }
    }

    initCameraAndInference();

    return () => {
      isCancelled = true;
      stopCameraStream();
    };
  }, [isActive, selectedDeviceId, stopCameraStream, drawSkeleton, refreshDevices]);

  return (
    <div className="flex flex-col items-center space-y-3 w-full">
      {/* Device Selector Header */}
      {devices.length > 1 && (
        <div className="w-full flex items-center justify-between text-xs text-[var(--fm-text-secondary)] mb-1">
          <label htmlFor="camera-select" className="font-medium">Camera Source:</label>
          <select
            id="camera-select"
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            disabled={!isActive}
            className="bg-[var(--fm-bg-secondary)] border border-[var(--fm-border)] rounded px-2 py-1 text-xs text-[var(--fm-text-primary)]"
          >
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Camera ${d.deviceId.slice(0, 5)}...`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Video Viewport Container: Portrait on Mobile, Landscape on Desktop */}
      <div className="relative w-full aspect-[3/4] sm:aspect-video bg-[var(--fm-bg-secondary)] rounded-2xl overflow-hidden border border-[var(--fm-border)] flex items-center justify-center">
        {/* Loading Overlay */}
        {isLoadingModel && (
          <div className="absolute inset-0 bg-black/60 z-20 flex flex-col items-center justify-center gap-2">
            <span className="w-6 h-6 border-2 border-t-[var(--fm-accent-primary)] border-r-transparent rounded-full animate-spin"></span>
            <span className="text-xs text-[var(--fm-text-secondary)]">Initializing Camera & Pose Engine...</span>
          </div>
        )}

        {/* Video Element */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''}`}
        />

        {/* Canvas Overlay for Pose Skeleton */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full object-cover pointer-events-none ${isMirrored ? 'scale-x-[-1]' : ''}`}
        />

        {/* Camera Off Placeholder State */}
        {!isActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-[var(--fm-text-secondary)] bg-[var(--fm-bg-secondary)] z-10">
            <div className="w-16 h-16 rounded-full bg-[var(--fm-bg-card)] flex items-center justify-center text-2xl mb-3 border border-[var(--fm-border)] shadow">
              📷
            </div>
            <p className="font-semibold text-base text-[var(--fm-text-primary)]">Camera is off</p>
            <p className="text-xs mt-1 max-w-xs text-gray-400 mb-4">Click "Start Camera" below to grant camera access and initialize real-time pose tracking.</p>
            {onStartCamera && (
              <button
                onClick={onStartCamera}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-lg transition flex items-center gap-2"
              >
                <span>📷</span> START CAMERA
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
