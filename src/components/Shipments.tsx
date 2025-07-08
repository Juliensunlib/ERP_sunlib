import React, { useState } from 'react';
import { Plus, Search, Filter, Edit3, Trash2, Truck, MapPin, Calendar } from 'lucide-react';
import { useAirtable } from '../hooks/useAirtable';
import InstallerAutocomplete from './InstallerAutocomplete';
import airtableService from '../services/airtableService';

const Shipments = () => {
  const { data: shipments, loading, error, refetch } = useAirtable('shipments');
  const { data: orders } = useAirtable('orders');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingShipment, setEditingShipment] = useState(null);
  const [formData, setFormData] = useState({
    commande: '',
    destinataire: '',
    adresse: '',
    transporteur: 'Chronopost',
    tracking_number: '',
    statut: 'Préparation',
    date_expedition: new Date().toISOString().split('T')[0],
    date_livraison: '',
    couts: 0
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingShipment) {
        await airtableService.updateShipment(editingShipment.id, { fields: formData });
      } else {
        await airtableService.createShipment({ fields: formData });
      }
      setShowAddForm(false);
      setEditingShipment(null);
      setFormData({
        commande: '',
        destinataire: '',
        adresse: '',
        transporteur: 'Chronopost',
        tracking_number: '',
        statut: 'Préparation',
        date_expedition: new Date().toISOString().split('T')[0],
        date_livraison: '',
        couts: 0
      });
      refetch();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleEdit = (shipment) => {
    setEditingShipment(shipment);
    setFormData(shipment.fields);
    setShowAddForm(true);
  };

  const handleDelete = async (shipmentId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet envoi ?')) {
      try {
        await airtableService.deleteShipment(shipmentId);
        refetch();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const handleInstallerChange = (installerName, installerData) => {
    setFormData({
      ...formData,
      destinataire: installerName
    });
  };

  const handleAddressChange = (address) => {
    setFormData({
      ...formData,
      adresse: address
    });
  };

  const statusColors = {
    'Préparation': 'bg-yellow-100 text-yellow-800',
    'En transit': 'bg-blue-100 text-blue-800',
    'Livré': 'bg-green-100 text-green-800',
    'Retour': 'bg-red-100 text-red-800'
  };

  const filteredShipments = shipments.filter(shipment => {
    const fields = shipment.fields;
    const matchesSearch = fields.destinataire?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shipment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fields.commande?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || fields.statut === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalShipments = shipments.length;
  const inTransitShipments = shipments.filter(s => s.fields.statut === 'En transit').length;
  const deliveredShipments = shipments.filter(s => s.fields.statut === 'Livré').length;
  const totalCosts = shipments.reduce((sum, s) => sum + (s.fields.couts || 0), 0);

  if (loading) return <div className="flex justify-center items-center h-64">Chargement...</div>;
  if (error) return <div className="text-red-600 text-center">Erreur: {error}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des envois</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nouvel envoi</span>
        </button>
      </div>

      {/* Shipment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total envois</p>
              <p className="text-2xl font-bold text-gray-900">{totalShipments}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En transit</p>
              <p className="text-2xl font-bold text-blue-600">{inTransitShipments}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Livrés</p>
              <p className="text-2xl font-bold text-green-600">{deliveredShipments}</p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <Truck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Coûts transport</p>
              <p className="text-2xl font-bold text-gray-900">{totalCosts.toLocaleString('fr-FR')} €</p>
            </div>
            <div className="p-3 rounded-full bg-gray-100">
              <Truck className="w-6 h-6 text-gray-600" />
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
                placeholder="Rechercher un envoi..."
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
              <option value="Préparation">Préparation</option>
              <option value="En transit">En transit</option>
              <option value="Livré">Livré</option>
              <option value="Retour">Retour</option>
            </select>
          </div>
        </div>
      </div>

      {/* Add Shipment Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {editingShipment ? 'Modifier l\'envoi' : 'Nouvel envoi'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Commande</label>
              <select 
                required
                value={formData.commande}
                onChange={(e) => setFormData({...formData, commande: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Sélectionner une commande</option>
                {orders.map(order => (
                  <option key={order.id} value={order.fields.id_commande || order.id}>
                    {order.fields.id_commande || order.id} - {order.fields.client}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Installateur destinataire</label>
              <InstallerAutocomplete
                value={formData.destinataire}
                onChange={handleInstallerChange}
                onAddressChange={handleAddressChange}
                placeholder="Rechercher un installateur..."
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse complète</label>
              <textarea
                required
                value={formData.adresse}
                onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={3}
                placeholder="Adresse complète de livraison"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transporteur</label>
              <select 
                required
                value={formData.transporteur}
                onChange={(e) => setFormData({...formData, transporteur: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="Chronopost">Chronopost</option>
                <option value="DHL">DHL</option>
                <option value="UPS">UPS</option>
                <option value="Colissimo">Colissimo</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de suivi</label>
              <input
                type="text"
                value={formData.tracking_number}
                onChange={(e) => setFormData({...formData, tracking_number: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Numéro de tracking"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date d'expédition</label>
              <input
                type="date"
                required
                value={formData.date_expedition}
                onChange={(e) => setFormData({...formData, date_expedition: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de livraison prévue</label>
              <input
                type="date"
                value={formData.date_livraison}
                onChange={(e) => setFormData({...formData, date_livraison: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coût transport (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.couts}
                onChange={(e) => setFormData({...formData, couts: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setEditingShipment(null);
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button 
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              {editingShipment ? 'Modifier' : 'Créer'} l'envoi
            </button>
            </div>
          </form>
        </div>
      )}

      {/* Shipments Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Envoi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Destinataire
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transporteur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tracking
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coût
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
              {filteredShipments.map((shipment) => (
                <tr key={shipment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{shipment.fields.id_envoi || shipment.id}</div>
                      <div className="text-sm text-gray-500">{shipment.fields.commande}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{shipment.fields.destinataire}</div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {shipment.fields.adresse}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {shipment.fields.transporteur}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {shipment.fields.tracking_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      <div>
                        <div>Exp: {new Date(shipment.fields.date_expedition).toLocaleDateString('fr-FR')}</div>
                        {shipment.fields.date_livraison && (
                          <div>Liv: {new Date(shipment.fields.date_livraison).toLocaleDateString('fr-FR')}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(shipment.fields.couts || 0).toLocaleString('fr-FR')} €
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[shipment.fields.statut] || 'bg-gray-100 text-gray-800'}`}>
                      {shipment.fields.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleEdit(shipment)}
                        className="text-green-600 hover:text-green-900"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(shipment.id)}
                        className="text-red-600 hover:text-red-900"
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
    </div>
  );
};

export default Shipments;
