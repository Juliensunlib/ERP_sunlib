import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, User, Building, Mail, Phone, MapPin } from 'lucide-react';
import airtableService from '../services/airtableService';

interface Installer {
  id: string;
  fields: {
    nom: string;
    entreprise?: string;
    email?: string;
    telephone?: string;
    adresse?: string;
    specialites?: string[];
  };
}

interface InstallerAutocompleteProps {
  value: string;
  onChange: (value: string, installer?: Installer) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  onAddressChange?: (address: string) => void;
}

const InstallerAutocomplete: React.FC<InstallerAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Rechercher un installateur...",
  required = false,
  className = "",
  onAddressChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Installer[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newInstaller, setNewInstaller] = useState({
    nom: '',
    entreprise: '',
    email: '',
    telephone: '',
    adresse: '',
    specialites: []
  });
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Recherche d'installateurs avec debounce
  useEffect(() => {
    const searchInstallers = async () => {
      if (value.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const response = await airtableService.searchInstallers(value);
        setSuggestions(response.records || []);
      } catch (error) {
        console.error('Erreur lors de la recherche d\'installateurs:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchInstallers, 300);
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

  const handleInstallerSelect = (installer: Installer) => {
    const installerName = installer.fields.entreprise || installer.fields.nom;
    onChange(installerName, installer);
    
    // Remplir automatiquement l'adresse si disponible
    if (installer.fields.adresse && onAddressChange) {
      onAddressChange(installer.fields.adresse);
    }
    
    setIsOpen(false);
  };

  const handleAddNewInstaller = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await airtableService.createInstaller({ fields: newInstaller });
      const installerName = newInstaller.entreprise || newInstaller.nom;
      onChange(installerName, response);
      
      // Remplir automatiquement l'adresse
      if (newInstaller.adresse && onAddressChange) {
        onAddressChange(newInstaller.adresse);
      }
      
      setShowAddForm(false);
      setIsOpen(false);
      setNewInstaller({
        nom: '',
        entreprise: '',
        email: '',
        telephone: '',
        adresse: '',
        specialites: []
      });
    } catch (error) {
      console.error('Erreur lors de la création de l\'installateur:', error);
    }
  };

  const getInstallerDisplayName = (installer: Installer) => {
    return installer.fields.entreprise || installer.fields.nom;
  };

  const getInstallerSubtitle = (installer: Installer) => {
    if (installer.fields.entreprise && installer.fields.nom) {
      return `Contact: ${installer.fields.nom}`;
    }
    return installer.fields.email || installer.fields.telephone || '';
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
                Aucun installateur trouvé pour "{value}"
              </div>
              <button
                onClick={() => {
                  setShowAddForm(true);
                  setNewInstaller({ ...newInstaller, entreprise: value });
                }}
                className="w-full flex items-center justify-center space-x-2 p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Créer un nouvel installateur</span>
              </button>
            </div>
          )}

          {!loading && suggestions.length > 0 && (
            <>
              {suggestions.map((installer) => (
                <button
                  key={installer.id}
                  onClick={() => handleInstallerSelect(installer)}
                  className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-blue-100">
                      <Building className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {getInstallerDisplayName(installer)}
                      </div>
                      {getInstallerSubtitle(installer) && (
                        <div className="text-sm text-gray-500">
                          {getInstallerSubtitle(installer)}
                        </div>
                      )}
                      <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                        {installer.fields.email && (
                          <div className="flex items-center space-x-1">
                            <Mail className="w-3 h-3" />
                            <span>{installer.fields.email}</span>
                          </div>
                        )}
                        {installer.fields.telephone && (
                          <div className="flex items-center space-x-1">
                            <Phone className="w-3 h-3" />
                            <span>{installer.fields.telephone}</span>
                          </div>
                        )}
                      </div>
                      {installer.fields.adresse && (
                        <div className="flex items-center space-x-1 text-xs text-gray-400 mt-1">
                          <MapPin className="w-3 h-3" />
                          <span>{installer.fields.adresse}</span>
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
                <span>Ajouter un nouvel installateur</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Formulaire d'ajout d'installateur */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Nouvel installateur</h3>
            <form onSubmit={handleAddNewInstaller}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de l'entreprise *
                  </label>
                  <input
                    type="text"
                    value={newInstaller.entreprise}
                    onChange={(e) => setNewInstaller({ ...newInstaller, entreprise: e.target.value })}
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
                    value={newInstaller.nom}
                    onChange={(e) => setNewInstaller({ ...newInstaller, nom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                    placeholder="Nom du contact"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newInstaller.email}
                    onChange={(e) => setNewInstaller({ ...newInstaller, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="email@exemple.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={newInstaller.telephone}
                    onChange={(e) => setNewInstaller({ ...newInstaller, telephone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="01 23 45 67 89"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                  <textarea
                    value={newInstaller.adresse}
                    onChange={(e) => setNewInstaller({ ...newInstaller, adresse: e.target.value })}
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
                  Créer l'installateur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstallerAutocomplete;
