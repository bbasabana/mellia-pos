/**
 * PDF report of the Caisse: the balance in FC and in dollars, what it is made of, every day
 * since the start-up / month closure (closed, closed restaurant, still to close), the day
 * closures, the counts of the money in hand, the expenses and the purchases.
 */
import { alignColumns, dt, group, INK, LINE, logoDataUrl, MUTED, pad, TICKET_BG } from "@/lib/sales-pdf";

type DayKind = "CLOSED_OK" | "CLOSED_DAY" | "CLOSED_DAY_SALES" | "TO_CLOSE" | "NO_SALES" | "TODAY";

export type CaisseReport = {
    generatedAt: string;
    generatedBy: string;
    rate: number;
    base: { kind: "OPENING" | "MONTH"; label: string; at: string } | null;
    balanceCdf: number;
    breakdown: {
        openingCdf: number;
        salesCashCdf: number;
        salesCashCount: number;
        expensesCdf: number;
        purchasesCdf: number;
        adjustmentsCdf: number;
        handedToOwnerCdf: number;
        salesOtherCdf: number;
        ownerExpensesCdf: number;
        ownerPurchasesCdf: number;
    };
    days: Array<{ day: string; closedReason: string | null; salesCount: number; salesCashCdf: number; status: DayKind }>;
    closures: Array<{
        id: string;
        day: string;
        salesCashCdf: number;
        expensesCdf: number;
        expectedCdf: number;
        countedCdf: number;
        differenceCdf: number;
        withdrawalCdf: number;
        status: string;
        userName: string;
    }>;
    counts: Array<{ at: string; userName: string; usd: number; cdf: number; rate: number; totalCdf: number; differenceCdf: number; notes: string | null }>;
    expenses: Array<{ date: string; category: string; description: string; source: string; amountCdf: number }>;
    purchases: Array<{ date: string; description: string; source: string; amountCdf: number }>;
};

const fc = (n: number) => `${n < 0 ? "- " : ""}${group(Math.abs(n))} FC`;
const signed = (n: number) => (n > 0 ? `+ ${group(n)} FC` : n < 0 ? `- ${group(-n)} FC` : "0 FC");
const usd = (n: number) => `${n.toFixed(2).replace(".", ",")} $`;
const WEEKDAY = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const dayLabel = (day: string) => {
    const d = new Date(`${day}T00:00:00Z`);
    return `${WEEKDAY[d.getUTCDay()]} ${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}`;
};
const shortDate = (iso: string) => {
    const d = new Date(iso);
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
};
const STATUS: Record<string, string> = { BALANCED: "Correct", TO_VERIFY: "À vérifier", LOSS: "Perte", JUSTIFIED: "Justifié" };
const DAY_STATUS: Record<DayKind, string> = {
    CLOSED_OK: "Clôturée",
    CLOSED_DAY: "Fermé",
    CLOSED_DAY_SALES: "Fermé, mais ventes",
    TO_CLOSE: "À clôturer",
    NO_SALES: "Aucune vente",
    TODAY: "Aujourd'hui",
};
const RED: [number, number, number] = [185, 28, 28];
const AMBER: [number, number, number] = [180, 83, 9];

export function caisseFileName(r: CaisseReport) {
    const d = new Date(r.generatedAt);
    return `caisse-mellia-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}h${pad(d.getMinutes())}.pdf`;
}

export async function buildCaissePdf(r: CaisseReport): Promise<Blob> {
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const M = 12;
    const lastY = () => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
    const section = (title: string, gap = 9) => {
        let y = lastY() + gap;
        if (y > H - 40) {
            doc.addPage();
            y = 18;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...INK);
        doc.text(title, M, y);
        return y + 3;
    };
    const table = { margin: { left: M, right: M, top: 14, bottom: 14 }, headStyles: { fillColor: INK, textColor: 255, fontSize: 8.5 }, styles: { fontSize: 8.5, cellPadding: 1.5, textColor: INK, lineColor: LINE, lineWidth: 0.1 } };

    // ---- header
    const logo = await logoDataUrl();
    if (logo) doc.addImage(logo, "PNG", M, 9, 30, 10, undefined, "FAST");
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("Rapport de caisse", W - M, 14, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    const from = r.base ? `${r.base.kind === "OPENING" ? "Depuis le démarrage" : "Depuis la clôture du mois"} du ${dt(r.base.at)}` : "Depuis le début";
    doc.text(`${from} au ${dt(r.generatedAt)}`, W - M, 19.5, { align: "right" });
    doc.text(`Généré par ${r.generatedBy || "—"} · taux 1 $ = ${group(r.rate)} FC`, W - M, 24, { align: "right" });
    doc.setDrawColor(...LINE);
    doc.line(M, 28, W - M, 28);

    // ---- balance
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text("Solde de la caisse", M, 36);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(...INK);
    doc.text(fc(r.balanceCdf), M, 45);
    doc.setFontSize(12);
    doc.setTextColor(21, 128, 61);
    doc.text(`soit ${usd(r.balanceCdf / (r.rate || 1))}`, M, 51.5);

    const b = r.breakdown;
    autoTable(doc, {
        ...table,
        startY: 56,
        theme: "plain",
        tableWidth: 120,
        styles: { ...table.styles, lineWidth: 0, fontSize: 9.5, cellPadding: { top: 1.2, bottom: 1.2, left: 2, right: 2 } },
        columnStyles: { 0: { textColor: MUTED }, 1: { halign: "right", fontStyle: "bold" } },
        body: [
            [r.base?.kind === "MONTH" ? "Solde de la clôture du mois" : "Argent de départ", fc(b.openingCdf)],
            [`Ventes en espèces (${b.salesCashCount})`, signed(b.salesCashCdf)],
            ["Dépenses payées par la caisse", signed(-b.expensesCdf)],
            ["Achats payés par la caisse", signed(-b.purchasesCdf)],
            ["Corrections (comptages)", signed(-b.adjustmentsCdf)],
            [{ content: "Solde", styles: { textColor: INK, fontStyle: "bold" } }, fc(r.balanceCdf)],
        ],
    });
    autoTable(doc, {
        ...table,
        startY: lastY() + 3,
        theme: "plain",
        tableWidth: 120,
        styles: { ...table.styles, lineWidth: 0, fontSize: 8.5, textColor: MUTED, cellPadding: { top: 0.8, bottom: 0.8, left: 2, right: 2 } },
        columnStyles: { 1: { halign: "right" } },
        body: [
            ["Pour information — remis au patron (reste dans la caisse)", fc(b.handedToOwnerCdf)],
            ["Mobile Money / carte (hors caisse)", fc(b.salesOtherCdf)],
            ["Dépenses payées par le patron", fc(b.ownerExpensesCdf)],
            ["Achats payés par le patron", fc(b.ownerPurchasesCdf)],
        ],
    });

    // ---- days
    if (r.days.length > 0) {
        const y = section("Jour par jour");
        autoTable(doc, {
            ...table,
            startY: y,
            theme: "grid",
            head: [["Jour", "Statut", "Factures", "Ventes espèces", "Attendu", "Compté", "Écart"]],
            body: r.days.map((d) => {
                const c = r.closures.filter((x) => x.day === d.day);
                const sum = (k: "expectedCdf" | "countedCdf" | "differenceCdf") => c.reduce((a, x) => a + x[k], 0);
                const label =
                    d.status === "CLOSED_DAY"
                        ? d.closedReason ?? DAY_STATUS.CLOSED_DAY
                        : d.status === "CLOSED_DAY_SALES"
                        ? `${d.closedReason ?? "Fermé"}, mais ventes`
                        : DAY_STATUS[d.status];
                const tone = d.status === "TO_CLOSE" || d.status === "CLOSED_DAY_SALES" ? AMBER : d.status === "CLOSED_DAY" ? MUTED : INK;
                return [
                    dayLabel(d.day),
                    { content: label, styles: { textColor: tone } },
                    d.salesCount ? String(d.salesCount) : "—",
                    d.salesCashCdf ? fc(d.salesCashCdf) : "—",
                    c.length ? fc(sum("expectedCdf")) : "—",
                    c.length ? fc(sum("countedCdf")) : "—",
                    c.length ? { content: signed(sum("differenceCdf")), styles: { textColor: sum("differenceCdf") < 0 ? RED : sum("differenceCdf") > 0 ? AMBER : INK } } : "—",
                ];
            }),
            columnStyles: { 2: { halign: "center" }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right" } },
            didParseCell: alignColumns({ 2: "center", 3: "right", 4: "right", 5: "right", 6: "right" }),
        });
    }

    // ---- day closures
    if (r.closures.length > 0) {
        const y = section("Clôtures de la journée");
        autoTable(doc, {
            ...table,
            startY: y,
            theme: "striped",
            head: [["Journée", "Attendu", "Compté", "Écart", "Remis au patron", "Statut", "Par"]],
            body: r.closures.map((c) => [dayLabel(c.day), fc(c.expectedCdf), fc(c.countedCdf), signed(c.differenceCdf), c.withdrawalCdf ? fc(c.withdrawalCdf) : "—", STATUS[c.status] ?? c.status, c.userName]),
            columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" } },
            didParseCell: alignColumns({ 1: "right", 2: "right", 3: "right", 4: "right" }),
        });
    }

    // ---- counts of the money in hand
    if (r.counts.length > 0) {
        const y = section("Comptages de l'argent en main");
        autoTable(doc, {
            ...table,
            startY: y,
            theme: "striped",
            head: [["Date", "Dollars", "Francs", "Taux", "Total", "Écart", "Par / note"]],
            body: r.counts.map((c) => [dt(c.at), usd(c.usd), fc(c.cdf), group(c.rate), fc(c.totalCdf), signed(c.differenceCdf), [c.userName, c.notes].filter(Boolean).join(" · ")]),
            columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right", fontStyle: "bold" }, 5: { halign: "right" } },
            didParseCell: alignColumns({ 1: "right", 2: "right", 3: "right", 4: "right", 5: "right" }),
        });
    }

    // ---- expenses and purchases
    const list = (title: string, rows: Array<{ date: string; label: string; source: string; amountCdf: number }>) => {
        if (rows.length === 0) return;
        const y = section(title);
        const total = rows.reduce((a, x) => a + x.amountCdf, 0);
        const caisse = rows.filter((x) => x.source === "Caisse").reduce((a, x) => a + x.amountCdf, 0);
        autoTable(doc, {
            ...table,
            startY: y,
            theme: "striped",
            head: [["Date", "Détail", "Payé par", "Montant"]],
            body: rows.map((x) => [shortDate(x.date), x.label, x.source, fc(x.amountCdf)]),
            foot: [["", `Total (dont caisse : ${fc(caisse)})`, "", fc(total)]],
            footStyles: { fillColor: TICKET_BG, textColor: INK, fontStyle: "bold", fontSize: 8.5 },
            columnStyles: { 0: { cellWidth: 16 }, 2: { cellWidth: 22 }, 3: { halign: "right", cellWidth: 30 } },
            didParseCell: alignColumns({ 3: "right" }),
        });
    };
    list("Dépenses", r.expenses.map((e) => ({ date: e.date, label: `${e.category} — ${e.description}`, source: e.source, amountCdf: e.amountCdf })));
    list("Achats", r.purchases.map((p) => ({ date: p.date, label: p.description || "Achat", source: p.source, amountCdf: p.amountCdf })));

    // ---- footer
    const pages = doc.getNumberOfPages();
    for (let p = 1; p <= pages; p++) {
        doc.setPage(p);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...MUTED);
        doc.text("Mellia POS — rapport de caisse", M, H - 7);
        doc.text(`Page ${p} / ${pages}`, W - M, H - 7, { align: "right" });
    }
    return doc.output("blob");
}
