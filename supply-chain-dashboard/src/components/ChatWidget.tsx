'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDashboard } from '../lib/store';
import { AgentDeliberationStep } from '../lib/types';

interface Message {
  id: string;
  sender: 'user' | 'agent';
  agentName?: string;
  text: string;
  deliberations?: AgentDeliberationStep[];
  showDeliberations?: boolean;
}

const extractSuggestions = (text: string) => {
  const matches = text.match(/\*["“]([^"”]+)["”]\*/g);
  if (!matches) return [];
  return matches.map(m => m.replace(/\*["“]|["”]\*/g, '').trim());
};

export default function ChatWidget() {
  const { currentUser, agents } = useDashboard();
  const [isOpen, setIsOpen] = useState(false);
  const [targetAgent, setTargetAgent] = useState('Orchestrator');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'agent',
      agentName: 'AI Orchestrator',
      text: 'Greetings! I coordinate our multi-agent sustainable supply chain network (Inventory, Logistics, Seasonal, Sustainability, and Warehouse). How can we assist you today? Try saying "hi" or ask "what are your capabilities?".'
    }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, isThinking]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isThinking) return;

    const userMessage: Message = { id: Date.now().toString(), sender: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    if (!textToSend) setInput('');
    setIsThinking(true);

    try {
      const res = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, targetAgent })
      });
      
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [
          ...prev, 
          { 
            id: (Date.now() + 1).toString(), 
            sender: 'agent', 
            agentName: data.agent || 'AI Orchestrator', 
            text: data.response,
            deliberations: data.deliberations || [],
            showDeliberations: true
          }
        ]);
      } else {
        throw new Error('API Error');
      }
    } catch (err) {
      console.log('Backend chat offline, fallback local response:', err);
      setTimeout(() => {
        const lower = text.toLowerCase();
        let fallbackText = `Evaluated "${text}". All sub-agents (Inventory, Logistics, Seasonal, Sustainability, and Warehouse) have audited the request and aligned with Net-Zero operational guidelines.`;
        let fallbackDelibs: AgentDeliberationStep[] = [
          { agent: 'AI Orchestrator', role: 'Multi-Agent Conductor', thought: 'Operator query evaluated.', decision: 'Coordinating cross-agent review for user directive.', confidence: 0.99 },
          { agent: 'Inventory Agent', role: 'Stock Monitor', thought: 'Checking warehouse reserve levels.', decision: 'Sufficient buffer at Central Hub for regional transfer.', confidence: 0.92 }
        ];

        if (/^(hi|hello|hey|greetings|howdy|good morning|good evening)\b/i.test(lower.trim())) {
          fallbackText = "Hello! 👋 I am your **AI Orchestrator**, coordinating our autonomous Multi-Agent Sustainable Supply Chain network.\n\nAll systems are operating at peak efficiency. Here are some predefined questions you can ask me to explore our platform:\n\n• 🍁 **Festive Demand**: *\"Check festive surge demand and recommended promo discounts\"*\n• 📦 **Inventory Balance**: *\"What is the stock level at Central Hub vs Downtown Flagship?\"*\n• 🚚 **EV Fleet Tracking**: *\"Optimize Electric Truck T-101 routes and Sustainable Autofill\"*\n• 🌿 **Carbon Audit**: *\"How much CO2 emissions have our electric routes saved?\"*\n• 🏭 **Warehouse Operations**: *\"Show active tasks for Picker, Packer, and QC Inspector\"*\n• 🤖 **Capabilities**: *\"What are the capabilities of each agent in this network?\"*";
          fallbackDelibs = [
            { agent: 'AI Orchestrator', role: 'Multi-Agent Conductor', thought: 'Operator initiated greeting.', decision: 'System ready. Conductor online and standing by.', confidence: 0.99 },
            { agent: 'Seasonal Agent', role: 'Demand Surge Predictor', thought: 'Monitoring calendar milestones.', decision: 'Active forecast: +45% festive volume surge anticipated.', confidence: 0.95 },
            { agent: 'Logistics Agent', role: 'Fleet Coordinator', thought: 'Tracking EV delivery fleet.', decision: 'Interstate corridors active with Sustainable Autofill enabled.', confidence: 0.96 }
          ];
        } else if (lower.includes('capabilit') || lower.includes('what can you do') || lower.includes('what do you do') || lower.includes('help') || lower.includes('who are you') || lower.includes('features')) {
          fallbackText = "Here is an overview of our autonomous multi-agent network and its capabilities:\n\n• 🧠 **AI Orchestrator (Conductor)**: Deliberates across all agents, synthesizes decisions, and enforces Human-in-the-Loop review gates.\n• 🍁 **Seasonal Agent**: Analyzes historical holiday patterns, forecasts demand spikes (+45%), and formulates ethical discount promotions.\n• 📦 **Inventory Agent**: Tracks real-time multi-facility inventories, calculates replenishment requirements, and prevents retail stockouts.\n• 🚚 **Logistics Agent**: Coordinates zero-emission EV delivery fleets, resolves vehicle breakdown diversions, and enables **Sustainable Autofill** to eliminate empty miles.\n• 🌿 **Sustainability Agent**: Audits carbon offsets (+182.6 kg CO2 saved) and verifies Net-Zero ESG supply chain compliance.\n• 🏭 **Warehouse Agent**: Dispatches and coordinates floor staff roles (Picking, Packing, Quality Control, Loading & Dispatch, Put-away) and handles defect escalations.\n\nAsk me any question above or test an autonomous workflow scenario from the sidebar!";
          fallbackDelibs = [
            { agent: 'AI Orchestrator', role: 'Multi-Agent Conductor', thought: 'Explaining multi-agent architecture.', decision: 'Governance & Human-in-the-Loop review gates active.', confidence: 0.99 },
            { agent: 'Warehouse Agent', role: 'Floor Operations Director', thought: 'Floor dispatch architecture active.', decision: '5 floor roles coordinated automatically.', confidence: 0.95 }
          ];
        }

        setMessages(prev => [
          ...prev, 
          { 
            id: (Date.now() + 1).toString(), 
            sender: 'agent', 
            agentName: 'AI Orchestrator', 
            text: fallbackText,
            deliberations: fallbackDelibs,
            showDeliberations: true
          }
        ]);
      }, 500);
    } finally {
      setIsThinking(false);
    }
  };


  const toggleDelib = (msgId: string) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, showDeliberations: !m.showDeliberations } : m));
  };

  if (!currentUser) return null;

  return (
    <>
      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-primary"
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '62px',
          height: '62px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 30px 0 var(--primary-glow)',
          zIndex: 100,
          border: '1px solid rgba(255,255,255,0.2)'
        }}
      >
        <span style={{ fontSize: '1.6rem' }}>{isOpen ? '✕' : '💬'}</span>
      </button>

      {/* Modern Multi-Agent Chat Drawer */}
      {isOpen && (
        <div className="glass-panel animate-fade-in" style={{
          position: 'fixed',
          bottom: '6.5rem',
          right: '2rem',
          width: '420px',
          maxWidth: 'calc(100vw - 3rem)',
          height: '600px',
          maxHeight: 'calc(100vh - 8rem)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 100,
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          border: '1px solid var(--glass-border-strong)'
        }}>
          {/* Header & Agent Selector */}
          <div style={{ 
            padding: '1rem 1.25rem', 
            background: 'rgba(0,0,0,0.3)', 
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🤖</span>
                <h4 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>Multi-Agent Consultation</h4>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                style={{ background: 'none', border: 'none', color: 'var(--foreground-muted)', cursor: 'pointer', fontSize: '1.1rem' }}
              >
                ✕
              </button>
            </div>

            {/* Target Agent Selector */}
            <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '2px' }}>
              {[
                { id: 'Orchestrator', label: '🧠 All Agents' },
                { id: 'Seasonal', label: '🍁 Seasonal' },
                { id: 'Inventory', label: '📦 Inventory' },
                { id: 'Logistics', label: '🚚 Logistics' },
                { id: 'Sustainability', label: '🌿 ESG' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setTargetAgent(tab.id)}
                  style={{
                    background: targetAgent === tab.id ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${targetAgent === tab.id ? 'var(--primary)' : 'transparent'}`,
                    color: targetAgent === tab.id ? '#60a5fa' : 'var(--foreground-muted)',
                    borderRadius: '6px',
                    padding: '0.25rem 0.55rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Prompt Chips */}
          <div style={{ 
            display: 'flex', 
            gap: '0.4rem', 
            overflowX: 'auto', 
            padding: '0.6rem 1rem', 
            background: 'rgba(0,0,0,0.15)',
            borderBottom: '1px solid rgba(255,255,255,0.04)'
          }}>
            {[
              { label: '👋 Say Hi', query: 'hi' },
              { label: '🤖 Capabilities', query: 'What are your capabilities?' },
              { label: '🍁 Festive Demand', query: 'Check festive surge demand and recommended promo discounts' },
              { label: '📦 Stock Levels', query: 'What is the stock level at Central Hub vs Downtown Flagship?' },
              { label: '🚚 EV Route & Autofill', query: 'Optimize Electric Truck T-101 routes and Sustainable Autofill' },
              { label: '🌿 CO2 Carbon Audit', query: 'How much CO2 emissions have our electric routes saved?' },
              { label: '🏭 Warehouse Tasks', query: 'Show active tasks for Picker, Packer, and QC Inspector' }
            ].map((item, i) => (
              <button
                key={i}
                onClick={() => handleSend(item.query)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.85)',
                  borderRadius: '999px',
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Messages Container */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                {msg.sender === 'agent' && (
                  <div style={{ fontSize: '0.72rem', color: '#60a5fa', fontWeight: 600, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span>✨ {msg.agentName}</span>
                  </div>
                )}

                <div style={{ 
                  background: msg.sender === 'user' ? 'linear-gradient(135deg, #2563eb, #3b82f6)' : 'rgba(255,255,255,0.045)', 
                  padding: '0.75rem 1rem', 
                  borderRadius: '12px',
                  border: msg.sender === 'agent' ? '1px solid var(--glass-border)' : 'none',
                  maxWidth: '92%',
                  fontSize: '0.88rem',
                  lineHeight: '1.45',
                  color: '#fff',
                  whiteSpace: 'pre-wrap'
                }}>
                  {msg.text}
                </div>

                {/* Clickable Suggested Questions (e.g. from greetings or capabilities) */}
                {msg.sender === 'agent' && extractSuggestions(msg.text).length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.5rem', maxWidth: '95%' }}>
                    <div style={{ fontSize: '0.7rem', color: '#93c5fd', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span>💡</span> Click to ask:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {extractSuggestions(msg.text).map((suggestion, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => handleSend(suggestion)}
                          style={{
                            background: 'rgba(59, 130, 246, 0.15)',
                            border: '1px solid rgba(59, 130, 246, 0.35)',
                            color: '#bfdbfe',
                            borderRadius: '8px',
                            padding: '0.3rem 0.6rem',
                            fontSize: '0.74rem',
                            cursor: 'pointer',
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)';
                            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.6)';
                            e.currentTarget.style.color = '#fff';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
                            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.35)';
                            e.currentTarget.style.color = '#bfdbfe';
                          }}
                        >
                          <span>💬</span> {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}


                {/* Multi-Agent Deliberation Step Details */}
                {msg.deliberations && msg.deliberations.length > 0 && (
                  <div style={{ marginTop: '0.5rem', maxWidth: '95%' }}>
                    <button
                      onClick={() => toggleDelib(msg.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.15rem 0'
                      }}
                    >
                      <span>{msg.showDeliberations ? '▼ Hide' : '▶ Show'} Multi-Agent Deliberation Trace ({msg.deliberations.length} Agents)</span>
                    </button>

                    {msg.showDeliberations && (
                      <div className="animate-fade-in" style={{
                        marginTop: '0.35rem',
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: '8px',
                        padding: '0.65rem 0.85rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                      }}>
                        {msg.deliberations.map((step, idx) => (
                          <div key={idx} style={{ fontSize: '0.78rem', borderBottom: idx < msg.deliberations!.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', paddingBottom: '0.35rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#c084fc', fontWeight: 600 }}>
                              <span>{step.agent} ({step.role})</span>
                              <span style={{ color: '#34d399' }}>{Math.round(step.confidence * 100)}% match</span>
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.7)', margin: '0.15rem 0' }}>
                              <em>"{step.thought}"</em>
                            </div>
                            <div style={{ color: '#f1f5f9' }}>
                              ➔ {step.decision}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            ))}

            {isThinking && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--foreground-muted)', fontSize: '0.82rem' }}>
                <span className="animate-pulse-glow">🧠</span>
                <span>Agents are conferring and optimizing route...</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
            style={{ 
              padding: '0.85rem 1rem', 
              borderTop: '1px solid var(--glass-border)', 
              display: 'flex', 
              gap: '0.5rem',
              background: 'rgba(0,0,0,0.2)'
            }}
          >
            <input 
              type="text" 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              className="input-field" 
              placeholder={`Ask ${targetAgent === 'Orchestrator' ? 'the multi-agent team' : targetAgent}...`} 
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0 1rem' }} disabled={isThinking}>
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}
