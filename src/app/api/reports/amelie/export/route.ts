import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { buildAmelieReport } from "@/lib/amelie-report";
import * as XLSX from "xlsx";

function dateLabel(value: Date): string {
  return value.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const investmentId = searchParams.get("investmentId")?.trim();
    const report = await buildAmelieReport(investmentId);

    if (!report.selected) {
      return NextResponse.json({ success: false, error: "Aucune session disponible" }, { status: 404 });
    }

    const selected = report.selected;

    const summaryRows = [
      { indicateur: "Session", valeur: selected.label },
      { indicateur: "Date session", valeur: dateLabel(selected.date) },
      {
        indicateur: "Periode session",
        valeur: `${dateLabel(selected.sessionStart)} -> ${dateLabel(selected.sessionEnd)}`,
      },
      { indicateur: "Investi CDF Total", valeur: selected.investedCdfTotal },
      { indicateur: "Investi CDF Boisson", valeur: selected.investedCdfBeverage },
      { indicateur: "Investi CDF Nourriture", valeur: selected.investedCdfFood },
      { indicateur: "Vendu USD Total", valeur: selected.soldUsdTotal },
      { indicateur: "Vendu USD Boisson", valeur: selected.soldUsdBeverage },
      { indicateur: "Vendu USD Nourriture", valeur: selected.soldUsdFood },
      { indicateur: "Profit realise USD", valeur: selected.soldProfitUsd },
      { indicateur: "Qte initiale", valeur: selected.openingQtyTotal },
      { indicateur: "Qte achetee session", valeur: selected.purchasedQtyTotal },
      { indicateur: "Qte vendue session", valeur: selected.soldQtyTotal },
      { indicateur: "Qte restante session", valeur: selected.remainingQtyTotal },
      { indicateur: "Potentiel Terrasse USD", valeur: selected.remainingTerraceUsd },
      { indicateur: "Profit Terrasse USD", valeur: selected.remainingProfitTerraceUsd },
      { indicateur: "Potentiel VIP USD", valeur: selected.remainingVipUsd },
      { indicateur: "Profit VIP USD", valeur: selected.remainingProfitVipUsd },
      {
        indicateur: "Produit top (qte)",
        valeur: selected.topProductByQty
          ? `${selected.topProductByQty.name} (${selected.topProductByQty.qty})`
          : "-",
      },
      {
        indicateur: "Produit top (revenu)",
        valeur: selected.topProductByRevenue
          ? `${selected.topProductByRevenue.name} (${selected.topProductByRevenue.revenueUsd.toFixed(2)} USD)`
          : "-",
      },
    ];

    const dailyRows = report.dailySales.map((row) => ({
      date: row.date,
      boisson_usd: row.beverage,
      nourriture_usd: row.food,
      total_usd: row.total,
    }));

    const productRows = report.products.map((row) => ({
      produit: row.name,
      type: row.type,
      unite: row.unit,
      qte_initiale: row.openingQty,
      qte_achetee_session: row.purchasedQty,
      qte_disponible: row.availableQty,
      qte_vendue: row.soldQty,
      qte_restante: row.remainingQty,
      investi_cdf: row.investedCdf,
      ca_vendu_usd: row.soldUsd,
      profit_vendu_usd: row.soldProfitUsd,
      potentiel_terrasse_usd: row.remainingTerraceUsd,
      potentiel_vip_usd: row.remainingVipUsd,
      profit_terrasse_usd: row.remainingProfitTerraceUsd,
      profit_vip_usd: row.remainingProfitVipUsd,
    }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summaryRows), "Synthese");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(dailyRows), "VentesJournaliere");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(productRows), "Produits");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    const filename = `amelie-${selected.investmentId}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Amelie Export Error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
