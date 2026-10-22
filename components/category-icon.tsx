import {
  AudioLines,
  Cable,
  Guitar,
  Headphones,
  Link2,
  Package,
  SlidersHorizontal,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const categoryIcons: Record<string, LucideIcon> = {
  guitarras: Guitar,
  pedales: SlidersHorizontal,
  cuerdas: AudioLines,
  cables: Cable,
  correas: Link2,
  accesorios: Headphones,
}

export function CategoryIcon({
  category,
  size = 18,
}: {
  category: string
  size?: number
}) {
  const Icon = categoryIcons[category] ?? Package

  return <Icon aria-hidden="true" size={size} />
}
