import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  Environment,
  Float,
  MeshTransmissionMaterial,
  Sparkles,
  ContactShadows,
  Lightformer
} from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'

/* ---------- The hero refracting glass shape ---------- */
function GlassObject({ mouse }) {
  const mesh = useRef()
  const geometryRef = useRef()
  const materialRef = useRef()

  useEffect(() => () => {
    geometryRef.current?.dispose?.()
    materialRef.current?.dispose?.()
  }, [])

  useFrame((state, delta) => {
    if (!mesh.current) return
    // Slow autonomous spin
    mesh.current.rotation.x += delta * 0.08
    mesh.current.rotation.y += delta * 0.12
    // Mouse parallax tilt
    const targetX = mouse.current.x * 0.4
    const targetY = -mouse.current.y * 0.4
    mesh.current.position.x += (targetX - mesh.current.position.x) * 0.04
    mesh.current.position.y += (targetY - mesh.current.position.y) * 0.04
  })

  return (
    <Float speed={1.4} rotationIntensity={0.6} floatIntensity={1.6}>
      <mesh ref={mesh} scale={1.35}>
        <torusKnotGeometry ref={geometryRef} args={[0.9, 0.32, 220, 32]} />
        <MeshTransmissionMaterial
          ref={materialRef}
          backside
          backsideThickness={0.6}
          samples={6}
          resolution={512}
          transmission={1}
          roughness={0.06}
          thickness={1.1}
          ior={1.45}
          chromaticAberration={0.35}
          anisotropy={0.4}
          distortion={0.45}
          distortionScale={0.4}
          temporalDistortion={0.2}
          clearcoat={1}
          attenuationDistance={1.6}
          attenuationColor="#a78bfa"
          color="#ffffff"
        />
      </mesh>
    </Float>
  )
}

/* ---------- Background floating glass shards ---------- */
function FloatingShards() {
  const items = useMemo(
    () => [
      { p: [-3.2, 1.6, -2], s: 0.55, geo: 'ico', speed: 0.8 },
      { p: [3.4, -1.2, -2.4], s: 0.7, geo: 'oct', speed: 0.6 },
      { p: [-2.8, -1.8, -3], s: 0.45, geo: 'box', speed: 1.0 },
      { p: [2.6, 1.9, -3.2], s: 0.5, geo: 'tet', speed: 0.9 },
      { p: [0, 2.4, -4], s: 0.4, geo: 'ico', speed: 1.1 }
    ],
    []
  )

  return items.map((it, i) => (
    <Shard key={i} {...it} />
  ))
}

function Shard({ p, s, geo, speed }) {
  const geometryRef = useRef()
  const materialRef = useRef()

  useEffect(() => () => {
    geometryRef.current?.dispose?.()
    materialRef.current?.dispose?.()
  }, [])

  return (
    <Float speed={speed} rotationIntensity={1.2} floatIntensity={2.2}>
      <mesh position={p} scale={s}>
        {geo === 'ico' && <icosahedronGeometry ref={geometryRef} args={[1, 0]} />}
        {geo === 'oct' && <octahedronGeometry ref={geometryRef} args={[1, 0]} />}
        {geo === 'box' && <boxGeometry ref={geometryRef} args={[1, 1, 1]} />}
        {geo === 'tet' && <tetrahedronGeometry ref={geometryRef} args={[1, 0]} />}
        <MeshTransmissionMaterial
          ref={materialRef}
          samples={6}
          resolution={512}
          transmission={1}
          roughness={0.15}
          thickness={0.5}
          ior={1.35}
          chromaticAberration={0.25}
          distortion={0.25}
          color="#dbe6ff"
          attenuationColor="#7c5cff"
          attenuationDistance={1.4}
        />
      </mesh>
    </Float>
  )
}

/* ---------- Studio lights for nice reflections on the glass ---------- */
function Lighting() {
  return (
    <Environment resolution={256}>
      <group rotation={[0, 0, 1]}>
        <Lightformer form="circle" intensity={3} position={[0, 5, -9]} scale={10} color="#60a5fa" />
        <Lightformer form="ring" intensity={2} position={[-5, 1, -4]} scale={6} color="#a78bfa" />
        <Lightformer form="rect" intensity={2.4} position={[5, -2, -4]} scale={8} color="#ec4899" />
        <Lightformer form="rect" intensity={1.6} position={[0, -5, 4]} scale={10} color="#ffffff" />
      </group>
    </Environment>
  )
}

export default function HeroScene({ mouse }) {
  // Cleanup any global listeners (e.g., mouse or scroll tracking) when the component unmounts
  useEffect(() => {
    const handleMouse = () => {}
    const handleScroll = () => {}
    window.addEventListener('mousemove', handleMouse)
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('mousemove', handleMouse)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])
  return (
    <Canvas
      dpr={[1, Math.min(window.devicePixelRatio, 1.5)]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, 5.5], fov: 35 }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <color attach="background" args={['#05060a']} />
      <fog attach="fog" args={['#05060a', 6, 14]} />

      <Suspense fallback={null}>
        <Lighting />
        <GlassObject mouse={mouse} />
        <FloatingShards />
        <Sparkles count={80} scale={[10, 6, 6]} size={2.5} speed={0.4} opacity={0.7} color="#a5b4fc" />
        <ContactShadows
          position={[0, -1.8, 0]}
          opacity={0.45}
          scale={10}
          blur={3}
          far={3.5}
          color="#000000"
        />
      </Suspense>

      <EffectComposer multisampling={0} disableNormalPass>
        <Bloom intensity={0.65} luminanceThreshold={0.35} luminanceSmoothing={0.4} mipmapBlur />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={new THREE.Vector2(0.0008, 0.0012)}
        />
        <Noise premultiply opacity={0.045} />
        <Vignette eskil={false} offset={0.2} darkness={0.85} />
      </EffectComposer>
    </Canvas>
  )
}
