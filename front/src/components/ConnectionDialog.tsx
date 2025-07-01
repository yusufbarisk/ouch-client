
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Server, Settings2 } from 'lucide-react';

interface ConnectionDialogProps {
  onConnect: (config: any) => void;
}

const ConnectionDialog = ({ onConnect }: ConnectionDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({
    host: 'localhost',
    port: '9878',
    senderCompID: 'TEST_CLIENT',
    targetCompID: 'BIST_SERVER',
    senderSubID: '',
    clOrdIDCounter: '1',
    username: '',
    password: ''
  });

  const handleConnect = () => {
    onConnect(config);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-slate-700">
          <Server className="w-4 h-4" />
          Configure Connection
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            Connect to OUCH 3.0.0 Server
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h3 className="font-semibold text-orange-800 mb-2">OUCH 3.0.0</h3>
            <p className="text-sm text-orange-700">OUCH 3.0.0 Protocol</p>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Connection Profiles</Label>
              <div className="flex gap-2">
                <Select defaultValue="default">
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">Delete</Button>
              </div>
              <div className="flex gap-2 mt-2">
                <Input placeholder="Enter new profile name" className="flex-1" />
                <Button variant="outline" size="sm">Save</Button>
              </div>
              <p className="text-xs text-yellow-600 mt-1">💡 All settings including logon credentials are saved in profiles</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="host">Host</Label>
                <Input
                  id="host"
                  value={config.host}
                  onChange={(e) => setConfig({...config, host: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  value={config.port}
                  onChange={(e) => setConfig({...config, port: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="senderCompID">SenderCompID</Label>
                <Input
                  id="senderCompID"
                  value={config.senderCompID}
                  onChange={(e) => setConfig({...config, senderCompID: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="targetCompID">TargetCompID</Label>
                <Input
                  id="targetCompID"
                  value={config.targetCompID}
                  onChange={(e) => setConfig({...config, targetCompID: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="senderSubID">SenderSubID</Label>
                <Input
                  id="senderSubID"
                  placeholder="Optional"
                  value={config.senderSubID}
                  onChange={(e) => setConfig({...config, senderSubID: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="clOrdIDCounter">Starting ClOrdID Counter</Label>
                <Input
                  id="clOrdIDCounter"
                  value={config.clOrdIDCounter}
                  onChange={(e) => setConfig({...config, clOrdIDCounter: e.target.value})}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-blue-600 font-medium mb-3">Authentication</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="Optional"
                    value={config.username}
                    onChange={(e) => setConfig({...config, username: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Optional"
                    value={config.password}
                    onChange={(e) => setConfig({...config, password: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConnect} className="bg-blue-600 hover:bg-blue-700">
              Connect
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectionDialog;
