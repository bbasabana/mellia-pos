# MODULE 3 – Inventory & Stock Control �

> **Status**: 🚧 EXECUTION
> **Objective**: Manage physical stock, locations, transfers, and daily inventory verification (Theoretical vs Real).

---

## 🎯 1. OBJECTIFS CLÉS

1. **Stock Initial (Démarrage)**:
   - Capacité de saisir "l'Existant" sans passer par les achats (pour le jour 1).
   - "On compte tout ce qu'on a et on le rentre dans le système".

2. **État des Lieux (Temps Réel)**:
   - Savoir exactement *où* est chaque produit.
   - **Alertes**: Stock critique (Seuil bas).

3. **Inventaire & Contrôle**:
   - **Inventaire Journalier**: Comparaison "Théorique" (Ce que le système dit) vs "Physique" (Ce qu'on compte).
   - **Gestion des Écarts**:
     - *Manquant* (Vol/Perte inexpliquée).
     - *Casse* (Déclarée).
     - *Avarie* (Périmé).

---

## 🧱 2. STRUCTURE DE DONNÉES

### A. Locations
- `DEPOT`, `FRIGO`, `CASIER`, `ECONOMAT` (Sec), `CUISINE`.

### B. Mouvements (Types Clés)
- `ADJUSTMENT` (Pour le Stock Initial ou Correction).
- `LOSS` (Casse, Avarie).
- `TRANSFER` (Déplacements internes).

---

## 📊 3. FONCTIONNALITÉS DASHBOARD (`/dashboard/stock`)

### 1. Bouton "Stock Initial / Ajustement"
- Modal simple: "Produit X -> Quantité Y -> Emplacement Z".
- Ne demande pas de prix (sauf si on veut valoriser le stock initial, mais pas obligatoire pour le flux).

### 2. Vue "Stock Actuel" (Matrix)
- Tableau croisé.
- Indicateurs rouges si stock < seuil.

### 3. Vue "Inventaire"
- Mode "Comptage": On masque le théorique, on saisit le réel.
- Le système calcule l'écart et génère un rapport.
