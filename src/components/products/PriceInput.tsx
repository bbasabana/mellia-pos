"use client";

import { useState, useEffect } from "react";

interface PriceInputProps {
  label: string;
  value: number; // USD value (stored in DB)
  onChange: (value: number) => void; // Returns USD value
  onCdfChange?: (cdfValue: number) => void; // Returns CDF value directly
  exchangeRate: number;
  disabled?: boolean;
  required?: boolean;
  initialCdfValue?: number; // Optional: pass the exact CDF value from DB to avoid reconversion
}

export function PriceInput({
  label,
  value,
  onChange,
  onCdfChange,
  exchangeRate,
  disabled = false,
  required = false,
  initialCdfValue,
}: PriceInputProps) {
  // CDF is now the primary input, USD is calculated
  // Use initialCdfValue if provided (from DB), otherwise calculate from USD
  const [cdfValue, setCdfValue] = useState(
    initialCdfValue !== undefined 
      ? initialCdfValue.toFixed(0)
      : (value * exchangeRate).toFixed(0)
  );
  const usdValue = (parseFloat(cdfValue || "0") / exchangeRate).toFixed(2);

  useEffect(() => {
    // When value prop changes (from parent), update CDF display
    // BUT: if initialCdfValue was provided, trust it and don't recalculate
    // This prevents the 3000 -> 2992 issue
    if (initialCdfValue !== undefined) {
      // Use the exact CDF value from DB
      setCdfValue(initialCdfValue.toFixed(0));
    } else {
      // Calculate from USD (for new products or when CDF not available)
      const currentCdf = parseFloat(cdfValue || "0");
      const newCdf = value * exchangeRate;
      
      // Allow small variance for float math
      if (Math.abs(currentCdf - newCdf) > 1) {
        setCdfValue(newCdf.toFixed(0));
      }
    }
  }, [value, exchangeRate, initialCdfValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCdfValue = e.target.value;
    setCdfValue(newCdfValue);
    const cdfNum = parseFloat(newCdfValue);
    if (!isNaN(cdfNum)) {
      // Calculate USD and send to parent
      const usdNum = cdfNum / exchangeRate;
      onChange(usdNum);
      // IMPORTANT: Also send the exact CDF value to avoid precision loss
      if (onCdfChange) {
        onCdfChange(cdfNum);
      }
    } else {
      onChange(0);
      if (onCdfChange) {
        onCdfChange(0);
      }
    }
  };

  return (
    <div className="form-group mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="flex gap-4 items-center">
        {/* CDF Input */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-gray-500 font-medium">FC</span>
          </div>
          <input
            type="number"
            step="50" // standard step for currency
            min="0"
            value={cdfValue}
            onChange={handleChange}
            disabled={disabled}
            required={required}
            className="block w-full rounded-md border-gray-300 pl-10 pr-12 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border h-10"
            placeholder="0"
          />
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-gray-400 sm:text-sm">CDF</span>
          </div>
        </div>

        {/* Display USD equivalent */}
        <div className="relative w-1/3 min-w-[120px]">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-gray-500">$</span>
          </div>
          <input
            type="text"
            readOnly
            value={usdValue}
            className="block w-full rounded-md border-gray-200 bg-gray-50 pl-7 py-2 text-gray-500 shadow-sm sm:text-sm border h-10"
          />
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-gray-400 sm:text-sm">USD</span>
          </div>
        </div>
      </div>
    </div>
  );
}
