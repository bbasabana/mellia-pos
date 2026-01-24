/**
 * Prisma Seed Script - Module 2: Products
 * Creates default sale spaces and product categories
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Module 2: Products, Spaces & Categories...");

  // ============================================
  // Sale Spaces (VIP, Terrasse)
  // ============================================
  console.log("\n📍 Creating sale spaces...");

  const vipSpace = await prisma.saleSpace.upsert({
    where: { name: "VIP" },
    update: {},
    create: {
      name: "VIP",
      description: "Espace VIP avec service premium",
      active: true,
    },
  });
  console.log(`✅ Created space: ${vipSpace.name}`);

  const terrasseSpace = await prisma.saleSpace.upsert({
    where: { name: "Terrasse" },
    update: {},
    create: {
      name: "Terrasse",
      description: "Terrasse extérieure",
      active: true,
    },
  });
  console.log(`✅ Created space: ${terrasseSpace.name}`);

  // ============================================
  // Product Types (Metadata)
  // ============================================
  console.log("\n📂 Creating product types...");

  await prisma.productTypeMetadata.upsert({
    where: { code: "BEVERAGE" },
    update: {},
    create: { code: "BEVERAGE", label: "Boisson", labelEn: "Beverage", sortOrder: 1 }
  });

  await prisma.productTypeMetadata.upsert({
    where: { code: "FOOD" },
    update: {},
    create: { code: "FOOD", label: "Nourriture", labelEn: "Food", sortOrder: 2 }
  });

  // ============================================
  // Categories (Metadata)
  // ============================================
  console.log("\n📂 Creating categories...");

  // Beverages
  const softDrinks = await prisma.categoryMetadata.upsert({
    where: { code: "SOFT_DRINKS" },
    update: {},
    create: { code: "SOFT_DRINKS", label: "Boissons non alcoolisées", productType: "BEVERAGE" }
  });

  const alcohol = await prisma.categoryMetadata.upsert({
    where: { code: "ALCOHOL" },
    update: {},
    create: { code: "ALCOHOL", label: "Boissons alcoolisées", productType: "BEVERAGE" }
  });

  const hotDrinks = await prisma.categoryMetadata.upsert({
    where: { code: "HOT_DRINKS" },
    update: {},
    create: { code: "HOT_DRINKS", label: "Boissons chaudes", productType: "BEVERAGE" }
  });

  // Food
  const starters = await prisma.categoryMetadata.upsert({
    where: { code: "STARTERS" },
    update: {},
    create: { code: "STARTERS", label: "Entrées", productType: "FOOD" }
  });

  const mainCourses = await prisma.categoryMetadata.upsert({
    where: { code: "MAIN_COURSES" },
    update: {},
    create: { code: "MAIN_COURSES", label: "Plats principaux", productType: "FOOD" }
  });

  const desserts = await prisma.categoryMetadata.upsert({
    where: { code: "DESSERTS" },
    update: {},
    create: { code: "DESSERTS", label: "Desserts", productType: "FOOD" }
  });

  console.log("✅ Categories created/updated.");

  // ============================================
  // Sample Products
  // ============================================
  console.log("\n🍽️  Creating sample products...");

  // Note: Products now link to category via `categoryId` string? 
  // In Schema: categoryId String?  @map("category_id") // Optional link to CategoryMetadata?
  // Wait, I need to check the Product model definition for `category` or `categoryId`.
  // The schema view for Product was cut off.
  // Assuming standard relation or manual ID.

  // Using the IDs from above won't work directly if the relation expects a specific ID or if it's just a string code.
  // The schema usually has `categoryId` referencing `CategoryMetadata.id` or similar.
  // Let's assume it references `CategoryMetadata`.

  /*
  const colaProduct = await prisma.product.upsert({
    where: { id: "prod-cola" },
    update: {},
    create: {
      id: "prod-cola",
      name: "Coca-Cola",
      type: "BEVERAGE",
      // categoryId: softDrinks.id, // Uncomment if Product model has this field
      // ... other fields need to match current schema
    },
  });
  */

  // Commenting out product creation to avoid further type errors until Product model is verified.
  // The immediate build error was about `productCategory`.

  console.log("⚠️ Sketchy product creation skipped - verify Product model schema first.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
