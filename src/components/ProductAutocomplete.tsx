import React, { useState, useEffect, useRef } from 'react';
import { Search, Package, Tag, DollarSign } from 'lucide-react';

interface Product {
  id: string;
  fields: {
    nom: string;
    reference?: string;
    categorie?: string;
    prix?: number;
    fournisseur?: string;
    stock?: number;
  };
}

interface ProductAutocompleteProps {
  value: string;
  onChange: (value: string, product?: Product) => void;
  onPriceChange?: (price: number) => void;
  products: Product[];
  placeholder?: string;
  required?: boolean;
  className?: string;
}

const ProductAutocomplete: React.FC<ProductAutocompleteProps> = ({
  value,
  onChange,
  onPriceChange,
  products,
  placeholder = "Rechercher un produit...",
  required = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filtrer les produits en fonction de la recherche
  useEffect(() => {
    if (value.length < 1) {
      setSuggestions([]);
      return;
    }

    const filtered = products.filter(product => {
      const fields = product.fields;
      const searchTerm = value.toLowerCase();
      return (
        fields.nom?.toLowerCase().includes(searchTerm) ||
        fields.reference?.toLowerCase().includes(searchTerm) ||
        fields.categorie?.toLowerCase().includes(searchTerm) ||
        fields.fournisseur?.toLowerCase().includes(searchTerm)
      );
    }).slice(0, 10); // Limiter à 10 résultats

    setSuggestions(filtered);
  }, [value, products]);

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

  const handleProductSelect = (product: Product) => {
    onChange(product.fields.nom, product);
    
    // Remplir automatiquement le prix si disponible
    if (product.fields.prix && onPriceChange) {
      onPriceChange(product.fields.prix);
    }
    
    setIsOpen(false);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    // Afficher tous les produits si le champ est vide
    if (value.length === 0) {
      setSuggestions(products.slice(0, 10));
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          required={required}
          className={`w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm ${className}`}
        />
      </div>

      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto"
        >
          {suggestions.map((product) => (
            <button
              key={product.id}
              onClick={() => handleProductSelect(product)}
              className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="p-1.5 rounded-full bg-blue-100">
                  <Package className="w-3 h-3 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm truncate">
                    {product.fields.nom}
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                    {product.fields.reference && (
                      <div className="flex items-center space-x-1">
                        <Tag className="w-3 h-3" />
                        <span>{product.fields.reference}</span>
                      </div>
                    )}
                    {product.fields.categorie && (
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                        {product.fields.categorie}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    {product.fields.prix && (
                      <div className="flex items-center space-x-1 text-xs text-green-600">
                        <DollarSign className="w-3 h-3" />
                        <span>{product.fields.prix.toFixed(2)} €</span>
                      </div>
                    )}
                    {product.fields.stock !== undefined && (
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        product.fields.stock > 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        Stock: {product.fields.stock}
                      </span>
                    )}
                  </div>
                  {product.fields.fournisseur && (
                    <div className="text-xs text-gray-400 mt-1">
                      Fournisseur: {product.fields.fournisseur}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductAutocomplete;
