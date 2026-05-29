import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, Float, MeshTransmissionMaterial, Lightformer } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'

export default function SectionScene({ shape = 'sphere', tint = '#60a5fa' }) {
  return (
    <Canvas
      dpr={[1, 1.6]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, 4.5], fov: 35 }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <Suspense fallback={null}>
        <Environment resolution={128}>
          <Lightformer form="circle" intensity={2.5} position={[0, 4, -6]} scale={8} color={tint} />
          <Lightformer form="rect" intensity={1.8} position={[-4, 0, -3]} scale={6} color="#ec4899" />
          <Lightformer form="rect" intensity={1.8} position={[4, 0, -3]} scale={6} color="#a78bfa" />
        </Environment>

        <Float speed={1.1} rotationIntensity={0.5} floatIntensity={1.4}>
          <mesh scale={1.4}>
            {shape === 'sphere' && <sphereGeometry args={[1, 64, 64]} />}
            {shape === 'torus' && <torusGeometry args={[0.9, 0.35, 64, 128]} />}
            {shape === 'ico' && <icosahedronGeometry args={[1.1, 1]} />}
            <MeshTransmissionMaterial
              samples={6}
              resolution={256}
              transmission={1}
              roughness={0.08}
              thickness={1}
              ior={1.4}
              chromaticAberration={0.3}
              distortion={0.35}
              color="#ffffff"
              attenuationColor={tint}
              attenuationDistance={1.6}
            />
          </mesh>
        </Float>
      </Suspense>

      <EffectComposer multisampling={0} disableNormalPass>
        <Bloom intensity={0.6} luminanceThreshold={0.4} luminanceSmoothing={0.4} mipmapBlur />
      </EffectComposer>
    </Canvas>
  )
}
