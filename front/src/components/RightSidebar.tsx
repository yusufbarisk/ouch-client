import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TagIcon, BarChart3, Globe, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import TagsPanel from './TagsPanel';
import StatisticsPanel from './StatisticsPanel';
import SessionPanel from './SessionPanel';
import OrderExecutionPanel from './OrderExecutionPanel';

type PanelType = 'OE' | 'tags' | 'statistics' | 'session' | 'orderDetails' | null;

interface RightSidebarProps {
  selectedMessage: any;
  selectedOrder?: any;
  statistics: any;
  orders: any[];
  isConnected: boolean;
  onNewOrder?: (orderMessage: any) => void;
  orderPrefillData?: {
    originalOrderId?: string;
    newOrderId?: string;
    side?: string;
    symbol?: string;
    quantity?: number;
    price?: number;
    type?: string;
    isReplace?: boolean;
  };
  onClearPrefillData?: () => void;
  activePanel: PanelType;
  setActivePanel: (panel: PanelType) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const RightSidebar = ({
  selectedMessage,
  selectedOrder,
  statistics,
  orders,
  isConnected,
  onNewOrder,
  orderPrefillData,
  onClearPrefillData,
  activePanel,
  setIsCollapsed,
  isCollapsed,
  setActivePanel,
}: RightSidebarProps) => {

  React.useEffect(() => {
    if (orderPrefillData && orderPrefillData.isReplace) {
      setActivePanel('OE');
      setIsCollapsed(false);
    }
  }, [orderPrefillData, setActivePanel]);

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

    // Clear prefill data after order is sent
    if (onClearPrefillData) {
      onClearPrefillData();
    }

    console.log('Order sent:', order);
  };

  const sidebarItems = [
    {
      id: 'OE' as PanelType,
      icon: Globe,
      label: 'Order Exec',
      component: <OrderExecutionPanel onSendOrder={handleSendOrder} isConnected={isConnected} prefillData={orderPrefillData} />
    },
    // {
    //   id: 'tags' as PanelType,
    //   icon: TagIcon,
    //   label: 'Tags',
    //   component: <TagsPanel selectedMessage={selectedMessage} />
    // },
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
    {
      id: 'orderDetails' as PanelType,
      icon: FileText,
      label: 'Order Details',
      component: selectedOrder ? (
        <div className="p-4 space-y-4">
          <h3 className="text-lg font-semibold">Order Details - {selectedOrder.id}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Order ID</label>
              <div className="font-mono text-sm bg-gray-50 p-2 rounded">{selectedOrder.id}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Status</label>
              <div className="font-semibold">{selectedOrder.status}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Symbol</label>
              <div className="font-medium">{selectedOrder.symbol}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Side</label>
              <div className={selectedOrder.side === 'Buy' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                {selectedOrder.side}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Quantity</label>
              <div>{selectedOrder.quantity?.toLocaleString()}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Price</label>
              <div>${selectedOrder.price?.toFixed(2)}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Type</label>
              <div>{selectedOrder.type}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Time</label>
              <div>{selectedOrder.time}</div>
            </div>
          </div>

          {selectedOrder.ackMessage && (
            <div>
              <label className="text-sm font-medium text-gray-700">ACK Message</label>
              <div className="font-mono text-sm bg-blue-50 p-3 rounded border">
                <div className="mb-2 text-xs text-gray-600">
                  Type: {selectedOrder.ackMessage.type?.toUpperCase()} | Time: {selectedOrder.ackMessage.timestamp}
                </div>
                {selectedOrder.ackMessage.content}
              </div>
            </div>
          )}

          {selectedOrder.fillOrder && (
            <div>
              <label className="text-sm font-medium text-gray-700">Fill Details</label>
              <div className="bg-green-50 p-3 rounded border">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><strong>Counterparty:</strong> {selectedOrder.fillOrder.counterparty}</div>
                  <div><strong>Fill Time:</strong> {selectedOrder.fillOrder.timestamp}</div>
                  <div><strong>Fill Side:</strong> <span className={selectedOrder.fillOrder.side === 'Buy' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>{selectedOrder.fillOrder.side}</span></div>
                  <div><strong>Fill Price:</strong> ${selectedOrder.fillOrder.price?.toFixed(2)}</div>
                </div>
              </div>
            </div>
          )}

          {selectedOrder.rawData && (
            <div>
              <label className="text-sm font-medium text-gray-700">Raw Data</label>
              <pre className="font-mono text-xs bg-gray-50 p-3 rounded border overflow-x-auto">
                {JSON.stringify(selectedOrder.rawData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 text-center text-gray-500">
          Select an order to view details
        </div>
      )
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

export type { RightSidebarProps, PanelType };