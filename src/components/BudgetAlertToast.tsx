"use client";

import { useEffect, useState } from "react";
import { X, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { AnimatedNumber } from "./AnimatedNumber";

interface BudgetAlertToastProps {
  spent: number;
  limit: number;
  onClose: () => void;
}

export function BudgetAlertToast({ spent, limit, onClose }: BudgetAlertToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const percentage = (spent / limit) * 100;

  // Determine alert level
  const getAlertLevel = () => {
    if (percentage >= 100) return { color: "red", icon: AlertTriangle, label: "Budget Exceeded!" };
    if (percentage >= 90) return { color: "red", icon: AlertTriangle, label: "90% of budget used" };
    if (percentage >= 75) return { color: "yellow", icon: TrendingUp, label: "75% of budget used" };
    if (percentage >= 50) return { color: "blue", icon: CheckCircle, label: "Halfway to your budget" };
    return null;
  };

  const alert = getAlertLevel();

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  if (!alert) return null;

  const Icon = alert.icon;

  const colorClasses = {
    red: "bg-red-500/10 border-red-500/50 text-red-600 dark:text-red-400",
    yellow: "bg-yellow-500/10 border-yellow-500/50 text-yellow-600 dark:text-yellow-400",
    blue: "bg-blue-500/10 border-blue-500/50 text-blue-600 dark:text-blue-400",
  };

  return (
    <div
      className={`
        fixed bottom-6 right-6 z-[9999]
        max-w-sm rounded-lg border-2 p-4 shadow-2xl
        backdrop-blur-sm
        transition-all duration-500 ease-out
        ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}
        ${colorClasses[alert.color as keyof typeof colorClasses]}
      `}
      style={{ zIndex: 9999 }}
    >
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 mt-0.5 animate-pulse" />
        <div className="flex-1">
          <h3 className="font-semibold mb-1">{alert.label}</h3>
          <p className="text-sm opacity-90">
            You've spent{" "}
            <span className="font-bold">
              $<AnimatedNumber value={spent} decimals={2} />
            </span>{" "}
            of ${limit.toFixed(2)} this month
          </p>
          
          {/* Progress bar */}
          <div className="mt-2 h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                percentage >= 100 ? "bg-red-500" :
                percentage >= 90 ? "bg-red-400" :
                percentage >= 75 ? "bg-yellow-400" :
                "bg-blue-400"
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 500);
          }}
          className="opacity-50 hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
