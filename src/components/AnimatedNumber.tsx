"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  duration?: number; // Animation duration in ms
  decimals?: number; // Number of decimal places
  prefix?: string; // e.g., "$"
  suffix?: string; // e.g., "%"
  className?: string;
}

export function AnimatedNumber({
  value,
  duration = 1000,
  decimals = 0,
  prefix = "",
  suffix = "",
  className = "",
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const previousValueRef = useRef(0);

  useEffect(() => {
    const startValue = previousValueRef.current;
    const difference = value - startValue;
    
    if (difference === 0) return;

    startTimeRef.current = null;

    const animate = (currentTime: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out quad)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = startValue + difference * easeOut;
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        previousValueRef.current = value;
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  const formattedValue = displayValue.toFixed(decimals);

  return (
    <span className={className}>
      {prefix}{formattedValue}{suffix}
    </span>
  );
}
