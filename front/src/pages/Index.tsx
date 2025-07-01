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

  const handleConnect = () => {
    // Check connection parameters (e.g., server URL, credentials)
    // retrieve from dialog


    setIsConnected(true);
    toast({
      title: "🟢 Connected Successfully",
      description: "Successfully connected to FIX server",
      className: "bg-emerald-50 border-emerald-200 text-emerald-800"
    });
    
    // // Simulate receiving initial data
    // setTimeout(() => {

    //   const ackMessage: Order['ackMessage'] = {
    //     id: "ACK001",
    //     content: "Order acknowledged",
    //     timestamp: new Date().toLocaleTimeString(),
    //     type: "ack",
    //   }

    //   const fillOrder: Order['fillOrder'] = {
    //     id: "FILL001",
    //     side: "Buy",
    //     symbol: "AAPL",
    //     quantity: 100,
    //     price: 150.25,
    //     timestamp: new Date().toLocaleTimeString(),
    //     counterparty: "BrokerXYZ"
    //   };
    //   const sampleOrder: Order = {
    //     id: "ORD001",
    //     type: "Market",
    //     side: "Buy",
    //     symbol: "AAPL",
    //     quantity: 100,
    //     price: 150.25,
    //     status: "Filled",
    //     time: new Date().toLocaleTimeString(),
    //     ackMessage: ackMessage
    //   };
    //   setOrders([sampleOrder]);
    //   setStatistics(prev => ({ ...prev, totalOrders: 1, filled: 1 }));
      
    //   const welcomeMessage: FixMessage = {
    //     id: "MSG001",
    //     type: "incoming",
    //     content: "8=FIX.4.2|9=55|35=A|49=SERVER|56=CLIENT|34=1|52=20231215-10:30:00|98=0|108=30|10=123|",
    //     timestamp: new Date().toLocaleTimeString(),
    //     msgType: "Logon",
    //     tags: {
    //       "8": "O.4.2",
    //       "9": "55",
    //       "35": "A",
    //       "49": "SERVER",
    //       "56": "CLIENT",
    //       "34": "1",
    //       "52": "20231215-10:30:00",
    //       "98": "0",
    //       "108": "30",
    //       "10": "123"
    //     }
    //   };
    //   setMessages([welcomeMessage]);
    // }, 1000);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    toast({
      title: "🔴 Disconnected",
      description: "Disconnected from OUCH server",
      variant: "destructive"
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
                    status: "Filled",
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

    const newOrder: Order = {
      id: orderMessage.id,
      type: 'Limit',
      side: orderMessage.tags.Side === 'B' ? 'Buy' : 'Sell',
      symbol: `BookID-${orderMessage.tags['Order Book ID'] || 'Unknown'}`,
      quantity: parseInt(orderMessage.tags.Quantity || '0'),
      price: parseFloat(orderMessage.tags.Price || '0'),
      status: 'Pending',
      time: orderMessage.timestamp,
      rawData: orderMessage
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
    
    // Create pre-filled order data for the order entry panel
    const prefillData = {
      originalOrderId: order.id,
      newOrderId: newOrderId,
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

  // Wrapper functions for MessagesPanel (which passes orderId strings)
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
        {/* Main Content Area */}
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