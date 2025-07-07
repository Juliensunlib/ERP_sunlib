import React, { useState } from 'react';
import { Search, Filter, Download, Eye, Calendar, User, Package, CheckCircle } from 'lucide-react';
import { useAirtable } from '../hooks/useAirtable';

const InstallerReports = () => {
  const { data: reports, loading, error, refetch } = useAirtable('installer-reports');
  const { data: installers } = useAirtable('installers');
  const [searchTerm, setSearchTerm] = useState('');
  const [installerFilter, setInstallerFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);

  const filteredReports = reports.filter(report => {
    const fields = report.fields;
    const matchesSearch = fields.installateur?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fields.projet?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesInstaller = installerFilter === 'all' || fields.installateur === installerFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const reportDate = new Date(fields.date_reception);
      const today = new Date();
      const daysDiff = Math.floor((today - reportDate) / (1000 * 60 * 60 * 24));
      
      switch (dateFilter) {
        case 'week':
          matchesDate = daysDiff <= 7;
          break;
        case 'month':
          matchesDate = daysDiff <= 30;
          break;
        case 'quarter':
          matchesDate = daysDiff <= 90;
          break;
      }
    }
    
    return matchesSearch && matchesInstaller && matchesDate;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Vérifié':
        return 'bg-green-100 text-green-800';
      case 'En cours':
        return 'bg-yellow-100 text-yellow-800';
      case 'Problème':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const generateReport = (installerId) => {
    const installerReports = reports.filter(r => r.fields.installateur_id === installerId);
    const totalProducts = installerReports.reduce((sum, r) => sum + (r.fields.produits_recus?.length || 0), 0);
    const verifiedProducts = installerReports.filter(r => r.fields.statut === 'Vérifié').length;
    
    return {
      installerId,
      totalReports: installerReports.length,
      totalProducts,
      verifiedProducts,
      verificationRate: totalProducts > 0 ? (verifiedProducts / totalProducts * 100).toFixed(1) : 0
    };
  };

  if (loading) return <div className="flex justify-center items-center h-64">Chargement...</div>;
  if (error) return <div className="text-red-600 text-center">Erreur: {error}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Rapports Installateurs</h1>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 transition-colors">
          <Download className="w-5 h-5" />
          <span>Exporter</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total rapports</p>
              <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Installateurs actifs</p>
              <p className="text-2xl font-bold text-gray-900">{installers.length}</p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <User className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vérifications OK</p>
              <p className="text-2xl font-bold text-green-600">
                {reports.filter(r => r.fields.statut === 'Vérifié').length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taux de vérification</p>
              <p className="text-2xl font-bold text-gray-900">
                {reports.length > 0 ? 
                  ((reports.filter(r => r.fields.statut === 'Vérifié').length / reports.length) * 100).toFixed(1) 
                  : 0}%
              </p>
            </div>
            <div className="p-3 rounded-full bg-purple-100">
              <CheckCircle className="w-6 h-6 text-purple-600" />
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
                placeholder="Rechercher un installateur ou projet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={installerFilter}
              onChange={(e) => setInstallerFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">Tous les installateurs</option>
              {installers.map(installer => (
                <option key={installer.id} value={installer.fields.nom}>
                  {installer.fields.nom}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">Toutes les dates</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="quarter">Ce trimestre</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Installateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Projet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date réception
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produits reçus
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
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="p-2 rounded-full bg-green-100 mr-3">
                        <User className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {report.fields.installateur}
                        </div>
                        <div className="text-sm text-gray-500">
                          {report.fields.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {report.fields.projet}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(report.fields.date_reception).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {report.fields.produits_recus?.length || 0} produits
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.fields.statut)}`}>
                      {report.fields.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Détail du rapport</h3>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">Installateur</h4>
                <p className="text-gray-600">{selectedReport.fields.installateur}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Projet</h4>
                <p className="text-gray-600">{selectedReport.fields.projet}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Produits reçus</h4>
                <div className="space-y-2">
                  {selectedReport.fields.produits_recus?.map((produit, index) => (
                    <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                      <span>{produit.nom}</span>
                      <span className="text-sm text-gray-500">Qté: {produit.quantite}</span>
                    </div>
                  ))}
                </div>
              </div>
              {selectedReport.fields.commentaires && (
                <div>
                  <h4 className="font-medium text-gray-900">Commentaires</h4>
                  <p className="text-gray-600">{selectedReport.fields.commentaires}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstallerReports;