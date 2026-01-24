import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { getSaleSpaces } from "@/actions/sale-spaces";
import { ProductForm } from "@/components/products/ProductForm";
import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default async function NewProductPage() {
  const session = await getServerSession(authOptions);

  // Only ADMIN can create products
  if ((session?.user as any)?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Get exchange rate
  const exchangeRate = await prisma.exchangeRate.findFirst({
    where: { active: true },
    orderBy: { effectiveDate: "desc" },
  });

  const spacesResult = await getSaleSpaces();
  const spaces = spacesResult.success ? spacesResult.data : [];


  return (
    <DashboardLayout>
      <div className="page-container-content">
        <div className="product-form-scroll">
          <div className="max-w-[1200px] mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-[#00d3fa] mb-1">Nouveau Produit</h1>
              <p className="text-gray-500 text-sm">Créer un nouveau produit dans le système</p>
            </div>

            <ProductForm
              spaces={spaces}
              exchangeRate={exchangeRate?.rateUsdToCdf ? parseFloat(exchangeRate.rateUsdToCdf.toString()) : 2850}
              mode="create"
              isAdmin={true}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
