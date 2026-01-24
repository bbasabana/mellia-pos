/**
 * Common TypeScript types and interfaces for Mellia POS
 */

// User roles
export type UserRole = "ADMIN" | "MANAGER" | "CASHIER";

// Sale spaces
export type SaleSpace = "VIP" | "TERRACE";

// Product types
export type ProductType = "BEVERAGE" | "FOOD";

// Stock locations
export type StockLocation = "FRIDGE" | "LOCKER" | "DEPOT";

// Stock movement types
export type StockMovementType = "IN" | "OUT" | "ADJUSTMENT" | "TRANSFER";

// Stock movement origins
export type StockMovementOrigin = "PURCHASE" | "SALE" | "LOSS";

// Loss types
export type LossType = "BREAKAGE" | "SPOILED" | "MISSING" | "THEFT";

// Responsible types for losses
export type ResponsibleType = "EMPLOYEE" | "SERVICE" | "SUPPLIER" | "UNKNOWN";

// Payment methods
export type PaymentMethod = "CASH" | "MOBILE" | "CARD" | "BANK_TRANSFER";

// Employee liability statuses
export type LiabilityStatus = "SALARY_DEDUCTION" | "WARNING" | "NOT_CHARGEABLE";
