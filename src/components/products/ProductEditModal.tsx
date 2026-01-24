"use client";

import { Modal } from "../ui/Modal";
import { useState, useEffect } from "react";
import { ProductForm } from "./ProductForm";

interface ProductEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  onSuccess: () => void;
}

export function ProductEditModal({
  isOpen,
  onClose,
  product,
  onSuccess,
}: ProductEditModalProps) {
  const [spaces, setSpaces] = useState<any[]>([]);
  const [exchangeRate, setExchangeRate] = useState(2850);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && product) {
      fetchData();
    }
  }, [isOpen, product]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [spacesRes, rateRes] = await Promise.all([
        fetch("/api/sale-spaces").then((r) => r.json()),
        fetch("/api/exchange-rate").then((r) => r.json()).catch(() => ({ data: { rateUsdToCdf: 2850 } })),
      ]);

      if (spacesRes.success) setSpaces(spacesRes.data);
      if (rateRes.data?.rateUsdToCdf) {
        setExchangeRate(parseFloat(rateRes.data.rateUsdToCdf.toString()));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    onSuccess();
    onClose();
  };

  if (!product) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Modifier le Produit" size="2xl">
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-gray-500">Chargement...</div>
        </div>
      ) : (
        <div className="-mx-6 -my-4">
          <div className="max-h-[calc(90vh-8rem)] overflow-y-auto px-6 py-4">
            <ProductForm
              product={product}
              spaces={spaces}
              exchangeRate={exchangeRate}
              mode="edit"
              onSuccess={handleSuccess}
              inModal={true}
            />
          </div>
        </div>
      )}
    </Modal>
  );
}
