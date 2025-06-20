
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface BuySellComparisonProps {
  buyOrders: number;
  sellOrders: number;
}

const BuySellComparison = ({ buyOrders, sellOrders }: BuySellComparisonProps) => {
  const total = buyOrders + sellOrders;
  const buyPercentage = total > 0 ? (buyOrders / total) * 100 : 0;
  const sellPercentage = total > 0 ? (sellOrders / total) * 100 : 0;

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="text-lg text-gray-800 flex items-center">
          📊 Buy vs Sell Orders
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Buy Orders</span>
              <span className="text-2xl font-bold text-green-600">{buyOrders}</span>
            </div>
            <Progress value={buyPercentage} className="h-2 bg-gray-200">
              <div 
                className="h-full bg-green-500 transition-all duration-300 ease-in-out rounded-full"
                style={{ width: `${buyPercentage}%` }}
              />
            </Progress>
            <div className="text-xs text-gray-500">{buyPercentage.toFixed(1)}% of total</div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Sell Orders</span>
              <span className="text-2xl font-bold text-red-600">{sellOrders}</span>
            </div>
            <Progress value={sellPercentage} className="h-2 bg-gray-200">
              <div 
                className="h-full bg-red-500 transition-all duration-300 ease-in-out rounded-full"
                style={{ width: `${sellPercentage}%` }}
              />
            </Progress>
            <div className="text-xs text-gray-500">{sellPercentage.toFixed(1)}% of total</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BuySellComparison;
