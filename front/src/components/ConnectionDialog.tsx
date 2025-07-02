import React, { useState, useEffect } from 'react';
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
import { Server, Settings2, Trash2 } from 'lucide-react';

interface ConnectionConfig {
  host: string;
  port: string;
  senderCompID: string;
  targetCompID: string;
  senderSubID: string;
  clOrdIDCounter: string;
  username: string;
  password: string;
}

interface ConnectionProfile {
  name: string;
  config: ConnectionConfig;
}

interface ConnectionDialogProps {
  onConnect: (config: any) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const ConnectionDialog = ({ onConnect, isOpen, onOpenChange }: ConnectionDialogProps) => {

  const getDefaultConfig = (): ConnectionConfig => ({
    host: 'localhost',
    port: '9999',
    senderCompID: 'TEST_CLIENT',
    targetCompID: 'BIST_SERVER',
    senderSubID: '',
    clOrdIDCounter: '1',
    username: 'admin',
    password: 'admin'
  });

  const [config, setConfig] = useState<ConnectionConfig>(getDefaultConfig());
  const [profiles, setProfiles] = useState<ConnectionProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [newProfileName, setNewProfileName] = useState('');

  const saveProfiles = (updatedProfiles: ConnectionProfile[]) => {
    try {
      localStorage.setItem('ouch-client-profiles', JSON.stringify(updatedProfiles));
      setProfiles(updatedProfiles);
    } catch (error) {
      console.error('Failed to save profiles:', error);
    }
  };

  useEffect(() => {
    const loadProfiles = () => {
      try {
        const savedProfiles = localStorage.getItem('ouch-client-profiles');
        if (savedProfiles) {
          const parsedProfiles = JSON.parse(savedProfiles);
          setProfiles(parsedProfiles);
          
          if (parsedProfiles.length > 0) {
            const currentProfile = parsedProfiles.find(p => p.name === selectedProfile);
            if (!selectedProfile || !currentProfile) {
              const firstProfile = parsedProfiles[0];
              setSelectedProfile(firstProfile.name);
              setConfig(firstProfile.config);
            } else {
              // Update config with the current profile's data
              setConfig(currentProfile.config);
            }
          }
        } else {
          const defaultProfile: ConnectionProfile = {
            name: 'Default',
            config: getDefaultConfig()
          };
          const defaultProfiles = [defaultProfile];
          saveProfiles(defaultProfiles);
          setSelectedProfile('Default');
          setConfig(getDefaultConfig());
        }
      } catch (error) {
        console.error('Failed to load profiles:', error);
      }
    };

    if (isOpen) {
      loadProfiles();
    }
  }, [isOpen]);

  const handleProfileSelect = (profileName: string) => {
    setSelectedProfile(profileName);
    const profile = profiles.find(p => p.name === profileName);
    if (profile) {
      setConfig(profile.config);
    }
  };

  const handleSaveProfile = () => {
    if (!newProfileName.trim()) {
      alert('Please enter a profile name');
      return;
    }

    if (profiles.some(p => p.name === newProfileName)) {
      alert('A profile with this name already exists');
      return;
    }

    const newProfile: ConnectionProfile = {
      name: newProfileName,
      config: { ...config }
    };

    const updatedProfiles = [...profiles, newProfile];
    saveProfiles(updatedProfiles);
    setSelectedProfile(newProfileName);
    setNewProfileName('');
  };

  const updateCurrentProfile = () => {
    if (!selectedProfile) return;

    const updatedProfiles = profiles.map(profile => 
      profile.name === selectedProfile 
        ? { ...profile, config: { ...config } }
        : profile
    );
    saveProfiles(updatedProfiles);
  };

  useEffect(() => {
    if (selectedProfile && profiles.length > 0) {
      updateCurrentProfile();
    }
  }, [config]);

  const handleDeleteProfile = () => {
    if (!selectedProfile) {
      alert('No profile selected');
      return;
    }

    if (profiles.length === 1) {
      alert('Cannot delete the last profile');
      return;
    }

    const updatedProfiles = profiles.filter(p => p.name !== selectedProfile);
    saveProfiles(updatedProfiles);
    
    if (updatedProfiles.length > 0) {
      const firstProfile = updatedProfiles[0];
      setSelectedProfile(firstProfile.name);
      setConfig(firstProfile.config);
    } else {
      setSelectedProfile('');
    }
  };

  const handleConnect = () => {
    window.electronAPI.sendConnectionConfig(config);
    console.log('Sending connection config');
    
    window.electronAPI.onConnectionConfigResponse((response) => {
      console.log('Connection response:', response);
    });
    window.electronAPI.onConnectionError((error) => {
      console.error('Connection error:', error);
    });
    onConnect(config);
    onOpenChange(false);
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
                <Select value={selectedProfile} onValueChange={handleProfileSelect}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a profile" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.name} value={profile.name}>
                        {profile.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDeleteProfile}
                  disabled={!selectedProfile || profiles.length <= 1}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex gap-2 mt-2">
                <Input 
                  placeholder="Enter new profile name" 
                  className="flex-1"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSaveProfile()}
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSaveProfile}
                  disabled={!newProfileName.trim()}
                >
                  Save
                </Button>
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
            <Button variant="outline" onClick={() => onOpenChange(false)}>
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
