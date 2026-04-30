import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { cn } from '../../lib/utils'

export default function TiltPanel({ children, className = '', intensity = 12 }) {
  const panelRef = useRef(null)

  useEffect(() => {
    const node = panelRef.current
    if (!node) return undefined

    const rotateXTo = gsap.quickTo(node, 'rotateX', { duration: 0.4, ease: 'power2.out' })
    const rotateYTo = gsap.quickTo(node, 'rotateY', { duration: 0.4, ease: 'power2.out' })
    const yTo = gsap.quickTo(node, 'y', { duration: 0.4, ease: 'power2.out' })
    const scaleTo = gsap.quickTo(node, 'scale', { duration: 0.4, ease: 'power2.out' })

    const onMove = (event) => {
      const bounds = node.getBoundingClientRect()
      const px = (event.clientX - bounds.left) / bounds.width
      const py = (event.clientY - bounds.top) / bounds.height
      rotateYTo((px - 0.5) * intensity)
      rotateXTo((0.5 - py) * intensity)
      yTo(-4)
      scaleTo(1.01)
    }

    const onLeave = () => {
      rotateXTo(0)
      rotateYTo(0)
      yTo(0)
      scaleTo(1)
    }

    node.addEventListener('pointermove', onMove)
    node.addEventListener('pointerleave', onLeave)
    return () => {
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
