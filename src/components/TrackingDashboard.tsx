import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Clock, CheckCircle, AlertTriangle, RefreshCw, Eye } from 'lucide-react';
import { useAirtable } from '../hooks/useAirtable';
import trackingService from '../services/trackingService';

const TrackingDashboard = () => {
  const { data: shipments, loading, refetch } = useAirtable('shipments');
  const [trackingData, setTrackingData] = useState<Record<string, any>>({});
  const [updating, setUpdating] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [autoUpdate, setAutoUpdate] = useState(false);

  // Mise à jour automatique toutes les 30 minutes
  useEffect(() => {
    if (autoUpdate) {
      const interval = setInterval(() => {
        handleUpdateAll();
      }, 30 * 60 * 1000); // 30 minutes

      return () => clearInterval(interval);
    }
  }, [autoUpdate, shipments]);

  // Charger les données de tracking au montage
  useEffect(() => {
    if (shipments.length > 0) {
      loadTrackingData();
    }
  }, [shipments]);

  const loadTrackingData = async () => {
    const trackingPromises = shipments
      .filter(s => s.fields.tracking_number)
      .map(async (shipment) => {
        const tracking = await trackingService.trackShipment(
          shipment.fields.tracking_number,
          shipment.fields.transporteur
        );
        return { id: shipment.id, tracking };
      });

    const results = await Promise.all(trackingPromises);
    const trackingMap = results.reduce((acc, { id, tracking }) => {
      if (tracking) acc[id] = tracking;
      return acc;
    }, {});

    setTrackingData(trackingMap);
  };

  const handleUpdateAll = async () => {
    setUpdating(true);
    try {
      await trackingService.updateAllShipments(shipments);
      await loadTrackingData();
      await refetch();
    } catch (error) {
      console.error('Erreur mise à jour:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleTrackSingle = async (shipment: any) => {
    if (!shipment.fields.tracking_number) return;

    const tracking = await trackingService.trackShipment(
      shipment.fields.tracking_number,
      shipment.fields.transporteur
    );

    if (tracking) {
      setTrackingData(prev => ({
        ...prev,
        [shipment.id]: tracking
      }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Livré':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'En transit':
      case 'En cours de livraison':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Collecté':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Problème':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Livré':
        return <CheckCircle className="w-4 h-4" />;
      case 'En transit':
      case 'En cours de livraison':
        return <Truck className="w-4 h-4" />;
      case 'Problème':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const activeShipments = shipments.filter(s => 
    s.fields.tracking_number && 
    s.fields.statut !== 'Livré'
  );

  const deliveredShipments = shipments.filter(s => s.fields.statut === 'Livré');
  const inTransitShipments = shipments.filter(s => 
    s.fields.statut === 'En transit' || s.fields.statut === 'En cours de livraison'
  );

  if (loading) return <div className="flex justify-center items-center h-64">Chargement...</div>;

  return (
    <div className="space-y-6">
      {/* Header avec contrôles */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Suivi des livraisons</h1>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoUpdate}
              onChange={(e) => setAutoUpdate(e.target.checked)}
              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="text-sm text-gray-600">Mise à jour auto</span>
          </label>
          <button
            onClick={handleUpdateAll}
            disabled={updating}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${updating ? 'animate-spin' : ''}`} />
            <span>{updating ? 'Mise à jour...' : 'Actualiser tout'}</span>
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Envois actifs</p>
              <p className="text-2xl font-bold text-gray-900">{activeShipments.length}</p>
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
              <p className="text-2xl font-bold text-blue-600">{inTransitShipments.length}</p>
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
              <p className="text-2xl font-bold text-green-600">{deliveredShipments.length}</p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taux de livraison</p>
              <p className="text-2xl font-bold text-gray-900">
                {shipments.length > 0 ? 
                  Math.round((deliveredShipments.length / shipments.length) * 100) : 0}%
              </p>
            </div>
            <div className="p-3 rounded-full bg-purple-100">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Liste des envois avec tracking */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Suivi en temps réel</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {activeShipments.map((shipment) => {
            const tracking = trackingData[shipment.id];
            return (
              <div key={shipment.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="p-2 rounded-full bg-blue-100">
                          <Truck className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            {shipment.fields.tracking_number}
                          </h3>
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(tracking?.status || shipment.fields.statut)}`}>
                            {getStatusIcon(tracking?.status || shipment.fields.statut)}
                            <span className="ml-1">{tracking?.status || shipment.fields.statut}</span>
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-4">
                            <span>📦 {shipment.fields.destinataire}</span>
                            <span>🚚 {shipment.fields.transporteur}</span>
                            <span>📅 {new Date(shipment.fields.date_expedition).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                        {tracking?.events && tracking.events.length > 0 && (
                          <div className="mt-2 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-3 h-3" />
                              <span>{tracking.events[tracking.events.length - 1].description}</span>
                              <span className="text-xs">
                                ({new Date(tracking.events[tracking.events.length - 1].timestamp).toLocaleString('fr-FR')})
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleTrackSingle(shipment)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Actualiser le suivi"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSelectedShipment(shipment)}
                      className="text-green-600 hover:text-green-900"
                      title="Voir les détails"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Barre de progression */}
                {tracking && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Collecté</span>
                      <span>En transit</span>
                      <span>En livraison</span>
                      <span>Livré</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: tracking.status === 'Livré' ? '100%' :
                                 tracking.status === 'En cours de livraison' ? '75%' :
                                 tracking.status === 'En transit' ? '50%' :
                                 tracking.status === 'Collecté' ? '25%' : '10%'
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de détails */}
      {selectedShipment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Détail du suivi - {selectedShipment.fields.tracking_number}
              </h3>
              <button
                onClick={() => setSelectedShipment(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            {trackingData[selectedShipment.id]?.events && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Historique des événements</h4>
                <div className="space-y-3">
                  {trackingData[selectedShipment.id].events.map((event, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 mt-1">
                        {getStatusIcon(event.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{event.status}</span>
                          <span className="text-sm text-gray-500">
                            {new Date(event.timestamp).toLocaleString('fr-FR')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                        {event.location && (
                          <div className="flex items-center space-x-1 mt-1 text-xs text-gray-500">
                            <MapPin className="w-3 h-3" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackingDashboard;
