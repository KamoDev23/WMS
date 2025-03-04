"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "../theme/mode-toggle";

export default function GlobalHeader() {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b ">
      {/* Company Name */}

      <div className="text-lg font-bold">
        Rocky Rock Trading - Workshop Management
      </div>
      {/* Right-side actions */}
      <div className="flex items-center space-x-4">
        {/* Side Panel Trigger (for mobile) */}

        {/* Mode Toggle */}
        <ModeToggle />
      </div>
    </header>
  );
}
