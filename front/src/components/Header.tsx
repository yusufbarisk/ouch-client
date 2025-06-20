
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Power, Activity, Zap } from 'lucide-react';
import ConnectionDialog from './ConnectionDialog';
import VariablesDialog from './VariablesDialog';
import SettingsDialog from './SettingsDialog';
import HelpDialog from './HelpDialog';

interface HeaderProps {
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

const Header = ({ isConnected, onConnect, onDisconnect }: HeaderProps) => {
  const handleConnectionConfig = (config: any) => {
    console.log('Connection config:', config);
    onConnect();
  };

  const handleVariablesSave = (variables: any[]) => {
    console.log('Variables saved:', variables);
  };

  return (
    <header className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-6 py-4 shadow-lg border-b border-slate-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Zap className="w-6 h-6 text-blue-400" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Bist
              </h1>
            </div>
            <div className="h-6 w-px bg-slate-600"></div>
            <span className="text-sm text-slate-300 font-medium">Professional Client</span>
          </div>
          
          <Badge 
            variant={isConnected ? "default" : "destructive"}
            className={`${
              isConnected 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg' 
                : 'bg-red-600 hover:bg-red-700 text-white shadow-lg'
            } px-3 py-1`}
          >
            {isConnected ? (
              <>
                <Activity className="w-3 h-3 mr-2 animate-pulse" />
                Connected
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 mr-2" />
                Disconnected
              </>
            )}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-3">
          <ConnectionDialog onConnect={handleConnectionConfig} />
          
          <VariablesDialog onSave={handleVariablesSave} />
          
          <div className="h-6 w-px bg-slate-600"></div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={isConnected ? onDisconnect : onConnect}
            className={`border-2 transition-all duration-200 ${
              isConnected 
                ? 'border-red-500 text-red-400 hover:bg-red-500 hover:text-white' 
                : 'border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-white'
            }`}
          >
            <Power className="w-4 h-4 mr-2" />
            {isConnected ? 'Disconnect' : 'Connect'}
          </Button>
          
          <SettingsDialog />
          
          <HelpDialog />
        </div>
      </div>
    </header>
  );
};

export default Header;
