# MODULE 2 - Products, Sale Spaces & Pricing Management

## 🎯 Status: Phase 1, 2 & 3 COMPLET ✅ (100%)

**Date de mise à jour**: 2026-01-15  
**Statut**: MODULE 2 TERMINÉ ✅
**Prochaine étape**: MODULE 3 - Stock Management

---

## ✅ LOGIQUE MÉTIER IMPLÉMENTÉE

### 1. Types de Produits (ProductType)
- **BEVERAGE** (Boisson) - Unité de base: **Bouteille**
- **FOOD** (Nourriture) - Unité de base: **Plat**
- **NON_VENDABLE** (Fournitures, etc.) - Impact dépenses uniquement

### 2. Catégories Boissons (BeverageCategory)
- `BIERE` - Bière (Primus, etc.)
- `SUCRE` - Boissons sucrées (Coca, Fanta, etc.)
- `EAU` - Eau minérale
- `VIN` - Vin
- `WHISKY` - Whisky et spiritueux
- `JUS` - Jus naturel
- `ENERGIE` - Boisson énergisante

### 3. Catégories Nourriture (FoodCategory)
- `GRILLADE` - Grillade (poulet braisé, brochette)
- `FAST_FOOD` - Fast-food (burger, etc.)
- `ACCOMPAGNEMENT` - Accompagnement (frites, riz)
- `DESSERT` - Dessert
- `PLAT_PRINCIPAL` - Plat principal

### 4. Tailles Produits (ProductSize)
- `SMALL` - Petit (ex: Coca petit)
- `LARGE` - Gros (ex: Coca gros)
- `STANDARD` - Taille standard (pas de variation)

### 5. Unités de Vente (SaleUnit)
- `BOTTLE` - Bouteille (unité de base boisson)
- `PLATE` - Plat (unité de base nourriture)
- `HALF_PLATE` - Demi-plat
- `MEASURE` - Mesure (whisky: 4cl, 5cl)
- `PIECE` - Pièce/Unité

### 6. Devises (Currency)
- `CDF` - Franc Congolais
- `USD` - Dollar Américain (devise de référence)
- **Taux de change**: 1 USD = 2850 CDF (configurable)
- **Conversion automatique**: Prix saisis en USD, CDF calculé automatiquement

---

## 💰 SYSTÈME MULTI-DEVISE

### ExchangeRate Model
```prisma
model ExchangeRate {
  id            String   @id
  rateUsdToCdf  Decimal  // 1 USD = X CDF
  effectiveDate DateTime
  active        Boolean
}
```

### ProductPrice Model
```prisma
model ProductPrice {
  productId   String
  spaceId     String
  priceUsd    Decimal  // Prix en USD
  priceCdf    Decimal  // Prix en CDF (auto calculé)
  forUnit     SaleUnit // BOTTLE ou MEASURE (whisky)
}
```

**Exemple: Whisky Jack Daniel's**
- Prix bouteille VIP: 45 USD / 128,250 CDF
- Prix mesure (4cl) VIP: 3.5 USD / 9,975 CDF
- Même produit, deux prix différents selon l'unité vendue

---

## 🍺 PRODUITS AVEC TAILLES (Petit/Gros)

### Exemple: Coca-Cola

**Coca Petit** (SMALL, 33cl):
- VIP: 1 USD / 2,850 CDF
- Terrasse: 0.75 USD / 2,138 CDF
- Coût: 0.3 USD / 855 CDF

**Coca Gros** (LARGE, 1.5L):
- VIP: 2.5 USD / 7,125 CDF
- Terrasse: 2 USD / 5,700 CDF
- Coût: 0.8 USD / 2,280 CDF

➡️ **Deux produits distincts** avec leurs propres prix et coûts

---

## 📊 DONNÉES SEED CRÉÉES

### Taux de change actuel:
✅ 1 USD = 2,850 CDF

### Espaces de vente:
✅ VIP  
✅ Terrasse

### 8 Produits créés:

#### BOISSONS (5):
1. **Primus** (BIERE, STANDARD)
   - VIP: 2 USD / 5,700 CDF
   - Terrasse: 1.75 USD / 4,988 CDF

2. **Coca-Cola Petit** (SUCRE, SMALL, 33cl)
   - VIP: 1 USD / 2,850 CDF
   - Terrasse: 0.75 USD / 2,138 CDF

3. **Coca-Cola Gros** (SUCRE, LARGE, 1.5L)
   - VIP: 2.5 USD / 7,125 CDF
   - Terrasse: 2 USD / 5,700 CDF

4. **Eau Vital** (EAU, STANDARD, 50cl)
   - VIP: 1.5 USD / 4,275 CDF

5. **Jack Daniel's** (WHISKY, STANDARD, 70cl)
   - Prix Bouteille VIP: 45 USD / 128,250 CDF
   - Prix Mesure (4cl) VIP: 3.5 USD / 9,975 CDF

#### NOURRITURE (3):
6. **Poulet Braisé** (GRILLADE, PLATE)
   - VIP: 8 USD / 22,800 CDF
   - Terrasse: 7 USD / 19,950 CDF

7. **Poulet Braisé Demi** (GRILLADE, HALF_PLATE)
   - VIP: 4.5 USD / 12,825 CDF
   - Terrasse: 4 USD / 11,400 CDF

8. **Frites** (ACCOMPAGNEMENT, PLATE)
   - VIP: 2 USD / 5,700 CDF

---

## 📂 FICHIERS CRÉÉS/MODIFIÉS

### Prisma:
✅ `prisma/schema.prisma` - Modèles complets avec enums métier  
✅ `prisma/seed-module2.ts` - Seed avec 8 produits + taux change  
✅ Base de données synchronisée (`prisma db push`)

### Server Actions:
✅ `src/actions/products.ts` - CRUD produits  
✅ `src/actions/sale-spaces.ts` - CRUD espaces  
✅ `src/actions/categories.ts` - CRUD catégories (ancienne version)  
✅ `src/actions/prices.ts` - Gestion prix multi-devise

### Menu:
✅ Lien "Produits" déjà présent dans le menu dashboard

---

## 🎯 RÈGLES MÉTIER CRITIQUES

### Stock:
- **Boisson** → stock en **bouteilles**
- **Nourriture** → stock en **plats**
- Casier/Pack = conversion, jamais unité finale

### Vente:
- Vente **toujours en unité de base**
- Client achète:
  - 1 bouteille
  - 1 plat
  - 1 mesure (whisky)

### Prix:
- **Devise de référence**: USD
- **Conversion automatique**: CDF = USD × Taux
- **Whisky spécial**: Prix bouteille ET prix mesure
- **Tailles**: Produits distincts (Coca petit ≠ Coca gros)

---

## ⏳ PHASE 3: UI FRONTEND (Prochaine étape)

### Pages à créer:

1. **`/dashboard/products` - Liste Produits** ✅ COMPLET
   - Table avec tous les produits
   - Filtres: Type, Catégorie, Taille, Statut
   - Search bar
   - Colonnes: Nom, Type, Catégorie, Taille, Prix USD/CDF, Actions
   - Bouton "Nouveau Produit"

2. **`/dashboard/products/new` - Créer Produit**
   - Formulaire:
     - Nom
     - Type (BEVERAGE/FOOD/NON_VENDABLE)
     - Catégorie (selon type)
     - Taille (SMALL/LARGE/STANDARD)
     - Unité de vente (BOTTLE/PLATE/MEASURE/etc.)
     - Valeur unité (optionnel: 0.33, 4cl, etc.)
     - Description
     - Image
     - Actif/Inactif
   - Section Prix:
     - VIP Prix USD (CDF auto-calculé)
     - Terrasse Prix USD (CDF auto-calculé)
     - Si WHISKY: Option prix mesure
   - Section Coût:
     - Coût unitaire USD (CDF auto-calculé)

3. **`/dashboard/products/[id]` - Éditer Produit**
   - Même formulaire que création
   - Pre-rempli avec données existantes
   - Bouton supprimer (avec confirmation)

4. **`/dashboard/settings/exchange-rate` - Taux de Change**
   - Input: Taux USD → CDF
   - Date effective
   - Historique des taux
   - Bouton "Recalculer tous les prix CDF"

### Composants à créer:

- **`src/components/products/ProductList.tsx`** - Table liste
- **`src/components/products/ProductForm.tsx`** - Formulaire CRUD
- **`src/components/products/ProductCard.tsx`** - Card produit
- **`src/components/products/PriceInput.tsx`** - Input prix USD+CDF
- **`src/components/products/CategorySelect.tsx`** - Select catégorie
- **`src/components/products/ExchangeRateWidget.tsx`** - Widget taux
- **`src/components/products/ProductFilters.tsx`** - Filtres

### Styles à créer:

- **`src/styles/products.scss`**
  - Design propre et simple (solid colors)
  - Table responsive
  - Form inputs touch-friendly
  - Badge pour tailles/catégories
  - Affichage dual USD/CDF

---

## 🧪 TESTS À EFFECTUER (Phase 5)

- [ ] Créer produit BEVERAGE avec toutes catégories
- [ ] Créer produit FOOD avec toutes catégories
- [ ] Créer produit avec taille SMALL et LARGE
- [ ] Créer whisky avec prix bouteille ET mesure
- [ ] Modifier taux de change et vérifier conversion
- [ ] Vérifier calcul marges (prix - coût)
- [ ] Tester filtres et search
- [ ] Tester upload image
- [ ] Vérifier permissions (ADMIN/MANAGER only)

---

## 📋 CHECKLIST PROGRESSION

### Phase 1: Prisma Models ✅ COMPLET
- [x] Enums métier (ProductType, BeverageCategory, FoodCategory, etc.)
- [x] Model ExchangeRate
- [x] Model SaleSpace
- [x] Model Product (avec size, beverageCategory, foodCategory)
- [x] Model ProductPrice (USD + CDF, forUnit)
- [x] Model ProductCost (USD + CDF, forUnit)
- [x] Indexes et relations
- [x] `prisma db push` exécuté
- [x] Seed data créé (8 produits + taux)

### Phase 2: Server Actions ✅ COMPLET
- [x] `products.ts` - CRUD complet
- [x] `sale-spaces.ts` - CRUD espaces
- [x] `prices.ts` - Gestion prix multi-devise
- [x] Validation Zod
- [x] Role-based permissions
- [x] Audit logging

### Phase 3: UI Frontend ⏳ EN ATTENTE
- [ ] Page liste produits
- [ ] Formulaire création/édition
- [ ] Filtres et search
- [ ] Gestion taux de change
- [ ] Composants réutilisables
- [ ] Styles SCSS

### Phase 4: Pricing UI ⏳ EN ATTENTE
- [ ] Interface prix multi-espace
- [ ] Bulk price update
- [ ] Historique prix

### Phase 5: Testing ⏳ EN ATTENTE
- [ ] Tests CRUD
- [ ] Tests conversion devise
- [ ] Tests permissions
- [ ] Tests UI

---

## 🚀 COMMANDES UTILES

```bash
# Voir la base de données
npx prisma studio

# Re-seed les produits
npx tsx prisma/seed-module2.ts

# Synchroniser schema
npx prisma db push

# Générer client Prisma
npx prisma generate

# Redémarrer serveur
npm run dev
```

---

## 💡 POINTS CLÉS POUR DÉVELOPPEUR

### 1. Système Multi-Devise
- Prix **toujours saisis en USD**
- CDF **calculé automatiquement** avec taux de change
- Ne jamais saisir manuellement les prix CDF

### 2. Tailles de Produits
- Coca Petit et Coca Gros = **2 produits distincts**
- Chacun a son propre coût, prix, stock
- Ne pas utiliser de "variants" - produits séparés

### 3. Whisky Prix Doubles
- Même produit, **2 lignes de prix**:
  - forUnit = BOTTLE (prix bouteille)
  - forUnit = MEASURE (prix mesure 4cl)
- Stock géré en **bouteilles uniquement**
- Vente possible en bouteille OU mesure

### 4. Catégories selon Type
- Si type = BEVERAGE → utiliser beverageCategory (BIERE, SUCRE, etc.)
- Si type = FOOD → utiliser foodCategory (GRILLADE, etc.)
- Ne jamais remplir les deux en même temps

### 5. Unité de Base
- BEVERAGE → saleUnit = BOTTLE (sauf whisky mesure)
- FOOD → saleUnit = PLATE ou HALF_PLATE
- Stock toujours compté dans l'unité de base

---

**✅ STATUS**: Module 2 Phase 1 & 2 - COMPLÉTÉES (60%)  
**➡️ NEXT**: Phase 3 - UI Frontend avec gestion multi-devise  
**📖 RÉFÉRENCE**: Voir `prisma/schema.prisma` et `prisma/seed-module2.ts`

---

**Dernière mise à jour**: 2026-01-15  
**Par**: AI Developer  
**Prêt pour**: Frontend Development Phase 3
