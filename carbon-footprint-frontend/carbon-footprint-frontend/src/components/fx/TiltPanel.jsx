import { useEffect, useRef } from 'react'
import { cn } from '../../lib/utils'

export default function TiltPanel({ children, className = '', intensity = 12 }) {
  const panelRef = useRef(null)

  useEffect(() => {
    const node = panelRef.current
    if (!node) return undefined
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined
    if (window.matchMedia?.('(pointer: coarse)').matches) return undefined

    let frameId = 0
    let rotateX = 0
    let rotateY = 0
    let translateY = 0
    let scale = 1

    const applyTransform = () => {
      frameId = 0
      node.style.transform = `translate3d(0, ${translateY}px, 0) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`
    }

    const scheduleTransform = () => {
      if (!frameId) {
        frameId = window.requestAnimationFrame(applyTransform)
      }
    }

    const onMove = (event) => {
      const bounds = node.getBoundingClientRect()
      const px = (event.clientX - bounds.left) / bounds.width
      const py = (event.clientY - bounds.top) / bounds.height
      rotateY = (px - 0.5) * intensity
      rotateX = (0.5 - py) * intensity
      translateY = -4
      scale = 1.01
      scheduleTransform()
    }

    const onLeave = () => {
      rotateX = 0
      rotateY = 0
      translateY = 0
      scale = 1
      scheduleTransform()
    }

    node.addEventListener('pointermove', onMove)
    node.addEventListener('pointerleave', onLeave)
    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }
      node.removeEventListener('pointermove', onMove)
      node.removeEventListener('pointerleave', onLeave)
    }
  }, [intensity])

  return (
    <div
      ref={panelRef}
      className={cn('transform-gpu [transform-style:preserve-3d] transition-shadow duration-300', className)}
    >
      {children}
    </div>
  )
}
