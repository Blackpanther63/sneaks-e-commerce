import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, ChevronRight, MapPin, Truck, RefreshCcw, CreditCard, Box, HelpCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

type Message = {
  id: number;
  type: 'bot' | 'user';
  text: string;
  options?: string[];
  orderOptions?: { id: number; name: string; status: string }[];
  isComplaintForm?: boolean;
};

const MENU_OPTIONS = [
  { label: "Track my order", icon: Truck },
  { label: "Report a Problem", icon: AlertCircle },
  { label: "Return or exchange product", icon: RefreshCcw },
  { label: "Payment issues", icon: CreditCard },
  { label: "Product availability", icon: Box },
  { label: "Shipping information", icon: MapPin },
  { label: "Contact support", icon: HelpCircle }
];

export const AIChatWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 1, 
      type: 'bot', 
      text: "Hi 👋 I'm Sneaks AI Assistant. How can I help you today?",
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasOrders, setHasOrders] = useState<boolean | null>(null);
  
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [userOrders, setUserOrders] = useState<{ id: number; name: string; status: string }[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    const checkOrders = async () => {
      if (user) {
        try {
          const { data } = await api.get('/orders');
          setHasOrders(data.length > 0);
          setUserOrders(data.map((o: any) => ({ id: o.id, name: o.product_name, status: o.status })));
        } catch (err) {
          console.error('Failed to fetch orders:', err);
        }
      }
    };
    if (isOpen && user) checkOrders();
  }, [isOpen, user]);

  useEffect(() => {
    const handleToggle = () => setIsOpen(true);
    window.addEventListener('openAIChat', handleToggle);
    return () => window.removeEventListener('openAIChat', handleToggle);
  }, []);

  const handleOptionClick = (option: string) => {
    addMessage('user', option);
    setIsTyping(true);
    
    setTimeout(() => {
      let botResponse = '';
      let nextOptions: string[] = [];

      switch (option) {
        case "Track my order":
          if (!user) {
            botResponse = "Please log in to track your orders! Would you like to go to the login page?";
            nextOptions = ["Go to Login"];
          } else if (hasOrders === false) {
            botResponse = "It looks like you haven't placed any orders yet. Once you do, they'll show up here for tracking!";
            nextOptions = ["Shop New Arrivals", "Back to Menu"];
          } else {
            botResponse = "I can definitely help with that! Please choose how you'd like to track:";
            nextOptions = ["View in My Orders", "Track via Order ID"];
          }
          break;
        case "Report a Problem":
          if (!user) {
            botResponse = "To register a formal complaint, please log in first so we can track it to your account.";
            nextOptions = ["Go to Login"];
          } else {
            botResponse = "I'm sorry to hear you're having trouble. You can tell me about the issue right here, or I can help you select an order to report a problem with.";
            if (userOrders.length > 0) {
              addMessage('bot', botResponse, undefined, userOrders);
              return;
            }
          }
          break;
        case "View in My Orders":
          botResponse = "Perfect. You can find all your live orders in your Profile under 'Order History'. Would you like me to take you there?";
          nextOptions = ["Go to Orders", "Back to Menu"];
          break;
        case "Return or exchange product":
          botResponse = "We're sorry it didn't work out. To start a return, please ensure:\n1. Items are unworn\n2. Original tags are attached\n\nWhat would you like to do?";
          nextOptions = ["Start Return", "Exchange Size", "Return Policy"];
          break;
        case "Payment issues":
          botResponse = "If your payment was deducted but the order failed, don't worry! It usually auto-refunds in 3-5 days. Did you use UPI or Card?";
          nextOptions = ["UPI Issue", "Card/Bank Issue", "Contact Agent"];
          break;
        case "Go to Login":
          window.location.href = '/auth';
          return;
        case "Go to Orders":
          window.location.href = '/profile?section=orders';
          return;
        case "Shop New Arrivals":
          window.location.href = '/';
          return;
        case "Back to Menu":
          botResponse = "No problem! What else can I help you with?";
          break;
        default:
          botResponse = "I've noted that down. A support specialist will review this and get back to you within 24 hours. Anything else?";
          nextOptions = ["Back to Menu"];
      }

      setIsTyping(false);
      if (botResponse) addMessage('bot', botResponse, nextOptions.length > 0 ? nextOptions : undefined);
    }, 1000);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    const text = inputValue;
    addMessage('user', text);
    setInputValue('');
    setIsTyping(true);

    try {
      const { data } = await api.post('/ai/chat', { 
        message: text, 
        selectedOrderId: selectedOrderId 
      });
      
      setIsTyping(false);
      addMessage('bot', data.text, undefined, data.orders);
    } catch (err) {
      console.error('AI Chat Error:', err);
      setIsTyping(false);
      addMessage('bot', "I'm having a bit of trouble connecting to my brain right now! 🧠💨 Please try again in a moment.");
    }
  };

  const handleOrderSelect = (orderId: number, orderName: string) => {
    setSelectedOrderId(orderId.toString());
    addMessage('user', `I'm asking about Order #${orderId} (${orderName})`);
    setIsTyping(true);
    
    setTimeout(async () => {
      try {
        const { data } = await api.post('/ai/chat', { 
          message: `I selected Order #${orderId}. Tell me about its status.`, 
          selectedOrderId: orderId.toString() 
        });
        setIsTyping(false);
        addMessage('bot', data.text);
      } catch (err) {
        setIsTyping(false);
        addMessage('bot', "Sorry, I couldn't fetch details for that order. Try asking me directly!");
      }
    }, 800);
  };

  const selectProblemType = (type: string) => {
    addMessage('user', type);
    setIsTyping(true);
    setTimeout(async () => {
      try {
        const { data } = await api.post('/ai/chat', { 
          message: `I'm reporting a problem: ${type}`, 
          selectedOrderId: selectedOrderId 
        });
        setIsTyping(false);
        addMessage('bot', data.text);
      } catch (err) {
        setIsTyping(false);
        addMessage('bot', "Sorry, I couldn't register that problem. Please try describing it to me.");
      }
    }, 800);
  };

  const addMessage = (type: 'bot' | 'user', text: string, options?: string[], orderOptions?: { id: number; name: string; status: string }[]) => {
    setMessages(prev => [...prev.map(m => ({...m, options: undefined, orderOptions: undefined})), { id: Date.now(), type, text, options, orderOptions }]);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-2xl bg-indigo-600 text-white shadow-2xl transition-all hover:scale-110 active:scale-95 z-40 group ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <div className="relative">
          <MessageSquare className="h-7 w-7" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 border-2 border-indigo-600 rounded-full"></span>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 20, scale: 0.9, filter: "blur(10px)" }}
            className="fixed bottom-6 right-6 w-[90vw] sm:w-[400px] bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 flex flex-col z-50 overflow-hidden h-[600px] max-h-[85vh]"
          >
            {/* Header */}
            <div className="bg-indigo-600 p-5 text-white">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md">
                    <Bot className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg tracking-tight">Sneaks AI</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]"></span>
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-100">Live Assistant</p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} className="flex-1 p-5 overflow-y-auto bg-gray-50/50 flex flex-col gap-6 scroll-smooth">
              {messages.map((msg) => (
                <div key={msg.id} className="space-y-3">
                  <div className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div 
                      className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        msg.type === 'user' 
                          ? 'bg-indigo-600 text-white rounded-tr-sm font-medium' 
                          : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm font-medium'
                      }`}
                    >
                      {msg.text.split('\n').map((line, i) => (
                        <React.Fragment key={i}>
                          {line}
                          {i !== msg.text.split('\n').length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                  
                  {/* Order Options */}
                  {msg.orderOptions && msg.orderOptions.length > 0 && !selectedOrderId && (
                    <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-[90%]">
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Select an order:</p>
                      {msg.orderOptions.map((order) => (
                        <button
                          key={order.id}
                          onClick={() => handleOrderSelect(order.id, order.name)}
                          className="w-full p-3 bg-white border border-gray-100 text-left rounded-xl hover:border-indigo-600 hover:bg-indigo-50 transition-all flex justify-between items-center group/order"
                        >
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-800">Order #{order.id}</span>
                            <span className="text-[10px] text-gray-500 font-medium">{order.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 
                              order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                              {order.status}
                            </span>
                            <ChevronRight className="h-4 w-4 text-gray-300 group-hover/order:text-indigo-600" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Dynamic Options */}
                  {msg.options && (
                    <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                      {msg.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => handleOptionClick(opt)}
                          className="px-4 py-2 bg-white border border-gray-100 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest hover:border-indigo-600 hover:bg-indigo-50 transition-all flex items-center gap-2 shadow-sm"
                        >
                          {opt}
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 p-3 rounded-2xl flex gap-1 items-center shadow-sm">
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}

              {/* Initial Menu */}
              {messages.length === 1 && !isTyping && (
                <div className="grid grid-cols-1 gap-2 mt-2">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-1 ml-1">Quick Actions</p>
                  {MENU_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.label}
                        onClick={() => handleOptionClick(opt.label)}
                        className="w-full flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl group hover:border-indigo-600 hover:shadow-lg hover:shadow-indigo-50 transition-all text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-50 rounded-xl group-hover:bg-indigo-50 transition-colors">
                            <Icon className="h-4 w-4 text-gray-400 group-hover:text-indigo-600" />
                          </div>
                          <span className="text-xs font-bold text-gray-700 group-hover:text-indigo-900">{opt.label}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-indigo-600" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                />
                <button 
                  type="submit"
                  disabled={!inputValue.trim() || isTyping}
                  className="px-4 py-3 bg-indigo-600 text-white rounded-2xl disabled:opacity-50 hover:bg-indigo-700 transition-all flex-shrink-0 shadow-lg shadow-indigo-100"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

