# SunLib ERP - Système de gestion d'entreprise

## Description

SunLib ERP est un système de gestion d'entreprise complet développé pour la société SunLib. Il permet de gérer efficacement les commandes, le stock, les coûts et les envois avec une interface moderne et intuitive.

## Fonctionnalités

### 📊 Tableau de bord
- Aperçu des statistiques clés
- Suivi des performances en temps réel
- Alertes et notifications importantes

### 🛒 Gestion des commandes
- Création et suivi des commandes
- Gestion des statuts (en cours, expédié, livré)
- Recherche et filtrage avancés

### 📦 Gestion du stock
- Suivi des produits et quantités
- Alertes de stock faible
- Gestion des emplacements et catégories

### 💰 Gestion des coûts
- Suivi des dépenses par catégorie
- Calcul automatique de la TVA
- Reporting financier

### 🚚 Gestion des envois
- Suivi des expéditions
- Intégration avec les transporteurs
- Gestion des numéros de suivi

## Intégration Airtable

Le système est conçu pour s'intégrer avec Airtable pour le stockage des données. Pour configurer l'intégration :

1. Créez une base Airtable avec les tables suivantes :
   - **Commandes** : id, client, date, montant, statut, articles
   - **Stock** : id, nom, categorie, stock, seuil, prix, fournisseur, emplacement
   - **Couts** : id, description, type, montant, date, fournisseur, tva, statut
   - **Envois** : id, commande, destinataire, adresse, transporteur, tracking, statut, dates, couts

2. Configurez vos variables d'environnement :
   ```env
   REACT_APP_AIRTABLE_API_KEY=votre_clé_api
   REACT_APP_AIRTABLE_BASE_ID=votre_base_id
   ```

3. Obtenez vos clés API depuis [Airtable Developer Hub](https://airtable.com/developers/web/api/introduction)

## Installation

1. Clonez le projet
2. Installez les dépendances : `npm install`
3. Configurez vos variables d'environnement
4. Lancez le serveur de développement : `npm run dev`

## Technologies utilisées

- **React** avec TypeScript
- **Tailwind CSS** pour le styling
- **Lucide React** pour les icônes
- **Vite** pour le build
- **Airtable API** pour le stockage des données

## Structure du projet

```
src/
├── components/          # Composants de l'interface
│   ├── Dashboard.tsx   # Tableau de bord
│   ├── Orders.tsx      # Gestion des commandes
│   ├── Stock.tsx       # Gestion du stock
│   ├── Costs.tsx       # Gestion des coûts
│   └── Shipments.tsx   # Gestion des envois
├── services/           # Services externes
│   └── airtableService.ts
├── hooks/              # Hooks personnalisés
│   └── useAirtable.ts
└── App.tsx             # Composant principal
```

## Design

L'interface utilise une palette de couleurs vertes reflétant l'identité de SunLib :
- Vert principal : #22c55e
- Vert foncé : #166534
- Vert clair : #dcfce7

Le design est responsive et optimisé pour tous les écrans.

## Contribution

Ce projet est développé spécifiquement pour SunLib. Pour toute modification ou amélioration, veuillez contacter l'équipe de développement.

## Licence

Propriété de SunLib - Tous droits réservés