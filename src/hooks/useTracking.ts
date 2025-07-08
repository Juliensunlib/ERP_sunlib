import { useState, useEffect } from 'react';
import trackingService from '../services/trackingService';

export const useTracking = (trackingNumber: string, carrier: string) => {
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTracking = async () => {
      if (!trackingNumber || !carrier) {
        setTrackingData(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await trackingService.trackShipment(trackingNumber, carrier);
        setTrackingData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de tracking');
        setTrackingData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTracking();
  }, [trackingNumber, carrier]);

  const refetch = async () => {
    if (!trackingNumber || !carrier) return;

    setLoading(true);
    setError(null);

    try {
      const data = await trackingService.trackShipment(trackingNumber, carrier);
      setTrackingData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de tracking');
      setTrackingData(null);
    } finally {
      setLoading(false);
    }
  };

  return { trackingData, loading, error, refetch };
};

// Hook pour la mise à jour automatique
export const useAutoTracking = (shipments: any[], intervalMinutes: number = 30) => {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (shipments.length === 0) return;

    const updateAll = async () => {
      setUpdating(true);
      try {
        await trackingService.updateAllShipments(shipments);
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Erreur mise à jour automatique:', error);
      } finally {
        setUpdating(false);
      }
    };

    // Mise à jour immédiate
    updateAll();

    // Puis mise à jour périodique
    const interval = setInterval(updateAll, intervalMinutes * 60 * 1000);

    return () => clearInterval(interval);
  }, [shipments, intervalMinutes]);

  return { lastUpdate, updating };
};
