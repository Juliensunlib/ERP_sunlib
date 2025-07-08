import React from 'react';
import { TrendingUp, TrendingDown, Package, ShoppingCart, DollarSign, Truck, AlertTriangle, User } from 'lucide-react';
import { useAirtable } from '../hooks/useAirtable';

const Dashboard = () => {
  const { data: orders, loading: ordersLoading } = useAirtable('orders');
  const { data: products, loading: productsLoading } = useAirtable('products');
  const { data: costs, loading: costsLoading } = useAirtable('costs');
  const { data: shipments, loading: shipmentsLoading } = useAirtable('shipments');

  const loading = ordersLoading || productsLoading || costsLoading || shipmentsLoading;

  // Calculs des statistiques réelles
  const totalOrders = orders.length;
  const ordersThisMonth = orders.filter(order => {
    const orderDate = new Date(order.fields.date);
    const now = new Date();
    return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
  }).length;

  const totalRevenue = orders.reduce((sum, order) => sum + (order.fields.montant || 0), 0);
  const revenueThisMonth = orders.filter(order => {
    const orderDate = new Date(order.fields.date);
    const now = new Date();
    return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
  }).reduce((sum, order) => sum + (order.fields.montant || 0), 0);

  const totalStock = products.reduce((sum, product) => sum + (product.fields.stock || 0), 0);
  const lowStockItems = products.filter(product => 
    (product.fields.stock || 0) <= (product.fields.seuil || 0)
  );

  const totalShipments = shipments.length;
  const shipmentsThisMonth = shipments.filter(shipment => {
    const shipmentDate = new Date(shipment.fields.date_expedition);
    const now = new Date();
    return shipmentDate.getMonth() === now.getMonth() && shipmentDate.getFullYear() === now.getFullYear();
  }).length;

  // Commandes récentes (5 dernières)
  const recentOrders = orders
    .sort((a, b) => new Date(b.fields.date).getTime() - new Date(a.fields.date).getTime())
    .slice(0, 5);

  // Produits en stock faible (5 premiers)
  const lowStockProducts = lowStockItems.slice(0, 5);

  const stats = [
    {
      title: 'Commandes ce mois',
      value: ordersThisMonth.toString(),
      total: `Total: ${totalOrders}`,
      change: totalOrders > 0 ? `${((ordersThisMonth / totalOrders) * 100).toFixed(1)}%` : '0%',
      trend: 'up',
      icon: ShoppingCart,
      color: 'text-green-600'
    },
    {
      title: 'CA ce mois',
      value: `${revenueThisMonth.toLocaleString('fr-FR')} €`,
      total: `Total: ${totalRevenue.toLocaleString('fr-FR')} €`,
      change: totalRevenue > 0 ? `${((revenueThisMonth / totalRevenue) * 100).toFixed(1)}%` : '0%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Articles en stock',
      value: totalStock.toString(),
      total: `${products.length} produits`,
      change: lowStockItems.length > 0 ? `${lowStockItems.length} alertes` : 'Stock OK',
      trend: lowStockItems.length > 0 ? 'down' : 'up',
      icon: Package,
      color: lowStockItems.length > 0 ? 'text-orange-600' : 'text-green-600'
    },
    {
      title: 'Expéditions ce mois',
      value: shipmentsThisMonth.toString(),
      total: `Total: ${totalShipments}`,
      change: totalShipments > 0 ? `${((shipmentsThisMonth / totalShipments) * 100).toFixed(1)}%` : '0%',
      trend: 'up',
      icon: Truck,
      color: 'text-green-600'
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Chargement du tableau de bord...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <div className="text-sm text-gray-500">
          Dernière mise à jour: {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
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
                  <p className="text-xs text-gray-500 mt-1">{stat.total}</p>
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
                <span className="ml-2 text-sm text-gray-500">du total</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Commandes récentes</h2>
          {recentOrders.length > 0 ? (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-green-100">
                      <ShoppingCart className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{order.fields.id_commande || order.id}</p>
                      <p className="text-sm text-gray-600">{order.fields.client}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.fields.date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {(order.fields.montant || 0).toLocaleString('fr-FR')} €
                    </p>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      order.fields.statut === 'Livré' ? 'bg-green-100 text-green-800' :
                      order.fields.statut === 'Expédié' ? 'bg-blue-100 text-blue-800' :
                      order.fields.statut === 'En cours' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {order.fields.statut}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Aucune commande récente</p>
            </div>
          )}
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Alertes stock</h2>
            {lowStockItems.length > 0 && (
              <span className="ml-2 bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                {lowStockItems.length}
              </span>
            )}
          </div>
          {lowStockProducts.length > 0 ? (
            <div className="space-y-4">
              {lowStockProducts.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-orange-100">
                      <Package className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.fields.nom}</p>
                      <p className="text-sm text-gray-600">
                        Catégorie: {item.fields.categorie}
                      </p>
                      <p className="text-xs text-gray-500">
                        Seuil: {item.fields.seuil || 0}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-orange-600">
                      {item.fields.stock || 0} restant
                    </p>
                    <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-orange-500 h-2 rounded-full"
                        style={{ 
                          width: `${Math.min(((item.fields.stock || 0) / (item.fields.seuil || 1)) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
              {lowStockItems.length > 5 && (
                <div className="text-center pt-2">
                  <p className="text-sm text-gray-500">
                    Et {lowStockItems.length - 5} autre(s) produit(s) en stock faible
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Aucune alerte de stock</p>
              <p className="text-sm">Tous les produits sont bien approvisionnés</p>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Coûts totaux</p>
              <p className="text-2xl font-bold text-gray-900">
                {costs.reduce((sum, cost) => sum + (cost.fields.montant || 0), 0).toLocaleString('fr-FR')} €
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {costs.filter(c => c.fields.statut === 'En attente').length} en attente
              </p>
            </div>
            <div className="p-3 rounded-full bg-red-100">
              <DollarSign className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Produits référencés</p>
              <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              <p className="text-xs text-gray-500 mt-1">
                {products.filter(p => (p.fields.stock || 0) > 0).length} en stock
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Envois en cours</p>
              <p className="text-2xl font-bold text-gray-900">
                {shipments.filter(s => s.fields.statut === 'En transit' || s.fields.statut === 'Préparation').length}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {shipments.filter(s => s.fields.statut === 'Livré').length} livrés
              </p>
            </div>
            <div className="p-3 rounded-full bg-purple-100">
              <Truck className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
