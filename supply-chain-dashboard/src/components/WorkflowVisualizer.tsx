'use client';

import React, { useState } from 'react';
import { useDashboard } from '../lib/store';
import { Workflow, WorkflowStep } from '../lib/types';
import HumanApprovalModal from './HumanApprovalModal';

export default function WorkflowVisualizer() {
  const { workflows, approveStep, injectCommand } = useDashboard();
  const [editingWorkflowId, setEditingWorkflowId] = useState<string | null>(null);
  const [specialCommand, setSpecialCommand] = useState('');
  const [targetAgent, setTargetAgent] = useState('Logistics Agent');
  const [approvingStepId, setApprovingStepId] = useState<string | null>(null);
  const [activeReviewModal, setActiveReviewModal] = useState<{ workflow: Workflow; step: WorkflowStep } | null>(null);

  const handleInjectCommand = async (e: React.FormEvent, workflowId: string) => {
    e.preventDefault();
    if (!specialCommand.trim()) return;
    
    await injectCommand(workflowId, specialCommand, targetAgent);
    setSpecialCommand('');
    setEditingWorkflowId(null);
  };

  const handleApprove = async (workflowId: string, stepId: string) => {
    setApprovingStepId(stepId);
    try {
      await approveStep(workflowId, stepId);
    } finally {
      setApprovingStepId(null);
    }
  };

  const getAgentColor = (agentName: string) => {
    if (agentName.includes('Seasonal')) return '#f59e0b';
    if (agentName.includes('Inventory')) return '#3b82f6';
    if (agentName.includes('Logistics')) return '#10b981';
    if (agentName.includes('Sustainability')) return '#06b6d4';
    if (agentName.includes('Human')) return '#ef4444';
    return '#8b5cf6';
  };

  return (
    <div className="glass-card" style={{ padding: '1.75rem', gridColumn: '1 / -1' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🔄</span>
            <h3 style={{ margin: 0, fontSize: '1.3rem' }}>Autonomous Agent Workflows</h3>
            <span className="badge badge-primary">
              {workflows.filter(w => w.status === 'Active').length} Active
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--foreground-muted)', margin: '0.25rem 0 0 2rem' }}>
            Multi-agent execution sequences with mandatory Human-In-The-Loop safety gates.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {workflows.map(workflow => (
          <div key={workflow.id} style={{ 
            background: 'rgba(0, 0, 0, 0.25)', 
            border: '1px solid var(--glass-border)', 
            borderRadius: '14px', 
            padding: '1.5rem',
            position: 'relative'
          }}>
            {/* Workflow Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ 
                  display: 'inline-block', 
                  width: '10px', 
                  height: '10px', 
                  borderRadius: '50%', 
                  background: workflow.status === 'Active' ? 'var(--secondary)' : 'var(--glass-border)',
                  boxShadow: workflow.status === 'Active' ? '0 0 10px var(--secondary)' : 'none'
                }} />
                <h4 style={{ color: '#fff', margin: 0, fontSize: '1.1rem' }}>
                  {workflow.title}
                </h4>
                <span className={`badge ${workflow.status === 'Active' ? 'badge-success' : 'badge-info'}`}>
                  {workflow.status}
                </span>
              </div>

              <button 
                className="btn btn-outline" 
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
                onClick={() => setEditingWorkflowId(editingWorkflowId === workflow.id ? null : workflow.id)}
              >
                ✏️ {editingWorkflowId === workflow.id ? 'Cancel Override' : 'Inject Command'}
              </button>
            </div>

            {/* Workflow Steps Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', position: 'relative', paddingLeft: '1.25rem' }}>
              <div style={{ position: 'absolute', left: '19px', top: '15px', bottom: '15px', width: '2px', background: 'rgba(255,255,255,0.08)', zIndex: 0 }} />
              
              {workflow.steps.map((step, idx) => {
                const isHumanAction = step.status === 'Awaiting Human' || step.requiresHumanAction;
                const agentColor = getAgentColor(step.agent);

                return (
                  <div key={step.id || idx} style={{ display: 'flex', gap: '1rem', position: 'relative', zIndex: 1, opacity: step.status === 'Pending' ? 0.45 : 1 }}>
                    {/* Node Dot */}
                    <div style={{ 
                      width: '14px', 
                      height: '14px', 
                      borderRadius: '50%', 
                      background: step.status === 'Completed' ? 'var(--secondary)' : isHumanAction ? 'var(--danger)' : step.status === 'In Progress' ? 'var(--warning)' : 'rgba(255,255,255,0.2)',
                      border: '2px solid rgba(15, 23, 42, 0.9)',
                      marginTop: '7px',
                      marginLeft: '-6px',
                      flexShrink: 0,
                      boxShadow: isHumanAction ? '0 0 10px var(--danger)' : step.status === 'Completed' ? '0 0 8px var(--secondary)' : 'none'
                    }} />

                    {/* Step Card */}
                    <div style={{ 
                      flex: 1, 
                      background: isHumanAction ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.02)', 
                      padding: '0.85rem 1.15rem', 
                      borderRadius: '10px', 
                      border: isHumanAction ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)',
                      boxShadow: isHumanAction ? '0 4px 20px rgba(239, 68, 68, 0.15)' : 'none'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ 
                            width: '8px', 
                            height: '8px', 
                            borderRadius: '50%', 
                            background: agentColor 
                          }} />
                          <strong style={{ fontSize: '0.88rem', color: agentColor }}>{step.agent}</strong>
                        </div>
                        <span className={`badge ${
                          step.status === 'Completed' ? 'badge-success' : 
                          isHumanAction ? 'badge-danger' : 
                          step.status === 'In Progress' ? 'badge-warning' : 'badge-info'
                        }`}>
                          {step.status}
                        </span>
                      </div>

                      <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.45 }}>
                        {step.action}
                      </p>

                      {step.details && (
                        <div style={{ 
                          marginTop: '0.5rem', 
                          padding: '0.5rem 0.75rem', 
                          background: 'rgba(0, 0, 0, 0.25)', 
                          borderRadius: '6px', 
                          fontSize: '0.8rem', 
                          color: 'var(--foreground-muted)' 
                        }}>
                          {step.details}
                        </div>
                      )}
                      
                      {/* Human-in-the-loop Action Button */}
                      {isHumanAction && (
                        <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                          <button 
                            className="btn btn-danger attention-ripple" 
                            style={{ 
                              padding: '0.55rem 1.15rem', 
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                            onClick={() => setActiveReviewModal({ workflow, step })}
                          >
                            🔍 Review Manifest & Authorize
                          </button>

                          <button 
                            className="btn btn-outline" 
                            style={{ 
                              padding: '0.55rem 0.95rem', 
                              fontSize: '0.82rem',
                              borderColor: 'var(--danger)',
                              color: '#f87171'
                            }}
                            disabled={approvingStepId === step.id}
                            onClick={() => handleApprove(workflow.id, step.id)}
                          >
                            {approvingStepId === step.id ? 'Processing...' : '⚡ Quick Authorize'}
                          </button>

                          <span style={{ fontSize: '0.78rem', color: 'var(--foreground-muted)' }}>
                            Review orders, issues, notifications & optional operator comments before release.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Injected Command Form */}
            {editingWorkflowId === workflow.id && (
              <form 
                onSubmit={(e) => handleInjectCommand(e, workflow.id)} 
                style={{ 
                  marginTop: '1.25rem', 
                  padding: '1rem', 
                  background: 'rgba(0,0,0,0.4)', 
                  border: '1px solid var(--accent)', 
                  borderRadius: '10px',
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '0.75rem' 
                }}
                className="animate-fade-in"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent)' }}>
                    ⚡ Steer Live Agent Workflow
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>
                    Injected command will be parsed and executed by the agents
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <select 
                    value={targetAgent} 
                    onChange={e => setTargetAgent(e.target.value)}
                    style={{
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '8px',
                      color: '#fff',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.85rem'
                    }}
                  >
                    <option value="Logistics Agent">Direct to: Logistics Agent</option>
                    <option value="Seasonal Agent">Direct to: Seasonal Agent</option>
                    <option value="Inventory Agent">Direct to: Inventory Agent</option>
                    <option value="Sustainability Agent">Direct to: Sustainability Agent</option>
                  </select>

                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="E.g., Enforce 100% Electric Vehicles only, or increase discount to 20%..." 
                    value={specialCommand}
                    onChange={(e) => setSpecialCommand(e.target.value)}
                    style={{ flex: 1, minWidth: '240px' }}
                    autoFocus
                  />
                  
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
                    Inject Override
                  </button>
                </div>
              </form>
            )}

          </div>
        ))}

        {workflows.length === 0 && (
          <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '2rem' }}>
            No active workflows currently. Click 'Simulate Festive Surge' above to launch an autonomous workflow.
          </p>
        )}
      </div>

      {/* Human in Loop Review Popup Modal */}
      {activeReviewModal && (
        <HumanApprovalModal 
          workflow={activeReviewModal.workflow}
          step={activeReviewModal.step}
          isOpen={true}
          onClose={() => setActiveReviewModal(null)}
        />
      )}
    </div>
  );
}
