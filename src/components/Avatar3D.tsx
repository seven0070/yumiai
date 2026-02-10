import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

export interface Avatar3DRef {
  triggerMouthMovement: (duration: number) => void;
  speak: (duration: number) => void;
}

interface Avatar3DProps {
  onLoad?: () => void;
  onMouthMove?: (isMoving: boolean) => void;
  onMouthAnimation?: (intensity: number) => void;
}

export const Avatar3D = forwardRef<Avatar3DRef, Avatar3DProps>(
  ({ onLoad, onMouthMove, onMouthAnimation }, ref) => {
    const groupRef = useRef<THREE.Group>(null);
    const { scene } = useGLTF('/fantasy-female-character.glb');
    
    const [eyeMeshes, setEyeMeshes] = useState<THREE.Mesh[]>([]);
    const [originalEyeScales, setOriginalEyeScales] = useState<THREE.Vector3[]>([]);
    const [mouthMesh, setMouthMesh] = useState<THREE.Mesh | null>(null);
    const [originalMouthScale, setOriginalMouthScale] = useState<THREE.Vector3 | null>(null);
    
    const blinkStateRef = useRef({
      isBlinking: false,
      lastBlinkTime: performance.now(),
      blinkStartTime: 0,
      blinkDuration: 150,
      blinkInterval: 4500
    });

    const mouthAnimationRef = useRef({
      isSpeaking: false,
      speakEndTime: 0,
      currentIntensity: 0,
      targetIntensity: 0
    });

    useEffect(() => {
      if (!scene) return;

      const clonedScene = scene.clone(true);
      
      // Auto-center and scale model
      const box = new THREE.Box3().setFromObject(clonedScene);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2.5 / maxDim;
      
      clonedScene.scale.setScalar(scale);
      clonedScene.position.sub(center.multiplyScalar(scale));
      clonedScene.position.y -= size.y * scale * 0.1;
      
      if (groupRef.current) {
        groupRef.current.clear();
        groupRef.current.add(clonedScene);
      }

      // Find eye meshes
      const foundEyes: THREE.Mesh[] = [];
      const eyeScales: THREE.Vector3[] = [];
      
      clonedScene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const name = child.name.toLowerCase();
          
          // Search for eye meshes (Tripo nodes or by name patterns)
          if (name.includes('eye') || name.includes('eyelid') || name.includes('lid')) {
            foundEyes.push(child);
            eyeScales.push(child.scale.clone());
            console.log('Found eye mesh:', child.name);
          }
          
          // Search for mouth mesh
          if (name.includes('mouth') || name.includes('lip') || name.includes('jaw')) {
            if (!mouthMesh) {
              setMouthMesh(child);
              setOriginalMouthScale(child.scale.clone());
              console.log('Found mouth mesh:', child.name);
            }
          }
        }
      });

      // Heuristic eye detection fallback
      if (foundEyes.length === 0) {
        console.warn('No eye meshes found by name. Attempting heuristic detection...');
        
        clonedScene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const geometry = child.geometry;
            if (geometry && geometry.boundingBox) {
              geometry.computeBoundingBox();
              const bbox = geometry.boundingBox!;
              const meshSize = new THREE.Vector3();
              bbox.getSize(meshSize);
              
              const worldPos = new THREE.Vector3();
              child.getWorldPosition(worldPos);
              
              const isSmallEnough = meshSize.length() < 0.5;
              const isNearFace = worldPos.y > 0 && Math.abs(worldPos.x) < 1;
              
              if (isSmallEnough && isNearFace && foundEyes.length < 10) {
                foundEyes.push(child);
                eyeScales.push(child.scale.clone());
                console.log('Found potential eye mesh via heuristic:', child.name);
              }
            }
          }
        });
      }

      setEyeMeshes(foundEyes);
      setOriginalEyeScales(eyeScales);
      
      if (foundEyes.length > 0) {
        console.log(`Avatar3D initialized with ${foundEyes.length} eye meshes for blinking`);
      } else {
        console.warn('Avatar3D: No eye meshes found - blinking disabled');
      }
      
      onLoad?.();
    }, [scene, onLoad]);

    // Blink animation using useFrame and performance.now()
    useFrame((state) => {
      if (!groupRef.current) return;

      // Subtle idle rotation
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;

      const now = performance.now();
      const blinkState = blinkStateRef.current;

      // Auto-blink every 4.5 seconds
      if (!blinkState.isBlinking && (now - blinkState.lastBlinkTime) > blinkState.blinkInterval) {
        blinkState.isBlinking = true;
        blinkState.blinkStartTime = now;
        blinkState.lastBlinkTime = now;
      }

      if (blinkState.isBlinking) {
        const elapsed = now - blinkState.blinkStartTime;
        const progress = Math.min(elapsed / blinkState.blinkDuration, 1);
        
        // Scale Y-axis to 0.1 at peak blink
        const blinkAmount = progress < 0.5 
          ? 1 - (progress * 2 * 0.9)  // Close
          : 0.1 + ((progress - 0.5) * 2 * 0.9);  // Open

        eyeMeshes.forEach((mesh, index) => {
          if (originalEyeScales[index]) {
            mesh.scale.y = originalEyeScales[index].y * Math.max(0.1, blinkAmount);
          }
        });

        if (progress >= 1) {
          blinkState.isBlinking = false;
          eyeMeshes.forEach((mesh, index) => {
            if (originalEyeScales[index]) {
              mesh.scale.copy(originalEyeScales[index]);
            }
          });
        }
      }

      // Mouth animation
      const mouthAnim = mouthAnimationRef.current;
      
      // Check if speaking period ended
      if (mouthAnim.isSpeaking && now > mouthAnim.speakEndTime) {
        mouthAnim.isSpeaking = false;
        mouthAnim.targetIntensity = 0;
        onMouthMove?.(false);
      }
      
      // Smooth interpolation of mouth intensity
      mouthAnim.currentIntensity += (mouthAnim.targetIntensity - mouthAnim.currentIntensity) * 0.1;
      
      // Apply mouth animation using scale fallback (no morph targets)
      if (mouthMesh && originalMouthScale && mouthAnim.currentIntensity > 0.01) {
        const openAmount = 1 + (mouthAnim.currentIntensity * 0.3);
        mouthMesh.scale.y = originalMouthScale.y * openAmount;
        
        // Add some randomness for natural movement
        const jitter = Math.sin(state.clock.elapsedTime * 20) * 0.05 * mouthAnim.currentIntensity;
        mouthMesh.scale.x = originalMouthScale.x * (1 + jitter);
      } else if (mouthMesh && originalMouthScale) {
        // Reset to original scale
        mouthMesh.scale.copy(originalMouthScale);
      }
      
      onMouthAnimation?.(mouthAnim.currentIntensity);
    });

    // Expose triggerMouthMovement function via ref
    const triggerMouthMovement = (duration: number) => {
      const mouthAnim = mouthAnimationRef.current;
      mouthAnim.isSpeaking = true;
      mouthAnim.speakEndTime = performance.now() + duration;
      mouthAnim.targetIntensity = 0.8;
      onMouthMove?.(true);
    };

    // Alias for consistency
    const speak = (duration: number) => {
      triggerMouthMovement(duration);
    };

    useImperativeHandle(ref, () => ({
      triggerMouthMovement,
      speak
    }));

    // Global access for RikoService integration
    useEffect(() => {
      (window as any).__triggerMouthAnimation = triggerMouthMovement;
      
      return () => {
        delete (window as any).__triggerMouthAnimation;
      };
    }, []);

    return <group ref={groupRef} />;
  }
);

Avatar3D.displayName = 'Avatar3D';

useGLTF.preload('/fantasy-female-character.glb');
