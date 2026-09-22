'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDashboard } from '../lib/store';
import { Workflow, WorkflowStep } from '../lib/types';

interface HumanApprovalModalProps {
  workflow: Workflow;
  step: WorkflowStep;
  isOpen: boolean;
  onClose: () => void;
}

export default function HumanApprovalModal({ workflow, step, isOpen, onClose }: HumanApprovalModalProps) {
  const { approveStep, injectCommand } = useDashboard();
  const [mounted, setMounted] = useState(false);
  
  // Checklist items user must verify
  const [checklist, setChecklist] = useState({
    discountMargin: true,
    palletAllocation: true,
    evRouting: true
  });

  const [comment, setComment] = useState('');
  const [showModifyCycle, setShowModifyCycle] = useState(false);
  const [modifyDirective, setModifyDirective] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Prevent body scrolling when modal is active
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleAuthorize = async () => {
    setSubmitting(true);
    try {
      if (showModifyCycle && modifyDirective.trim()) {
        await injectCommand(workflow.id, modifyDirective.trim(), 'Human Operator');
      }
      await approveStep(workflow.id, step.id, {
        comment: comment.trim() || undefined,
        modifiedAction: showModifyCycle && modifyDirective.trim() ? modifyDirective.trim() : undefined
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const allChecked = checklist.discountMargin && checklist.palletAllocation && checklist.evRouting;

  const modalContent = (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.82)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999999,
      padding: '1.5rem',
      boxSizing: 'border-box'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        maxWidth: '740px',
        width: '100%',
        maxHeight: '82vh',
        height: 'auto',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '18px',
        border: '1px solid var(--glass-border-strong)',
        boxShadow: '0 25px 75px rgba(0, 0, 0, 0.85)',
        overflow: 'hidden',
        background: '#0a101d',
        margin: 'auto'
      }}>
        
        {/* 1. FIXED TOP HEADER */}
        <div style={{ 
          padding: '1.25rem 1.75rem', 
          borderBottom: '1px solid rgba(255,255,255,0.1)', 
          background: '#0f172a',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ fontSize: '1.4rem' }}>👤</span>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff' }}>Human-in-the-Loop Operational Gate</h3>
              <span className="badge badge-danger attention-ripple" style={{ fontSize: '0.68rem' }}>
                Authorization Required
              </span>
            </div>
            <p style={{ margin: '0.25rem 0 0 2rem', fontSize: '0.82rem', color: 'var(--foreground-muted)' }}>
              Workflow: <strong style={{ color: '#fff' }}>{workflow.title}</strong>
            </p>
          </div>
          <button 
            onClick={onClose}
            style={{ 
              background: 'rgba(255,255,255,0.08)', 
              border: '1px solid rgba(255,255,255,0.15)', 
              borderRadius: '8px',
              color: 'rgba(255,255,255,0.8)', 
              cursor: 'pointer', 
              fontSize: '1.1rem', 
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* 2. SCROLLABLE MIDDLE BODY */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem 1.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.35rem'
        }}>
          {/* Section 1: Detected Issues & Notifications */}
          <div>
            <h4 style={{ fontSize: '0.92rem', color: '#fbbf24', marginBottom: '0.55rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span>⚠️</span> Active Issues & Seasonal Notifications ({step.agent})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '8px', padding: '0.65rem 0.85rem', fontSize: '0.85rem' }}>
                <strong style={{ color: '#fbbf24' }}>Festive Surge Alert:</strong> Demand curve predicts a +45% spike over the next 14 days. Recommends approving 15% green festive promo.
              </div>
              <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px', padding: '0.65rem 0.85rem', fontSize: '0.85rem' }}>
                <strong style={{ color: '#f87171' }}>Retail Buffer Depletion:</strong> Downtown Flagship Store is at 45 units (below 3-day safety threshold). Order must be dispatched without delay.
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px', padding: '0.65rem 0.85rem', fontSize: '0.85rem' }}>
                <strong style={{ color: '#34d399' }}>Sustainable Autofill Verification:</strong> Consolidated shipment reaches 90% pallet density on Electric Truck T-101, saving 54.2kg CO2 emissions.
              </div>
            </div>
          </div>

          {/* Section 2: Order Manifest */}
          <div>
            <h4 style={{ fontSize: '0.92rem', color: '#60a5fa', marginBottom: '0.55rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span>📦</span> Order Manifest & Vehicle Allocation
            </h4>
            <div style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.8rem', color: 'var(--foreground-muted)' }}>
                <span>Origin: <strong>Central Hub (Chicago, IL)</strong></span>
                <span>Destination: <strong>Downtown Flagship (New York, NY)</strong></span>
                <span>Vehicle: <strong style={{ color: '#38bdf8' }}>Electric Truck T-101 (EV)</strong></span>
              </div>
              <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ color: 'var(--foreground-muted)', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left' }}>
                    <th style={{ padding: '0.4rem 0' }}>Item Description</th>
                    <th style={{ padding: '0.4rem 0' }}>Qty</th>
                    <th style={{ padding: '0.4rem 0' }}>Pallets</th>
                    <th style={{ padding: '0.4rem 0' }}>Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '0.45rem 0', color: '#fff' }}>Zero-Plastic Plant Detergent</td>
                    <td>800 units</td>
                    <td>8 pallets</td>
                    <td><span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>Festive Surge</span></td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '0.45rem 0', color: '#fff' }}>Biodegradable Bamboo Toothbrush 4-Pack</td>
                    <td>400 units</td>
                    <td>4 pallets</td>
                    <td><span className="badge badge-info" style={{ fontSize: '0.65rem' }}>Low Buffer</span></td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.45rem 0', color: '#fff' }}>100% Recycled Kraft Paper Towels</td>
                    <td>400 units</td>
                    <td>4 pallets</td>
                    <td><span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Sustainable Autofill</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Verification Checklist */}
          <div>
            <h4 style={{ fontSize: '0.92rem', color: '#c084fc', marginBottom: '0.55rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span>✅</span> Required Human Authorization Checklist
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.85rem', borderRadius: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input 
                  type="checkbox" 
                  checked={checklist.discountMargin} 
                  onChange={e => setChecklist({ ...checklist, discountMargin: e.target.checked })} 
                  style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
                />
                <span>Verify 15% Festive Green Promotional Discount margin (+18% net margin projected)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input 
                  type="checkbox" 
                  checked={checklist.palletAllocation} 
                  onChange={e => setChecklist({ ...checklist, palletAllocation: e.target.checked })} 
                  style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
                />
                <span>Confirm pallet inventory allocation from Midwest Central Hub reserves</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input 
                  type="checkbox" 
                  checked={checklist.evRouting} 
                  onChange={e => setChecklist({ ...checklist, evRouting: e.target.checked })} 
                  style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
                />
                <span>Validate Zero-Emission EV delivery route and charging window</span>
              </label>
            </div>
          </div>

          {/* Section 4: Optional Comment & Cycle Modification */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--foreground-muted)', fontWeight: 600 }}>
                Operator Notes / Comment (Optional):
              </label>
              <button
                type="button"
                onClick={() => setShowModifyCycle(!showModifyCycle)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: showModifyCycle ? '#f59e0b' : 'var(--accent)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {showModifyCycle ? '✕ Cancel Cycle Modification' : '✏️ Modify Cycle Parameters'}
              </button>
            </div>

            <textarea 
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="input-field"
              rows={2}
              placeholder="E.g., Authorized with priority loading. Ensure pallets are wrapped in compostable film."
              style={{ resize: 'vertical' }}
            />

            {showModifyCycle && (
              <div className="animate-fade-in" style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '8px',
                padding: '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fbbf24' }}>
                  ✏️ Operational Cycle Modification:
                </span>
                <input 
                  type="text" 
                  className="input-field"
                  value={modifyDirective}
                  onChange={e => setModifyDirective(e.target.value)}
                  placeholder="E.g., Increase festive discount to 20% or cap truck speed at 60mph for max battery life..."
                />
              </div>
            )}
          </div>
        </div>

        {/* 3. FIXED BOTTOM FOOTER */}
        <div style={{ 
          padding: '1.15rem 1.75rem', 
          borderTop: '1px solid rgba(255,255,255,0.1)', 
          background: '#0f172a',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap',
          gap: '0.75rem',
          flexShrink: 0
        }}>
          <button 
            type="button" 
            className="btn btn-outline" 
            onClick={onClose}
            disabled={submitting}
          >
            Hold on Hold / Cancel
          </button>

          <button 
            type="button" 
            className="btn btn-success" 
            style={{ padding: '0.65rem 1.5rem', fontWeight: 700 }}
            disabled={!allChecked || submitting}
            onClick={handleAuthorize}
          >
            {submitting ? 'Releasing Workflow...' : '✓ Confirm & Authorize Release'}
          </button>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
