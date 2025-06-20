
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatisticsCard from '@/components/StatisticsCard';
import BuySellComparison from '@/components/BuySellComparison';

interface Order {
  id: string;
  type: string;
  side: 'Buy' | 'Sell';
  symbol: string;
  quantity: number;
  price: number;
  status: 'Pending' | 'Filled' | 'Rejected' | 'Partial';
  time: string;
}

interface StatisticsPanelProps {
  statistics: {
    totalOrders: number;
    filled: number;
    rejected: number;
    pending: number;
  };
  orders: Order[];
}

const StatisticsPanel = ({ statistics, orders }: StatisticsPanelProps) => {
  const buyOrders = orders.filter(order => order.side === 'Buy').length;
  const sellOrders = orders.filter(order => order.side === 'Sell').length;
  
  const totalVolume = orders.reduce((sum, order) => sum + (order.quantity * order.price), 0);
  const averagePrice = orders.length > 0 ? orders.reduce((sum, order) => sum + order.price, 0) / orders.length : 0;
  const averageQuantity = orders.length > 0 ? orders.reduce((sum, order) => sum + order.quantity, 0) / orders.length : 0;

  const symbolStats = orders.reduce((acc, order) => {
    if (!acc[order.symbol]) {
      acc[order.symbol] = { count: 0, volume: 0 };
    }
    acc[order.symbol].count++;
    acc[order.symbol].volume += order.quantity * order.price;
    return acc;
  }, {} as Record<string, { count: number; volume: number }>);

  const topSymbols = Object.entries(symbolStats)
    .sort((a, b) => b[1].volume - a[1].volume)
    .slice(0, 5);

  return (
    <div className="max-h-[calc(100vh-200px)] overflow-auto p-6 bg-slate-50 space-y-6">
      {/* Main Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatisticsCard
          title="Total Orders"
          value={statistics.totalOrders}
          color="blue"
          label="Toplam Emir"
          
        />
        <StatisticsCard
          title="Filled"
          value={statistics.filled}
          color="green"
          label="Gerçekleşen"
        />
        <StatisticsCard
          title="Rejected"
          value={statistics.rejected}
          color="red"
          label="Reddedilen"
        />
        <StatisticsCard
          title="Pending"
          value={statistics.pending}
          color="orange"
          label="Bekleyen"
        />
      </div>

      {/* Additional Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        <StatisticsCard
          title="Total Volume"
          value={Math.round(totalVolume)}
          color="blue"
          label="$"
        />
        <StatisticsCard
          title="Average Price"
          value={Math.round(averagePrice * 100) / 100}
          color="green"
          label="$"
        />
        <StatisticsCard
          title="Average Quantity"
          value={Math.round(averageQuantity)}
          color="orange"
          label="shares"
        />
        <StatisticsCard
          title="Unique Symbols"
          value={Object.keys(symbolStats).length}
          color="red"
          label="symbols"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Buy vs Sell Comparison */}
        <div className="lg:col-span-2">
          <BuySellComparison buyOrders={buyOrders} sellOrders={sellOrders} />
        </div>

        {/* Top Symbols by Volume */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📊 Top Symbols by Volume</CardTitle>
          </CardHeader>
          <CardContent>
            {topSymbols.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No trading data available</p>
            ) : (
              <div className="space-y-3">
                {topSymbols.map(([symbol, stats], index) => (
                  <div key={symbol} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </span>
                      <span className="font-medium">{symbol}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${stats.volume.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">{stats.count} orders</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📈 Order Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-green-600">Filled</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${statistics.totalOrders > 0 ? (statistics.filled / statistics.totalOrders) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{statistics.filled}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-red-600">Rejected</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${statistics.totalOrders > 0 ? (statistics.rejected / statistics.totalOrders) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{statistics.rejected}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-orange-600">Pending</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full" 
                      style={{ width: `${statistics.totalOrders > 0 ? (statistics.pending / statistics.totalOrders) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{statistics.pending}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StatisticsPanel;
