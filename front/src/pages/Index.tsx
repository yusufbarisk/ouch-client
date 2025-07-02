import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OrdersAndTransactions from '@/components/OrdersAndTransactions';
import RightSidebar from '@/components/RightSidebar';
import { useToast } from '@/hooks/use-toast';
import MessagesPanel, { eventToOuchMessage } from '@/components/MessagesPanel';
import { PanelType } from '@/components/RightSidebar';
import { set } from 'date-fns';

interface Order {
  id: string;
  type: string;
  side: 'Buy' | 'Sell';
  symbol: string;
  quantity: number;  
  price: number;
  status: 'Pending' | 'Filled' | 'Rejected' | 'Partial' | 'Cancelled';
  time: string;

  // For prefill storing
  order_book_id?: string;
  displayQuantity?: number;
  timeInForce?: number;
  openClose?: number;
  clientCategory?: number;
  offHours?: number;
  clientAccount?: string;
  customerInfo?: string;
  exchangeInfo?: string;


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
  rawData?: any;
}

interface OUCHMessage {
  id: string;
  type: 'incoming' | 'outgoing';
  content: string;
  timestamp: string;
  msgType: string;
  tags: Record<string, string>;
  status?: 'sent' | 'delivered' | 'error';
}

interface FixMessage {
  id: string;
  type: 'incoming' | 'outgoing';
  content: string;
  timestamp: string;
  msgType: string;
  tags: Record<string, string>;
  status?: 'sent' | 'delivered' | 'error';
}

const Index = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<OUCHMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<OUCHMessage | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeSidebarPanel, setActiveSidebarPanel] = useState<PanelType>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [orderPrefillData, setOrderPrefillData] = useState<{
    originalOrderId?: string;
    newOrderId?: string;
    orderBookId?: number;
    displayQty?: number;
    timeInForce?: number;
    openClose?: number;
    clientCat?: number;
    offHours?: number;
    clientAccount?: string;
    customerInfo?: string;
    exchangeInfo?: string;
    side?: string;
    symbol?: string;
    quantity?: number;
    price?: number;
    type?: string;
    isReplace?: boolean;
  } | null>(null);
  const [statistics, setStatistics] = useState({
    totalOrders: 0,
    filled: 0,
    rejected: 0,
    pending: 0
  });
  const { toast } = useToast();

  
  const handleConnect = (config: any) => {
    if (!config) {
      toast({
        title: "❌ No Config Provided",
        description: "Please fill out the connection dialog.",
        variant: "destructive"
      });
      return;
    }
    window.electronAPI?.sendConnectionConfig(config);

    window.electronAPI?.onConnectionConfigResponse((response) => {
      if (response.success) {
        setIsConnected(true);
        toast({
          title: "🟢 Connected Successfully",
          description: "Successfully connected to OUCH server",
          className: "bg-emerald-50 border-emerald-200 text-emerald-800"
        });
      } else {
        toast({
          title: "❌ Connection Failed",
          description: response.error || "Failed to connect",
          variant: "destructive"
        });
      }
    });

    window.electronAPI?.onConnectionError((error) => {
      toast({
        title: "❌ Connection Error",
        description: error,
        variant: "destructive"
      });
    });
  };

  const handleDisconnect = () => {
    window.electronAPI?.sendDisconnect();
    setIsConnected(false);
    toast({
      title: "🔴 Disconnecting...",
      description: "Sending disconnect request",
    });
  };


  useEffect(() => {
    // @ts-ignore
    window.electronAPI?.onBackendEvent((data) => {
      setEvents(prev => [...prev, data]);
      setMessages(prev => [...prev, eventToOuchMessage(data)]);

      const type = data.type || "";
      switch (true) {
        case type.startsWith("Type: A"): { // Ack
          const ack = data.payload;
          setOrders(prevOrders =>
            prevOrders.map(order =>
              order.id === ack.order_token
                ? {
                    ...order,
                    status: "Pending",
                    ackMessage: {
                      id: ack.order_token,
                      content: JSON.stringify(ack, null, 2),
                      timestamp: new Date().toLocaleTimeString(),
                      type: "ack"
                    },
                    rawData: ack
                  }
                : order
            )
          );
          break;
        }
        case type.startsWith("Type: C"): { // Cancel
          const cancel = data.payload;
          setOrders(prevOrders =>
            prevOrders.map(order =>
              order.id === cancel.order_token
                ? {
                    ...order,
                    status: "Cancelled",
                    ackMessage: {
                      id: cancel.order_token,
                      content: JSON.stringify(cancel, null, 2),
                      timestamp: new Date().toLocaleTimeString(),
                      type: "ack"
                    },
                    rawData: cancel
                  }
                : order
            )
          );
          break;
        }
        case type.startsWith("Type: F"): { // Fill
          const fill = data.payload;
          setOrders(prevOrders =>
            prevOrders.map(order =>
              order.id === fill.order_token
                ? {
                    ...order,
                    status: "Filled",
                    fillOrder: {
                      id: fill.order_token,
                      side: order.side,
                      symbol: order.symbol,
                      quantity: fill.executed_quantity || order.quantity,
                      price: fill.executed_price || order.price,
                      timestamp: new Date().toLocaleTimeString(),
                      counterparty: fill.counterparty || "Unknown"
                    },
                    rawData: fill
                  }
                : order
            )
          );
          break;
        }
        case type.startsWith("Type: J"): { // Reject
          const reject = data.payload;
          setOrders(prevOrders =>
            prevOrders.map(order =>
              order.id === reject.order_token
                ? {
                    ...order,
                    status: "Rejected",
                    ackMessage: {
                      id: reject.order_token,
                      content: JSON.stringify(reject, null, 2),
                      timestamp: new Date().toLocaleTimeString(),
                      type: "reject"
                    },
                    rawData: reject
                  }
                : order
            )
          );
          break;
        }
        default:
          // Handle other types or ignore
          break;
      }
    });
  }, []);



  const handleSendMessage = (content: string) => {
    
    setMessages(prev => [
      ...prev,
      {
        id: String(Date.now()),
        type: 'outgoing',
        content,
        timestamp: new Date().toLocaleTimeString(),
        msgType: 'Manual',
        tags: {},
        status: 'sent',
      },
    ]);
  };

  const handleNewOrder = (orderMessage: any) => {
    console.log('handleNewOrder called with:', orderMessage);
    
    setMessages(prev => {
      console.log('Previous messages count:', prev.length);
      const newMessages = [orderMessage, ...prev];
      console.log('New messages count:', newMessages.length);
      return newMessages;
    });

    const tags = orderMessage.tags || {};

    const newOrder: Order = {
      id: orderMessage.id,
      type: 'Limit',
      side: orderMessage.tags.Side === 'B' ? 'Buy' : 'Sell',
      symbol: `BookID-${orderMessage.tags['Order Book ID'] || 'Unknown'}`,
      quantity: parseInt(orderMessage.tags.Quantity || '0'),
      price: parseFloat(orderMessage.tags.Price || '0'),
      status: 'Pending',
      time: orderMessage.timestamp,
      rawData: orderMessage,

      order_book_id: tags['Order Book ID'] || '',
      displayQuantity: tags['Display Quantity'] ? Number(tags['Display Quantity']) : undefined,
      timeInForce: tags['Time In Force'] ? Number(tags['Time In Force']) : undefined,
      openClose: tags['Open/Close'] ? Number(tags['Open/Close']) : undefined,
      clientCategory: tags['Client Category'] ? Number(tags['Client Category']) : undefined,
      offHours: tags['Off Hours'] ? Number(tags['Off Hours']) : undefined,
      clientAccount: tags['Client Account'] || '',
      customerInfo: tags['Customer Info'] || '',
      exchangeInfo: tags['Exchange Info'] || '',
    };
    
    setOrders(prev => [newOrder, ...prev]);
    
    // Update statistics
    setStatistics(prev => ({
      ...prev,
      totalOrders: prev.totalOrders + 1,
      pending: prev.pending + 1
    }));
  };

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setActiveSidebarPanel('orderDetails');
    setIsSidebarCollapsed(false); 
  };

  const handleCancelOrder = (order: Order) => {
    console.log('Cancel order:', order.id);
    
    const cancelMessage = {
      type: "CancelOrder",
      order_token: order.id.padEnd(14, '\0'), // Pad to 14 bytes for OUCH protocol
    };
    
    if (window.electronAPI) {
      window.electronAPI.sendOrder(cancelMessage);
      toast({
        title: "Cancel Order",
        description: `Cancel request sent for order ${order.id}`,
      });
    } else {
      toast({
        title: "Error",
        description: "Cannot send cancel order - not connected to backend",
        variant: "destructive"
      });
    }
  };

  const handleReplaceOrder = (order: Order) => {
    console.log('Replace order:', order.id);
    
    // Generate new order ID by replacing "ORD" prefix with "R_"
    const newOrderId = order.id.startsWith('ORD') 
      ? order.id.replace('ORD', 'R_')
      : `R_${order.id.substring(2)}`; // Fallback if doesn't start with ORD
    
    const prefillData = {
      originalOrderId: order.id,
      newOrderId: newOrderId,
      orderBookId: order.order_book_id ? Number(order.order_book_id) : undefined,
      displayQty: order.displayQuantity,
      timeInForce: order.timeInForce,
      openClose: order.openClose,
      clientCat: order.clientCategory,
      offHours: order.offHours,
      clientAccount: order.clientAccount,
      customerInfo: order.customerInfo,
      exchangeInfo: order.exchangeInfo,
      side: order.side,
      symbol: order.symbol,
      quantity: order.quantity,
      price: order.price,
      type: order.type,
      isReplace: true
    };
      
    setOrderPrefillData(prefillData);
    
    toast({
      title: "Replace Order",
      description: `Opening order entry panel for replacing order ${order.id}`,
    });
    
    console.log('Prefill data for replace order:', prefillData);
  };

  const handleCancelOrderById = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      handleCancelOrder(order);
    } else {
      console.warn('Order not found for cancel:', orderId);
      toast({
        title: "Error",
        description: `Order ${orderId} not found`,
        variant: "destructive"
      });
    }
  };

  const handleReplaceOrderById = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      handleReplaceOrder(order);
    } else {
      console.warn('Order not found for replace:', orderId);
      toast({
        title: "Error", 
        description: `Order ${orderId} not found`,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <Header 
        isConnected={isConnected}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Main */}
        <div className="flex-1 flex flex-col">
          <Tabs defaultValue="orders" className="flex-1 flex flex-col">
            <TabsList className="w-full justify-start bg-white border-b border-slate-200 rounded-none px-4">
              <TabsTrigger value="orders" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                📊 Orders & Transactions
              </TabsTrigger>
              <TabsTrigger value="messages" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                💬 Debug Messages
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="orders" className="flex-1 m-0">
              <OrdersAndTransactions 
                orders={orders} 
                onSelectOrder={handleSelectOrder}
                onCancelOrder={handleCancelOrder}
                onReplaceOrder={handleReplaceOrder}
              />
            </TabsContent>
            
            <TabsContent value="messages" className="flex-1 m-0">
              <MessagesPanel 
                messages={messages}
                onSendMessage={handleSendMessage}
                isConnected={isConnected}
                onSelectMessage={setSelectedMessage}
                selectedMessage={selectedMessage}
                onCancelOrder={handleCancelOrderById}
                onReplaceOrder={handleReplaceOrderById}
              />
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Right Sidebar */}
        <RightSidebar
          selectedMessage={selectedMessage}
          selectedOrder={selectedOrder}
          statistics={statistics}
          orders={orders}
          isConnected={isConnected}
          onNewOrder={handleNewOrder}
          orderPrefillData={orderPrefillData}
          onClearPrefillData={() => setOrderPrefillData(null)}
          activePanel={activeSidebarPanel}
          setActivePanel={setActiveSidebarPanel}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />
      </div>
    </div>
  );
};

export default Index;
export type {OUCHMessage};