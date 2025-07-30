import React, { useState, useEffect } from 'react'
import {
  BarChart3,
  Users,
  Settings,
  Shield,
  UserPlus,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  DollarSign,
  Database,
  Activity,
  Package,
  Wrench,
  FileText,
  MessageSquare,
  Plus,
  Bell,
  Cpu,
  Monitor,
  MemoryStick,
  HardDrive,
  Zap,
  Server,
  Thermometer,
  Check
} from 'lucide-react'
import { useNotifications } from '../contexts/NotificationContext'
import { getComponentImage } from '../utils/componentImages'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import SuperAdminPrebuiltPCs from './SuperAdminPrebuiltPCs.jsx'
import SuperAdminPCAssembly from './SuperAdminPCAssembly.jsx'
import AdminReports from '../components/AdminReports';

const formalCategoryNames = {
  "Aio": "CPU Cooler (AIO)",
  "Case Gaming": "PC Case (Gaming)",
  "GPU": "Graphics Card (GPU)",
  "Mobo": "Motherboard",
  "Procie Only": "Processor (CPU)",
  "PSU": "Power Supply (PSU)",
  "Psu - Tr": "Power Supply (PSU, True Rated)",
  "Ram 3200mhz": "Memory (RAM, 3200MHz)",
  "Ssd Nvme": "Storage (SSD NVMe)",
  "Cooler": "CPU Cooler",
  "RAM": "Memory (RAM)",
  "Storage": "Storage",
  "Case": "PC Case",
  "Motherboard": "Motherboard",
  "CPU": "Processor (CPU)"
};

const PesoSign = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 20V6a4 4 0 0 0-4-4H7v18" />
    <path d="M7 10h8" />
    <path d="M7 6h8" />
    <path d="M7 14h8" />
  </svg>
);

const InventoryManagement = ({ inventory, categories }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [modalItem, setModalItem] = useState(null);

  // Main component types for dropdown
  const mainCategories = [
    { key: 'CPU', names: ['CPU', 'Procie Only', 'Pro & Mobo - Amd', 'Pro & Mobo - Intel'] },
    { key: 'Motherboard', names: ['Motherboard', 'Mobo', 'Pro & Mobo - Amd', 'Pro & Mobo - Intel'] },
    { key: 'GPU', names: ['GPU'] },
    { key: 'RAM', names: ['RAM', 'Ram 3200mhz'] },
    { key: 'Storage', names: ['Storage', 'Ssd Nvme'] },
    { key: 'PSU', names: ['PSU', 'Psu - Tr'] },
    { key: 'Case', names: ['Case', 'Case Gaming'] },
    { key: 'Cooler', names: ['Cooler', 'Aio'] },
  ];

  // Map category key to all matching category ids
  const categoryKeyToIds = {};
  mainCategories.forEach(cat => {
    categoryKeyToIds[cat.key] = categories
      .filter(c => cat.names.includes(c.name))
      .map(c => String(c.id));
  });

  // Helper to get main category key for an item
  const getMainCategoryKey = (item) => {
    const cat = categories.find(c => c.id === Number(item.category_id));
    if (!cat) return null;
    for (const mainCat of mainCategories) {
      if (mainCat.names.includes(cat.name)) return mainCat.key;
    }
    return null;
  };

  // Get all brands from filtered computer components only
  const filteredComponentItems = inventory.filter(item => getMainCategoryKey(item));
  const allBrands = Array.from(new Set(
    filteredComponentItems
      .map(item => (item.brand || '').trim())
      .filter(Boolean)
      .map(b => b.toLowerCase())
  ));
  // Normalize to title case for display
  const displayBrands = allBrands.map(b => b.charAt(0).toUpperCase() + b.slice(1));
  // Always include AMD and Intel if present
  const brandOptions = ['all'];
  if (allBrands.includes('amd')) brandOptions.push('AMD');
  if (allBrands.includes('intel')) brandOptions.push('Intel');
  // Add the rest, excluding AMD/Intel
  brandOptions.push(...displayBrands.filter(b => b !== 'Amd' && b !== 'Intel'));

  // Filtering logic
  let filtered = inventory.filter(item => {
    const mainCat = getMainCategoryKey(item);
    if (!mainCat) return false;
    if (selectedCategory !== 'all' && mainCat !== selectedCategory) return false;
    if (selectedBrand !== 'all') {
      if (!item.brand) return false;
      // Case-insensitive match
      if (selectedBrand.toLowerCase() === 'amd' || selectedBrand.toLowerCase() === 'intel') {
        if (item.brand.toLowerCase() !== selectedBrand.toLowerCase()) return false;
      } else {
        if (item.brand.toLowerCase() !== selectedBrand.toLowerCase()) return false;
      }
    }
    return true;
  });
  if (searchTerm.trim() !== '') {
    filtered = filtered.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'price') return Number(b.price) - Number(a.price);
    if (sortBy === 'stock') return Number(a.stock_quantity || a.stock) - Number(b.stock_quantity || b.stock);
    if (sortBy === 'category') return (getMainCategoryKey(a) || '').localeCompare(getMainCategoryKey(b) || '');
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
        <button className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>
      {/* Search, Filter, Sort Controls */}
      <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between mb-2">
        <div className="flex gap-2 flex-1">
          <input
            type="text"
            placeholder="Search by name or brand..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="px-4 py-2 border rounded-lg w-full md:w-64"
            style={{ minHeight: '42px' }}
          />
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border rounded-lg"
            style={{ minHeight: '42px' }}
          >
            <option value="all">All Components</option>
            {mainCategories.map(cat => (
              <option key={cat.key} value={cat.key}>{cat.key}</option>
            ))}
          </select>
          <select
            value={selectedBrand}
            onChange={e => setSelectedBrand(e.target.value)}
            className="px-4 py-2 border rounded-lg"
            style={{ minHeight: '42px' }}
          >
            <option value="all">All Brands</option>
            {brandOptions.filter(b => b !== 'all').map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-4 py-2 border rounded-lg"
            style={{ minHeight: '42px' }}
          >
            <option value="name">Sort by Name</option>
            <option value="price">Sort by Price</option>
            <option value="stock">Sort by Stock</option>
            <option value="category">Sort by Category</option>
          </select>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full table-fixed divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 w-2/6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-2 py-3 w-1/6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-2 py-3 w-1/12 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="px-2 py-3 w-1/12 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-2 py-3 w-1/12 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-2 py-3 w-1/12 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.length > 0 ? filtered.map((item) => {
              const imgSrc = getComponentImage(item.name);
              return (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-normal text-sm font-medium text-gray-900 break-words max-w-xs flex items-center gap-3" style={{ maxWidth: '320px' }} title={item.name}>
                    <img
                      src={imgSrc}
                      alt={item.name}
                      className="w-12 h-12 object-contain rounded border cursor-pointer hover:shadow-lg transition duration-150"
                      onClick={() => setModalItem(item)}
                      onError={e => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/48?text=No+Image'; }}
                    />
                    <span className="align-middle">{item.name}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getMainCategoryKey(item)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.stock_quantity ?? item.stock}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₱{item.price}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      const stock = item.stock_quantity ?? item.stock;
                      const price = Number(item.price);
                      if (stock === 0) {
                        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Out of Stock</span>;
                      } else if (price === 0) {
                        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-800">No Price</span>;
                      } else if (stock > 0 && stock <= 5) {
                        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Low Stock</span>;
                      } else {
                        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">In Stock</span>;
                      }
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            }) : <tr><td colSpan="6" className="text-center py-4">No inventory data available.</td></tr>}
          </tbody>
        </table>
      </div>
      {/* Modal for enlarged image and details */}
      {modalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setModalItem(null)}>
          <div className="bg-white rounded-xl shadow-2xl p-0 relative w-full max-w-4xl flex flex-col md:flex-row items-stretch" onClick={e => e.stopPropagation()}>
            {/* Close Button */}
            <button className="absolute top-4 right-4 bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-600 rounded-full p-3 transition-colors shadow text-2xl" onClick={() => setModalItem(null)} aria-label="Close modal">
              <span className="sr-only">Close</span>
              &times;
            </button>
            {/* Image Section */}
            <div className="flex-shrink-0 flex items-center justify-center bg-gray-50 rounded-l-xl md:rounded-l-xl md:rounded-r-none p-10 md:w-1/2 w-full border-b md:border-b-0 md:border-r">
              <div className="flex items-center justify-center w-full max-w-[500px] max-h-[400px] bg-white rounded border overflow-hidden">
                <img src={getComponentImage(modalItem.name)} alt={modalItem.name} className="max-w-full max-h-[400px] object-contain" />
              </div>
            </div>
            {/* Details Section */}
            <div className="flex-1 flex flex-col justify-center p-10 md:w-1/2 w-full">
              <div className="text-3xl font-extrabold text-gray-900 mb-4 text-center md:text-left">{modalItem.name}</div>
              <div className="mb-6 flex flex-wrap gap-3 justify-center md:justify-start">
                <span className="inline-block bg-gray-100 text-gray-700 rounded px-3 py-1 text-base font-semibold">ID: {modalItem.id}</span>
                <span className="inline-block bg-blue-100 text-blue-700 rounded px-3 py-1 text-base font-semibold">{getMainCategoryKey(modalItem)}</span>
                <span className="inline-block bg-green-100 text-green-700 rounded px-3 py-1 text-base font-semibold">Brand: {modalItem.brand || '-'}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-lg text-gray-700 mb-6">
                <div className="flex items-center font-semibold"><span className="mr-2 text-blue-600 text-2xl font-bold align-middle">₱</span>Price:</div>
                <div className="font-bold text-green-700 text-xl">₱{modalItem.price}</div>
                <div className="flex items-center font-semibold"><span className="mr-2"><svg className="w-5 h-5 text-yellow-500 inline" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg></span>Stock:</div>
                <div className="text-lg">{modalItem.stock_quantity ?? modalItem.stock}</div>
              </div>
              {/* Extra details if available */}
              {modalItem.specs && typeof modalItem.specs === 'object' && Object.keys(modalItem.specs).length > 0 && (
                <div className="mb-2">
                  <div className="font-semibold text-gray-800 mb-2 text-lg">Specs:</div>
                  <ul className="list-disc list-inside text-base text-gray-600">
                    {Object.entries(modalItem.specs).map(([key, value]) => (
                      <li key={key}><span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span> {String(value)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const OrdersManagement = ({ orders }) => (
  <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <h2 className="text-2xl font-bold text-gray-900">Orders Management</h2>
      <button className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm">
        <Plus className="h-4 w-4" />
        Add Order
      </button>
    </div>
    <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {(orders && orders.length > 0) ? orders.map((order) => (
            <tr key={order.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{order.id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.user_id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₱{order.total_price}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                  order.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {order.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.order_date}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                <button className="text-blue-600 hover:text-blue-900">
                  <Edit className="h-4 w-4" />
                </button>
                <button className="text-red-600 hover:text-red-900">
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          )) : <tr><td colSpan="6" className="text-center py-4">No order data available.</td></tr>}
        </tbody>
      </table>
    </div>
  </div>
);

const SuperAdminNotifications = () => {
  const {
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    unreadCount
  } = useNotifications();
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [expanded, setExpanded] = useState({}); // Track expanded grouped notifications

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });

  // Helper to detect grouped notification
  const isGroupedNotification = (n) =>
    n.type === 'stock' && (n.title === 'Low Stock: Multiple Components' || n.title === 'Out of Stock: Multiple Components');

  // Helper to parse component list from grouped message
  const parseComponentList = (message) => {
    // Extract the part between ':' and '.'
    const match = message.match(/: (.+?)\./);
    if (match && match[1]) {
      return match[1].split(',').map(s => s.trim());
    }
    return [];
  };

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
            <Bell className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-500">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="all">All Notifications</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
            >
              Mark All as Read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete all notifications?')) {
                  deleteAllNotifications();
                }
              }}
              className="px-4 py-2 bg-gray-300 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-400 transition-colors"
            >
              Delete All
            </button>
          )}
        </div>
      </div>
      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'all' ? 'No notifications yet' : `No ${filter} notifications`}
            </h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? 'You\'ll see important updates here when they arrive.'
                : `You have no ${filter} notifications at the moment.`
              }
            </p>
          </div>
        ) : (
          filteredNotifications.map((n) => {
            const grouped = isGroupedNotification(n);
            const components = grouped ? parseComponentList(n.message) : [];
            return (
              <div
                key={n.id}
                className={`bg-white rounded-lg border border-gray-200 p-4 transition-all duration-200 hover:shadow-md ${
                  !n.read ? 'border-l-4 border-red-500 bg-red-50' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <Bell className={`w-5 h-5 ${n.read ? 'text-gray-400' : 'text-red-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className={`text-sm font-medium ${!n.read ? 'text-gray-900' : 'text-gray-700'}`}>{n.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                        {grouped && components.length > 0 && (
                          <div className="mt-2">
                            <button
                              className="text-xs text-red-600 underline hover:text-red-800 font-semibold mb-1"
                              onClick={() => setExpanded(prev => ({ ...prev, [n.id]: !prev[n.id] }))}
                            >
                              {expanded[n.id] ? 'Hide Details' : 'Show Details'}
                            </button>
                            {expanded[n.id] && (
                              <ul className="list-disc list-inside text-xs text-gray-700 bg-red-50 rounded p-2 border border-red-100 mt-1">
                                {components.map((comp, idx) => (
                                  <li key={idx}>{comp}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                        <div className="flex items-center mt-2 text-xs text-gray-500">
                          {n.timestamp && (new Date(n.timestamp)).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {!n.read && (
                          <button
                            onClick={() => markAsRead(n.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(n.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete notification"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const SuperAdminDashboard = ({ initialTab = 'dashboard', user }) => {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [users, setUsers] = useState([])
  const [systemStats, setSystemStats] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [inventory, setInventory] = useState([])
  const [orders, setOrders] = useState([])
  const [adminReports, setAdminReports] = useState({})
  const [categories, setCategories] = useState([]);
  const [dashboardSalesChartType, setDashboardSalesChartType] = useState('monthly');
  let dashboardSalesChartData = [];
  let dashboardSalesChartTitle = '';
  let dashboardSalesChartComponent = null;
  if (dashboardSalesChartType === 'monthly') {
    dashboardSalesChartData = adminReports?.monthly_sales || [];
    dashboardSalesChartTitle = 'Monthly Sales';
    dashboardSalesChartComponent = (
      <ResponsiveContainer width="100%" height={200}>
        {dashboardSalesChartData.length > 0 ? (
          <LineChart data={dashboardSalesChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottomRight', offset: 0 }} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="total_sales" stroke="#A020F0" strokeWidth={3} />
          </LineChart>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-lg">No data available</div>
        )}
      </ResponsiveContainer>
    );
  } else if (dashboardSalesChartType === 'weekly') {
    dashboardSalesChartData = adminReports?.weekly_sales || [];
    dashboardSalesChartTitle = 'Weekly Sales';
    dashboardSalesChartComponent = (
      <ResponsiveContainer width="100%" height={200}>
        {dashboardSalesChartData.length > 0 ? (
          <LineChart data={dashboardSalesChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" label={{ value: 'Week', position: 'insideBottomRight', offset: 0 }} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="total_sales" stroke="#36A2EB" strokeWidth={3} />
          </LineChart>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-lg">No data available</div>
        )}
      </ResponsiveContainer>
    );
  } else if (dashboardSalesChartType === 'daily') {
    dashboardSalesChartData = adminReports?.daily_sales || [];
    dashboardSalesChartTitle = 'Daily Sales (Last 30 Days)';
    dashboardSalesChartComponent = (
      <ResponsiveContainer width="100%" height={250}>
        {dashboardSalesChartData.length > 0 ? (
          <BarChart data={dashboardSalesChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" label={{ value: 'Day', position: 'insideBottomRight', offset: 0 }} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="total_sales" fill="#36A2EB" />
          </BarChart>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-lg">No data available</div>
        )}
      </ResponsiveContainer>
    );
  }

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);
  
  useEffect(() => {
    const fetchData = async (showLoading = false) => {
      if (showLoading) setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/backend/api/index.php?endpoint=dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const result = await response.json();

        if (result.success) {
          const data = result.data;
          setUsers(data.users || []);
          setSystemStats(data.system_stats || {});
          setInventory(data.inventory || []);
          setOrders(data.orders || []);
          setAdminReports(data.reports || {});
        } else {
          throw new Error(result.error || 'API call was not successful');
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Do not set isLoading to true here
      } finally {
        if (showLoading) setIsLoading(false);
      }
    };

    // Initial load with loading spinner
    fetchData(true);

    // Polling every 10 seconds (no loading spinner)
    const interval = setInterval(() => {
      fetchData(false);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/backend/api/index.php?endpoint=categories');
        const result = await response.json();
        if (result.success) {
          setCategories(result.data);
        }
      } catch (e) {
        // Optionally handle error
      }
    };
    fetchCategories();
  }, []);

  // Helper to get category name by id (must be accessible to all subcomponents)
  const getCategoryName = (id) => {
    const cat = categories.find((c) => c.id === Number(id));
    return cat ? cat.name : id;
  };

  const DashboardOverview = () => {
    // Defensive: get analytics for summary
    const totalUsers = systemStats.total_users || 0;
    const totalSales = adminReports?.monthly_sales?.[0]?.total_sales || 0;
    const deadstockCount = adminReports?.deadstock?.length || 0;
    const topSeller = adminReports?.top_selling_products?.[0]?.name || 'N/A';
    // Extract analytics for charts
    const monthly_sales = adminReports?.monthly_sales || [];
    const daily_sales = adminReports?.daily_sales || [];
    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <Users className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{totalUsers.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl font-extrabold text-green-600">₱</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sales This Month</p>
                <p className="text-2xl font-bold text-gray-900">₱{Number(totalSales).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Package className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Deadstock Items</p>
                <p className="text-2xl font-bold text-gray-900">{deadstockCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Top Seller</p>
                <p className="text-base font-bold text-gray-900 truncate max-w-xs" title={topSeller}>{topSeller}</p>
              </div>
            </div>
          </div>
        </div>
        {/* System Health */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Server Status</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Online</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Database Status</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Connected</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Backup Status</span>
                <span className="text-sm text-gray-800">Last: 2 hours ago</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Security Status</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Secure</span>
              </div>
            </div>
          </div>
        </div>
        {/* System Reports Summary - Now with dropdown for sales chart type */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Reports (Summary)</h3>
          {/* Sales Chart Dropdown */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <label htmlFor="dashboard-sales-chart-type" className="block text-sm font-medium text-gray-700 mb-1">Select Sales Chart:</label>
              <select
                id="dashboard-sales-chart-type"
                className="border rounded px-4 py-2 text-base focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition"
                value={dashboardSalesChartType}
                onChange={e => setDashboardSalesChartType(e.target.value)}
              >
                <option value="monthly">Monthly Sales</option>
                <option value="weekly">Weekly Sales</option>
                <option value="daily">Daily Sales</option>
              </select>
            </div>
            <div className="flex-1 flex items-end justify-end">
              <span className="text-gray-500 text-sm italic">Showing: <span className="font-semibold text-gray-800">{dashboardSalesChartTitle}</span></span>
            </div>
          </div>
          {/* Sales Chart */}
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">{dashboardSalesChartTitle}</h4>
            {dashboardSalesChartComponent}
          </div>
          {/* Deadstock and Top Seller at the bottom */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div>
              <h4 className="font-semibold mb-2">Deadstock</h4>
              <div className="h-40 bg-gray-50 rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-yellow-600">{deadstockCount}</span>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Top Seller</h4>
              <div className="h-40 bg-gray-50 rounded-lg flex items-center justify-center">
                <span className="text-base font-bold text-blue-600 truncate max-w-xs" title={topSeller}>{topSeller}</span>
              </div>
            </div>
          </div>
        </div>
        {/* Sales Reports Summary */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Reports (Summary)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">₱{adminReports.totalSales?.toLocaleString() || 0}</p>
            </div>
          </div>
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Recent Orders</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer ID</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(orders && orders.length > 0) ? orders.slice(0, 3).map((order) => (
                    <tr key={order.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">#{order.id}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{order.user_id}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">₱{order.total_price}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{order.order_date}</td>
                    </tr>
                  )) : <tr><td colSpan="5" className="text-center py-4">No order data available.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const UserManagement = () => {
    // Helper to normalize roles
    const getRoles = (user) => {
      if (Array.isArray(user.roles)) return user.roles.map(r => r.toLowerCase());
      if (typeof user.roles === 'string') return user.roles.split(',').map(r => r.trim().toLowerCase());
      if (user.role) return [user.role.toLowerCase()];
      return [];
    };
    // Separate users by role (case-insensitive, supports array or string)
    const admins = users.filter(u => getRoles(u).includes('admin'));
    const employees = users.filter(u => getRoles(u).includes('employee'));
    // Handler for toggling inventory access
    const handleToggleInventoryAccess = async (userId, currentValue) => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/backend/api/index.php?endpoint=update_inventory_access', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ user_id: userId, can_access_inventory: currentValue ? 0 : 1 })
        });
        const result = await response.json();
        if (result.success) {
          setUsers(prev => prev.map(u => u.id === userId ? { ...u, can_access_inventory: currentValue ? 0 : 1 } : u));
        } else {
          alert(result.error || 'Failed to update inventory access');
        }
      } catch (e) {
        alert('Error updating inventory access');
      }
    };
    // In UserManagement, add the handler:
    const handleToggleOrderAccess = async (userId, currentValue) => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/backend/api/index.php?endpoint=update_order_access', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ user_id: userId, can_access_orders: currentValue ? 0 : 1 })
        });
        const result = await response.json();
        if (result.success) {
          setUsers(prev => prev.map(u => u.id === userId ? { ...u, can_access_orders: currentValue ? 0 : 1 } : u));
        } else {
          alert(result.error || 'Failed to update order access');
        }
      } catch (e) {
        alert('Error updating order access');
      }
    };
    // In UserManagement, add handler for chat support access
    const handleToggleChatSupportAccess = async (userId, currentValue) => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/backend/api/index.php?endpoint=update_chat_support_access', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ user_id: userId, can_access_chat_support: currentValue ? 0 : 1 })
        });
        const result = await response.json();
        if (result.success) {
          setUsers(prev => prev.map(u => u.id === userId ? { ...u, can_access_chat_support: currentValue ? 0 : 1 } : u));
        } else {
          alert(result.error || 'Failed to update chat support access');
        }
      } catch (e) {
        alert('Error updating chat support access');
      }
    };
    return (
      <div className="space-y-10">
        {/* Admins Table */}
        <div>
          <h3 className="text-xl font-bold text-purple-700 mb-2">Admin Accounts</h3>
          <div className="bg-white rounded-xl shadow-sm border overflow-x-auto mb-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Login</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {admins.length > 0 ? admins.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center ring-2 ring-white">
                          <span className="text-sm font-medium text-gray-700">{user.username.split(' ').map(n => n[0]).join('')}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-gray-900">{user.username}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">Admin</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        <span className={`h-2 w-2 mr-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.last_login}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button className="text-gray-500 hover:text-blue-700 p-1 rounded-full hover:bg-gray-100"><Eye className="h-4 w-4" /></button>
                      <button className="text-gray-500 hover:text-green-700 p-1 rounded-full hover:bg-gray-100"><Edit className="h-4 w-4" /></button>
                      <button className="text-gray-500 hover:text-red-700 p-1 rounded-full hover:bg-gray-100"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                )) : <tr><td colSpan="5" className="text-center py-4">No admin data available.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        {/* Employees Table */}
        <div>
          <h3 className="text-xl font-bold text-blue-700 mb-2">Employee Accounts</h3>
          <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Login</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Inventory Access</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order Management Access</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Chat Support Access</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.length > 0 ? employees.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center ring-2 ring-white">
                          <span className="text-sm font-medium text-gray-700">{user.username.split(' ').map(n => n[0]).join('')}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-gray-900">{user.username}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Employee</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        <span className={`h-2 w-2 mr-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.last_login}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {user.can_access_inventory ? (
                        <button
                          className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 font-semibold"
                          onClick={() => handleToggleInventoryAccess(user.id, true)}
                        >
                          Disable
                        </button>
                      ) : (
                        <button
                          className="bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 font-semibold"
                          onClick={() => handleToggleInventoryAccess(user.id, false)}
                        >
                          Enable
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {user.can_access_orders ? (
                        <button
                          className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 font-semibold"
                          onClick={() => handleToggleOrderAccess(user.id, true)}
                        >
                          Disable
                        </button>
                      ) : (
                        <button
                          className="bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 font-semibold"
                          onClick={() => handleToggleOrderAccess(user.id, false)}
                        >
                          Enable
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {user.can_access_chat_support ? (
                        <button
                          className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 font-semibold"
                          onClick={() => handleToggleChatSupportAccess(user.id, true)}
                        >
                          Disable
                        </button>
                      ) : (
                        <button
                          className="bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 font-semibold"
                          onClick={() => handleToggleChatSupportAccess(user.id, false)}
                        >
                          Enable
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button className="text-gray-500 hover:text-blue-700 p-1 rounded-full hover:bg-gray-100"><Eye className="h-4 w-4" /></button>
                      <button className="text-gray-500 hover:text-green-700 p-1 rounded-full hover:bg-gray-100"><Edit className="h-4 w-4" /></button>
                      <button className="text-gray-500 hover:text-red-700 p-1 rounded-full hover:bg-gray-100"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                )) : <tr><td colSpan="8" className="text-center py-4">No employee data available.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const SystemReports = () => {
    // Defensive: handle missing analytics
    const reports = adminReports || {};
    const {
      monthly_sales = [],
      daily_sales = [],
      weekly_sales = [],
      top_selling_products = [],
      revenue_per_category = [],
      revenue_per_brand = [],
      deadstock = [],
      stock_movement = [],
      order_status_breakdown = [],
      average_order_value = {}
    } = reports;
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A020F0', '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];
    const [deadstockCategory, setDeadstockCategory] = useState('all');
    // Dropdown for sales chart type
    const [salesChartType, setSalesChartType] = useState('monthly');
    // Only include computer component categories
    const allowedCategoryNames = [
      'CPU', 'Motherboard', 'GPU', 'RAM', 'Storage', 'PSU', 'Case', 'Cooler',
      'Procie Only', 'Mobo', 'Ram 3200mhz', 'Ssd Nvme', 'Psu - Tr', 'Case Gaming', 'Aio'
    ];
    // Filter categories to only computer components
    const componentCategories = (categories || []).filter(cat => allowedCategoryNames.includes(cat.name));
    // Only include deadstock items that are computer components
    const deadstockComponentIds = inventory.filter(item => {
      const cat = categories.find(c => String(c.id) === String(item.category_id));
      return cat && allowedCategoryNames.includes(cat.name);
    }).map(item => item.id);
    const filteredDeadstockRaw = deadstock.filter(item => deadstockComponentIds.includes(item.id));
    // Find which categories actually have deadstock
    const deadstockCategoryIds = Array.from(new Set(
      filteredDeadstockRaw.map(item => {
        const catId = inventory.find(comp => comp.id === item.id)?.category_id;
        return catId ? String(catId) : null;
      }).filter(Boolean)
    ));
    // Only show categories in dropdown that have deadstock
    const dropdownCategories = componentCategories.filter(cat => deadstockCategoryIds.includes(String(cat.id)));
    // Filter by selected category
    const filteredDeadstock = deadstockCategory === 'all'
      ? filteredDeadstockRaw
      : filteredDeadstockRaw.filter(item => {
          const cat = inventory.find(comp => comp.id === item.id)?.category_id;
          return String(cat) === String(deadstockCategory);
        });
    // Sales chart data and config
    let salesChartData = [];
    let salesChartTitle = '';
    let salesChartTypeLabel = '';
    let salesChartComponent = null;
    if (salesChartType === 'monthly') {
      salesChartData = monthly_sales;
      salesChartTitle = 'Monthly Sales';
      salesChartTypeLabel = 'Month';
      salesChartComponent = (
        <ResponsiveContainer width="100%" height={250}>
          {monthly_sales && monthly_sales.length > 0 ? (
            <LineChart data={monthly_sales} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottomRight', offset: 0 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total_sales" stroke="#A020F0" strokeWidth={3} />
            </LineChart>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-lg">No data available</div>
          )}
        </ResponsiveContainer>
      );
    } else if (salesChartType === 'weekly') {
      salesChartData = weekly_sales;
      salesChartTitle = 'Weekly Sales';
      salesChartTypeLabel = 'Week';
      salesChartComponent = (
        <ResponsiveContainer width="100%" height={250}>
          {weekly_sales && weekly_sales.length > 0 ? (
            <LineChart data={weekly_sales} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" label={{ value: 'Week', position: 'insideBottomRight', offset: 0 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total_sales" stroke="#36A2EB" strokeWidth={3} />
            </LineChart>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-lg">No data available</div>
          )}
        </ResponsiveContainer>
      );
    } else if (salesChartType === 'daily') {
      salesChartData = daily_sales;
      salesChartTitle = 'Daily Sales (Last 30 Days)';
      salesChartTypeLabel = 'Day';
      salesChartComponent = (
        <ResponsiveContainer width="100%" height={250}>
          {daily_sales && daily_sales.length > 0 ? (
            <BarChart data={daily_sales} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" label={{ value: 'Day', position: 'insideBottomRight', offset: 0 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total_sales" fill="#36A2EB" />
            </BarChart>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-lg">No data available</div>
          )}
        </ResponsiveContainer>
      );
    }
    return (
      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-gray-900">System Reports & Analytics</h2>
        {/* Sales Chart Dropdown */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <label htmlFor="sales-chart-type" className="block text-sm font-medium text-gray-700 mb-1">Select Sales Chart:</label>
            <select
              id="sales-chart-type"
              className="border rounded px-4 py-2 text-base focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition"
              value={salesChartType}
              onChange={e => setSalesChartType(e.target.value)}
            >
              <option value="monthly">Monthly Sales</option>
              <option value="weekly">Weekly Sales</option>
              <option value="daily">Daily Sales</option>
            </select>
          </div>
          <div className="flex-1 flex items-end justify-end">
            <span className="text-gray-500 text-sm italic">Showing: <span className="font-semibold text-gray-800">{salesChartTitle}</span></span>
          </div>
        </div>
        {/* Sales Chart */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{salesChartTitle}</h3>
          {salesChartComponent}
        </div>
        {/* Top Sellers & Revenue */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top-Selling Products</h3>
            <ResponsiveContainer width="100%" height={250}>
              {top_selling_products && top_selling_products.length > 0 ? (
                <BarChart data={top_selling_products} layout="vertical" margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total_quantity" fill="#0088FE" name="Quantity Sold" />
                  <Bar dataKey="total_revenue" fill="#FFBB28" name="Revenue" />
                </BarChart>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-lg">No data available</div>
              )}
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Category</h3>
            <ResponsiveContainer width="100%" height={250}>
              {revenue_per_category && revenue_per_category.length > 0 ? (
                <PieChart>
                  <Pie data={revenue_per_category} dataKey="total_revenue" nameKey="category" cx="50%" cy="50%" outerRadius={80} label>
                    {revenue_per_category.map((entry, idx) => (
                      <Cell key={`cat-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-lg">No data available</div>
              )}
            </ResponsiveContainer>
          </div>
        </div>
        {/* Revenue by Brand & Order Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Brand</h3>
            <ResponsiveContainer width="100%" height={250}>
              {revenue_per_brand && revenue_per_brand.length > 0 ? (
                <PieChart>
                  <Pie data={revenue_per_brand} dataKey="total_revenue" nameKey="brand" cx="50%" cy="50%" outerRadius={80} label>
                    {revenue_per_brand.map((entry, idx) => (
                      <Cell key={`brand-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-lg">No data available</div>
              )}
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Breakdown</h3>
            <ResponsiveContainer width="100%" height={250}>
              {order_status_breakdown && order_status_breakdown.length > 0 ? (
                <PieChart>
                  <Pie data={order_status_breakdown} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label>
                    {order_status_breakdown.map((entry, idx) => (
                      <Cell key={`status-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-lg">No data available</div>
              )}
            </ResponsiveContainer>
          </div>
        </div>
        {/* Stock Movement & Deadstock */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Movement (Last 30 Days)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stock_movement} layout="vertical" margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip />
                <Legend />
                <Bar dataKey="sold_last_30_days" fill="#00C49F" name="Sold (30d)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2 gap-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 md:mb-0">Deadstock (No Sales in 90 Days)</h3>
              <select
                className="border rounded px-3 py-2 text-sm max-w-xs"
                value={deadstockCategory}
                onChange={e => setDeadstockCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {dropdownCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{formalCategoryNames[cat.name] || cat.name}</option>
                ))}
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Component</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Sold Date</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDeadstock.length > 0 ? filteredDeadstock.map((item, idx) => {
                    const catId = inventory.find(comp => comp.id === item.id)?.category_id;
                    return (
                      <tr key={item.id}>
                        <td className="px-4 py-2 whitespace-normal text-sm font-medium text-gray-900">{item.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{item.stock_quantity}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{item.last_sold_date ? new Date(item.last_sold_date).toLocaleDateString() : 'Never Sold'}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{getCategoryName(catId)}</td>
                      </tr>
                    );
                  }) : <tr><td colSpan="4" className="text-center py-4 text-gray-500">No deadstock found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {/* Average Order Value */}
        <div className="bg-white rounded-xl shadow-sm border p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Order Value</h3>
          <div className="text-3xl font-extrabold text-green-700">₱{average_order_value?.avg_order_value ? Number(average_order_value.avg_order_value).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2}) : '0.00'}</div>
        </div>
      </div>
    );
  }

  const SystemSettings = () => (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-3">Security</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="2fa" className="font-medium text-gray-700">Enable Two-Factor Authentication</label>
            <input type="checkbox" id="2fa" className="rounded h-4 w-4 text-red-600 focus:ring-red-500" />
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor="session-timeout" className="font-medium text-gray-700">Session Timeout (minutes)</label>
            <input type="number" id="session-timeout" defaultValue="30" className="w-24 p-2 border rounded-md" />
          </div>
        </div>
      </div>
       <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-3">Notifications</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="admin-new-user" className="font-medium text-gray-700">Email on New User Registration</label>
            <input type="checkbox" id="admin-new-user" defaultChecked className="rounded h-4 w-4 text-red-600 focus:ring-red-500" />
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor="system-alerts" className="font-medium text-gray-700">System Health Alerts</label>
            <input type="checkbox" id="system-alerts" defaultChecked className="rounded h-4 w-4 text-red-600 focus:ring-red-500" />
          </div>
        </div>
      </div>
    </div>
  )

  // Add the new tab to renderContent
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardOverview />
      case 'notifications': return <SuperAdminNotifications />
      case 'user-management': return <UserManagement />
      case 'inventory': return <InventoryManagement inventory={inventory} categories={categories} />
      case 'prebuilt-management': return <SuperAdminPrebuiltPCs />
      case 'pc-assembly': return <SuperAdminPCAssembly user={user} />
      case 'orders-management': return <OrdersManagement orders={orders} />
      case 'system-reports': return <SystemReports />
      case 'reports': return <AdminReports reports={adminReports} orders={orders} />
      case 'system-settings': return <SystemSettings />
      default: return <DashboardOverview />
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Oversee the entire system, manage users, and monitor store performance.</p>
      </div>
      <div className="bg-white rounded-xl shadow-lg border">
        <div className="p-4 sm:p-6 lg:p-8 border-t">
          {isLoading ? (
             <div className="text-center py-12">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
             </div>
          ) : renderContent()}
        </div>
      </div>
    </div>
  )
}

export default SuperAdminDashboard 