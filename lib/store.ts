"use client";

import { create } from "zustand";
import type { OrderStatus, RefreshCycle } from "@/lib/types";

type DaysFilter = "all" | "early" | "watch" | "late";

type OpsState = {
  collapsed: boolean;
  cycle: RefreshCycle;
  daysFilter: DaysFilter;
  globalSearch: string;
  highValueOnly: boolean;
  readyOnly: boolean;
  status: OrderStatus | "All";
  warehouse: string;
  setCollapsed: (collapsed: boolean) => void;
  setCycle: (cycle: RefreshCycle) => void;
  setDaysFilter: (daysFilter: DaysFilter) => void;
  setGlobalSearch: (globalSearch: string) => void;
  setHighValueOnly: (highValueOnly: boolean) => void;
  setReadyOnly: (readyOnly: boolean) => void;
  setStatus: (status: OrderStatus | "All") => void;
  setWarehouse: (warehouse: string) => void;
};

export const useOpsStore = create<OpsState>((set) => ({
  collapsed: false,
  cycle: "12:00 PM",
  daysFilter: "all",
  globalSearch: "",
  highValueOnly: false,
  readyOnly: false,
  status: "All",
  warehouse: "All",
  setCollapsed: (collapsed) => set({ collapsed }),
  setCycle: (cycle) => set({ cycle }),
  setDaysFilter: (daysFilter) => set({ daysFilter }),
  setGlobalSearch: (globalSearch) => set({ globalSearch }),
  setHighValueOnly: (highValueOnly) => set({ highValueOnly }),
  setReadyOnly: (readyOnly) => set({ readyOnly }),
  setStatus: (status) => set({ status }),
  setWarehouse: (warehouse) => set({ warehouse }),
}));
