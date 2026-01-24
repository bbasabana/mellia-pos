
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface KpiCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    trend?: {
        value: string;
        direction: "up" | "down";
        label?: string;
    };
    footer?: string;
}

export function KpiCard({ title, value, icon, color, trend, footer }: KpiCardProps) {
    return (
        <div className="bg-white p-4 border border-gray-200 rounded-sm flex flex-col justify-between shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-200">
            {/* Top Row: Title & Icon */}
            <div className="flex justify-between items-start mb-2">
                <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{title}</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
                </div>
                <div className={cn("p-2.5 rounded-sm bg-gray-50 border border-gray-100 text-gray-600 transition-colors group-hover:bg-opacity-80", color)}>
                    {icon}
                </div>
            </div>

            {/* Middle/Bottom: Trend or Footer */}
            {(trend || footer) && (
                <div className="mt-2 pt-2 border-t border-gray-50 flex items-center justify-between text-xs">
                    {trend && (
                        <div className={cn("flex items-center gap-1 font-medium",
                            trend.direction === "up" ? "text-green-600" : "text-red-600"
                        )}>
                            {trend.direction === "up" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            {trend.value}
                            {trend.label && <span className="text-gray-400 font-normal ml-1 hidden sm:inline">{trend.label}</span>}
                        </div>
                    )}
                    {footer && (
                        <span className="text-gray-400 italic truncate max-w-[120px]" title={footer}>
                            {footer}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
