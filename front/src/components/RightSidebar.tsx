
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TagIcon, BarChart3, Globe, ChevronLeft, ChevronRight } from 'lucide-react';
import TagsPanel from './TagsPanel';
import StatisticsPanel from './StatisticsPanel';
import SessionPanel from './SessionPanel';
import OrderExecutionPanel from './OrderExecutionPanel';

interface RightSidebarProps {
  selectedMessage: any;
  statistics: any;
  orders: any[];
  isConnected: boolean;
  onNewOrder?: (orderMessage: any) => void;
}

type PanelType = 'OE' | 'tags' | 'statistics' | 'session' | null;

const RightSidebar = ({ selectedMessage, statistics, orders, isConnected, onNewOrder }: RightSidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [activePanel, setActivePanel] = useState<PanelType>(null);

  const handlePanelSelect = (panel: PanelType) => {
    if (activePanel === panel && !isCollapsed) {
      setIsCollapsed(true);
      setActivePanel(null);
    } else {
      setActivePanel(panel);
      setIsCollapsed(false);
    }
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    if (isCollapsed) {
      setActivePanel(null);
    }
  };

  const handleSendOrder = (order: any) => {
    console.log('handleSendOrder called with:', order);

    // Send order to backend
    window.electronAPI.sendOrder(order);
    
    // Add order to message panel (if callback is provided)
    if (onNewOrder) {
      console.log('onNewOrder callback exists, creating order message...');
      const orderMessage = {
        id: order.order_token,
        timestamp: new Date().toLocaleTimeString(),
        type: 'outgoing',
        msgType: 'EnterOrder',
        content: `${order.side} ${order.qty} @ ${order.price} (${order.order_token})`,
        tags: {
          'Order Token': order.order_token,
          'Side': order.side,
          'Quantity': order.qty.toString(),
          'Price': order.price.toString()
        },
        status: 'sent'
      };
      console.log('Calling onNewOrder with:', orderMessage);
      onNewOrder(orderMessage);
    } else {
      console.log('onNewOrder callback is NOT available');
    }

    console.log('Order sent:', order);
  };

  const sidebarItems = [
    {
      id: 'OE' as PanelType,
      icon: Globe,
      label: 'Order Exec',
      component: <OrderExecutionPanel onSendOrder={handleSendOrder} isConnected={isConnected} />
    },
    {
      id: 'tags' as PanelType,
      icon: TagIcon,
      label: 'Tags',
      component: <TagsPanel selectedMessage={selectedMessage} />
    },
    {
      id: 'statistics' as PanelType,
      icon: BarChart3,
      label: 'Statistics',
      component: <StatisticsPanel statistics={statistics} orders={orders} />
    },
    {
      id: 'session' as PanelType,
      icon: Globe,
      label: 'Session',
      component: <SessionPanel isConnected={isConnected} />
    },
    
  ];

  return (
    <div className={`flex border-l border-slate-200 bg-white transition-all duration-300 ${
      isCollapsed ? 'w-16 lg:w-24 ' : 'w-[50rem]'
    }`}>
      {/* Collapsed Sidebar with Icons */}
      <div className="w-16 lg:w-24  bg-slate-50 border-r border-slate-200 flex flex-col">
        <div className="p-2 border-b border-slate-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="w-full p-2"
          >
            {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
        
        <div className="flex flex-col space-y-2 p-2">
          {sidebarItems.map((item) => (
            <Button
              key={item.id}
              variant={activePanel === item.id ? "default" : "ghost"}
              size="sm"
              onClick={() => handlePanelSelect(item.id)}
              className="w-full p-2 h-12 flex flex-col items-center justify-center"
              title={item.label}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Expanded Content */}
      {!isCollapsed && activePanel && (
        <div className="flex-1 overflow-hidden">
          <div className="h-full">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-800">
                {sidebarItems.find(item => item.id === activePanel)?.label}
              </h3>
            </div>
            <div className="h-full overflow-auto">
              {sidebarItems.find(item => item.id === activePanel)?.component}
            </div>
          </div>
        </div>  
      )}
    </div>
  );
};

export default RightSidebar;
