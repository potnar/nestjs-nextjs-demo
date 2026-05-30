"use client";
import { useRef, useEffect } from "react";

export function usePropRef<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => { ref.current = value; }, [value]);
  return ref;
}
