import React from 'react';
import { TrendingUp, TrendingDown, Package, ShoppingCart, DollarSign, Truck, AlertTriangle } from 'lucide-react';

const Dashboard = () => {
  const stats = [
    {
      title: 'Commandes du mois',
      value: '152',
      change: '+12%',
      trend: 'up',
      icon: ShoppingCart,
      color: 'text-green-600'
    },
    {
      title: 'Chiffre d\'affaires',
      value: '34 567 €',
      change: '+8%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Articles en stock',
      value: '1 247',
      change: '-3%',
      trend: 'down',
      icon: Package,
      color: 'text-orange-600'
    },
    {
      title: 'Expéditions',
      value: '89',
      change: '+15%',
      trend: 'up',
      icon: Truck,
      color: 'text-green-600'
    }
  ];

  const recentOrders = [
    { id: 'CMD-001', client: 'Entreprise ABC', montant: '1 250 €', statut: 'En cours' },
    { id: 'CMD-002', client: 'Société XYZ', montant: '875 €', statut: 'Expédié' },
    { id: 'CMD-003', client: 'Client Premium', montant: '2 100 €', statut: 'Livré' },
    { id: 'CMD-004', client: 'Nouveau Client', montant: '450 €', statut: 'En préparation' }
  ];

  const lowStockItems = [
    { nom: 'Produit A', stock: 5, seuil: 10 },
    { nom: 'Produit B', stock: 2, seuil: 15 },
    { nom: 'Produit C', stock: 8, seuil: 20 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <div className="text-sm text-gray-500">
          Dernière mise à jour: {new Date().toLocaleDateString('fr-FR')}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full bg-green-100 ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                {stat.trend === 'up' ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className={`ml-2 text-sm font-medium ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
                <span className="ml-2 text-sm text-gray-500">vs mois dernier</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Commandes récentes</h2>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">{order.id}</p>
                  <p className="text-sm text-gray-600">{order.client}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{order.montant}</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    order.statut === 'Livré' ? 'bg-green-100 text-green-800' :
                    order.statut === 'Expédié' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.statut}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Stock faible</h2>
          </div>
          <div className="space-y-4">
            {lowStockItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">{item.nom}</p>
                  <p className="text-sm text-gray-600">Seuil: {item.seuil}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-orange-600">{item.stock} restant</p>
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full"
                      style={{ width: `${(item.stock / item.seuil) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;