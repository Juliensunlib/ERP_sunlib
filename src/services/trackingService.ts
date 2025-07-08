// Service de tracking automatique pour les transporteurs
interface TrackingStatus {
  status: string;
  location?: string;
  timestamp: string;
  description: string;
}

interface TrackingResponse {
  trackingNumber: string;
  carrier: string;
  status: string;
  events: TrackingStatus[];
  estimatedDelivery?: string;
  lastUpdate: string;
}

class TrackingService {
  private readonly API_ENDPOINTS = {
    chronopost: 'https://www.chronopost.fr/tracking-cxf/TrackingServiceWS/trackSkybillV2',
    colissimo: 'https://api.laposte.fr/suivi/v2/idships',
    // APIs gratuites disponibles
    trackingmore: 'https://api.trackingmore.com/v2/trackings',
    aftership: 'https://api.aftership.com/v4/trackings'
  };

  // Mapping des statuts vers notre système
  private readonly STATUS_MAPPING = {
    // Statuts génériques
    'in_transit': 'En transit',
    'delivered': 'Livré',
    'out_for_delivery': 'En cours de livraison',
    'exception': 'Problème',
    'pending': 'Préparation',
    'info_received': 'Préparation',
    'pickup': 'Collecté',
    
    // Chronopost
    'CHRONOPOST_DELIVERED': 'Livré',
    'CHRONOPOST_IN_TRANSIT': 'En transit',
    'CHRONOPOST_OUT_FOR_DELIVERY': 'En cours de livraison',
    
    // Colissimo
    'COLISSIMO_DELIVERED': 'Livré',
    'COLISSIMO_IN_TRANSIT': 'En transit',
    'COLISSIMO_PICKUP': 'Collecté',
    
    // DHL
    'DHL_DELIVERED': 'Livré',
    'DHL_IN_TRANSIT': 'En transit',
    'DHL_WITH_DELIVERY_COURIER': 'En cours de livraison',
    
    // UPS
    'UPS_DELIVERED': 'Livré',
    'UPS_IN_TRANSIT': 'En transit',
    'UPS_OUT_FOR_DELIVERY': 'En cours de livraison'
  };

  // Tracking Chronopost (API gratuite limitée)
  async trackChronopost(trackingNumber: string): Promise<TrackingResponse | null> {
    try {
      // Simulation d'appel API Chronopost
      // En réalité, vous devrez vous inscrire sur leur portail développeur
      const mockResponse = {
        trackingNumber,
        carrier: 'Chronopost',
        status: 'En transit',
        events: [
          {
            status: 'Collecté',
            location: 'Centre de tri Paris',
            timestamp: new Date().toISOString(),
            description: 'Colis collecté'
          }
        ],
        lastUpdate: new Date().toISOString()
      };
      
      return mockResponse;
    } catch (error) {
      console.error('Erreur tracking Chronopost:', error);
      return null;
    }
  }

  // Tracking Colissimo (API La Poste)
  async trackColissimo(trackingNumber: string): Promise<TrackingResponse | null> {
    try {
      // Vous devez obtenir une clé API gratuite sur developer.laposte.fr
      const API_KEY = import.meta.env.VITE_LAPOSTE_API_KEY;
      
      if (!API_KEY) {
        console.warn('Clé API La Poste manquante');
        return this.getMockTracking(trackingNumber, 'Colissimo');
      }

      const response = await fetch(`${this.API_ENDPOINTS.colissimo}/${trackingNumber}`, {
        headers: {
          'X-Okapi-Key': API_KEY,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur API Colissimo: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        trackingNumber,
        carrier: 'Colissimo',
        status: this.mapStatus(data.shipment?.event?.[0]?.code),
        events: data.shipment?.event?.map((event: any) => ({
          status: this.mapStatus(event.code),
          location: event.site,
          timestamp: event.date,
          description: event.label
        })) || [],
        lastUpdate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erreur tracking Colissimo:', error);
      return this.getMockTracking(trackingNumber, 'Colissimo');
    }
  }

  // Service de tracking générique (TrackingMore - gratuit avec limite)
  async trackGeneric(trackingNumber: string, carrier: string): Promise<TrackingResponse | null> {
    try {
      // TrackingMore offre 100 requêtes gratuites par mois
      const API_KEY = import.meta.env.VITE_TRACKINGMORE_API_KEY;
      
      if (!API_KEY) {
        console.warn('Clé API TrackingMore manquante');
        return this.getMockTracking(trackingNumber, carrier);
      }

      const carrierCode = this.getCarrierCode(carrier);
      
      const response = await fetch(`${this.API_ENDPOINTS.trackingmore}/${carrierCode}/${trackingNumber}`, {
        headers: {
          'Tracking-Api-Key': API_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur API TrackingMore: ${response.status}`);
      }

      const data = await response.json();
      const tracking = data.data;
      
      return {
        trackingNumber,
        carrier,
        status: this.mapStatus(tracking.tag),
        events: tracking.checkpoints?.map((checkpoint: any) => ({
          status: this.mapStatus(checkpoint.tag),
          location: checkpoint.location,
          timestamp: checkpoint.checkpoint_time,
          description: checkpoint.message
        })) || [],
        estimatedDelivery: tracking.expected_delivery,
        lastUpdate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erreur tracking générique:', error);
      return this.getMockTracking(trackingNumber, carrier);
    }
  }

  // Méthode principale de tracking
  async trackShipment(trackingNumber: string, carrier: string): Promise<TrackingResponse | null> {
    if (!trackingNumber || !carrier) {
      return null;
    }

    try {
      switch (carrier.toLowerCase()) {
        case 'chronopost':
          return await this.trackChronopost(trackingNumber);
        case 'colissimo':
          return await this.trackColissimo(trackingNumber);
        case 'dhl':
        case 'ups':
        case 'fedex':
          return await this.trackGeneric(trackingNumber, carrier);
        default:
          return await this.trackGeneric(trackingNumber, carrier);
      }
    } catch (error) {
      console.error(`Erreur tracking ${carrier}:`, error);
      return this.getMockTracking(trackingNumber, carrier);
    }
  }

  // Mise à jour automatique de tous les envois
  async updateAllShipments(shipments: any[]): Promise<void> {
    console.log('🔄 Mise à jour automatique des statuts de livraison...');
    
    const activeShipments = shipments.filter(s => 
      s.fields.tracking_number && 
      s.fields.statut !== 'Livré' && 
      s.fields.statut !== 'Retour'
    );

    for (const shipment of activeShipments) {
      try {
        const trackingInfo = await this.trackShipment(
          shipment.fields.tracking_number,
          shipment.fields.transporteur
        );

        if (trackingInfo && trackingInfo.status !== shipment.fields.statut) {
          console.log(`📦 Mise à jour ${shipment.fields.tracking_number}: ${shipment.fields.statut} → ${trackingInfo.status}`);
          
          // Ici vous pouvez appeler votre service Airtable pour mettre à jour
          // await airtableService.updateShipment(shipment.id, {
          //   fields: { statut: trackingInfo.status }
          // });
        }
      } catch (error) {
        console.error(`Erreur mise à jour ${shipment.fields.tracking_number}:`, error);
      }
      
      // Délai pour éviter de surcharger les APIs
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('✅ Mise à jour automatique terminée');
  }

  // Mapping des transporteurs vers codes API
  private getCarrierCode(carrier: string): string {
    const mapping: Record<string, string> = {
      'chronopost': 'chronopost',
      'colissimo': 'colissimo',
      'dhl': 'dhl',
      'ups': 'ups',
      'fedex': 'fedex',
      'tnt': 'tnt',
      'gls': 'gls'
    };
    
    return mapping[carrier.toLowerCase()] || 'other';
  }

  // Mapping des statuts
  private mapStatus(apiStatus: string): string {
    if (!apiStatus) return 'Préparation';
    
    const status = apiStatus.toLowerCase();
    
    // Recherche directe
    if (this.STATUS_MAPPING[status]) {
      return this.STATUS_MAPPING[status];
    }
    
    // Recherche par mots-clés
    if (status.includes('deliver')) return 'Livré';
    if (status.includes('transit') || status.includes('transport')) return 'En transit';
    if (status.includes('pickup') || status.includes('collect')) return 'Collecté';
    if (status.includes('exception') || status.includes('problem')) return 'Problème';
    if (status.includes('out_for_delivery')) return 'En cours de livraison';
    
    return 'En transit';
  }

  // Données de test pour le développement
  private getMockTracking(trackingNumber: string, carrier: string): TrackingResponse {
    const statuses = ['Préparation', 'Collecté', 'En transit', 'En cours de livraison', 'Livré'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      trackingNumber,
      carrier,
      status: randomStatus,
      events: [
        {
          status: 'Collecté',
          location: 'Centre de tri',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          description: 'Colis collecté par le transporteur'
        },
        {
          status: randomStatus,
          location: 'En cours de livraison',
          timestamp: new Date().toISOString(),
          description: `Statut actuel: ${randomStatus}`
        }
      ],
      estimatedDelivery: new Date(Date.now() + 86400000).toISOString(),
      lastUpdate: new Date().toISOString()
    };
  }

  // Vérification de la validité d'un numéro de tracking
  isValidTrackingNumber(trackingNumber: string, carrier: string): boolean {
    if (!trackingNumber) return false;
    
    const patterns: Record<string, RegExp> = {
      chronopost: /^[A-Z]{2}\d{9}[A-Z]{2}$/,
      colissimo: /^[A-Z]{2}\d{9}[A-Z]{2}$/,
      dhl: /^\d{10,11}$/,
      ups: /^1Z[A-Z0-9]{16}$/,
      fedex: /^\d{12,14}$/
    };
    
    const pattern = patterns[carrier.toLowerCase()];
    return pattern ? pattern.test(trackingNumber) : trackingNumber.length >= 8;
  }

  // Estimation de la date de livraison
  estimateDeliveryDate(carrier: string, expeditionDate: string): string {
    const expedition = new Date(expeditionDate);
    const deliveryDays: Record<string, number> = {
      chronopost: 1, // Express
      colissimo: 2,  // Standard
      dhl: 1,        // Express
      ups: 2,        // Standard
      fedex: 1       // Express
    };
    
    const days = deliveryDays[carrier.toLowerCase()] || 3;
    const delivery = new Date(expedition);
    delivery.setDate(delivery.getDate() + days);
    
    return delivery.toISOString().split('T')[0];
  }
}

export const trackingService = new TrackingService();
export default trackingService;
