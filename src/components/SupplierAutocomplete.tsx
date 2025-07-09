import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Building, Mail, Phone, MapPin } from 'lucide-react';
import airtableService from '../services/airtableService';

interface Supplier {
  id: string;
  fields: {
    nom: string;
    contact?: string;
    email?: string;
    telephone?: string;
    adresse?: string;
    siret?: string;
    conditions_paiement?: string;
    delai_livraison?: number;
  };
}

interface SupplierAutocompleteProps {
  value: string;
  onChange: (value: string, supplier?: Supplier) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

const SupplierAutocomplete: React.FC<SupplierAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Rechercher un fournisseur...",
  required = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    nom: '',
    contact: '',
    email: '',
    telephone: '',
    adresse: '',
    siret: '',
    conditions_paiement: 'Comptant',
    delai_livraison: 7
  });
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Recherche de fournisseurs avec debounce
  useEffect(() => {
    const searchSuppliers = async () => {
      if (value.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const response = await airtableService.searchSuppliers(value);
        setSuggestions(response.records || []);
      } catch (error) {
        console.error('Erreur lors de la recherche de fournisseurs:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchSuppliers, 300);
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

  const handleSupplierSelect = (supplier: Supplier) => {
    onChange(supplier.fields.nom, supplier);
    setIsOpen(false);
  };

  const handleAddNewSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await airtableService.createSupplier({ fields: newSupplier });
      onChange(newSupplier.nom, response);
      setShowAddForm(false);
      setIsOpen(false);
      setNewSupplier({
        nom: '',
        contact: '',
        email: '',
        telephone: '',
        adresse: '',
        siret: '',
        conditions_paiement: 'Comptant',
        delai_livraison: 7
      });
    } catch (error) {
      console.error('Erreur lors de la création du fournisseur:', error);
    }
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
                Aucun fournisseur trouvé pour "{value}"
              </div>
              <button
                onClick={() => {
                  setShowAddForm(true);
                  setNewSupplier({ ...newSupplier, nom: value });
                }}
                className="w-full flex items-center justify-center space-x-2 p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Créer un nouveau fournisseur</span>
              </button>
            </div>
          )}

          {!loading && suggestions.length > 0 && (
            <>
              {suggestions.map((supplier) => (
                <button
                  key={supplier.id}
                  onClick={() => handleSupplierSelect(supplier)}
                  className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-purple-100">
                      <Building className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {supplier.fields.nom}
                      </div>
                      {supplier.fields.contact && (
                        <div className="text-sm text-gray-500">
                          Contact: {supplier.fields.contact}
                        </div>
                      )}
                      <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                        {supplier.fields.email && (
                          <div className="flex items-center space-x-1">
                            <Mail className="w-3 h-3" />
                            <span>{supplier.fields.email}</span>
                          </div>
                        )}
                        {supplier.fields.telephone && (
                          <div className="flex items-center space-x-1">
                            <Phone className="w-3 h-3" />
                            <span>{supplier.fields.telephone}</span>
                          </div>
                        )}
                      </div>
                      {supplier.fields.conditions_paiement && (
                        <div className="text-xs text-gray-400 mt-1">
                          Paiement: {supplier.fields.conditions_paiement}
                          {supplier.fields.delai_livraison && ` • Livraison: ${supplier.fields.delai_livraison}j`}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full flex items-center justify-center space-x-2 p-3 text-green-600 hover:bg-green-50 border-t border-gray-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter un nouveau fournisseur</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Formulaire d'ajout de fournisseur */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Nouveau fournisseur</h3>
            <form onSubmit={handleAddNewSupplier}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du fournisseur *
                  </label>
                  <input
                    type="text"
                    value={newSupplier.nom}
                    onChange={(e) => setNewSupplier({ ...newSupplier, nom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                    placeholder="Nom du fournisseur"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact principal
                  </label>
                  <input
                    type="text"
                    value={newSupplier.contact}
                    onChange={(e) => setNewSupplier({ ...newSupplier, contact: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Nom du contact"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="email@exemple.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={newSupplier.telephone}
                    onChange={(e) => setNewSupplier({ ...newSupplier, telephone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="01 23 45 67 89"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SIRET</label>
                  <input
                    type="text"
                    value={newSupplier.siret}
                    onChange={(e) => setNewSupplier({ ...newSupplier, siret: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="12345678901234"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Conditions de paiement</label>
                  <select
                    value={newSupplier.conditions_paiement}
                    onChange={(e) => setNewSupplier({ ...newSupplier, conditions_paiement: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="Comptant">Comptant</option>
                    <option value="30j">30 jours</option>
                    <option value="60j">60 jours</option>
                    <option value="90j">90 jours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Délai de livraison (jours)</label>
                  <input
                    type="number"
                    min="1"
                    value={newSupplier.delai_livraison}
                    onChange={(e) => setNewSupplier({ ...newSupplier, delai_livraison: parseInt(e.target.value) || 7 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                  <textarea
                    value={newSupplier.adresse}
                    onChange={(e) => setNewSupplier({ ...newSupplier, adresse: e.target.value })}
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
                  Créer le fournisseur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierAutocomplete;
