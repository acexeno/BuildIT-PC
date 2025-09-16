import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { API_BASE } from '../utils/apiBase';
import { getComponentImage } from '../utils/componentImages';

const HeroSlideshow = ({ setCurrentPage }) => {
  const [currentSlide, setCurrentSlide] = useState(0);


  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);


  // Map of category_id to category name
  const categoryIdToName = {
    1: 'CPU', 2: 'Motherboard', 3: 'GPU', 4: 'RAM', 5: 'Storage', 6: 'PSU', 7: 'Case', 8: 'Cooler', 9: 'Aio', 11: 'Case Gaming',
    // Add more as needed
  };

  useEffect(() => {
    const fetchComponents = async () => {
      try {
        const response = await fetch(`${API_BASE}/get_all_components.php`);
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          // Only allow real PC component categories by category_id
          const allowedCategoryIds = [1,2,3,4,5,6,7,8,9,11];
          const filtered = result.data.filter(comp =>
            allowedCategoryIds.includes(Number(comp.category_id))
          ).map(comp => ({
            ...comp,
            category: categoryIdToName[Number(comp.category_id)] || comp.category_id
          }));
          // Parse price, sort by price descending, and keep only 10
          const sorted = filtered
            .map(comp => ({
              ...comp,
              priceValue: parseFloat((comp.price || '').toString().replace(/[^0-9.]/g, '')) || 0
            }))
            .sort((a, b) => b.priceValue - a.priceValue)
            .slice(0, 10);
          setComponents(sorted);
        } else {
          setComponents([]);
        }
      } catch (e) {
        setComponents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchComponents();
  }, []);

  // Handle slide transitions
  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  // Handle next slide
  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % components.length);
  };

  // Handle previous slide
  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + components.length) % components.length);
  };


  // Only reset currentSlide if it is out of bounds after components change
  useEffect(() => {
    if (currentSlide >= components.length && components.length > 0) {
      setCurrentSlide(0);
    }
  }, [components.length, currentSlide]);

  // Clamp currentSlide if it is out of bounds after components change
  useEffect(() => {
    if (components.length === 0) return;
    if (currentSlide >= components.length) {
      setCurrentSlide(Math.max(components.length - 1, 0));
    }
  }, [components.length, currentSlide]);

  // Set up auto-advance timer only if there are slides
  useEffect(() => {
    if (!components || components.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % components.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [components.length]);


  if (loading) {
    return (
      <section className="relative h-screen flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
        <div className="text-white text-xl font-semibold">Loading components...</div>
      </section>
    );
  }

  // If nothing loaded or empty, show the fallback message
  if (!components || components.length === 0) {
    return (
      <section className="relative h-screen flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
        <div className="text-white text-xl font-semibold text-center">
          No PC components with working images found for the slideshow.<br />
          Please check your database or try again later.
        </div>
      </section>
    );
  }

  return (
    <section className="relative h-screen overflow-hidden">
      <div className="relative h-full">
        {components.map((component, index) => {
          // Provide safe defaults for missing fields
          const BASE_URL = (import.meta && import.meta.env && import.meta.env.BASE_URL) || '/';
          const baseNoSlash = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
          const image = getComponentImage(component, (component.category || '').toLowerCase()) || `${baseNoSlash}/images/placeholder-component.png`;
          // Log the image URL for debugging
          if (typeof window !== 'undefined') {
            // Only log once per image/component
            if (!window.__loggedImages) window.__loggedImages = {};
            if (!window.__loggedImages[component.id]) {
              console.log(`HeroSlideshow: [${component.name}] image_url=`, image);
              window.__loggedImages[component.id] = true;
            }
          }
          const gradient = component.gradient || 'from-blue-700 to-gray-900';
          const description = component.description || (component.brand ? `${component.brand} ${component.name}` : component.name);
          const rating = typeof component.rating === 'number' ? component.rating : 4.8;
          const reviewCount = typeof component.reviewCount === 'number' ? component.reviewCount : 99;
          const specs = Array.isArray(component.specs) && component.specs.length > 0 ? component.specs : [];
          const originalPrice = component.originalPrice || '';
          return (
            <div
              key={component.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <div className={`h-full bg-gradient-to-br ${gradient} text-white flex items-center justify-center p-4`}>
                <div className="max-w-7xl mx-auto px-4 lg:px-8">
                  <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
                    <div className="w-full lg:w-1/2 flex justify-center">
                      <div className="bg-white bg-opacity-20 rounded-2xl p-4 lg:p-8 backdrop-blur-sm shadow-2xl relative">
                        <img 
                          src={image} 
                          alt={component.name}
                          className="h-64 w-auto object-contain mx-auto"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = `${baseNoSlash}/images/placeholder-component.png`;
                            // Show a visible error overlay
                            const overlay = document.createElement('div');
                            overlay.style.position = 'absolute';
                            overlay.style.top = '0';
                            overlay.style.left = '0';
                            overlay.style.width = '100%';
                            overlay.style.height = '100%';
                            overlay.style.background = 'rgba(255,0,0,0.7)';
                            overlay.style.color = 'white';
                            overlay.style.display = 'flex';
                            overlay.style.alignItems = 'center';
                            overlay.style.justifyContent = 'center';
                            overlay.style.fontWeight = 'bold';
                            overlay.style.fontSize = '1.2rem';
                            overlay.innerText = 'Image not found!';
                            e.target.parentNode.appendChild(overlay);
                            console.warn(`HeroSlideshow: Image failed to load for [${component.name}]`, image);
                          }}
                        />
                      </div>
                    </div>
                    <div className="w-full lg:w-1/2 text-center lg:text-left">
                      <div className="flex flex-col h-full justify-between">
                        <div>
                          <span className="inline-block bg-white text-gray-800 text-sm font-semibold px-3 py-1 rounded-full mb-4 shadow-md">
                            {component.category}
                          </span>
                          <h1 className="text-3xl lg:text-5xl font-bold mb-3 lg:mb-4 leading-tight">
                            {component.name}
                          </h1>
                          {/* Stars and reviews removed as requested */}
                          <p className="text-base lg:text-lg mb-6 text-gray-200 leading-relaxed">
                            {description}
                          </p>
                          <div className="mb-6">
                            <div className="flex items-baseline">
                              <span className="text-3xl font-bold text-white">₱{Number(component.price).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                              {originalPrice && (
                                <span className="ml-2 text-lg text-gray-300 line-through">{originalPrice}</span>
                              )}
                              {originalPrice && (
                                <span className="ml-2 text-sm bg-red-600 text-white px-2 py-0.5 rounded">
                                  {Math.round((1 - parseFloat(component.price.toString().replace(/[^0-9.]/g, '')) / 
                                    parseFloat(originalPrice.toString().replace(/[^0-9.]/g, ''))) * 100)}% OFF
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 mb-6">
                            {specs.length > 0 && (
                              specs.slice(0, 4).map((spec, i) => (
                                <div key={i} className="bg-white bg-opacity-10 p-3 rounded-lg">
                                  <div className="text-xs text-gray-300">{spec.label}</div>
                                  <div className="font-medium text-white">{spec.value}</div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                        <div className="mt-auto">
                          <div className="flex flex-col sm:flex-row gap-4">
                            <button 
                              onClick={() => setCurrentPage('pc-assembly')}
                              className="flex-1 flex items-center justify-center px-6 py-3 border-2 border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] transform"
                            >
                              Add to Build
                              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button
                              onClick={() => setCurrentPage('pc-assembly')}
                              className="flex-1 flex items-center justify-center px-6 py-3 border-2 border-white text-base font-medium rounded-lg text-white hover:bg-white hover:bg-opacity-10 transition-all duration-200 hover:shadow-lg"
                            >
                              View All {component.category}s
                            </button>
                          </div>
                          {/* Removed free shipping text as there are no payment methods */}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full z-10 transition-all duration-200"
        aria-label="Previous component"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full z-10 transition-all duration-200"
        aria-label="Next component"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
        {components.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-200 ${
              index === currentSlide ? 'bg-white w-8' : 'bg-white bg-opacity-50'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white bg-opacity-20">
        <div 
          className="h-full bg-white transition-all duration-5000 ease-linear"
          style={{ 
            width: `${((currentSlide + 1) / components.length) * 100}%`,
            transitionDuration: '5000ms'
          }}
        />
      </div>
    </section>
  );
};

export default HeroSlideshow;