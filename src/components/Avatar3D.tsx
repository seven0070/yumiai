import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface Avatar3DProps {
  onMouthAnimation?: (intensity: number) => void;
}

export const Avatar3D: React.FC<Avatar3DProps> = ({ onMouthAnimation }) => {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/fantasy-female-character.glb');
  
  const [eyeMeshes, setEyeMeshes] = useState<THREE.Mesh[]>([]);
  const [originalEyeScales, setOriginalEyeScales] = useState<THREE.Vector3[]>([]);
  
  const blinkStateRef = useRef({
    isBlinking: false,
    lastBlinkTime: performance.now(),
    blinkStartTime: 0,
    blinkDuration: 150,
    blinkInterval: 4500
  });

  const mouthAnimationRef = useRef({
    currentIntensity: 0,
    targetIntensity: 0
  });

  useEffect(() => {
    if (!scene) return;

    const clonedScene = scene.clone(true);
    
    const box = new THREE.Box3().setFromObject(clonedScene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2.5 / maxDim;
    
    clonedScene.scale.setScalar(scale);
    clonedScene.position.sub(center.multiplyScalar(scale));
    clonedScene.position.y -= size.y * scale * 0.1;
    
    if (group.current) {
      group.current.clear();
      group.current.add(clonedScene);
    }

    const foundEyes: THREE.Mesh[] = [];
    const scales: THREE.Vector3[] = [];
    
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const name = child.name.toLowerCase();
        
        if (name.includes('eye') || name.includes('eyelid') || name.includes('lid')) {
          foundEyes.push(child);
          scales.push(child.scale.clone());
          console.log('Found eye mesh:', child.name);
        }
      }
    });

    if (foundEyes.length === 0) {
      console.warn('No eye meshes found by name. Attempting heuristic detection...');
      
      clonedScene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const geometry = child.geometry;
          if (geometry && geometry.boundingBox) {
            geometry.computeBoundingBox();
            const bbox = geometry.boundingBox!;
            const size = new THREE.Vector3();
            bbox.getSize(size);
            
            const worldPos = new THREE.Vector3();
            child.getWorldPosition(worldPos);
            
            const isSmallEnough = size.length() < 0.5;
            const isNearFace = worldPos.y > 0 && Math.abs(worldPos.x) < 1;
            
            if (isSmallEnough && isNearFace && foundEyes.length < 10) {
              foundEyes.push(child);
              scales.push(child.scale.clone());
              console.log('Found potential eye mesh via heuristic:', child.name);
            }
          }
        }
      });
    }

    setEyeMeshes(foundEyes);
    setOriginalEyeScales(scales);
    
    if (foundEyes.length > 0) {
      console.log(`Avatar3D initialized with ${foundEyes.length} eye meshes for blinking`);
    } else {
      console.warn('Avatar3D: No eye meshes found - blinking disabled');
    }
  }, [scene]);

  useFrame((state) => {
    if (!group.current) return;

    group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;

    const now = performance.now();
    const blinkState = blinkStateRef.current;

    if (!blinkState.isBlinking && (now - blinkState.lastBlinkTime) > blinkState.blinkInterval) {
      blinkState.isBlinking = true;
      blinkState.blinkStartTime = now;
      blinkState.lastBlinkTime = now;
    }

    if (blinkState.isBlinking) {
      const elapsed = now - blinkState.blinkStartTime;
      const progress = Math.min(elapsed / blinkState.blinkDuration, 1);
      
      const blinkAmount = progress < 0.5 
        ? 1 - (progress * 2) 
        : (progress - 0.5) * 2;

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

    const mouthAnim = mouthAnimationRef.current;
    mouthAnim.currentIntensity += (mouthAnim.targetIntensity - mouthAnim.currentIntensity) * 0.1;
  });

  const triggerMouthAnimation = (intensity: number) => {
    mouthAnimationRef.current.targetIntensity = intensity;
    onMouthAnimation?.(intensity);
  };

  useEffect(() => {
    (window as any).__triggerMouthAnimation = triggerMouthAnimation;
    
    return () => {
      delete (window as any).__triggerMouthAnimation;
    };
  }, [onMouthAnimation]);

  return <group ref={group} />;
};

useGLTF.preload('/fantasy-female-character.glb');
