export {};

declare global {
  interface Window {
    electronAPI: {
      onBackendConnected: (callback: () => void) => void;
      onBackendDisconnected: (callback: () => void) => void;
      onBackendEvent: (callback: (data: any) => void) => void;
      sendOrder: (order: any) => Promise<any>;
      sendConnectionConfig: (config: {
        host: string;
        port: string;
        senderCompID: string;
        targetCompID: string;
        senderSubID?: string;
        clOrdIDCounter?: string;
        username?: string;
        password?: string;
      }) => void;
      onConnectionConfigResponse: (callback: (response: any) => void) => void;
      onConnectionError: (callback: (error: any) => void) => void;
      onConnectionStatus: (callback: (status: { connected: boolean; message?: string }) => void) => void;
      onOrderResponse: (callback: (response: any) => void) => void;
      sendDisconnect: () => void;
    };
  }
}