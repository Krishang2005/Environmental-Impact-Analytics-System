import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sphere, Torus } from '@react-three/drei'

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mediaQuery) return undefined

    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches)
    updatePreference()
    mediaQuery.addEventListener('change', updatePreference)
    return () => mediaQuery.removeEventListener('change', updatePreference)
  }, [])

  return prefersReducedMotion
}

function ParticleField({ animated = true }) {
  const pointsRef = useRef(null)
  const particles = useMemo(() => {
    const count = animated ? 320 : 180
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
  }, [animated])

  useFrame(({ clock }) => {
    if (!animated) return
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
      <pointsMaterial size={0.035} color="#34d399" transparent opacity={0.38} depthWrite={false} />
    </points>
  )
}

function OrbitalShapes({ animated = true }) {
  const groupRef = useRef(null)

  useFrame(({ clock }) => {
    if (!animated) return
    if (!groupRef.current) return
    groupRef.current.rotation.y = clock.getElapsedTime() * 0.045
    groupRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.12) * 0.08
    groupRef.current.position.y = 0.2 + Math.sin(clock.getElapsedTime() * 0.75) * 0.08
  })

  return (
    <group ref={groupRef} position={[2.2, 0.2, -2.2]}>
      <Sphere args={[1.1, 28, 28]}>
        <meshStandardMaterial color="#065f46" emissive="#10b981" emissiveIntensity={0.25} transparent opacity={0.24} />
      </Sphere>
      <Sphere args={[1.18, 24, 24]}>
        <meshBasicMaterial color="#6ee7b7" wireframe transparent opacity={0.13} />
      </Sphere>
      <Torus args={[1.9, 0.055, 14, 72]} rotation={[Math.PI / 2.8, 0, 0]}>
        <meshStandardMaterial color="#2dd4bf" emissive="#2dd4bf" emissiveIntensity={0.38} transparent opacity={0.52} />
      </Torus>
      <Torus args={[1.52, 0.035, 12, 64]} rotation={[Math.PI / 1.95, 0, Math.PI / 3]}>
        <meshStandardMaterial color="#84cc16" emissive="#34d399" emissiveIntensity={0.32} transparent opacity={0.32} />
      </Torus>
      <group position={[-1.75, -0.9, -0.5]} rotation={[0.15, 0.25, -0.45]}>
        <Sphere args={[0.26, 14, 14]} scale={[0.72, 1.55, 0.6]}>
          <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.35} transparent opacity={0.36} />
        </Sphere>
        <Sphere args={[0.14, 10, 10]} position={[0.14, -0.08, 0.04]} scale={[0.42, 1.2, 0.46]}>
          <meshStandardMaterial color="#99f6e4" emissive="#2dd4bf" emissiveIntensity={0.24} transparent opacity={0.3} />
        </Sphere>
      </group>
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
    let frameId = 0
    let x = -200
    let y = -200

    const applyTransform = () => {
      frameId = 0
      node.style.transform = `translate3d(${x}px, ${y}px, 0)`
    }

    const onMove = (event) => {
      x = event.clientX - 160
      y = event.clientY - 160
      if (!frameId) {
        frameId = window.requestAnimationFrame(applyTransform)
      }
    }

    window.addEventListener('pointermove', onMove)
    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  return (
    <div
      ref={glowRef}
      className="pointer-events-none fixed z-[1] h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.22),rgba(13,148,136,0.06)_56%,transparent_72%)] blur-2xl"
      style={{ transform: 'translate3d(-200px, -200px, 0)' }}
    />
  )
}

export default function CinematicBackground({
  className = '',
  withMouseGlow = true,
  scene = true,
  animated = true,
}) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const shouldAnimate = animated && !prefersReducedMotion
  const shouldRenderScene = scene && !prefersReducedMotion

  return (
    <>
      {withMouseGlow && shouldAnimate && <MouseGlowLayer />}
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
        {shouldRenderScene && (
        <div className="absolute inset-0">
          <Canvas
            camera={{ position: [0, 0, 8], fov: 55 }}
            dpr={[0.6, 1]}
            frameloop={shouldAnimate ? 'always' : 'demand'}
            gl={{ antialias: false, powerPreference: 'low-power' }}
          >
            <Lighting />
            <ParticleField animated={shouldAnimate} />
            <OrbitalShapes animated={shouldAnimate} />
          </Canvas>
        </div>
        )}
      </div>
    </>
  )
}
