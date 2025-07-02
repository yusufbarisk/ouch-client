import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Send, RotateCcw, AlertCircle, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OrderExecutionPanelProps {
  isConnected: boolean;
  onSendOrder: (orderData: any) => void;
  prefillData?: {
    originalOrderId?: string;
    newOrderId?: string;
    orderBookId?: number;
    side?: string;
    quantity?: number;
    price?: number;
    displayQty?: number;
    timeInForce?: number;
    openClose?: number;
    clientCat?: number;
    offHours?: number;
    clientAccount?: string;
    customerInfo?: string;
    exchangeInfo?: string;
    isReplace?: boolean;
  };
}

interface OrderFormData {
  order_token: string;
  order_book_id: string;
  side: string;
  qty: string;
  price: string;
  time_in_force: string;
  open_close: string;
  client_account: string;
  customer_info: string;
  exchange_info: string;
  display_qty: string;
  client_category: string;
  off_hours: string;
}

const OrderExecutionPanel = ({ isConnected, onSendOrder, prefillData }: OrderExecutionPanelProps) => {
  const { toast } = useToast();
  
  const getInitialFormData = (): OrderFormData => {
  const baseData = {
    order_token: '',
    order_book_id: '',
    side: '',
    qty: '',
    price: '',
    time_in_force: '0',
    open_close: '0',
    client_account: '',
    customer_info: '',
    exchange_info: '',
    display_qty: '0',
    client_category: '1',
    off_hours: '0'
  };

  if (prefillData) {
    return {
      ...baseData,
      order_token: prefillData.newOrderId || '',
      order_book_id: prefillData.orderBookId !== undefined ? prefillData.orderBookId.toString() : '124',
      side: prefillData.side === 'Buy' ? 'B' : prefillData.side === 'Sell' ? 'S' : prefillData.side || '',
      qty: prefillData.quantity !== undefined ? prefillData.quantity.toString() : '',
      price: prefillData.price !== undefined ? prefillData.price.toString() : '',
      display_qty: prefillData.displayQty !== undefined ? prefillData.displayQty.toString() : '0',
      time_in_force: prefillData.timeInForce !== undefined ? prefillData.timeInForce.toString() : '0',
      open_close: prefillData.openClose !== undefined ? prefillData.openClose.toString() : '0',
      client_category: prefillData.clientCat !== undefined ? prefillData.clientCat.toString() : '1',
      off_hours: prefillData.offHours !== undefined ? prefillData.offHours.toString() : '0',
      client_account: prefillData.clientAccount || '',
      customer_info: prefillData.customerInfo || '',
      exchange_info: prefillData.exchangeInfo || '',
    };
  }

  return baseData;
};

  const [formData, setFormData] = useState<OrderFormData>(getInitialFormData);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when prefillData changes
  React.useEffect(() => {
    if (prefillData) {
      setFormData(getInitialFormData());
      setErrors({}); // Clear any existing errors
    }
  }, [prefillData]);

  const handleInputChange = (field: keyof OrderFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    if (!formData.order_token.trim()) newErrors.order_token = 'Order token is required';
    if (!formData.order_book_id.trim()) newErrors.order_book_id = 'Order book ID is required';
    if (!formData.side) newErrors.side = 'Side is required';
    if (!formData.qty.trim()) newErrors.qty = 'Quantity is required';
    if (!formData.price.trim()) newErrors.price = 'Price is required';
    if (!formData.client_account.trim()) newErrors.client_account = 'Client account is required';

    // Numeric validations
    if (formData.order_book_id && isNaN(Number(formData.order_book_id))) {
      newErrors.order_book_id = 'Must be a valid number';
    }
    if (formData.qty && (isNaN(Number(formData.qty)) || Number(formData.qty) <= 0)) {
      newErrors.qty = 'Must be a positive number';
    }
    if (formData.price && (isNaN(Number(formData.price)) || Number(formData.price) <= 0)) {
      newErrors.price = 'Must be a positive number';
    }
    if (formData.display_qty && isNaN(Number(formData.display_qty))) {
      newErrors.display_qty = 'Must be a valid number';
    }

    // Length validations
    if (formData.order_token.length > 14) newErrors.order_token = 'Max 14 characters';
    if (formData.client_account.length > 16) newErrors.client_account = 'Max 16 characters';
    if (formData.customer_info.length > 15) newErrors.customer_info = 'Max 15 characters';
    if (formData.exchange_info.length > 32) newErrors.exchange_info = 'Max 32 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!isConnected) {
      toast({
        title: "Not Connected",
        description: "Please connect to the server before sending orders",
        variant: "destructive"
      });
      return;
    }

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive"
      });
      return;
    }

    
    const orderData = {
      type: 'EnterOrder',
      order_token: formData.order_token,
      order_book_id: Number(formData.order_book_id),
      side: formData.side,
      qty: Number(formData.qty),
      price: Number(parseFloat(formData.price).toFixed(2)),
      time_in_force: Number(formData.time_in_force),
      open_close: Number(formData.open_close),
      client_account: formData.client_account,
      customer_info: formData.customer_info,
      exchange_info: formData.exchange_info,
      display_qty: Number(formData.display_qty),
      client_category: Number(formData.client_category),
      off_hours: Number(formData.off_hours)
    };

    onSendOrder(orderData);
    
    toast({
      title: "Order Sent",
      description: `Order ${formData.order_token} submitted successfully`,
      className: "bg-emerald-50 border-emerald-200 text-emerald-800"
    });
  };

  const handleReset = () => {
    setFormData({
      order_token: '',
      order_book_id: '',
      side: '',
      qty: '',
      price: '',
      time_in_force: '0',
      open_close: '0',
      client_account: '',
      customer_info: '',
      exchange_info: '',
      display_qty: '0',
      client_category: '1',
      off_hours: '0'
    });
    setErrors({});
  };

  const generateOrderToken = () => {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const token = `ORD${timestamp}${random}`.substring(0, 14);
    handleInputChange('order_token', token);
  };

  return (
    <div className="h-full overflow-auto p-6 bg-slate-50 space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <span>OUCH Order Execution</span>
            {prefillData?.isReplace && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                Replace Order
              </Badge>
            )}
            <Badge variant={isConnected ? "default" : "destructive"} className="ml-2">
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Replace Order Notice */}
          {prefillData?.isReplace && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <span className="font-medium text-orange-800">Replacing Order</span>
              </div>
              <p className="text-sm text-orange-700 mt-1">
                This form is pre-filled with data from order <code className="bg-orange-100 px-1 rounded">{prefillData.originalOrderId}</code>. 
                Modify the values as needed and submit to replace the original order.
              </p>
            </div>
          )}

          {/* Basic Order Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-800">Basic Information</h3>
              <Separator className="flex-1" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="order_token" className="text-sm font-medium">
                  Order Token <span className="text-red-500">*</span>
                </Label>
                <div className="flex space-x-2">
                  <Input
                    id="order_token"
                    placeholder="Enter order token"
                    value={formData.order_token}
                    onChange={(e) => handleInputChange('order_token', e.target.value)}
                    className={errors.order_token ? 'border-red-500' : ''}
                    maxLength={14}
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={generateOrderToken}
                    className="px-3"
                  >
                    Gen
                  </Button>
                </div>
                {errors.order_token && (
                  <div className="flex items-center space-x-1 text-red-500 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.order_token}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="order_book_id" className="text-sm font-medium">
                  Order Book ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="order_book_id"
                  type="number"
                  placeholder="e.g., 1001"
                  value={formData.order_book_id}
                  onChange={(e) => handleInputChange('order_book_id', e.target.value)}
                  className={errors.order_book_id ? 'border-red-500' : ''}
                />
                {errors.order_book_id && (
                  <div className="flex items-center space-x-1 text-red-500 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.order_book_id}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="side" className="text-sm font-medium">
                  Side <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.side} onValueChange={(value) => handleInputChange('side', value)}>
                  <SelectTrigger className={errors.side ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select side" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="B">Buy (B)</SelectItem>
                    <SelectItem value="S">Sell (S)</SelectItem>
                    <SelectItem value="T">Short Sell (T)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.side && (
                  <div className="flex items-center space-x-1 text-red-500 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.side}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="qty" className="text-sm font-medium">
                  Quantity <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="qty"
                  type="number"
                  placeholder="e.g., 100"
                  value={formData.qty}
                  onChange={(e) => handleInputChange('qty', e.target.value)}
                  className={errors.qty ? 'border-red-500' : ''}
                />
                {errors.qty && (
                  <div className="flex items-center space-x-1 text-red-500 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.qty}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm font-medium">
                  Price <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 150.25"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  className={errors.price ? 'border-red-500' : ''}
                />
                {errors.price && (
                  <div className="flex items-center space-x-1 text-red-500 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.price}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_qty" className="text-sm font-medium">
                  Display Quantity
                </Label>
                <Input
                  id="display_qty"
                  type="number"
                  placeholder="0 (no reserve)"
                  value={formData.display_qty}
                  onChange={(e) => handleInputChange('display_qty', e.target.value)}
                  className={errors.display_qty ? 'border-red-500' : ''}
                />
                {errors.display_qty && (
                  <div className="flex items-center space-x-1 text-red-500 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.display_qty}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Parameters */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-800">Order Parameters</h3>
              <Separator className="flex-1" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="time_in_force" className="text-sm font-medium">
                  Time in Force
                </Label>
                <Select value={formData.time_in_force} onValueChange={(value) => handleInputChange('time_in_force', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Day (0)</SelectItem>
                    <SelectItem value="3">Immediate or Cancel (3)</SelectItem>
                    <SelectItem value="4">Fill or Kill (4)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="open_close" className="text-sm font-medium">
                  Open/Close
                </Label>
                <Select value={formData.open_close} onValueChange={(value) => handleInputChange('open_close', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Open (0)</SelectItem>
                    <SelectItem value="1">Close (1)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_category" className="text-sm font-medium">
                  Client Category
                </Label>
                <Select value={formData.client_category} onValueChange={(value) => handleInputChange('client_category', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Retail (1)</SelectItem>
                    <SelectItem value="2">Professional (2)</SelectItem>
                    <SelectItem value="3">Institutional (3)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="off_hours" className="text-sm font-medium">
                  Off Hours
                </Label>
                <Select value={formData.off_hours} onValueChange={(value) => handleInputChange('off_hours', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No (0)</SelectItem>
                    <SelectItem value="1">Yes (1)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-800">Account Information</h3>
              <Separator className="flex-1" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_account" className="text-sm font-medium">
                  Client Account <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="client_account"
                  placeholder="Client account ID"
                  value={formData.client_account}
                  onChange={(e) => handleInputChange('client_account', e.target.value)}
                  className={errors.client_account ? 'border-red-500' : ''}
                  maxLength={16}
                />
                {errors.client_account && (
                  <div className="flex items-center space-x-1 text-red-500 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.client_account}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_info" className="text-sm font-medium">
                  Customer Info
                </Label>
                <Input
                  id="customer_info"
                  placeholder="Customer information"
                  value={formData.customer_info}
                  onChange={(e) => handleInputChange('customer_info', e.target.value)}
                  className={errors.customer_info ? 'border-red-500' : ''}
                  maxLength={15}
                />
                {errors.customer_info && (
                  <div className="flex items-center space-x-1 text-red-500 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.customer_info}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="exchange_info" className="text-sm font-medium">
                  Exchange Info
                </Label>
                <Input
                  id="exchange_info"
                  placeholder="Exchange information"
                  value={formData.exchange_info}
                  onChange={(e) => handleInputChange('exchange_info', e.target.value)}
                  className={errors.exchange_info ? 'border-red-500' : ''}
                  maxLength={32}
                />
                {errors.exchange_info && (
                  <div className="flex items-center space-x-1 text-red-500 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.exchange_info}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-600">
              <span className="text-red-500">*</span> Required fields
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex items-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isConnected}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4" />
                <span>Send Order</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderExecutionPanel;
