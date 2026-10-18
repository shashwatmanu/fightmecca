'use meclient';

/**
 * Fight Mecca AthleteAvatarViewport Component
 * Renders the purchased 3D Anatomical Avatar driven by canonical MotionFrame landmarks and AthleteBodyProfile morphing.
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildHumanoidRig, FightMeccaHumanoidRig } from '@/lib/motion/avatar/humanoid-rig';
import { MotionRetargeter } from '@/lib/motion/avatar/motion-retargeter';
import { AvatarMorphEngine } from '@/lib/motion/avatar/morph-engine';
import { AthleteBodyProfile, ATHLETE_BODY_PRESETS } from '@/lib/motion/avatar/body-profile';
import { MotionFrame } from '@/lib/motion/session-storage';

interface AthleteAvatarViewportProps {
  currentFrame?: MotionFrame | null;
  landmarks?: any[]; // Raw 33 MediaPipe landmarks fallback
  bodyProfile?: AthleteBodyProfile;
  presetName?: string;
  width?: string | number;
  height?: string | number;
  showSkeletonDebug?: boolean;
  mirrored?: boolean;
  meshVariant?: 'muscle_1' | 'muscle_2' | 'skeleton' | 'all';
}

export const AthleteAvatarViewport: React.FC<AthleteAvatarViewportProps> = ({
  currentFrame,
  landmarks,
  bodyProfile = ATHLETE_BODY_PRESETS.NEUTRAL,
  width = '100%',
  height = '450px',
  showSkeletonDebug = false,
  mirrored = false,
  meshVariant = 'all',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Three.js Scene refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const avatarRootRef = useRef<THREE.Object3D | null>(null);
  const rigRef = useRef<FightMeccaHumanoidRig | null>(null);
  const retargeterRef = useRef<MotionRetargeter | null>(null);
  const morphEngineRef = useRef<AvatarMorphEngine | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;

    let isSubscribed = true;
    const container = containerRef.current;
    const widthPx = container.clientWidth || 600;
    const heightPx = container.clientHeight || 450;

    // 1. Setup Scene, Camera, Lights
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0c10);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, widthPx / heightPx, 0.1, 100);
    camera.position.set(0, 1.4, 3.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(widthPx, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.0, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight1.position.set(2, 4, 3);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x3b82f6, 1.5); // Subtle cyan accent light
    dirLight2.position.set(-3, 2, -2);
    scene.add(dirLight2);

    // Grid Floor
    const gridHelper = new THREE.GridHelper(10, 20, 0x3b82f6, 0x1e293b);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // 2. Load Avatar GLB Model
    const loader = new GLTFLoader();
    const modelUrl = '/models/avatars/avatar.glb';

    loader.load(
      modelUrl,
      (gltf) => {
        if (!isSubscribed) return;
        const avatarRoot = gltf.scene;
        avatarRoot.position.set(0, 0, 0);
        scene.add(avatarRoot);
        avatarRootRef.current = avatarRoot;

        // Build Rig Adapter
        const { rig, mappedCount } = buildHumanoidRig(avatarRoot);
        rigRef.current = rig;

        // Initialize Retargeter & Morph Engine
        const retargeter = new MotionRetargeter(rig);
        const morphEngine = new AvatarMorphEngine(avatarRoot, rig);
        retargeterRef.current = retargeter;
        morphEngineRef.current = morphEngine;

        // Apply initial morphology
        morphEngine.applyBodyProfile(bodyProfile);
        setIsLoading(false);
      },
      undefined,
      (err) => {
        console.error('Failed to load anatomical avatar GLB:', err);
        if (isSubscribed) {
          setErrorMsg('Anatomical asset failed to load. Falling back to debug mode.');
          setIsLoading(false);
        }
      }
    );

    // 3. Render Animation Loop
    let animFrameId: number;
    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      if (controlsRef.current) controlsRef.current.update();
      if (rendererRef.current && sceneRef.current) {
        rendererRef.current.render(sceneRef.current, camera);
      }
    };
    animate();

    const handleResize = () => {
      if (!container || !rendererRef.current) return;
      const w = container.clientWidth || 600;
      const h = container.clientHeight || 450;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      isSubscribed = false;
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', handleResize);

      if (controlsRef.current) controlsRef.current.dispose();
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (rendererRef.current.domElement && container.contains(rendererRef.current.domElement)) {
          container.removeChild(rendererRef.current.domElement);
        }
      }
    };
  }, []);

  // Update Body Morphology when prop changes
  useEffect(() => {
    if (morphEngineRef.current && bodyProfile) {
      morphEngineRef.current.applyBodyProfile(bodyProfile);
    }
  }, [bodyProfile]);

  // Update mesh variant visibility
  useEffect(() => {
    if (morphEngineRef.current) {
      morphEngineRef.current.setMeshVariantVisibility(meshVariant);
    }
  }, [meshVariant]);

  // Retarget current motion frame landmarks onto 3D rig
  useEffect(() => {
    if (!retargeterRef.current) return;

    const targetLandmarks =
      currentFrame?.landmarks ||
      (currentFrame as any)?.normalized_landmarks ||
      landmarks;

    if (targetLandmarks && targetLandmarks.length >= 33) {
      retargeterRef.current.applyLandmarks(targetLandmarks, {
        mirrored,
        smoothingAlpha: 1.0,
      });

      if (avatarRootRef.current) {
        avatarRootRef.current.updateMatrixWorld(true);
        avatarRootRef.current.traverse((child) => {
          if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
            (child as THREE.SkinnedMesh).skeleton.update();
          }
        });
      }
    }
  }, [currentFrame, landmarks, mirrored]);

  return (
    <div
      ref={containerRef}
      className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl"
      style={{ width, height }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur z-10 text-slate-300">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <span className="text-sm font-medium">Loading Anatomical Athlete Avatar...</span>
        </div>
      )}

      {errorMsg && (
        <div className="absolute top-4 left-4 right-4 bg-red-950/80 border border-red-800 text-red-200 text-xs px-3 py-2 rounded z-20">
          {errorMsg}
        </div>
      )}

      {/* Floating HUD Badge */}
      <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur border border-slate-700 text-slate-300 text-xs px-2.5 py-1 rounded flex items-center gap-2 z-10">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
        <span>ANATOMICAL AVATAR ENGINE</span>
      </div>
    </div>
  );
};
