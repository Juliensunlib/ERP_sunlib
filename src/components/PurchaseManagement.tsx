import React, { useState } from 'react';
import { Plus, Search, Filter, Edit3, Trash2, Upload, FileText, Download, Eye, Package, AlertTriangle, Calendar, DollarSign } from 'lucide-react';
import { useAirtable } from '../hooks/useAirtable';
import SupplierAutocomplete from './SupplierAutocomplete';
import ProductAutocomplete from './ProductAutocomplete';
import airtableService from '../services/airtableService';

const PurchaseManagement = () => {
  const { data: purchases, loading, error, refetch } = useAirtable('purchases');
  const { data: products } = useAirtable('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [formData, setFormData] = useState({
    fournisseur: '',
    date_commande: new Date().toISOString().split('T')[0],
    date_livraison_prevue: '',
    statut: 'En attente',
    montant_ht: 0,
    tva: 20,
    mode_paiement: 'Virement',
    reference_fournisseur: '',
    notes: '',
    lignes: [{ produit: '', quantite: 1, prix_unitaire: 0 }]
  });

  const statusColors = {
    'En attente': 'bg-yellow-100 text-yellow-800',
    'Commandé': 'bg-blue-100 text-blue-800',
    'Partiellement reçu': 'bg-orange-100 text-orange-800',
    'Reçu': 'bg-green-100 text-green-800',
    'Annulé': 'bg-red-100 text-red-800'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Calcul du montant total
      const montantTotal = formData.lignes.reduce((sum, ligne) => 
        sum + (ligne.quantite * ligne.prix_unitaire), 0
      );
      
      const purchaseData = {
        ...formData,
        montant_ht: montantTotal,
        numero_commande: editingPurchase ? editingPurchase.fields.numero_commande : `ACH-${Date.now()}`
      };

      if (editingPurchase) {
        await airtableService.updatePurchase(editingPurchase.id, { fields: purchaseData });
      } else {
        await airtableService.createPurchase({ fields: purchaseData });
      }
      
      setShowAddForm(false);
      setEditingPurchase(null);
      resetForm();
      await refetch();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fournisseur: '',
      date_commande: new Date().toISOString().split('T')[0],
      date_livraison_prevue: '',
      statut: 'En attente',
      montant_ht: 0,
      tva: 20,
      mode_paiement: 'Virement',
      reference_fournisseur: '',
      notes: '',
      lignes: [{ produit: '', quantite: 1, prix_unitaire: 0 }]
    });
  };

  const handleEdit = (purchase) => {
    setEditingPurchase(purchase);
    setFormData({
      fournisseur: purchase.fields.fournisseur || '',
      date_commande: purchase.fields.date_commande || new Date().toISOString().split('T')[0],
      date_livraison_prevue: purchase.fields.date_livraison_prevue || '',
      statut: purchase.fields.statut || 'En attente',
      montant_ht: purchase.fields.montant_ht || 0,
      tva: purchase.fields.tva || 20,
      mode_paiement: purchase.fields.mode_paiement || 'Virement',
      reference_fournisseur: purchase.fields.reference_fournisseur || '',
      notes: purchase.fields.notes || '',
      lignes: purchase.fields.lignes || [{ produit: '', quantite: 1, prix_unitaire: 0 }]
    });
    setShowAddForm(true);
  };

  const handleDelete = async (purchaseId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette commande d\'achat ?')) {
      try {
        await airtableService.deletePurchase(purchaseId);
        await refetch();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression: ' + error.message);
      }
    }
  };

  const handleSupplierChange = (supplierName, supplierData) => {
    setFormData({
      ...formData,
      fournisseur: supplierName
    });
  };

  const addLine = () => {
    setFormData({
      ...formData,
      lignes: [...formData.lignes, { produit: '', quantite: 1, prix_unitaire: 0 }]
    });
  };

  const removeLine = (index) => {
    if (formData.lignes.length > 1) {
      const newLignes = formData.lignes.filter((_, i) => i !== index);
      setFormData({ ...formData, lignes: newLignes });
    }
  };

  const updateLine = (index, field, value) => {
    const newLignes = [...formData.lignes];
    if (field === 'produit') {
      // Si c'est un produit, on peut aussi mettre à jour le prix
      newLignes[index] = { ...newLignes[index], [field]: value };
    } else {
      newLignes[index] = { ...newLignes[index], [field]: value };
    }
    setFormData({ ...formData, lignes: newLignes });
  };

  const updateLineWithProduct = (index, productName, product) => {
    const newLignes = [...formData.lignes];
    newLignes[index] = { 
      ...newLignes[index], 
      produit: productName,
      prix_unitaire: product?.fields.prix || newLignes[index].prix_unitaire
    };
    setFormData({ ...formData, lignes: newLignes });
  };

  const updateLinePrice = (index, price) => {
    const newLignes = [...formData.lignes];
    newLignes[index] = { ...newLignes[index], prix_unitaire: price };
    setFormData({ ...formData, lignes: newLignes });
  };

  const handleFileUpload = async (purchaseId, file) => {
    try {
      await airtableService.uploadPurchaseInvoice(purchaseId, file);
      await refetch();
      alert('Facture uploadée avec succès !');
    } catch (error) {
      console.error('Erreur upload:', error);
      alert('Erreur lors de l\'upload: ' + error.message);
    }
  };

  const filteredPurchases = purchases.filter(purchase => {
    const fields = purchase.fields;
    const matchesSearch = fields.fournisseur?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fields.numero_commande?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fields.reference_fournisseur?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || fields.statut === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Statistiques
  const totalPurchases = purchases.length;
  const pendingPurchases = purchases.filter(p => p.fields.statut === 'En attente' || p.fields.statut === 'Commandé').length;
  const totalAmount = purchases.reduce((sum, p) => sum + (p.fields.montant_ht || 0), 0);
  const overdueDeliveries = purchases.filter(p => {
    if (!p.fields.date_livraison_prevue || p.fields.statut === 'Reçu') return false;
    return new Date(p.fields.date_livraison_prevue) < new Date();
  }).length;

  if (loading) return <div className="flex justify-center items-center h-64">Chargement...</div>;
  if (error) return <div className="text-red-600 text-center">Erreur: {error}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Achats</h1>
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingPurchase(null);
            resetForm();
          }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nouvelle commande</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total commandes</p>
              <p className="text-2xl font-bold text-gray-900">{totalPurchases}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En cours</p>
              <p className="text-2xl font-bold text-orange-600">{pendingPurchases}</p>
            </div>
            <div className="p-3 rounded-full bg-orange-100">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Montant total</p>
              <p className="text-2xl font-bold text-gray-900">{totalAmount.toLocaleString('fr-FR')} €</p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Retards livraison</p>
              <p className="text-2xl font-bold text-red-600">{overdueDeliveries}</p>
            </div>
            <div className="p-3 rounded-full bg-red-100">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher par fournisseur, numéro de commande..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="En attente">En attente</option>
              <option value="Commandé">Commandé</option>
              <option value="Partiellement reçu">Partiellement reçu</option>
              <option value="Reçu">Reçu</option>
              <option value="Annulé">Annulé</option>
            </select>
          </div>
        </div>
      </div>

      {/* Add/Edit Purchase Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {editingPurchase ? 'Modifier la commande' : 'Nouvelle commande d\'achat'}
            </h2>
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingPurchase(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur *</label>
                <SupplierAutocomplete
                  value={formData.fournisseur}
                  onChange={handleSupplierChange}
                  placeholder="Rechercher ou créer un fournisseur..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Référence fournisseur</label>
                <input
                  type="text"
                  value={formData.reference_fournisseur}
                  onChange={(e) => setFormData({...formData, reference_fournisseur: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Référence du fournisseur"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de commande *</label>
                <input
                  type="date"
                  required
                  value={formData.date_commande}
                  onChange={(e) => setFormData({...formData, date_commande: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de livraison prévue</label>
                <input
                  type="date"
                  value={formData.date_livraison_prevue}
                  onChange={(e) => setFormData({...formData, date_livraison_prevue: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select
                  value={formData.statut}
                  onChange={(e) => setFormData({...formData, statut: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="En attente">En attente</option>
                  <option value="Commandé">Commandé</option>
                  <option value="Partiellement reçu">Partiellement reçu</option>
                  <option value="Reçu">Reçu</option>
                  <option value="Annulé">Annulé</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mode de paiement</label>
                <select
                  value={formData.mode_paiement}
                  onChange={(e) => setFormData({...formData, mode_paiement: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="Virement">Virement</option>
                  <option value="Chèque">Chèque</option>
                  <option value="Carte">Carte</option>
                  <option value="Espèces">Espèces</option>
                  <option value="Crédit 30j">Crédit 30j</option>
                  <option value="Crédit 60j">Crédit 60j</option>
                </select>
              </div>
            </div>

            {/* Lignes de commande */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Lignes de commande</h3>
                <button
                  type="button"
                  onClick={addLine}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter ligne</span>
                </button>
              </div>
              
              <div className="space-y-3">
                {formData.lignes.map((ligne, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 border border-gray-200 rounded-lg">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Produit</label>
                      <ProductAutocomplete
                        value={ligne.produit}
                        onChange={(productName, product) => updateLineWithProduct(index, productName, product)}
                        onPriceChange={(price) => updateLinePrice(index, price)}
                        products={products}
                        placeholder="Nom du produit"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Quantité</label>
                      <input
                        type="number"
                        min="1"
                        value={ligne.quantite}
                        onChange={(e) => updateLine(index, 'quantite', parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Prix unitaire HT</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={ligne.prix_unitaire}
                        onChange={(e) => updateLine(index, 'prix_unitaire', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500 bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Total HT</label>
                      <div className="px-2 py-1 bg-gray-50 border border-gray-300 rounded text-sm">
                        {(ligne.quantite * ligne.prix_unitaire).toFixed(2)} €
                      </div>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeLine(index)}
                        disabled={formData.lignes.length === 1}
                        className="text-red-600 hover:text-red-900 disabled:text-gray-400 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total HT:</span>
                  <span className="text-lg font-bold">
                    {formData.lignes.reduce((sum, ligne) => sum + (ligne.quantite * ligne.prix_unitaire), 0).toFixed(2)} €
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-gray-600">TVA ({formData.tva}%):</span>
                  <span className="text-sm">
                    {(formData.lignes.reduce((sum, ligne) => sum + (ligne.quantite * ligne.prix_unitaire), 0) * formData.tva / 100).toFixed(2)} €
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1 pt-2 border-t border-gray-300">
                  <span className="font-bold">Total TTC:</span>
                  <span className="text-lg font-bold text-green-600">
                    {(formData.lignes.reduce((sum, ligne) => sum + (ligne.quantite * ligne.prix_unitaire), 0) * (1 + formData.tva / 100)).toFixed(2)} €
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={3}
                placeholder="Notes sur la commande..."
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingPurchase(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Sauvegarde...' : (editingPurchase ? 'Modifier' : 'Créer')} la commande
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Purchases Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commande
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fournisseur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date commande
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant HT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Facture
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPurchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {purchase.fields.numero_commande}
                      </div>
                      <div className="text-sm text-gray-500">
                        {purchase.fields.reference_fournisseur}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {purchase.fields.fournisseur}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(purchase.fields.date_commande).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(purchase.fields.montant_ht || 0).toLocaleString('fr-FR')} €
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[purchase.fields.statut] || 'bg-gray-100 text-gray-800'}`}>
                      {purchase.fields.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {purchase.fields.facture_pdf ? (
                        <button className="text-green-600 hover:text-green-900" title="Facture disponible">
                          <FileText className="w-4 h-4" />
                        </button>
                      ) : (
                        <label className="cursor-pointer text-blue-600 hover:text-blue-900" title="Uploader facture">
                          <Upload className="w-4 h-4" />
                          <input
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(purchase.id, file);
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedPurchase(purchase)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Voir détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(purchase)}
                        className="text-green-600 hover:text-green-900"
                        title="Modifier"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(purchase.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Purchase Detail Modal */}
      {selectedPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Détail de la commande {selectedPurchase.fields.numero_commande}
              </h3>
              <button
                onClick={() => setSelectedPurchase(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Informations générales</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Fournisseur:</span> {selectedPurchase.fields.fournisseur}</div>
                  <div><span className="font-medium">Date commande:</span> {new Date(selectedPurchase.fields.date_commande).toLocaleDateString('fr-FR')}</div>
                  <div><span className="font-medium">Livraison prévue:</span> {selectedPurchase.fields.date_livraison_prevue ? new Date(selectedPurchase.fields.date_livraison_prevue).toLocaleDateString('fr-FR') : 'Non définie'}</div>
                  <div><span className="font-medium">Mode de paiement:</span> {selectedPurchase.fields.mode_paiement}</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Montants</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Montant HT:</span> {(selectedPurchase.fields.montant_ht || 0).toLocaleString('fr-FR')} €</div>
                  <div><span className="font-medium">TVA:</span> {selectedPurchase.fields.tva || 20}%</div>
                  <div><span className="font-medium">Montant TTC:</span> {((selectedPurchase.fields.montant_ht || 0) * (1 + (selectedPurchase.fields.tva || 20) / 100)).toLocaleString('fr-FR')} €</div>
                </div>
              </div>
            </div>

            {selectedPurchase.fields.lignes && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-2">Lignes de commande</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantité</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Prix unitaire</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedPurchase.fields.lignes.map((ligne, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 text-sm text-gray-900">{ligne.produit}</td>
                          <td className="px-3 py-2 text-sm text-gray-500">{ligne.quantite}</td>
                          <td className="px-3 py-2 text-sm text-gray-500">{ligne.prix_unitaire.toFixed(2)} €</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{(ligne.quantite * ligne.prix_unitaire).toFixed(2)} €</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedPurchase.fields.notes && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                <p className="text-sm text-gray-600">{selectedPurchase.fields.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseManagement;
