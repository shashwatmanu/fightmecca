/**
 * Fight Mecca Humanoid Rig Adapter
 * Decouples canonical motion retargeting logic from third-party GLB/FBX bone names.
 */

import * as THREE from 'three';

export interface FightMeccaHumanoidRig {
  pelvis?: THREE.Bone;
  spine?: THREE.Bone;
  chest?: THREE.Bone;
  neck?: THREE.Bone;
  head?: THREE.Bone;

  leftClavicle?: THREE.Bone;
  leftUpperArm?: THREE.Bone;
  leftForearm?: THREE.Bone;
  leftHand?: THREE.Bone;

  rightClavicle?: THREE.Bone;
  rightUpperArm?: THREE.Bone;
  rightForearm?: THREE.Bone;
  rightHand?: THREE.Bone;

  leftThigh?: THREE.Bone;
  leftShin?: THREE.Bone;
  leftFoot?: THREE.Bone;

  rightThigh?: THREE.Bone;
  rightShin?: THREE.Bone;
  rightFoot?: THREE.Bone;
}

export type RigBoneName = keyof FightMeccaHumanoidRig;

/**
 * Mapping table from canonical rig semantic keys to asset-specific bone names.
 * Discovered from assets/avatar-source/All_GLB.glb inspection.
 */
export const METARIG_ASSET_MAP: Record<RigBoneName, string[]> = {
  pelvis: ['spine', 'pelvis', 'root'],
  spine: ['spine.001', 'spine_01', 'spine'],
  chest: ['spine.003', 'spine.002', 'chest'],
  neck: ['spine.005', 'spine.004', 'neck'],
  head: ['spine.006', 'head'],

  leftClavicle: ['shoulder.L', 'clavicle.L', 'shoulder_l'],
  leftUpperArm: ['upper_arm.L', 'upperarm.L', 'upperarm_l'],
  leftForearm: ['forearm.L', 'lowerarm.L', 'forearm_l'],
  leftHand: ['hand.L', 'wrist.L', 'hand_l'],

  rightClavicle: ['shoulder.R', 'clavicle.R', 'shoulder_r'],
  rightUpperArm: ['upper_arm.R', 'upperarm.R', 'upperarm_r'],
  rightForearm: ['forearm.R', 'lowerarm.R', 'forearm_r'],
  rightHand: ['hand.R', 'wrist.R', 'hand_r'],

  leftThigh: ['thigh.L', 'upperleg.L', 'thigh_l'],
  leftShin: ['shin.L', 'lowerleg.L', 'shin_l'],
  leftFoot: ['foot.L', 'ankle.L', 'foot_l'],

  rightThigh: ['thigh.R', 'upperleg.R', 'thigh_r'],
  rightShin: ['shin.R', 'lowerleg.R', 'shin_r'],
  rightFoot: ['foot.R', 'ankle.R', 'foot_r'],
};

/**
 * Maps a Three.js Object3D root (e.g. GLTF scene) into a semantic FightMeccaHumanoidRig.
 */
export function buildHumanoidRig(
  root: THREE.Object3D,
  customMap: Record<RigBoneName, string[]> = METARIG_ASSET_MAP
): { rig: FightMeccaHumanoidRig; mappedCount: number; unmapped: RigBoneName[] } {
  const rig: FightMeccaHumanoidRig = {};
  const unmapped: RigBoneName[] = [];
  let mappedCount = 0;

  // Index all bones by name (case-insensitive & literal)
  const boneMap = new Map<string, THREE.Bone>();
  root.traverse((child) => {
    if ((child as THREE.Bone).isBone || child.type === 'Bone') {
      boneMap.set(child.name.toLowerCase(), child as THREE.Bone);
      boneMap.set(child.name, child as THREE.Bone);
    }
  });

  const semanticKeys = Object.keys(customMap) as RigBoneName[];

  for (const key of semanticKeys) {
    const candidates = customMap[key] || [];
    let foundBone: THREE.Bone | undefined = undefined;

    for (const cand of candidates) {
      if (boneMap.has(cand)) {
        foundBone = boneMap.get(cand);
        break;
      }
      if (boneMap.has(cand.toLowerCase())) {
        foundBone = boneMap.get(cand.toLowerCase());
        break;
      }
    }

    if (foundBone) {
      rig[key] = foundBone;
      mappedCount++;
    } else {
      unmapped.push(key);
    }
  }

  return { rig, mappedCount, unmapped };
}
