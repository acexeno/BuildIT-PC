import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  Share2, 
  Download, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Package, 
  User,
  Search,
  Filter,
  Heart,
  MessageCircle,
  Copy
} from 'lucide-react';

const PublicBuilds = ({ setCurrentPage, setSelectedComponents }) => {
  console.log('PublicBuilds component rendering...');
  const [publicBuilds, setPublicBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuild, setSelectedBuild] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterPrice, setFilterPrice] = useState('all');

  // Load public builds from backend
  useEffect(() => {
    const fetchPublicBuilds = async () => {
      setLoading(true);
      try {
        console.log('Fetching public builds...');
        const response = await fetch('/backend/api/index.php?endpoint=builds&public=1');
        console.log('Response status:', response.status);
        const result = await response.json();
        console.log('API result:', result);
        if (result.success) {
          console.log('Setting public builds:', result.data);
          setPublicBuilds(result.data);
        } else {
          console.log('API returned error:', result);
          setPublicBuilds([]);
        }
      } catch (error) {
        console.error('Error fetching public builds:', error);
        setPublicBuilds([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicBuilds();
  }, []);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCompatibilityStatus = (compatibility) => {
    if (compatibility >= 90) {
      return { status: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100', icon: <CheckCircle className="w-4 h-4" /> };
    } else if (compatibility >= 70) {
      return { status: 'Good', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: <AlertCircle className="w-4 h-4" /> };
    } else {
      return { status: 'Issues', color: 'text-red-600', bgColor: 'bg-red-100', icon: <AlertCircle className="w-4 h-4" /> };
    }
  };

  // Helper to safely format price
  const safePrice = (price) => {
    const num = Number(price);
    return isNaN(num) ? 0 : num;
  };

  // Filter and sort builds
  const filteredAndSortedBuilds = publicBuilds
    .filter(build => 
      build.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      build.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      build.creator_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(build => {
      const price = safePrice(build.totalPrice);
      switch (filterPrice) {
        case 'under-50k':
          return price < 50000;
        case '50k-100k':
          return price >= 50000 && price < 100000;
        case '100k-200k':
          return price >= 100000 && price < 200000;
        case 'over-200k':
          return price >= 200000;
        default:
          return true;
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'price-low':
          return safePrice(a.totalPrice) - safePrice(b.totalPrice);
        case 'price-high':
          return safePrice(b.totalPrice) - safePrice(a.totalPrice);
        case 'compatibility':
          return b.compatibility - a.compatibility;
        default:
          return 0;
      }
    });

  const handleUseBuild = (build) => {
    // Ensure components are mapped by category key to the full component object
    let componentsForEdit = {};
    if (Array.isArray(build.components)) {
      build.components.forEach(component => {
        if (component && component.category) {
          componentsForEdit[component.category.toLowerCase()] = component;
        }
      });
    } else if (build.components && typeof build.components === 'object') {
      const keys = Object.keys(build.components);
      if (keys.every(key => !isNaN(Number(key)))) {
        Object.values(build.components).forEach(component => {
          if (component && component.category) {
            componentsForEdit[component.category.toLowerCase()] = component;
          }
        });
      } else {
        componentsForEdit = { ...build.components };
      }
    }

    // Store the build data for editing
    localStorage.setItem('builditpc-selected-components', JSON.stringify(componentsForEdit));
    localStorage.setItem('builditpc-editing-build', JSON.stringify({
      name: build.name + ' (Copy)',
      description: build.description + ' - Shared by ' + build.creator_name
    }));

    // Pass the components to the main app so PCAssembly can pre-fill them
    if (typeof setSelectedComponents === 'function') {
      setSelectedComponents(componentsForEdit);
    }

    // Navigate to PC Assembly page
    setCurrentPage('pc-assembly');
  };

  const handleCopyBuildLink = (buildId) => {
    const buildUrl = `${window.location.origin}/public-builds/${buildId}`;
    navigator.clipboard.writeText(buildUrl).then(() => {
      alert('Build link copied to clipboard!');
    });
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <Share2 className="w-12 h-12 text-gray-400" />
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No public builds yet</h3>
      <p className="text-gray-600 text-center max-w-md mb-8">
        Be the first to share your PC build with the community! Create a build and make it public to inspire others.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <button 
          onClick={() => setCurrentPage('pc-assembly')}
          className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Package className="w-5 h-5" />
          Create Your Build
        </button>
        <button 
          onClick={() => setCurrentPage('my-builds')}
          className="border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <Eye className="w-5 h-5" />
          View My Builds
        </button>
      </div>
    </div>
  );

  const BuildCard = ({ build }) => {
    const compatibility = getCompatibilityStatus(build.compatibility);
    const components = Array.isArray(build.components)
      ? build.components
      : Object.values(build.components || {});

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{build.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{build.description}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {build.creator_name}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(build.createdAt)}
                </div>
                <div className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  ₱{safePrice(build.totalPrice).toLocaleString()}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleCopyBuildLink(build.id)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                title="Copy build link"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${compatibility.bgColor}`}>
              {compatibility.icon}
              <span className={`text-sm font-medium ${compatibility.color}`}>
                {build.compatibility}% Compatible
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Shared:</span>
              <span className="text-sm font-medium text-gray-900">
                {formatDate(build.createdAt)}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {components.slice(0, 8).map((component, index) => (
              <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xs font-medium text-gray-600 mb-1">{component.category}</div>
                <div className="text-sm font-semibold text-gray-900 truncate">{component.name}</div>
                <div className="text-xs text-gray-500">₱{Number(component.price || 0).toLocaleString()}</div>
              </div>
            ))}
            {components.length > 8 && (
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-xs font-medium text-blue-600 mb-1">+{components.length - 8} more</div>
                <div className="text-sm font-semibold text-blue-800">components</div>
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <button 
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              onClick={() => setSelectedBuild(build)}
            >
              <Eye className="w-4 h-4" />
              View Details
            </button>
            <button 
              onClick={() => handleUseBuild(build)}
              className="flex-1 border-2 border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Use This Build
            </button>
          </div>
        </div>
      </div>
    );
  };

  console.log('PublicBuilds render - loading:', loading, 'publicBuilds:', publicBuilds);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading public builds...</p>
        </div>
      </div>
    );
  }

  // Add error boundary
  if (!Array.isArray(publicBuilds)) {
    console.error('publicBuilds is not an array:', publicBuilds);
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600">Error loading builds. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  const totalBuilds = filteredAndSortedBuilds.length;
  const totalValue = filteredAndSortedBuilds.reduce((sum, build) => sum + safePrice(build.totalPrice), 0);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">Community Builds</h1>
            <p className="text-gray-600">Discover and get inspired by PC builds shared by the community</p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => setCurrentPage('my-builds')}
              className="border-2 border-gray-300 text-gray-700 px-5 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Eye className="w-5 h-5" /> My Builds
            </button>
            <button 
              onClick={() => setCurrentPage('pc-assembly')}
              className="bg-green-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Package className="w-5 h-5" /> Create Build
            </button>
          </div>
        </div>
        
        {publicBuilds.length > 0 && (
          <div className="mb-6 text-gray-700 text-lg">
            Total builds: {totalBuilds} &nbsp; • &nbsp; Total value: ₱{totalValue.toLocaleString()}
          </div>
        )}
      </div>

      {/* Filters and Search */}
      {publicBuilds.length > 0 && (
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search builds, creators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="compatibility">Best Compatibility</option>
            </select>
            
            <select
              value={filterPrice}
              onChange={(e) => setFilterPrice(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Prices</option>
              <option value="under-50k">Under ₱50,000</option>
              <option value="50k-100k">₱50,000 - ₱100,000</option>
              <option value="100k-200k">₱100,000 - ₱200,000</option>
              <option value="over-200k">Over ₱200,000</option>
            </select>
            
            <div className="text-sm text-gray-600 flex items-center justify-center">
              {filteredAndSortedBuilds.length} of {publicBuilds.length} builds
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {publicBuilds.length === 0 ? (
        <EmptyState />
      ) : filteredAndSortedBuilds.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No builds found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredAndSortedBuilds.map((build) => (
            <BuildCard key={build.id} build={build} />
          ))}
        </div>
      )}

      {/* Build Details Modal */}
      {selectedBuild && (
        (() => {
          const components = Array.isArray(selectedBuild.components)
            ? selectedBuild.components
            : Object.values(selectedBuild.components || {});
          return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <Share2 className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{selectedBuild.name}</h2>
                        <p className="text-gray-600">Shared by {selectedBuild.creator_name}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedBuild(null)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Build Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Compatibility</h3>
                          <p className="text-2xl font-bold text-green-600">{selectedBuild.compatibility}%</p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${selectedBuild.compatibility}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Total Price</h3>
                          <p className="text-2xl font-bold text-blue-600">₱{Number(selectedBuild.totalPrice || 0).toLocaleString()}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">All components included</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Creator</h3>
                          <p className="text-lg font-bold text-purple-600">{selectedBuild.creator_name}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">Build shared on {formatDate(selectedBuild.createdAt)}</p>
                    </div>
                  </div>

                  {/* Build Description */}
                  <div className="bg-gray-50 rounded-xl p-6 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-gray-600" />
                      Build Description
                    </h3>
                    <p className="text-gray-700 leading-relaxed">{selectedBuild.description}</p>
                  </div>

                  {/* Components List */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <Package className="w-6 h-6 text-gray-600" />
                      Build Components
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {components.map((component, idx) => (
                        <div key={idx} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                          <div className="flex items-start gap-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Package className="w-8 h-8 text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <span className="inline-block bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                                  {component.category}
                                </span>
                                <span className="text-lg font-bold text-green-600">
                                  ₱{Number(component.price || 0).toLocaleString()}
                                </span>
                              </div>
                              <h4 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2">
                                {component.name}
                              </h4>
                              {component.brand && (
                                <p className="text-sm text-gray-600 mb-2">
                                  Brand: <span className="font-medium">{component.brand}</span>
                                </p>
                              )}
                              {component.specs && (
                                <div className="text-xs text-gray-500 space-y-1">
                                  {Object.entries(component.specs).slice(0, 3).map(([key, value]) => (
                                    <div key={key} className="flex justify-between">
                                      <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                                      <span className="font-medium">{value}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
                    <button 
                      onClick={() => handleUseBuild(selectedBuild)}
                      className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Use This Build
                    </button>
                    <button 
                      onClick={() => handleCopyBuildLink(selectedBuild.id)}
                      className="flex-1 border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Copy className="w-5 h-5" />
                      Copy Link
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
};

export default PublicBuilds; 