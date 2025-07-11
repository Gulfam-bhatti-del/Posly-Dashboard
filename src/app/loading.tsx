import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[400px] w-full">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="absolute inset-0 h-8 w-8 rounded-full border-2 border-primary/20 animate-pulse" />
        </div>

        <div className="flex items-center space-x-1">
          <span className="text-sm font-medium text-muted-foreground">Loading</span>
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-1 h-1 bg-primary rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  )
}
