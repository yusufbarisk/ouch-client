
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, ChevronRight, Activity, MessageSquare, BarChart3, Globe } from 'lucide-react';

const HelpDialog = () => {
  const [activeSection, setActiveSection] = useState('overview');

  const helpSections = [
    {
      id: 'overview',
      title: '🚀 Overview',
      icon: Activity,
      content: (
        <div className="space-y-4 animate-fade-in">
          <p className="text-slate-600">
            Welcome to the FIX Trading Client! This application allows you to connect to FIX servers 
            and manage your trading orders efficiently.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">Key Features:</h4>
            <ul className="space-y-1 text-blue-700">
              <li>• Real-time FIX message handling</li>
              <li>• Order management and tracking</li>
              <li>• Comprehensive statistics and analytics</li>
              <li>• Session monitoring and control</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'connection',
      title: '🔗 Connection',
      icon: Globe,
      content: (
        <div className="space-y-4 animate-fade-in">
          <p className="text-slate-600">
            Learn how to establish and manage your FIX server connections.
          </p>
          <div className="space-y-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Step 1: Configure Connection</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  Click the "Connection" button in the header to open the connection dialog. 
                  Enter your server details including host, port, and credentials.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Step 2: Connect</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  Use the Connect/Disconnect button to manage your connection status. 
                  The status indicator will show your current connection state.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 'orders',
      title: '📊 Orders',
      icon: BarChart3,
      content: (
        <div className="space-y-4 animate-fade-in">
          <p className="text-slate-600">
            Manage your trading orders and view transaction history.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2">Order Status</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center space-x-2">
                  <Badge variant="default" className="bg-green-600">Filled</Badge>
                  <span className="text-green-700">Order executed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="destructive">Rejected</Badge>
                  <span className="text-red-700">Order declined</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-orange-500">Pending</Badge>
                  <span className="text-orange-700">Awaiting execution</span>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Order Types</h4>
              <div className="space-y-1 text-sm text-blue-700">
                <div>• Market Orders</div>
                <div>• Limit Orders</div>
                <div>• Stop Orders</div>
                <div>• Stop Limit Orders</div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'messages',
      title: '💬 Messages',
      icon: MessageSquare,
      content: (
        <div className="space-y-4 animate-fade-in">
          <p className="text-slate-600">
            Monitor and manage FIX protocol messages in real-time.
          </p>
          <div className="space-y-3">
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-800 mb-2">Message Types</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-purple-700">
                <div>• Logon (A)</div>
                <div>• Heartbeat (0)</div>
                <div>• New Order Single (D)</div>
                <div>• Execution Report (8)</div>
                <div>• Order Cancel Request (F)</div>
                <div>• Logout (5)</div>
              </div>
            </div>
            
            <Card>
              <CardContent className="pt-4">
                <h4 className="font-semibold mb-2">Message Format</h4>
                <code className="text-xs bg-slate-100 p-2 rounded block">
                  8=FIX.4.2|9=55|35=A|49=SERVER|56=CLIENT|...
                </code>
                <p className="text-sm text-slate-600 mt-2">
                  FIX messages use pipe-separated tag=value pairs for structured communication.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-700">
          <HelpCircle className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <HelpCircle className="w-5 h-5" />
            <span>Help & Documentation</span>
          </DialogTitle>
          <DialogDescription>
            Learn how to use the FIX Trading Client effectively.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex h-96">
          {/* Navigation Sidebar */}
          <div className="w-48 border-r border-slate-200 pr-4">
            <div className="space-y-2">
              {helpSections.map((section) => (
                <Button
                  key={section.id}
                  variant={activeSection === section.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveSection(section.id)}
                  className="w-full justify-start text-left"
                >
                  <section.icon className="w-4 h-4 mr-2" />
                  {section.title}
                  {activeSection === section.id && (
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  )}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Content Area */}
          <div className="flex-1 pl-6 overflow-auto">
            {helpSections.find(section => section.id === activeSection)?.content}
          </div>
        </div>
        
        <div className="border-t border-slate-200 pt-4 mt-4">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Need more help? Contact support at support@fixtrading.com</span>
            <Badge variant="outline">Version 1.0.0</Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HelpDialog;
