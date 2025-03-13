"use client";
import { toast } from "sonner";
import React from "react";

export interface CustomToastOptions {
  message: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

export function useCustomToast() {
  const showToast = React.useCallback((options: CustomToastOptions) => {
    toast(options.message, {
      description: options.description,
      action: options.action,
      duration: options.duration,
    });
  }, []);

  return showToast;
}
