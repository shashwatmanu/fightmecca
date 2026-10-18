'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUiStore } from '@/stores/uiStore';
import { WebcamCanvasOverlay } from '@/components/capture/WebcamCanvasOverlay';
import { CaptureQualityPanel } from '@/components/capture/CaptureQualityPanel';
import { PostCaptureSummary } from '@/components/capture/PostCaptureSummary';
import { GuidedCalibrationPanel } from '@/components/capture/GuidedCalibrationPanel';
import { AnthropometryDrawer } from '@/components/capture/AnthropometryDrawer';
import { CaptureState } from '@/lib/motion/state-machine';
import { Landmark, MotionFrame, MotionSession, CaptureMode } from '@/types/motion';
import { createMotionFrame, buildMotionSession } from '@/lib/motion/frame-builder';
import { checkFullBodyVisibility, calculateFrameConfidence, CaptureQualityMetrics } from '@/lib/motion/quality';
import { evaluateSingleCameraCalibration, CalibrationEvaluation } from '@/lib/motion/calibration';
import { createDefaultProfile, estimateProportionsFromPose, AnthropometricProfile } from '@/lib/motion/anthropometry';
import { buildMotionTemplate, MotionTemplate } from '@/lib/motion/template';
import { Reference, loadActiveReference, setActiveReferenceId, createReferenceFromTemplate, mapDbRecordToReference } from '@/lib/motion/reference';
import { compareMotionTemplates, ReferenceComparisonResult } from '@/lib/motion/comparison-engine';
import { evaluateTechniqueJudgement } from '@/lib/motion/judgement-engine';
import { TechniqueViewport3D } from '@/components/capture/TechniqueViewport3D';
import { AvatarReplayViewport } from '@/components/capture/AvatarReplayViewport';
import { SynchronizedAvatarComparisonViewport } from '@/components/capture/SynchronizedAvatarComparisonViewport';
import { referenceApi, trainingApi } from '@/lib/api-client';

const SEEDED_TECHNIQUES = [
  { id: '00000000-0000-0000-0000-000000000002', name: 'Cross', discipline: 'Boxing' },
];

import { AppShell } from '@/components/layout/AppShell';

export default function TechniqueTrainPage() {
  const setPageTitle = useUiStore((state) => state.setPageTitle);

  // Feature Flag: Anatomical 3D GLB retargeting isolated for Prompt 5 baseline recovery
  const ANATOMICAL_AVATAR_ENABLED = false;

  // Technique & Reference Config
  const [selectedTechniqueId] = useState<string>(SEEDED_TECHNIQUES[0].id);
  const [captureState, setCaptureState] = useState<CaptureState>('IDLE');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isEngineReady, setIsEngineReady] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [show3dViewport, setShow3dViewport] = useState<boolean>(false);
  const [showSyncComparisonModal, setShowSyncComparisonModal] = useState<boolean>(false);
  const [showReferenceReplayModal, setShowReferenceReplayModal] = useState<boolean>(false);

  // Durable References State
  const [savedReferences, setSavedReferences] = useState<Reference[]>([]);
  const [activeRef, setActiveRefState] = useState<Reference | null>(null);
  const [recordingMode, setRecordingMode] = useState<'REFERENCE' | 'ATTEMPT'>('ATTEMPT');

  // Live Frame & Calibration Metrics
  const [metrics, setMetrics] = useState<CaptureQualityMetrics>({
    personDetected: false,
    fullBodyVisible: false,
    landmarkConfidence: 0,
    fps: 0,
    recordedFrameCount: 0,
    usableFrameCount: 0,
  });

  const [calibration, setCalibration] = useState<CalibrationEvaluation>({
    status: 'NOT_STARTED',
    confidence: 0.0,
    personDetected: false,
    fullBodyVisible: false,
    guidanceMessage: 'Step into camera view',
    boundingBox: null,
    subjectCenter: null,
    subjectScale: 0.0,
    shoulderOrientationDeg: 0,
    hipOrientationDeg: 0,
  });

  // Athlete Anthropometry Profile
  const [anthropometryProfile, setAnthropometryProfile] = useState<AnthropometricProfile>(() =>
    createDefaultProfile('00000000-0000-0000-0000-000000000001')
  );

  // Recording Buffers & Timestamps
  const framesBufferRef = useRef<MotionFrame[]>([]);
  const frameIndexRef = useRef<number>(0);
  const recordingStartTimeRef = useRef<number>(0);
  const startedAtIsoRef = useRef<string>('');
  const [recordingDurationMs, setRecordingDurationMs] = useState<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMetricsUpdateRef = useRef<number>(0);

  // Completed Results
  const [completedSession, setCompletedSession] = useState<MotionSession | null>(null);
  const [completedTemplate, setCompletedTemplate] = useState<MotionTemplate | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ReferenceComparisonResult | null>(null);
  const [persistedToBackend, setPersistedToBackend] = useState<boolean>(false);
  const [persistenceError, setPersistenceError] = useState<string | undefined>(undefined);

  useEffect(() => {
    setPageTitle('Train — Reference & Motion Trajectory Comparison');
  }, [setPageTitle]);

  // Load Saved References & Active Reference from Postgres API on mount
  const refreshReferencesList = useCallback(async () => {
    let mappedRefs: Reference[] = [];
    try {
      const data = await referenceApi.list(selectedTechniqueId);
      mappedRefs = data.map(mapDbRecordToReference);
    } catch (err) {
      console.warn('Backend API unavailable, using seeded client references:', err);
    }

    if (mappedRefs.length === 0) {
      const { getSeededPlatformReference } = await import('@/lib/motion/seeded-reference');
      mappedRefs = [getSeededPlatformReference()];
    }

    setSavedReferences(mappedRefs);

    const active = await loadActiveReference();
    if (active) {
      setActiveRefState(active);
    } else if (mappedRefs.length > 0) {
      setActiveReferenceId(mappedRefs[0].reference_id);
      setActiveRefState(mappedRefs[0]);
    }
  }, [selectedTechniqueId]);

  useEffect(() => {
    refreshReferencesList();
  }, [refreshReferencesList]);

  const handleSelectActiveReference = (ref: Reference) => {
    setActiveReferenceId(ref.reference_id);
    setActiveRefState(ref);
    setComparisonResult(null);
  };

  const handleClearActiveReference = () => {
    setActiveReferenceId(null);
    setActiveRefState(null);
    setComparisonResult(null);
  };

  const handleLandmarksDetected = useCallback(
    (landmarks: Landmark[], timestampMs: number, fps: number) => {
      console.log("[FPS-HANDLE-IN]", {
        timestampMs,
        fps
      });

      const isVisible = checkFullBodyVisibility(landmarks);
      const confidence = calculateFrameConfidence(landmarks);
      const evalCalib = evaluateSingleCameraCalibration(landmarks);

      if (captureState === 'RECORDING') {
        const timestampMsRel = performance.now() - recordingStartTimeRef.current;
        const frame = createMotionFrame(frameIndexRef.current, timestampMsRel, landmarks);
        framesBufferRef.current.push(frame);
        frameIndexRef.current += 1;
      }

      // Throttle HUD state updates to ~100ms (10 Hz) to avoid 60Hz React render churn
      const now = performance.now();
      if (now - lastMetricsUpdateRef.current >= 100 || captureState === 'RECORDING') {
        lastMetricsUpdateRef.current = now;
        setCalibration(evalCalib);

        if (evalCalib.status === 'READY' && anthropometryProfile.height_cm.confidence < 0.8) {
          const est = estimateProportionsFromPose(landmarks, anthropometryProfile);
          setAnthropometryProfile(est);
        }

        const recordedCount = framesBufferRef.current.length;
        const usableCount = framesBufferRef.current.filter((f) => f.frame_confidence >= 0.7).length;

        const computedMetrics = {
          personDetected: true,
          fullBodyVisible: isVisible,
          landmarkConfidence: Number(confidence.toFixed(2)),
          fps,
          recordedFrameCount: recordedCount,
          usableFrameCount: usableCount,
        };

        console.log("[FPS-BEFORE-SETMETRICS]", {
          computedMetrics,
          incomingFps: fps
        });

        setMetrics(computedMetrics);
      }
    },
    [captureState, anthropometryProfile]
  );

  const handleEngineReady = () => setIsEngineReady(true);
  const handleEngineError = (err: string) => {
    setIsEngineReady(false);
    setErrorMessage(err);
  };

  const handleStartCamera = () => {
    setErrorMessage(null);
    setIsCameraActive(true);
  };

  const handleStopCamera = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsCameraActive(false);
    setIsEngineReady(false);
    if (captureState !== 'COMPLETED') {
      setCaptureState('IDLE');
    }
    setMetrics({
      personDetected: false,
      fullBodyVisible: false,
      landmarkConfidence: 0,
      fps: 0,
      recordedFrameCount: 0,
      usableFrameCount: 0,
    });
    setCalibration({
      status: 'NOT_STARTED',
      confidence: 0.0,
      personDetected: false,
      fullBodyVisible: false,
      guidanceMessage: 'Step into camera view',
      boundingBox: null,
      subjectCenter: null,
      subjectScale: 0.0,
      shoulderOrientationDeg: 0,
      hipOrientationDeg: 0,
    });
  };

  const handleStartCalibration = () => {
    if (!isCameraActive || !isEngineReady) return;
    setErrorMessage(null);
    setCaptureState('CAMERA_READY');
  };

  const handleStartRecording = () => {
    if (!isEngineReady) return;

    setErrorMessage(null);
    setCompletedSession(null);
    setCompletedTemplate(null);
    setComparisonResult(null);
    framesBufferRef.current = [];
    frameIndexRef.current = 0;
    recordingStartTimeRef.current = performance.now();
    startedAtIsoRef.current = new Date().toISOString();
    setRecordingDurationMs(0);
    setCaptureState('RECORDING');

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setRecordingDurationMs(performance.now() - recordingStartTimeRef.current);
    }, 100);
  };

  const handleStopRecording = async () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    setCaptureState('PROCESSING');
    const completedAtIso = new Date().toISOString();

    const session = buildMotionSession(
      {
        athleteId: '00000000-0000-0000-0000-000000000001',
        techniqueId: selectedTechniqueId,
        captureMode: CaptureMode.SINGLE,
        poseModelVersion: 'mediapipe-tasks-vision-v0.10.14',
      },
      [...framesBufferRef.current],
      startedAtIsoRef.current,
      completedAtIso
    );

    const template = buildMotionTemplate(session, calibration, anthropometryProfile);

    const bufferedCount = framesBufferRef.current.length;
    const sessionCount = session.frames?.length || 0;
    const firstTs = session.frames?.[0]?.timestamp_ms || 0;
    const lastTs = session.frames?.[sessionCount - 1]?.timestamp_ms || 0;

    console.log('[CAPTURE-FINALIZE]', {
      bufferedFrameCount: bufferedCount,
      sessionFrameCount: sessionCount,
      firstTimestamp: firstTs,
      lastTimestamp: lastTs,
      durationMs: Number((lastTs - firstTs).toFixed(1)),
    });

    setCompletedSession(session);
    setCompletedTemplate(template);

    let compRes: ReferenceComparisonResult | null = null;
    let newRef: Reference | null = null;
    let jdgPayload: any = null;

    if (recordingMode === 'REFERENCE') {
      newRef = createReferenceFromTemplate(template, 'ATHLETE_REFERENCE', `Recorded Cross Reference (${new Date().toLocaleTimeString()})`);
      handleSelectActiveReference(newRef);
    } else if (activeRef) {
      try {
        compRes = compareMotionTemplates(activeRef, template);
        setComparisonResult(compRes);
        jdgPayload = evaluateTechniqueJudgement(compRes, activeRef);
      } catch (analysisErr: any) {
        console.error('Comparison / Judgement execution error:', analysisErr);
        setErrorMessage(`Analysis error: ${analysisErr.message || 'Unable to compare motion templates'}`);
      }
    }

    const trainingSessionPayload = {
      training_session_id: `ts_${crypto.randomUUID()}`,
      mode: 'TECHNIQUE',
      drill_type: 'CROSS_DRILL',
      athlete_id: '00000000-0000-0000-0000-000000000001',
      technique_id: selectedTechniqueId,
      reference_id: activeRef ? activeRef.reference_id : newRef?.reference_id,
      capture_session_id: session.session_id,
      comparison_id: compRes?.comparison_id,
      judgement_id: jdgPayload?.judgement_id,
      duration_target_sec: 60,
      started_at: session.started_at,
      completed_at: session.completed_at,
      summary_stats: {
        duration_actual_sec: (session.frames?.length || 0) / 30,
        total_frames: template.total_frames,
        usable_frames: template.usable_frames,
        avg_confidence: template.confidence_info.avg_confidence,
        calibration_quality: calibration.status,
        reference_similarity: jdgPayload ? jdgPayload.reference_similarity : null,
        key_deviations_count: jdgPayload ? jdgPayload.key_deviations.length : 0,
      },
      created_at: new Date().toISOString(),
    };

    // Transactional Atomic Finalize Call to Backend Postgres API
    try {
      const finalizePayload = {
        capture_session: {
          session_id: session.session_id,
          athlete_id: session.athlete_id,
          technique_id: session.technique_id,
          capture_mode: session.capture_mode,
          started_at: session.started_at,
          completed_at: session.completed_at,
          pose_model_version: session.pose_model_version,
          frames: session.frames || [],
        },
        motion_template: template,
        reference: newRef ? {
          reference_id: newRef.reference_id,
          reference_type: newRef.reference_type,
          technique_id: newRef.technique_id,
          source_session_id: newRef.source_session_id,
          motion_template_id: newRef.motion_template_id,
          capture_mode: newRef.capture_mode,
          name: newRef.display_name,
          description: newRef.description,
          landmark_data: template.normalized_frames,
          parameter_data: template.parameter_time_series,
        } : null,
        comparison: compRes,
        judgement: jdgPayload,
        training_session: trainingSessionPayload,
      };

      await trainingApi.finalizeTechnique(finalizePayload);
      setPersistedToBackend(true);
      setPersistenceError(undefined);
      refreshReferencesList();
    } catch (err: any) {
      console.warn('Backend transactional finalize fallback error:', err);
      setPersistedToBackend(false);
      setPersistenceError(err.message || 'Postgres database connection error');
    }

    setCaptureState('COMPLETED');
  };

  const handleResetCapture = () => {
    setCaptureState('IDLE');
    setCompletedSession(null);
    setCompletedTemplate(null);
    setComparisonResult(null);
    framesBufferRef.current = [];
    frameIndexRef.current = 0;
    setRecordingDurationMs(0);
    setErrorMessage(null);
  };

  return (
    <AppShell>
      <div className="space-y-6">
      {/* Top Controls & Reference Management Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--fm-bg-card)] border border-[var(--fm-border)] p-4 rounded-xl">
        <div>
          <h1 className="text-xl font-bold text-[var(--fm-text-primary)] flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-cyan-400"></span>
            Technique Mode — Boxing Cross
          </h1>
          <p className="text-xs text-[var(--fm-text-secondary)] mt-0.5">
            Durable Postgres persistence for references, capture sessions, templates, comparison results, and judgements.
          </p>
        </div>

        {/* Target Recording Mode Switcher */}
        <div className="flex items-center gap-2 bg-black/60 p-1.5 rounded-lg border border-[var(--fm-border)] text-xs">
          <span className="text-gray-400 font-semibold px-2">Mode:</span>
          <button
            onClick={() => setRecordingMode('ATTEMPT')}
            className={`px-3 py-1 rounded font-bold transition ${
              recordingMode === 'ATTEMPT'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            RECORD ATTEMPT
          </button>
          <button
            onClick={() => setRecordingMode('REFERENCE')}
            className={`px-3 py-1 rounded font-bold transition ${
              recordingMode === 'REFERENCE'
                ? 'bg-amber-600 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            RECORD NEW REFERENCE
          </button>
        </div>
      </div>

      {/* Active Reference & Saved References List Bar */}
      <div className="bg-[var(--fm-bg-card)] border border-[var(--fm-border)] p-4 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
            <span>📚</span> SAVED REFERENCES FOR CROSS ({savedReferences.length})
          </span>

          {activeRef && (
            <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs px-3 py-1 rounded">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>ACTIVE: <strong>{activeRef.display_name}</strong></span>
              <button
                onClick={handleClearActiveReference}
                className="ml-2 text-emerald-400 hover:text-white font-bold"
                title="Deselect Active Reference"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* References Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {savedReferences.map((ref) => {
            const isSelected = activeRef?.reference_id === ref.reference_id;
            return (
              <div
                key={ref.reference_id}
                className={`p-3 rounded-lg border flex flex-col justify-between gap-2 transition ${
                  isSelected
                    ? 'bg-cyan-950/50 border-cyan-500 shadow-lg'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 mb-1">
                    <span className="px-1.5 py-0.5 bg-slate-800 rounded font-semibold text-cyan-300">
                      {ref.reference_type}
                    </span>
                    <span>{new Date(ref.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="font-semibold text-xs text-white truncate">{ref.display_name}</div>
                  {ref.description && <div className="text-[11px] text-gray-400 truncate mt-0.5">{ref.description}</div>}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => handleSelectActiveReference(ref)}
                    className={`flex-grow py-1 rounded text-xs font-bold transition ${
                      isSelected
                        ? 'bg-emerald-600 text-white cursor-default'
                        : 'bg-cyan-700 hover:bg-cyan-600 text-white'
                    }`}
                  >
                    {isSelected ? '✓ ACTIVE REFERENCE' : 'SELECT REFERENCE'}
                  </button>

                  {ANATOMICAL_AVATAR_ENABLED && (
                    <button
                      onClick={() => {
                        handleSelectActiveReference(ref);
                        setShowReferenceReplayModal(true);
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded border border-slate-700"
                    >
                      REPLAY 3D
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Viewport & Capture Controls Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-w-0">
        <div className="lg:col-span-8 space-y-4 min-w-0">
          <div className="relative rounded-xl overflow-hidden border border-[var(--fm-border)] bg-black shadow-2xl min-h-[440px] flex items-center justify-center">
            <WebcamCanvasOverlay
              isActive={isCameraActive}
              onStartCamera={handleStartCamera}
              onPoseFrame={handleLandmarksDetected}
              onEngineReady={handleEngineReady}
              onError={handleEngineError}
            />

            {errorMessage && (
              <div className="absolute top-4 left-4 right-4 bg-red-950/90 border border-red-800 text-red-200 text-xs px-4 py-2.5 rounded-lg z-20">
                {errorMessage}
              </div>
            )}
          </div>

          {/* Action Button Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--fm-bg-card)] border border-[var(--fm-border)] p-4 rounded-xl">
            <div className="flex items-center gap-3">
              {!isCameraActive ? (
                <button
                  onClick={handleStartCamera}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-lg transition flex items-center gap-2"
                >
                  <span>📷</span> START CAMERA
                </button>
              ) : (
                <button
                  onClick={handleStopCamera}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-red-400 border border-slate-700 text-xs font-bold rounded-lg transition flex items-center gap-2"
                >
                  <span>⏹</span> STOP CAMERA
                </button>
              )}

              {captureState === 'IDLE' && (
                <button
                  onClick={handleStartCalibration}
                  disabled={!isCameraActive || !isEngineReady}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg shadow-lg transition"
                >
                  START CALIBRATION
                </button>
              )}

              {(captureState === 'IDLE' || captureState === 'CAMERA_READY') && (
                <button
                  onClick={handleStartRecording}
                  disabled={!isCameraActive || !isEngineReady || calibration.status !== 'READY'}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg shadow-lg transition animate-pulse"
                >
                  START RECORDING ({recordingMode})
                </button>
              )}

              {captureState === 'RECORDING' && (
                <button
                  onClick={handleStopRecording}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg shadow-lg transition"
                >
                  STOP & FINALIZE SESSION
                </button>
              )}

              {captureState === 'COMPLETED' && (
                <button
                  onClick={handleResetCapture}
                  className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-lg border border-gray-700 transition"
                >
                  START NEW CAPTURE
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShow3dViewport(true)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold rounded-lg border border-slate-700 transition"
              >
                VIEW 3D TECHNIQUE GUIDE
              </button>

              {ANATOMICAL_AVATAR_ENABLED && comparisonResult && (
                <button
                  onClick={() => setShowSyncComparisonModal(true)}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow transition"
                >
                  3D SYNCHRONIZED COMPARISON
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right HUD Sidebar */}
        <div className="lg:col-span-4 space-y-4 min-w-0">
          {(() => {
            console.log("[FPS-PANEL-PROP]", {
              fps: metrics.fps
            });
            return null;
          })()}
          <CaptureQualityPanel
            metrics={metrics}
            isRecording={captureState === 'RECORDING'}
            recordingDurationMs={recordingDurationMs}
          />
          <GuidedCalibrationPanel calibration={calibration} />
          <AnthropometryDrawer
            profile={anthropometryProfile}
            onUpdateProfile={(p) => setAnthropometryProfile(p)}
          />
        </div>
      </div>

      {/* Completed Post-Capture Summary Section */}
      {captureState === 'COMPLETED' && completedSession && completedTemplate && (
        <PostCaptureSummary
          session={completedSession}
          template={completedTemplate}
          reference={activeRef}
          comparisonResult={comparisonResult}
          techniqueName="Cross"
          persistedToBackend={persistedToBackend}
          persistenceError={persistenceError}
          onReset={handleResetCapture}
        />
      )}

      {/* 3D Instructional & Anatomical Viewport Modal */}
      {show3dViewport && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-5xl">
            <TechniqueViewport3D onClose={() => setShow3dViewport(false)} />
          </div>
        </div>
      )}

      {/* 3D Reference Replay Modal */}
      {showReferenceReplayModal && activeRef && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-sm">3D Reference Replay: {activeRef.display_name}</h3>
              <button onClick={() => setShowReferenceReplayModal(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>
            <AvatarReplayViewport
              reference={activeRef}
              title="Reference Motion Replay"
              autoPlay={true}
            />
          </div>
        </div>
      )}

      {/* 3D Synchronized Comparison Modal */}
      {showSyncComparisonModal && completedSession && activeRef && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-6xl bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-sm">3D Synchronized Reference vs Attempt Comparison</h3>
              <button onClick={() => setShowSyncComparisonModal(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>
            <SynchronizedAvatarComparisonViewport
              reference={activeRef}
              attemptSession={completedSession}
            />
          </div>
        </div>
      )}
      </div>
    </AppShell>
  );
}
