# Configuration du système de tracking automatique

## 🚀 Fonctionnalités

✅ **Tracking automatique** : Mise à jour des statuts en temps réel
✅ **APIs gratuites** : Utilisation des APIs gratuites des transporteurs
✅ **Tableau de bord** : Interface de suivi en temps réel
✅ **Mise à jour automatique** : Vérification périodique des statuts
✅ **Multi-transporteurs** : Support Chronopost, Colissimo, DHL, UPS, etc.

## 📋 APIs gratuites disponibles

### 1. **La Poste / Colissimo** (Gratuit)
- **Site** : https://developer.laposte.fr/
- **Limite** : 1000 requêtes/jour gratuites
- **Inscription** : Gratuite avec email
- **Variable** : `VITE_LAPOSTE_API_KEY`

### 2. **TrackingMore** (Freemium)
- **Site** : https://www.trackingmore.com/api-doc
- **Limite** : 100 requêtes/mois gratuites
- **Support** : 700+ transporteurs
- **Variable** : `VITE_TRACKINGMORE_API_KEY`

### 3. **AfterShip** (Freemium)
- **Site** : https://www.aftership.com/docs/api/4
- **Limite** : 100 envois/mois gratuits
- **Support** : 700+ transporteurs
- **Variable** : `VITE_AFTERSHIP_API_KEY`

## ⚙️ Configuration

### 1. Copiez le fichier d'environnement
```bash
cp .env.example .env
```

### 2. Ajoutez vos clés API (optionnel)
```env
# APIs de tracking (optionnelles)
VITE_LAPOSTE_API_KEY=your_laposte_api_key_here
VITE_TRACKINGMORE_API_KEY=your_trackingmore_api_key_here
```

### 3. Le système fonctionne sans clés API
- **Mode démo** : Données de test réalistes
- **Développement** : Simulation des statuts
- **Production** : Ajoutez les vraies clés API

## 🎯 Utilisation

### 1. **Module "Suivi Livraisons"**
- Tableau de bord en temps réel
- Mise à jour automatique
- Historique des événements
- Barre de progression visuelle

### 2. **Mise à jour automatique**
- ✅ Activation/désactivation
- ⏰ Intervalle configurable (30 min par défaut)
- 🔄 Mise à jour manuelle possible
- 📊 Statistiques en temps réel

### 3. **Statuts supportés**
- **Préparation** : Colis en préparation
- **Collecté** : Pris en charge par le transporteur
- **En transit** : En cours de transport
- **En cours de livraison** : Sortie pour livraison
- **Livré** : Livraison effectuée
- **Problème** : Incident de livraison

## 🔧 Fonctionnalités techniques

### 1. **Service de tracking** (`trackingService.ts`)
```typescript
// Tracking d'un envoi
const tracking = await trackingService.trackShipment(
  'CH123456789FR', 
  'Chronopost'
);

// Mise à jour de tous les envois
await trackingService.updateAllShipments(shipments);

// Validation d'un numéro de tracking
const isValid = trackingService.isValidTrackingNumber(
  'CH123456789FR', 
  'Chronopost'
);
```

### 2. **Hook de tracking** (`useTracking.ts`)
```typescript
// Tracking d'un envoi spécifique
const { trackingData, loading, error, refetch } = useTracking(
  trackingNumber, 
  carrier
);

// Mise à jour automatique
const { lastUpdate, updating } = useAutoTracking(shipments, 30);
```

### 3. **Composant de suivi** (`TrackingDashboard.tsx`)
- Interface utilisateur complète
- Mise à jour en temps réel
- Détails des événements
- Contrôles manuels

## 📈 Avantages

### ✅ **Gratuit**
- Pas de coûts supplémentaires
- APIs gratuites avec limites raisonnables
- Mode démo sans inscription

### ✅ **Automatique**
- Mise à jour sans intervention
- Notifications de changement de statut
- Synchronisation avec Airtable

### ✅ **Complet**
- Support multi-transporteurs
- Historique détaillé
- Interface intuitive

### ✅ **Évolutif**
- Ajout facile de nouveaux transporteurs
- Configuration flexible
- Extensible selon les besoins

## 🚀 Prochaines étapes

1. **Testez le système** avec les données de démo
2. **Inscrivez-vous** aux APIs gratuites si besoin
3. **Configurez** les clés API dans `.env`
4. **Activez** la mise à jour automatique
5. **Profitez** du suivi en temps réel !

## 📞 Support

Le système fonctionne immédiatement en mode démo. Pour la production :

1. **La Poste** : Inscription gratuite sur developer.laposte.fr
2. **TrackingMore** : 100 requêtes/mois gratuites
3. **Mode hybride** : Combinaison APIs gratuites + données de test

**Le tracking automatique est maintenant intégré à votre ERP !** 🎉
