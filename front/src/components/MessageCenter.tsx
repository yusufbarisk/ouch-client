
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, MessageSquare } from 'lucide-react';

interface Message {
  id: string;
  type: 'incoming' | 'outgoing';
  content: string;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'error';
}

interface MessageCenterProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isConnected: boolean;
}

const MessageCenter = ({ messages, onSendMessage, isConnected }: MessageCenterProps) => {
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = () => {
    if (newMessage.trim() && isConnected) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <Card className="bg-white h-96 flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-gray-800 flex items-center">
          <MessageSquare className="w-5 h-5 mr-2" />
          FIX Messages
          <Badge variant="outline" className="ml-2 text-xs">
            {messages.length} messages
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1 bg-gray-50 rounded-lg p-3 mb-3 overflow-y-auto max-h-64">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No FIX messages yet</p>
              <p className="text-sm">Messages will appear here when connected</p>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-2 rounded text-sm ${
                    message.type === 'outgoing'
                      ? 'bg-blue-100 text-blue-800 ml-4'
                      : 'bg-white text-gray-800 mr-4 border'
                  }`}
                >
                  <div className="font-mono text-xs mb-1">{message.content}</div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{message.timestamp}</span>
                    {message.type === 'outgoing' && message.status && (
                      <Badge variant="outline" className="text-xs">
                        {message.status}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Input
            placeholder={isConnected ? "Enter FIX message..." : "Connect to send messages"}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!isConnected}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!isConnected || !newMessage.trim()}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MessageCenter;
