import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Module 2: Products avec logique métier complète...\n");

  // ============================================
  // 1. TAUX DE CHANGE (CDF/USD)
  // ============================================
  console.log("💱 Setting exchange rate...");
  const exchangeRate = await prisma.exchangeRate.upsert({
    where: { id: "rate-current" },
    update: {},
    create: {
      id: "rate-current",
      rateUsdToCdf: 2850.0, // 1 USD = 2850 CDF (exemple)
      active: true,
    },
  });
  console.log(`✅ Exchange Rate: 1 USD = ${exchangeRate.rateUsdToCdf} CDF\n`);

  // ============================================
  // 2. ESPACES DE VENTE
  // ============================================
  console.log("📍 Creating sale spaces...");
  const vipSpace = await prisma.saleSpace.upsert({
    where: { name: "VIP" },
    update: {},
    create: {
      id: "space-vip",
      name: "VIP",
      description: "Zone VIP du restaurant",
      active: true,
    },
  });
  console.log(`✅ ${vipSpace.name}`);

  const terrasseSpace = await prisma.saleSpace.upsert({
    where: { name: "Terrasse" },
    update: {},
    create: {
      id: "space-terrasse",
      name: "Terrasse",
      description: "Terrasse extérieure",
      active: true,
    },
  });
  console.log(`✅ ${terrasseSpace.name}\n`);

  // ============================================
  // 3. PRODUITS BOISSONS
  // ============================================
  console.log("🍺 Creating BEVERAGE products...\n");

  // BIÈRE
  const primus = await prisma.product.upsert({
    where: { id: "prod-primus" },
    update: {},
    create: {
      id: "prod-primus",
      name: "Primus",
      type: "BEVERAGE",
      beverageCategory: "BIERE",
      size: "STANDARD",
      saleUnit: "BOTTLE",
      vendable: true,
      active: true,
      description: "Bière Primus 72cl",
    },
  });
  console.log(`✅ ${primus.name} (${primus.beverageCategory})`);

  // BOISSON SUCRÉE - PETIT
  const cocaSmall = await prisma.product.upsert({
    where: { id: "prod-coca-small" },
    update: {},
    create: {
      id: "prod-coca-small",
      name: "Coca-Cola Petit",
      type: "BEVERAGE",
      beverageCategory: "SUCRE",
      size: "SMALL",
      saleUnit: "BOTTLE",
      unitValue: 0.33, // 33cl
      vendable: true,
      active: true,
      description: "Coca-Cola 33cl",
    },
  });
  console.log(`✅ ${cocaSmall.name} (${cocaSmall.beverageCategory} - ${cocaSmall.size})`);

  // BOISSON SUCRÉE - GROS
  const cocaLarge = await prisma.product.upsert({
    where: { id: "prod-coca-large" },
    update: {},
    create: {
      id: "prod-coca-large",
      name: "Coca-Cola Gros",
      type: "BEVERAGE",
      beverageCategory: "SUCRE",
      size: "LARGE",
      saleUnit: "BOTTLE",
      unitValue: 1.5, // 1.5L
      vendable: true,
      active: true,
      description: "Coca-Cola 1.5L",
    },
  });
  console.log(`✅ ${cocaLarge.name} (${cocaLarge.beverageCategory} - ${cocaLarge.size})`);

  // EAU
  const eauVital = await prisma.product.upsert({
    where: { id: "prod-eau-vital" },
    update: {},
    create: {
      id: "prod-eau-vital",
      name: "Eau Vital",
      type: "BEVERAGE",
      beverageCategory: "EAU",
      size: "STANDARD",
      saleUnit: "BOTTLE",
      unitValue: 0.5, // 50cl
      vendable: true,
      active: true,
      description: "Eau minérale 50cl",
    },
  });
  console.log(`✅ ${eauVital.name} (${eauVital.beverageCategory})`);

  // WHISKY - Prix Bouteille ET Mesure
  const whisky = await prisma.product.upsert({
    where: { id: "prod-whisky-jd" },
    update: {},
    create: {
      id: "prod-whisky-jd",
      name: "Jack Daniel's",
      type: "BEVERAGE",
      beverageCategory: "WHISKY",
      size: "STANDARD",
      saleUnit: "BOTTLE", // Unité de base stock = bouteille
      unitValue: 0.7, // 70cl
      vendable: true,
      active: true,
      description: "Whisky Jack Daniel's 70cl",
    },
  });
  console.log(`✅ ${whisky.name} (${whisky.beverageCategory} - Bouteille + Mesure)`);

  // ============================================
  // 4. PRODUITS NOURRITURE
  // ============================================
  console.log("\n🍗 Creating FOOD products...\n");

  // GRILLADE - Plat complet
  const pouletBraise = await prisma.product.upsert({
    where: { id: "prod-poulet-braise" },
    update: {},
    create: {
      id: "prod-poulet-braise",
      name: "Poulet Braisé",
      type: "FOOD",
      foodCategory: "GRILLADE",
      size: "STANDARD",
      saleUnit: "PLATE",
      vendable: true,
      active: true,
      description: "Poulet braisé entier avec accompagnement",
    },
  });
  console.log(`✅ ${pouletBraise.name} (${pouletBraise.foodCategory} - ${pouletBraise.saleUnit})`);

  // GRILLADE - Demi-plat
  const pouletBraiseHalf = await prisma.product.upsert({
    where: { id: "prod-poulet-braise-half" },
    update: {},
    create: {
      id: "prod-poulet-braise-half",
      name: "Poulet Braisé (Demi)",
      type: "FOOD",
      foodCategory: "GRILLADE",
      size: "STANDARD",
      saleUnit: "HALF_PLATE",
      vendable: true,
      active: true,
      description: "Demi poulet braisé avec accompagnement",
    },
  });
  console.log(`✅ ${pouletBraiseHalf.name} (${pouletBraiseHalf.foodCategory} - ${pouletBraiseHalf.saleUnit})`);

  // ACCOMPAGNEMENT
  const frites = await prisma.product.upsert({
    where: { id: "prod-frites" },
    update: {},
    create: {
      id: "prod-frites",
      name: "Frites",
      type: "FOOD",
      foodCategory: "ACCOMPAGNEMENT",
      size: "STANDARD",
      saleUnit: "PLATE",
      vendable: true,
      active: true,
      description: "Portion de frites",
    },
  });
  console.log(`✅ ${frites.name} (${frites.foodCategory})`);

  // ============================================
  // 5. PRIX (USD et CDF avec conversion auto)
  // ============================================
  console.log("\n💰 Setting prices (USD + CDF)...\n");

  const rate = exchangeRate.rateUsdToCdf.toNumber();

  // Primus
  await prisma.productPrice.upsert({
    where: { 
      productId_spaceId_forUnit: { 
        productId: primus.id, 
        spaceId: vipSpace.id,
        forUnit: "BOTTLE"
      } 
    },
    update: {},
    create: {
      productId: primus.id,
      spaceId: vipSpace.id,
      priceUsd: 2.0,
      priceCdf: 2.0 * rate,
      forUnit: "BOTTLE",
    },
  });
  await prisma.productPrice.upsert({
    where: { 
      productId_spaceId_forUnit: { 
        productId: primus.id, 
        spaceId: terrasseSpace.id,
        forUnit: "BOTTLE"
      } 
    },
    update: {},
    create: {
      productId: primus.id,
      spaceId: terrasseSpace.id,
      priceUsd: 1.75,
      priceCdf: 1.75 * rate,
      forUnit: "BOTTLE",
    },
  });
  await prisma.productCost.upsert({
    where: { productId_forUnit: { productId: primus.id, forUnit: "BOTTLE" } },
    update: {},
    create: {
      productId: primus.id,
      unitCostUsd: 0.8,
      unitCostCdf: 0.8 * rate,
      forUnit: "BOTTLE",
    },
  });
  console.log(`✅ Primus: VIP 2 USD / ${(2 * rate).toFixed(0)} CDF, Terrasse 1.75 USD / ${(1.75 * rate).toFixed(0)} CDF`);

  // Coca Small
  await prisma.productPrice.upsert({
    where: { 
      productId_spaceId_forUnit: { 
        productId: cocaSmall.id, 
        spaceId: vipSpace.id,
        forUnit: "BOTTLE"
      } 
    },
    update: {},
    create: {
      productId: cocaSmall.id,
      spaceId: vipSpace.id,
      priceUsd: 1.0,
      priceCdf: 1.0 * rate,
      forUnit: "BOTTLE",
    },
  });
  await prisma.productPrice.upsert({
    where: { 
      productId_spaceId_forUnit: { 
        productId: cocaSmall.id, 
        spaceId: terrasseSpace.id,
        forUnit: "BOTTLE"
      } 
    },
    update: {},
    create: {
      productId: cocaSmall.id,
      spaceId: terrasseSpace.id,
      priceUsd: 0.75,
      priceCdf: 0.75 * rate,
      forUnit: "BOTTLE",
    },
  });
  await prisma.productCost.upsert({
    where: { productId_forUnit: { productId: cocaSmall.id, forUnit: "BOTTLE" } },
    update: {},
    create: {
      productId: cocaSmall.id,
      unitCostUsd: 0.3,
      unitCostCdf: 0.3 * rate,
      forUnit: "BOTTLE",
    },
  });
  console.log(`✅ Coca Petit: VIP 1 USD, Terrasse 0.75 USD`);

  // Coca Large
  await prisma.productPrice.upsert({
    where: { 
      productId_spaceId_forUnit: { 
        productId: cocaLarge.id, 
        spaceId: vipSpace.id,
        forUnit: "BOTTLE"
      } 
    },
    update: {},
    create: {
      productId: cocaLarge.id,
      spaceId: vipSpace.id,
      priceUsd: 2.5,
      priceCdf: 2.5 * rate,
      forUnit: "BOTTLE",
    },
  });
  await prisma.productPrice.upsert({
    where: { 
      productId_spaceId_forUnit: { 
        productId: cocaLarge.id, 
        spaceId: terrasseSpace.id,
        forUnit: "BOTTLE"
      } 
    },
    update: {},
    create: {
      productId: cocaLarge.id,
      spaceId: terrasseSpace.id,
      priceUsd: 2.0,
      priceCdf: 2.0 * rate,
      forUnit: "BOTTLE",
    },
  });
  await prisma.productCost.upsert({
    where: { productId_forUnit: { productId: cocaLarge.id, forUnit: "BOTTLE" } },
    update: {},
    create: {
      productId: cocaLarge.id,
      unitCostUsd: 0.8,
      unitCostCdf: 0.8 * rate,
      forUnit: "BOTTLE",
    },
  });
  console.log(`✅ Coca Gros: VIP 2.5 USD, Terrasse 2 USD`);

  // Whisky - PRIX BOUTEILLE
  await prisma.productPrice.upsert({
    where: { 
      productId_spaceId_forUnit: { 
        productId: whisky.id, 
        spaceId: vipSpace.id,
        forUnit: "BOTTLE"
      } 
    },
    update: {},
    create: {
      productId: whisky.id,
      spaceId: vipSpace.id,
      priceUsd: 45.0,
      priceCdf: 45.0 * rate,
      forUnit: "BOTTLE",
    },
  });
  
  // Whisky - PRIX MESURE (4cl)
  await prisma.productPrice.upsert({
    where: { 
      productId_spaceId_forUnit: { 
        productId: whisky.id, 
        spaceId: vipSpace.id,
        forUnit: "MEASURE"
      } 
    },
    update: {},
    create: {
      productId: whisky.id,
      spaceId: vipSpace.id,
      priceUsd: 3.5, // 4cl
      priceCdf: 3.5 * rate,
      forUnit: "MEASURE",
    },
  });
  
  await prisma.productCost.upsert({
    where: { productId_forUnit: { productId: whisky.id, forUnit: "BOTTLE" } },
    update: {},
    create: {
      productId: whisky.id,
      unitCostUsd: 25.0,
      unitCostCdf: 25.0 * rate,
      forUnit: "BOTTLE",
    },
  });
  console.log(`✅ Whisky: Bouteille 45 USD, Mesure (4cl) 3.5 USD`);

  // Poulet Braisé
  await prisma.productPrice.upsert({
    where: { 
      productId_spaceId_forUnit: { 
        productId: pouletBraise.id, 
        spaceId: vipSpace.id,
        forUnit: "PLATE"
      } 
    },
    update: {},
    create: {
      productId: pouletBraise.id,
      spaceId: vipSpace.id,
      priceUsd: 8.0,
      priceCdf: 8.0 * rate,
      forUnit: "PLATE",
    },
  });
  await prisma.productPrice.upsert({
    where: { 
      productId_spaceId_forUnit: { 
        productId: pouletBraise.id, 
        spaceId: terrasseSpace.id,
        forUnit: "PLATE"
      } 
    },
    update: {},
    create: {
      productId: pouletBraise.id,
      spaceId: terrasseSpace.id,
      priceUsd: 7.0,
      priceCdf: 7.0 * rate,
      forUnit: "PLATE",
    },
  });
  await prisma.productCost.upsert({
    where: { productId_forUnit: { productId: pouletBraise.id, forUnit: "PLATE" } },
    update: {},
    create: {
      productId: pouletBraise.id,
      unitCostUsd: 4.0,
      unitCostCdf: 4.0 * rate,
      forUnit: "PLATE",
    },
  });
  console.log(`✅ Poulet Braisé: VIP 8 USD, Terrasse 7 USD`);

  // Poulet Demi
  await prisma.productPrice.upsert({
    where: { 
      productId_spaceId_forUnit: { 
        productId: pouletBraiseHalf.id, 
        spaceId: vipSpace.id,
        forUnit: "HALF_PLATE"
      } 
    },
    update: {},
    create: {
      productId: pouletBraiseHalf.id,
      spaceId: vipSpace.id,
      priceUsd: 4.5,
      priceCdf: 4.5 * rate,
      forUnit: "HALF_PLATE",
    },
  });
  await prisma.productPrice.upsert({
    where: { 
      productId_spaceId_forUnit: { 
        productId: pouletBraiseHalf.id, 
        spaceId: terrasseSpace.id,
        forUnit: "HALF_PLATE"
      } 
    },
    update: {},
    create: {
      productId: pouletBraiseHalf.id,
      spaceId: terrasseSpace.id,
      priceUsd: 4.0,
      priceCdf: 4.0 * rate,
      forUnit: "HALF_PLATE",
    },
  });
  await prisma.productCost.upsert({
    where: { productId_forUnit: { productId: pouletBraiseHalf.id, forUnit: "HALF_PLATE" } },
    update: {},
    create: {
      productId: pouletBraiseHalf.id,
      unitCostUsd: 2.2,
      unitCostCdf: 2.2 * rate,
      forUnit: "HALF_PLATE",
    },
  });
  console.log(`✅ Poulet Demi: VIP 4.5 USD, Terrasse 4 USD`);

  console.log("\n🌱 Module 2 seeding complete!\n");
  console.log("📊 Summary:");
  console.log(`  - Exchange Rate: 1 USD = ${rate} CDF`);
  console.log(`  - Sale Spaces: 2`);
  console.log(`  - Beverages: 5 (Bière, Sucre petit/gros, Eau, Whisky)`);
  console.log(`  - Food: 3 (Poulet plat/demi, Frites)`);
  console.log(`  - Total Products: 8`);
  console.log(`  - Prix configurés en USD + CDF automatique`);
  console.log(`  - Whisky: prix bouteille ET mesure ✅\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
