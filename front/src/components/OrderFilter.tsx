
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface OrderFilterProps {
  activeFilters: string[];
  onFilterChange: (filter: string) => void;
}

const OrderFilter = ({ activeFilters, onFilterChange }: OrderFilterProps) => {
  const filters = [
    { id: 'all', label: 'All', color: 'default' },
    { id: 'business', label: 'Business', color: 'blue' },
    { id: 'orders', label: 'Orders Only', color: 'green' },
    { id: 'admin', label: 'Admin Only', color: 'purple' },
    { id: 'execrpt', label: 'ExecRpt', color: 'orange' },
    { id: 'system', label: 'System', color: 'red' }
  ];

  return (
    <div className="flex items-center space-x-2 p-4 bg-gray-50 border-b">
      <span className="text-sm font-medium text-gray-700">Filters:</span>
      {filters.map((filter) => (
        <Button
          key={filter.id}
          variant={activeFilters.includes(filter.id) ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange(filter.id)}
          className={`text-xs ${
            activeFilters.includes(filter.id) 
              ? 'bg-blue-600 text-white' 
              : 'border-gray-300 text-gray-600 hover:bg-gray-100'
          }`}
        >
          {filter.label}
        </Button>
      ))}
      <div className="ml-4 flex items-center space-x-1">
        <Badge variant="outline" className="text-xs">
          <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
          Heartbeat
        </Badge>
        <Badge variant="outline" className="text-xs">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
          Orders
        </Badge>
        <Badge variant="outline" className="text-xs">
          <span className="w-2 h-2 bg-orange-500 rounded-full mr-1"></span>
          System
        </Badge>
      </div>
    </div>
  );
};

export default OrderFilter;
