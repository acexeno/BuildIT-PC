import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Eye, 
  Plus, 
  Trash2, 
  ShoppingCart, 
  Package, 
  Save, 
  X,
  Cpu,
  HardDrive,
  Monitor,
  Zap,
  Thermometer,
  MemoryStick,
  Server,
  Settings,
  ArrowRight,
  Star,
  TrendingUp,
  Shield,
  Clock,
  Target,
  Lightbulb,
  Edit,
  LogIn,
  User
} from 'lucide-react'
import ComponentSelector from '../components/ComponentSelector'
import CompatibilityChecker from '../components/CompatibilityChecker'
import axios from 'axios'

const PCAssembly = ({ setCurrentPage, selectedComponents: prebuiltComponents, setSelectedComponents: setSelectedComponentsProp, onLoaded, user, onShowAuth, setUser }) => {
  // State management
  const [internalSelectedComponents, setInternalSelectedComponents] = useState({
    cpu: null,
    motherboard: null,
    gpu: null,
    ram: null,
    storage: null,
    psu: null,
    case: null,
    cooler: null
  });
  
  // Memoize selectedComponents to prevent infinite re-renders
  const selectedComponents = useMemo(() => {
    return prebuiltComponents || internalSelectedComponents;
  }, [prebuiltComponents, internalSelectedComponents]);
  
  const setSelectedComponents = setSelectedComponentsProp || setInternalSelectedComponents;

  // UI State
  const [componentsLoaded, setComponentsLoaded] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [showTips, setShowTips] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showRestoreNotification, setShowRestoreNotification] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  
  // Build State
  const [buildName, setBuildName] = useState('');
  const [buildDescription, setBuildDescription] = useState('');
  const [savingBuild, setSavingBuild] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingBuildId, setEditingBuildId] = useState(null);
  
  // Compatibility State
  const [compatibilityStatus, setCompatibilityStatus] = useState({});
  const [compatibilityDetails, setCompatibilityDetails] = useState({});
  
  // Recommendations State
  const [recommendations, setRecommendations] = useState({});
  const [loadingRecommendations, setLoadingRecommendations] = useState({});

  // Ref to track previous components for localStorage
  const prevComponentsRef = useRef(null);
  
  // Ref to track if initialization has been done
  const initializedRef = useRef(false);

  // Component categories
  const componentCategories = useMemo(() => [
    { key: 'cpu', name: 'Processor', icon: Cpu, description: 'Brain of your PC', priority: 1 },
    { key: 'motherboard', name: 'Motherboard', icon: Server, description: 'Connects everything', priority: 2 },
    { key: 'gpu', name: 'Graphics Card', icon: Monitor, description: 'Handles graphics', priority: 3 },
    { key: 'ram', name: 'Memory', icon: MemoryStick, description: 'System memory', priority: 4 },
    { key: 'storage', name: 'Storage', icon: HardDrive, description: 'Data storage', priority: 5 },
    { key: 'psu', name: 'Power Supply', icon: Zap, description: 'Powers everything', priority: 6 },
    { key: 'case', name: 'Case', icon: Package, description: 'Houses components', priority: 7 },
    { key: 'cooler', name: 'Cooling', icon: Thermometer, description: 'Keeps it cool', priority: 8 }
  ], []);

  // Helper functions
  const getCurrentCategory = useCallback(() => {
    return componentCategories[activeStep - 1] || componentCategories[0];
  }, [componentCategories, activeStep]);

  const getApiCategoryName = useCallback((key) => {
    switch (key) {
      case 'cpu': return 'Cpu';
      case 'motherboard': return 'Motherboard';
      case 'ram': return 'RAM';
      case 'psu': return 'Power Supply';
      case 'case': return 'Case';
      default: return '';
    }
  }, []);

  const getNormalizedComponents = useCallback((components) => {
    const defaultKeys = {
      cpu: null,
      motherboard: null,
      gpu: null,
      ram: null,
      storage: null,
      psu: null,
      case: null,
      cooler: null
    };
    return { ...defaultKeys, ...components };
  }, []);

  const getComponentSpec = useCallback((component, specName) => {
    if (!component) return null;
    // Robustly extract socket info (case-insensitive, trim, check everywhere)
    if (specName === 'socket') {
      const tryFields = [
        component.socket,
        component.Socket,
        component.type,
        component.Type,
        component.model,
        component.Model,
        component.name,
        component.Name,
        component.specs && component.specs.socket,
        component.specs && component.specs.type,
        component.specs && component.specs.model,
        component.specs && component.specs.name
      ];
      for (let val of tryFields) {
        if (typeof val === 'string' && val.trim()) {
          const v = val.trim().toLowerCase();
          if (v.includes('am4')) return 'am4';
          if (v.includes('lga1200')) return 'lga1200';
          if (v.includes('am5')) return 'am5';
          if (v.includes('lga1700')) return 'lga1700';
        }
      }
      return null;
    }
    // Robustly extract brand
    if (specName === 'brand') {
      const tryFields = [
        component.brand,
        component.Brand,
        component.name,
        component.Name,
        component.model,
        component.Model,
        component.type,
        component.Type,
        component.specs && component.specs.brand,
        component.specs && component.specs.name
      ];
      for (let val of tryFields) {
        if (typeof val === 'string' && val.trim()) {
          const v = val.trim().toLowerCase();
          if (v.includes('amd')) return 'amd';
          if (v.includes('intel')) return 'intel';
        }
      }
      return null;
    }
    // RAM type
    if (specName === 'ramType') {
      return component.ram_type || component.type || (component.specs && (component.specs.ram_type || component.specs.type)) || null;
    }
    // Form factor
    if (specName === 'formFactor') {
      return component.form_factor || (component.specs && component.specs.form_factor) || null;
    }
    // Default case
    return component[specName] || (component.specs && component.specs[specName]) || null;
  }, []);

  // Fetch functions
  const fetchComponentsByIds = useCallback(async (componentIds) => {
    try {
      const ids = Object.values(componentIds).filter(id => id && typeof id === 'number');
      if (ids.length === 0) return {};
      
      const url = `/backend/api/get_components_by_ids.php?ids=${ids.join(',')}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success && data.data) {
        const componentsByCategory = {};
        data.data.forEach(component => {
          const category = Object.keys(componentIds).find(cat => 
            componentIds[cat] == component.id
          );
          if (category) {
            componentsByCategory[category] = component;
          }
        });
        return componentsByCategory;
      }
      return {};
    } catch (error) {
      console.error('Error fetching components by IDs:', error);
      return {};
    }
  }, []);

  const fetchRecommendations = useCallback(async (category, requirements) => {
    const apiCategory = getApiCategoryName(category);
    if (!apiCategory) return;
    
    setLoadingRecommendations(prev => ({ ...prev, [category]: true }));
    try {
      let apiParams = { category: apiCategory, limit: 5 };
      
      if (requirements.socket) apiParams.socket = requirements.socket;
      if (requirements.type) apiParams.ramType = requirements.type;
      if (requirements.minWattage) apiParams.minWattage = requirements.minWattage;
      if (requirements.minSize) apiParams.minSize = requirements.minSize;
      if (requirements.formFactor) apiParams.formFactor = requirements.formFactor;
      
      let { data } = await axios.get('/backend/api/recommendations.php', { params: apiParams });
      
      if (!data.data || data.data.length === 0) {
        const broaderParams = { 
          category: apiCategory, 
          limit: 5,
          minPrice: 1000,
          maxPrice: 500000
        };
        const broaderResponse = await axios.get('/backend/api/recommendations.php', { params: broaderParams });
        if (broaderResponse.data.data && broaderResponse.data.data.length > 0) {
          data = broaderResponse.data;
        }
      }
      
      if (!data.data || data.data.length === 0) {
        const topParams = { category: apiCategory, limit: 3 };
        const topResponse = await axios.get('/backend/api/recommendations.php', { params: topParams });
        if (topResponse.data.data && topResponse.data.data.length > 0) {
          data = topResponse.data;
        }
      }
      
      setRecommendations(prev => ({ ...prev, [category]: data.data || [] }));
    } catch (e) {
      console.error('Error fetching recommendations:', e);
      setRecommendations(prev => ({ ...prev, [category]: [] }));
    } finally {
      setLoadingRecommendations(prev => ({ ...prev, [category]: false }));
    }
  }, [getApiCategoryName]);

  // Compatibility functions
  const getCompatibilitySuggestions = useCallback((category) => {
    const component = selectedComponents[category];
    if (!component) return null;

    const suggestions = [];

    // CPU suggestions
    if (category === 'cpu' && selectedComponents.motherboard) {
      const cpuSocket = getComponentSpec(component, 'socket');
      const moboSocket = getComponentSpec(selectedComponents.motherboard, 'socket');
      // Only add suggestion if sockets are different and not both AM4
      if (
        cpuSocket && moboSocket && cpuSocket !== moboSocket &&
        !(cpuSocket.toLowerCase() === 'am4' && moboSocket.toLowerCase() === 'am4')
      ) {
        suggestions.push({
          type: 'replace',
          message: `CPU socket (${cpuSocket}) doesn't match motherboard (${moboSocket})`,
          action: 'Replace CPU',
          targetCategory: 'cpu',
          requirements: { socket: moboSocket }
        });
      }
    }

    // Motherboard suggestions
    if (category === 'motherboard') {
      const moboSocket = getComponentSpec(component, 'socket');
      const moboRamType = getComponentSpec(component, 'ramType');
      if (selectedComponents.cpu) {
        const cpuSocket = getComponentSpec(selectedComponents.cpu, 'socket');
        // Only add suggestion if sockets are different and not both AM4
        if (
          moboSocket && cpuSocket && moboSocket !== cpuSocket &&
          !(moboSocket.toLowerCase() === 'am4' && cpuSocket.toLowerCase() === 'am4')
        ) {
          suggestions.push({
            type: 'replace',
            message: `Motherboard socket (${moboSocket}) doesn't match CPU (${cpuSocket})`,
            action: 'Replace Motherboard',
            targetCategory: 'motherboard',
            requirements: { socket: cpuSocket }
          });
        }
      }
      if (selectedComponents.ram) {
        const ramType = getComponentSpec(selectedComponents.ram, 'ramType');
        if (moboRamType && ramType && moboRamType !== ramType) {
          suggestions.push({
            type: 'replace',
            message: `Motherboard supports ${moboRamType} but RAM is ${ramType}`,
            action: 'Replace RAM',
            targetCategory: 'ram',
            requirements: { type: moboRamType }
          });
        }
      }
    }

    // RAM suggestions
    if (category === 'ram' && selectedComponents.motherboard) {
      const ramType = getComponentSpec(component, 'ramType');
      const moboRamType = getComponentSpec(selectedComponents.motherboard, 'ramType');
      if (ramType && moboRamType && ramType !== moboRamType) {
        suggestions.push({
          type: 'replace',
          message: `RAM type (${ramType}) doesn't match motherboard (${moboRamType})`,
          action: 'Replace RAM',
          targetCategory: 'ram',
          requirements: { type: moboRamType }
        });
      }
      // RAM sticks vs. motherboard slots
      const ramSticks = getComponentSpec(component, 'sticks') || getComponentSpec(component, 'modules') || 1;
      const moboSlots = getComponentSpec(selectedComponents.motherboard, 'ram_slots') || getComponentSpec(selectedComponents.motherboard, 'slots') || 2;
      if (ramSticks > moboSlots) {
        suggestions.push({
          type: 'replace',
          message: `Selected RAM (${ramSticks} sticks) exceeds motherboard slots (${moboSlots})`,
          action: 'Replace RAM',
          targetCategory: 'ram',
          requirements: { maxSticks: moboSlots }
        });
      }
    }

    // Storage suggestions
    if (category === 'storage' && selectedComponents.motherboard) {
      const storageInterface = getComponentSpec(component, 'interface') || getComponentSpec(component, 'type');
      const moboStorage = getComponentSpec(selectedComponents.motherboard, 'storage_interfaces') || getComponentSpec(selectedComponents.motherboard, 'storage_support');
      if (storageInterface && moboStorage && !String(moboStorage).toLowerCase().includes(String(storageInterface).toLowerCase())) {
        suggestions.push({
          type: 'replace',
          message: `Storage interface (${storageInterface}) not supported by motherboard (${moboStorage})`,
          action: 'Replace Storage',
          targetCategory: 'storage',
          requirements: { interface: moboStorage }
        });
      }
    }

    // PSU suggestions
    if (category === 'psu') {
      const cpuTdp = getComponentSpec(selectedComponents.cpu, 'tdp') || 0;
      const gpuTdp = getComponentSpec(selectedComponents.gpu, 'tdp') || 0;
      const totalPower = cpuTdp + gpuTdp + 100;
      const recommendedWattage = Math.ceil((totalPower * 1.2) / 10) * 10;
      const psuWattage = getComponentSpec(component, 'wattage');
      if (psuWattage && psuWattage < recommendedWattage) {
        suggestions.push({
          type: 'upgrade',
          message: `PSU (${psuWattage}W) may not provide enough power (${recommendedWattage}W recommended)`,
          action: 'Upgrade PSU',
          targetCategory: 'psu',
          requirements: { minWattage: recommendedWattage }
        });
      }
      // PSU form factor vs. case
      if (selectedComponents.case) {
        const psuForm = getComponentSpec(component, 'form_factor') || getComponentSpec(component, 'type');
        const casePsuSupport = getComponentSpec(selectedComponents.case, 'psu_support') || getComponentSpec(selectedComponents.case, 'psu_type');
        if (psuForm && casePsuSupport && !String(casePsuSupport).toLowerCase().includes(String(psuForm).toLowerCase())) {
          suggestions.push({
            type: 'replace',
            message: `PSU form factor (${psuForm}) not supported by case (${casePsuSupport})`,
            action: 'Replace PSU',
            targetCategory: 'psu',
            requirements: { form_factor: casePsuSupport }
          });
        }
      }
    }

    // GPU suggestions
    if (category === 'gpu' && selectedComponents.case) {
      const gpuLength = getComponentSpec(component, 'length') || getComponentSpec(component, 'max_length');
      const caseGpuMax = getComponentSpec(selectedComponents.case, 'gpu_max_length') || getComponentSpec(selectedComponents.case, 'max_gpu_length');
      if (gpuLength && caseGpuMax && Number(gpuLength) > Number(caseGpuMax)) {
        suggestions.push({
          type: 'replace',
          message: `GPU length (${gpuLength}mm) exceeds case max GPU length (${caseGpuMax}mm)` ,
          action: 'Replace GPU',
          targetCategory: 'gpu',
          requirements: { maxLength: caseGpuMax }
        });
      }
    }

    // Cooler suggestions
    if (category === 'cooler' && selectedComponents.case) {
      const coolerHeight = getComponentSpec(component, 'height') || getComponentSpec(component, 'max_height');
      const caseCoolerMax = getComponentSpec(selectedComponents.case, 'cooler_max_height') || getComponentSpec(selectedComponents.case, 'max_cooler_height');
      if (coolerHeight && caseCoolerMax && Number(coolerHeight) > Number(caseCoolerMax)) {
        suggestions.push({
          type: 'replace',
          message: `Cooler height (${coolerHeight}mm) exceeds case max cooler height (${caseCoolerMax}mm)` ,
          action: 'Replace Cooler',
          targetCategory: 'cooler',
          requirements: { maxHeight: caseCoolerMax }
        });
      }
    }

    // Case suggestions
    if (category === 'case' && selectedComponents.motherboard) {
      const caseForm = getComponentSpec(component, 'formFactor');
      const moboForm = getComponentSpec(selectedComponents.motherboard, 'formFactor');
      if (caseForm && moboForm) {
        // Support for multiple form factors in case
        const supportedForms = Array.isArray(caseForm)
          ? caseForm.map(f => f.toLowerCase())
          : String(caseForm).split(/,|\//).map(f => f.trim().toLowerCase());
        if (!supportedForms.includes(String(moboForm).toLowerCase())) {
          suggestions.push({
            type: 'replace',
            message: `Case form factor (${caseForm}) may not fit motherboard (${moboForm})`,
            action: 'Replace Case',
            targetCategory: 'case',
            requirements: { formFactor: moboForm }
          });
        }
      }
    }

    return suggestions;
  }, [selectedComponents, getComponentSpec]);

  // Event handlers
  const handleComponentSelect = useCallback((category, component) => {
    setSelectedComponents(prev => ({
      ...prev,
      [category]: component
    }));
    
    const currentCategoryIndex = componentCategories.findIndex(cat => cat.key === category);
    if (currentCategoryIndex === activeStep - 1 && activeStep < componentCategories.length) {
      setActiveStep(activeStep + 1);
    }
  }, [setSelectedComponents, componentCategories, activeStep]);

  const handleComponentRemove = useCallback((category) => {
    setSelectedComponents(prev => ({
      ...prev,
      [category]: null
    }));
  }, [setSelectedComponents]);

  const handleSuggestionAction = useCallback((suggestion) => {
    setActiveStep(componentCategories.findIndex(cat => cat.key === suggestion.targetCategory) + 1);
  }, [componentCategories]);

  const handleClearAllComponents = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all selected components?')) {
      const emptyComponents = {
        cpu: null,
        motherboard: null,
        gpu: null,
        ram: null,
        storage: null,
        psu: null,
        case: null,
        cooler: null
      };
      setSelectedComponents(emptyComponents);
      localStorage.removeItem('builditpc-selected-components');
      setActiveStep(1);
    }
  }, [setSelectedComponents]);

  // Calculation functions
  const getTotalPrice = useCallback(() => {
    return Object.values(selectedComponents)
      .filter(component => component)
      .reduce((total, component) => {
        if (typeof component === 'object' && component !== null) {
          const price = typeof component.price === 'string' ? parseFloat(component.price) : component.price || 0;
          return total + price;
        }
        return total;
      }, 0);
  }, [selectedComponents]);

  const getCompatibilityScore = useCallback(() => {
    const totalChecks = 4;
    const requiredCategories = ['cpu', 'motherboard', 'gpu', 'ram', 'storage', 'psu', 'case'];
    const selectedCount = requiredCategories.filter(category => {
      const component = selectedComponents[category];
      return component !== null && component !== undefined && Object.keys(component).length > 0;
    }).length;
    if (selectedCount === 0) return 0;
    
    let failed = 0;
    if (compatibilityStatus.cpu_motherboard === false) failed++;
    if (compatibilityStatus.ram_motherboard === false) failed++;
    if (compatibilityStatus.psu_power === false) failed++;
    if (compatibilityStatus.case_motherboard === false) failed++;
    const passed = totalChecks - failed;
    return Math.round((passed / totalChecks) * 100);
  }, [selectedComponents, compatibilityStatus]);

  const getCategoriesWithIssues = useCallback(() => {
    const issues = [];
    if (compatibilityStatus.cpu_motherboard === false) issues.push('cpu', 'motherboard');
    if (compatibilityStatus.ram_motherboard === false) issues.push('ram', 'motherboard');
    if (compatibilityStatus.psu_power === false) issues.push('psu');
    if (compatibilityStatus.case_motherboard === false) issues.push('case', 'motherboard');
    return new Set(issues);
  }, [compatibilityStatus]);

  const getSelectedComponentsCount = useCallback(() => {
    return Object.entries(selectedComponents)
      .filter(([category, component]) => component !== null && component !== undefined)
      .length;
  }, [selectedComponents]);

  const getRequiredComponentsCount = useCallback(() => {
    return 7; // cpu, motherboard, gpu, ram, storage, psu, case
  }, []);

  const getSelectedRequiredComponentsCount = useCallback(() => {
    const requiredCategories = ['cpu', 'motherboard', 'gpu', 'ram', 'storage', 'psu', 'case'];
    return requiredCategories.filter(category => {
      const component = selectedComponents[category];
      return component !== null && component !== undefined && Object.keys(component).length > 0;
    }).length;
  }, [selectedComponents]);

  const canSaveBuild = useCallback(() => {
    return getSelectedRequiredComponentsCount() >= 5;
  }, [getSelectedRequiredComponentsCount]);

  const getBuildPerformance = useCallback(() => {
    const components = selectedComponents;
    let gamingScore = 0;
    let workstationScore = 0;
    let coolingScore = 0;
    let upgradeScore = 0;

    if (components.gpu && components.cpu) {
      const gpuPrice = typeof components.gpu === 'object' ? (components.gpu.price || 0) : 0;
      const cpuPrice = typeof components.cpu === 'object' ? (components.cpu.price || 0) : 0;
      gamingScore = Math.min(100, (gpuPrice / 50000) * 100 + (cpuPrice / 30000) * 100);
    }

    if (components.cpu && components.ram) {
      const cpuCores = typeof components.cpu === 'object' ? (components.cpu.cores || 0) : 0;
      const ramCapacity = typeof components.ram === 'object' ? (components.ram.capacity || 0) : 0;
      workstationScore = Math.min(100, (cpuCores / 16) * 100 + (ramCapacity / 64) * 100);
    }

    if (components.cooler) {
      if (typeof components.cooler === 'object') {
        coolingScore = components.cooler.type === 'AIO Liquid Cooler' ? 100 : 
                      components.cooler.type === 'Air Cooler' ? 80 : 60;
      } else {
        coolingScore = 40;
      }
    } else {
      coolingScore = 40;
    }

    if (components.motherboard) {
      if (typeof components.motherboard === 'object') {
        upgradeScore = components.motherboard.ram_type === 'DDR5' ? 100 : 70;
      } else {
        upgradeScore = 70;
      }
    }

    return { gamingScore, workstationScore, coolingScore, upgradeScore };
  }, [selectedComponents]);

  const performance = useMemo(() => getBuildPerformance(), [getBuildPerformance]);

  const getComponentSelectionProgress = useCallback(() => {
    const requiredCategories = ['cpu', 'motherboard', 'gpu', 'ram', 'storage', 'psu', 'case'];
    const selectedCount = requiredCategories.filter(category => {
      const component = selectedComponents[category];
      return component !== null && component !== undefined && Object.keys(component).length > 0;
    }).length;
    return Math.round((selectedCount / requiredCategories.length) * 100);
  }, [selectedComponents]);

  const hasCompatibilityIssues = useCallback((category) => {
    const component = selectedComponents[category];
    if (!component) return false;

    switch (category) {
      case 'cpu':
        return compatibilityStatus.cpu_motherboard === false;
      case 'motherboard':
        return compatibilityStatus.cpu_motherboard === false || compatibilityStatus.ram_motherboard === false;
      case 'ram':
        return compatibilityStatus.ram_motherboard === false;
      case 'psu':
        return compatibilityStatus.psu_power === false;
      case 'case':
        return compatibilityStatus.case_motherboard === false;
      default:
        return false;
    }
  }, [selectedComponents, compatibilityStatus]);

  // Helper to check if there are any critical compatibility issues
  const hasCriticalCompatibilityIssues = Object.values(compatibilityStatus).some(status => status === false);

  // Save build function
  const isTokenExpired = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload.exp) return false;
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  };

  const [userLoading, setUserLoading] = useState(false);

  const handleSaveBuild = useCallback(async () => {
    if (!buildName.trim()) return;

    const token = localStorage.getItem('token');
    if (userLoading) {
      // Optionally show a spinner or just return
      return;
    }
    if (!token || isTokenExpired(token) || !user) {
      setShowAuthPrompt(true);
      return;
    }

    const filteredComponents = Object.fromEntries(
      Object.entries(selectedComponents)
        .filter(([key, comp]) => comp && typeof comp.id === 'number')
    );

    const requiredCategories = ['cpu', 'motherboard', 'gpu', 'ram', 'storage', 'psu', 'case'];
    const missingRequired = requiredCategories.filter(cat => !filteredComponents[cat]);
    if (missingRequired.length > 0) {
      alert('Please select valid components for: ' + missingRequired.join(', '));
      return;
    }

    setSavingBuild(true);
    try {
      const buildData = {
        name: buildName,
        description: buildDescription,
        components: filteredComponents,
        compatibility: getCompatibilityScore(),
        totalPrice: getTotalPrice()
      };
      
      const method = isEditing ? 'PUT' : 'POST';
      let url = isEditing 
        ? `/backend/api/index.php?endpoint=builds&id=${editingBuildId}`
        : `/backend/api/index.php?endpoint=builds`;
      
      // Debug: Check token and user
      console.log('=== DEBUG AUTHENTICATION ===');
      console.log('User object:', user);
      console.log('Token exists:', !!token);
      console.log('Token length:', token ? token.length : 0);
      console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'No token');
      console.log('Request URL:', url);
      console.log('Request method:', method);
      console.log('Request data:', buildData);
      
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(url, {
        method: method,
        headers,
        body: JSON.stringify(buildData)
      });
      
      console.log('=== RESPONSE DEBUG ===');
      console.log('Response status:', response.status);
      console.log('Response status text:', response.statusText);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const result = await response.json();
      console.log('Response body:', result);
      
      if (result.success) {
        setBuildName('');
        setBuildDescription('');
        setShowSaveModal(false);
        localStorage.removeItem('builditpc-selected-components');
        localStorage.removeItem('builditpc-editing-build');
        setIsEditing(false);
        setEditingBuildId(null);
        
        const successMessage = isEditing 
          ? 'Build updated successfully! You can view it in My Builds.'
          : 'Build saved successfully! You can view it in My Builds.';
        
        alert(successMessage);
        setCurrentPage('my-builds');
      } else {
        alert('Error saving build: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving build:', error);
      alert('Error saving build. Please try again.');
    } finally {
      setSavingBuild(false);
    }
  }, [buildName, buildDescription, selectedComponents, isEditing, editingBuildId, getCompatibilityScore, getTotalPrice, setCurrentPage, user, setUser, userLoading]);

  // Main useEffect for initialization and prebuilt selection
  useEffect(() => {
    // Prevent multiple initializations
    if (initializedRef.current) return;
    
    const initializeComponent = async () => {
      try {
        let initialComponents = getNormalizedComponents({});
        // Handle prebuilt components (IDs or objects)
        if (prebuiltComponents && Object.keys(prebuiltComponents).length > 0) {
          // Always fetch full components if any value is a number (ID)
          const hasIds = Object.values(prebuiltComponents).some(value => typeof value === 'number');
          if (hasIds) {
            const fullComponents = await fetchComponentsByIds(prebuiltComponents);
            initialComponents = getNormalizedComponents(fullComponents);
          } else {
            initialComponents = getNormalizedComponents(prebuiltComponents);
          }
        } else {
          // Load from localStorage
          const saved = localStorage.getItem('builditpc-selected-components');
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              initialComponents = getNormalizedComponents(parsed);
              const hasComponents = Object.values(parsed).some(component => component !== null);
              if (hasComponents) {
                setShowRestoreNotification(true);
                setTimeout(() => setShowRestoreNotification(false), 5000);
              }
            } catch (error) {
              console.error('Error parsing saved components:', error);
            }
          }
        }
        setSelectedComponents(initialComponents);
        setComponentsLoaded(true);
        if (onLoaded) onLoaded();
        // Check for editing build
        const editingBuildData = localStorage.getItem('builditpc-editing-build');
        if (editingBuildData) {
          try {
            const editingBuild = JSON.parse(editingBuildData);
            setIsEditing(true);
            setEditingBuildId(editingBuild.id);
            setBuildName(editingBuild.name || '');
            setBuildDescription(editingBuild.description || '');
          } catch (error) {
            console.error('Error parsing editing build data:', error);
          }
        }
        initializedRef.current = true;
      } catch (error) {
        console.error('Error initializing component:', error);
        setComponentsLoaded(true);
        initializedRef.current = true;
      }
    };
    initializeComponent();
  }, [prebuiltComponents]); // Only depend on prebuiltComponents

  // Compatibility check useEffect
  useEffect(() => {
    const issues = {};
    const details = {};

    // --- CPU-Motherboard compatibility ---
    if (selectedComponents.cpu && selectedComponents.motherboard) {
      function flattenFields(obj) {
        if (!obj) return '';
        let str = '';
        for (const key in obj) {
          if (typeof obj[key] === 'string') str += ' ' + obj[key];
          if (typeof obj[key] === 'object' && obj[key] !== null) str += ' ' + flattenFields(obj[key]);
        }
        return str.toLowerCase().replace(/\s+/g, ' ');
      }
      const cpuFlat = flattenFields(selectedComponents.cpu);
      const moboFlat = flattenFields(selectedComponents.motherboard);
      const cpuIsIntel = cpuFlat.includes('intel');
      const moboIsIntel = moboFlat.includes('intel');
      const cpuIsAMD = cpuFlat.includes('amd');
      const moboIsAMD = moboFlat.includes('amd');
      const cpuHasAM4 = cpuFlat.includes('am4');
      const moboHasAM4 = moboFlat.includes('am4');
      const cpuHasAM5 = cpuFlat.includes('am5');
      const moboHasAM5 = moboFlat.includes('am5');
      const cpuHasLGA1200 = cpuFlat.includes('lga1200');
      const moboHasLGA1200 = moboFlat.includes('lga1200');
      const cpuHasLGA1700 = cpuFlat.includes('lga1700');
      const moboHasLGA1700 = moboFlat.includes('lga1700');
      // Brand mismatch
      if ((cpuIsIntel && moboIsAMD) || (cpuIsAMD && moboIsIntel)) {
        issues.cpu_motherboard = false;
        details.cpu_motherboard = 'Intel and AMD CPUs are not compatible with each other\'s motherboards.';
      } else if ((cpuIsAMD && moboIsAMD && cpuHasAM4 && moboHasAM4)) {
        issues.cpu_motherboard = true;
        const moboIsB450 = moboFlat.includes('b450');
        const cpuIsRyzen5000 = cpuFlat.match(/ryzen\s*5[0-9]{3}/) || cpuFlat.match(/5600g|5700g|5800x|5900x|5950x/);
        if (moboIsB450 && cpuIsRyzen5000) {
          details.cpu_motherboard = 'Compatible (AM4). Note: B450 motherboards may require a BIOS update to support Ryzen 5000 series CPUs.';
        }
      } else if ((cpuIsAMD && moboIsAMD && cpuHasAM5 && moboHasAM5)) {
        issues.cpu_motherboard = true;
      } else if (
        cpuIsIntel && moboIsIntel && (
          (cpuHasLGA1200 && moboHasLGA1200) ||
          (cpuHasLGA1700 && moboHasLGA1700) ||
          (cpuFlat.match(/i[3579]-1[01][0-9]{3}/) &&
            (moboFlat.includes('h510') || moboFlat.includes('b460') || moboFlat.includes('b560') || moboFlat.includes('z490') || moboFlat.includes('z590') || moboFlat.includes('h610') || moboFlat.includes('b660') || moboFlat.includes('z690')))
        )
      ) {
        issues.cpu_motherboard = true;
      } else if (
        (cpuIsIntel || cpuIsAMD) && (moboIsIntel || moboIsAMD)
      ) {
        // Both brands are present but no match
        issues.cpu_motherboard = false;
        details.cpu_motherboard = 'CPU and Motherboard are not compatible. Please check socket and chipset.';
      } else {
        // Missing data, cannot determine
        details.cpu_motherboard = 'Cannot determine CPU-Motherboard compatibility (missing data)';
      }
    }

    // --- RAM-Motherboard compatibility ---
    if (selectedComponents.ram && selectedComponents.motherboard) {
      const ramType = getComponentSpec(selectedComponents.ram, 'ramType');
      const moboRamType = getComponentSpec(selectedComponents.motherboard, 'ramType');
      if (ramType && moboRamType) {
        if (ramType !== moboRamType) {
          issues.ram_motherboard = false;
          details.ram_motherboard = `RAM type (${ramType}) does not match Motherboard supported type (${moboRamType})`;
        } else {
          issues.ram_motherboard = true;
        }
      } else if (ramType || moboRamType) {
        details.ram_motherboard = 'Cannot determine RAM compatibility (missing data)';
      }
      // RAM sticks vs. motherboard slots
      const ramSticks = getComponentSpec(selectedComponents.ram, 'sticks') || getComponentSpec(selectedComponents.ram, 'modules') || 1;
      const moboSlots = getComponentSpec(selectedComponents.motherboard, 'ram_slots') || getComponentSpec(selectedComponents.motherboard, 'slots') || 2;
      if (ramSticks && moboSlots && ramSticks > moboSlots) {
        issues.ram_slots = false;
        details.ram_slots = `Selected RAM (${ramSticks} sticks) exceeds motherboard slots (${moboSlots})`;
      }
    }

    // --- Storage-Motherboard compatibility ---
    if (selectedComponents.storage && selectedComponents.motherboard) {
      const storageInterface = getComponentSpec(selectedComponents.storage, 'interface') || getComponentSpec(selectedComponents.storage, 'type');
      const moboStorage = getComponentSpec(selectedComponents.motherboard, 'storage_interfaces') || getComponentSpec(selectedComponents.motherboard, 'storage_support');
      if (storageInterface && moboStorage) {
        if (!String(moboStorage).toLowerCase().includes(String(storageInterface).toLowerCase())) {
          issues.storage_interface = false;
          details.storage_interface = `Storage interface (${storageInterface}) not supported by motherboard (${moboStorage})`;
        }
      } else if (storageInterface || moboStorage) {
        details.storage_interface = 'Cannot determine storage compatibility (missing data)';
      }
    }

    // --- PSU compatibility ---
    if (selectedComponents.psu) {
      const cpuTdp = getComponentSpec(selectedComponents.cpu, 'tdp') || 65;
      const gpuTdp = getComponentSpec(selectedComponents.gpu, 'tdp') || 150;
      const totalPower = cpuTdp + gpuTdp + 100;
      const recommendedWattage = Math.ceil((totalPower * 1.2) / 10) * 10;
      const psuWatt = getComponentSpec(selectedComponents.psu, 'wattage');
      if (psuWatt) {
        if (psuWatt < recommendedWattage) {
          issues.psu_power = false;
          details.psu_power = `PSU wattage (${psuWatt}W) is less than recommended (${recommendedWattage}W)`;
        } else {
          issues.psu_power = true;
        }
      } else {
        details.psu_power = 'Cannot determine PSU compatibility (missing wattage data)';
      }
      // PSU form factor vs. case
      if (selectedComponents.case) {
        const psuForm = getComponentSpec(selectedComponents.psu, 'form_factor') || getComponentSpec(selectedComponents.psu, 'type');
        const casePsuSupport = getComponentSpec(selectedComponents.case, 'psu_support') || getComponentSpec(selectedComponents.case, 'psu_type');
        if (psuForm && casePsuSupport) {
          if (!String(casePsuSupport).toLowerCase().includes(String(psuForm).toLowerCase())) {
            issues.psu_form_factor = false;
            details.psu_form_factor = `PSU form factor (${psuForm}) not supported by case (${casePsuSupport})`;
          }
        } else if (psuForm || casePsuSupport) {
          details.psu_form_factor = 'Cannot determine PSU form factor compatibility (missing data)';
        }
      }
    }

    // --- GPU-Case compatibility ---
    if (selectedComponents.gpu && selectedComponents.case) {
      const gpuLength = getComponentSpec(selectedComponents.gpu, 'length') || getComponentSpec(selectedComponents.gpu, 'max_length');
      const caseGpuMax = getComponentSpec(selectedComponents.case, 'gpu_max_length') || getComponentSpec(selectedComponents.case, 'max_gpu_length');
      if (gpuLength && caseGpuMax) {
        if (Number(gpuLength) > Number(caseGpuMax)) {
          issues.gpu_length = false;
          details.gpu_length = `GPU length (${gpuLength}mm) exceeds case max GPU length (${caseGpuMax}mm)`;
        }
      } else if (gpuLength || caseGpuMax) {
        details.gpu_length = 'Cannot determine GPU-case compatibility (missing data)';
      }
    }

    // --- Cooler-Case compatibility ---
    if (selectedComponents.cooler && selectedComponents.case) {
      const coolerHeight = getComponentSpec(selectedComponents.cooler, 'height') || getComponentSpec(selectedComponents.cooler, 'max_height');
      const caseCoolerMax = getComponentSpec(selectedComponents.case, 'cooler_max_height') || getComponentSpec(selectedComponents.case, 'max_cooler_height');
      if (coolerHeight && caseCoolerMax) {
        if (Number(coolerHeight) > Number(caseCoolerMax)) {
          issues.cooler_height = false;
          details.cooler_height = `Cooler height (${coolerHeight}mm) exceeds case max cooler height (${caseCoolerMax}mm)`;
        }
      } else if (coolerHeight || caseCoolerMax) {
        details.cooler_height = 'Cannot determine cooler-case compatibility (missing data)';
      }
    }

    // --- Case-Motherboard form factor compatibility ---
    if (selectedComponents.case && selectedComponents.motherboard) {
      const caseForm = getComponentSpec(selectedComponents.case, 'formFactor');
      const moboForm = getComponentSpec(selectedComponents.motherboard, 'formFactor');
      let fits = false;
      if (caseForm && moboForm) {
        const supportedForms = Array.isArray(caseForm)
          ? caseForm.map(f => f.toLowerCase())
          : String(caseForm).split(/,|\//).map(f => f.trim().toLowerCase());
        fits = supportedForms.includes(String(moboForm).toLowerCase());
        if (!fits) {
          issues.case_motherboard = false;
          details.case_motherboard = `Case form factor (${caseForm}) may not fit Motherboard form factor (${moboForm})`;
        } else {
          issues.case_motherboard = true;
        }
      } else if (caseForm || moboForm) {
        details.case_motherboard = 'Cannot determine case-motherboard compatibility (missing data)';
      }
    }

    setCompatibilityStatus(issues);
    setCompatibilityDetails(details);
  }, [selectedComponents, getComponentSpec]);

  // Save to localStorage
  useEffect(() => {
    const componentsJson = JSON.stringify(selectedComponents);
    const prevComponentsJson = prevComponentsRef.current;
    
    // Only save if the components have actually changed
    if (componentsJson !== prevComponentsJson) {
      localStorage.setItem('builditpc-selected-components', componentsJson);
      prevComponentsRef.current = componentsJson;
    }
  }, [selectedComponents]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isEditing) {
        localStorage.removeItem('builditpc-editing-build');
      }
      initializedRef.current = false;
    };
  }, [isEditing]);

  // Restore user state if token exists but user is null
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !user && typeof setUser === 'function') {
      setUserLoading(true);
      fetch('/backend/api/index.php?endpoint=profile', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.user) {
            setUser(data.user);
          }
        })
        .finally(() => setUserLoading(false));
    }
  }, [user, setUser]);

  // Show loading state
  if (!componentsLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Loading PC Assembly...</h3>
          <p className="text-gray-600">Please wait while we load your components.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Compatibility Banner */}
      {hasCriticalCompatibilityIssues && (
        <div className="bg-red-100 border border-red-300 text-red-800 px-6 py-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <span className="font-semibold">Compatibility Issues Detected!</span>
            <span className="text-sm">Some components are not compatible. Please review the issues below before saving your build.</span>
          </div>
          <button
            onClick={() => window.scrollTo({ top: document.getElementById('compatibility-checker')?.offsetTop || 0, behavior: 'smooth' })}
            className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Review Issues
          </button>
        </div>
      )}
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">PC Assembly</h1>
                {isEditing && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    <Edit className="w-4 h-4 mr-1" />
                    Editing Build
                  </span>
                )}
              </div>
              <p className="text-gray-600 mt-1">
                {isEditing ? 'Modify your existing build configuration' : 'Build your dream PC with confidence'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowTips(!showTips)}
                className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
              >
                <Lightbulb className="w-4 h-4" />
                {showTips ? 'Hide Tips' : 'Show Tips'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Restore Notification */}
      {showRestoreNotification && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 mb-4">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-green-900">Components Restored</h3>
                  <p className="text-sm text-green-700">Your previously selected components have been restored from your last session.</p>
                </div>
              </div>
              <button
                onClick={() => setShowRestoreNotification(false)}
                className="flex-shrink-0 p-1 text-green-400 hover:text-green-600 hover:bg-green-100 rounded-full transition-colors duration-200"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Content Area */}
          <div className="xl:col-span-3 space-y-8">
            {/* Progress Steps */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Build Progress</h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>{getSelectedRequiredComponentsCount()}</span>
                  <span>/</span>
                  <span>{getRequiredComponentsCount()}</span>
                  <span>components</span>
                </div>
              </div>
              
              <div className="grid grid-cols-4 lg:grid-cols-8 gap-4">
                {componentCategories.map((category, index) => {
                  const isSelected = selectedComponents[category.key];
                  const isActive = index + 1 === activeStep;
                  const isCompleted = index + 1 < activeStep;
                  // For Processor and Motherboard, always show green, never warning
                  let hasIssues = false;
                  if (category.key === 'cpu' || category.key === 'motherboard') {
                    hasIssues = false;
                  } else {
                    const categoriesWithIssues = getCategoriesWithIssues();
                    hasIssues = categoriesWithIssues.has(category.key);
                  }
                  const IconComponent = category.icon;
                  return (
                    <div
                      key={category.key}
                      className={`relative group cursor-pointer ${isActive ? 'scale-105' : ''}`}
                      onClick={() => setActiveStep(index + 1)}
                    >
                      <div className={`
                        w-full aspect-square rounded-lg border-2 flex flex-col items-center justify-center p-2 transition-all duration-200
                        ${isSelected 
                          ? 'bg-green-50 border-green-500 text-green-700'
                          : isActive 
                          ? 'bg-blue-50 border-blue-500 text-blue-700' 
                          : isCompleted
                          ? 'bg-gray-50 border-gray-300 text-gray-600'
                          : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                        }
                      `}>
                        <IconComponent className={`w-6 h-6 mb-1 ${
                          isSelected 
                            ? 'text-green-600' 
                            : isActive 
                              ? 'text-blue-600' 
                              : ''
                        }`} />
                        <span className="text-xs font-medium text-center leading-tight">
                          {category.name}
                        </span>
                        {isSelected && (
                          <CheckCircle className="w-4 h-4 text-green-600 absolute -top-1 -right-1" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tips Section */}
            {showTips && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Lightbulb className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-blue-900">Building Tips</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                  <div className="flex items-start gap-2">
                    <Target className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                    <span>Start with CPU and motherboard - they determine compatibility for other parts</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                    <span>Ensure your power supply has enough wattage for all components</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                    <span>Consider future upgrades when choosing motherboard and case</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                    <span>Don't rush - take time to research and compare components</span>
                  </div>
                </div>
              </div>
            )}

            {/* Component Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
                <div className="flex items-center gap-3">
                  {(() => {
                    const currentCategory = getCurrentCategory();
                    const IconComponent = currentCategory.icon;
                    return <IconComponent className="w-6 h-6 text-white" />;
                  })()}
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      Select {getCurrentCategory().name}
                    </h2>
                    <p className="text-green-100 text-sm">
                      {getCurrentCategory().description}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <ComponentSelector 
                  selectedComponents={selectedComponents}
                  onComponentSelect={handleComponentSelect}
                  onComponentRemove={handleComponentRemove}
                  activeCategory={getCurrentCategory().key}
                  recommendations={recommendations[getCurrentCategory().key] || []}
                  loadingRecommendations={loadingRecommendations[getCurrentCategory().key] || false}
                  compatibilityIssues={getCompatibilitySuggestions(getCurrentCategory().key) || []}
                />
              </div>
            </div>

            {/* Performance Analysis */}
            {getSelectedRequiredComponentsCount() >= 3 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Performance Analysis</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Monitor className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-900">Gaming</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-700">
                      {Math.round(performance.gamingScore)}%
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${performance.gamingScore}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Settings className="w-5 h-5 text-purple-600" />
                      <span className="font-medium text-purple-900">Workstation</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-700">
                      {Math.round(performance.workstationScore)}%
                    </div>
                    <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${performance.workstationScore}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Thermometer className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-900">Cooling</span>
                    </div>
                    <div className="text-2xl font-bold text-green-700">
                      {Math.round(performance.coolingScore)}%
                    </div>
                    <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${performance.coolingScore}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowRight className="w-5 h-5 text-orange-600" />
                      <span className="font-medium text-orange-900">Upgrade Path</span>
                    </div>
                    <div className="text-2xl font-bold text-orange-700">
                      {Math.round(performance.upgradeScore)}%
                    </div>
                    <div className="w-full bg-orange-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-orange-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${performance.upgradeScore}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Compatibility Status */}
            <CompatibilityChecker 
              compatibilityStatus={compatibilityStatus}
              compatibilityScore={getCompatibilityScore()}
              compatibilityDetails={compatibilityDetails}
              selectionProgress={getComponentSelectionProgress()}
            />

            {/* Build Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Build Summary</h3>
                  <p className="text-sm text-gray-600">
                    {getSelectedRequiredComponentsCount()} of {getRequiredComponentsCount()} required components
                  </p>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Build Progress</span>
                  <span>{Math.round((getSelectedRequiredComponentsCount() / getRequiredComponentsCount()) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${(getSelectedRequiredComponentsCount() / getRequiredComponentsCount()) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Selected Components */}
              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                {Object.entries(selectedComponents).map(([category, component]) => (
                  component && (
                    <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-green-600">
                            {category === 'motherboard' ? 'MB' : 
                             category === 'gpu' ? 'GPU' : 
                             category === 'storage' ? 'SSD' : 
                             category === 'psu' ? 'PSU' : 
                             category === 'cooler' ? 'FAN' : 
                             category.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{component.name}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="font-semibold text-green-600">₱{component.price.toLocaleString()}</span>
                            <span>•</span>
                            <span className="truncate">
                              {component.socket && `Socket: ${component.socket}`}
                              {component.memory && `Memory: ${component.memory}`}
                              {component.type && component.speed && `${component.type} ${component.speed}`}
                              {component.capacity && `Capacity: ${component.capacity}`}
                              {component.wattage && `${component.wattage}W`}
                              {component.size && `Size: ${component.size}`}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleComponentRemove(category)}
                          className="p-1.5 text-red-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                          title="Remove component"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                ))}
                
                {getSelectedComponentsCount() === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm font-medium">No components selected yet</p>
                    <p className="text-xs">Start building by selecting components</p>
                  </div>
                )}
              </div>

              {/* Price Summary */}
              <div className="border-t pt-6">
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">₱{getTotalPrice().toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-lg font-semibold border-t pt-3">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-2xl font-bold text-green-600">
                      ₱{getTotalPrice().toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Actions: Save Build & Complete Build */}
                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => setShowSaveModal(true)}
                    className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-lg transition-colors ${
                      user 
                        ? 'bg-green-600 text-white shadow-md hover:bg-green-700' 
                        : 'bg-gray-400 text-white cursor-not-allowed'
                    }`}
                    disabled={!user}
                    title={!user ? 'Please log in to save builds' : ''}
                  >
                    <Save className="w-5 h-5" />
                    {isEditing ? 'Update Build' : 'Save Build'}
                    {!user && <span className="text-xs ml-2">(Login Required)</span>}
                  </button>
                  <button
                    onClick={() => {
                      // Add logic for completing the build / proceeding to order
                      alert('Proceeding to order confirmation (feature coming soon!).');
                    }}
                    className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-lg transition-all duration-200 ${
                      getSelectedRequiredComponentsCount() === getRequiredComponentsCount()
                        ? getCompatibilityScore() === 100
                          ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                          : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    disabled={getSelectedRequiredComponentsCount() < getRequiredComponentsCount()}
                  >
                    {getSelectedRequiredComponentsCount() === getRequiredComponentsCount() 
                      ? getCompatibilityScore() === 100
                        ? (
                          <div className="flex items-center justify-center gap-2">
                            <ShoppingCart className="w-5 h-5" />
                            <span>Complete Build!</span>
                          </div>
                        )
                        : (
                          <div className="flex items-center justify-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            <span>Complete Build (with warnings)</span>
                          </div>
                        )
                      : `Select ${getRequiredComponentsCount() - getSelectedRequiredComponentsCount()} more components`
                    }
                  </button>
                  <button
                    onClick={handleClearAllComponents}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-lg bg-red-600 text-white shadow-md hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                    Clear All
                  </button>
                </div>
                
                {getSelectedRequiredComponentsCount() === getRequiredComponentsCount() && (
                  <div className="text-center text-sm mt-4 p-3 rounded-lg">
                    {getCompatibilityScore() === 100 ? (
                      <div className="text-green-600 bg-green-50">
                        <p className="font-medium">✅ Ready to proceed with your build!</p>
                        {!selectedComponents.cooler && (
                          <p className="text-yellow-600 mt-1 text-xs">
                            💡 Consider adding an aftermarket cooler for better performance
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-orange-600 bg-orange-50">
                        <p className="font-medium">⚠️ Build ready with compatibility warnings</p>
                        <p className="text-xs mt-1">
                          Your build can be completed, but consider reviewing the warnings above for optimal performance
                        </p>
                        {!selectedComponents.cooler && (
                          <p className="text-yellow-600 mt-1 text-xs">
                            💡 Consider adding an aftermarket cooler for better performance
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Build Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Save className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {isEditing ? 'Update Your Build' : 'Save Your Build'}
                </h2>
              </div>
              <button
                onClick={() => setShowSaveModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-6">
                <label htmlFor="build-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Build Name *
                </label>
                <input
                  id="build-name"
                  type="text"
                  value={buildName}
                  onChange={(e) => setBuildName(e.target.value)}
                  placeholder="e.g., Gaming Beast Pro, Workstation Build"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={50}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {buildName.length}/50 characters
                </p>
              </div>

              <div className="mb-6">
                <label htmlFor="build-description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  id="build-description"
                  value={buildDescription}
                  onChange={(e) => setBuildDescription(e.target.value)}
                  placeholder="Describe your build, intended use, or any special features..."
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {buildDescription.length}/200 characters
                </p>
              </div>

              {/* Build Summary */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Build Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Components:</span>
                    <span className="font-medium">{getSelectedRequiredComponentsCount()}/{getRequiredComponentsCount()} selected</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Compatibility:</span>
                    <span className="font-medium text-green-600">{getCompatibilityScore()}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Price:</span>
                    <span className="font-medium text-green-600">₱{getTotalPrice().toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveBuild}
                  className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white text-lg transition-colors shadow-sm
                  ${hasCriticalCompatibilityIssues ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                  disabled={hasCriticalCompatibilityIssues || savingBuild}
                  title={hasCriticalCompatibilityIssues ? 'Cannot save build due to compatibility issues.' : 'Save your build'}
                >
                  {savingBuild ? (
                    <>
                      <span className="animate-spin inline-block mr-2"><svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {isEditing ? 'Update Build' : 'Save Build'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Authentication Prompt Modal */}
      {showAuthPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-orange-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Login Required
                </h2>
              </div>
              <button
                onClick={() => setShowAuthPrompt(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Save Your Build
                </h3>
                <p className="text-gray-600">
                  You need to be logged in to save your PC build configuration. 
                  This will allow you to access your builds later and share them with others.
                </p>
              </div>

              {/* Build Preview */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Your Build Preview</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Components:</span>
                    <span className="font-medium">{getSelectedRequiredComponentsCount()}/{getRequiredComponentsCount()} selected</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Compatibility:</span>
                    <span className="font-medium text-green-600">{getCompatibilityScore()}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Price:</span>
                    <span className="font-medium text-green-600">₱{getTotalPrice().toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setShowAuthPrompt(false);
                    onShowAuth('login');
                  }}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <LogIn className="w-5 h-5" />
                  Login to Save Build
                </button>
                <button
                  onClick={() => {
                    setShowAuthPrompt(false);
                    onShowAuth('register');
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <User className="w-5 h-5" />
                  Create Account
                </button>
                <button
                  onClick={() => setShowAuthPrompt(false)}
                  className="w-full px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Continue building without saving
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PCAssembly 