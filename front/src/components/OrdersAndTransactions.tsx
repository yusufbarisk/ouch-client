
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Filter, X, ChevronDown, ChevronRight, Info } from 'lucide-react';

interface Order {
  id: string;
  type: string;
  side: 'Buy' | 'Sell';
  symbol: string;
  quantity: number;
  price: number;
  status: 'Pending' | 'Filled' | 'Rejected' | 'Partial';
  time: string;
  ackMessage?: {
    id: string;
    content: string;
    timestamp: string;
    type: 'ack' | 'reject';
  };
  fillOrder?: {
    id: string;
    side: 'Buy' | 'Sell';
    symbol: string;
    quantity: number;
    price: number;
    timestamp: string;
    counterparty: string;
  };
  rawData?: any; // For detailed inspection
}

interface OrdersAndTransactionsProps {
  orders: Order[];
}

const OrdersAndTransactions = ({ orders }: OrdersAndTransactionsProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sideFilter, setSideFilter] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minQty, setMinQty] = useState('');
  const [maxQty, setMaxQty] = useState('');
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSide = sideFilter === 'all' || order.side === sideFilter;
    const matchesMinPrice = !minPrice || order.price >= parseFloat(minPrice);
    const matchesMaxPrice = !maxPrice || order.price <= parseFloat(maxPrice);
    const matchesMinQty = !minQty || order.quantity >= parseInt(minQty);
    const matchesMaxQty = !maxQty || order.quantity <= parseInt(maxQty);

    return matchesSearch && matchesStatus && matchesSide && 
           matchesMinPrice && matchesMaxPrice && matchesMinQty && matchesMaxQty;
  });

  const toggleOrderExpansion = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setSideFilter('all');
    setMinPrice('');
    setMaxPrice('');
    setMinQty('');
    setMaxQty('');
    setSearchTerm('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Filled': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Pending': return 'bg-orange-100 text-orange-800';
      case 'Partial': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSideColor = (side: string) => {
    return side === 'Buy' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold';
  };

  const canExpand = (order: Order) => {
    return (order.status === 'Pending' && order.ackMessage) || 
           (order.status === 'Filled' && (order.ackMessage || order.fillOrder));
  };

  const renderExpandedContent = (order: Order) => {
    const isExpanded = expandedOrders.has(order.id);
    if (!isExpanded) return null;

    return (
      <>
        {/* ACK Message Row */}
        {order.ackMessage && (
          <TableRow className="bg-blue-50">
            <TableCell className="pl-8 text-xs text-gray-600" colSpan={2}>
              📨 ACK Message
            </TableCell>
            <TableCell className="text-xs" colSpan={3}>
              <div className="font-mono text-xs bg-white p-2 rounded border">
                {order.ackMessage.content}
              </div>
            </TableCell>
            <TableCell className="text-xs">
              <Badge variant="outline" className={order.ackMessage.type === 'ack' ? 'text-green-600' : 'text-red-600'}>
                {order.ackMessage.type.toUpperCase()}
              </Badge>
            </TableCell>
            <TableCell className="text-xs text-gray-500">{order.ackMessage.timestamp}</TableCell>
            <TableCell></TableCell>
          </TableRow>
        )}
        
        {/* Fill Order Row */}
        {order.fillOrder && order.status === 'Filled' && (
          <TableRow className="bg-green-50">
            <TableCell className="pl-8 text-xs text-gray-600" colSpan={2}>
              🔄 Fill Order
            </TableCell>
            <TableCell className={`text-xs ${getSideColor(order.fillOrder.side)}`}>
              {order.fillOrder.side}
            </TableCell>
            <TableCell className="text-xs font-medium">{order.fillOrder.symbol}</TableCell>
            <TableCell className="text-xs">{order.fillOrder.quantity.toLocaleString()}</TableCell>
            <TableCell className="text-xs">${order.fillOrder.price.toFixed(2)}</TableCell>
            <TableCell className="text-xs">
              <Badge className="bg-purple-100 text-purple-800">
                {order.fillOrder.counterparty}
              </Badge>
            </TableCell>
            <TableCell className="text-xs text-gray-500">{order.fillOrder.timestamp}</TableCell>
          </TableRow>
        )}
      </>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Search and Filter Bar */}
      <div className="p-4 border-b border-slate-200 space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search orders, symbols, types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </Button>
          {(statusFilter !== 'all' || sideFilter !== 'all' || minPrice || maxPrice || minQty || maxQty) && (
            <Button variant="ghost" onClick={clearFilters} className="flex items-center space-x-2">
              <X className="w-4 h-4" />
              <span>Clear</span>
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-4 bg-slate-50 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Filled">Filled</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Partial">Partial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Side</label>
              <Select value={sideFilter} onValueChange={setSideFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sides</SelectItem>
                  <SelectItem value="Buy">Buy</SelectItem>
                  <SelectItem value="Sell">Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Min Price</label>
              <Input
                type="number"
                placeholder="0.00"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Max Price</label>
              <Input
                type="number"
                placeholder="0.00"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Min Qty</label>
              <Input
                type="number"
                placeholder="0"
                value={minQty}
                onChange={(e) => setMinQty(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Max Qty</label>
              <Input
                type="number"
                placeholder="0"
                value={maxQty}
                onChange={(e) => setMaxQty(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold w-8"></TableHead>
              <TableHead className="font-semibold">Order ID</TableHead>
              <TableHead className="font-semibold">Type</TableHead>
              <TableHead className="font-semibold">Side</TableHead>
              <TableHead className="font-semibold">Symbol</TableHead>
              <TableHead className="font-semibold">Quantity</TableHead>
              <TableHead className="font-semibold">Price</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  {orders.length === 0 
                    ? "No orders found. Start by connecting to FIX server."
                    : "No orders match your search criteria."
                  }
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <React.Fragment key={order.id}>
                  <TableRow className="hover:bg-gray-50">
                    <TableCell className="w-8">
                      {canExpand(order) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleOrderExpansion(order.id)}
                          className="h-6 w-6 p-0"
                        >
                          {expandedOrders.has(order.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{order.id}</TableCell>
                    <TableCell>{order.type}</TableCell>
                    <TableCell className={getSideColor(order.side)}>
                      {order.side}
                    </TableCell>
                    <TableCell className="font-medium">{order.symbol}</TableCell>
                    <TableCell>{order.quantity.toLocaleString()}</TableCell>
                    <TableCell>${order.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <span>{order.time}</span>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-blue-100"
                              onClick={() => setSelectedOrderDetails(order)}
                            >
                              <Info className="h-4 w-4 text-blue-600" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Order Details - {order.id}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Order ID</label>
                                  <div className="font-mono text-sm bg-gray-50 p-2 rounded">{order.id}</div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Status</label>
                                  <div>
                                    <Badge className={getStatusColor(order.status)}>
                                      {order.status}
                                    </Badge>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Symbol</label>
                                  <div className="font-medium">{order.symbol}</div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Side</label>
                                  <div className={getSideColor(order.side)}>{order.side}</div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Quantity</label>
                                  <div>{order.quantity.toLocaleString()}</div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Price</label>
                                  <div>${order.price.toFixed(2)}</div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Type</label>
                                  <div>{order.type}</div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Time</label>
                                  <div>{order.time}</div>
                                </div>
                              </div>
                              
                              {order.ackMessage && (
                                <div>
                                  <label className="text-sm font-medium text-gray-700">ACK Message</label>
                                  <div className="font-mono text-sm bg-blue-50 p-3 rounded border">
                                    <div className="mb-2 text-xs text-gray-600">
                                      Type: {order.ackMessage.type.toUpperCase()} | Time: {order.ackMessage.timestamp}
                                    </div>
                                    {order.ackMessage.content}
                                  </div>
                                </div>
                              )}
                              
                              {order.fillOrder && (
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Fill Details</label>
                                  <div className="bg-green-50 p-3 rounded border">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <div><strong>Counterparty:</strong> {order.fillOrder.counterparty}</div>
                                      <div><strong>Fill Time:</strong> {order.fillOrder.timestamp}</div>
                                      <div><strong>Fill Side:</strong> <span className={getSideColor(order.fillOrder.side)}>{order.fillOrder.side}</span></div>
                                      <div><strong>Fill Price:</strong> ${order.fillOrder.price.toFixed(2)}</div>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {order.rawData && (
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Raw Data</label>
                                  <pre className="font-mono text-xs bg-gray-50 p-3 rounded border overflow-x-auto">
                                    {JSON.stringify(order.rawData, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                  {renderExpandedContent(order)}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default OrdersAndTransactions;
