import React from 'react';

const AdminReports = ({ reports, orders }) => (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Sales Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg flex items-center justify-center"><span className="text-2xl font-extrabold text-green-600">₱</span></div>
                    <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Sales</p>
                        <p className="text-2xl font-bold text-gray-900">₱{reports.totalSales?.toLocaleString()}</p>
                    </div>
                </div>
            </div>
            {/* Other report cards can be added here */}
        </div>
        <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer ID</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {(orders && orders.length > 0) ? orders.slice(0, 5).map((order) => (
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
                            </tr>
                        )) : <tr><td colSpan="5" className="text-center py-4">No order data available.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
);

export default AdminReports; 