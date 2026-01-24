# MODULE 4 – Purchases & Investments 💸

> **Status**: 🚧 EXECUTION
> **Objective**: "Feeding" the stock financially. Managing Purchases in CDF with USD conversion.

---

## 🎯 1. OBJECTIFS CLÉS

1. **L'Acte d'Achat (Le "Feed")**:
   - On achète en **Franc Congolais (CDF)** (la plupart du temps).
   - Le système convertit en USD (devise de base) selon le taux du jour pour la comptabilité globale.
   - **Mise à jour Stock**: Dès validation, le stock augmente (Stock Movement `IN`).

2. **Source de Fonds**:
   - Qui a payé ? (Caisse ou Patron).

3. **Analyse Financière**:
   - **Investi**: Combien est sorti.
   - **Valeur Stock**: Valeur marchande des produits achetés.

---

## 🧱 2. STRUCTURE DE DONNÉES

### Investment Integration
- Input: Montant en CDF -> Conversion -> Stockage en USD & CDF.
- Input: Prix unitaire produit (Achat) -> Mise à jour du CUMP (Coût D'achat).

---

## 📊 3. FONCTIONNALITÉS DASHBOARD (`/dashboard/purchases`)

### 1. Formulaire "Nouvel Achat" (Smart)
- **Devise**: Choix CDF par défaut. Taux affiché/modifiable.
- **Produits**: Saisie Quantité + Prix Achat (en CDF).
- **Destination**: Direct Dépôt (par défaut) ou autre.

### 2. Historique Achats
- Liste des factures.
