// Service pour l'intégration avec Airtable
const AIRTABLE_API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID;
const AIRTABLE_API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

interface AirtableRecord {
  id?: string;
  fields: Record<string, any>;
}

interface AirtableResponse {
  records: AirtableRecord[];
  offset?: string;
}

class AirtableService {
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      throw new Error('Configuration Airtable manquante. Vérifiez vos variables d\'environnement.');
    }

    const response = await fetch(`${AIRTABLE_API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Erreur Airtable (${response.status}): ${errorData.error?.message || response.statusText}`);
    }

    return response.json();
  }

  // Clients
  async getClients(): Promise<AirtableResponse> {
    return this.makeRequest('/Clients?sort[0][field]=entreprise&sort[0][direction]=asc');
  }

  async searchClients(searchTerm: string): Promise<AirtableResponse> {
    const encodedSearch = encodeURIComponent(searchTerm);
    const formula = `OR(FIND(LOWER("${encodedSearch}"), LOWER({nom})), FIND(LOWER("${encodedSearch}"), LOWER({entreprise})), FIND(LOWER("${encodedSearch}"), LOWER({email})))`;
    return this.makeRequest(`/Clients?filterByFormula=${encodeURIComponent(formula)}&maxRecords=10`);
  }

  // Nouvelle méthode pour rechercher prioritairement par entreprise
  async searchClientsByCompany(searchTerm: string): Promise<AirtableResponse> {
    const encodedSearch = encodeURIComponent(searchTerm);
    // Priorité sur l'entreprise, puis nom, puis email
    const formula = `OR(FIND(LOWER("${encodedSearch}"), LOWER({entreprise})), FIND(LOWER("${encodedSearch}"), LOWER({nom})), FIND(LOWER("${encodedSearch}"), LOWER({email})))`;
    return this.makeRequest(`/Clients?filterByFormula=${encodeURIComponent(formula)}&sort[0][field]=entreprise&sort[0][direction]=asc&maxRecords=10`);
  }

  async createClient(client: AirtableRecord): Promise<AirtableRecord> {
    return this.makeRequest('/Clients', {
      method: 'POST',
      body: JSON.stringify({ fields: client.fields }),
    });
  }

  async updateClient(id: string, client: AirtableRecord): Promise<AirtableRecord> {
    return this.makeRequest(`/Clients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ fields: client.fields }),
    });
  }

  // Commandes
  async getOrders(): Promise<AirtableResponse> {
    return this.makeRequest('/Commandes?sort[0][field]=date&sort[0][direction]=desc');
  }

  async createOrder(order: AirtableRecord): Promise<AirtableRecord> {
    return this.makeRequest('/Commandes', {
      method: 'POST',
      body: JSON.stringify({ fields: order.fields }),
    });
  }

  async updateOrder(id: string, order: AirtableRecord): Promise<AirtableRecord> {
    return this.makeRequest(`/Commandes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ fields: order.fields }),
    });
  }

  async deleteOrder(id: string): Promise<{ deleted: boolean; id: string }> {
    return this.makeRequest(`/Commandes/${id}`, {
      method: 'DELETE',
    });
  }

  // Produits (Stock)
  async getProducts(): Promise<AirtableResponse> {
    return this.makeRequest('/Produits?sort[0][field]=nom&sort[0][direction]=asc');
  }

  async createProduct(product: AirtableRecord): Promise<AirtableRecord> {
    return this.makeRequest('/Produits', {
      method: 'POST',
      body: JSON.stringify({ fields: product.fields }),
    });
  }

  async updateProduct(id: string, product: AirtableRecord): Promise<AirtableRecord> {
    return this.makeRequest(`/Produits/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ fields: product.fields }),
    });
  }

  async deleteProduct(id: string): Promise<{ deleted: boolean; id: string }> {
    return this.makeRequest(`/Produits/${id}`, {
      method: 'DELETE',
    });
  }

  // Coûts
  async getCosts(): Promise<AirtableResponse> {
    return this.makeRequest('/Couts?sort[0][field]=date&sort[0][direction]=desc');
  }

  async createCost(cost: AirtableRecord): Promise<AirtableRecord> {
    return this.makeRequest('/Couts', {
      method: 'POST',
      body: JSON.stringify({ fields: cost.fields }),
    });
  }

  async updateCost(id: string, cost: AirtableRecord): Promise<AirtableRecord> {
    return this.makeRequest(`/Couts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ fields: cost.fields }),
    });
  }

  async deleteCost(id: string): Promise<{ deleted: boolean; id: string }> {
    return this.makeRequest(`/Couts/${id}`, {
      method: 'DELETE',
    });
  }

  // Envois
  async getShipments(): Promise<AirtableResponse> {
    return this.makeRequest('/Envois?sort[0][field]=date_expedition&sort[0][direction]=desc');
  }

  async createShipment(shipment: AirtableRecord): Promise<AirtableRecord> {
    return this.makeRequest('/Envois', {
      method: 'POST',
      body: JSON.stringify({ fields: shipment.fields }),
    });
  }

  async updateShipment(id: string, shipment: AirtableRecord): Promise<AirtableRecord> {
    return this.makeRequest(`/Envois/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ fields: shipment.fields }),
    });
  }

  async deleteShipment(id: string): Promise<{ deleted: boolean; id: string }> {
    return this.makeRequest(`/Envois/${id}`, {
      method: 'DELETE',
    });
  }

  // Installateurs
  async getInstallers(): Promise<AirtableResponse> {
    return this.makeRequest('/Installateurs?sort[0][field]=nom&sort[0][direction]=asc');
  }

  async createInstaller(installer: AirtableRecord): Promise<AirtableRecord> {
    return this.makeRequest('/Installateurs', {
      method: 'POST',
      body: JSON.stringify({ fields: installer.fields }),
    });
  }

  // Rapports Installateurs
  async getInstallerReports(): Promise<AirtableResponse> {
    return this.makeRequest('/Rapports_Installateurs?sort[0][field]=date_reception&sort[0][direction]=desc');
  }

  async createInstallerReport(report: AirtableRecord): Promise<AirtableRecord> {
    return this.makeRequest('/Rapports_Installateurs', {
      method: 'POST',
      body: JSON.stringify({ fields: report.fields }),
    });
  }

  async updateInstallerReport(id: string, report: AirtableRecord): Promise<AirtableRecord> {
    return this.makeRequest(`/Rapports_Installateurs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ fields: report.fields }),
    });
  }

  // Méthode générique pour récupérer des données
  async getData(tableName: string): Promise<AirtableResponse> {
    return this.makeRequest(`/${tableName}`);
  }

  // Vérification de la connexion
  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('/Produits?maxRecords=1');
      return true;
    } catch (error) {
      console.error('Test de connexion Airtable échoué:', error);
      return false;
    }
  }
}

export const airtableService = new AirtableService();
export default airtableService;