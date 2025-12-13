import React, { useMemo, useRef, useState, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeMode } from '../types';

interface OrnamentsProps {
  mode: TreeMode;
  count: number;
}

type OrnamentType = 'ball' | 'gift' | 'light' | 'bell' | 'star' | 'candy' | 'snowflake' | 'wreath';

interface InstanceData {
  chaosPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  type: OrnamentType;
  color: THREE.Color;
  scale: number;
  speed: number;
  rotationOffset: THREE.Euler;
}

export const Ornaments: React.FC<OrnamentsProps> = ({ mode, count }) => {
  // We use 8 separate InstancedMeshes for different geometries/materials to reduce draw calls
  // but allow unique shapes.
  const ballsRef = useRef<THREE.InstancedMesh>(null);
  const giftsRef = useRef<THREE.InstancedMesh>(null);
  const lightsRef = useRef<THREE.InstancedMesh>(null);
  const bellsRef = useRef<THREE.InstancedMesh>(null);
  const starsRef = useRef<THREE.InstancedMesh>(null);
  const candiesRef = useRef<THREE.InstancedMesh>(null);
  const snowflakesRef = useRef<THREE.InstancedMesh>(null);
  const wreathsRef = useRef<THREE.InstancedMesh>(null);
  
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Generate data once
  const { ballsData, giftsData, lightsData, bellsData, starsData, candiesData, snowflakesData, wreathsData } = useMemo(() => {
    const _balls: InstanceData[] = [];
    const _gifts: InstanceData[] = [];
    const _lights: InstanceData[] = [];
    const _bells: InstanceData[] = [];
    const _stars: InstanceData[] = [];
    const _candies: InstanceData[] = [];
    const _snowflakes: InstanceData[] = [];
    const _wreaths: InstanceData[] = [];

    const height = 11; // Slightly smaller than foliage
    const maxRadius = 4.5;
    
    // Luxury Colors
    const gold = new THREE.Color("#D4AF37");
    const red = new THREE.Color("#8B0000"); // Dark Velvet Red
    const emerald = new THREE.Color("#004422");
    const whiteGold = new THREE.Color("#F5E6BF");
    
    const palette = [gold, red, gold, whiteGold];

    for (let i = 0; i < count; i++) {
      const rnd = Math.random();
      let type: OrnamentType;
      // Distribute evenly among 8 types (12.5% each)
      if (rnd < 0.125) type = 'ball';
      else if (rnd < 0.25) type = 'gift';
      else if (rnd < 0.375) type = 'light';
      else if (rnd < 0.5) type = 'bell';
      else if (rnd < 0.625) type = 'star';
      else if (rnd < 0.75) type = 'candy';
      else if (rnd < 0.875) type = 'snowflake';
      else type = 'wreath';

      // 1. Target Position (Spiral with heavy density at bottom)
      // Use power function to bias distribution toward bottom (lower yNorm values)
      const yNorm = Math.pow(Math.random(), 2.5); // Heavy concentration at bottom
      const y = yNorm * height + 0.5;
      const rScale = (1 - yNorm);
      const theta = y * 10 + Math.random() * Math.PI * 2; // Wind around
      
      // Push ornaments slightly outside the foliage radius
      const r = maxRadius * rScale + (Math.random() * 0.5);
      
      const targetPos = new THREE.Vector3(
        r * Math.cos(theta),
        y,
        r * Math.sin(theta)
      );

      // 2. Chaos Position
      const cR = 15 + Math.random() * 15;
      const cTheta = Math.random() * Math.PI * 2;
      const cPhi = Math.acos(2 * Math.random() - 1);
      const chaosPos = new THREE.Vector3(
        cR * Math.sin(cPhi) * Math.cos(cTheta),
        cR * Math.sin(cPhi) * Math.sin(cTheta) + 5,
        cR * Math.cos(cPhi)
      );

      let scale: number;
      let color: THREE.Color;

      switch (type) {
        case 'light':
          scale = 0.15;
          color = new THREE.Color("#FFFFAA");
          break;
        case 'bell':
          scale = 0.18 + Math.random() * 0.1;
          color = new THREE.Color("#FFD700"); // Gold bells
          break;
        case 'star':
          scale = 0.12 + Math.random() * 0.08;
          color = new THREE.Color("#FFFFFF"); // White/silver stars
          break;
        case 'candy':
          scale = 0.16 + Math.random() * 0.12;
          color = palette[Math.floor(Math.random() * palette.length)]; // Various candy colors
          break;
        case 'snowflake':
          scale = 0.14 + Math.random() * 0.08;
          color = new THREE.Color("#E6F3FF"); // Light blue-white snowflakes
          break;
        case 'wreath':
          scale = 0.2 + Math.random() * 0.15;
          color = new THREE.Color("#228B22"); // Forest green wreaths
          break;
        default: // ball, gift
          scale = 0.2 + Math.random() * 0.25;
          color = palette[Math.floor(Math.random() * palette.length)];
      }

      const data: InstanceData = {
        chaosPos,
        targetPos,
        type,
        color,
        scale,
        speed: 0.5 + Math.random() * 1.5, // Random speed for physics feel
        rotationOffset: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0)
      };

      switch (type) {
        case 'ball':
          _balls.push(data);
          break;
        case 'gift':
          _gifts.push(data);
          break;
        case 'light':
          _lights.push(data);
          break;
        case 'bell':
          _bells.push(data);
          break;
        case 'star':
          _stars.push(data);
          break;
        case 'candy':
          _candies.push(data);
          break;
        case 'snowflake':
          _snowflakes.push(data);
          break;
        case 'wreath':
          _wreaths.push(data);
          break;
      }
    }

    return {
      ballsData: _balls,
      giftsData: _gifts,
      lightsData: _lights,
      bellsData: _bells,
      starsData: _stars,
      candiesData: _candies,
      snowflakesData: _snowflakes,
      wreathsData: _wreaths
    };
  }, [count]);

  useLayoutEffect(() => {
    // Set initial colors
    [
      { ref: ballsRef, data: ballsData },
      { ref: giftsRef, data: giftsData },
      { ref: lightsRef, data: lightsData },
      { ref: bellsRef, data: bellsData },
      { ref: starsRef, data: starsData },
      { ref: candiesRef, data: candiesData },
      { ref: snowflakesRef, data: snowflakesData },
      { ref: wreathsRef, data: wreathsData }
    ].forEach(({ ref, data }) => {
      if (ref.current) {
        data.forEach((d, i) => {
          ref.current!.setColorAt(i, d.color);
        });
        ref.current.instanceColor!.needsUpdate = true;
      }
    });
  }, [ballsData, giftsData, lightsData, bellsData, starsData, candiesData, snowflakesData, wreathsData]);

  useFrame((state, delta) => {
    const isFormed = mode === TreeMode.FORMED;
    const time = state.clock.elapsedTime;

    // Helper to update a mesh ref
    const updateMesh = (ref: React.RefObject<THREE.InstancedMesh>, data: InstanceData[]) => {
      if (!ref.current) return;

      let needsUpdate = false;

      data.forEach((d, i) => {
        const dest = isFormed ? d.targetPos : d.chaosPos;

        ref.current!.getMatrixAt(i, dummy.matrix);
        dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
        
        const step = delta * d.speed;
        dummy.position.lerp(dest, step);

        // Add wobble when formed
        if (isFormed && dummy.position.distanceTo(d.targetPos) < 0.5) {
          dummy.position.y += Math.sin(time * 2 + d.chaosPos.x) * 0.002;
        }

        // Rotation
        switch (d.type) {
          case 'gift':
            dummy.rotation.x += delta * 0.5;
            dummy.rotation.y += delta * 0.2;
            break;
          case 'bell':
            // Bells swing gently
            dummy.rotation.z = Math.sin(time * 2 + d.chaosPos.x) * 0.1;
            break;
          case 'snowflake':
            // Snowflakes rotate slowly
            dummy.rotation.y += delta * 0.3;
            dummy.rotation.x += delta * 0.1;
            break;
          case 'star':
            // Stars twinkle and rotate
            dummy.rotation.y += delta * 0.2;
            break;
          case 'candy':
            // Candies spin occasionally
            dummy.rotation.y += delta * 0.8;
            break;
          case 'wreath':
            // Wreaths are mostly static but sway slightly
            dummy.rotation.z = Math.sin(time * 1.5 + d.chaosPos.y) * 0.05;
            break;
          default: // ball, light
            // Balls face out
            dummy.lookAt(0, dummy.position.y, 0);
        }

        dummy.scale.setScalar(d.scale);
        if (d.type === 'light') {
           // Pulsate lights
           const pulse = 1 + Math.sin(time * 5 + d.chaosPos.y) * 0.3;
           dummy.scale.multiplyScalar(pulse);
        } else if (d.type === 'star') {
          // Stars twinkle
          const twinkle = 1 + Math.sin(time * 8 + d.chaosPos.x) * 0.2;
          dummy.scale.multiplyScalar(twinkle);
        }

        dummy.updateMatrix();
        ref.current!.setMatrixAt(i, dummy.matrix);
        needsUpdate = true;
      });

      if (needsUpdate) ref.current.instanceMatrix.needsUpdate = true;
    };

    updateMesh(ballsRef, ballsData);
    updateMesh(giftsRef, giftsData);
    updateMesh(lightsRef, lightsData);
    updateMesh(bellsRef, bellsData);
    updateMesh(starsRef, starsData);
    updateMesh(candiesRef, candiesData);
    updateMesh(snowflakesRef, snowflakesData);
    updateMesh(wreathsRef, wreathsData);
  });

  return (
    <>
      {/* Balls: High Gloss Gold/Red */}
      <instancedMesh ref={ballsRef} args={[undefined, undefined, ballsData.length]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          roughness={0.1}
          metalness={0.9}
          envMapIntensity={1.5}
        />
      </instancedMesh>

      {/* Gifts: Cubes with ribbons (simplified as cubes) */}
      <instancedMesh ref={giftsRef} args={[undefined, undefined, giftsData.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          roughness={0.3}
          metalness={0.5}
          color="#white" // Tinted by instance color
        />
      </instancedMesh>

      {/* Lights: Emissive small spheres */}
      <instancedMesh ref={lightsRef} args={[undefined, undefined, lightsData.length]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial
          emissive="white"
          emissiveIntensity={2}
          toneMapped={false}
          color="white" // Tinted by instance color (yellowish)
        />
      </instancedMesh>

      {/* Bells: Bell-shaped geometry */}
      <instancedMesh ref={bellsRef} args={[undefined, undefined, bellsData.length]}>
        <cylinderGeometry args={[0.3, 0.8, 1, 16]} />
        <meshStandardMaterial
          roughness={0.2}
          metalness={0.95}
          color="#FFD700"
          envMapIntensity={2}
        />
      </instancedMesh>

      {/* Stars: Star-shaped geometry */}
      <instancedMesh ref={starsRef} args={[undefined, undefined, starsData.length]}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          roughness={0.1}
          metalness={0.8}
          color="#FFFFFF"
          emissive="#FFFFFF"
          emissiveIntensity={0.3}
          envMapIntensity={1.8}
        />
      </instancedMesh>

      {/* Candies: Candy cane shaped (simplified as curved cylinders) */}
      <instancedMesh ref={candiesRef} args={[undefined, undefined, candiesData.length]}>
        <cylinderGeometry args={[0.1, 0.1, 1.2, 8]} />
        <meshStandardMaterial
          roughness={0.4}
          metalness={0.1}
          envMapIntensity={0.8}
        />
      </instancedMesh>

      {/* Snowflakes: Complex flat geometry */}
      <instancedMesh ref={snowflakesRef} args={[undefined, undefined, snowflakesData.length]}>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial
          roughness={0.2}
          metalness={0.3}
          color="#E6F3FF"
          transparent
          opacity={0.8}
          side={2}
          envMapIntensity={1.2}
        />
      </instancedMesh>

      {/* Wreaths: Ring-shaped geometry */}
      <instancedMesh ref={wreathsRef} args={[undefined, undefined, wreathsData.length]}>
        <torusGeometry args={[0.8, 0.2, 8, 16]} />
        <meshStandardMaterial
          roughness={0.6}
          metalness={0.2}
          color="#228B22"
          envMapIntensity={0.9}
        />
      </instancedMesh>
    </>
  );
};