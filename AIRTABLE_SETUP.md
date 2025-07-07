# Configuration Airtable pour SunLib ERP

## 1. Création de la base Airtable

1. Connectez-vous à [Airtable](https://airtable.com)
2. Créez une nouvelle base appelée "SunLib ERP"
3. Créez les tables suivantes avec leurs champs :

## 2. Structure des tables

### Table "Clients" ⭐ NOUVELLE
- **nom** (Single line text) - Nom du contact principal
- **entreprise** (Single line text) - Nom de l'entreprise ⭐ OBLIGATOIRE
- **email** (Email) - Adresse email
- **telephone** (Phone number) - Numéro de téléphone
- **adresse** (Long text) - Adresse complète
- **type** (Single select) - Options: Particulier, Entreprise (par défaut: Entreprise)
- **notes** (Long text) - Notes sur le client
- **date_creation** (Created time) - Date de création
- **actif** (Checkbox) - Client actif (par défaut: coché)

### Table "Produits"
- **nom** (Single line text) - Nom du produit
- **reference** (Single line text) - Référence produit
- **categorie** (Single select) - Options: Panneau, Batterie, Onduleur, Accessoire, Câblage, Structure, Pinces
- **stock** (Number) - Quantité en stock
- **seuil** (Number) - Seuil d'alerte
- **prix** (Currency) - Prix unitaire
- **fournisseur** (Single line text) - Nom du fournisseur
- **emplacement** (Single line text) - Emplacement dans l'entrepôt
- **description** (Long text) - Description détaillée
- **date_creation** (Date) - Date de création
- **date_modification** (Last modified time) - Dernière modification

### Table "Commandes"
- **id_commande** (Single line text) - Identifiant unique
- **client** (Single line text) - Nom de l'entreprise ⭐ MODIFIÉ
- **client_id** (Link to record) - Lien vers table Clients
- **date** (Date) - Date de la commande
- **montant** (Currency) - Montant total
- **statut** (Single select) - Options: En préparation, En cours, Expédié, Livré, Annulé
- **articles** (Number) - Nombre d'articles
- **produits** (Multiple record links) - Lien vers table Produits
- **notes** (Long text) - Notes sur la commande
- **date_creation** (Created time) - Date de création

### Table "Couts"
- **description** (Single line text) - Description du coût
- **type** (Single select) - Options: Achat, Logistique, Maintenance, Bureau, Marketing
- **montant** (Currency) - Montant HT
- **date** (Date) - Date du coût
- **fournisseur** (Single line text) - Fournisseur
- **tva** (Percent) - Taux de TVA
- **statut** (Single select) - Options: En attente, Payé, Annulé
- **facture** (Attachment) - Fichier de facture
- **date_creation** (Created time) - Date de création

### Table "Envois"
- **id_envoi** (Single line text) - Identifiant unique
- **commande** (Single line text) - Référence commande
- **destinataire** (Single line text) - Nom de l'entreprise destinataire ⭐ MODIFIÉ
- **adresse** (Long text) - Adresse complète
- **transporteur** (Single select) - Options: Chronopost, DHL, UPS, Colissimo, Autre
- **tracking_number** (Single line text) - Numéro de suivi
- **statut** (Single select) - Options: Préparation, En transit, Livré, Retour
- **date_expedition** (Date) - Date d'expédition
- **date_livraison** (Date) - Date de livraison prévue
- **couts** (Currency) - Coût du transport
- **date_creation** (Created time) - Date de création

### Table "Installateurs"
- **nom** (Single line text) - Nom de l'installateur
- **email** (Email) - Adresse email
- **telephone** (Phone number) - Numéro de téléphone
- **entreprise** (Single line text) - Nom de l'entreprise ⭐ OBLIGATOIRE
- **adresse** (Long text) - Adresse complète
- **specialites** (Multiple select) - Options: Résidentiel, Commercial, Industriel
- **actif** (Checkbox) - Installateur actif
- **date_creation** (Created time) - Date de création

### Table "Rapports_Installateurs"
- **installateur** (Single line text) - Nom de l'entreprise installatrice ⭐ MODIFIÉ
- **installateur_id** (Link to record) - Lien vers table Installateurs
- **projet** (Single line text) - Nom du projet
- **date_reception** (Date) - Date de réception des produits
- **produits_recus** (Long text) - Liste des produits reçus (JSON)
- **statut** (Single select) - Options: En cours, Vérifié, Problème
- **commentaires** (Long text) - Commentaires de l'installateur
- **photos** (Attachment) - Photos des produits
- **email** (Email) - Email de l'installateur
- **date_creation** (Created time) - Date de création

## 3. Fonctionnalité d'autocomplétion par entreprise ⭐ MISE À JOUR

### Comment ça fonctionne :
1. **Recherche par entreprise** : Quand vous tapez dans le champ client, l'ERP recherche automatiquement dans la table "Clients" en priorité sur le nom d'entreprise
2. **Recherche intelligente** : La recherche porte d'abord sur l'entreprise, puis le nom du contact, puis l'email
3. **Suggestions en temps réel** : Les résultats apparaissent instantanément triés par nom d'entreprise
4. **Création rapide** : Si aucune entreprise n'est trouvée, vous pouvez en créer une nouvelle directement
5. **Informations complètes** : Chaque suggestion affiche le nom de l'entreprise, le contact principal, l'email et le téléphone

### Avantages :
- ✅ **Gestion par entreprise** : Toutes les recherches et créations se font par nom d'entreprise
- ✅ **Évite les doublons** : Plus de risque de créer plusieurs fois la même entreprise
- ✅ **Gain de temps** : Sélection rapide des entreprises existantes
- ✅ **Données cohérentes** : Informations client centralisées par entreprise
- ✅ **Recherche flexible** : Trouve les entreprises même avec une saisie partielle
- ✅ **Interface intuitive** : Création de nouvelles entreprises en un clic

## 4. Configuration des clés API

1. Allez dans votre [compte Airtable](https://airtable.com/account)
2. Générez un Personal Access Token avec les permissions :
   - `data.records:read`
   - `data.records:write`
   - `schema.bases:read`
3. Notez votre Base ID (visible dans l'URL de votre base)

## 5. Configuration de l'application

1. Copiez le fichier `.env.example` vers `.env`
2. Remplissez les variables :
   ```
   VITE_AIRTABLE_API_KEY=your_personal_access_token
   VITE_AIRTABLE_BASE_ID=your_base_id
   ```
3. Redémarrez le serveur de développement

## 6. Test de la connexion

L'application testera automatiquement la connexion au démarrage. En cas d'erreur :
- Vérifiez vos clés API
- Assurez-vous que les noms de tables correspondent exactement
- Vérifiez les permissions de votre token

## 7. Utilisation de l'autocomplétion par entreprise ⭐ MISE À JOUR

### Dans le module Commandes :
1. Cliquez sur "Nouvelle commande"
2. Dans le champ "Entreprise", commencez à taper :
   - Le nom d'une entreprise
   - Le nom d'un contact
   - Une adresse email
3. Sélectionnez une entreprise existante ou créez-en une nouvelle
4. Les informations de l'entreprise sont automatiquement liées à la commande

### Création d'une nouvelle entreprise :
1. Si aucune entreprise ne correspond à votre recherche
2. Cliquez sur "Créer une nouvelle entreprise"
3. Remplissez le formulaire (nom d'entreprise obligatoire)
4. L'entreprise est automatiquement créée et sélectionnée

## 8. Sécurité

- Ne partagez jamais vos clés API
- Utilisez des tokens avec permissions minimales
- Sauvegardez régulièrement votre base Airtable
- Configurez des vues filtrées pour limiter l'accès aux données sensibles

## 9. Maintenance

- Nettoyez régulièrement les entreprises inactives
- Vérifiez les doublons potentiels d'entreprises
- Mettez à jour les informations de contact
- Archivez les anciens projets
- Maintenez la cohérence des noms d'entreprises