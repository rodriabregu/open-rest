import React from "react";
import { toast as sonnerToast } from "sonner";

type ToastProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: "default" | "destructive" | "success" | "warning" | "info";
  duration?: number;
  action?: React.ReactNode;
};

export function useToast() {
  const toast = ({
    title,
    description,
    variant = "default",
    duration,
    action,
  }: ToastProps) => {
    const message = title || description; // Use title as main message if available
    const data = {
      description: title ? description : undefined, // Use description only if title is also present
      duration,
      action,
    };

    if (!message) {
      console.error("Toast must have at least a title or description.");
      return;
    }

    switch (variant) {
      case "destructive":
        sonnerToast.error(message, data);
        break;
      case "success":
        sonnerToast.success(message, data);
        break;
      case "warning":
        sonnerToast.warning(message, data);
        break;
      case "info":
        sonnerToast.info(message, data);
        break;
      case "default":
      default:
        sonnerToast(message, data);
        break;
    }
  };

  // Optionally expose other sonner methods if needed directly
  return {
    toast,
    dismiss: sonnerToast.dismiss,
    // Add others like toast.promise if you use them
  };
}
