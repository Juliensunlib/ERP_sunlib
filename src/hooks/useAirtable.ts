import { useState, useEffect } from 'react';
import airtableService from '../services/airtableService';

export const useAirtable = (table: string) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        let result;
        
        switch (table) {
          case 'orders':
            result = await airtableService.getOrders();
            break;
          case 'products':
          case 'stock':
            result = await airtableService.getProducts();
            break;
          case 'costs':
            result = await airtableService.getCosts();
            break;
          case 'shipments':
            result = await airtableService.getShipments();
            break;
          case 'installers':
            result = await airtableService.getInstallers();
            break;
          case 'installer-reports':
            result = await airtableService.getInstallerReports();
            break;
          default:
            result = await airtableService.getData(table);
        }
        
        setData(result.records || []);
      } catch (err) {
        console.error(`Erreur lors du chargement de ${table}:`, err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [table]);

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      let result;
      
      switch (table) {
        case 'orders':
          result = await airtableService.getOrders();
          break;
        case 'products':
        case 'stock':
          result = await airtableService.getProducts();
          break;
        case 'costs':
          result = await airtableService.getCosts();
          break;
        case 'shipments':
          result = await airtableService.getShipments();
          break;
        case 'installers':
          result = await airtableService.getInstallers();
          break;
        case 'installer-reports':
          result = await airtableService.getInstallerReports();
          break;
        default:
          result = await airtableService.getData(table);
      }
      
      setData(result.records || []);
    } catch (err) {
      console.error(`Erreur lors du rechargement de ${table}:`, err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const create = async (fields: Record<string, any>) => {
    try {
      let result;
      switch (table) {
        case 'orders':
          result = await airtableService.createOrder({ fields });
          break;
        case 'products':
        case 'stock':
          result = await airtableService.createProduct({ fields });
          break;
        case 'costs':
          result = await airtableService.createCost({ fields });
          break;
        case 'shipments':
          result = await airtableService.createShipment({ fields });
          break;
        case 'installer-reports':
          result = await airtableService.createInstallerReport({ fields });
          break;
        default:
          throw new Error(`Création non supportée pour la table ${table}`);
      }
      await refetch();
      return result;
    } catch (err) {
      console.error(`Erreur lors de la création dans ${table}:`, err);
      throw err;
    }
  };

  const update = async (id: string, fields: Record<string, any>) => {
    try {
      let result;
      switch (table) {
        case 'orders':
          result = await airtableService.updateOrder(id, { fields });
          break;
        case 'products':
        case 'stock':
          result = await airtableService.updateProduct(id, { fields });
          break;
        case 'costs':
          result = await airtableService.updateCost(id, { fields });
          break;
        case 'shipments':
          result = await airtableService.updateShipment(id, { fields });
          break;
        case 'installer-reports':
          result = await airtableService.updateInstallerReport(id, { fields });
          break;
        default:
          throw new Error(`Mise à jour non supportée pour la table ${table}`);
      }
      await refetch();
      return result;
    } catch (err) {
      console.error(`Erreur lors de la mise à jour dans ${table}:`, err);
      throw err;
    }
  };

  const remove = async (id: string) => {
    try {
      let result;
      switch (table) {
        case 'orders':
          result = await airtableService.deleteOrder(id);
          break;
        case 'products':
        case 'stock':
          result = await airtableService.deleteProduct(id);
          break;
        case 'costs':
          result = await airtableService.deleteCost(id);
          break;
        case 'shipments':
          result = await airtableService.deleteShipment(id);
          break;
        default:
          throw new Error(`Suppression non supportée pour la table ${table}`);
      }
      await refetch();
      return result;
    } catch (err) {
      console.error(`Erreur lors de la suppression dans ${table}:`, err);
      throw err;
    }
  };

  return { 
    data, 
    loading, 
    error, 
    refetch, 
    create, 
    update, 
    remove 
  };
};