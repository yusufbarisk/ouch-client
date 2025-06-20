
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface FixMessage {
  id: string;
  type: 'incoming' | 'outgoing';
  content: string;
  timestamp: string;
  msgType: string;
  tags: Record<string, string>;
  status?: 'sent' | 'delivered' | 'error';
}

interface TagsPanelProps {
  selectedMessage: FixMessage | null;
}

const TagsPanel = ({ selectedMessage }: TagsPanelProps) => {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Text has been copied to your clipboard"
    });
  };

  // FIX tag descriptions for common tags
  const getTagDescription = (tag: string) => {
    const descriptions: Record<string, string> = {
      "8": "BeginString - FIX version",
      "9": "BodyLength - Message body length", 
      "35": "MsgType - Message type",
      "49": "SenderCompID - Sender company ID",
      "56": "TargetCompID - Target company ID",
      "34": "MsgSeqNum - Message sequence number",
      "52": "SendingTime - Message sending time",
      "98": "EncryptMethod - Encryption method",
      "108": "HeartBtInt - Heartbeat interval",
      "10": "CheckSum - Message checksum",
      "55": "Symbol - Trading symbol",
      "54": "Side - Buy/Sell indicator",
      "38": "OrderQty - Order quantity",
      "44": "Price - Order price",
      "40": "OrdType - Order type",
      "11": "ClOrdID - Client order ID",
      "37": "OrderID - Order ID",
      "150": "ExecType - Execution type",
      "39": "OrdStatus - Order status"
    };
    return descriptions[tag] || "Unknown tag";
  };

  if (!selectedMessage) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-gray-800">🏷️ Message Tags</h3>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-lg mb-2">No Message Selected</p>
            <p className="text-sm">Select a FIX message to view its tags and details</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-gray-800">🏷️ Message Tags</h3>
        <div className="flex items-center space-x-2 mt-2">
          <Badge className={selectedMessage.type === 'incoming' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
            {selectedMessage.type === 'incoming' ? '📨 IN' : '📤 OUT'}
          </Badge>
          <Badge variant="outline">
            {selectedMessage.msgType}
          </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Message Overview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Message Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">ID:</span>
              <span className="font-mono">{selectedMessage.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Time:</span>
              <span>{selectedMessage.timestamp}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Type:</span>
              <span>{selectedMessage.msgType}</span>
            </div>
            {selectedMessage.status && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Status:</span>
                <Badge variant="outline" className="text-xs">
                  {selectedMessage.status}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Raw Message */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Raw Message</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(selectedMessage.content)}
                className="h-6 w-6 p-0"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-xs bg-gray-50 p-3 rounded border break-all">
              {selectedMessage.content}
            </div>
          </CardContent>
        </Card>

        {/* Parsed Tags */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Parsed Tags</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(selectedMessage.tags).length === 0 ? (
              <p className="text-sm text-gray-500">No tags parsed</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(selectedMessage.tags).map(([tag, value], index) => (
                  <div key={tag}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge variant="outline" className="text-xs font-mono">
                            {tag}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(`${tag}=${value}`)}
                            className="h-4 w-4 p-0"
                          >
                            <Copy className="w-2 h-2" />
                          </Button>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">
                          {getTagDescription(tag)}
                        </p>
                        <p className="font-mono text-sm break-all bg-gray-50 p-2 rounded">
                          {value}
                        </p>
                      </div>
                    </div>
                    {index < Object.entries(selectedMessage.tags).length - 1 && (
                      <Separator className="mt-3" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TagsPanel;
