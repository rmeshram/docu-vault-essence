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
        "fixed bottom-20 right-6 w-16 h-16 bg-accent hover:bg-accent/90 text-accent-foreground rounded-2xl shadow-medium transition-all duration-300 hover:scale-105 active:scale-95 z-40",
        "flex items-center justify-center",
        className
      )}
      {...props}
    >
      {icon}
    </button>
  );
}