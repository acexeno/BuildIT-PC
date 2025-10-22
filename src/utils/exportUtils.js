/**
 * Export utility functions for inventory data
 */

/**
 * Convert inventory data to CSV format
 * @param {Array} inventoryData - Array of inventory items
 * @param {Array} categories - Array of category data
 * @returns {string} CSV formatted string
 */
export const exportToCSV = (inventoryData, categories = []) => {
  if (!inventoryData || inventoryData.length === 0) {
    return '';
  }

  // Helper function to get category name
  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === Number(categoryId));
    return category ? category.name : categoryId;
  };

  // Helper function to get main category
  const getMainCategory = (item) => {
    const cat = categories.find(c => c.id === Number(item.category_id));
    if (!cat) return 'Unknown';
    
    const mainCategories = {
      'CPU': ['CPU', 'Procie Only', 'Pro & Mobo - Amd', 'Pro & Mobo - Intel'],
      'Motherboard': ['Motherboard', 'Mobo', 'Pro & Mobo - Amd', 'Pro & Mobo - Intel'],
      'GPU': ['GPU'],
      'RAM': ['RAM', 'Ram 3200mhz'],
      'Storage': ['Storage', 'Ssd Nvme'],
      'PSU': ['PSU', 'Psu - Tr'],
      'Case': ['Case', 'Case Gaming'],
      'Cooler': ['Cooler', 'Aio']
    };

    for (const [mainCat, names] of Object.entries(mainCategories)) {
      if (names.includes(cat.name)) return mainCat;
    }
    return cat.name;
  };

  // Helper function to get stock status
  const getStockStatus = (item) => {
    const stock = item.stock_quantity ?? item.stock;
    const price = Number(item.price);
    
    if (stock === 0) return 'Out of Stock';
    if (price === 0) return 'No Price';
    if (stock > 0 && stock <= 5) return 'Low Stock';
    return 'In Stock';
  };

  // CSV headers
  const headers = [
    'ID',
    'Name',
    'Category',
    'Main Category',
    'Brand',
    'Price',
    'Stock Quantity',
    'Stock Status',
    'Description',
    'Image URL',
    'Created At',
    'Updated At'
  ];

  // Convert data to CSV rows
  const rows = inventoryData.map(item => [
    item.id || '',
    `"${(item.name || '').replace(/"/g, '""')}"`, // Escape quotes in name
    `"${getCategoryName(item.category_id)}"`,
    `"${getMainCategory(item)}"`,
    `"${(item.brand || '').replace(/"/g, '""')}"`,
    item.price || '0',
    item.stock_quantity ?? item.stock ?? '0',
    `"${getStockStatus(item)}"`,
    `"${(item.description || '').replace(/"/g, '""')}"`,
    `"${item.image_url || ''}"`,
    `"${item.created_at || ''}"`,
    `"${item.updated_at || ''}"`
  ]);

  // Combine headers and rows
  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  
  return csvContent;
};

/**
 * Export inventory data as CSV file download
 * @param {Array} inventoryData - Array of inventory items
 * @param {Array} categories - Array of category data
 * @param {string} filename - Optional filename (default: inventory-export.csv)
 */
export const downloadCSV = (inventoryData, categories = [], filename = 'inventory-export.csv') => {
  const csvContent = exportToCSV(inventoryData, categories);
  
  if (!csvContent) {
    alert('No data to export');
    return;
  }

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

/**
 * Export inventory data as Excel file (using SheetJS library)
 * @param {Array} inventoryData - Array of inventory items
 * @param {Array} categories - Array of category data
 * @param {string} filename - Optional filename (default: inventory-export.xlsx)
 */
export const downloadExcel = (inventoryData, categories = [], filename = 'inventory-export.xlsx') => {
  // Check if SheetJS is available
  if (typeof XLSX === 'undefined') {
    console.error('SheetJS library not loaded. Please include xlsx library for Excel export.');
    alert('Excel export requires SheetJS library. Falling back to CSV export.');
    downloadCSV(inventoryData, categories, filename.replace('.xlsx', '.csv'));
    return;
  }

  if (!inventoryData || inventoryData.length === 0) {
    alert('No data to export');
    return;
  }

  // Helper functions (same as CSV)
  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === Number(categoryId));
    return category ? category.name : categoryId;
  };

  const getMainCategory = (item) => {
    const cat = categories.find(c => c.id === Number(item.category_id));
    if (!cat) return 'Unknown';
    
    const mainCategories = {
      'CPU': ['CPU', 'Procie Only', 'Pro & Mobo - Amd', 'Pro & Mobo - Intel'],
      'Motherboard': ['Motherboard', 'Mobo', 'Pro & Mobo - Amd', 'Pro & Mobo - Intel'],
      'GPU': ['GPU'],
      'RAM': ['RAM', 'Ram 3200mhz'],
      'Storage': ['Storage', 'Ssd Nvme'],
      'PSU': ['PSU', 'Psu - Tr'],
      'Case': ['Case', 'Case Gaming'],
      'Cooler': ['Cooler', 'Aio']
    };

    for (const [mainCat, names] of Object.entries(mainCategories)) {
      if (names.includes(cat.name)) return mainCat;
    }
    return cat.name;
  };

  const getStockStatus = (item) => {
    const stock = item.stock_quantity ?? item.stock;
    const price = Number(item.price);
    
    if (stock === 0) return 'Out of Stock';
    if (price === 0) return 'No Price';
    if (stock > 0 && stock <= 5) return 'Low Stock';
    return 'In Stock';
  };

  // Prepare data for Excel
  const excelData = inventoryData.map(item => ({
    'ID': item.id || '',
    'Name': item.name || '',
    'Category': getCategoryName(item.category_id),
    'Main Category': getMainCategory(item),
    'Brand': item.brand || '',
    'Price': Number(item.price) || 0,
    'Stock Quantity': Number(item.stock_quantity ?? item.stock) || 0,
    'Stock Status': getStockStatus(item),
    'Description': item.description || '',
    'Image URL': item.image_url || '',
    'Created At': item.created_at || '',
    'Updated At': item.updated_at || ''
  }));

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  const colWidths = [
    { wch: 8 },   // ID
    { wch: 30 },  // Name
    { wch: 15 },  // Category
    { wch: 15 },  // Main Category
    { wch: 12 },  // Brand
    { wch: 10 },  // Price
    { wch: 12 },  // Stock Quantity
    { wch: 12 },  // Stock Status
    { wch: 40 },  // Description
    { wch: 30 },  // Image URL
    { wch: 20 },  // Created At
    { wch: 20 }   // Updated At
  ];
  ws['!cols'] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Inventory');

  // Generate and download file
  XLSX.writeFile(wb, filename);
};

/**
 * Export filtered inventory data based on current filters
 * @param {Array} allInventory - Complete inventory array
 * @param {string} searchTerm - Search term filter
 * @param {string} selectedCategory - Selected category filter
 * @param {string} selectedBrand - Selected brand filter
 * @param {Array} categories - Array of category data
 * @param {string} format - Export format ('csv' or 'excel')
 * @param {string} filename - Optional filename
 */
export const exportFilteredInventory = (
  allInventory, 
  searchTerm, 
  selectedCategory, 
  selectedBrand, 
  categories, 
  format = 'csv',
  filename = null
) => {
  // Apply same filtering logic as the inventory components
  const mainCategories = [
    { key: 'CPU', names: ['CPU', 'Procie Only', 'Pro & Mobo - Amd', 'Pro & Mobo - Intel'] },
    { key: 'Motherboard', names: ['Motherboard', 'Mobo', 'Pro & Mobo - Amd', 'Pro & Mobo - Intel'] },
    { key: 'GPU', names: ['GPU'] },
    { key: 'RAM', names: ['RAM', 'Ram 3200mhz'] },
    { key: 'Storage', names: ['Storage', 'Ssd Nvme'] },
    { key: 'PSU', names: ['PSU', 'Psu - Tr'] },
    { key: 'Case', names: ['Case', 'Case Gaming'] },
    { key: 'Cooler', names: ['Cooler', 'Aio'] }
  ];

  const getMainCategoryKey = (item) => {
    const cat = categories.find(c => c.id === Number(item.category_id));
    if (!cat) return null;
    for (const mainCat of mainCategories) {
      if (mainCat.names.includes(cat.name)) return mainCat.key;
    }
    return null;
  };

  // Filter inventory
  let filtered = allInventory.filter(item => {
    const mainCat = getMainCategoryKey(item);
    if (!mainCat) return false;
    if (selectedCategory !== 'all' && mainCat !== selectedCategory) return false;
    if (selectedBrand !== 'all') {
      if (!item.brand) return false;
      if (selectedBrand.toLowerCase() === 'amd' || selectedBrand.toLowerCase() === 'intel') {
        if (item.brand.toLowerCase() !== selectedBrand.toLowerCase()) return false;
      } else {
        if (item.brand.toLowerCase() !== selectedBrand.toLowerCase()) return false;
      }
    }
    return true;
  });

  // Apply search filter
  if (searchTerm.trim() !== '') {
    filtered = filtered.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }

  // Generate filename with timestamp if not provided
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const defaultFilename = `inventory-export-${timestamp}.${format === 'excel' ? 'xlsx' : 'csv'}`;
  const finalFilename = filename || defaultFilename;

  // Export based on format
  if (format === 'excel') {
    downloadExcel(filtered, categories, finalFilename);
  } else {
    downloadCSV(filtered, categories, finalFilename);
  }

  return filtered.length; // Return count of exported items
};
