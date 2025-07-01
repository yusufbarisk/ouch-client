
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OrdersAndTransactions from '@/components/OrdersAndTransactions';
import RightSidebar from '@/components/RightSidebar';
import { useToast } from '@/hooks/use-toast';
import MessagesPanel, { eventToOuchMessage } from '@/components/MessagesPanel';


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
    
    // Simulate receiving initial data
    setTimeout(() => {

      const ackMessage: Order['ackMessage'] = {
        id: "ACK001",
        content: "Order acknowledged",
        timestamp: new Date().toLocaleTimeString(),
        type: "ack",
      }

      const fillOrder: Order['fillOrder'] = {
        id: "FILL001",
        side: "Buy",
        symbol: "AAPL",
        quantity: 100,
        price: 150.25,
        timestamp: new Date().toLocaleTimeString(),
        counterparty: "BrokerXYZ"
      };
      const sampleOrder: Order = {
        id: "ORD001",
        type: "Market",
        side: "Buy",
        symbol: "AAPL",
        quantity: 100,
        price: 150.25,
        status: "Filled",
        time: new Date().toLocaleTimeString(),
        ackMessage: ackMessage
      };
      setOrders([sampleOrder]);
      setStatistics(prev => ({ ...prev, totalOrders: 1, filled: 1 }));
      
      const welcomeMessage: FixMessage = {
        id: "MSG001",
        type: "incoming",
        content: "8=FIX.4.2|9=55|35=A|49=SERVER|56=CLIENT|34=1|52=20231215-10:30:00|98=0|108=30|10=123|",
        timestamp: new Date().toLocaleTimeString(),
        msgType: "Logon",
        tags: {
          "8": "FIX.4.2",
          "9": "55",
          "35": "A",
          "49": "SERVER",
          "56": "CLIENT",
          "34": "1",
          "52": "20231215-10:30:00",
          "98": "0",
          "108": "30",
          "10": "123"
        }
      };
      setMessages([welcomeMessage]);
    }, 1000);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    toast({
      title: "🔴 Disconnected",
      description: "Disconnected from FIX server",
      variant: "destructive"
    });
  };


  useEffect(() => {
  // @ts-ignore
  window.electronAPI?.onBackendEvent((data) => {
    setEvents(prev => [...prev, data]);
    setMessages(prev => [...prev, eventToOuchMessage(data)]);

    
    if (data.type && data.type.startsWith("Type: A")) {
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
    }
    // rejects &  fills 
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
              <OrdersAndTransactions orders={orders} />
            </TabsContent>
            
            <TabsContent value="messages" className="flex-1 m-0">
              <MessagesPanel 
                messages={messages}
                onSendMessage={handleSendMessage}
                isConnected={isConnected}
                onSelectMessage={setSelectedMessage}
                selectedMessage={selectedMessage}
              />
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Right Sidebar */}
        <RightSidebar
          selectedMessage={selectedMessage}
          statistics={statistics}
          orders={orders}
          isConnected={isConnected}
          onNewOrder={handleNewOrder}
        />
      </div>
    </div>
  );
};

export default Index;
export type {OUCHMessage};