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
  // Use a string state for the raw input to handle typing, selection, and clearing naturally
  const [cdfString, setCdfString] = useState(
    initialCdfValue !== undefined 
      ? initialCdfValue.toFixed(0)
      : (value * exchangeRate).toFixed(0)
  );

  // Derived USD value for display only
  const usdValue = (parseFloat(cdfString || "0") / exchangeRate).toFixed(2);

  // Sync with prop ONLY when the initial value from DB changes (identity change)
  // This prevents the "re-fixing" bug during typing
  useEffect(() => {
    if (initialCdfValue !== undefined) {
      setCdfString(initialCdfValue.toFixed(0));
    } else {
      // For new products or where CDF isn't available, sync from USD value if it significantly diverges
      const currentCdf = parseFloat(cdfString || "0");
      const propCdf = value * exchangeRate;
      if (Math.abs(currentCdf - propCdf) > 1) {
        setCdfString(propCdf.toFixed(0));
      }
    }
  }, [initialCdfValue, exchangeRate]); // Removed 'value' from deps to avoid circularity

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits (cleaner than type="number" behavior)
    const rawValue = e.target.value.replace(/[^0-9]/g, "");
    
    // Update local string state immediately for smooth UI
    setCdfString(rawValue);

    // If empty string, treat as 0 for calculations but keep string empty for user
    const cdfNum = rawValue === "" ? 0 : parseFloat(rawValue);
    
    // Push updates to parent
    const usdNum = cdfNum / exchangeRate;
    onChange(usdNum);
    if (onCdfChange) {
      onCdfChange(cdfNum);
    }
  };

  return (
    <div className="form-group mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="flex gap-4 items-center">
        {/* CDF Input (Text based for stability) */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-gray-500 font-medium">FC</span>
          </div>
          <input
            type="text"
            inputMode="numeric"
            value={cdfString}
            onChange={handleChange}
            disabled={disabled}
            required={required}
            className="block w-full rounded-md border-gray-300 pl-10 pr-12 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border h-10 font-bold"
            placeholder="0"
          />
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-gray-400 sm:text-sm">CDF</span>
          </div>
        </div>

        {/* Display USD equivalent */}
        <div className="relative w-1/3 min-w-[120px]">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-gray-500 font-bold">$</span>
          </div>
          <input
            type="text"
            readOnly
            value={usdValue}
            className="block w-full rounded-md border-gray-200 bg-gray-50 pl-7 py-2 text-gray-500 shadow-sm sm:text-sm border h-10 font-medium"
          />
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[10px] font-bold text-gray-400">
            USD
          </div>
        </div>
      </div>
    </div>
  );
}
