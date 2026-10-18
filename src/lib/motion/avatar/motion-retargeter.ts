/**
 * Fight Mecca Motion Retargeting Engine
 * Retargets canonical 33 3D MediaPipe MotionFrames onto a FightMeccaHumanoidRig.
 * Uses parent-local coordinate space forward kinematics preserving the asset rest pose.
 */

import * as THREE from 'three';
import { FightMeccaHumanoidRig, METARIG_ASSET_MAP, RigBoneName } from './humanoid-rig';

export interface Landmark3D {
  x: number;
  y: number;
  z: number;
  visibility?: number;
  presence?: number;
  landmark_id?: number;
}

export interface RetargetOptions {
  mirrored?: boolean;
  smoothingAlpha?: number; // 0.0 to 1.0 (1.0 = instant)
  minConfidence?: number;  // Threshold to process landmark
}

interface BoneBindCache {
  initialLocalQuaternion: THREE.Quaternion;
  initialLocalPosition: THREE.Vector3;
  restWorldPosition: THREE.Vector3;
  restWorldQuaternion: THREE.Quaternion;
  parent: THREE.Object3D | null;
  restSegmentDirectionLocal: THREE.Vector3;
}

export class MotionRetargeter {
  private rig: FightMeccaHumanoidRig;
  private boneCache: Map<THREE.Bone, BoneBindCache> = new Map();
  private initialized = false;
  private frameCounter = 0;

  constructor(rig: FightMeccaHumanoidRig) {
    this.rig = rig;
    this.captureBindPose();
  }

  /**
   * Captures initial bind pose quaternions, positions, world transforms, and segment directions.
   */
  public captureBindPose() {
    const mappedEntries = Object.entries(this.rig) as [RigBoneName, THREE.Bone | undefined][];
    const mappedBones = mappedEntries
      .filter(([_, bone]) => Boolean(bone))
      .map(([key, bone]) => ({ key, bone: bone! }));

    // Programmatically calculate mapping counts for diagnostic check
    const semanticBoneCount = Object.keys(METARIG_ASSET_MAP).length;
    const mappedBoneCount = mappedBones.length;
    const missingSemanticBones = (Object.keys(METARIG_ASSET_MAP) as RigBoneName[]).filter(
      (key) => !this.rig[key]
    );

    console.log('[AVATAR-MAPPING-DIAG]', {
      semanticBoneCount,
      mappedBoneCount,
      missingSemanticBones,
    });

    mappedBones.forEach(({ key, bone }) => {
      const restWorldPos = bone.getWorldPosition(new THREE.Vector3());
      const restWorldQuat = bone.getWorldQuaternion(new THREE.Quaternion());

      // Derive rest segment direction in local bone space
      let restSegmentDirectionLocal = new THREE.Vector3(1, 0, 0);

      // Child bone lookup for segment direction calculation
      let childBone: THREE.Bone | undefined = undefined;

      if (key === 'rightUpperArm') childBone = this.rig.rightForearm;
      else if (key === 'rightForearm') childBone = this.rig.rightHand;
      else if (key === 'leftUpperArm') childBone = this.rig.leftForearm;
      else if (key === 'leftForearm') childBone = this.rig.leftHand;
      else if (key === 'rightThigh') childBone = this.rig.rightShin;
      else if (key === 'rightShin') childBone = this.rig.rightFoot;
      else if (key === 'leftThigh') childBone = this.rig.leftShin;
      else if (key === 'leftShin') childBone = this.rig.leftFoot;
      else if (key === 'spine' || key === 'chest') childBone = this.rig.neck || this.rig.head;

      if (childBone && childBone.position.lengthSq() > 0.0001) {
        // Child's position in parent's local space is the local rest segment direction vector
        restSegmentDirectionLocal = childBone.position.clone().normalize();
      } else {
        // Default fallbacks if child bone position is offset-free
        if (key.includes('rightUpperArm') || key.includes('rightForearm')) restSegmentDirectionLocal.set(-1, 0, 0);
        else if (key.includes('leftUpperArm') || key.includes('leftForearm')) restSegmentDirectionLocal.set(1, 0, 0);
        else if (key.includes('Thigh') || key.includes('Shin')) restSegmentDirectionLocal.set(0, -1, 0);
        else if (key === 'spine' || key === 'chest' || key === 'neck') restSegmentDirectionLocal.set(0, 1, 0);
      }

      this.boneCache.set(bone, {
        initialLocalQuaternion: bone.quaternion.clone(),
        initialLocalPosition: bone.position.clone(),
        restWorldPosition: restWorldPos,
        restWorldQuaternion: restWorldQuat,
        parent: bone.parent,
        restSegmentDirectionLocal,
      });
    });

    this.initialized = true;
  }

  /**
   * Retargets a single set of 33 canonical landmarks onto the humanoid rig.
   */
  public applyLandmarks(landmarks: Landmark3D[], options: RetargetOptions = {}) {
    if (!landmarks || landmarks.length < 33 || !this.initialized) return;

    this.frameCounter++;

    const {
      mirrored = false,
      smoothingAlpha = 1.0, // Default to instant zero-lag update
      minConfidence = 0.2,
    } = options;

    // 1. Reset all mapped bones to cached initial local quaternions & positions (PREVENTS DRIFT ACCUMULATION)
    this.boneCache.forEach((cache, bone) => {
      bone.quaternion.copy(cache.initialLocalQuaternion);
      bone.position.copy(cache.initialLocalPosition);
    });

    // 2. Extract Landmark Points into Three.js World Vector Space
    // Landmark index lookup helper (supports both array indices and landmark_id objects)
    const getPoint = (id: number): THREE.Vector3 => {
      const lm = landmarks.find((l) => l.landmark_id === id) || landmarks[id];
      if (!lm) return new THREE.Vector3(0, 0, 0);
      let x = lm.x - 0.5;
      let y = -(lm.y - 0.5); // Invert Y for Three.js
      let z = -lm.z;         // Depth Z
      if (mirrored) x = -x;
      return new THREE.Vector3(x, y, z);
    };

    const isConfident = (ids: number[]) => {
      return ids.every((id) => {
        const lm = landmarks.find((l) => l.landmark_id === id) || landmarks[id];
        return lm && (lm.visibility ?? 1.0) >= minConfidence;
      });
    };

    // Landmark Indices
    const NOSE = 0;
    const L_SHOULDER = 11, R_SHOULDER = 12;
    const L_ELBOW = 13, R_ELBOW = 14;
    const L_WRIST = 15, R_WRIST = 16;
    const L_HIP = 23, R_HIP = 24;
    const L_KNEE = 25, R_KNEE = 26;
    const L_ANKLE = 27, R_ANKLE = 28;

    const pNOSE = getPoint(NOSE);
    const pLShoulder = getPoint(L_SHOULDER), pRShoulder = getPoint(R_SHOULDER);
    const pLElbow = getPoint(L_ELBOW), pRElbow = getPoint(R_ELBOW);
    const pLWrist = getPoint(L_WRIST), pRWrist = getPoint(R_WRIST);
    const pLHip = getPoint(L_HIP), pRHip = getPoint(R_HIP);
    const pLKnee = getPoint(L_KNEE), pRKnee = getPoint(R_KNEE);
    const pLAnkle = getPoint(L_ANKLE), pRAnkle = getPoint(R_ANKLE);

    // Helper: Retarget single segment bone in parent local space
    const retargetBoneSegment = (
      bone: THREE.Bone | undefined,
      desiredWorldDirection: THREE.Vector3
    ) => {
      if (!bone || desiredWorldDirection.lengthSq() < 0.0001) return;

      const cache = this.boneCache.get(bone);
      if (!cache) return;

      // Obtain current parent world quaternion
      const parentWorldQuat = new THREE.Quaternion();
      if (bone.parent) {
        bone.parent.getWorldQuaternion(parentWorldQuat);
      }

      // Convert desired world direction into parent's local space
      const desiredParentLocalDir = desiredWorldDirection.clone().normalize();
      if (bone.parent) {
        const invParentQuat = parentWorldQuat.clone().invert();
        desiredParentLocalDir.applyQuaternion(invParentQuat);
      }

      // Compare against cached local rest segment direction
      const restLocalDir = cache.restSegmentDirectionLocal.clone().normalize();

      // Delta quaternion transforming rest local direction -> desired local direction
      const qDelta = new THREE.Quaternion().setFromUnitVectors(restLocalDir, desiredParentLocalDir);

      // Target local quaternion = qDelta * initialLocalQuaternion
      const qTarget = cache.initialLocalQuaternion.clone().premultiply(qDelta);

      if (smoothingAlpha >= 1.0) {
        bone.quaternion.copy(qTarget);
      } else {
        bone.quaternion.copy(cache.initialLocalQuaternion).slerp(qTarget, smoothingAlpha);
      }

      // Update matrix world to propagate changes to child bones in chain
      bone.updateMatrixWorld(true);
    };

    // 3. Pelvis / Root Translation
    if (this.rig.pelvis && isConfident([L_HIP, R_HIP])) {
      const hipCenter = new THREE.Vector3().addVectors(pLHip, pRHip).multiplyScalar(0.5);
      const cache = this.boneCache.get(this.rig.pelvis);
      if (cache) {
        this.rig.pelvis.position.set(
          cache.initialLocalPosition.x + hipCenter.x * 0.8,
          cache.initialLocalPosition.y + hipCenter.y * 0.8,
          cache.initialLocalPosition.z + hipCenter.z * 0.8
        );
        this.rig.pelvis.updateMatrixWorld(true);
      }
    }

    // 4. Torso / Spine
    if (isConfident([L_HIP, R_HIP, L_SHOULDER, R_SHOULDER])) {
      const hipCenter = new THREE.Vector3().addVectors(pLHip, pRHip).multiplyScalar(0.5);
      const shoulderCenter = new THREE.Vector3().addVectors(pLShoulder, pRShoulder).multiplyScalar(0.5);
      const torsoVec = new THREE.Vector3().subVectors(shoulderCenter, hipCenter);

      retargetBoneSegment(this.rig.spine, torsoVec);
      retargetBoneSegment(this.rig.chest, torsoVec);
    }

    // 5. Right Arm (Upper Arm -> Forearm)
    if (isConfident([R_SHOULDER, R_ELBOW])) {
      const upperArmVec = new THREE.Vector3().subVectors(pRElbow, pRShoulder);
      retargetBoneSegment(this.rig.rightUpperArm, upperArmVec);

      if (isConfident([R_WRIST])) {
        const forearmVec = new THREE.Vector3().subVectors(pRWrist, pRElbow);
        retargetBoneSegment(this.rig.rightForearm, forearmVec);
      }
    }

    // 6. Left Arm (Upper Arm -> Forearm)
    if (isConfident([L_SHOULDER, L_ELBOW])) {
      const upperArmVec = new THREE.Vector3().subVectors(pLElbow, pLShoulder);
      retargetBoneSegment(this.rig.leftUpperArm, upperArmVec);

      if (isConfident([L_WRIST])) {
        const forearmVec = new THREE.Vector3().subVectors(pLWrist, pLElbow);
        retargetBoneSegment(this.rig.leftForearm, forearmVec);
      }
    }

    // 7. Right Leg (Thigh -> Shin)
    if (isConfident([R_HIP, R_KNEE])) {
      const thighVec = new THREE.Vector3().subVectors(pRKnee, pRHip);
      retargetBoneSegment(this.rig.rightThigh, thighVec);

      if (isConfident([R_ANKLE])) {
        const shinVec = new THREE.Vector3().subVectors(pRAnkle, pRKnee);
        retargetBoneSegment(this.rig.rightShin, shinVec);
      }
    }

    // 8. Left Leg (Thigh -> Shin)
    if (isConfident([L_HIP, L_KNEE])) {
      const thighVec = new THREE.Vector3().subVectors(pLKnee, pLHip);
      retargetBoneSegment(this.rig.leftThigh, thighVec);

      if (isConfident([L_ANKLE])) {
        const shinVec = new THREE.Vector3().subVectors(pLAnkle, pLKnee);
        retargetBoneSegment(this.rig.leftShin, shinVec);
      }
    }

    // 9. Head / Neck
    if (isConfident([NOSE, L_SHOULDER, R_SHOULDER]) && this.rig.head) {
      const shoulderCenter = new THREE.Vector3().addVectors(pLShoulder, pRShoulder).multiplyScalar(0.5);
      const neckVec = new THREE.Vector3().subVectors(pNOSE, shoulderCenter);
      retargetBoneSegment(this.rig.head, neckVec);
    }

    // 10. Temporary Diagnostic Logging Once Every ~30 Frames
    if (this.frameCounter % 30 === 0) {
      const rightUpperArmWorldPos = this.rig.rightUpperArm
        ? this.rig.rightUpperArm.getWorldPosition(new THREE.Vector3())
        : null;
      const rightForearmWorldPos = this.rig.rightForearm
        ? this.rig.rightForearm.getWorldPosition(new THREE.Vector3())
        : null;
      const rightHandWorldPos = this.rig.rightHand
        ? this.rig.rightHand.getWorldPosition(new THREE.Vector3())
        : null;

      console.log('[AVATAR-MOTION]', {
        frameIndex: this.frameCounter,
        rightUpperArm: {
          boneName: this.rig.rightUpperArm?.name || 'UNMAPPED',
          quaternion: this.rig.rightUpperArm?.quaternion.clone(),
          worldPos: rightUpperArmWorldPos ? { x: Number(rightUpperArmWorldPos.x.toFixed(3)), y: Number(rightUpperArmWorldPos.y.toFixed(3)), z: Number(rightUpperArmWorldPos.z.toFixed(3)) } : null,
        },
        rightForearm: {
          boneName: this.rig.rightForearm?.name || 'UNMAPPED',
          quaternion: this.rig.rightForearm?.quaternion.clone(),
          worldPos: rightForearmWorldPos ? { x: Number(rightForearmWorldPos.x.toFixed(3)), y: Number(rightForearmWorldPos.y.toFixed(3)), z: Number(rightForearmWorldPos.z.toFixed(3)) } : null,
        },
        rightHand: {
          boneName: this.rig.rightHand?.name || 'UNMAPPED',
          quaternion: this.rig.rightHand?.quaternion.clone(),
          worldPos: rightHandWorldPos ? { x: Number(rightHandWorldPos.x.toFixed(3)), y: Number(rightHandWorldPos.y.toFixed(3)), z: Number(rightHandWorldPos.z.toFixed(3)) } : null,
        },
      });
    }
  }

  /**
   * Resets all rig bones back to their original bind pose quaternions and positions.
   */
  public resetToBindPose() {
    this.boneCache.forEach((cache, bone) => {
      bone.quaternion.copy(cache.initialLocalQuaternion);
      bone.position.copy(cache.initialLocalPosition);
    });
  }
}

