/** Shared labels and formatting for the menu Achat. */

export const SOURCE_LABELS: Record<string, string> = {
    OWNER_CAPITAL: "Poche du patron",
    CASH_REGISTER: "Caisse du restaurant",
};

export const fc = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} FC`;

/** A sale unit (stock unit) in the singular, for « par bouteille ». */
export const UNIT_SINGULAR: Record<string, string> = {
    BOTTLE: "bouteille", PLATE: "plat", HALF_PLATE: "demi-plat", MEASURE: "mesure", PIECE: "pièce",
    KG: "kg", LITER: "litre", BOX: "boîte", PACK: "paquet",
};

export const unitOne = (unit: string | null | undefined) => UNIT_SINGULAR[unit || ""] || (unit || "unité").toLowerCase();

/** Today's date in Kinshasa (UTC+1), as YYYY-MM-DD. */
export const kinshasaTodayStr = () => new Date(Date.now() + 3600_000).toISOString().slice(0, 10);

/** Kinshasa calendar date of a stored moment, as YYYY-MM-DD. */
export const kinshasaDateStr = (d: string | Date) => new Date(new Date(d).getTime() + 3600_000).toISOString().slice(0, 10);
