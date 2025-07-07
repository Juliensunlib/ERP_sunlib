import React, { useState } from 'react';
import { Package, ShoppingCart, DollarSign, Truck, BarChart3, Plus, Search, Filter, Settings, Users, FileText } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Orders from './components/Orders';
import Stock from './components/Stock';
import Costs from './components/Costs';
import Shipments from './components/Shipments';
import ProductManagement from './components/ProductManagement';
import InstallerReports from './components/InstallerReports';

function App() {
  const [activeModule, setActiveModule] = useState('dashboard');

  const modules = [
    { id: 'dashboard', name: 'Tableau de bord', icon: BarChart3 },
    { id: 'orders', name: 'Commandes', icon: ShoppingCart },
    { id: 'products', name: 'Gestion Produits', icon: Settings },
    { id: 'stock', name: 'Stock', icon: Package },
    { id: 'costs', name: 'Coûts', icon: DollarSign },
    { id: 'shipments', name: 'Envois', icon: Truck },
    { id: 'installer-reports', name: 'Rapports Installateurs', icon: FileText },
  ];

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard />;
      case 'orders':
        return <Orders />;
      case 'products':
        return <ProductManagement />;
      case 'stock':
        return <Stock />;
      case 'costs':
        return <Costs />;
      case 'shipments':
        return <Shipments />;
      case 'installer-reports':
        return <InstallerReports />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-green-600 text-white shadow-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Package className="w-8 h-8" />
              <h1 className="text-2xl font-bold">SunLib ERP</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-green-100">Système de gestion complet</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white shadow-lg min-h-screen">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Modules</h2>
            <ul className="space-y-2">
              {modules.map((module) => {
                const Icon = module.icon;
                return (
                  <li key={module.id}>
                    <button
                      onClick={() => setActiveModule(module.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        activeModule === module.id
                          ? 'bg-green-100 text-green-800 border-l-4 border-green-600'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{module.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {renderModule()}
        </main>
      </div>
    </div>
  );
}

export default App;