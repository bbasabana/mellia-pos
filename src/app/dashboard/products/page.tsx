"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Edit,
  Eye,
  Trash2,
  Package,
  Tags,
  LayoutGrid,
  Store,
  Search,
  Filter,
  Loader2
} from "lucide-react";
import { ProductFilters } from "@/components/products/ProductFilters";
import { ProductViewModal } from "@/components/products/ProductViewModal";
import { ProductEditModal } from "@/components/products/ProductEditModal";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { cn } from "@/lib/utils";

function ProductsPageContent() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const isAdmin = userRole === "ADMIN";
  const canEdit = ["ADMIN", "MANAGER"].includes(userRole);

  const [products, setProducts] = useState<any[]>([]);
  const [spaces, setSpaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sizeFilter, setSizeFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<any>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, spacesRes] = await Promise.all([
        fetch("/api/products").then((r) => r.json()),
        fetch("/api/sale-spaces").then((r) => r.json()),
      ]);

      if (productsRes.success) setProducts(productsRes.data);
      if (spacesRes.success) setSpaces(spacesRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return; // Guard clause
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        fetchData();
        setDeleteModalOpen(false);
        setProductToDelete(null);
      } else {
        alert(data.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
    }
  };

  const openViewModal = (product: any) => {
    setSelectedProduct(product);
    setViewModalOpen(true);
  };

  const openEditModal = (product: any) => {
    if (!canEdit) return;
    setProductToEdit(product);
    setEditModalOpen(true);
  };

  const openDeleteModal = (product: any) => {
    if (!isAdmin) return;
    setProductToDelete(product);
    setDeleteModalOpen(true);
  };

  // Filtered products
  const filteredProducts = products.filter((product) => {
    if (search && !product.name.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (typeFilter && product.type !== typeFilter) {
      return false;
    }
    if (sizeFilter && product.size !== sizeFilter) {
      return false;
    }
    if (activeFilter !== "" && product.active.toString() !== activeFilter) {
      return false;
    }
    return true;
  });

  return (
    <>
      <div className="flex flex-col h-full bg-gray-50">
        {/* HEADER */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Package className="text-[#00d3fa]" />
              Gestion des Produits
            </h1>
            <p className="text-sm text-gray-500">Catalogue complet et gestion des stocks</p>
          </div>

          <div className="flex items-center gap-3">
            {canEdit && (
              <Link
                href="/dashboard/products/new"
                className="bg-[#000] text-white px-4 py-2.5 rounded-sm font-bold text-sm flex items-center gap-2 hover:bg-gray-800 transition-all shadow-sm"
              >
                <Plus size={18} />
                Nouveau Produit
              </Link>
            )}
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-auto p-6 space-y-6">

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Total Produits"
              value={filteredProducts.length}
              icon={<Tags size={20} />}
              color="text-[#00d3fa]"
            />
            <KpiCard
              title="Boissons"
              value={products.filter((p) => p.type === "BEVERAGE").length}
              icon={<LayoutGrid size={20} />}
              color="text-purple-500"
            />
            <KpiCard
              title="Nourritures"
              value={products.filter((p) => p.type === "FOOD").length}
              icon={<Package size={20} />}
              color="text-orange-500"
            />
            <KpiCard
              title="Espaces de Vente"
              value={spaces.length}
              icon={<Store size={20} />}
              color="text-green-500"
            />
          </div>

          {/* FILTERS & TABLE CONTAINER */}
          <div className="bg-white border border-gray-200 rounded-sm overflow-hidden shadow-sm">

            {/* Custom Toolbar / Filters Header */}
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
              <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider flex items-center gap-2">
                <Filter size={16} className="text-gray-400" />
                Filtres & Recherche
              </h3>
              <div className="w-full sm:w-auto">
                <ProductFilters
                  search={search}
                  onSearchChange={setSearch}
                  type={typeFilter}
                  onTypeChange={setTypeFilter}
                  size={sizeFilter}
                  onSizeChange={setSizeFilter}
                  active={activeFilter}
                  onActiveChange={setActiveFilter}
                />
              </div>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-3 border-b border-gray-100">Produit</th>
                    <th className="px-6 py-3 border-b border-gray-100">Type</th>
                    <th className="px-6 py-3 border-b border-gray-100">Prix VIP</th>
                    <th className="px-6 py-3 border-b border-gray-100">Statut</th>
                    <th className="px-6 py-3 border-b border-gray-100 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-gray-400 italic text-sm">
                        <Loader2 className="animate-spin inline-block mr-2" size={16} /> Chargement des produits...
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-gray-400 italic text-sm">
                        Aucun produit trouvé.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => {
                      const vipPrice = product.prices.find(
                        (p: any) =>
                          p.space.name === "VIP" &&
                          (p.forUnit === "BOTTLE" || p.forUnit === "PLATE")
                      );

                      return (
                        <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-gray-800">{product.name}</span>
                              <span className="text-xs text-gray-500">
                                {product.beverageCategory || product.foodCategory || ""}
                                {(product.beverageCategory || product.foodCategory) && " • "}
                                {product.size === "SMALL" ? "Petit" : product.size === "LARGE" ? "Gros" : ""}
                                {!product.vendable && (
                                  <span className="ml-2 bg-yellow-100 text-yellow-700 px-1 rounded-[2px] text-[9px] font-black uppercase">Brouillon</span>
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={cn(
                                "text-[10px] font-bold uppercase px-2 py-1 rounded-sm",
                                product.type === "BEVERAGE" ? "bg-blue-50 text-blue-600" :
                                  product.type === "FOOD" ? "bg-orange-50 text-orange-600" :
                                    "bg-gray-200 text-gray-500"
                              )}
                            >
                              {product.type === "BEVERAGE" ? "Boisson" :
                                product.type === "FOOD" ? "Nourriture" : "Consommable / Brouillon"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {vipPrice ? (
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-gray-800">
                                  ${Number(vipPrice.priceUsd).toFixed(2)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {Number(vipPrice.priceCdf).toLocaleString('fr-FR')} FC
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 italic">Non défini</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={cn(
                                "text-[10px] font-bold uppercase px-2 py-1 rounded-sm",
                                product.active ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                              )}
                            >
                              {product.active ? "Actif" : "Inactif"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openViewModal(product)}
                                className="p-1.5 text-gray-400 hover:text-[#00d3fa] hover:bg-blue-50 rounded-sm transition-all"
                                title="Voir"
                              >
                                <Eye size={16} />
                              </button>
                              {canEdit && (
                                <button
                                  onClick={() => openEditModal(product)}
                                  className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-sm transition-all"
                                  title="Modifier"
                                >
                                  <Edit size={16} />
                                </button>
                              )}
                              {isAdmin && (
                                <button
                                  onClick={() => openDeleteModal(product)}
                                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-sm transition-all"
                                  title="Supprimer"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      <ProductViewModal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
      />

      <ProductEditModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setProductToEdit(null);
        }}
        product={productToEdit}
        onSuccess={fetchData}
      />

      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setProductToDelete(null);
        }}
        onConfirm={() => handleDelete(productToDelete?.id)}
        title="Supprimer le produit"
        message="Êtes-vous sûr de vouloir supprimer ce produit ?"
        itemName={productToDelete?.name}
        isLoading={isDeleting}
      />
    </>
  );
}

function KpiCard({ title, value, icon, color }: any) {
  return (
    <div className="bg-white p-4 border border-gray-200 rounded-sm flex items-center justify-between shadow-sm">
      <div>
        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{title}</p>
        <p className="text-lg font-bold text-gray-800 mt-1">{value}</p>
      </div>
      <div className={cn("p-2.5 rounded-sm bg-gray-50 border border-gray-100", color)}>
        {icon}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <DashboardLayout>
      <ProductsPageContent />
    </DashboardLayout>
  );
}
