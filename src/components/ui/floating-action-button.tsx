import React from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
}

export function FloatingActionButton({
  className,
  icon = <Plus className="w-6 h-6" />,
  ...props
}: FloatingActionButtonProps) {
  return (
    <button
      className={cn(
        "fixed bottom-20 right-4 w-14 h-14 bg-accent hover:bg-accent/90 text-accent-foreground rounded-full shadow-large transition-all duration-200 hover:scale-105 active:scale-95 z-40",
        "flex items-center justify-center",
        className
      )}
      {...props}
    >
      {icon}
    </button>
  );
}