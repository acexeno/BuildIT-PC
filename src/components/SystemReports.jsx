import React, { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, PieChart as PieIcon, Package, Award, Layers, AlertTriangle, BarChart3, Eye, EyeOff } from 'lucide-react';

const COLORS = ['#6366F1', '#22D3EE', '#F59E42', '#F472B6', '#A3E635', '#F87171', '#60A5FA', '#FBBF24', '#34D399', '#818CF8'];

const SystemReports = ({ reports = {}, inventory = [], categories = [], formalCategoryNames = {}, deadstockPeriod = 90, onDeadstockPeriodChange }) => {
  // Show loading spinner if categories are not loaded yet
  if (!categories || categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
        <div className="text-gray-500 text-lg">Loading System Reports...</div>
      </div>
    );
  }
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
  const [deadstockCategory, setDeadstockCategory] = useState('all');
  const [salesChartType, setSalesChartType] = useState('monthly');
  const [showDeadstock, setShowDeadstock] = useState(true);
  const [deadstockSearchTerm, setDeadstockSearchTerm] = useState('');
  const allowedCategoryNames = [
    'CPU', 'Motherboard', 'GPU', 'RAM', 'Storage', 'PSU', 'Case', 'Cooler',
    'Procie Only', 'Mobo', 'Ram 3200mhz', 'Ssd Nvme', 'Psu - Tr', 'Case Gaming', 'Aio'
  ];
  const componentCategories = (categories || []).filter(cat => allowedCategoryNames.includes(cat.name));
  const deadstockComponentIds = inventory.filter(item => {
    const cat = categories.find(c => String(c.id) === String(item.category_id));
    return cat && allowedCategoryNames.includes(cat.name);
  }).map(item => item.id);
  const filteredDeadstockRaw = deadstock.filter(item => deadstockComponentIds.includes(item.id));
  const deadstockCategoryIds = Array.from(new Set(
    filteredDeadstockRaw.map(item => {
      const catId = inventory.find(comp => comp.id === item.id)?.category_id;
      return catId ? String(catId) : null;
    }).filter(Boolean)
  ));
  const dropdownCategories = componentCategories.filter(cat => deadstockCategoryIds.includes(String(cat.id)));
  const filteredDeadstock = (deadstockCategory === 'all'
    ? filteredDeadstockRaw
    : filteredDeadstockRaw.filter(item => {
        const cat = inventory.find(comp => comp.id === item.id)?.category_id;
        return String(cat) === String(deadstockCategory);
      })
  ).filter(item => {
    // Filter by search term (name or brand)
    const search = deadstockSearchTerm.trim().toLowerCase();
    if (!search) return true;
    const name = item.name?.toLowerCase() || '';
    const brand = item.brand?.toLowerCase() || '';
    return name.includes(search) || brand.includes(search);
  });

  // Chart selection
  let salesChartData = [];
  let salesChartTitle = '';
  let salesChartComponent = null;
  if (salesChartType === 'monthly') {
    salesChartData = monthly_sales;
    salesChartTitle = 'Monthly Sales';
    salesChartComponent = (
      <ResponsiveContainer width="100%" height={250}>
        {monthly_sales && monthly_sales.length > 0 ? (
          <LineChart data={monthly_sales} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottomRight', offset: 0 }} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="total_sales" stroke="#6366F1" strokeWidth={3} />
          </LineChart>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-lg">No data available</div>
        )}
      </ResponsiveContainer>
    );
  } else if (salesChartType === 'weekly') {
    salesChartData = weekly_sales;
    salesChartTitle = 'Weekly Sales';
    salesChartComponent = (
      <ResponsiveContainer width="100%" height={250}>
        {weekly_sales && weekly_sales.length > 0 ? (
          <LineChart data={weekly_sales} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" label={{ value: 'Week', position: 'insideBottomRight', offset: 0 }} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="total_sales" stroke="#22D3EE" strokeWidth={3} />
          </LineChart>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-lg">No data available</div>
        )}
      </ResponsiveContainer>
    );
  } else if (salesChartType === 'daily') {
    salesChartData = daily_sales;
    salesChartTitle = 'Daily Sales (Last 30 Days)';
    salesChartComponent = (
      <ResponsiveContainer width="100%" height={250}>
        {daily_sales && daily_sales.length > 0 ? (
          <BarChart data={daily_sales} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" label={{ value: 'Day', position: 'insideBottomRight', offset: 0 }} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="total_sales" fill="#F59E42" />
          </BarChart>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-lg">No data available</div>
        )}
      </ResponsiveContainer>
    );
  }

  return (
    <div>
      <div className="space-y-10 px-2 md:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <BarChart3 className="h-10 w-10 text-indigo-500" />
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">System Reports & Analytics</h2>
            <p className="text-gray-500 text-base mt-1">Visualize your business performance and trends in real time.</p>
          </div>
        </div>

        {/* Sales Chart Card */}
        <div className="bg-white rounded-2xl shadow-lg border p-8 mb-8 transition hover:shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-green-500" />
              <label htmlFor="sales-chart-type" className="block text-base font-semibold text-gray-700">Sales Chart:</label>
              <select
                id="sales-chart-type"
                className="ml-2 border rounded px-4 py-2 text-base focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
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
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><PieIcon className="h-5 w-5 text-indigo-400" />{salesChartTitle}</h3>
            {salesChartComponent}
          </div>
        </div>

        {/* Deadstock Toggle Button */}
        <div className="flex justify-end mb-2">
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold shadow transition focus:outline-none focus:ring-2 focus:ring-green-400 ${showDeadstock ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
            onClick={() => setShowDeadstock(v => !v)}
          >
            {showDeadstock ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            {showDeadstock ? 'Hide Deadstock' : 'Show Deadstock'}
          </button>
        </div>

        {/* Deadstock (conditionally rendered) */}
        {showDeadstock && (
        <div className="bg-white rounded-2xl shadow-lg border p-6 transition hover:shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2 gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h3 className="text-lg font-bold text-gray-900">Deadstock (No Sales in {deadstockPeriod} Days)</h3>
            </div>
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
          {/* Deadstock Search Bar */}
          <div className="mb-4 flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              className="border rounded px-3 py-2 text-sm w-full sm:w-80"
              placeholder="Search deadstock by name or brand..."
              value={deadstockSearchTerm}
              onChange={e => setDeadstockSearchTerm(e.target.value)}
            />
          </div>
          <div className="mt-4">
            {filteredDeadstock.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredDeadstock.map(item => {
                  const cat = categories.find(c => String(c.id) === String(item.category_id));
                  return (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-4 px-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-base text-gray-900 truncate" title={item.name}>{item.name}</div>
                        <div className="text-sm text-gray-500">{formalCategoryNames[cat?.name] || cat?.name || '-'}</div>
                      </div>
                      <div className="flex items-center gap-4 mt-2 sm:mt-0">
                        <span className="text-xs font-semibold text-gray-700 bg-yellow-100 rounded px-3 py-1">Stock: {item.stock_quantity ?? item.stock}</span>
                        <span className="text-base font-bold text-green-700 bg-green-100 rounded px-3 py-1 flex items-center gap-1">
                          {
                            (() => {
                              let price = item.price;
                              if (typeof price !== 'number' || isNaN(price)) {
                                // Try to find in inventory
                                const inv = inventory.find(comp => String(comp.id) === String(item.id));
                                if (inv && typeof inv.price === 'number' && !isNaN(inv.price)) {
                                  price = inv.price;
                                }
                              }
                              return `₱${typeof price === 'number' && !isNaN(price) ? price.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2}) : '0.00'}`;
                            })()
                          }
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 w-full">No deadstock data available.</div>
            )}
          </div>
        </div>
        )}

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Top-Selling Products */}
          <div className="bg-white rounded-2xl shadow-lg border p-6 transition hover:shadow-2xl">
            <div className="flex items-center gap-2 mb-4"><Award className="h-5 w-5 text-yellow-500" /><h3 className="text-lg font-bold text-gray-900">Top-Selling Products</h3></div>
            <ResponsiveContainer width="100%" height={250}>
              {top_selling_products && top_selling_products.length > 0 ? (
                <BarChart data={top_selling_products} layout="vertical" margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total_quantity" fill="#6366F1" name="Quantity Sold" />
                  <Bar dataKey="total_revenue" fill="#F59E42" name="Revenue" />
                </BarChart>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-lg">No data available</div>
              )}
            </ResponsiveContainer>
          </div>
          {/* Revenue by Category */}
          <div className="bg-white rounded-2xl shadow-lg border p-6 transition hover:shadow-2xl">
            <div className="flex items-center gap-2 mb-4"><Layers className="h-5 w-5 text-pink-500" /><h3 className="text-lg font-bold text-gray-900">Revenue by Category</h3></div>
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
          {/* Revenue by Brand */}
          <div className="bg-white rounded-2xl shadow-lg border p-6 transition hover:shadow-2xl">
            <div className="flex items-center gap-2 mb-4"><Package className="h-5 w-5 text-blue-500" /><h3 className="text-lg font-bold text-gray-900">Revenue by Brand</h3></div>
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
          {/* Order Status Breakdown */}
          <div className="bg-white rounded-2xl shadow-lg border p-6 transition hover:shadow-2xl">
            <div className="flex items-center gap-2 mb-4"><PieIcon className="h-5 w-5 text-green-500" /><h3 className="text-lg font-bold text-gray-900">Order Status Breakdown</h3></div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          {/* Stock Movement */}
          <div className="bg-white rounded-2xl shadow-lg border p-6 transition hover:shadow-2xl">
            <div className="flex items-center gap-2 mb-4"><TrendingUp className="h-5 w-5 text-teal-500" /><h3 className="text-lg font-bold text-gray-900">Stock Movement (Last 30 Days)</h3></div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stock_movement} layout="vertical" margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip />
                <Legend />
                <Bar dataKey="sold_last_30_days" fill="#22D3EE" name="Sold (30d)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Deadstock */}
          {/* This section is now redundant as the Deadstock card is moved */}
        </div>

        {/* Average Order Value */}
        <div className="bg-white rounded-2xl shadow-lg border p-8 max-w-md mx-auto mt-10 flex flex-col items-center transition hover:shadow-2xl">
          <div className="flex items-center gap-2 mb-2"><PieIcon className="h-7 w-7 text-indigo-500" /><h3 className="text-lg font-bold text-gray-900">Average Order Value</h3></div>
          <div className="text-4xl font-extrabold text-green-700">₱{average_order_value?.avg_order_value ? Number(average_order_value.avg_order_value).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2}) : '0.00'}</div>
        </div>
      </div>
    </div>
  );
};

export default SystemReports; 