'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Technique3DDefinition, CROSS_3D_DEFINITION, AvatarPreset, interpolateTechniquePose } from '@/lib/motion/3d/technique-3d-model';
import { AthleteAvatarViewport } from './AthleteAvatarViewport';
import { generateSyntheticCrossSession } from '@/lib/motion/algorithm-generator';

interface TechniqueViewport3DProps {
  definition?: Technique3DDefinition;
  onClose?: () => void;
}

export function TechniqueViewport3D({
  definition = CROSS_3D_DEFINITION,
  onClose,
}: TechniqueViewport3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  // Viewport Render Mode: INSTRUCTIONAL vs PERSONALIZED_ANATOMICAL
  const [viewportMode, setViewportMode] = useState<'INSTRUCTIONAL' | 'ANATOMICAL'>('INSTRUCTIONAL');
  const [syntheticCrossSession] = useState(() => generateSyntheticCrossSession(60));

  // Playback & Animation State
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [timeNorm, setTimeNorm] = useState<number>(0.0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(0.5); // Default 0.5x for clarity
  const [avatarPreset, setAvatarPreset] = useState<AvatarPreset>('MANNEQUIN_NEUTRAL');

  // Refs for Animation Loop
  const isPlayingRef = useRef<boolean>(isPlaying);
  const timeNormRef = useRef<number>(timeNorm);
  const playbackSpeedRef = useRef<number>(playbackSpeed);
  const lastTimeRef = useRef<number>(performance.now());
  const animationFrameIdRef = useRef<number | null>(null);

  // Three.js References
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const jointsRef = useRef<Record<string, THREE.Object3D>>({});

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    timeNormRef.current = timeNorm;
  }, [timeNorm]);

  useEffect(() => {
    playbackSpeedRef.current = playbackSpeed;
  }, [playbackSpeed]);

  // Setup Three.js Scene, Camera, Renderer, & Articulated Mannequin Mesh
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || 600;
    const height = mountRef.current.clientHeight || 450;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0c10);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.4, 3.2);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    // Clear previous canvas if re-mounting
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.0, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(3, 5, 4);
    scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0x3b82f6, 1.5);
    backLight.position.set(-3, 3, -4);
    scene.add(backLight);

    // 6. Ground Grid & Target Line
    const gridHelper = new THREE.GridHelper(6, 12, 0x334155, 0x1e293b);
    scene.add(gridHelper);

    // Target Line Direction Indicator
    const targetLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.01, 0),
      new THREE.Vector3(0, 0.01, 2),
    ]);
    const targetLineMat = new THREE.LineDashedMaterial({ color: 0xef4444, dashSize: 0.1, gapSize: 0.05 });
    const targetLine = new THREE.Line(targetLineGeo, targetLineMat);
    targetLine.computeLineDistances();
    scene.add(targetLine);

    // 7. Articulated Mannequin Mesh Hierarchy Construction
    const matJoint = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3, metalness: 0.5 });
    const matLimb = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.6 });
    const matTorso = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.7 });
    const matHead = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2, metalness: 0.4 });
    const matRightArm = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, metalness: 0.6 }); // Accent for striking arm

    const createJointSphere = (radius = 0.065) => new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 16), matJoint);

    const rootNode = new THREE.Group();
    rootNode.position.set(0, 0.95, 0);
    scene.add(rootNode);

    // Hips / Pelvis
    const hipsGroup = new THREE.Group();
    rootNode.add(hipsGroup);

    const pelvisMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.2), matTorso);
    hipsGroup.add(pelvisMesh);

    // Torso
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 0.22, 0);
    hipsGroup.add(torsoGroup);

    const chestMesh = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.38, 0.22), matTorso);
    chestMesh.position.set(0, 0.1, 0);
    torsoGroup.add(chestMesh);

    // Head
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.35, 0);
    torsoGroup.add(headGroup);

    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 20), matHead);
    headMesh.position.set(0, 0.08, 0);
    headGroup.add(headMesh);

    // Left Arm
    const shoulderLeft = createJointSphere();
    shoulderLeft.position.set(-0.22, 0.26, 0);
    torsoGroup.add(shoulderLeft);

    const upperArmLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.26), matLimb);
    upperArmLeft.position.set(0, -0.13, 0);
    shoulderLeft.add(upperArmLeft);

    const elbowLeft = createJointSphere(0.05);
    elbowLeft.position.set(0, -0.26, 0);
    shoulderLeft.add(elbowLeft);

    const forearmLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.24), matLimb);
    forearmLeft.position.set(0, -0.12, 0);
    elbowLeft.add(forearmLeft);

    // Right Arm (Striking Rear Arm - Red Accent)
    const shoulderRight = createJointSphere();
    shoulderRight.position.set(0.22, 0.26, 0);
    torsoGroup.add(shoulderRight);

    const upperArmRight = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.26), matRightArm);
    upperArmRight.position.set(0, -0.13, 0);
    shoulderRight.add(upperArmRight);

    const elbowRight = createJointSphere(0.05);
    elbowRight.position.set(0, -0.26, 0);
    shoulderRight.add(elbowRight);

    const forearmRight = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.24), matRightArm);
    forearmRight.position.set(0, -0.12, 0);
    elbowRight.add(forearmRight);

    // Left Leg
    const hipLeft = createJointSphere();
    hipLeft.position.set(-0.12, -0.07, 0);
    hipsGroup.add(hipLeft);

    const thighLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.4), matLimb);
    thighLeft.position.set(0, -0.2, 0);
    hipLeft.add(thighLeft);

    const kneeLeft = createJointSphere(0.055);
    kneeLeft.position.set(0, -0.4, 0);
    hipLeft.add(kneeLeft);

    const shinLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.38), matLimb);
    shinLeft.position.set(0, -0.19, 0);
    kneeLeft.add(shinLeft);

    // Right Leg
    const hipRight = createJointSphere();
    hipRight.position.set(0.12, -0.07, 0);
    hipsGroup.add(hipRight);

    const thighRight = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.4), matLimb);
    thighRight.position.set(0, -0.2, 0);
    hipRight.add(thighRight);

    const kneeRight = createJointSphere(0.055);
    kneeRight.position.set(0, -0.4, 0);
    hipRight.add(kneeRight);

    const shinRight = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.38), matLimb);
    shinRight.position.set(0, -0.19, 0);
    kneeRight.add(shinRight);

    // Store joint references for animation updates
    jointsRef.current = {
      root: rootNode,
      hips: hipsGroup,
      torso: torsoGroup,
      head: headGroup,
      shoulder_left: shoulderLeft,
      elbow_left: elbowLeft,
      shoulder_right: shoulderRight,
      elbow_right: elbowRight,
      hip_left: hipLeft,
      knee_left: kneeLeft,
      hip_right: hipRight,
      knee_right: kneeRight,
    };

    // 8. Animation & Render Loop
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const deltaSec = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (isPlayingRef.current) {
        timeNormRef.current += deltaSec * (playbackSpeedRef.current / 1.5); // Normalize loop duration
        if (timeNormRef.current > 1.0) {
          timeNormRef.current = 0.0;
        }
        setTimeNorm(Number(timeNormRef.current.toFixed(3)));
      }

      // Evaluate keyframe interpolation at current timeNorm
      const pose = interpolateTechniquePose(definition.keyframes, timeNormRef.current);

      // Apply joint rotations
      if (jointsRef.current.root) {
        jointsRef.current.root.position.set(pose.position_offset.x, 0.95 + pose.position_offset.y, pose.position_offset.z);
      }
      if (jointsRef.current.hips) jointsRef.current.hips.rotation.set(pose.hips.x, pose.hips.y, pose.hips.z);
      if (jointsRef.current.torso) jointsRef.current.torso.rotation.set(pose.torso.x, pose.torso.y, pose.torso.z);
      if (jointsRef.current.head) jointsRef.current.head.rotation.set(pose.head.x, pose.head.y, pose.head.z);

      if (jointsRef.current.shoulder_left) jointsRef.current.shoulder_left.rotation.set(pose.shoulder_left.x, pose.shoulder_left.y, pose.shoulder_left.z);
      if (jointsRef.current.elbow_left) jointsRef.current.elbow_left.rotation.set(pose.elbow_left.x, pose.elbow_left.y, pose.elbow_left.z);

      if (jointsRef.current.shoulder_right) jointsRef.current.shoulder_right.rotation.set(pose.shoulder_right.x, pose.shoulder_right.y, pose.shoulder_right.z);
      if (jointsRef.current.elbow_right) jointsRef.current.elbow_right.rotation.set(pose.elbow_right.x, pose.elbow_right.y, pose.elbow_right.z);

      if (jointsRef.current.hip_left) jointsRef.current.hip_left.rotation.set(pose.hip_left.x, pose.hip_left.y, pose.hip_left.z);
      if (jointsRef.current.knee_left) jointsRef.current.knee_left.rotation.set(pose.knee_left.x, pose.knee_left.y, pose.knee_left.z);

      if (jointsRef.current.hip_right) jointsRef.current.hip_right.rotation.set(pose.hip_right.x, pose.hip_right.y, pose.hip_right.z);
      if (jointsRef.current.knee_right) jointsRef.current.knee_right.rotation.set(pose.knee_right.x, pose.knee_right.y, pose.knee_right.z);

      controls.update();
      renderer.render(scene, camera);

      animationFrameIdRef.current = requestAnimationFrame(animate);
    };

    animationFrameIdRef.current = requestAnimationFrame(animate);

    // Handle Resize
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      renderer.dispose();
    };
  }, [definition]);

  // Set Predefined Camera View Presets
  const handleSetViewPreset = (view: 'FRONT' | 'REAR' | 'LEAD_SIDE' | 'REAR_SIDE') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    switch (view) {
      case 'FRONT':
        camera.position.set(0, 1.4, 3.2);
        break;
      case 'REAR':
        camera.position.set(0, 1.4, -3.2);
        break;
      case 'LEAD_SIDE': // Left side
        camera.position.set(-3.2, 1.4, 0);
        break;
      case 'REAR_SIDE': // Right side
        camera.position.set(3.2, 1.4, 0);
        break;
    }
    controls.target.set(0, 1.0, 0);
    controls.update();
  };

  const handleKeyPositionClick = (tNorm: number) => {
    setIsPlaying(false);
    setTimeNorm(tNorm);
    timeNormRef.current = tNorm;
  };

  return (
    <div className="bg-[var(--fm-bg-card)] border border-[var(--fm-border)] rounded-xl overflow-hidden flex flex-col lg:flex-row shadow-2xl w-full">
      {/* 3D WebGL Viewport Container (Left/Main) */}
      <div className="lg:w-2/3 flex flex-col bg-black relative min-h-[420px] lg:min-h-[500px]">
        {/* Canvas Mount / Anatomical Avatar */}
        {viewportMode === 'ANATOMICAL' ? (
          <div className="w-full h-full min-h-[380px] flex-grow">
            <AthleteAvatarViewport
              currentFrame={syntheticCrossSession.frames?.[Math.floor(timeNorm * Math.max(0, (syntheticCrossSession.frames?.length || 1) - 1))] || null}
              height="100%"
            />
          </div>
        ) : (
          <div ref={mountRef} className="w-full h-full min-h-[380px] flex-grow cursor-grab active:cursor-grabbing" />
        )}

        {/* Viewport Overlay Controls Header */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="bg-black/80 backdrop-blur border border-gray-800 rounded-lg px-3 py-1.5 pointer-events-auto flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
            <span className="font-bold text-white">{definition.name} ({definition.discipline})</span>
            <span className="text-gray-400 font-mono text-[10px]">3D Viewport</span>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Viewport Renderer Mode Selector */}
            <select
              value={viewportMode}
              onChange={(e) => setViewportMode(e.target.value as 'INSTRUCTIONAL' | 'ANATOMICAL')}
              className="bg-cyan-950/90 backdrop-blur border border-cyan-700 rounded px-2.5 py-1 text-[11px] text-cyan-300 font-bold shadow-lg"
            >
              <option value="ANATOMICAL">💪 Anatomical Athlete Avatar</option>
              <option value="INSTRUCTIONAL">🤖 Instructional Mannequin</option>
            </select>

            {/* Avatar Selector */}
            {viewportMode === 'INSTRUCTIONAL' && (
              <select
                value={avatarPreset}
                onChange={(e) => setAvatarPreset(e.target.value as AvatarPreset)}
                className="bg-black/80 backdrop-blur border border-gray-800 rounded px-2.5 py-1 text-[11px] text-gray-200 font-medium"
              >
                <option value="MANNEQUIN_NEUTRAL">Neutral Mannequin</option>
                <option value="GENERIC_MALE">Generic Male</option>
                <option value="GENERIC_FEMALE">Generic Female</option>
              </select>
            )}

            {onClose && (
              <button
                onClick={onClose}
                className="w-7 h-7 bg-black/80 border border-gray-800 hover:bg-gray-800 text-gray-300 rounded-full flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* View Angle Presets Bar */}
        <div className="absolute top-14 left-3 flex items-center gap-1.5 pointer-events-auto">
          <button onClick={() => handleSetViewPreset('FRONT')} className="px-2 py-1 bg-black/75 hover:bg-gray-800 border border-gray-800 text-white text-[10px] rounded font-medium">Front</button>
          <button onClick={() => handleSetViewPreset('LEAD_SIDE')} className="px-2 py-1 bg-black/75 hover:bg-gray-800 border border-gray-800 text-white text-[10px] rounded font-medium">Lead Side</button>
          <button onClick={() => handleSetViewPreset('REAR_SIDE')} className="px-2 py-1 bg-black/75 hover:bg-gray-800 border border-gray-800 text-white text-[10px] rounded font-medium">Rear Side</button>
          <button onClick={() => handleSetViewPreset('REAR')} className="px-2 py-1 bg-black/75 hover:bg-gray-800 border border-gray-800 text-white text-[10px] rounded font-medium">Rear</button>
        </div>

        {/* Bottom Playback & Scrubber Controls Toolbar */}
        <div className="bg-[var(--fm-bg-secondary)] border-t border-[var(--fm-border)] p-4 space-y-3">
          <div className="flex items-center gap-3">
            {/* Play / Pause */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-9 h-9 bg-[var(--fm-accent-primary)] hover:bg-red-700 text-white rounded-lg flex items-center justify-center font-bold text-sm shadow transition-colors"
            >
              {isPlaying ? '⏸' : '▶'}
            </button>

            {/* Restart */}
            <button
              onClick={() => { setTimeNorm(0); timeNormRef.current = 0; }}
              className="px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-xs font-mono border border-gray-700"
            >
              ↺ 0%
            </button>

            {/* Scrubber Slider */}
            <div className="flex-grow flex items-center gap-2 font-mono text-xs">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={timeNorm}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setTimeNorm(val);
                  timeNormRef.current = val;
                }}
                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-blue-400 font-bold w-12 text-right">{Math.round(timeNorm * 100)}%</span>
            </div>

            {/* Speed Selector */}
            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
              className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200 font-mono"
            >
              <option value="0.25">0.25x</option>
              <option value="0.5">0.50x</option>
              <option value="1.0">1.00x</option>
            </select>
          </div>

          {/* Interactive Key Position Markers Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-800">
            <span className="text-[10px] text-[var(--fm-text-secondary)] font-semibold uppercase tracking-wider">Key Positions:</span>
            {definition.key_positions.map((pos, idx) => (
              <button
                key={idx}
                onClick={() => handleKeyPositionClick(pos.time_norm)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors border ${
                  Math.abs(timeNorm - pos.time_norm) < 0.05
                    ? 'bg-blue-600 border-blue-400 text-white font-bold'
                    : 'bg-black/60 border-gray-800 text-gray-300 hover:bg-gray-800'
                }`}
              >
                {pos.label} ({Math.round(pos.time_norm * 100)}%)
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Technique Information Sidebar (Right) */}
      <div className="lg:w-1/3 p-5 flex flex-col space-y-4 border-t lg:border-t-0 lg:border-l border-[var(--fm-border)] bg-[var(--fm-bg-card)]">
        <div>
          <span className="px-2 py-0.5 bg-blue-950/80 border border-blue-500/50 text-blue-400 font-mono text-[10px] font-bold rounded uppercase">
            3D Technique Reference
          </span>
          <h3 className="text-xl font-bold text-[var(--fm-text-primary)] mt-1">{definition.name}</h3>
          <p className="text-xs text-[var(--fm-text-secondary)] mt-1">{definition.description}</p>
        </div>

        {/* Stance Assumption */}
        <div className="bg-[var(--fm-bg-secondary)] border border-[var(--fm-border)] p-3 rounded-lg text-xs space-y-1">
          <span className="font-bold text-[var(--fm-text-primary)] block">🥋 Stance Assumption:</span>
          <span className="text-[var(--fm-text-secondary)] font-mono text-[11px]">{definition.stance_assumption}</span>
        </div>

        {/* Key Cues List */}
        <div className="space-y-2 flex-grow">
          <h4 className="text-xs font-bold text-[var(--fm-text-primary)] flex items-center gap-1.5">
            <span>💡</span> Key Biomechanical Cues
          </h4>
          <ul className="space-y-2 text-xs text-[var(--fm-text-secondary)]">
            {definition.cues.map((cue, idx) => (
              <li key={idx} className="flex items-start gap-2 bg-[var(--fm-bg-secondary)] p-2.5 rounded border border-[var(--fm-border)]">
                <span className="w-4 h-4 rounded-full bg-blue-900/80 border border-blue-500/50 text-blue-300 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-tight text-[11px] text-[var(--fm-text-primary)] font-medium">{cue}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-3 bg-blue-950/30 border border-blue-500/30 rounded-lg text-[11px] text-blue-200">
          <strong>Orbit Navigation:</strong> Click and drag to orbit 360°. Scroll to zoom. Use view presets above canvas to quickly switch perspectives.
        </div>
      </div>
    </div>
  );
}
