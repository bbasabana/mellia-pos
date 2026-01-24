# Guide des Mouvements de Stock

Ce document explique les trois types de mouvements de stock disponibles dans l'application MelliaPos.

---

## 1. 🔄 Transfert

**Définition :** Déplacement de stock d'un lieu à un autre **sans modifier la quantité totale**.

### Caractéristiques
- ✅ La quantité totale en stock reste **inchangée**
- ✅ Nécessite un lieu **source** (De) et un lieu **destination** (Vers)
- ✅ Traçabilité complète du mouvement

### Exemple concret
```
Situation initiale :
- DEPOT : 10 bouteilles de vin
- FRIGO : 0 bouteille

Action : Transfert de 5 bouteilles du DEPOT vers le FRIGO

Résultat :
- DEPOT : 5 bouteilles
- FRIGO : 5 bouteilles
- Total : 10 bouteilles (inchangé ✓)
```

### Cas d'utilisation
- Préparer le service du soir en transférant des produits du DEPOT vers la CUISINE
- Mettre des boissons au FRIGO depuis le CASIER
- Réorganiser le stock entre différents lieux de stockage

---

## 2. ⚖️ Ajustement / Stock Initial

**Définition :** Correction ou initialisation des quantités en stock. Permet d'**ajouter** ou **retirer** du stock.

### Deux sous-types

#### ➕ AJOUTER (Stock Initial)
**Quand l'utiliser :**
- 📦 **Inventaire initial** : Lors de la première utilisation de l'application
- 🔧 **Correction d'erreur** : Si vous avez oublié d'enregistrer une réception
- 📊 **Mise à jour après comptage physique** : Quand le stock réel est supérieur au stock système

**Exemple :**
```
Premier inventaire :
- Vous comptez 50 kg de riz au DEPOT
- Action : Ajustement +50 kg au DEPOT
- Résultat : Stock initial de 50 kg créé
```

#### ➖ RETIRER
**Quand l'utiliser :**
- 🔧 **Correction d'erreur** : Si le stock système est surévalué
- 📊 **Mise à jour après comptage physique** : Quand le stock réel est inférieur au stock système

**Exemple :**
```
Écart d'inventaire :
- Système affiche : 30 unités
- Comptage physique : 25 unités
- Action : Ajustement -5 unités
- Résultat : Stock corrigé à 25 unités
```

### ⚠️ Important
Les ajustements doivent être utilisés avec précaution et toujours accompagnés d'un **motif clair** pour la traçabilité.

---

## 3. ⚠️ Perte / Casse

**Définition :** Enregistrement d'une **perte définitive** de stock. Le produit disparaît sans être vendu.

### Caractéristiques
- ❌ Le stock **diminue** dans le lieu concerné
- 📊 La perte est **tracée séparément** pour la comptabilité
- 💰 Impact sur la rentabilité (coût non récupéré)

### Exemples concrets

| Situation | Type de perte | Action |
|-----------|---------------|--------|
| 🍾 Bouteille tombée et cassée | Casse | Perte de 1 bouteille depuis CUISINE |
| 🗑️ Produits périmés jetés | Péremption | Perte de X kg depuis FRIGO |
| 🚨 Marchandise volée | Vol | Perte de X unités depuis DEPOT |
| 🔥 Aliments brûlés en cuisine | Erreur cuisson | Perte de X portions depuis CUISINE |
| 🧪 Produits abîmés | Détérioration | Perte de X unités depuis ECONOMAT |

### Motifs recommandés
- "Bouteille cassée pendant le service"
- "Produits périmés - date dépassée"
- "Brûlé en cuisine"
- "Vol constaté lors de l'inventaire"
- "Détérioration - emballage endommagé"

### 📈 Analyse des pertes
Les pertes sont importantes à suivre car elles permettent de :
- Identifier les produits problématiques
- Calculer le taux de perte par catégorie
- Améliorer les processus (formation, stockage, etc.)
- Ajuster les prix de vente pour compenser

---

## 📊 Tableau récapitulatif

| Type de mouvement | Impact quantité totale | Lieux impliqués | Utilisation principale |
|-------------------|------------------------|------------------|------------------------|
| **🔄 Transfert** | ➡️ Inchangée | Source → Destination | Déplacer entre lieux |
| **⚖️ Ajustement** | ⬆️ Augmente ou ⬇️ Diminue | 1 lieu | Inventaire initial / Corrections |
| **⚠️ Perte/Casse** | ⬇️ Diminue | 1 lieu (source) | Produits perdus/cassés/jetés |

---

## 🎯 Bonnes pratiques

### ✅ À faire
- **Toujours renseigner un motif** clair et précis
- **Vérifier les quantités** avant de valider
- **Utiliser le bon type** de mouvement selon la situation
- **Documenter les pertes importantes** avec des détails

### ❌ À éviter
- Utiliser "Ajustement" pour masquer des pertes (fausse la comptabilité)
- Faire des transferts sans vérifier les lieux source/destination
- Oublier de renseigner le motif
- Confondre "Ajustement" et "Perte"

---

## 🔍 Cas pratiques

### Scénario 1 : Début de service
**Besoin :** Préparer la cuisine pour le service du soir
- **Action :** Transfert de 5 kg de viande du FRIGO vers CUISINE
- **Type :** 🔄 Transfert

### Scénario 2 : Premier jour d'utilisation
**Besoin :** Enregistrer le stock existant
- **Action :** Ajustement +100 bouteilles de vin au CASIER
- **Type :** ⚖️ Ajustement (AJOUTER)

### Scénario 3 : Bouteille cassée
**Besoin :** Une bouteille tombe pendant le service
- **Action :** Perte de 1 bouteille depuis CUISINE
- **Type :** ⚠️ Perte/Casse
- **Motif :** "Bouteille cassée pendant le service"

### Scénario 4 : Écart d'inventaire
**Besoin :** Après comptage, il manque 3 kg de farine
- **Action :** Ajustement -3 kg au ECONOMAT
- **Type :** ⚖️ Ajustement (RETIRER)
- **Motif :** "Correction après inventaire physique"

---

## 📝 Lieux de stockage disponibles

- **DEPOT** : Stockage principal
- **FRIGO** : Produits réfrigérés
- **CASIER** : Boissons et produits secs
- **ECONOMAT** : Réserve générale
- **CUISINE** : Stock en cours d'utilisation

---

*Document créé le 23/01/2026 - MelliaPos v1.0*
