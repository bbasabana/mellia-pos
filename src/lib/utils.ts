/**
 * Common utility functions
 */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("fr-CD", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-CD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function calculateLoyaltyPoints(amount: number): number {
  // 1 point = 20,000 FC
  return Math.floor(amount / 20000);
}

export function loyaltyPointsToDiscount(points: number): number {
  // 10 points = 10 USD
  const usableSets = Math.floor(points / 10);
  return usableSets * 10;
}
