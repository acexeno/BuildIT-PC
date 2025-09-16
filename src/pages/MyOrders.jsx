import React, { useState, useEffect } from 'react';
import { Package, ShoppingCart, Clock, CheckCircle, XCircle, Eye, Download, Calendar, DollarSign, Truck, AlertCircle, X, Plus } from 'lucide-react';

const MyOrders = ({ setCurrentPage }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  // Simulate loading orders from backend
  useEffect(() => {
    // Simulate API call delay
    setTimeout(() => {
      // For demo purposes, we'll start with no orders
      setOrders([]);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return { color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: <Clock className="w-4 h-4" /> };
      case 'processing':
        return { color: 'text-blue-600', bgColor: 'bg-blue-100', icon: <Package className="w-4 h-4" /> };
      case 'shipped':
        return { color: 'text-purple-600', bgColor: 'bg-purple-100', icon: <Truck className="w-4 h-4" /> };
      case 'delivered':
        return { color: 'text-green-600', bgColor: 'bg-green-100', icon: <CheckCircle className="w-4 h-4" /> };
      case 'cancelled':
        return { color: 'text-red-600', bgColor: 'bg-red-100', icon: <XCircle className="w-4 h-4" /> };
      default:
        return { color: 'text-gray-600', bgColor: 'bg-gray-100', icon: <AlertCircle className="w-4 h-4" /> };
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending Payment';
      case 'processing':
        return 'Processing';
      case 'shipped':
        return 'Shipped';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <ShoppingCart className="w-12 h-12 text-gray-400" />
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h3>
      <p className="text-gray-600 text-center max-w-md mb-8">
        You haven't placed any orders yet. Once you purchase components, your order history will appear here.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <button 
          onClick={() => setCurrentPage('pc-assembly')}
          className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Start Building
        </button>
      </div>
      
      {/* Flex container for the two boxes */}
      <div className="flex flex-col md:flex-row gap-6 w-full max-w-3xl justify-center items-stretch">
        {/* Component Orders Box */}
        <div className="p-6 bg-blue-50 rounded-lg border border-blue-200 flex-1 mb-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <h4 className="font-semibold text-blue-900">Component Orders</h4>
          </div>
          <p className="text-sm text-blue-800">
            Purchase individual components from our partner retailers and track your orders here.
          </p>
        </div>
        {/* How it works Box */}
        <div className="p-6 bg-yellow-50 rounded-lg border border-yellow-200 flex-1 mt-6 md:mt-0">
                          <h4 className="font-semibold text-yellow-900 mb-2">How it works:</h4>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Build your PC using our compatibility checker</li>
            <li>• Purchase components from partner retailers</li>
            <li>• Track your orders and shipping status</li>
            <li>• Get notifications on order updates</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const OrderCard = ({ order }) => {
    const status = getStatusColor(order.status);
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">Order #{order.orderNumber}</h3>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${status.bgColor}`}>
                  {status.icon}
                  <span className={`text-sm font-medium ${status.color}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">{order.description}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(order.orderDate)}
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  ₱{order.totalAmount.toLocaleString()}
                </div>
                <div className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  setSelectedOrder(order);
                  setShowOrderDetails(true);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                title="View order details"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100" title="Download invoice">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Order Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span>Order Progress</span>
              <span>{Math.round((order.progress || 0) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(order.progress || 0) * 100}%` }}
              ></div>
            </div>
          </div>
          
          {/* Order Items Preview */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {order.items.slice(0, 3).map((item, index) => (
              <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xs font-medium text-gray-600 mb-1">{item.category}</div>
                <div className="text-sm font-semibold text-gray-900 truncate">{item.name}</div>
                <div className="text-xs text-gray-500">₱{item.price.toLocaleString()}</div>
              </div>
            ))}
            {order.items.length > 3 && (
              <div className="text-center p-3 bg-gray-50 rounded-lg flex items-center justify-center">
                <span className="text-sm text-gray-500">+{order.items.length - 3} more</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => {
                setSelectedOrder(order);
                setShowOrderDetails(true);
              }}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              View Details
            </button>
            {order.status === 'delivered' && (
              <button className="flex-1 border-2 border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />
                Download Invoice
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const OrderDetailsModal = ({ order, onClose }) => {
    if (!order) return null;
    
    const status = getStatusColor(order.status);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Order #{order.orderNumber}</h2>
                <p className="text-sm text-gray-600">{formatDate(order.orderDate)}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Status */}
            <div className="mb-6">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${status.bgColor}`}>
                {status.icon}
                <span className={`font-medium ${status.color}`}>
                  {getStatusText(order.status)}
                </span>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-600">{item.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">₱{item.price.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">₱{order.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="font-medium text-green-600">₱{order.shipping.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-medium">₱{order.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-green-600">₱{order.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-600">Track your component orders</p>
          </div>
        </div>
        
        {orders.length > 0 && (
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Total orders: {orders.length}</span>
            <span>•</span>
            <span>Total spent: ₱{orders.reduce((sum, order) => sum + order.totalAmount, 0).toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Content */}
      {orders.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <OrderDetailsModal 
          order={selectedOrder} 
          onClose={() => {
            setShowOrderDetails(false);
            setSelectedOrder(null);
          }} 
        />
      )}
    </div>
  );
};

export default MyOrders; 