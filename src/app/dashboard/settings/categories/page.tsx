"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Plus, Trash2, Edit2, X, AlertTriangle, Check, Save, Settings, Layers, Box } from "lucide-react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function CategoriesPage() {
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<Record<string, any[]>>({});
    const [productTypes, setProductTypes] = useState<any[]>([]);

    // --- Product Type Form State ---
    const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
    const [typeModalMode, setTypeModalMode] = useState<"create" | "edit">("create");
    const [currentType, setCurrentType] = useState({
        id: "",
        code: "",
        label: "",
        labelEn: "",
        active: true,
    });
    const [deleteTypeModalOpen, setDeleteTypeModalOpen] = useState(false);
    const [typeToDelete, setTypeToDelete] = useState<{ id: string; label: string } | null>(null);

    // --- Category Form State ---
    const [isInternalModalOpen, setIsInternalModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [currentCategory, setCurrentCategory] = useState({
        id: "",
        code: "",
        label: "",
        productType: "BEVERAGE",
        labelEn: "",
        active: true,
    });
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; label: string } | null>(null);

    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "loading") return;

        const userRole = (session?.user as any)?.role;
        if (!session || userRole !== "ADMIN") {
            router.push("/dashboard"); // Redirect unauthorized users
        } else {
            fetchData();
        }
    }, [session, status, router]);

    const fetchData = async () => {
        try {
            // Fetch both in parallel
            const [typesRes, categoriesRes] = await Promise.all([
                fetch("/api/product-types"),
                fetch("/api/categories")
            ]);

            const typesData = await typesRes.json();
            const categoriesData = await categoriesRes.json();

            if (typesData.success) {
                setProductTypes(typesData.data);
            }

            if (categoriesData.success) {
                setCategories(categoriesData.data.categories);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- Product Type Handlers ---
    const resetTypeForm = () => {
        setCurrentType({ id: "", code: "", label: "", labelEn: "", active: true });
        setTypeModalMode("create");
    };

    const openCreateTypeModal = () => {
        resetTypeForm();
        setIsTypeModalOpen(true);
    };

    const openEditTypeModal = (type: any) => {
        setCurrentType({
            id: type.id,
            code: type.code,
            label: type.label,
            labelEn: type.labelEn || "",
            active: type.active,
        });
        setTypeModalMode("edit");
        setIsTypeModalOpen(true);
    };

    const handleSaveType = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = typeModalMode === "create"
                ? "/api/product-types"
                : `/api/product-types/${currentType.id}`;

            const method = typeModalMode === "create" ? "POST" : "PUT";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(currentType),
            });
            const data = await res.json();
            if (data.success) {
                fetchData(); // Reload everything
                setIsTypeModalOpen(false);
                resetTypeForm();
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error("Error saving type:", error);
        }
    };

    const openDeleteTypeModal = (id: string, label: string) => {
        setTypeToDelete({ id, label });
        setDeleteTypeModalOpen(true);
    };

    const handleDeleteType = async () => {
        if (!typeToDelete) return;
        try {
            const res = await fetch(`/api/product-types/${typeToDelete.id}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (data.success) {
                fetchData();
                setDeleteTypeModalOpen(false);
                setTypeToDelete(null);
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error("Error deleting type:", error);
        }
    };

    // --- Category Handlers ---
    const resetForm = () => {
        setCurrentCategory({
            id: "",
            code: "",
            label: "",
            productType: productTypes[0]?.code || "BEVERAGE",
            labelEn: "",
            active: true,
        });
        setModalMode("create");
    };

    const openCreateModal = () => {
        resetForm();
        setIsInternalModalOpen(true);
    };

    const openEditModal = (cat: any) => {
        setCurrentCategory({
            id: cat.id,
            code: cat.code,
            label: cat.label,
            productType: cat.productType,
            labelEn: cat.labelEn || "",
            active: cat.active,
        });
        setModalMode("edit");
        setIsInternalModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = modalMode === "create"
                ? "/api/categories"
                : `/api/categories/${currentCategory.id}`;

            const method = modalMode === "create" ? "POST" : "PUT";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(currentCategory),
            });
            const data = await res.json();
            if (data.success) {
                fetchData();
                setIsInternalModalOpen(false);
                resetForm();
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error("Error saving category:", error);
        }
    };

    const openDeleteModal = (id: string, label: string) => {
        setCategoryToDelete({ id, label });
        setDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!categoryToDelete) return;
        try {
            const res = await fetch(`/api/categories/${categoryToDelete.id}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (data.success) {
                fetchData();
                setDeleteModalOpen(false);
                setCategoryToDelete(null);
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error("Error deleting category:", error);
        }
    };

    // Helper to get color for type
    const getTypeColor = (code: string) => {
        if (code === "BEVERAGE") return { text: "text-[#1e40af]", bg: "bg-[#eff6ff]", border: "border-blue-100", dot: "bg-[#1e40af]" };
        if (code === "FOOD") return { text: "text-[#9a3412]", bg: "bg-[#fff7ed]", border: "border-orange-100", dot: "bg-[#ea580c]" };
        return { text: "text-gray-700", bg: "bg-gray-50", border: "border-gray-200", dot: "bg-gray-400" };
    };

    // Calculate Counts for KPI
    const totalTypes = productTypes.length;
    const totalCategories = Object.values(categories).reduce((acc, curr) => acc + curr.length, 0);

    return (
        <DashboardLayout>
            <div className="w-full h-full flex flex-col p-8 overflow-y-auto bg-gray-50/50">
                {/* HEADER */}
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <Settings className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Configuration Produits</h1>
                            <p className="text-sm text-gray-500">Gérez les types de produits et leurs catégories</p>
                        </div>
                    </div>
                </div>

                {/* KPI CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    <KpiCard
                        title="Types Définis"
                        value={totalTypes}
                        icon={<Box size={20} />}
                        color="bg-blue-50 text-blue-600 border-blue-100"
                    />
                    <KpiCard
                        title="Catégories Totales"
                        value={totalCategories}
                        icon={<Layers size={20} />}
                        color="bg-orange-50 text-orange-600 border-orange-100"
                    />
                </div>

                {/* CONTENT */}
                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00d3fa]"></div>
                    </div>
                ) : (
                    <div className="space-y-10">
                        {/* SECTION: PRODUCT TYPES */}
                        <section>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <span className="w-1.5 h-6 bg-[#00d3fa] rounded-full"></span>
                                    Types de Produits
                                </h2>
                                <button
                                    onClick={openCreateTypeModal}
                                    className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                                >
                                    <Plus size={16} />
                                    Nouveau Type
                                </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {productTypes.map((type) => (
                                    <div key={type.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between group hover:border-[#00d3fa]/50 transition-all hover:shadow-md">
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="font-bold text-gray-900">{type.label}</div>
                                                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${type.active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                    {type.code}
                                                </span>
                                            </div>
                                            {type.labelEn && <div className="text-xs text-gray-400 italic mb-3">({type.labelEn})</div>}
                                        </div>
                                        <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openEditTypeModal(type)}
                                                className="p-1.5 text-gray-400 hover:text-[#00d3fa] hover:bg-cyan-50 rounded-md transition-all"
                                                title="Modifier"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => openDeleteTypeModal(type.id, type.label)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                                                title="Supprimer"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <hr className="border-gray-200 dashed" />

                        {/* SECTION: CATEGORIES */}
                        <section>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <span className="w-1.5 h-6 bg-[#f97316] rounded-full"></span>
                                    Catégories
                                </h2>
                                <button
                                    onClick={openCreateModal}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#00d3fa] text-white text-sm font-medium rounded-lg hover:bg-[#00b8e0] transition-colors shadow-blue-500/20 shadow-md"
                                >
                                    <Plus size={20} />
                                    Nouvelle Catégorie
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {productTypes.map((type) => {
                                    const typeCategories = categories[type.code] || [];
                                    const colors = getTypeColor(type.code);

                                    return (
                                        <div key={type.code} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col h-full">
                                            <div className={`${colors.bg} px-6 py-4 border-b ${colors.border} flex justify-between items-center`}>
                                                <h3 className={`font-semibold ${colors.text} flex items-center gap-2`}>
                                                    <div className={`w-2 h-2 rounded-full ${colors.dot}`}></div>
                                                    {type.label}
                                                </h3>
                                                <span className={`text-xs bg-white px-2 py-1 rounded-full ${colors.text} font-medium border ${colors.border}`}>
                                                    {typeCategories.length}
                                                </span>
                                            </div>
                                            <div className="flex-1 overflow-x-auto">
                                                <table className="w-full">
                                                    <tbody className="divide-y divide-gray-100">
                                                        {typeCategories.map((cat) => (
                                                            <tr key={cat.id} className="hover:bg-gray-50 group transition-colors">
                                                                <td className="px-6 py-4">
                                                                    <div className="font-medium text-gray-900">{cat.label}</div>
                                                                    <div className="flex gap-2 items-center mt-1">
                                                                        <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 border border-gray-200">{cat.code}</span>
                                                                        {cat.labelEn && <span className="text-xs text-gray-400 italic">({cat.labelEn})</span>}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <button
                                                                            onClick={() => openEditModal(cat)}
                                                                            className="p-2 text-gray-400 hover:text-[#00d3fa] hover:bg-cyan-50 rounded-lg transition-all"
                                                                            title="Modifier"
                                                                        >
                                                                            <Edit2 size={16} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => openDeleteModal(cat.id, cat.label)}
                                                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                                            title="Supprimer"
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {typeCategories.length === 0 && (
                                                            <tr>
                                                                <td colSpan={2} className="px-6 py-12 text-center text-gray-400 text-sm">
                                                                    Aucune catégorie pour {type.label}
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    </div>
                )}

                {/* --- MODALS --- */}

                {/* TYPE MODAL (CREATE/EDIT) */}
                {isTypeModalOpen && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-900">
                                    {typeModalMode === "create" ? "Nouveau Type de Produit" : "Modifier Type"}
                                </h2>
                                <button onClick={() => setIsTypeModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleSaveType} className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Code (Unique, MAJUSCULES)
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:border-[#00d3fa] focus:ring-2 focus:ring-[#00d3fa]/20 outline-none transition-all"
                                        placeholder="Ex: SNACK"
                                        value={currentType.code}
                                        onChange={(e) => setCurrentType({ ...currentType, code: e.target.value.toUpperCase() })}
                                        required
                                        disabled={typeModalMode === "edit"} // Prevent changing code on edit
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom (Français)</label>
                                    <input
                                        type="text"
                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:border-[#00d3fa] focus:ring-2 focus:ring-[#00d3fa]/20 outline-none transition-all"
                                        placeholder="Ex: En-cas"
                                        value={currentType.label}
                                        onChange={(e) => setCurrentType({ ...currentType, label: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom (Anglais - Optionnel)</label>
                                    <input
                                        type="text"
                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:border-[#00d3fa] focus:ring-2 focus:ring-[#00d3fa]/20 outline-none transition-all"
                                        placeholder="Ex: Snacks"
                                        value={currentType.labelEn}
                                        onChange={(e) => setCurrentType({ ...currentType, labelEn: e.target.value })}
                                    />
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <input
                                        type="checkbox"
                                        id="typeActive"
                                        className="w-4 h-4 text-[#00d3fa] border-gray-300 rounded focus:ring-[#00d3fa]"
                                        checked={currentType.active}
                                        onChange={(e) => setCurrentType({ ...currentType, active: e.target.checked })}
                                    />
                                    <label htmlFor="typeActive" className="text-sm text-gray-700">Actif</label>
                                </div>

                                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => setIsTypeModalOpen(false)}
                                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-[#00d3fa] text-white rounded-lg hover:bg-[#00b8e0] font-medium shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
                                    >
                                        <Save size={18} />
                                        {typeModalMode === "create" ? "Créer" : "Mettre à jour"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* DELETE TYPE MODAL */}
                {deleteTypeModalOpen && typeToDelete && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4">
                                    <AlertTriangle size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Supprimer le Type</h3>
                                <p className="text-gray-500 text-sm">
                                    Voulez-vous supprimer le type <span className="font-semibold text-gray-900">&quot;{typeToDelete.label}&quot;</span> ?
                                    <br />Cela ne fonctionnera que si aucune catégorie n&apos;y est liée.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteTypeModalOpen(false)} className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
                                <button onClick={handleDeleteType} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-md shadow-red-500/20">Supprimer</button>
                            </div>
                        </div>
                    </div>
                )}


                {/* CATEGORY MODAL EDIT/CREATE */}
                {isInternalModalOpen && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-900">
                                    {modalMode === "create" ? "Nouvelle Catégorie" : "Modifier Catégorie"}
                                </h2>
                                <button onClick={() => setIsInternalModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="flex flex-col gap-4">
                                {modalMode === "create" && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Type de Produit
                                            </label>
                                            <select
                                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:border-[#00d3fa] focus:ring-2 focus:ring-[#00d3fa]/20 outline-none transition-all"
                                                value={currentCategory.productType}
                                                onChange={(e) =>
                                                    setCurrentCategory({ ...currentCategory, productType: e.target.value })
                                                }
                                            >
                                                {productTypes.map(type => (
                                                    <option key={type.code} value={type.code}>{type.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Code (Unique, MAJUSCULES)
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:border-[#00d3fa] focus:ring-2 focus:ring-[#00d3fa]/20 outline-none transition-all"
                                                placeholder="Ex: SANDWICH"
                                                value={currentCategory.code}
                                                onChange={(e) =>
                                                    setCurrentCategory({ ...currentCategory, code: e.target.value.toUpperCase() })
                                                }
                                                required
                                            />
                                        </div>
                                    </>
                                )}

                                {modalMode === "edit" && (
                                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 mb-2">
                                        <div className="text-xs text-gray-500 uppercase font-semibold">Code</div>
                                        <div className="font-mono text-gray-900 font-bold">{currentCategory.code}</div>
                                        <div className="text-xs text-gray-500 mt-1 uppercase font-semibold">Type</div>
                                        <div className="text-gray-900">
                                            {productTypes.find(t => t.code === currentCategory.productType)?.label || currentCategory.productType}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nom (Français)
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:border-[#00d3fa] focus:ring-2 focus:ring-[#00d3fa]/20 outline-none transition-all"
                                        placeholder="Ex: Sandwich"
                                        value={currentCategory.label}
                                        onChange={(e) =>
                                            setCurrentCategory({ ...currentCategory, label: e.target.value })
                                        }
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nom (Anglais - Optionnel)
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:border-[#00d3fa] focus:ring-2 focus:ring-[#00d3fa]/20 outline-none transition-all"
                                        placeholder="Ex: Sandwich"
                                        value={currentCategory.labelEn}
                                        onChange={(e) =>
                                            setCurrentCategory({ ...currentCategory, labelEn: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => setIsInternalModalOpen(false)}
                                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-[#00d3fa] text-white rounded-lg hover:bg-[#00b8e0] font-medium shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
                                    >
                                        <Save size={18} />
                                        {modalMode === "create" ? "Créer" : "Mettre à jour"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* DELETE CATEGORY CONFIRMATION MODAL */}
                {deleteModalOpen && categoryToDelete && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4">
                                    <AlertTriangle size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Confirmer la suppression</h3>
                                <p className="text-gray-500 text-sm">
                                    Êtes-vous sûr de vouloir supprimer la catégorie <span className="font-semibold text-gray-900">&quot;{categoryToDelete.label}&quot;</span> ?
                                    <br />Cette action est irréversible.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteModalOpen(false)}
                                    className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-md shadow-red-500/20 transition-all"
                                >
                                    Supprimer
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
