/**
 * PDF of the sales of a period, ticket by ticket with their articles, to send to the staff
 * (WhatsApp) so they can check it against their paper notes. Built in the browser.
 */

export type SalesReport = {
    scope: "open" | "filter";
    from: string | null;
    to: string;
    generatedAt: string;
    generatedBy: string;
    truncated: boolean;
    tickets: Array<{
        n: number;
        ticketNum: string;
        createdAt: string;
        cashier: string;
        client: string | null;
        payment: string;
        isCash: boolean;
        discountCdf: number;
        totalCdf: number;
        items: Array<{ name: string; qty: number; space: string; unitCdf: number; totalCdf: number }>;
    }>;
    totals: {
        count: number;
        articles: number;
        totalCdf: number;
        cashCdf: number;
        otherCdf: number;
        bySpace: Array<{ space: string; totalCdf: number }>;
    };
    products: Array<{ name: string; space: string; qty: number; totalCdf: number }>;
    cancelled: { count: number; totalCdf: number };
};

// jsPDF's built-in fonts only know Latin-1: no narrow no-break spaces from toLocaleString.
const group = (n: number) =>
    Math.round(n)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const fc = (n: number) => `${group(n)} FC`;
const qty = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(".", ","));
const pad = (n: number) => String(n).padStart(2, "0");
const dt = (iso: string) => {
    const d = new Date(iso);
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const dayTime = (iso: string) => {
    const d = new Date(iso);
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Aligns header and footer cells like the body of their column. */
const alignColumns =
    (aligns: Record<number, "left" | "center" | "right">) =>
    (data: { section: string; column: { index: number }; cell: { styles: { halign?: string } } }) => {
        const a = aligns[data.column.index];
        if (a && data.section !== "body") data.cell.styles.halign = a;
    };

const INK: [number, number, number] = [15, 23, 42];
const MUTED: [number, number, number] = [100, 116, 139];
const LINE: [number, number, number] = [226, 232, 240];
const TICKET_BG: [number, number, number] = [241, 245, 249];

async function logoDataUrl(): Promise<string | null> {
    try {
        const res = await fetch("/images/logos/logo.png");
        if (!res.ok) return null;
        const blob = await res.blob();
        return await new Promise((resolve) => {
            const r = new FileReader();
            r.onload = () => resolve(typeof r.result === "string" ? r.result : null);
            r.onerror = () => resolve(null);
            r.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
}

export function reportFileName(r: SalesReport) {
    const d = new Date(r.to);
    return `ventes-mellia-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}h${pad(d.getMinutes())}.pdf`;
}

export async function buildSalesPdf(r: SalesReport): Promise<Blob> {
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
    const M = 12;

    // ---- header
    const logo = await logoDataUrl();
    if (logo) doc.addImage(logo, "PNG", M, 9, 30, 10);
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("Ventes à vérifier", W - M, 14, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    const period = r.from ? `Du ${dt(r.from)} au ${dt(r.to)}` : `Jusqu'au ${dt(r.to)}`;
    doc.text(r.scope === "open" ? `Journée en cours (depuis la dernière clôture) — ${period}` : period, W - M, 19.5, {
        align: "right",
    });
    doc.text(`Généré le ${dt(r.generatedAt)}${r.generatedBy ? ` par ${r.generatedBy}` : ""}`, W - M, 24, { align: "right" });
    doc.setDrawColor(...LINE);
    doc.line(M, 28, W - M, 28);

    // ---- summary
    const summary: [string, string][] = [
        ["Factures", String(r.totals.count)],
        ["Articles vendus", qty(r.totals.articles)],
        ["Total des ventes", fc(r.totals.totalCdf)],
        ["Payé en espèces", fc(r.totals.cashCdf)],
        ["Mobile Money / carte", fc(r.totals.otherCdf)],
        ...r.totals.bySpace.map((s): [string, string] => [`Prix ${s.space}`, fc(s.totalCdf)]),
    ];
    if (r.cancelled.count > 0) summary.push(["Factures annulées (non comptées)", `${r.cancelled.count} — ${fc(r.cancelled.totalCdf)}`]);

    autoTable(doc, {
        startY: 32,
        margin: { left: M, right: M },
        theme: "plain",
        styles: { fontSize: 9.5, cellPadding: { top: 1.3, bottom: 1.3, left: 2, right: 2 }, textColor: INK },
        columnStyles: { 0: { textColor: MUTED }, 1: { halign: "right", fontStyle: "bold" } },
        body: summary,
        tableWidth: 100,
    });

    // ---- tickets
    type Row = Parameters<typeof autoTable>[1]["body"];
    const body: NonNullable<Row> = [];
    for (const t of r.tickets) {
        const who = [t.payment, t.cashier, t.client].filter(Boolean).join(" · ");
        body.push([
            {
                content: `Facture ${t.n}   ${t.ticketNum}   ${dayTime(t.createdAt)}   ${who}`,
                colSpan: 4,
                styles: { fontStyle: "bold", fillColor: TICKET_BG },
            },
            { content: fc(t.totalCdf), styles: { fontStyle: "bold", halign: "right", fillColor: TICKET_BG } },
        ]);
        for (const i of t.items) {
            body.push([`   ${i.name}`, qty(i.qty), i.space, fc(i.unitCdf), fc(i.totalCdf)]);
        }
        if (t.discountCdf > 0) {
            body.push([{ content: "   Remise", colSpan: 4, styles: { textColor: MUTED } }, `- ${fc(t.discountCdf)}`]);
        }
    }
    body.push([
        { content: `TOTAL — ${r.totals.count} facture${r.totals.count > 1 ? "s" : ""}`, colSpan: 4, styles: { fontStyle: "bold" } },
        { content: fc(r.totals.totalCdf), styles: { fontStyle: "bold", halign: "right" } },
    ]);

    const afterSummary = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
    autoTable(doc, {
        startY: afterSummary + 6,
        margin: { left: M, right: M, top: 14, bottom: 14 },
        head: [["Facture / article", "Qté", "Prix", "Prix unit.", "Total"]],
        body,
        theme: "grid",
        headStyles: { fillColor: INK, textColor: 255, fontSize: 9 },
        styles: { fontSize: 9, cellPadding: 1.6, lineColor: LINE, lineWidth: 0.1, textColor: INK },
        columnStyles: {
            0: { cellWidth: "auto" },
            1: { halign: "center", cellWidth: 12 },
            2: { cellWidth: 30 },
            3: { halign: "right", cellWidth: 26 },
            4: { halign: "right", cellWidth: 28 },
        },
        rowPageBreak: "avoid",
        didParseCell: alignColumns({ 1: "center", 3: "right", 4: "right" }),
    });

    // ---- recap by article
    if (r.products.length > 0) {
        let y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
        if (y > doc.internal.pageSize.getHeight() - 40) {
            doc.addPage();
            y = 16;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...INK);
        doc.text("Récapitulatif par article", M, y);
        autoTable(doc, {
            startY: y + 3,
            margin: { left: M, right: M, top: 14, bottom: 14 },
            head: [["Article", "Prix", "Qté", "Total"]],
            body: r.products.map((p) => [p.name, p.space, qty(p.qty), fc(p.totalCdf)]),
            foot: [["Total", "", qty(r.totals.articles), fc(r.totals.totalCdf)]],
            theme: "striped",
            headStyles: { fillColor: INK, textColor: 255, fontSize: 9 },
            footStyles: { fillColor: TICKET_BG, textColor: INK, fontStyle: "bold" },
            styles: { fontSize: 9, cellPadding: 1.6, textColor: INK },
            columnStyles: { 1: { cellWidth: 30 }, 2: { halign: "center", cellWidth: 14 }, 3: { halign: "right", cellWidth: 30 } },
            didParseCell: alignColumns({ 2: "center", 3: "right" }),
        });
    }

    if (r.truncated) {
        const y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
        doc.setFontSize(8.5);
        doc.setTextColor(185, 28, 28);
        doc.text("Liste limitée aux 2 000 premières factures : choisissez une période plus courte.", M, y);
    }

    // ---- footer on every page
    const pages = doc.getNumberOfPages();
    for (let p = 1; p <= pages; p++) {
        doc.setPage(p);
        doc.setFontSize(8);
        doc.setTextColor(...MUTED);
        const H = doc.internal.pageSize.getHeight();
        doc.text("Mellia POS — à comparer avec le cahier de la caisse", M, H - 7);
        doc.text(`Page ${p} / ${pages}`, W - M, H - 7, { align: "right" });
    }

    return doc.output("blob");
}

/** On a phone: the share sheet (WhatsApp…); elsewhere a download. */
export async function shareOrDownload(blob: Blob, fileName: string): Promise<"shared" | "downloaded"> {
    const file = new File([blob], fileName, { type: "application/pdf" });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (mobile && nav.share && nav.canShare?.({ files: [file] })) {
        try {
            await nav.share({ files: [file], title: "Ventes Mellia" });
            return "shared";
        } catch (e) {
            if (e instanceof DOMException && e.name === "AbortError") return "shared";
        }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return "downloaded";
}
