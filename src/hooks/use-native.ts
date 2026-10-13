"use client";
import { useSyncExternalStore } from "react";
import { isNative } from "@/lib/native-notifications";

const subscribe = () => () => {};
const getServerSnapshot = () => false;

export function useNative() {
  return useSyncExternalStore(subscribe, isNative, getServerSnapshot);
}
