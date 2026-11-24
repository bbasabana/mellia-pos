"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarOff, Loader2, Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { showToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { closedReason, kinshasaToday, WEEKDAYS, type ClosedDays } from "@/lib/closed-days";

type Loaded = ClosedDays & { updatedAt: string | null; updatedBy: string | null };

// Monday first, like the restaurant's week.
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const dateLabel = (day: string) => {
    const [y, m, d] = day.split("-").map(Number);
    return format(new Date(y, m - 1, d), "EEE d MMM yyyy", { locale: fr });
};

/**
 * "Jours de fermeture": the weekdays the restaurant does not work (e.g. Tuesday) and the
 * holidays. Those days need no sale and no day closure; the reports show them as closed.
 */
export default function ClosedDaysCard({ canEdit }: { canEdit: boolean }) {
    const [data, setData] = useState<Loaded | null>(null);
    const [editing, setEditing] = useState(false);

    const load = useCallback(async () => {
        try {
            const res = await fetch("/api/settings/closed-days");
            const json = await res.json();
            if (json.success) setData(json.data);
        } catch {
            /* the card simply stays empty */
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const today = kinshasaToday();
    const todayClosed = data ? closedReason(today, data) : null;
    const upcoming = (data?.dates ?? []).filter((d) => d.date >= today);

    return (
        <div className="ui-card p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <CalendarOff size={16} className="text-gray-400" />
                    Jours de fermeture
                </p>
                {canEdit && (
                    <button type="button" onClick={() => setEditing(true)} className="text-xs font-semibold text-blue-600 hover:underline">
                        Modifier
                    </button>
                )}
            </div>
            {!data ? (
                <Loader2 size={16} className="animate-spin text-gray-400" />
            ) : (
                <>
                    {todayClosed && (
                        <p className="text-xs rounded-md bg-indigo-50 text-indigo-800 px-2.5 py-1.5">
                            Aujourd&apos;hui : {todayClosed}. Pas de vente ni de clôture attendue ; les dépenses et achats du jour
                            comptent normalement.
                        </p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                        {WEEK_ORDER.map((wd) => (
                            <span
                                key={wd}
                                className={cn(
                                    "ui-chip",
                                    data.weekdays.includes(wd) ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400"
                                )}
                            >
                                {cap(WEEKDAYS[wd]).slice(0, 3)}
                            </span>
                        ))}
                    </div>
                    <p className="text-xs text-gray-500">
                        {data.weekdays.length === 0
                            ? "Ouvert tous les jours."
                            : `Fermé chaque ${data.weekdays.map((wd) => WEEKDAYS[wd]).join(", ")}.`}
                        {upcoming.length > 0 &&
                            ` Jours fériés à venir : ${upcoming
                                .slice(0, 3)
                                .map((d) => `${dateLabel(d.date)}${d.label ? ` (${d.label})` : ""}`)
                                .join(", ")}${upcoming.length > 3 ? "…" : ""}.`}
                    </p>
                </>
            )}
            {editing && data && (
                <ClosedDaysModal
                    initial={data}
                    onClose={() => setEditing(false)}
                    onSaved={(d) => {
                        setData(d);
                        setEditing(false);
                    }}
                />
            )}
        </div>
    );
}

function ClosedDaysModal({ initial, onClose, onSaved }: { initial: Loaded; onClose: () => void; onSaved: (d: Loaded) => void }) {
    const [weekdays, setWeekdays] = useState<number[]>(initial.weekdays);
    const [dates, setDates] = useState(initial.dates);
    const [newDate, setNewDate] = useState("");
    const [newLabel, setNewLabel] = useState("");
    const [saving, setSaving] = useState(false);

    const toggle = (wd: number) => setWeekdays((w) => (w.includes(wd) ? w.filter((x) => x !== wd) : [...w, wd]));
    const add = () => {
        if (!newDate) return;
        setDates((d) => [...d.filter((x) => x.date !== newDate), { date: newDate, label: newLabel.trim() }].sort((a, b) => a.date.localeCompare(b.date)));
        setNewDate("");
        setNewLabel("");
    };

    const save = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/settings/closed-days", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ weekdays, dates }),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.error);
            showToast("Jours de fermeture enregistrés", "success");
            onSaved(json.data);
        } catch (e) {
            showToast(e instanceof Error ? e.message : "Enregistrement impossible", "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen onClose={onClose} title="Jours de fermeture" size="md">
            <div className="space-y-5">
                <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-900">Chaque semaine</p>
                    <p className="text-xs text-gray-500">Les jours où le restaurant ne travaille pas : aucune vente ni clôture attendue.</p>
                    <div className="grid grid-cols-4 gap-1.5">
                        {WEEK_ORDER.map((wd) => (
                            <button
                                key={wd}
                                type="button"
                                onClick={() => toggle(wd)}
                                className={cn(
                                    "rounded-lg border py-2 text-xs font-semibold transition-colors",
                                    weekdays.includes(wd)
                                        ? "border-gray-900 bg-gray-900 text-white"
                                        : "border-gray-200 text-gray-600 hover:border-gray-400"
                                )}
                            >
                                {cap(WEEKDAYS[wd])}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-900">Jours fériés et fermetures exceptionnelles</p>
                    <div className="grid grid-cols-2 gap-2">
                        <input
                            type="date"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                            className="min-w-0 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                            aria-label="Date"
                        />
                        <input
                            value={newLabel}
                            onChange={(e) => setNewLabel(e.target.value)}
                            placeholder="Motif (ex : Noël)"
                            maxLength={60}
                            className="min-w-0 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        />
                        <button type="button" onClick={add} disabled={!newDate} className="ui-btn-ghost col-span-2">
                            <Plus size={14} /> Ajouter ce jour
                        </button>
                    </div>
                    {dates.length === 0 ? (
                        <p className="text-xs text-gray-400">Aucun jour férié enregistré.</p>
                    ) : (
                        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100 max-h-56 overflow-auto">
                            {dates.map((d) => (
                                <li key={d.date} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                                    <span>
                                        {cap(dateLabel(d.date))}
                                        {d.label && <span className="text-gray-500 normal-case"> · {d.label}</span>}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setDates((all) => all.filter((x) => x.date !== d.date))}
                                        className="text-gray-400 hover:text-red-600"
                                        aria-label="Retirer"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <button type="button" onClick={save} disabled={saving} className="ui-btn-primary w-full py-3">
                    {saving && <Loader2 size={16} className="animate-spin" />}
                    Enregistrer
                </button>
            </div>
        </Modal>
    );
}
