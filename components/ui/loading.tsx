import { Loader2 } from "lucide-react"

interface LoadingProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export default function Loading({ size = "md", className = "" }: LoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  }

  return (
    <div className={`flex items-center justify-center p-4 ${className}`} data-testid="loading-indicator">
      <Loader2 className={`animate-spin ${sizeClasses[size]}`} />
    </div>
  )
} 