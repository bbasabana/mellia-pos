Nous n'avaons pas le backend Nextjs va se connecter directment a neon postgress. etc..
# 📘 PRD – Application Web POS & ERP Restaurant (Mellia)

---

## 1. 🎯 OBJECTIFS FONCTIONNELS DE L’APPLICATION

* Gérer **les ventes en mode POS** (tablette / caisse)
* Gérer **le stock réel multi-emplacements** (frigo, casier, dépôt)
* Gérer **les prix par espace de vente** (VIP / Terrasse)
* Calculer **les marges réelles par espace**
* Gérer **les clients et la fidélité par points**
* Générer **des factures POS**
* Suivre **les investissements, dépenses, bénéfices**
* Gérer **les utilisateurs, rôles et permissions**
* Fournir **des dashboards décisionnels temps réel**

---

## 2. 🧱 STACK TECHNIQUE (VALIDÉ)

### Frontend

* **Next.js (App Router)**
* **TypeScript**
* **Tailwind CSS**
* **ShadCN/UI** (POS friendly)
* **Zustand** (state global)
* **React Hook Form + Zod**

### Backend

* **Next.js Server Actions / API Routes**
* **PostgreSQL**
* **Prisma ORM**

### Auth & Sécurité

* **Auth.js (NextAuth)**
* RBAC (Role Based Access Control)

### Impression

* **ESC/POS**
* Format ticket 58mm / 80mm

---

## 3. 👥 GESTION DES UTILISATEURS & RÔLES

### Rôles

#### ADMIN

* Accès total
* Paramétrage global
* Création utilisateurs
* Accès finances, marges, audits

#### MANAGER

* Ventes
* Stock
* Achats
* Clients
* Rapports
* Pas accès aux paramètres critiques

#### CAISSIER / SERVEUR

* POS uniquement
* Ventes
* Encaissement
* Clients (lecture + sélection)

---

## 4. 📦 PRODUITS

### Types

* **Produits vendables**
* **Produits non vendables**

### Produit (vendable)

* id
* nom
* type (boisson / nourriture)
* catégorie
* sous_catégorie
* unité_base (bouteille / plat)
* actif

---

## 5. 💰 PRIX & ESPACES DE VENTE (POINT CLÉ QUE TU AS DEMANDÉ)

### Espaces de vente

* VIP
* Terrasse

### Table : `sale_spaces`

* id
* nom (VIP, Terrasse)

### Table : `product_prices`

👉 **C’EST ICI QUE TOUT SE PASSE**

* id
* product_id
* sale_space_id
* prix_vente
* devise

👉 **Un même produit a plusieurs prix selon l’espace**

---

## 6. 📈 MARGES (OBLIGATOIRE DANS LE PRD)

### Table : `product_costs`

* product_id
* coût_unitaire (en unité de base)

### Calcul marge (runtime)

* Marge unitaire = prix_vente – coût_unitaire
* Marge totale = marge unitaire × quantité vendue

### Marge par espace

* VIP → marge VIP
* Terrasse → marge Terrasse

👉 Les dashboards doivent afficher :

* marge par produit
* marge par espace
* marge globale

---

## 7. 🧊 STOCK (TRANSFORMATION DIRECTE DE L’EXCEL)

### Emplacements

* Frigo
* Casier
* Dépôt

### Table : `stock_items`

* product_id
* emplacement
* quantite_base

---

## 8. 🔄 MOUVEMENTS DE STOCK (CŒUR DU SYSTÈME)

### Table : `stock_movements`

* id
* product_id
* type (entrée / sortie / ajustement / transfert)
* origine (achat / vente / perte)
* emplacement_source (nullable)
* emplacement_destination (nullable)
* quantite
* unité
* quantite_base
* date
* user_id

### Règles

* Les **transferts internes** ne changent pas le stock total
* Seules **entrée / sortie** impactent le stock global

---

## 9. 🧾 VENTES (MODULE POS)

### Table : `sales`

* id
* numero_ticket
* client_id (nullable)
* sale_space_id
* total_brut
* remise_fidelite
* total_net
* payment_method
* date
* user_id

### Table : `sale_items`

* sale_id
* product_id
* quantite
* prix_unitaire
* coût_unitaire
* marge_unitaire
* marge_totale

---

## 10. 🎁 FIDÉLITÉ CLIENT (REFACTORISÉ PROPREMENT)

### Table : `clients`

* id
* nom
* téléphone
* points

### Règles fidélité

* **1 point = 20 000 FC**
* Points gagnés = floor(montant / 20 000)
* **10 points = 10 USD**
* Utilisation **par tranches de 10**
* Arrondi à l’inférieur

### Table : `loyalty_transactions`

* client_id
* points_gagnes
* points_utilises
* montant_equivalent
* sale_id
* date

---

## 11. 🧾 FACTURATION POS

### Ticket POS

* Nom restaurant
* Date / Heure
* Produits
* Sous-total
* Remise fidélité
* Total à payer
* Moyen de paiement
* Caissier
* Numéro ticket

---

## 12. 💸 ACHATS & INVESTISSEMENTS

### Table : `purchases`

* id
* date
* total
* user_id

### Table : `purchase_items`

* purchase_id
* product_id
* quantite
* unité
* quantite_base
* coût_total

---

## 13. 📉 DÉPENSES NON VENDABLES

### Table : `expenses`

* id
* libellé
* montant
* catégorie
* date
* user_id

---

## 14. 👔 EMPLOYÉS

### Table : `employees`

* id
* nom
* rôle
* salaire

### Table : `salary_payments`

* employee_id
* montant
* date

---

## 15. 📊 DASHBOARDS & KPI

### Temps réel

* ventes du jour
* marge du jour
* stock critique
* produits les plus vendus

### Analytique

* marge par espace
* rentabilité produit
* capital investi vs bénéfice
* fidélité (points émis vs utilisés)

---

## 16. 🔐 SÉCURITÉ & AUDIT

### Table : `audit_logs`

* user_id
* action
* entité
* date

---
17. 💸 INVESTISSEMENT → ATTENDU → RÉEL (CŒUR DU SYSTÈME)
🔹 Table : capital_investments

id

date

montant

source (cash, mobile, banque)

commentaire

👉 Sert à répondre à :
“Combien avons-nous mis dans le business ?”

🔹 Table : purchase_items (déjà existante, mais enrichie)

Ajouts obligatoires :

coût_unitaire

coût_total

valeur_attendue_vente_VIP

valeur_attendue_vente_TERRASSE

marge_attendue_VIP

marge_attendue_TERRASSE

👉 Dès l’achat, le système sait :

combien ça a coûté

combien ça DOIT rapporter

combien de marge est attendue

18. 📊 VALEUR ATTENDUE DU STOCK (TEMPS RÉEL)
🔹 Table logique : stock_expected_value (vue / calcul)

Par produit :

stock_quantite_base

coût_total_stock

valeur_attendue_VIP

valeur_attendue_TERRASSE

marge_attendue

👉 Le propriétaire peut voir :

“Si je vends tout ce stock, je gagne combien ?”

19. 🧾 VENTES RÉELLES (RÉALISÉ)

Déjà présent, mais on insiste :

Table : sales

total_brut

remise_fidelite

total_net

marge_reelle

espace_vente (VIP / Terrasse)

👉 On peut comparer :

marge attendue

marge réellement encaissée

20. ⚠️ GESTION DES PERTES (POINT QUE TU AS FRAPPÉ TRÈS FORT)
🔴 CECI EST CRITIQUE

Les pertes ne sont pas un simple mouvement de stock.
Ce sont des pertes financières.

🔹 Table : loss_events (NOUVELLE TABLE CLÉ)

id

produit_id

quantite_base

type_perte :

casse

avarié

manquant

vol

valeur_financiere

date

responsable_type :

employé

service

fournisseur

inconnu

responsable_id (nullable)

commentaire

validé_par_manager (bool)

👉 Chaque perte a un coût, une cause et un responsable.

21. 👤 IMPACT DES PERTES SUR LES EMPLOYÉS
🔹 Table : employee_liabilities

employee_id

loss_event_id

montant_imputé

statut :

retenu_salaire

avertissement

non_imputable

👉 Le système permet de dire :

❌ perte non justifiée → imputée

⚠️ perte accidentelle → avertissement

✅ perte normale → acceptée

22. 📉 STOCK THÉORIQUE vs STOCK PHYSIQUE
Processus de contrôle

Le système calcule :

stock théorique (mouvements)

Inventaire physique effectué

Calcul :

écart = physique – théorique

Génération automatique :

soit d’un loss_event

soit d’un ajustement validé

👉 Le système ne laisse PAS un écart sans explication.

23. 📊 DASHBOARD PROPRIÉTAIRE (CE QUE TU VEUX VOIR)
Écrans clés
📈 Vue Investisseur

Capital investi

Valeur stock actuelle

Valeur attendue de vente

Bénéfice attendu

Bénéfice réel

Écart global

⚠️ Vue Pertes

Total pertes période

Top produits perdus

Top causes

Responsables fréquents

🧾 Vue Contrôle

Attendu vs Réel

Marge théorique vs marge réelle

Perte en % du CA

24. 🔐 RESPONSABILITÉS & RÔLES (RENFORCÉ)
Caissier

Ventes uniquement

Aucune validation de perte

Manager

Validation pertes

Inventaires

Ajustements stock

Rapports journaliers

Administrateur / Propriétaire

Vue complète

Décision imputations

Paramétrage règles de perte

25. 🎨 DESIGN POS (IMPORTANT POUR TOI)
Principes UI

Mobile-first

Tablette-first

Boutons larges

Zéro scroll en vente

Couleurs contrastées

États clairs (succès / erreur / alerte)

Inspirations

POS Square

Lightspeed

Toast POS

