import React, { useState, useRef, useEffect } from 'react';
import { useWarehouseStore } from '../../store/useWarehouseStore';
import { Card } from '../../components/ui/Card';
import { Send, Sparkles, User, RefreshCw } from 'lucide-react';

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export default function AICopilot() {
  const { selectedWarehouseId, warehouses, getEngineOutputs } = useWarehouseStore();
  const activeWh = warehouses.find(w => w.id === selectedWarehouseId) || warehouses[0];

  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'assistant',
      text: `Hello! I am your WareMind Copilot. I have access to your active warehouse engines (Health, Bottlenecks, Slotting, Demand, Simulation). Ask me any question about operations, slot moves, or forecast bottlenecks!`,
      timestamp: '10:00 AM'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat window
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const preFilledSuggestions = [
    { text: "Why is picking velocity slow?", label: "Picking speed" },
    { text: "What items should I restock?", label: "Restock recommendations" },
    { text: "How can I improve space utilization?", label: "Space slotting" }
  ];

  const handleQuery = (queryText: string) => {
    if (!queryText.trim()) return;

    const newMessages = [...messages, {
      sender: 'user' as const,
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }];
    setMessages(newMessages);
    setInputVal('');
    setIsTyping(true);

    // Run engine lookup to generate specific replies
    setTimeout(() => {
      const engine = getEngineOutputs(activeWh.id);
      let responseText = '';

      const queryLower = queryText.toLowerCase();

      if (queryLower.includes('restock') || queryLower.includes('stock') || queryLower.includes('replenish') || queryLower.includes('high velocity')) {
        const highVelocitySkus = activeWh.skus
          .filter(sku => sku.itemVelocity === 'High')
          .sort((a, b) => b.pickFrequency - a.pickFrequency)
          .slice(0, 4);

        responseText = `Restock priority for ${activeWh.name}:\n\n${highVelocitySkus.map((sku, index) => `${index + 1}. ${sku.name} (${sku.sku}) - ${sku.pickFrequency} picks/day, currently in ${sku.currentZone}.`).join('\n')}\n\nRecommended action: replenish the top 2 SKUs first and stage them near dispatch/Zone A before the next demand wave.`;
      } else if (queryLower.includes('bottleneck') || queryLower.includes('where') || queryLower.includes('delay')) {
        const worstStage = [...engine.bottlenecks].sort((a, b) => b.projectedQueueTime - a.projectedQueueTime)[0];
        responseText = `Current bottleneck: ${worstStage.name}. Status is ${worstStage.status.toUpperCase()} with projected queue time of ${worstStage.projectedQueueTime} minutes.\n\nRoot cause: ${worstStage.rootCauses.join(', ')}.\n\nRecommended action: ${worstStage.recommendation.action}. Expected impact: ${worstStage.recommendation.impact}.`;
      } else if (queryLower.includes('tomorrow') || queryLower.includes('forecast') || queryLower.includes('demand')) {
        responseText = `Tomorrow forecast for ${activeWh.name}: ${engine.forecast.peakHour} is the highest-risk demand window. Expected demand lift is ${engine.forecast.projectedVolumeIncreasePercent}% with risk concentrated in high-velocity SKUs.\n\nRecommendation: increase pick/pack staffing before the peak window and pre-stage ${activeWh.skus.filter(sku => sku.itemVelocity === 'High').slice(0, 3).map(sku => sku.name).join(', ')}.`;
      } else if (queryLower.includes('move') || queryLower.includes('space') || queryLower.includes('utilization') || queryLower.includes('slot')) {
        if (engine.slotting.recommendations.length > 0) {
          const topRec = engine.slotting.recommendations[0];
          responseText = `Move recommendation: ${topRec.name} (${topRec.sku}) should move from its current slot to Zone A.\n\nReason: ${topRec.reason}\nExpected gain: +${topRec.expectedGain}% throughput\nLabor savings: $${topRec.laborSavings}/mo\nCurrent space utilization: ${engine.slotting.spaceUtilizationPercent}% with ${engine.slotting.deadSpacePercent}% dead space.`;
        } else {
          responseText = `Space utilization is optimal at ${engine.slotting.spaceUtilizationPercent}% with zero dead space. No slot move is required right now.`;
        }
      } else if (queryLower.includes('pick') || queryLower.includes('velocity') || queryLower.includes('slow')) {
        const pickStage = engine.bottlenecks.find(b => b.stageId === 'pick')!;
        if (pickStage.status !== 'Optimal') {
          responseText = `The picking line is currently experiencing ${pickStage.status.toUpperCase()} delays. Projected queue time is ${pickStage.projectedQueueTime} minutes due to: ${pickStage.rootCauses.join(', ')}. Recommendation: ${pickStage.recommendation.action}.`;
        } else {
          responseText = `All picking lanes are operating optimally at ${pickStage.utilizationRate}% utilization capacity. Average queue times are under 5 minutes.`;
        }
      } else {
        responseText = `Based on current warehouse indexes, overall health is ${activeWh.health.overall}/100. Let me know if you would like me to compile a bottleneck report or review space optimization recommendations for this location.`;
      }

      setMessages(prev => [...prev, {
        sender: 'assistant' as const,
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsTyping(false);
    }, 900);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    handleQuery(inputVal);
  };

  return (
    <div className="space-y-6 animate-fade-in flex flex-col h-[550px]">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white font-mono uppercase font-sans">AI Copilot Assistant</h2>
        <p className="text-sm text-slate-400">Natural language telemetry queries and neural optimization plans</p>
      </div>

      {/* Chat window panel */}
      <Card className="flex-1 flex flex-col justify-between overflow-hidden p-0 border-slate-200 dark:border-slate-800">
        
        {/* Chat header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-900 bg-slate-100/70 dark:bg-slate-950/40 flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4.5 w-4.5 text-primary-accent" />
            <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 uppercase">Neural Assistant Channel</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">CONVERSATION_LOG_OK</span>
        </div>
 
        {/* Message logs scrolling area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-100/50 dark:bg-slate-950/20">
          {messages.map((msg, idx) => {
            const isUser = msg.sender === 'user';
            return (
              <div 
                key={idx} 
                className={`flex space-x-3 max-w-[80%] ${isUser ? 'ml-auto flex-row-reverse space-x-reverse' : ''}`}
              >
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${
                  isUser 
                    ? 'bg-primary-accent border-primary-accent/20 text-slate-950' 
                    : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {isUser ? <User className="h-4.5 w-4.5" /> : <Sparkles className="h-4.5 w-4.5" />}
                </div>

                <div className={`p-3.5 rounded-xl text-xs font-sans leading-relaxed ${
                  isUser 
                    ? 'bg-primary-accent/10 border border-primary-accent/25 text-slate-900 dark:text-white' 
                    : 'bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-850 text-slate-800 dark:text-slate-200'
                }`}>
                  <p className="font-sans whitespace-pre-wrap">{msg.text}</p>
                  <span className="text-[9px] text-slate-500 font-mono mt-1.5 block text-right">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex space-x-3 max-w-[80%]">
              <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0">
                <RefreshCw className="h-4 w-4 animate-spin text-primary-accent" />
              </div>
              <div className="p-3 bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-850 rounded-xl text-xs font-mono text-slate-600 dark:text-slate-400 italic">
                Copilot is reviewing active engine logs...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input box and suggestion chips */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/40 shrink-0 space-y-3">
          
          {/* Quick suggestions chips */}
          <div className="flex flex-wrap gap-2">
            {preFilledSuggestions.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => handleQuery(sug.text)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-900 border border-slate-300 dark:border-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 rounded-full text-[10px] font-mono transition"
              >
                {sug.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSend} className="flex space-x-2">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Ask a question about current warehouse slot moves or process status..."
              className="flex-1 glass-input text-xs"
            />
            <button
              type="submit"
              className="p-2 bg-primary-accent text-slate-950 rounded-lg hover:bg-blue-400 transition shadow-md shadow-primary-accent/15"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

        </div>

      </Card>

    </div>
  );
}
