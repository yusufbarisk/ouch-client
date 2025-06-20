
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OrdersAndTransactions from '@/components/OrdersAndTransactions';
import MessagesPanel from '@/components/MessagesPanel';
import RightSidebar from '@/components/RightSidebar';
import { useToast } from '@/hooks/use-toast';

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
  const [isConnected, setIsConnected] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<FixMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<FixMessage | null>(null);
  const [statistics, setStatistics] = useState({
    totalOrders: 0,
    filled: 0,
    rejected: 0,
    pending: 0
  });
  const { toast } = useToast();

  const handleConnect = () => {
    setIsConnected(true);
    toast({
      title: "🟢 Connected Successfully",
      description: "Successfully connected to FIX server",
      className: "bg-emerald-50 border-emerald-200 text-emerald-800"
    });
    
    // Simulate receiving initial data
    setTimeout(() => {
      const sampleOrder: Order = {
        id: "ORD001",
        type: "Market",
        side: "Buy",
        symbol: "AAPL",
        quantity: 100,
        price: 150.25,
        status: "Filled",
        time: new Date().toLocaleTimeString()
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

  const handleSendMessage = (content: string) => {
    const tags = content.split('|').reduce((acc, tag) => {
      const [key, value] = tag.split('=');
      if (key && value) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    const newMessage: FixMessage = {
      id: `MSG${Date.now()}`,
      type: "outgoing",
      content: content,
      timestamp: new Date().toLocaleTimeString(),
      msgType: tags['35'] || 'Unknown',
      tags: tags,
      status: "sent"
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    toast({
      title: "Message Sent",
      description: "FIX message sent successfully"
    });
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
                💬 FIX Messages
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
        />
      </div>
    </div>
  );
};

export default Index;
