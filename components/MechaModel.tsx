import React, { useRef, useState } from 'react';
import { useGLTF, OrbitControls, primitive } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { HandTrackingState } from '../types';

// Import the mecha model
import mechaModelUrl from '../model_1766739770078.glb?url';

interface MechaModelProps {
  handTrackingRef: React.MutableRefObject<HandTrackingState>;
}

const MechaModel: React.FC<MechaModelProps> = ({ handTrackingRef }) => {
  // Load the GLTF model
  const { scene } = useGLTF(mechaModelUrl);
  
  // Create refs for animation
  const modelGroupRef = useRef<THREE.Group>(null);
  const rotationRef = useRef<THREE.Group>(null);
  
  // State for scaling and rotation
  const [scale, setScale] = useState(2.2);
  const [manualRotationY, setManualRotationY] = useState(0);
  
  // Use useFrame to animate the model
  useFrame((state, delta) => {
    const rightHand = handTrackingRef.current.rightHand;
    const leftHand = handTrackingRef.current.leftHand;
    
    // Handle scaling based on left hand expansion (open palm = bigger, closed fist = smaller)
    if (leftHand) {
      const { expansionFactor } = leftHand;
      
      // Smooth scaling: open palm (expansionFactor=1) scales to 3.5, closed fist (expansionFactor=0) scales to 1.5
      const targetScale = 1.5 + (expansionFactor * 2.0);
      setScale(prevScale => prevScale + (targetScale - prevScale) * 0.1);
    }
    
    // Handle manual rotation from right hand (rotationControl.x)
    if (rightHand) {
      const { rotationControl } = rightHand;
      const rotationSpeed = rotationControl.x * 0.1;
      setManualRotationY(prev => prev + rotationSpeed);
    }
    
    // Apply rotations - increased auto-rotation speed to 0.5 circles per second
    if (rotationRef.current) {
      // Combine auto-rotation and manual rotation
      rotationRef.current.rotation.y = manualRotationY + (state.clock.elapsedTime * 1.0);
    }
  });

  return (
    <group ref={modelGroupRef} scale={scale}>
      {/* Enable orbit controls for manual rotation */}
      <OrbitControls 
        enableZoom={true} 
        enablePan={true} 
        enableRotate={true} 
        autoRotate={false} // Disable OrbitControls' autoRotate to use our custom one
      />
      
      {/* Lighting setup */}
      <ambientLight intensity={0.5} color="#ffffff" />
      <directionalLight position={[10, 10, 10]} intensity={2} color="#00F0FF" castShadow />
      <directionalLight position={[-10, -10, -5]} intensity={1} color="#FF00FF" />
      <pointLight position={[0, 5, 0]} intensity={1} color="#ffffff" />
      
      {/* Rotating group */}
      <group ref={rotationRef}>
        {/* Use primitive component to safely render Three.js objects */}
        <primitive object={scene} castShadow receiveShadow />
      </group>
    </group>
  );
};

export default MechaModel;