import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { getSaleSpaces } from "@/actions/sale-spaces";
import { getProduct } from "@/actions/products";
import { ProductForm } from "@/components/products/ProductForm";
import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  // Only ADMIN can edit products
  if ((session?.user as any)?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [productResult, spacesResult] = await Promise.all([
    getProduct(params.id),
    getSaleSpaces(),
  ]);

  if (!productResult.success) {
    redirect("/dashboard/products");
  }

  // Get exchange rate
  const exchangeRate = await prisma.exchangeRate.findFirst({
    where: { active: true },
    orderBy: { effectiveDate: "desc" },
  });

  const spaces = spacesResult.success ? spacesResult.data : [];

  return (
    <DashboardLayout>
      <div className="page-container-content">
        {/* HEADER FIXE */}
        <div className="page-header">
          <div>
            <h1>Modifier Produit</h1>
            <p>Modifier les informations du produit</p>
          </div>
        </div>

        {/* CONTENU SCROLLABLE */}
        <div className="product-form-scroll">
          <ProductForm
            product={productResult.data}
            spaces={spaces}
            exchangeRate={exchangeRate?.rateUsdToCdf ? parseFloat(exchangeRate.rateUsdToCdf.toString()) : 2850}
            mode="edit"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
