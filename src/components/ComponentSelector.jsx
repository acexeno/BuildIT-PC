import React, { useState, useEffect, useCallback } from 'react'
import { Search, Filter, Eye, Plus, CheckCircle, AlertTriangle, ArrowRight, Package } from 'lucide-react'
import { getComponentImage } from '../utils/componentImages'

// Helper function to determine component type from component data
const getComponentType = (component) => {
  if (component.socket) return 'cpu'
  if (component.chipset || component.ram_type || component.form_factor) return 'motherboard'
  if (component.chipset && component.memory) return 'gpu'
  if (component.type && component.speed) return 'ram'
  if (component.capacity && component.type && (component.type.toLowerCase().includes('ssd') || component.type.toLowerCase().includes('hdd'))) return 'storage'
  if (component.wattage && component.efficiency) return 'psu'
  if (component.form_factor && component.fans) return 'case'
  if (component.type && component.tdp) return 'cooler'
  return 'default'
}

const ComponentSelector = ({ 
  selectedComponents, 
  onComponentSelect, 
  onComponentRemove, 
  activeCategory,
  recommendations = [],
  loadingRecommendations = false,
  compatibilityIssues = []
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name') // name, price, popularity
  const [components, setComponents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const categories = [
    { id: 'cpu', name: 'CPU', icon: '🔲', required: true },
    { id: 'motherboard', name: 'Motherboard', icon: '🔲', required: true },
    { id: 'gpu', name: 'Graphics Card', icon: '🔲', required: true },
    { id: 'ram', name: 'RAM', icon: '🔲', required: true },
    { id: 'storage', name: 'Storage', icon: '🔲', required: true },
    { id: 'psu', name: 'Power Supply', icon: '🔲', required: true },
    { id: 'case', name: 'Case', icon: '🔲', required: true },
    { id: 'cooler', name: 'Cooler (Optional)', icon: '🔲', required: false }
  ]

  // Map frontend categories to database categories
  const categoryMapping = {
    'cpu': 'Procie Only',
    'motherboard': 'Mobo',
    'gpu': 'GPU',
    'ram': 'Ram 3200mhz',
    'storage': 'Ssd Nvme',
    'psu': 'Psu - Tr',
    'case': 'Case Gaming',
    'cooler': 'Aio'
  }

  // Fetch components from API
  const fetchComponents = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const dbCategory = categoryMapping[activeCategory]
      const url = `/backend/api/index.php?endpoint=components&category=${encodeURIComponent(dbCategory)}`
      
      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        setComponents(data.data)
      } else {
        setError(data.error || 'Failed to fetch components')
      }
    } catch (err) {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }, [activeCategory])

  useEffect(() => {
    fetchComponents()
  }, [fetchComponents])

  // Mock data function for development
  const getMockComponents = (category) => {
    const mockData = {
      cpu: [
        {
          id: 1,
          name: "AMD Ryzen 5 5600G",
          brand: "AMD",
          price: 8500,
          stock_quantity: 5,
          specs: { cores: 6, threads: 12, tdp: 65 }
        },
        {
          id: 2,
          name: "Intel Core i5-12400F",
          brand: "Intel",
          price: 9200,
          stock_quantity: 3,
          specs: { cores: 6, threads: 12, tdp: 65 }
        }
      ],
      gpu: [
        {
          id: 3,
          name: "NVIDIA RTX 4060",
          brand: "NVIDIA",
          price: 17300,
          stock_quantity: 2,
          specs: { memory: "8GB GDDR6" }
        },
        {
          id: 4,
          name: "AMD RX 6600",
          brand: "AMD",
          price: 13200,
          stock_quantity: 4,
          specs: { memory: "8GB GDDR6" }
        }
      ],
      ram: [
        {
          id: 5,
          name: "Kingston FURY BEAST DDR4 16GB",
          brand: "Kingston",
          price: 1450,
          stock_quantity: 8,
          specs: { speed: "3200MHz", type: "DDR4" }
        },
        {
          id: 6,
          name: "T-Force Delta RGB DDR4 32GB",
          brand: "T-Force",
          price: 2800,
          stock_quantity: 3,
          specs: { speed: "3200MHz", type: "DDR4" }
        }
      ],
      motherboard: [
        {
          id: 7,
          name: "ASRock B550M Steel Legend",
          brand: "ASRock",
          price: 8500,
          stock_quantity: 2,
          specs: { form_factor: "Micro-ATX", chipset: "B550" }
        },
        {
          id: 8,
          name: "MSI B550M PRO-VDH",
          brand: "MSI",
          price: 6500,
          stock_quantity: 5,
          specs: { form_factor: "Micro-ATX", chipset: "B550" }
        }
      ],
      storage: [
        {
          id: 9,
          name: "Samsung 970 EVO Plus 1TB",
          brand: "Samsung",
          price: 6350,
          stock_quantity: 6,
          specs: { capacity: "1TB", type: "NVMe SSD" }
        },
        {
          id: 10,
          name: "WD Blue SN570 500GB",
          brand: "Western Digital",
          price: 1900,
          stock_quantity: 10,
          specs: { capacity: "500GB", type: "NVMe SSD" }
        }
      ],
      psu: [
        {
          id: 11,
          name: "Corsair CX550F",
          brand: "Corsair",
          price: 2850,
          stock_quantity: 4,
          specs: { wattage: 550, efficiency: "80+ Bronze" }
        },
        {
          id: 12,
          name: "EVGA 600 BR",
          brand: "EVGA",
          price: 2200,
          stock_quantity: 7,
          specs: { wattage: 600, efficiency: "80+ Bronze" }
        }
      ],
      case: [
        {
          id: 13,
          name: "NZXT H510",
          brand: "NZXT",
          price: 6100,
          stock_quantity: 3,
          specs: { form_factor: "ATX", fans: 2 }
        },
        {
          id: 14,
          name: "Phanteks P300A",
          brand: "Phanteks",
          price: 3500,
          stock_quantity: 5,
          specs: { form_factor: "ATX", fans: 1 }
        }
      ],
      cooler: [
        {
          id: 15,
          name: "Cooler Master Hyper 212",
          brand: "Cooler Master",
          price: 1200,
          stock_quantity: 8,
          specs: { type: "Air Cooler", tdp: 150 }
        },
        {
          id: 16,
          name: "Corsair H100i RGB",
          brand: "Corsair",
          price: 6900,
          stock_quantity: 2,
          specs: { type: "Liquid Cooler", tdp: 200 }
        }
      ]
    }
    
    return mockData[category] || []
  }

  // Filter and sort components
  const filteredComponents = components.filter(component =>
    component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (component.brand && component.brand.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const selectedComponent = selectedComponents[activeCategory]

  // Sort components based on selected criteria
  const sortedComponents = [...filteredComponents].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.price - b.price
      case 'name':
        return a.name.localeCompare(b.name)
      default:
        return 0
    }
  })

  const currentCategory = categories.find(cat => cat.id === activeCategory)

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={`Search ${currentCategory?.name || 'components'}...`}
              value=""
              disabled
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
          <div className="flex gap-2">
            <select
              value="name"
              disabled
              className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
            >
              <option value="name">Sort by Name</option>
              <option value="price">Sort by Price</option>
            </select>
          </div>
        </div>
        
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading components...</h3>
          <p className="text-gray-600">Please wait while we fetch the latest inventory.</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={`Search ${currentCategory?.name || 'components'}...`}
              value={searchTerm || ''}
              onChange={(e) => setSearchTerm(e.target.value || '')}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy || 'name'}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="name">Sort by Name</option>
              <option value="price">Sort by Price</option>
            </select>
          </div>
        </div>
        
        <div className="text-center py-12">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load components</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={`Search ${currentCategory?.name || 'components'}...`}
            value={searchTerm || ''}
            onChange={(e) => setSearchTerm(e.target.value || '')}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={sortBy || 'name'}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="name">Sort by Name</option>
            <option value="price">Sort by Price</option>
          </select>
        </div>
      </div>

      {/* Compatibility Recommendations Section */}
      {compatibilityIssues.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-orange-900">Compatibility Warnings</h3>
              <p className="text-xs text-orange-700">We found {compatibilityIssues.length} compatibility warning{compatibilityIssues.length > 1 ? 's' : ''}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {compatibilityIssues.map((issue, idx) => (
              <div key={idx} className="bg-white rounded-lg p-3 border border-orange-200">
                <div className="flex items-start gap-2 mb-2">
                  <div className="w-5 h-5 bg-orange-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-orange-700">{idx + 1}</span>
                  </div>
                  <p className="text-sm text-orange-800 leading-relaxed">{issue.message}</p>
                </div>
                
                {/* Recommendations for this issue */}
                {recommendations.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-800">Suggested Improvements</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {recommendations.map((rec) => (
                        <div key={rec.id} className="bg-green-50 rounded-lg p-3 border border-green-200 hover:border-green-300 transition-colors">
                          <div className="flex items-center gap-3">
                            {/* Component Image */}
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <img 
                                src={getComponentImage(rec.name, getComponentType(rec))} 
                                alt={rec.name} 
                                className="w-10 h-10 rounded object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                              <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center hidden">
                                <Package className="w-5 h-5 text-gray-400" />
                              </div>
                            </div>
                            
                            {/* Component Details */}
                            <div className="flex-1 min-w-0">
                              <h5 className="text-sm font-semibold text-gray-900 truncate">{rec.name}</h5>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm font-bold text-green-600">
                                  {rec.price_formatted || `₱${parseFloat(rec.price).toLocaleString()}`}
                                </span>
                                {rec.stock_quantity > 0 && (
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                    In Stock
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Replace Button */}
                            <button
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors flex-shrink-0"
                              onClick={() => onComponentSelect(activeCategory, rec)}
                            >
                              <ArrowRight className="w-3 h-3" />
                              Consider
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Loading state for recommendations */}
                {loadingRecommendations && (
                  <div className="mt-3 flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                    <span className="ml-2 text-sm text-orange-700">Loading suggestions...</span>
                  </div>
                )}
                
                {/* No recommendations found - but show helpful message */}
                {recommendations.length === 0 && !loadingRecommendations && (
                  <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-blue-700">💡 Smart Recommendations</span>
                    </div>
                    <div className="text-xs text-blue-600 space-y-1">
                      <p>• <strong>Try a different approach:</strong> Select components in this order: CPU → Motherboard → RAM → Storage → PSU → Case → GPU</p>
                      <p>• <strong>Check specifications:</strong> Ensure your selected components have complete specs for better compatibility</p>
                      <p>• <strong>Consider alternatives:</strong> Look for components with similar specifications but different brands</p>
                      <p>• <strong>Budget-friendly options:</strong> Try components in a lower price range for better compatibility</p>
                      <p>• <strong>Need help?</strong> Use the search bar above to find specific components</p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <button
                        onClick={() => window.location.reload()}
                        className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        Refresh Recommendations
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Currently Selected Component */}
      {selectedComponent && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900">Currently Selected</h3>
                <p className="text-green-700">{selectedComponent.name}</p>
                <p className="text-sm text-green-600">₱{selectedComponent.price.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onComponentRemove(activeCategory)}
                className="px-3 py-2 text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Component Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedComponents.map((component) => (
          <div
            key={component.id}
            className={`bg-white rounded-lg border-2 transition-all duration-200 hover:shadow-lg ${
              selectedComponent?.id === component.id
                ? 'border-green-500 shadow-lg'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="p-6">
              {/* Component Image */}
              <div className="w-full h-32 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                <img
                  src={getComponentImage(component.name, getComponentType(component))}
                  alt={component.name}
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'flex'
                  }}
                />
                <div className="hidden w-full h-full items-center justify-center text-gray-400">
                  <span className="text-2xl">🔲</span>
                </div>
              </div>

              {/* Component Info */}
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-1">{component.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{component.brand}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-green-600">₱{component.price.toLocaleString()}</span>
                    <span className="text-sm text-gray-500">Stock: {component.stock_quantity}</span>
                  </div>
                </div>

                {/* Component Specs */}
                <div className="text-xs text-gray-600 space-y-1">
                  {/* Warranty (top-level or in specs) */}
                  {(component.warranty || (component.specs && component.specs.warranty)) && (
                    <div>Warranty: {component.warranty || component.specs.warranty}</div>
                  )}
                  {component.socket && <div>Socket: {component.socket}</div>}
                  {component.cores && <div>Cores: {component.cores}</div>}
                  {component.threads && <div>Threads: {component.threads}</div>}
                  {component.tdp && <div>TDP: {component.tdp}W</div>}
                  {component.ram_type && <div>RAM Type: {component.ram_type}</div>}
                  {component.form_factor && <div>Form Factor: {component.form_factor}</div>}
                  {component.memory && <div>Memory: {component.memory}</div>}
                  {component.speed && <div>Speed: {component.speed}</div>}
                  {component.capacity && <div>Capacity: {component.capacity}</div>}
                  {component.wattage && <div>Wattage: {component.wattage}W</div>}
                  {component.efficiency && <div>Efficiency: {component.efficiency}</div>}
                  {component.fans && <div>Fans: {component.fans}</div>}
                  {component.type && <div>Type: {component.type}</div>}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => onComponentSelect(activeCategory, component)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedComponent?.id === component.id
                        ? 'bg-green-600 text-white'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {selectedComponent?.id === component.id ? (
                      <CheckCircle className="w-4 h-4 inline mr-1" />
                    ) : (
                      <Plus className="w-4 h-4 inline mr-1" />
                    )}
                    {selectedComponent?.id === component.id ? 'Selected' : 'Select'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {sortedComponents.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No components found</h3>
          <p className="text-gray-600">Try adjusting your search terms or filters.</p>
        </div>
      )}
    </div>
  )
}

export default ComponentSelector 