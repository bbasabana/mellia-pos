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
};

export const ReceiptTemplate = ({ sale, width = "80mm" }: ReceiptProps) => {
    // Styles specifics to print
    const containerStyle = {
        width: width === "58mm" ? "58mm" : "80mm",
        padding: "5mm",
        margin: "0 auto",
        backgroundColor: "white",
        color: "black",
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: "12px",
        lineHeight: "1.2",
    };

    const separator = "------------------------------------------";

    return (
        <div id="receipt-print-area" style={containerStyle} className="print-only">
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "10px" }}>
                <h1 style={{ fontSize: "16px", fontWeight: "bold", margin: "0" }}>MELLIA RESTO & BAR</h1>
                <p style={{ margin: "2px 0", fontSize: "10px" }}>Avenue Pumbu, Gombe, Kinshasa</p>
                <p style={{ margin: "2px 0", fontSize: "10px" }}>Tel: +243 81 000 0000</p>
            </div>

            <div style={{ textAlign: "center", marginBottom: "5px" }}>
                <p>{separator}</p>
                <p style={{ fontWeight: "bold" }}>TICKET: {sale.ticketNum}</p>
                <p>{format(new Date(sale.createdAt), "dd/MM/yyyy HH:mm", { locale: fr })}</p>
                <p>{separator}</p>
            </div>

            {/* Info */}
            <div style={{ marginBottom: "5px", fontSize: "11px" }}>
                <p>Caissier: {sale.user.name}</p>
                {sale.client && <p>Client: {sale.client.name}</p>}
                <p>Espace: {sale.orderType === "DINE_IN" ? "Sur Place" : sale.orderType}</p>
            </div>

            <p>{separator}</p>

            {/* Items */}
            <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                <thead>
                    <tr style={{ textAlign: "left" }}>
                        <th style={{ paddingBottom: "5px" }}>Qte x Article</th>
                        <th style={{ textAlign: "right", paddingBottom: "5px" }}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {sale.items.map((item) => (
                        <tr key={item.id}>
                            <td style={{ paddingBottom: "2px" }}>
                                {Number(item.quantity)} x {item.product.name}
                                <br />
                                <span style={{ fontSize: "10px", color: "#444" }}>
                                    @{Number(item.unitPrice).toLocaleString()} FC
                                </span>
                            </td>
                            <td style={{ textAlign: "right", verticalAlign: "top" }}>
                                {Number(item.totalPrice).toLocaleString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <p>{separator}</p>

            {/* Totals */}
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", marginBottom: "2px" }}>
                <span>TOTAL A PAYER:</span>
                <span>{Number(sale.totalNet).toLocaleString()} FC</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "10px" }}>
                <span>Mode de paiement:</span>
                <span>{formatPaymentMethod(sale.paymentMethod)}</span>
            </div>

            {/* Loyalty */}
            {sale.client && (
                <div style={{ border: "1px dashed black", padding: "5px", marginBottom: "10px", textAlign: "center", fontSize: "10px" }}>
                    <p style={{ margin: "0", fontWeight: "bold" }}>FIDELITE MELLIA</p>
                    <p style={{ margin: "2px 0" }}>Points gagnés: +{sale.pointsEarned}</p>
                    <p style={{ margin: "0" }}>SOLDE ACTUEL: {sale.client.points} pts</p>
                </div>
            )}

            {/* Footer */}
            <div style={{ textAlign: "center", marginTop: "15px", fontSize: "10px" }}>
                <p>Merci de votre visite !</p>
                <p>A bientôt chez Mellia.</p>
                <p style={{ marginTop: "10px" }}>Logiciel: MelliaPOS v1.0</p>
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
