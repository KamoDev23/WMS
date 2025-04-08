// components/ui/loading-state.tsx
import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  isLoading: boolean;
  text?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
  variant?: "dark" | "light";
}

const LoadingState: React.FC<LoadingStateProps> = ({
  isLoading,
  text = "Loading...",
  className,
  size = "md",
  fullScreen = false,
  variant = "dark",
}) => {
  if (!isLoading) return null;

  const sizes = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center space-y-2",
        fullScreen && "fixed inset-0 bg-background/80 backdrop-blur-sm z-50",
        className
      )}
    >
      <Loader2
        className={cn(
          "animate-spin",
          sizes[size],
          variant === "dark" ? "text-primary" : "text-primary-foreground"
        )}
      />
      {text && (
        <p
          className={cn(
            "text-sm font-medium",
            variant === "dark" ? "text-primary" : "text-primary-foreground"
          )}
        >
          {text}
        </p>
      )}
    </div>
  );
};

// Overlay version that covers an entire section with a translucent background
export const LoadingOverlay: React.FC<LoadingStateProps & { show: boolean }> = ({
  show,
  text,
  className,
  size = "md",
  variant = "dark",
}) => {
  if (!show) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm z-10 rounded-md">
      <LoadingState
        isLoading={true}
        text={text}
        className={className}
        size={size}
        variant={variant}
      />
    </div>
  );
};

export default LoadingState;