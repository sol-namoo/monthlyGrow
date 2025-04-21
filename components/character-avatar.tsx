import Image from "next/image"
import { cn } from "@/lib/utils"

interface CharacterAvatarProps {
  level?: number
  size?: "sm" | "md" | "lg"
  className?: string
}

export function CharacterAvatar({ level = 1, size = "md", className }: CharacterAvatarProps) {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-32 h-32",
  }

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "relative overflow-hidden rounded-full border-4 border-primary/20 bg-secondary",
          sizeClasses[size],
        )}
      >
        <Image
          src="/placeholder.svg?height=200&width=200"
          alt="Character Avatar"
          width={200}
          height={200}
          className="object-cover"
        />
      </div>
      {level && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">
          Lv.{level}
        </div>
      )}
    </div>
  )
}
