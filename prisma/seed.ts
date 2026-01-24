/**
 * Prisma Seed Script
 * Creates default admin user for testing
 */

import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create default admin user
  const adminEmail = "admin@mellia.pos";
  const adminPassword = "Admin123!"; // Change this in production!

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log(`✅ Admin user already exists: ${adminEmail}`);
  } else {
    const hashedPassword = await hashPassword(adminPassword);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Admin",
        passwordHash: hashedPassword,
        role: "ADMIN",
        status: "ACTIVE",
      },
    });

    console.log(`✅ Created admin user:`);
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Role: ${admin.role}`);
  }

  // Seeding Product Types
  const productTypes = [
    { code: "BEVERAGE", label: "Boisson", labelEn: "Beverage" },
    { code: "FOOD", label: "Nourriture", labelEn: "Food" },
    { code: "NON_VENDABLE", label: "Non Vendable", labelEn: "Non-Sellable" },
  ];

  for (const type of productTypes) {
    await prisma.productTypeMetadata.upsert({
      where: { code: type.code },
      update: {},
      create: type,
    });
  }
  console.log("✅ Seeded Product Types");

  // Seeding Categories
  const categories = [
    // Beverages
    { code: "BIERE", productType: "BEVERAGE", label: "Bière", labelEn: "Beer" },
    { code: "SUCRE", productType: "BEVERAGE", label: "Boisson sucrée", labelEn: "Soft Drink" },
    { code: "EAU", productType: "BEVERAGE", label: "Eau minérale", labelEn: "Water" },
    { code: "VIN", productType: "BEVERAGE", label: "Vin", labelEn: "Wine" },
    { code: "WHISKY", productType: "BEVERAGE", label: "Whisky / Spiritueux", labelEn: "Whisky / Spirits" },
    { code: "JUS", productType: "BEVERAGE", label: "Jus naturel", labelEn: "Juice" },
    { code: "ENERGIE", productType: "BEVERAGE", label: "Boisson énergisante", labelEn: "Energy Drink" },
    // Food
    { code: "GRILLADE", productType: "FOOD", label: "Grillade", labelEn: "Grill" },
    { code: "FAST_FOOD", productType: "FOOD", label: "Fast-food", labelEn: "Fast Food" },
    { code: "ACCOMPAGNEMENT", productType: "FOOD", label: "Accompagnement", labelEn: "Side Dish" },
    { code: "DESSERT", productType: "FOOD", label: "Dessert", labelEn: "Dessert" },
    { code: "PLAT_PRINCIPAL", productType: "FOOD", label: "Plat principal", labelEn: "Main Course" },
  ];

  for (const cat of categories) {
    await prisma.categoryMetadata.upsert({
      where: { code: cat.code },
      update: {},
      create: {
        code: cat.code,
        productType: cat.productType,
        label: cat.label,
        labelEn: cat.labelEn,
      },
    });
  }
  console.log("✅ Seeded Categories");

  console.log("🌱 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
