# Configuration Airtable pour la Gestion des Achats

## 📋 Nouvelle table "Achats" à créer dans Airtable

### Structure de la table "Achats" :

- **numero_commande** (Single line text) - Numéro de commande d'achat (auto-généré)
- **fournisseur** (Single line text) - Nom du fournisseur ⭐ OBLIGATOIRE
- **date_commande** (Date) - Date de la commande d'achat
- **date_livraison_prevue** (Date) - Date de livraison prévue
- **date_livraison_reelle** (Date) - Date de livraison réelle
- **statut** (Single select) - Options: En attente, Commandé, Partiellement reçu, Reçu, Annulé
- **montant_ht** (Currency) - Montant hors taxes
- **tva** (Percent) - Taux de TVA (par défaut: 20%)
- **montant_ttc** (Formula) - Calcul automatique: `{montant_ht} * (1 + {tva})`
- **mode_paiement** (Single select) - Options: Virement, Chèque, Carte, Espèces, Crédit 30j, Crédit 60j
- **reference_fournisseur** (Single line text) - Référence du fournisseur
- **notes** (Long text) - Notes sur la commande
- **facture_pdf** (Attachment) - Fichier PDF de la facture ⭐ NOUVEAU
- **bon_commande** (Attachment) - Bon de commande PDF (optionnel)
- **date_creation** (Created time) - Date de création automatique
- **date_modification** (Last modified time) - Dernière modification

### Structure de la table "Lignes_Achats" :

- **achat_id** (Link to record) - Lien vers table Achats ⭐ OBLIGATOIRE
- **produit** (Single line text) - Nom du produit ⭐ OBLIGATOIRE
- **produit_id** (Link to record) - Lien vers table Produits (optionnel)
- **reference_produit** (Single line text) - Référence du produit
- **quantite** (Number) - Quantité commandée ⭐ OBLIGATOIRE
- **prix_unitaire** (Currency) - Prix unitaire HT ⭐ OBLIGATOIRE
- **montant_ligne** (Formula) - Calcul: `{quantite} * {prix_unitaire}`
- **quantite_recue** (Number) - Quantité reçue (par défaut: 0)
- **statut_ligne** (Single select) - Options: En attente, Partiellement reçu, Reçu
- **date_reception** (Date) - Date de réception
- **notes_ligne** (Long text) - Notes sur cette ligne

### Structure de la table "Fournisseurs" (optionnelle mais recommandée) :

- **nom** (Single line text) - Nom du fournisseur ⭐ OBLIGATOIRE
- **contact** (Single line text) - Nom du contact principal
- **email** (Email) - Adresse email
- **telephone** (Phone number) - Numéro de téléphone
- **adresse** (Long text) - Adresse complète
- **siret** (Single line text) - Numéro SIRET
- **conditions_paiement** (Single select) - Options: Comptant, 30j, 60j, 90j
- **delai_livraison** (Number) - Délai de livraison en jours
- **actif** (Checkbox) - Fournisseur actif (par défaut: coché)
- **notes** (Long text) - Notes sur le fournisseur
- **date_creation** (Created time) - Date de création

## 🔧 Configuration des vues Airtable

### Vue "Achats en cours" :
- Filtre: `{statut} != "Reçu" AND {statut} != "Annulé"`
- Tri: Date de commande (décroissant)

### Vue "À réceptionner" :
- Filtre: `{statut} = "Commandé" OR {statut} = "Partiellement reçu"`
- Tri: Date de livraison prévue (croissant)

### Vue "Factures en attente" :
- Filtre: `{facture_pdf} = BLANK()`
- Tri: Date de commande (décroissant)

## 📊 Formules utiles

### Montant TTC automatique :
```
{montant_ht} * (1 + {tva})
```

### Statut automatique basé sur les lignes :
```
IF(
  {quantite_recue} = 0, 
  "En attente",
  IF(
    {quantite_recue} = {quantite}, 
    "Reçu", 
    "Partiellement reçu"
  )
)
```

### Retard de livraison :
```
IF(
  AND({date_livraison_prevue}, {statut} != "Reçu"),
  DATETIME_DIFF(TODAY(), {date_livraison_prevue}, 'days'),
  0
)
```

## 🎯 Fonctionnalités du module

### ✅ Gestion des commandes d'achat
- Création de commandes multi-lignes
- Calcul automatique des montants
- Suivi des statuts de livraison
- Gestion des réceptions partielles

### ✅ Upload de factures PDF
- Glisser-déposer de fichiers
- Prévisualisation des PDF
- Stockage sécurisé dans Airtable
- Téléchargement des factures

### ✅ Autocomplétion fournisseurs
- Recherche dynamique
- Création rapide de nouveaux fournisseurs
- Historique des commandes par fournisseur

### ✅ Gestion des produits
- Liaison avec le catalogue produits
- Mise à jour automatique des stocks
- Suivi des prix d'achat

### ✅ Tableau de bord achats
- Statistiques en temps réel
- Alertes de retard
- Suivi budgétaire
- Analyse des fournisseurs

## 🚀 Avantages

- **Traçabilité complète** : De la commande à la réception
- **Gestion documentaire** : Factures et bons de commande centralisés
- **Automatisation** : Calculs et mises à jour automatiques
- **Intégration** : Liaison avec stocks et comptabilité
- **Mobilité** : Accessible depuis tous les appareils

Cette structure vous permettra de gérer complètement vos achats avec une traçabilité parfaite et une gestion documentaire intégrée !
