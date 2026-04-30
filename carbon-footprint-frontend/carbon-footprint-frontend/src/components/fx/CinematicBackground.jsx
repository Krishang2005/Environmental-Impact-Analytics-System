import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Sphere, Torus } from '@react-three/drei'
import { gsap } from 'gsap'

function ParticleField() {
  const pointsRef = useRef(null)
  const particles = useMemo(() => {
    const count = 1400
    const positions = new Float32Array(count * 3)
    const scales = new Float32Array(count)

    for (let i = 0; i < count; i += 1) {
      const i3 = i * 3
      positions[i3] = (Math.random() - 0.5) * 24
      positions[i3 + 1] = (Math.random() - 0.5) * 16
      positions[i3 + 2] = (Math.random() - 0.5) * 16
      scales[i] = Math.random() * 1.2
    }

    return { positions, scales }
  }, [])

  useFrame(({ clock }) => {
    if (!pointsRef.current) return
    pointsRef.current.rotation.y = clock.getElapsedTime() * 0.015
    pointsRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.07) * 0.05
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.positions.length / 3}
          array={particles.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#34d399" transparent opacity={0.45} depthWrite={false} />
    </points>
  )
}

function OrbitalShapes() {
  const groupRef = useRef(null)

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = clock.getElapsedTime() * 0.05
    groupRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.14) * 0.1
  })

  return (
    <group ref={groupRef} position={[2.2, 0.2, -2.2]}>
      <Float speed={1.6} rotationIntensity={0.35} floatIntensity={0.75}>
        <group>
          <Sphere args={[1.1, 44, 44]}>
            <meshStandardMaterial color="#065f46" emissive="#10b981" emissiveIntensity={0.3} transparent opacity={0.28} />
          </Sphere>
          <Sphere args={[1.18, 36, 36]}>
            <meshBasicMaterial color="#6ee7b7" wireframe transparent opacity={0.16} />
          </Sphere>
        </group>
      </Float>
      <Float speed={1.2} rotationIntensity={0.8} floatIntensity={0.4}>
        <Torus args={[1.9, 0.06, 22, 120]} rotation={[Math.PI / 2.8, 0, 0]}>
          <meshStandardMaterial color="#2dd4bf" emissive="#2dd4bf" emissiveIntensity={0.45} transparent opacity={0.6} />
        </Torus>
      </Float>
      <Float speed={1.35} rotationIntensity={0.5} floatIntensity={0.45}>
        <Torus args={[1.52, 0.038, 18, 110]} rotation={[Math.PI / 1.95, 0, Math.PI / 3]}>
          <meshStandardMaterial color="#84cc16" emissive="#34d399" emissiveIntensity={0.4} transparent opacity={0.38} />
        </Torus>
      </Float>
      <Float speed={1.1} rotationIntensity={0.25} floatIntensity={0.4}>
        <group position={[-1.75, -0.9, -0.5]} rotation={[0.15, 0.25, -0.45]}>
          <Sphere args={[0.26, 20, 20]} scale={[0.72, 1.55, 0.6]}>
            <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.45} transparent opacity={0.42} />
          </Sphere>
          <Sphere args={[0.14, 14, 14]} position={[0.14, -0.08, 0.04]} scale={[0.42, 1.2, 0.46]}>
            <meshStandardMaterial color="#99f6e4" emissive="#2dd4bf" emissiveIntensity={0.3} transparent opacity={0.34} />
          </Sphere>
        </group>
      </Float>
    </group>
  )
}

function Lighting() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight color="#34d399" position={[6, 5, 3]} intensity={1.2} />
      <pointLight color="#14b8a6" position={[-5, -3, 2]} intensity={1.1} />
      <pointLight color="#84cc16" position={[2, 2, -5]} intensity={0.55} />
      <fog attach="fog" args={['#04120d', 8, 24]} />
    </>
  )
}

function MouseGlowLayer() {
  const glowRef = useRef(null)

  useEffect(() => {
    if (!glowRef.current) return undefined

    const node = glowRef.current
    const xTo = gsap.quickTo(node, 'left', { duration: 0.4, ease: 'power2.out' })
    const yTo = gsap.quickTo(node, 'top', { duration: 0.4, ease: 'power2.out' })

    const onMove = (event) => {
      xTo(event.clientX - 160)
      yTo(event.clientY - 160)
    }

    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  return (
    <div
      ref={glowRef}
      className="pointer-events-none fixed z-[1] h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.22),rgba(13,148,136,0.06)_56%,transparent_72%)] blur-2xl"
      style={{ left: '-200px', top: '-200px' }}
    />
  )
}

export default function CinematicBackground({ className = '', withMouseGlow = true }) {
  return (
    <>
      {withMouseGlow && <MouseGlowLayer />}
      <div className={`pointer-events-none fixed inset-0 z-0 overflow-hidden ${className}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_22%,rgba(16,185,129,0.24),transparent_36%),radial-gradient(circle_at_84%_8%,rgba(20,184,166,0.2),transparent_30%),radial-gradient(circle_at_68%_86%,rgba(132,204,22,0.16),transparent_36%),linear-gradient(120deg,#020b08_0%,#04100d_44%,#081713_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(110,231,183,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(94,234,212,0.06)_1px,transparent_1px)] bg-[size:56px_56px] opacity-25 [mask-image:radial-gradient(circle_at_center,black,transparent_74%)]" />
        <svg className="absolute inset-0 h-full w-full opacity-45" viewBox="0 0 1440 900" preserveAspectRatio="none">
          <path d="M-40 190 C 220 140, 380 320, 700 268 C 1020 214, 1180 82, 1490 146" fill="none" stroke="rgba(45,212,191,0.18)" strokeWidth="2" />
          <path d="M-20 470 C 210 430, 400 612, 690 560 C 980 508, 1208 356, 1490 430" fill="none" stroke="rgba(52,211,153,0.16)" strokeWidth="2" />
          <path d="M-40 760 C 310 646, 560 836, 850 782 C 1120 732, 1270 650, 1490 700" fill="none" stroke="rgba(132,204,22,0.15)" strokeWidth="1.8" />
          <circle cx="420" cy="300" r="4.2" fill="rgba(94,234,212,0.7)" />
          <circle cx="818" cy="545" r="3.7" fill="rgba(110,231,183,0.72)" />
          <circle cx="1180" cy="402" r="3.9" fill="rgba(163,230,53,0.68)" />
          <circle cx="1276" cy="188" r="3.2" fill="rgba(52,211,153,0.66)" />
        </svg>
        <div className="absolute -left-20 bottom-8 h-72 w-72 rounded-[60%_40%_52%_48%/48%_55%_45%_52%] bg-emerald-500/12 blur-3xl" />
        <div className="absolute right-[12%] top-[28%] h-52 w-28 rotate-[-12deg] rounded-[58%_42%_40%_60%/65%_62%_38%_35%] border border-emerald-200/25 bg-emerald-300/6" />
        <div className="absolute right-[9%] top-[33%] h-28 w-16 rotate-[14deg] rounded-[62%_38%_55%_45%/70%_66%_34%_30%] border border-teal-200/20 bg-teal-300/8" />
        <div className="absolute inset-0">
          <Canvas camera={{ position: [0, 0, 8], fov: 55 }}>
            <Lighting />
            <ParticleField />
            <OrbitalShapes />
          </Canvas>
        </div>
      </div>
    </>
  )
}
