"use client";
import { useSyncExternalStore } from "react";
import { isNative } from "@/lib/native-shares";

const subscribe = () => () => {};
const getServerSnapshot = () => false;

export function useNative() {
  return useSyncExternalStore(subscribe, isNative, getServerSnapshot);
}
