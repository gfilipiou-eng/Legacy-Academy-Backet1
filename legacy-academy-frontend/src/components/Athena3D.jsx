import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

function AthenaStatue({ color = "#FFD700" }) {
  const meshRef = useRef(null);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <group>
      {/* Main statue body - tapered cylinder */}
      <mesh
        ref={meshRef}
        position={[0, 0, 0]}
        castShadow
        receiveShadow
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <cylinderGeometry args={[0.5, 0.7, 2.5, 32]} />
        <meshStandardMaterial
          color={color}
          metalness={0.9}
          roughness={0.2}
          emissive={hovered ? "#ffaa00" : "#222200"}
          emissiveIntensity={hovered ? 0.4 : 0.1}
        />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.7, 0]} castShadow>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial
          color={color}
          metalness={0.9}
          roughness={0.2}
          emissive={hovered ? "#ffaa00" : "#222200"}
          emissiveIntensity={hovered ? 0.4 : 0.1}
        />
      </mesh>

      {/* Owl - Athena's symbol */}
      <group position={[0.6, 1.5, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.15, 32, 32]} />
          <meshStandardMaterial
            color="#ffffff"
            metalness={0.8}
            roughness={0.2}
            emissive={hovered ? "#ffffaa" : "#111111"}
            emissiveIntensity={hovered ? 0.3 : 0.05}
          />
        </mesh>
        {/* Owl eyes */}
        <mesh position={[0.05, 0.05, 0.14]}>
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
        <mesh position={[-0.05, 0.05, 0.14]}>
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
      </group>

      {/* Base / Pedestal */}
      <mesh position={[0, -1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.2, 1.5]} />
        <meshStandardMaterial
          color="#ffffff"
          metalness={0.7}
          roughness={0.3}
          emissive="#222222"
          emissiveIntensity={0.1}
        />
      </mesh>
    </group>
  );
}

function Scene() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate={true}
        autoRotateSpeed={0.5}
      />
      {/* Lights */}
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={1.5} color="#ffffff" />
      <pointLight position={[-5, 5, -5]} intensity={1} color="#ffd700" />
      <spotLight
        position={[0, 8, 0]}
        angle={0.5}
        penumbra={0.5}
        intensity={2}
        color="#ffd700"
        castShadow
      />
      {/* Background glow */}
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.2}>
        <AthenaStatue />
      </Float>
    </>
  );
}

export default function Athena3D({ className = '' }) {
  return (
    <div className={`w-full h-64 sm:h-80 ${className}`}>
      <Canvas shadows>
        <color attach="background" args={['#000000']} />
        <fog attach="fog" args={['#000000', 3, 10]} />
        <Scene />
      </Canvas>
    </div>
  );
}
