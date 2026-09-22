'use client';

import React, { useState } from 'react';
import { useDashboard } from '../lib/store';

export default function LoginScreen() {
  const { users, login } = useDashboard();
  const [activeTab, setActiveTab] = useState<'management' | 'floor'>('management');

  const floorRoleList = [
    'Picker Staff',
    'Packer Staff',
    'Quality Control Inspector',
    'Loading & Dispatch Crew',
    'Put-away & Storage Clerk'
  ];

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'Store Manager': return 'Oversees retail stock levels, approves festive discounts & local restock orders.';
      case 'Warehouse Operator': return 'Manages facility inventory, confirms pallet pack manifests & dispatch.';
      case 'Logistics Coordinator': return 'Monitors EV delivery routes, verifies product customs tariffs & resolves vehicle delays.';
      case 'Sustainability Director': return 'Audits Net-Zero ESG metrics, carbon offsets & green vendor compliance.';
      case 'Warehouse Manager': return 'Supervises fulfillment pipeline, bin allocation & warehouse capacity.';
      case 'Picker Staff': return 'Picks inventory from designated aisles and bins for packing.';
      case 'Packer Staff': return 'Boxes items with eco-wrap and prepares batches for QC inspection.';
      case 'Quality Control Inspector': return 'Audits packaging integrity, logs damaged stock & triggers replacements.';
      case 'Loading & Dispatch Crew': return 'Stages and loads validated cargo onto outbound Electric Trucks.';
      case 'Put-away & Storage Clerk': return 'Unloads inbound supplier goods and bins them to storage aisles.';
      default: return 'Full access to all multi-agent supply chain controls.';
    }
  };

  const displayedUsers = users.filter(user => {
    const isFloor = floorRoleList.includes(user.role);
    return activeTab === 'floor' ? isFloor : !isFloor;
  });

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      position: 'relative'
    }}>
      <div className="glass-panel" style={{ 
        maxWidth: '1080px', 
        width: '100%', 
        padding: '3rem 2.5rem', 
        textAlign: 'center',
        border: '1px solid var(--glass-border-strong)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.6)'
      }}>
        {/* Brand Header */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.65rem',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '999px',
          padding: '0.35rem 1rem',
          marginBottom: '1.25rem'
        }}>
          <span>🌿</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#34d399', letterSpacing: '0.05em' }}>
            AUTONOMOUS RETAIL SUPPLY CHAIN
          </span>
        </div>

        <h1 style={{ 
          fontSize: '2.6rem', 
          marginBottom: '0.5rem', 
          background: 'linear-gradient(135deg, #fff, #94a3b8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.03em'
        }}>
          EcoChain AI Platform
        </h1>

        <p style={{ 
          maxWidth: '680px', 
          margin: '0 auto 2rem auto', 
          color: 'var(--foreground-muted)', 
          fontSize: '0.95rem',
          lineHeight: 1.6
        }}>
          Multi-agent orchestration powered by Google Gemini. Featuring dedicated role-based views for Management and Warehouse Floor Staff with automated hand-offs and Human-in-the-Loop governance.
        </p>

        {/* Tab Selector */}
        <div style={{
          display: 'inline-flex',
          backgroundColor: '#0f172a',
          padding: '6px',
          borderRadius: '12px',
          border: '1px solid #1e293b',
          marginBottom: '2rem',
          gap: '8px'
        }}>
          <button
            onClick={() => setActiveTab('management')}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              border: 'none',
              backgroundColor: activeTab === 'management' ? '#2563eb' : 'transparent',
              color: activeTab === 'management' ? '#ffffff' : '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            🏢 Management & Orchestration (Full Dashboards)
          </button>
          <button
            onClick={() => setActiveTab('floor')}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              border: 'none',
              backgroundColor: activeTab === 'floor' ? '#059669' : 'transparent',
              color: activeTab === 'floor' ? '#ffffff' : '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            📦 Warehouse Floor Staff (Restricted To-Do Table)
          </button>
        </div>

        {/* Tab Description Banner */}
        <div style={{
          marginBottom: '1.75rem',
          fontSize: '0.85rem',
          color: activeTab === 'floor' ? '#34d399' : '#60a5fa',
          backgroundColor: activeTab === 'floor' ? 'rgba(5, 150, 105, 0.1)' : 'rgba(37, 99, 235, 0.1)',
          padding: '10px 16px',
          borderRadius: '8px',
          border: `1px solid ${activeTab === 'floor' ? 'rgba(5, 150, 105, 0.25)' : 'rgba(37, 99, 235, 0.25)'}`,
          maxWidth: '780px',
          margin: '0 auto 1.75rem auto'
        }}>
          {activeTab === 'floor'
            ? '🔒 Floor Staff roles have restricted access: only the dedicated To-Do Activities table is rendered to mark task statuses and report damaged items.'
            : '🌐 Management roles have full access to live Gemini orchestration, OSM fleet tracking, seasonal demand analytics, and Human-in-the-Loop review gates.'}
        </div>
        
        {/* User Role Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '1.25rem',
        }}>
          {displayedUsers.map((user) => (
            <div 
              key={user.id} 
              className="glass-card" 
              style={{ 
                padding: '1.4rem 1.1rem', 
                cursor: 'pointer', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                textAlign: 'center',
                borderRadius: '14px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.2s, border-color 0.2s'
              }}
              onClick={() => login(user.id)}
            >
              <div style={{
                position: 'relative',
                marginBottom: '0.85rem'
              }}>
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  style={{ 
                    width: '68px', 
                    height: '68px', 
                    borderRadius: '50%', 
                    border: '2px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.05)'
                  }} 
                />
              </div>

              <h4 style={{ marginBottom: '0.25rem', color: '#fff', fontSize: '1rem' }}>
                {user.name}
              </h4>
              
              <span className={`badge ${
                user.role.includes('Store') ? 'badge-primary' : 
                user.role.includes('Warehouse') ? 'badge-warning' : 
                user.role.includes('Logistics') ? 'badge-info' : 
                floorRoleList.includes(user.role) ? 'badge-primary' : 'badge-success'
              }`} style={{ marginBottom: '0.75rem', fontSize: '0.72rem' }}>
                {user.role}
              </span>

              <p style={{ 
                fontSize: '0.75rem', 
                color: 'var(--foreground-muted)', 
                lineHeight: 1.4,
                margin: 0,
                flex: 1
              }}>
                {getRoleDescription(user.role)}
              </p>

              <button 
                className="btn btn-outline" 
                style={{ 
                  marginTop: '1.1rem', 
                  width: '100%', 
                  fontSize: '0.78rem',
                  padding: '0.45rem'
                }}
              >
                {activeTab === 'floor' ? 'Open Floor Table ➔' : 'Enter Dashboard ➔'}
              </button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '2.25rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
          Tip: You can switch between management and floor staff roles at any time from the top header switcher.
        </div>
      </div>
    </div>
  );
}
