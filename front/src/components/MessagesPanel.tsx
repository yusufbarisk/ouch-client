import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Send, X, Info, XCircle, Edit } from 'lucide-react';
import { OUCHMessage} from '@/pages/Index';



interface MessagesPanelProps {
  messages: OUCHMessage[];
  onSendMessage: (content: string) => void;
  isConnected: boolean;
  onSelectMessage: (message: OUCHMessage) => void;
  selectedMessage: OUCHMessage | null;
  onCancelOrder?: (orderId: string) => void;
  onReplaceOrder?: (orderId: string) => void;
}

function eventToOuchMessage(event: any): OUCHMessage {
  return {
    id: event.payload?.order_token || String(Date.now()),
    type: 'incoming',
    content: JSON.stringify(event.payload, null, 2),
    timestamp: new Date().toLocaleTimeString(),
    msgType: event.type,
    tags: {}, 
    status: 'delivered'
  };
}

const MessagesPanel = ({ 
  messages, 
  onSendMessage, 
  isConnected, 
  onSelectMessage, 
  selectedMessage,
  onCancelOrder,
  onReplaceOrder
}: MessagesPanelProps) => {
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [msgTypeFilter, setMsgTypeFilter] = useState('all');

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.msgType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || message.type === typeFilter;
    const matchesMsgType = msgTypeFilter === 'all' || message.msgType === msgTypeFilter;

    return matchesSearch && matchesType && matchesMsgType;
  });

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

  const clearFilters = () => {
    setTypeFilter('all');
    setMsgTypeFilter('all');
    setSearchTerm('');
  };

  const getMessageTypeColor = (type: string) => {
    return type === 'incoming' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  };

  const uniqueMsgTypes = [...new Set(messages.map(m => m.msgType))];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Search and Filter Bar */}
      <div className="p-4 border-b border-slate-200 space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search messages, types, content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </Button>
          {(typeFilter !== 'all' || msgTypeFilter !== 'all') && (
            <Button variant="ghost" onClick={clearFilters} className="flex items-center space-x-2">
              <X className="w-4 h-4" />
              <span>Clear</span>
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Direction</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Directions</SelectItem>
                  <SelectItem value="incoming">Incoming</SelectItem>
                  <SelectItem value="outgoing">Outgoing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Message Type</label>
              <Select value={msgTypeFilter} onValueChange={setMsgTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {uniqueMsgTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Messages List */}
      <div className="flex-1 p-4">
        {filteredMessages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="mb-2">📭</div>
            <p>No FIX messages found</p>
            <p className="text-sm">
              {messages.length === 0 
                ? "Messages will appear here when connected" 
                : "No messages match your search criteria"
              }
            </p>
          </div>
        ) : (
          <div className="h-full overflow-y-auto space-y-2">
            {filteredMessages.map((message) => (
            <div
              key={message.id}
              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                selectedMessage?.id === message.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
              onClick={() => onSelectMessage(message)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Badge className={getMessageTypeColor(message.type)}>
                    {message.type === 'incoming' ? '📨 IN' : '📤 OUT'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {message.msgType}
                  </Badge>
                  <span className="text-xs text-gray-500">{message.id}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">{message.timestamp}</span>
                  
                  {/* Action buttons for orders */}
                  {(message.msgType === 'enter_order' || message.msgType === 'replace_order') && (
                    <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 hover:bg-blue-100"
                        onClick={() => onSelectMessage(message)}
                        title="View Details"
                      >
                        <Info className="h-3 w-3 text-blue-600" />
                      </Button>
                      
                      {onCancelOrder && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 hover:bg-red-100"
                          onClick={() => onCancelOrder(message.id)}
                          title="Cancel Order"
                        >
                          <XCircle className="h-3 w-3 text-red-600" />
                        </Button>
                      )}
                      
                      {onReplaceOrder && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 hover:bg-orange-100"
                          onClick={() => onReplaceOrder(message.id)}
                          title="Replace Order"
                        >
                          <Edit className="h-3 w-3 text-orange-600" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="font-mono text-sm text-gray-800 bg-gray-50 p-2 rounded break-all">
                {message.content}
              </div>
              {/* {message.status && (
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs">
                    {message.status}
                  </Badge>
                </div>
              )} */}
            </div>
            ))}
          </div>
        )}
      </div>

      {/* Send Message */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex space-x-2">
          <Input
            placeholder={isConnected ? "Enter OUCH message..." : "Connect to send messages"}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!isConnected}
            className="flex-1 font-mono"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!isConnected || !newMessage.trim()}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export type { OUCHMessage };
export { eventToOuchMessage };

export default MessagesPanel;
