"use client";

import { Sale, Client, User, SaleItem, Product, PaymentMethod } from "@prisma/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type ReceiptProps = {
    sale: Sale & {
        client?: Client | null;
        user: User;
        items: (SaleItem & { product: Product })[];
    };
    width?: "58mm" | "80mm";
    exchangeRate?: number;
};

export const ReceiptTemplate = ({ sale, width = "80mm", exchangeRate = 2800 }: ReceiptProps) => {
    // Styles specifics to print
    const containerStyle = {
        width: width === "58mm" ? "58mm" : "80mm",
        padding: "5mm",
        margin: "0 auto",
        backgroundColor: "white",
        color: "black",
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: "14px",
        lineHeight: "1.3",
    };

    const separator = "------------------------------------------";

    const formatUsd = (val: number) => {
        const rounded = Math.round(val * 100) / 100;
        return rounded.toString();
    };

    // Truncate long product names for better display
    const truncateName = (name: string, maxLength: number = 28) => {
        if (name.length <= maxLength) return name;
        return name.substring(0, maxLength - 3) + "...";
    };

    return (
        <div id="receipt-print-area" style={containerStyle} className="print-only">
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "12px" }}>
                <h1 style={{ fontSize: "20px", fontWeight: "bold", margin: "0", letterSpacing: "1px" }}>MELLIA RESTO</h1>
                <p style={{ margin: "4px 0", fontSize: "13px", fontStyle: "italic" }}>Mangez comme chez vous</p>
                <p style={{ margin: "3px 0", fontSize: "12px" }}>10, ByPass, Selembao, Kinshasa</p>
            </div>

            <div style={{ textAlign: "center", marginBottom: "8px" }}>
                <p>{separator}</p>
                <p style={{ fontWeight: "bold", fontSize: "15px" }}>TICKET: {sale?.ticketNum}</p>
                <p style={{ fontSize: "13px" }}>{sale?.createdAt ? format(new Date(sale.createdAt), "dd/MM/yyyy HH:mm", { locale: fr }) : ""}</p>
                <p>{separator}</p>
            </div>

            {/* Info */}
            <div style={{ marginBottom: "8px", fontSize: "13px" }}>
                <p style={{ wordWrap: "break-word", overflow: "hidden" }}>Caissier: {truncateName(sale?.user?.name || "...", 25)}</p>
                {sale?.client && <p style={{ wordWrap: "break-word", overflow: "hidden" }}>Client: {truncateName(sale.client.name, 25)}</p>}
                <p>Espace: {sale?.orderType === "DINE_IN" ? "Sur Place" : sale?.orderType === "DELIVERY" ? "Livraison" : sale?.orderType === "TAKEAWAY" ? "À Emporter" : (sale?.orderType || "...")}</p>
            </div>

            <p>{separator}</p>

            {/* Items */}
            <table style={{ width: "100%", fontSize: "13px", borderCollapse: "collapse" }}>
                <thead>
                    <tr style={{ textAlign: "left" }}>
                        <th style={{ paddingBottom: "6px", fontSize: "14px" }}>Qte x Article</th>
                        <th style={{ textAlign: "right", paddingBottom: "6px", fontSize: "14px" }}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {sale?.items?.map((item) => (
                        <tr key={item.id}>
                            <td style={{ paddingBottom: "4px", wordWrap: "break-word", maxWidth: "60%" }}>
                                {Number(item.quantity)} x {truncateName(item.product?.name || "???", 22)}
                                <br />
                                <span style={{ fontSize: "11px", color: "#444" }}>
                                    @{Math.round(Number(item.unitPriceCdf)).toLocaleString()} FC
                                </span>
                            </td>
                            <td style={{ textAlign: "right", verticalAlign: "top", fontSize: "14px", fontWeight: "bold" }}>
                                {(Math.round(Number(item.unitPriceCdf)) * Number(item.quantity)).toLocaleString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <p>{separator}</p>

            {/* Totals */}
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", marginBottom: "4px", fontSize: "16px" }}>
                <span>TOTAL A PAYER:</span>
                <span>{Math.round(Number(sale?.totalCdf || 0)).toLocaleString()} FC</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#666", marginBottom: "12px" }}>
                <span>(Ref USD: ${formatUsd(Number(sale.totalNet))})</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "12px" }}>
                <span>Mode de paiement:</span>
                <span style={{ fontWeight: "bold" }}>{formatPaymentMethod(sale?.paymentMethod || "")}</span>
            </div>

            {/* Loyalty */}
            {sale?.client && (
                <div style={{ border: "1px dashed black", padding: "6px", marginBottom: "12px", textAlign: "center", fontSize: "12px" }}>
                    <p style={{ margin: "0", fontWeight: "bold", fontSize: "13px" }}>FIDELITE MELLIA</p>
                    <p style={{ margin: "3px 0" }}>Points gagnés: +{sale?.pointsEarned || 0}</p>
                    <p style={{ margin: "0", fontWeight: "bold" }}>SOLDE ACTUEL: {sale.client.points} pts</p>
                </div>
            )}

            {/* Footer */}
            <div style={{ textAlign: "center", marginTop: "15px", fontSize: "12px" }}>
                <p style={{ fontWeight: "bold", fontSize: "14px" }}>Merci de votre visite !</p>
                <p>A bientôt chez Mellia Resto.</p>
                <p style={{ marginTop: "10px", fontSize: "11px" }}>Logiciel: MelliaPOS v1.0</p>
            </div>
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #receipt-print-area, #receipt-print-area * {
                        visibility: visible;
                    }
                    #receipt-print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                    }
                }
            `}</style>
        </div>
    );
};

function formatPaymentMethod(method: string) {
    const map: Record<string, string> = {
        CASH: "Espèces",
        CARD: "Carte Bancaire",
        MOBILE_MONEY: "Mobile Money",
        AIRTEL_MONEY: "Airtel Money",
        ORANGE_MONEY: "Orange Money",
        MPESA: "M-Pesa",
        LOYALTY_POINTS: "Points Fidelité",
        SPLIT: "Partagé"
    };
    return map[method] || method;
}
