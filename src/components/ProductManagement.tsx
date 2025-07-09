import React, { useState } from 'react';
import { Plus, Search, Filter, Edit3, Trash2, Package, Save, X, Check } from 'lucide-react';
import { useAirtable } from '../hooks/useAirtable';
import airtableService from '../services/airtableService';

const ProductManagement = () => {
  const { data: products, loading, error, refetch } = useAirtable('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    categorie: 'Panneau',
    stock: 0,
    seuil: 10,
    prix: 0,
    fournisseur: '',
    emplacement: '',
    description: '',
    reference: ''
  });

  const categories = ['all', 'Panneau', 'Batterie', 'Onduleur', 'Accessoire', 'Câblage', 'Structure', 'Pinces'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingProduct) {
        await airtableService.updateProduct(editingProduct.id, { fields: formData });
      } else {
        await airtableService.createProduct({ fields: formData });
      }
      setShowAddForm(false);
      setEditingProduct(null);
      setFormData({
        nom: '',
        categorie: 'Panneau',
        stock: 0,
        seuil: 10,
        prix: 0,
        fournisseur: '',
        emplacement: '',
        description: '',
        reference: ''
      });
      await refetch();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      nom: product.fields.nom || '',
      categorie: product.fields.categorie || 'Panneau',
      stock: product.fields.stock || 0,
      seuil: product.fields.seuil || 10,
      prix: product.fields.prix || 0,
      fournisseur: product.fields.fournisseur || '',
      emplacement: product.fields.emplacement || '',
      description: product.fields.description || '',
      reference: product.fields.reference || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      try {
        await airtableService.deleteProduct(productId);
        await refetch();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression: ' + error.message);
      }
    }
  };

  const handleStockUpdate = async (productId, newStock) => {
    try {
      const product = products.find(p => p.id === productId);
      await airtableService.updateProduct(productId, {
        fields: { ...product.fields, stock: newStock }
      });
      await refetch();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du stock:', error);
      alert('Erreur lors de la mise à jour du stock: ' + error.message);
    }
  };

  const filteredProducts = products.filter(product => {
    const fields = product.fields;
    const matchesSearch = fields.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fields.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || fields.categorie === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) return <div className="flex justify-center items-center h-64">Chargement...</div>;
  if (error) return <div className="text-red-600 text-center">Erreur: {error}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des produits</h1>
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingProduct(null);
            setFormData({
              nom: '',
              categorie: 'Panneau',
              stock: 0,
              seuil: 10,
              prix: 0,
              fournisseur: '',
              emplacement: '',
              description: '',
              reference: ''
            });
          }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Créer un produit</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">Toutes les catégories</option>
              {categories.slice(1).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Add/Edit Product Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {editingProduct ? 'Modifier le produit' : 'Nouveau produit'}
            </h2>
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingProduct(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du produit *</label>
                <input
                  type="text"
                  required
                  value={formData.nom}
                  onChange={(e) => setFormData({...formData, nom: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Nom du produit"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Référence</label>
                <input
                  type="text"
                  value={formData.reference}
                  onChange={(e) => setFormData({...formData, reference: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="REF-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
                <select
                  required
                  value={formData.categorie}
                  onChange={(e) => setFormData({...formData, categorie: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {categories.slice(1).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock initial</label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seuil d'alerte</label>
                <input
                  type="number"
                  min="0"
                  value={formData.seuil}
                  onChange={(e) => setFormData({...formData, seuil: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prix unitaire (€)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.prix}
                  onChange={(e) => setFormData({...formData, prix: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
                <input
                  type="text"
                  value={formData.fournisseur}
                  onChange={(e) => setFormData({...formData, fournisseur: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Nom du fournisseur"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emplacement</label>
                <input
                  type="text"
                  value={formData.emplacement}
                  onChange={(e) => setFormData({...formData, emplacement: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="A-01"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                  placeholder="Description détaillée du produit"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingProduct(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Sauvegarde...' : (editingProduct ? 'Modifier' : 'Créer')}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Catégorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prix
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fournisseur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onStockUpdate={handleStockUpdate}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ProductRow = ({ product, onEdit, onDelete, onStockUpdate }) => {
  const [isEditingStock, setIsEditingStock] = useState(false);
  const [newStock, setNewStock] = useState(product.fields.stock || 0);
  const fields = product.fields;

  const handleStockSave = () => {
    onStockUpdate(product.id, newStock);
    setIsEditingStock(false);
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div>
          <div className="text-sm font-medium text-gray-900">{fields.nom}</div>
          <div className="text-sm text-gray-500">{fields.reference}</div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {fields.categorie}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {isEditingStock ? (
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={newStock}
              onChange={(e) => setNewStock(parseInt(e.target.value) || 0)}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
            />
            <button
              onClick={handleStockSave}
              className="text-green-600 hover:text-green-900"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setIsEditingStock(false);
                setNewStock(fields.stock || 0);
              }}
              className="text-red-600 hover:text-red-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            className="cursor-pointer flex items-center space-x-2"
            onClick={() => setIsEditingStock(true)}
          >
            <span className="text-sm text-gray-900">{fields.stock || 0}</span>
            <Edit3 className="w-3 h-3 text-gray-400" />
          </div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {(fields.prix || 0).toLocaleString('fr-FR')} €
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {fields.fournisseur}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(product)}
            className="text-green-600 hover:text-green-900"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(product.id)}
            className="text-red-600 hover:text-red-900"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default ProductManagement;
