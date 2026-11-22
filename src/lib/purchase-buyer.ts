/**
 * Who bought: kept at the start of the purchase description as « [Acheteur: Nom] notes ».
 * Shared by the API and the screens so the format never drifts.
 */

const BUYER_RE = /^\[Acheteur:\s*([^\]]+)\]\s*([\s\S]*)$/;

export function parseBuyer(description: string | null | undefined): { buyer: string | null; notes: string } {
    const desc = description ?? "";
    const m = desc.match(BUYER_RE);
    if (!m) return { buyer: null, notes: desc };
    return { buyer: m[1].trim(), notes: m[2].trim() };
}

export function buildDescription(buyer: string, notes: string): string {
    const b = buyer.trim().replace(/[\[\]]/g, "");
    const n = notes.trim();
    return b ? `[Acheteur: ${b}]${n ? ` ${n}` : ""}` : n;
}

/** Key used to group the same buyer typed with different casing or spaces. */
export function buyerKey(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, " ");
}
