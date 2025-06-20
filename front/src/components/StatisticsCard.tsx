
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatisticsCardProps {
  title: string;
  value: number;
  color: 'blue' | 'green' | 'red' | 'orange';
  label?: string;
}

const StatisticsCard = ({ title, value, color, label }: StatisticsCardProps) => {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600', 
    red: 'text-red-600',
    orange: 'text-orange-600'
  };

  return (
    <Card className="bg-white hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${colorClasses[color]}`}>
          {value.toLocaleString()}
        </div>
        {label && (
          <p className="text-xs text-gray-500 mt-1">{label}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default StatisticsCard;
