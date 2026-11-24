"use client";

import { DollarSign } from "lucide-react";

/** "241 500 FC" */
export const fc = (v: number) => `${Math.round(v || 0).toLocaleString("fr-FR")} FC`;
/** "86,25 $" */
export const usd = (v: number) =>
    `${(v || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`;

const onlyDigits = (s: string) => s.replace(/[^0-9]/g, "");
/** Keeps digits and one decimal separator (dollars may have cents). */
const cleanUsd = (s: string) => {
    const v = s.replace(/[^0-9.,]/g, "").replace(",", ".");
    const [int, ...rest] = v.split(".");
    return rest.length ? `${int}.${rest.join("").slice(0, 2)}` : int;
};
const groupDigits = (s: string) => (onlyDigits(s) ? Number(onlyDigits(s)).toLocaleString("fr-FR") : "");

export type MoneyValue = { usd: string; cdf: string };
export const emptyMoney: MoneyValue = { usd: "", cdf: "" };

export function moneyAmounts(v: MoneyValue, rate: number) {
    const u = Number(v.usd || 0);
    const c = Number(onlyDigits(v.cdf) || 0);
    const totalCdf = Math.round((Number.isFinite(u) ? u : 0) * rate + c);
    return {
        usd: Number.isFinite(u) ? u : 0,
        cdf: c,
        totalCdf,
        totalUsd: rate > 0 ? totalCdf / rate : 0,
        filled: v.usd.trim() !== "" || onlyDigits(v.cdf) !== "",
    };
}

/** "120 $ + 50 000 FC (taux 2 800)" — the detail kept in a closure note. */
export function moneyDetail(v: MoneyValue, rate: number) {
    const a = moneyAmounts(v, rate);
    return `${a.usd.toLocaleString("fr-FR")} $ + ${a.cdf.toLocaleString("fr-FR")} FC (taux ${rate.toLocaleString("fr-FR")})`;
}

/**
 * Money counted in dollars and in francs, shown converted: total in FC (the house
 * currency) and total in dollars, at the active rate.
 */
export function MoneyCount({
    value,
    onChange,
    rate,
    autoFocus,
}: {
    value: MoneyValue;
    onChange: (v: MoneyValue) => void;
    rate: number;
    autoFocus?: boolean;
}) {
    const a = moneyAmounts(value, rate);
    return (
        <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                    <span className="text-[11px] font-semibold text-gray-500">Billets en dollars</span>
                    <div className="mt-1 flex items-center rounded-lg border border-gray-200 bg-white px-3 focus-within:border-gray-900 focus-within:ring-2 focus-within:ring-gray-900/10">
                        <DollarSign size={16} className="text-green-600 shrink-0" />
                        <input
                            inputMode="decimal"
                            placeholder="0"
                            value={value.usd}
                            autoFocus={autoFocus}
                            onChange={(e) => onChange({ ...value, usd: cleanUsd(e.target.value) })}
                            className="w-full bg-transparent py-2.5 pl-2 text-lg font-bold tabular-nums outline-none"
                        />
                        <span className="text-xs font-semibold text-gray-400">USD</span>
                    </div>
                </label>
                <label className="block">
                    <span className="text-[11px] font-semibold text-gray-500">Billets en francs</span>
                    <div className="mt-1 flex items-center rounded-lg border border-gray-200 bg-white px-3 focus-within:border-gray-900 focus-within:ring-2 focus-within:ring-gray-900/10">
                        <span className="text-xs font-bold text-blue-600 shrink-0">FC</span>
                        <input
                            inputMode="numeric"
                            placeholder="0"
                            value={value.cdf}
                            onChange={(e) => onChange({ ...value, cdf: groupDigits(e.target.value) })}
                            className="w-full bg-transparent py-2.5 pl-2 text-lg font-bold tabular-nums outline-none"
                        />
                        <span className="text-xs font-semibold text-gray-400">CDF</span>
                    </div>
                </label>
            </div>
            <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2.5 grid grid-cols-2 gap-2">
                <div>
                    <p className="text-[11px] text-gray-500">Total en francs</p>
                    <p className="text-lg font-bold text-gray-900 tabular-nums">{fc(a.totalCdf)}</p>
                </div>
                <div className="text-right">
                    <p className="text-[11px] text-gray-500">Total en dollars</p>
                    <p className="text-lg font-bold text-green-700 tabular-nums">{usd(a.totalUsd)}</p>
                </div>
                <p className="col-span-2 text-[11px] text-gray-400">
                    {a.usd > 0 ? `${usd(a.usd)} × ${rate.toLocaleString("fr-FR")} = ${fc(a.usd * rate)} · ` : ""}
                    Taux du jour : 1 $ = {rate.toLocaleString("fr-FR")} FC
                </p>
            </div>
        </div>
    );
}
