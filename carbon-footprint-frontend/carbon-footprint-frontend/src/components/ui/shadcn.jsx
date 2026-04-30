import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { cva } from 'class-variance-authority'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

const neoButtonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'border-cyan-300/40 bg-cyan-400/15 text-cyan-100 hover:bg-cyan-400/25',
        secondary: 'border-slate-300/20 bg-slate-800/70 text-slate-100 hover:bg-slate-700/80',
        danger: 'border-red-300/40 bg-red-500/15 text-red-100 hover:bg-red-500/25',
      },
      size: {
        sm: 'h-8 px-3',
        md: 'h-10 px-4',
        lg: 'h-11 px-5',
      },
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'md',
    },
  }
)

export function NeoButton({ className, variant, size, ...props }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={cn(neoButtonVariants({ variant, size }), 'relative overflow-hidden', className)}
      {...props}
    />
  )
}

export const NeoCard = React.forwardRef(function NeoCard({ className, ...props }, ref) {
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-2xl border border-cyan-300/20 bg-[linear-gradient(180deg,rgba(15,23,42,0.75),rgba(15,23,42,0.5))] p-5 shadow-[0_12px_42px_-20px_rgba(56,189,248,0.7)] backdrop-blur-xl',
        className
      )}
      {...props}
    />
  )
})

export const NeoSwitch = React.forwardRef(function NeoSwitch({ className, ...props }, ref) {
  return (
    <SwitchPrimitive.Root
      ref={ref}
      className={cn(
        'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-cyan-300/30 bg-slate-800/80 transition-colors data-[state=checked]:bg-cyan-400/30 data-[state=unchecked]:bg-slate-800/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40',
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block h-5 w-5 rounded-full bg-slate-100 shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0" />
    </SwitchPrimitive.Root>
  )
})

export const NeoSlider = React.forwardRef(function NeoSlider({ className, ...props }, ref) {
  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn('relative flex w-full touch-none select-none items-center', className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-slate-800/80">
        <SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-cyan-400 to-indigo-400" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-cyan-100/50 bg-white shadow-[0_0_0_6px_rgba(34,211,238,0.25)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40" />
    </SliderPrimitive.Root>
  )
})
