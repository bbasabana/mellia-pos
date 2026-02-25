"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { ExchangeRateCard } from "@/components/settings/ExchangeRateCard";
import { DangerZoneCard } from "@/components/settings/DangerZoneCard";
import { AccountSettingsCard } from "@/components/settings/AccountSettingsCard";
import { Settings, Tag, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
    return (
        <DashboardLayout>
            <div className="w-full h-full flex flex-col overflow-y-auto bg-gray-50">
                {/* Simple Header */}
                <div className="bg-white border-b border-gray-200 p-8">
                    <div className="max-w-6xl mx-auto">
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <Settings className="text-[#00d3fa]" size={28} />
                            Paramètres
                        </h1>
                        <p className="text-gray-500 mt-2 max-w-2xl text-sm">
                            Gérez les utilisateurs, la configuration des produits et les devises. Version stable 1.0.0
                        </p>
                    </div>
                </div>

                <div className="flex-1 p-8">
                    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">
                        {/* LEFT COLUMN (8 cols) */}
                        <div className="md:col-span-8 space-y-8">

                            {/* Account Section */}
                            <section>
                                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 ml-1">Administration</h2>
                                <AccountSettingsCard />
                            </section>

                            {/* Products Section */}
                            <section>
                                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 ml-1">Menu & Catalogue</h2>
                                <div className="bg-white rounded-none border border-gray-200 p-0 overflow-hidden">
                                    <Link
                                        href="/dashboard/settings/categories"
                                        className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors group border-l-4 border-transparent hover:border-[#00d3fa]"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-500 group-hover:text-[#00d3fa] group-hover:bg-[#00d3fa]/10 transition-colors">
                                                <Tag size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">Types et Catégories</h3>
                                                <p className="text-sm text-gray-500">Configurer les familles de produits</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="text-gray-300 group-hover:text-gray-500" size={20} />
                                    </Link>
                                </div>
                            </section>

                            {/* Danger Zone */}
                            <section className="pt-4">
                                <DangerZoneCard />
                            </section>
                        </div>

                        {/* RIGHT COLUMN (4 cols) */}
                        <div className="md:col-span-4 space-y-6">
                            <section>
                                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 ml-1">Finance</h2>
                                <ExchangeRateCard />
                            </section>

                            <div className="bg-[#00d3fa]/5 border border-[#00d3fa]/20 p-4 rounded text-sm text-gray-600">
                                <p>Besoin d&apos;assistance ? Contactez le support technique au <span className="font-semibold text-[#00d3fa]">+243 000 000 000</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
