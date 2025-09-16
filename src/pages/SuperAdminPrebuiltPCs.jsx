import React, { useState, useEffect } from 'react';
import { API_BASE } from '../utils/apiBase';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Search, 
  Filter,
  Package,
  Zap,
  Settings,
  Thermometer,
  Cpu,
  Monitor,
  MemoryStick,
  HardDrive,
  Server,
  Shield
} from 'lucide-react';

const SuperAdminPrebuiltPCs = () => {
  const [prebuilts, setPrebuilts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPrebuilt, setEditingPrebuilt] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [components, setComponents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [seeding, setSeeding] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'gaming',
    description: '',
    price: '',
    performance: { gaming: '', streaming: '' },
    features: [''],
    component_ids: {
      cpu: '',
      motherboard: '',
      gpu: '',
      ram: '',
      storage: '',
      psu: '',
      case: '',
      cooler: ''
    },
    in_stock: true,
    is_hidden: false
  });

  // Fetch prebuilts
  const fetchPrebuilts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/prebuilts.php?all=1`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setPrebuilts(data);
      }
    } catch (error) {
      console.error('Error fetching prebuilts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Seed default prebuilts from live components (Admin/Super Admin)
  const handleGenerateDefaults = async () => {
    if (!window.confirm('Generate curated default Prebuilt PC options from current inventory?')) return;
    setSeeding(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/prebuilts.php?seed=1`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        await fetchPrebuilts();
        alert(`Successfully generated ${Array.isArray(result.created) ? result.created.length : 0} prebuilts.`);
      } else {
        alert(result.error || 'Seeding failed');
      }
    } catch (e) {
      console.error('Error seeding prebuilts:', e);
      alert('Error seeding prebuilts. Please try again.');
    } finally {
      setSeeding(false);
    }
  };

  // Fetch components for selection
  const fetchComponents = async () => {
    try {
      const response = await fetch(`${API_BASE}/get_all_components.php`);
      const data = await response.json();
      if (data.success) {
        setComponents(data.data);
      }
    } catch (error) {
      console.error('Error fetching components:', error);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/get_all_categories.php`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchPrebuilts();
    fetchComponents();
    fetchCategories();
  }, []);

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      category: 'gaming',
      description: '',
      price: '',
      performance: { gaming: '', streaming: '' },
      features: [''],
      component_ids: {
        cpu: '', motherboard: '', gpu: '', ram: '', storage: '', psu: '', case: '', cooler: ''
      },
      in_stock: true,
      is_hidden: false
    });
    setEditingPrebuilt(null);
  };

  // Open modal for creating/editing
  const openModal = (prebuilt = null) => {
    if (prebuilt) {
      setFormData({
        name: prebuilt.name,
        category: prebuilt.category,
        description: prebuilt.description || '',
        price: prebuilt.price,
        performance: prebuilt.performance ? JSON.parse(prebuilt.performance) : { gaming: '', streaming: '' },
        features: prebuilt.features ? JSON.parse(prebuilt.features) : [''],
        component_ids: prebuilt.component_ids ? JSON.parse(prebuilt.component_ids) : {
          cpu: '', motherboard: '', gpu: '', ram: '', storage: '', psu: '', case: '', cooler: ''
        },
        in_stock: prebuilt.in_stock === '1',
        is_hidden: prebuilt.is_hidden === '1'
      });
      setEditingPrebuilt(prebuilt);
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate component_ids
    const hasAtLeastOneComponent = Object.values(formData.component_ids).some(id => id && id !== '');
    if (!hasAtLeastOneComponent) {
      alert('You must select at least one component for this prebuilt.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const url = editingPrebuilt 
        ? `${API_BASE}/prebuilts.php?id=${editingPrebuilt.id}`
        : `${API_BASE}/prebuilts.php`;
      
      const method = editingPrebuilt ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        closeModal();
        fetchPrebuilts();
        alert(editingPrebuilt ? 'Prebuilt updated successfully!' : 'Prebuilt created successfully!');
      } else {
        alert(data.error || 'An error occurred');
      }
    } catch (error) {
      console.error('Error saving prebuilt:', error);
      alert('An error occurred while saving');
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this prebuilt?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/prebuilts.php?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchPrebuilts();
        alert('Prebuilt deleted successfully!');
      } else {
        alert(data.error || 'An error occurred');
      }
    } catch (error) {
      console.error('Error deleting prebuilt:', error);
      alert('An error occurred while deleting');
    }
  };

  // Update form data
  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Update nested form data
  const updateNestedFormData = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  // Add feature
  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  // Remove feature
  const removeFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  // Update feature
  const updateFeature = (index, value) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => i === index ? value : feature)
    }));
  };

  // Filter prebuilts
  const filteredPrebuilts = prebuilts.filter(prebuilt => {
    const matchesSearch = prebuilt.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || prebuilt.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get component name by ID
  const getComponentName = (id) => {
    if (!id) return '';
    const component = components.find(c => c.id == id);
    return component ? component.name : `Component ${id}`;
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'gaming': return <Zap className="w-5 h-5" />;
      case 'workstation': return <Settings className="w-5 h-5" />;
      case 'cooling': return <Thermometer className="w-5 h-5" />;
      default: return <Package className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Loading prebuilts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Prebuilt PC Management</h2>
        <div className="flex gap-2">
          <button
            onClick={handleGenerateDefaults}
            disabled={seeding}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm border ${seeding ? 'bg-gray-100 text-gray-400' : 'bg-white hover:bg-gray-50 text-gray-800'}`}
            title="Generate a fresh set of curated prebuilts from inventory"
          >
            <Shield className="h-4 w-4" />
            {seeding ? 'Generating...' : 'Generate Defaults'}
          </button>
          <button
            onClick={() => openModal()}
            className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Prebuilt
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search prebuilts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="gaming">Gaming</option>
            <option value="workstation">Workstation</option>
            <option value="cooling">Cooling</option>
          </select>
        </div>
      </div>

      {/* Prebuilts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPrebuilts.map((prebuilt) => (
          <div key={prebuilt.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="relative">
              {/* Status badges */}
              <div className="absolute top-2 left-2 flex gap-2">
                {prebuilt.is_hidden === '1' && (
                  <span className="bg-gray-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                    HIDDEN
                  </span>
                )}
                {prebuilt.in_stock === '0' && (
                  <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                    OUT OF STOCK
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{prebuilt.name}</h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => openModal(prebuilt)}
                    className="p-1 text-blue-500 hover:text-blue-700"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(prebuilt.id)}
                    className="p-1 text-red-500 hover:text-red-700"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                {getCategoryIcon(prebuilt.category)}
                <span className="capitalize">{prebuilt.category}</span>
              </div>
              
              <div className="text-lg font-bold text-green-600 mb-2">
                ₱{parseFloat(prebuilt.price).toLocaleString()}
              </div>
              
              {prebuilt.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{prebuilt.description}</p>
              )}

              {/* Component preview */}
              <div className="text-xs text-gray-500 space-y-1">
                <div>CPU: {getComponentName(JSON.parse(prebuilt.component_ids || '{}').cpu)}</div>
                <div>GPU: {getComponentName(JSON.parse(prebuilt.component_ids || '{}').gpu)}</div>
                <div>RAM: {getComponentName(JSON.parse(prebuilt.component_ids || '{}').ram)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPrebuilts.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No prebuilts found</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingPrebuilt ? 'Edit Prebuilt' : 'Add New Prebuilt'}
                </h3>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateFormData('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => updateFormData('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="gaming">Gaming</option>
                    <option value="workstation">Workstation</option>
                    <option value="cooling">Cooling</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price (₱)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => updateFormData('price', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Performance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Performance (optional)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Gaming (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.performance.gaming}
                      onChange={(e) => updateNestedFormData('performance', 'gaming', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Streaming (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.performance.streaming}
                      onChange={(e) => updateNestedFormData('performance', 'streaming', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
                <div className="space-y-2">
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Enter feature"
                      />
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="px-3 py-2 text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addFeature}
                    className="text-green-600 hover:text-green-700 text-sm flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add Feature
                  </button>
                </div>
              </div>

              {/* Component Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Components</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(formData.component_ids).map(([category, componentId]) => (
                    <div key={category}>
                      <label className="block text-xs text-gray-600 mb-1 capitalize">{category}</label>
                      <select
                        value={componentId}
                        onChange={(e) => updateNestedFormData('component_ids', category, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="">Select {category}</option>
                        {components
                          .filter(comp => {
                            const cat = categories.find(c => c.id == comp.category_id);
                            if (!cat) return false;
                            const name = cat.name.toLowerCase();
                            switch (category) {
                              case 'cpu':
                                return name.includes('cpu') || name.includes('procie') || name.includes('processor');
                              case 'motherboard':
                                return name.includes('mobo') || name.includes('motherboard');
                              case 'gpu':
                                return name.includes('gpu') || name.includes('graphics');
                              case 'ram':
                                return name.includes('ram') || name.includes('memory');
                              case 'storage':
                                return name.includes('storage') || name.includes('ssd') || name.includes('hdd') || name.includes('hard drive');
                              case 'psu':
                                return name.includes('psu') || name.includes('power supply');
                              case 'case':
                                return name.includes('case') || name.includes('chassis');
                              case 'cooler':
                                return name.includes('cooler') || name.includes('aio') || name.includes('fan') || name.includes('heatsink');
                              default:
                                return false;
                            }
                          })
                          .map(component => (
                            <option key={component.id} value={component.id}>
                              {component.name} - ₱{!isNaN(parseFloat(component.price)) && component.price !== null && component.price !== undefined ? parseFloat(component.price).toLocaleString() : '0'}
                            </option>
                          ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.in_stock}
                    onChange={(e) => updateFormData('in_stock', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">In Stock</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_hidden}
                    onChange={(e) => updateFormData('is_hidden', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Hidden</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingPrebuilt ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminPrebuiltPCs;