/**
 * Fight Mecca Parametric Morph Engine
 * Applies independent skeletal scaling, muscular regional scaling, and fat/volume deformation.
 * BONE LENGTH != MUSCLE SIZE != FAT VOLUME.
 */

import * as THREE from 'three';
import { AthleteBodyProfile } from './body-profile';
import { FightMeccaHumanoidRig } from './humanoid-rig';

export class AvatarMorphEngine {
  private rootObject: THREE.Object3D;
  private rig: FightMeccaHumanoidRig;
  private meshes: Map<string, THREE.SkinnedMesh> = new Map();

  constructor(rootObject: THREE.Object3D, rig: FightMeccaHumanoidRig) {
    this.rootObject = rootObject;
    this.rig = rig;
    this.indexMeshes();
  }

  private indexMeshes() {
    this.rootObject.traverse((child) => {
      if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
        this.meshes.set(child.name, child as THREE.SkinnedMesh);
      }
    });
  }

  /**
   * Applies an AthleteBodyProfile to deform the avatar model.
   */
  public applyBodyProfile(profile: AthleteBodyProfile) {
    if (!profile) return;

    // 1. Skeletal Morphology (Bone lengths & scale)
    const sk = profile.skeleton;
    const baseHeight = 175; // reference baseline height (cm)
    const globalScale = sk.heightCm / baseHeight;

    // Overall character root scale
    this.rootObject.scale.set(globalScale, globalScale, globalScale);

    // Shoulder & Hip Width adjustments via bone scaling
    if (this.rig.leftClavicle && this.rig.rightClavicle && sk.shoulderWidthRatio) {
      const sw = sk.shoulderWidthRatio;
      this.rig.leftClavicle.scale.set(sw, 1, 1);
      this.rig.rightClavicle.scale.set(sw, 1, 1);
    }

    if (this.rig.leftThigh && this.rig.rightThigh && sk.femurLengthRatio) {
      const fl = sk.femurLengthRatio;
      this.rig.leftThigh.scale.set(1, fl, 1);
      this.rig.rightThigh.scale.set(1, fl, 1);
    }

    if (this.rig.leftShin && this.rig.rightShin && sk.tibiaLengthRatio) {
      const tl = sk.tibiaLengthRatio;
      this.rig.leftShin.scale.set(1, tl, 1);
      this.rig.rightShin.scale.set(1, tl, 1);
    }

    if (this.rig.leftUpperArm && this.rig.rightUpperArm && sk.upperArmLengthRatio) {
      const ual = sk.upperArmLengthRatio;
      this.rig.leftUpperArm.scale.set(1, ual, 1);
      this.rig.rightUpperArm.scale.set(1, ual, 1);
    }

    // 2. Muscular & Fat Morphology (Regional Mesh Deformation)
    const reg = profile.regional;

    // Scale upper arms, forearms, chest, thighs, calves bones regionally
    if (this.rig.leftUpperArm && this.rig.rightUpperArm) {
      const armMuscle = reg.upperArms;
      this.rig.leftUpperArm.scale.x = armMuscle;
      this.rig.leftUpperArm.scale.z = armMuscle;
      this.rig.rightUpperArm.scale.x = armMuscle;
      this.rig.rightUpperArm.scale.z = armMuscle;
    }

    if (this.rig.leftForearm && this.rig.rightForearm) {
      const forearmMuscle = reg.forearms;
      this.rig.leftForearm.scale.x = forearmMuscle;
      this.rig.leftForearm.scale.z = forearmMuscle;
      this.rig.rightForearm.scale.x = forearmMuscle;
      this.rig.rightForearm.scale.z = forearmMuscle;
    }

    if (this.rig.chest) {
      const chestVolume = (reg.chest + reg.shoulders) / 2;
      this.rig.chest.scale.x = chestVolume;
      this.rig.chest.scale.z = chestVolume;
    }

    if (this.rig.spine) {
      const waistVolume = reg.waist;
      this.rig.spine.scale.x = waistVolume;
      this.rig.spine.scale.z = waistVolume;
    }

    // Mesh Visibility toggles according to variant selection
    const m1 = this.meshes.get('muscle_anatomy_1');
    const m2 = this.meshes.get('muscle_anatomy_2');
    const skMesh = this.meshes.get('skeleton');

    // If highly muscular profile, blend/show muscle_anatomy_2
    const isHighlyMuscular = (reg.shoulders > 1.2 || reg.upperArms > 1.2);

    if (m1) m1.visible = !isHighlyMuscular;
    if (m2) m2.visible = isHighlyMuscular;
    if (skMesh) skMesh.visible = false; // Default to anatomical muscle renderer
  }

  /**
   * Directly sets mesh variant visibility (e.g. for debugging/inspection).
   */
  public setMeshVariantVisibility(variant: 'muscle_1' | 'muscle_2' | 'skeleton' | 'all') {
    const m1 = this.meshes.get('muscle_anatomy_1');
    const m2 = this.meshes.get('muscle_anatomy_2');
    const skMesh = this.meshes.get('skeleton');

    if (variant === 'muscle_1') {
      if (m1) m1.visible = true;
      if (m2) m2.visible = false;
      if (skMesh) skMesh.visible = false;
    } else if (variant === 'muscle_2') {
      if (m1) m1.visible = false;
      if (m2) m2.visible = true;
      if (skMesh) skMesh.visible = false;
    } else if (variant === 'skeleton') {
      if (m1) m1.visible = false;
      if (m2) m2.visible = false;
      if (skMesh) skMesh.visible = true;
    } else {
      if (m1) m1.visible = true;
      if (m2) m2.visible = true;
      if (skMesh) skMesh.visible = true;
    }
  }
}
