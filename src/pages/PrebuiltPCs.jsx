import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  ShoppingCart, 
  Zap, 
  Monitor, 
  Settings, 
  ArrowRight,
  Filter,
  Search,
  Package,
  Cpu,
  MemoryStick,
  HardDrive,
  Server,
  Thermometer
} from 'lucide-react';
// import Prebuilts from '../data/Prebuilts' // Remove static import

const API_URL = '/backend/api/prebuilts.php';

// Helper to fetch full component objects by IDs
async function fetchComponentsByIds(componentIds) {
  if (!componentIds || typeof componentIds !== 'object') return {};
  const ids = Object.values(componentIds).filter(id => id && typeof id === 'number');
  if (ids.length === 0) return {};
  const url = `/backend/api/get_components_by_ids.php?ids=${ids.join(',')}`;
  const response = await fetch(url);
  const data = await response.json();
  if (data.success && data.data) {
    const componentsByCategory = {};
    data.data.forEach(component => {
      const category = Object.keys(componentIds).find(cat => componentIds[cat] == component.id);
      if (category) {
        componentsByCategory[category] = component;
      }
    });
    return componentsByCategory;
  }
  return {};
}

const PrebuiltPCs = ({ setCurrentPage, setSelectedComponents, onPrebuiltSelect }) => {
  const [prebuilts, setPrebuilts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPrebuilts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setPrebuilts(data);
        } else {
          setPrebuilts([]);
        }
      } catch (e) {
        setError('Failed to fetch prebuilts.');
        setPrebuilts([]);
      }
      setLoading(false);
    };
    fetchPrebuilts();
  }, []);

  // Helper to determine brand from CPU name
  const getBrand = (pc) => {
    if (!pc.specs || !pc.specs.cpu) return 'other';
    const cpuName = pc.specs.cpu.toLowerCase();
    if (cpuName.includes('amd')) return 'amd';
    if (cpuName.includes('intel')) return 'intel';
    return 'other';
  };

  const categories = [
    { id: 'all', name: 'All PCs', count: prebuilts.length },
    ...Array.from(new Set(prebuilts.map(pc => pc.category))).filter(Boolean).map(cat => ({
      id: cat,
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      count: prebuilts.filter(pc => pc.category === cat).length
    }))
  ];

  const brands = [
    { id: 'all', name: 'All Brands', count: prebuilts.length },
    { id: 'amd', name: 'AMD Builds', count: prebuilts.filter(pc => getBrand(pc) === 'amd').length },
    { id: 'intel', name: 'Intel Builds', count: prebuilts.filter(pc => getBrand(pc) === 'intel').length }
  ];

  const filteredPCs = prebuilts
    .filter(pc => selectedCategory === 'all' || pc.category === selectedCategory)
    .filter(pc => selectedBrand === 'all' || getBrand(pc) === selectedBrand)
    .filter(pc => pc.name && pc.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price
        case 'name':
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    });

  const handleCardClick = async (pc) => {
    try {
      // Parse component_ids from JSON string if it's a string
      let componentIds = {};
      if (pc.component_ids) {
        if (typeof pc.component_ids === 'string') {
          try {
            componentIds = JSON.parse(pc.component_ids);
          } catch (e) {
            alert('This prebuilt has invalid component data and cannot be loaded. Please contact support or try another prebuilt.');
            return;
          }
        } else {
          componentIds = pc.component_ids;
        }
      } else if (pc.componentIds) {
        componentIds = pc.componentIds;
      }
      // Defensive: must have at least one component
      if (!componentIds || Object.keys(componentIds).length === 0) {
        alert('This prebuilt has no components and cannot be loaded.');
        return;
      }
      const componentsForEdit = await fetchComponentsByIds(componentIds);
      if (!componentsForEdit || Object.keys(componentsForEdit).length === 0) {
        alert('The components for this prebuilt could not be found.');
        return;
      }
      if (onPrebuiltSelect) {
        onPrebuiltSelect(componentsForEdit);
      } else {
        if (setSelectedComponents) {
          setSelectedComponents(componentsForEdit);
        }
        setCurrentPage('pc-assembly');
      }
    } catch (error) {
      console.error('Error loading prebuilt components:', error);
      alert('Error loading prebuilt components. Please try again.');
    }
  }

  const handleBuyNowClick = (e, pc) => {
    // Prevent the card click event from firing
    e.stopPropagation();
    // Handle buy now logic here
    console.log('Buy Now clicked for:', pc.name);
    // You can add your purchase logic here
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'gaming': return <Zap className="w-5 h-5" />
      case 'workstation': return <Settings className="w-5 h-5" />
      case 'cooling': return <Thermometer className="w-5 h-5" />
      default: return <Package className="w-5 h-5" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Prebuilt PC Systems</h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Expertly curated PC configurations using real components from our inventory.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search prebuilt PCs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="name">Sort by Name</option>
              <option value="price">Sort by Price</option>
            </select>
          </div>

          {/* Category and Brand Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mt-6">
            {/* Category Filters */}
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Categories</h4>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
                      selectedCategory === category.id
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {getCategoryIcon(category.id)}
                    <span className="ml-2">{category.name}</span>
                    <span className="ml-2 bg-white bg-opacity-20 px-2 py-0.5 rounded-full text-xs">
                      {category.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Brand Filters */}
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Brands</h4>
              <div className="flex flex-wrap gap-2">
                {brands.map((brand) => (
                  <button
                    key={brand.id}
                    onClick={() => setSelectedBrand(brand.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
                      selectedBrand === brand.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Cpu className="w-5 h-5" />
                    <span className="ml-2">{brand.name}</span>
                    <span className="ml-2 bg-white bg-opacity-20 px-2 py-0.5 rounded-full text-xs">
                      {brand.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Prebuilt PCs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPCs.map((pc) => (
            <div 
              key={pc.id} 
              onClick={() => handleCardClick(pc)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105 hover:border-green-300"
            >
              {/* Image */}
              <div className="relative">
                <img
                  src={pc.image}
                  alt={pc.name}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'flex'
                  }}
                />
                <div className="hidden w-full h-48 items-center justify-center bg-gray-100">
                  <span className="text-4xl text-gray-400">🔲</span>
                </div>
                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  {!(pc.in_stock || pc.inStock) && (
                    <span className="bg-gray-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      OUT OF STOCK
                    </span>
                  )}
                </div>
                {/* Click indicator */}
                <div className="absolute top-4 right-4 bg-green-600 text-white p-2 rounded-full opacity-0 hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">{pc.name}</h2>
                <div className="text-gray-600 mb-2">{pc.description}</div>
                <div className="flex flex-wrap gap-2 text-sm text-gray-500 mb-2">
                  <span>Category: {pc.category}</span>
                  <span>Price: ₱{pc.price}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PrebuiltPCs;
 