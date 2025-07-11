import React, { useState } from 'react';
import { Plus, Search, Filter, Edit3, Trash2, Eye, ShoppingCart, Package, X } from 'lucide-react';
import { useAirtable } from '../hooks/useAirtable';
import ClientAutocomplete from './ClientAutocomplete';
import ProductAutocomplete from './ProductAutocomplete';
import airtableService from '../services/airtableService';

const Orders = () => {
  const { data: orders, loading, error, refetch } = useAirtable('orders');
  const { data: products } = useAirtable('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [formData, setFormData] = useState({
    client: '',
    client_id: [],
    date: new Date().toISOString().split('T')[0],
    statut: 'En préparation',
    notes: '',
    produits: []
  });

  const statusColors = {
    'En cours': 'bg-yellow-100 text-yellow-800',
    'Expédié': 'bg-blue-100 text-blue-800',
    'Livré': 'bg-green-100 text-green-800',
    'En préparation': 'bg-orange-100 text-orange-800',
    'Annulé': 'bg-red-100 text-red-800'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Calculer le montant total automatiquement
      const montantTotal = formData.produits.reduce((sum, produit) => 
        sum + (produit.quantite * produit.prix_unitaire), 0
      );
      
      const orderData = {
        ...formData,
        montant: montantTotal,
        articles: formData.produits.reduce((sum, p) => sum + p.quantite, 0),
        client_id: formData.client_id.length > 0 ? formData.client_id : undefined
      };
      
      if (editingOrder) {
        await airtableService.updateOrder(editingOrder.id, { fields: orderData });
      } else {
        await airtableService.createOrder({ fields: orderData });
      }
      setShowAddForm(false);
      setEditingOrder(null);
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
      client: '',
      client_id: [],
      date: new Date().toISOString().split('T')[0],
      statut: 'En préparation',
      notes: '',
      produits: []
    });
  };

  const handleEdit = (order) => {
    setEditingOrder(order);
    setFormData({
      client: order.fields.client || '',
      client_id: order.fields.client_id || [],
      date: order.fields.date || new Date().toISOString().split('T')[0],
      statut: order.fields.statut || 'En préparation',
      notes: order.fields.notes || '',
      produits: order.fields.produits || []
    });
    setShowAddForm(true);
  };

  const handleDelete = async (orderId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) {
      try {
        await airtableService.deleteOrder(orderId);
        await refetch();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression: ' + error.message);
      }
    }
  };

  const handleClientChange = (clientName, clientData) => {
    setFormData({
      ...formData,
      client: clientName,
      client_id: clientData?.id ? [clientData.id] : []
    });
  };

  const addProductLine = () => {
    setFormData({
      ...formData,
      produits: [...formData.produits, { produit: '', quantite: 1, prix_unitaire: 0 }]
    });
  };

  const removeProductLine = (index) => {
    const newProduits = formData.produits.filter((_, i) => i !== index);
    setFormData({ ...formData, produits: newProduits });
  };

  const updateProductLine = (index, field, value) => {
    const newProduits = [...formData.produits];
    newProduits[index] = { ...newProduits[index], [field]: value };
    setFormData({ ...formData, produits: newProduits });
  };

  const updateProductLineWithProduct = (index, productName, product) => {
    const newProduits = [...formData.produits];
    newProduits[index] = { 
      ...newProduits[index], 
      produit: productName,
      prix_unitaire: product?.fields.prix || newProduits[index].prix_unitaire
    };
    setFormData({ ...formData, produits: newProduits });
  };

  const filteredOrders = orders.filter(order => {
    const fields = order.fields;
    const matchesSearch = fields.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fields.id_commande?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || fields.statut === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculs pour les statistiques
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + (order.fields.montant || 0), 0);
  
  // CA du mois
  const now = new Date();
  const revenueThisMonth = orders.filter(order => {
    const orderDate = new Date(order.fields.date);
    return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
  }).reduce((sum, order) => sum + (order.fields.montant || 0), 0);

  const ordersInProgress = orders.filter(o => o.fields.statut === 'En cours' || o.fields.statut === 'En préparation').length;
  const ordersShipped = orders.filter(o => o.fields.statut === 'Expédié').length;

  if (loading) return <div className="flex justify-center items-center h-64">Chargement...</div>;
  if (error) return <div className="text-red-600 text-center">Erreur: {error}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des commandes</h1>
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingOrder(null);
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
              <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">CA ce mois</p>
              <p className="text-2xl font-bold text-green-600">{revenueThisMonth.toLocaleString('fr-FR')} €</p>
              <p className="text-xs text-gray-500">
                {totalRevenue > 0 ? `${((revenueThisMonth / totalRevenue) * 100).toFixed(1)}% du total` : '0% du total'}
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <ShoppingCart className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En cours</p>
              <p className="text-2xl font-bold text-orange-600">{ordersInProgress}</p>
            </div>
            <div className="p-3 rounded-full bg-orange-100">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Expédiées</p>
              <p className="text-2xl font-bold text-blue-600">{ordersShipped}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <Package className="w-6 h-6 text-blue-600" />
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
                placeholder="Rechercher une commande..."
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
              <option value="En préparation">En préparation</option>
              <option value="En cours">En cours</option>
              <option value="Expédié">Expédié</option>
              <option value="Livré">Livré</option>
              <option value="Annulé">Annulé</option>
            </select>
          </div>
        </div>
      </div>

      {/* Add/Edit Order Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {editingOrder ? 'Modifier la commande' : 'Nouvelle commande'}
            </h2>
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingOrder(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
                <ClientAutocomplete
                  value={formData.client}
                  onChange={handleClientChange}
                  placeholder="Rechercher une entreprise..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
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
                  <option value="En préparation">En préparation</option>
                  <option value="En cours">En cours</option>
                  <option value="Expédié">Expédié</option>
                  <option value="Livré">Livré</option>
                  <option value="Annulé">Annulé</option>
                </select>
              </div>
            </div>

            {/* Produits commandés */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Produits commandés</h3>
                <button
                  type="button"
                  onClick={addProductLine}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter produit</span>
                </button>
              </div>
              
              {formData.produits.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 mb-4">Aucun produit ajouté</p>
                  <button
                    type="button"
                    onClick={addProductLine}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    Ajouter le premier produit
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.produits.map((produit, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 border border-gray-200 rounded-lg">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Produit *</label>
                        <ProductAutocomplete
                          value={produit.produit || ""}
                          onChange={(productName, product) => updateProductLineWithProduct(index, productName, product)}
                          products={products}
                          placeholder="Rechercher un produit..."
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Quantité</label>
                        <input
                          type="number"
                          min="1"
                          value={produit.quantite}
                          onChange={(e) => updateProductLine(index, 'quantite', parseInt(e.target.value) || 1)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Prix unitaire</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={produit.prix_unitaire}
                          onChange={(e) => updateProductLine(index, 'prix_unitaire', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Total</label>
                        <div className="px-2 py-1 bg-gray-50 border border-gray-300 rounded text-sm">
                          {(produit.quantite * produit.prix_unitaire).toFixed(2)} €
                        </div>
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeProductLine(index)}
                          className="text-red-600 hover:text-red-900 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {formData.produits.length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total commande:</span>
                    <span className="text-lg font-bold text-green-600">
                      {formData.produits.reduce((sum, produit) => sum + (produit.quantite * produit.prix_unitaire), 0).toFixed(2)} €
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1 text-sm text-gray-600">
                    <span>Articles:</span>
                    <span>{formData.produits.reduce((sum, p) => sum + p.quantite, 0)}</span>
                  </div>
                </div>
              )}
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
                  setEditingOrder(null);
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
                {saving ? 'Sauvegarde...' : (editingOrder ? 'Modifier' : 'Créer')} la commande
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commande
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Articles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {order.fields.id_commande || order.id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.fields.client}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.fields.date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(order.fields.montant || 0).toLocaleString('fr-FR')} €
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.fields.articles || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[order.fields.statut] || 'bg-gray-100 text-gray-800'}`}>
                      {order.fields.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Voir détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(order)}
                        className="text-green-600 hover:text-green-900"
                        title="Modifier"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(order.id)}
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

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Détail de la commande {selectedOrder.fields.id_commande || selectedOrder.id}
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Informations générales</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Client:</span> {selectedOrder.fields.client}</div>
                  <div><span className="font-medium">Date:</span> {new Date(selectedOrder.fields.date).toLocaleDateString('fr-FR')}</div>
                  <div><span className="font-medium">Statut:</span> 
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[selectedOrder.fields.statut] || 'bg-gray-100 text-gray-800'}`}>
                      {selectedOrder.fields.statut}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Montants</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Montant total:</span> {(selectedOrder.fields.montant || 0).toLocaleString('fr-FR')} €</div>
                  <div><span className="font-medium">Nombre d'articles:</span> {selectedOrder.fields.articles || 0}</div>
                </div>
              </div>
            </div>

            {selectedOrder.fields.produits && selectedOrder.fields.produits.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Produits commandés</h4>
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
                      {selectedOrder.fields.produits.map((produit, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 text-sm text-gray-900">{produit.produit}</td>
                          <td className="px-3 py-2 text-sm text-gray-500">{produit.quantite}</td>
                          <td className="px-3 py-2 text-sm text-gray-500">{produit.prix_unitaire.toFixed(2)} €</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{(produit.quantite * produit.prix_unitaire).toFixed(2)} €</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedOrder.fields.notes && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedOrder.fields.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
