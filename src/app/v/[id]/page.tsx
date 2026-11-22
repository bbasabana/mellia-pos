/**
 * Public receipt check: the QR code printed at the bottom of every Mellia receipt opens this page.
 * Anyone can see whether the receipt was really issued by Mellia, and what it contains.
 *
 * The link carries the sale id (a random cuid), never a guessable ticket number. Nothing personal
 * is shown: no client name, no phone, only the cashier's first name.
 */

import type { Metadata } from "next";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Vérification de facture · Mellia",
    robots: { index: false, follow: false },
};

const PAYMENT: Record<string, string> = {
    CASH: "Espèces",
    CARD: "Carte",
    MOBILE_MONEY: "Mobile Money",
    AIRTEL_MONEY: "Airtel Money",
    ORANGE_MONEY: "Orange Money",
    MPESA: "M-Pesa",
    TRANSFER: "Virement",
};

const ORDER: Record<string, string> = {
    DINE_IN: "Sur place",
    TAKEAWAY: "À emporter",
    DELIVERY: "Livraison",
};

function fc(value: number) {
    return `${Math.round(value).toLocaleString("fr-FR").replace(/ | /g, " ")} FC`;
}

async function findSale(id: string) {
    // A cuid is 20-30 lowercase letters and digits: anything else is not one of our receipts.
    if (!/^[a-z0-9]{20,40}$/.test(id)) return null;
    try {
        return await prisma.sale.findUnique({
            where: { id },
            select: {
                ticketNum: true,
                status: true,
                createdAt: true,
                totalCdf: true,
                totalNet: true,
                paymentMethod: true,
                orderType: true,
                user: { select: { name: true } },
                items: {
                    select: {
                        id: true,
                        quantity: true,
                        unitPriceCdf: true,
                        product: { select: { name: true } },
                    },
                },
            },
        });
    } catch {
        return null;
    }
}

export default async function VerifyReceiptPage({ params }: { params: { id: string } }) {
    const sale = await findSale(params.id);
    const valid = sale?.status === "COMPLETED";

    return (
        <main className="min-h-screen bg-gray-100 px-4 py-10 flex flex-col items-center">
            <div className="w-full max-w-md">
                <div className="flex justify-center mb-6">
                    <Image src="/images/logos/logo.png" alt="Mellia Restaurant Rapide" width={120} height={40} priority />
                </div>

                {!sale ? (
                    <section className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                                <path d="M18 6 6 18M6 6l12 12" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-bold text-gray-900">Facture introuvable</h1>
                        <p className="mt-2 text-sm text-gray-500">
                            Ce code ne correspond à aucune facture émise par Mellia. Le ticket n&apos;est pas authentique
                            ou le code a été mal lu.
                        </p>
                    </section>
                ) : (
                    <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
                        <div className={valid ? "bg-green-50 px-6 py-5" : "bg-orange-50 px-6 py-5"}>
                            <div className="flex items-center gap-3">
                                <div
                                    className={
                                        valid
                                            ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-600 text-white"
                                            : "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white"
                                    }
                                >
                                    {valid ? (
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 6 9 17l-5-5" />
                                        </svg>
                                    ) : (
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                                            <path d="M12 8v5M12 16.5v.01" />
                                        </svg>
                                    )}
                                </div>
                                <div>
                                    <h1 className={valid ? "text-lg font-bold text-green-800" : "text-lg font-bold text-orange-800"}>
                                        {valid ? "Facture authentique" : "Facture non finalisée"}
                                    </h1>
                                    <p className={valid ? "text-sm text-green-700" : "text-sm text-orange-700"}>
                                        {valid
                                            ? "Émise et payée chez Mellia Restaurant Rapide."
                                            : "Cette commande existe mais n'a pas été payée."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-5">
                            <dl className="grid grid-cols-2 gap-y-3 text-sm">
                                <dt className="text-gray-500">Ticket</dt>
                                <dd className="text-right font-semibold text-gray-900 tabular-nums">{sale.ticketNum}</dd>
                                <dt className="text-gray-500">Date</dt>
                                <dd className="text-right font-medium text-gray-900 tabular-nums">
                                    {new Intl.DateTimeFormat("fr-FR", {
                                        dateStyle: "short",
                                        timeStyle: "short",
                                        timeZone: "Africa/Kinshasa",
                                    }).format(sale.createdAt)}
                                </dd>
                                <dt className="text-gray-500">Service</dt>
                                <dd className="text-right font-medium text-gray-900">{ORDER[sale.orderType] || sale.orderType}</dd>
                                <dt className="text-gray-500">Paiement</dt>
                                <dd className="text-right font-medium text-gray-900">
                                    {PAYMENT[sale.paymentMethod] || sale.paymentMethod}
                                </dd>
                                {sale.user?.name && (
                                    <>
                                        <dt className="text-gray-500">Caissier</dt>
                                        <dd className="text-right font-medium text-gray-900">{sale.user.name.split(" ")[0]}</dd>
                                    </>
                                )}
                            </dl>

                            <ul className="mt-5 space-y-2 border-t border-dashed border-gray-200 pt-4">
                                {sale.items.map((item) => {
                                    const qty = Number(item.quantity);
                                    const unit = Number(item.unitPriceCdf);
                                    return (
                                        <li key={item.id} className="flex items-baseline justify-between gap-3 text-sm">
                                            <span className="text-gray-700">
                                                <span className="font-semibold tabular-nums text-gray-900">{qty}×</span>{" "}
                                                {item.product.name}
                                            </span>
                                            <span className="shrink-0 font-medium tabular-nums text-gray-900">{fc(qty * unit)}</span>
                                        </li>
                                    );
                                })}
                            </ul>

                            <div className="mt-4 flex items-baseline justify-between border-t border-gray-200 pt-4">
                                <span className="text-sm font-semibold text-gray-900">Total</span>
                                <span className="text-right">
                                    <span className="block text-xl font-bold tabular-nums text-gray-900">{fc(Number(sale.totalCdf))}</span>
                                    <span className="block text-xs tabular-nums text-gray-500">
                                        ${Number(sale.totalNet).toFixed(2)}
                                    </span>
                                </span>
                            </div>
                        </div>
                    </section>
                )}

                <p className="mt-6 text-center text-xs text-gray-400">
                    Mellia Restaurant Rapide · 10, Bypass, Mont-Ngafula, Kinshasa
                </p>
            </div>
        </main>
    );
}
