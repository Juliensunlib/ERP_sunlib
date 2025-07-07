import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, User, Building, Mail, Phone } from 'lucide-react';
import airtableService from '../services/airtableService';

interface Client {
  id: string;
  fields: {
    nom: string;
    entreprise?: string;
    email?: string;
    telephone?: string;
    adresse?: string;
    type?: string;
  };
}

interface ClientAutocompleteProps {
  value: string;
  onChange: (value: string, client?: Client) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

const ClientAutocomplete: React.FC<ClientAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Rechercher une entreprise...",
  required = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newClient, setNewClient] = useState({
    nom: '',
    entreprise: '',
    email: '',
    telephone: '',
    adresse: '',
    type: 'Entreprise'
  });
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Recherche de clients avec debounce - priorité sur l'entreprise
  useEffect(() => {
    const searchClients = async () => {
      if (value.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const response = await airtableService.searchClientsByCompany(value);
        setSuggestions(response.records || []);
      } catch (error) {
        console.error('Erreur lors de la recherche de clients:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchClients, 300);
    return () => clearTimeout(timeoutId);
  }, [value]);

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(true);
  };

  const handleClientSelect = (client: Client) => {
    const companyName = client.fields.entreprise || client.fields.nom;
    onChange(companyName, client);
    setIsOpen(false);
  };

  const handleAddNewClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await airtableService.createClient({ fields: newClient });
      const companyName = newClient.entreprise || newClient.nom;
      onChange(companyName, response);
      setShowAddForm(false);
      setIsOpen(false);
      setNewClient({
        nom: '',
        entreprise: '',
        email: '',
        telephone: '',
        adresse: '',
        type: 'Entreprise'
      });
    } catch (error) {
      console.error('Erreur lors de la création du client:', error);
    }
  };

  const getClientDisplayName = (client: Client) => {
    return client.fields.entreprise || client.fields.nom;
  };

  const getClientSubtitle = (client: Client) => {
    if (client.fields.entreprise && client.fields.nom) {
      return `Contact: ${client.fields.nom}`;
    }
    return client.fields.email || client.fields.telephone || '';
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          required={required}
          className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${className}`}
        />
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto"
        >
          {loading && (
            <div className="p-3 text-center text-gray-500">
              Recherche en cours...
            </div>
          )}

          {!loading && suggestions.length === 0 && value.length >= 2 && (
            <div className="p-3">
              <div className="text-gray-500 text-center mb-2">
                Aucune entreprise trouvée pour "{value}"
              </div>
              <button
                onClick={() => {
                  setShowAddForm(true);
                  setNewClient({ ...newClient, entreprise: value });
                }}
                className="w-full flex items-center justify-center space-x-2 p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Créer une nouvelle entreprise</span>
              </button>
            </div>
          )}

          {!loading && suggestions.length > 0 && (
            <>
              {suggestions.map((client) => (
                <button
                  key={client.id}
                  onClick={() => handleClientSelect(client)}
                  className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-green-100">
                      <Building className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {getClientDisplayName(client)}
                      </div>
                      {getClientSubtitle(client) && (
                        <div className="text-sm text-gray-500">
                          {getClientSubtitle(client)}
                        </div>
                      )}
                      <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                        {client.fields.email && (
                          <div className="flex items-center space-x-1">
                            <Mail className="w-3 h-3" />
                            <span>{client.fields.email}</span>
                          </div>
                        )}
                        {client.fields.telephone && (
                          <div className="flex items-center space-x-1">
                            <Phone className="w-3 h-3" />
                            <span>{client.fields.telephone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full flex items-center justify-center space-x-2 p-3 text-green-600 hover:bg-green-50 border-t border-gray-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter une nouvelle entreprise</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Formulaire d'ajout de client */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Nouvelle entreprise</h3>
            <form onSubmit={handleAddNewClient}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de l'entreprise *
                  </label>
                  <input
                    type="text"
                    value={newClient.entreprise}
                    onChange={(e) => setNewClient({ ...newClient, entreprise: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                    placeholder="Nom de l'entreprise"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du contact principal *
                  </label>
                  <input
                    type="text"
                    value={newClient.nom}
                    onChange={(e) => setNewClient({ ...newClient, nom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                    placeholder="Nom du contact"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="email@exemple.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={newClient.telephone}
                    onChange={(e) => setNewClient({ ...newClient, telephone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="01 23 45 67 89"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                  <textarea
                    value={newClient.adresse}
                    onChange={(e) => setNewClient({ ...newClient, adresse: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={2}
                    placeholder="Adresse complète"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Créer l'entreprise
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientAutocomplete;