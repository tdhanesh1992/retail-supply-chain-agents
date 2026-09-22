'use client';

import React, { useState } from 'react';
import { useDashboard } from '../lib/store';

export default function AgentDeliberationStream() {
  const { agents, agentLogs, triggerScenario } = useDashboard();
  const [triggering, setTriggering] = useState<string | null>(null);

  const handleTrigger = async (scenario: 'festive_surge' | 'emergency_restock' | 'carbon_audit', name: string) => {
    setTriggering(name);
    try {
      await triggerScenario(scenario);
    } finally {
      setTimeout(() => setTriggering(null), 1200);
    }
  };

  const getActionBadgeClass = (actionType: string) => {
    switch (actionType) {
      case 'SURGE_ALERT': return 'badge-warning';
      case 'OPTIMIZATION': return 'badge-success';
      case 'CO2_AUDIT': return 'badge-cyan';
      case 'HUMAN_APPROVAL_REQUEST': return 'badge-danger';
      case 'COMMAND_INJECTION': return 'badge-purple';
      case 'EMERGENCY_DEPLETION': return 'badge-danger';
      default: return 'badge-info';
    }
  };

  return (
    <div className="glass-card" style={{ padding: '1.75rem', gridColumn: '1 / -1', border: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Header & Simulation Triggers */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '1.4rem' }}>⚡</span>
            <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#fff' }}>Autonomous Multi-Agent Deliberation Network</h3>
            <span className="badge badge-success animate-pulse-glow" style={{ fontSize: '0.7rem' }}>
              Live Telemetry
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--foreground-muted)', margin: '0.35rem 0 0 2rem' }}>
            Observing inter-agent communication, collaborative reasoning, and autonomous decisions.
          </p>
        </div>

        {/* Action Triggers */}
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-warning" 
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem' }}
            disabled={triggering !== null}
            onClick={() => handleTrigger('festive_surge', 'festive')}
          >
            {triggering === 'festive' ? '⏳ Agents Deliberating...' : '🍁 Simulate Festive Surge (+45%)'}
          </button>

          <button 
            className="btn btn-danger" 
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem' }}
            disabled={triggering !== null}
            onClick={() => handleTrigger('emergency_restock', 'restock')}
          >
            {triggering === 'restock' ? '⏳ Agents Routing...' : '⚠️ Simulate Out-of-Stock & Autofill'}
          </button>

          <button 
            className="btn btn-outline" 
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem', borderColor: 'var(--cyan)', color: 'var(--cyan)' }}
            disabled={triggering !== null}
            onClick={() => handleTrigger('carbon_audit', 'carbon')}
          >
            {triggering === 'carbon' ? '⏳ Auditing CO2...' : '🌿 Run Fleet Carbon Audit'}
          </button>
        </div>
      </div>

      {/* Agents Node Roster */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', 
        gap: '0.85rem', 
        marginBottom: '1.75rem' 
      }}>
        {agents.map(ag => (
          <div key={ag.id} style={{
            background: 'rgba(0, 0, 0, 0.25)',
            border: `1px solid ${ag.color}35`,
            borderRadius: '12px',
            padding: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: `${ag.color}20`,
              border: `1px solid ${ag.color}50`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.3rem',
              flexShrink: 0
            }}>
              {ag.avatar}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {ag.name}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--foreground-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {ag.role}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: ag.color, boxShadow: `0 0 6px ${ag.color}` }} />
                <span style={{ fontSize: '0.68rem', color: ag.color, fontWeight: 600 }}>{ag.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Live Inter-Agent Deliberation Logs */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h4 style={{ fontSize: '0.95rem', margin: 0, color: 'var(--foreground-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Live Inter-Agent Message Stream ({agentLogs.length} Events)
          </h4>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Auto-updating</span>
        </div>

        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.65rem', 
          maxHeight: '340px', 
          overflowY: 'auto',
          paddingRight: '0.5rem'
        }}>
          {agentLogs.map((log, idx) => (
            <div key={log.id || idx} className="animate-fade-in" style={{
              background: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.85rem'
            }}>
              <div style={{
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.4)',
                fontFamily: 'monospace',
                marginTop: '2px',
                whiteSpace: 'nowrap'
              }}>
                {log.timestamp.includes('T') ? log.timestamp.split('T')[1].slice(0, 8) : log.timestamp}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#60a5fa' }}>{log.fromAgent}</span>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>➔</span>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#34d399' }}>{log.toAgent}</span>
                  <span className={`badge ${getActionBadgeClass(log.actionType)}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem' }}>
                    {log.actionType}
                  </span>
                  {log.workflowId && (
                    <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                      {log.workflowId}
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.45 }}>
                  {log.message}
                </p>
              </div>
            </div>
          ))}

          {agentLogs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>
              No inter-agent messages recorded yet. Click a simulation button above to trigger an interaction!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
