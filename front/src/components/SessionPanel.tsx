
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface SessionPanelProps {
  isConnected: boolean;
}

const SessionPanel = ({ isConnected }: SessionPanelProps) => {
  const sessionData = {
    sessionId: "OUCH.3.0.0-CLIENT-SERVER",
    startTime: new Date().toISOString(),
    lastHeartbeat: new Date().toISOString(),
    heartbeatInterval: 30,
    incomingSeqNum: 1,
    outgoingSeqNum: 1,
    protocol: "OUCH 3.0.0",
    senderCompId: "CLIENT",
    targetCompId: "SERVER",
    encryptionMethod: "None",
    testRequestId: null,
    logonTime: isConnected ? new Date().toISOString() : null,
    resetSeqNumFlag: false
  };

  const timeline = [
    { time: "10:30:00", event: "Session Started", type: "info" },
    { time: "10:30:01", event: "Logon Sent (35=A)", type: "outgoing" },
    { time: "10:30:02", event: "Logon Received (35=A)", type: "incoming" },
    { time: "10:30:02", event: "Session Established", type: "success" },
    { time: "10:30:32", event: "Heartbeat Sent (35=0)", type: "heartbeat" },
    { time: "10:30:33", event: "Heartbeat Received (35=0)", type: "heartbeat" },
  ];

  const getEventColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'incoming': return 'bg-blue-100 text-blue-800';
      case 'outgoing': return 'bg-purple-100 text-purple-800';
      case 'heartbeat': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'incoming': return '📨';
      case 'outgoing': return '📤';
      case 'heartbeat': return '💓';
      default: return 'ℹ️';
    }
  };

  return (
    <div className="h-full overflow-auto p-6 bg-slate-50 space-y-6">
      {/* Session Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <span>🔗</span>
              <span>Session Information</span>
              <Badge className={isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Session ID:</span>
                <p className="font-mono">{sessionData.sessionId}</p>
              </div>
              <div>
                <span className="text-gray-600">Protocol:</span>
                <p className="font-medium">{sessionData.protocol}</p>
              </div>
              <div>
                <span className="text-gray-600">Sender Comp ID:</span>
                <p className="font-mono">{sessionData.senderCompId}</p>
              </div>
              <div>
                <span className="text-gray-600">Target Comp ID:</span>
                <p className="font-mono">{sessionData.targetCompId}</p>
              </div>
              <div>
                <span className="text-gray-600">Heartbeat Interval:</span>
                <p>{sessionData.heartbeatInterval}s</p>
              </div>
              <div>
                <span className="text-gray-600">Encryption:</span>
                <p>{sessionData.encryptionMethod}</p>
              </div>
            </div>
            
            <Separator />
            
            {isConnected && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Logon Time:</span>
                  <span>{new Date(sessionData.logonTime!).toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Heartbeat:</span>
                  <span>{new Date(sessionData.lastHeartbeat).toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Session Duration:</span>
                  <span>
                    {Math.floor((new Date().getTime() - new Date(sessionData.logonTime!).getTime()) / 1000)}s
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📊 Sequence Numbers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{sessionData.incomingSeqNum}</div>
                <div className="text-sm text-gray-600">Incoming Seq Num</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{sessionData.outgoingSeqNum}</div>
                <div className="text-sm text-gray-600">Outgoing Seq Num</div>
              </div>
            </div>
            
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Reset Seq Num Flag:</span>
                <Badge variant={sessionData.resetSeqNumFlag ? "default" : "outline"}>
                  {sessionData.resetSeqNumFlag ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Test Request ID:</span>
                <span className="font-mono">{sessionData.testRequestId || "None"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Session Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">⏱️ Session Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {timeline.map((event, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-16 text-sm text-gray-600 font-mono">
                  {event.time}
                </div>
                <div className="w-6 h-6 flex items-center justify-center">
                  <span className="text-lg">{getEventIcon(event.type)}</span>
                </div>
                <div className="flex-1">
                  <Badge className={`${getEventColor(event.type)} mr-2`}>
                    {event.type}
                  </Badge>
                  <span className="text-sm">{event.event}</span>
                </div>
              </div>
            ))}
          </div>
          
          {!isConnected && (
            <div className="mt-4 p-4 bg-orange-50 rounded-lg text-center">
              <p className="text-orange-800">⚠️ Connect to view real-time session events</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionPanel;
