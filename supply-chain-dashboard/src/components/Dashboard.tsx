'use client';

import React, { useState } from 'react';
import { useDashboard } from '../lib/store';
import WorkflowVisualizer from './WorkflowVisualizer';
import AgentDeliberationStream from './AgentDeliberationStream';
import ChatWidget from './ChatWidget';
import TruckMap from './TruckMap';
import { FloorStaffTaskBoard } from './FloorStaffTaskBoard';
import { SeasonalDemandChart } from './SeasonalDemandChart';

const formatNumber = (num: number) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

type TabType = 'overview' | 'agents' | 'fleet' | 'inventory';

export default function Dashboard() {
  const { 
    currentUser, users, switchUser, logout, 
    trucks, toggleAutofill, facilities, products, 
    workflows, alerts, dismissAlert, triggerScenario, backendConnected,
    refreshData 
  } = useDashboard();


  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [notificationsExpanded, setNotificationsExpanded] = useState<boolean>(false);

  // Role screen restriction: Floor staff can ONLY access the dedicated To-Do Activities table
  const floorRoles = [
    'Picker Staff',
    'Packer Staff',
    'Quality Control Inspector',
    'Loading & Dispatch Crew',
    'Put-away & Storage Clerk'
  ];
  if (currentUser && floorRoles.includes(currentUser.role)) {
    return <FloorStaffTaskBoard />;
  }

  const pendingApprovalsCount = workflows
    .flatMap(w => w.steps)
    .filter(s => s.status === 'Awaiting Human' || s.requiresHumanAction).length;

  const totalCo2Saved = trucks.reduce((acc, t) => acc + (t.co2SavedKg || 0), 0) + 128.4;
  const evTrucksCount = trucks.filter(t => t.fuelType?.includes('EV') || t.fuelType?.includes('Electric')).length;
  const evRatio = trucks.length > 0 ? Math.round((evTrucksCount / trucks.length) * 100) : 67;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--background)' }}>
      {/* Top Modern Navigation Header */}
      <header className="glass-panel" style={{
        margin: '0.75rem 1rem 0.5rem 1rem',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        borderRadius: '14px',
        border: '1px solid var(--glass-border)'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #059669, #10b981)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
            boxShadow: '0 4px 14px var(--secondary-glow)'
          }}>
            🌿
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#fff', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              EcoChain AI
              <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>
                Sustainable Retail
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>
              Autonomous Multi-Agent Orchestration Engine
            </div>
          </div>
        </div>

        {/* Live System Telemetry Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="glass-card" style={{ padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.9rem' }}>🌱</span>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--foreground-muted)' }}>Net CO2 Saved</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399' }}>{totalCo2Saved.toFixed(1)} kg</div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.9rem' }}>⚡</span>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--foreground-muted)' }}>EV Fleet Ratio</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8' }}>{evRatio}% Zero-Emission</div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.9rem' }}>👤</span>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--foreground-muted)' }}>Human Gates</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: pendingApprovalsCount > 0 ? '#f87171' : '#34d399' }}>
                {pendingApprovalsCount} Awaiting Review
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: backendConnected ? '#34d399' : '#fbbf24' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: backendConnected ? '#10b981' : '#f59e0b', boxShadow: backendConnected ? '0 0 8px #10b981' : 'none' }} />
              <span>{backendConnected ? 'Backend Live' : 'Local Fallback'}</span>
            </div>
            <button
              onClick={() => refreshData()}
              title="Manual on-demand sync from backend"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--glass-border)',
                borderRadius: '6px',
                color: 'var(--foreground-muted)',
                fontSize: '0.72rem',
                padding: '0.2rem 0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--foreground-muted)')}
            >
              <span>🔄</span> Sync
            </button>
          </div>

        </div>

        {/* Demo User Switcher & Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <img 
              src={currentUser?.avatar} 
              alt={currentUser?.name} 
              style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid var(--primary)' }} 
            />
            <div style={{ display: 'none', minWidth: '100px', md: 'block' } as any}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{currentUser?.name}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--foreground-muted)' }}>{currentUser?.role}</div>
            </div>
          </div>

          {/* Quick Demo Switcher */}
          <select 
            value={currentUser?.id} 
            onChange={e => switchUser(e.target.value)}
            style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px',
              color: '#fff',
              padding: '0.45rem 0.65rem',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            <optgroup label="Management Roles">
              {users.filter(u => !floorRoles.includes(u.role)).map(u => (
                <option key={u.id} value={u.id} style={{ backgroundColor: '#1e293b' }}>
                  {u.name} ({u.role})
                </option>
              ))}
            </optgroup>
            <optgroup label="Floor Staff (Restricted To-Do View)">
              {users.filter(u => floorRoles.includes(u.role)).map(u => (
                <option key={u.id} value={u.id} style={{ backgroundColor: '#1e293b' }}>
                  {u.name} ({u.role})
                </option>
              ))}
            </optgroup>
          </select>

          <button 
            className="btn btn-outline" 
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div style={{ display: 'flex', flex: 1, padding: '0.5rem 1rem 1rem 1rem', gap: '1rem', minHeight: 'calc(100vh - 85px)' }}>
        
        {/* Sidebar Nav */}
        <div className="glass-panel" style={{ 
          width: '230px', 
          padding: '1.25rem 1rem', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.5rem',
          flexShrink: 0,
          borderRadius: '14px'
        }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--foreground-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.25rem 0.5rem' }}>
            Navigation
          </div>

          <button 
            className={`btn btn-outline ${activeTab === 'overview' ? 'active' : ''}`}
            style={{ justifyContent: 'flex-start' }}
            onClick={() => setActiveTab('overview')}
          >
            <span>📊</span> Mission Control
          </button>

          <button 
            className={`btn btn-outline ${activeTab === 'agents' ? 'active' : ''}`}
            style={{ justifyContent: 'flex-start' }}
            onClick={() => setActiveTab('agents')}
          >
            <span>🤖</span> Multi-Agent Network
          </button>

          <button 
            className={`btn btn-outline ${activeTab === 'fleet' ? 'active' : ''}`}
            style={{ justifyContent: 'flex-start' }}
            onClick={() => setActiveTab('fleet')}
          >
            <span>🚚</span> Eco-Fleet & Routes
          </button>

          <button 
            className={`btn btn-outline ${activeTab === 'inventory' ? 'active' : ''}`}
            style={{ justifyContent: 'flex-start' }}
            onClick={() => setActiveTab('inventory')}
          >
            <span>📦</span> Facilities & Stock
          </button>

          {/* Quick Simulation Triggers in Sidebar */}
          <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--foreground-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 0.25rem' }}>
              Autonomous Triggers
            </div>

            <button 
              className="btn btn-warning" 
              style={{ justifyContent: 'flex-start', fontSize: '0.78rem', padding: '0.5rem 0.75rem' }}
              onClick={() => triggerScenario('festive_surge', 15)}
            >
              🍁 Festive Season Surge
            </button>

            <button 
              className="btn btn-danger" 
              style={{ justifyContent: 'flex-start', fontSize: '0.78rem', padding: '0.5rem 0.75rem' }}
              onClick={() => triggerScenario('emergency_restock')}
            >
              ⚠️ Emergency Stockout
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto' }}>
          
          {/* Collapsible Notifications / Alerts Section */}
          {alerts.length > 0 && (
            <div className="glass-panel animate-fade-in" style={{
              borderRadius: '12px',
              border: `1px solid ${alerts.some(a => a.type === 'Critical') ? 'rgba(239, 68, 68, 0.4)' : 'var(--glass-border-strong)'}`,
              overflow: 'hidden',
              background: 'rgba(15, 23, 42, 0.7)',
              boxShadow: alerts.some(a => a.type === 'Critical') ? '0 4px 20px rgba(239, 68, 68, 0.15)' : '0 4px 20px rgba(0,0,0,0.3)',
              transition: 'all 0.25s ease'
            }}>
              {/* Clickable Header Bar */}
              <div 
                id="notifications-collapsible-header"
                onClick={() => setNotificationsExpanded(prev => !prev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1.25rem',
                  cursor: 'pointer',
                  userSelect: 'none',
                  background: notificationsExpanded ? 'rgba(0,0,0,0.3)' : 'transparent',
                  borderBottom: notificationsExpanded ? '1px solid var(--glass-border)' : 'none',
                  transition: 'background 0.2s ease'
                }}
              >
                {/* Left side: Notifications title with real-time count */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>🔔</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', letterSpacing: '-0.01em' }}>
                      Notifications
                    </span>
                    <span 
                      className={alerts.some(a => a.type === 'Critical') ? "badge badge-danger" : "badge badge-warning"} 
                      style={{ 
                        fontSize: '0.75rem', 
                        padding: '0.15rem 0.55rem',
                        fontWeight: 700,
                        borderRadius: '999px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <span style={{ 
                        width: '6px', 
                        height: '6px', 
                        borderRadius: '50%', 
                        background: '#fff', 
                        display: 'inline-block'
                      }} />
                      {alerts.length} {alerts.length === 1 ? 'alert' : 'alerts'}
                    </span>
                  </div>
                  {!notificationsExpanded && alerts[0] && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)' }}>
                      • {alerts[0].message.slice(0, 65)}{alerts[0].message.length > 65 ? '...' : ''}
                    </span>
                  )}
                </div>

                {/* Right side: Collapse / Expand icon */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>
                    {notificationsExpanded ? 'Collapse' : 'Expand'}
                  </span>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    color: '#fff',
                    transform: notificationsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.25s ease'
                  }}>
                    ▼
                  </div>
                </div>
              </div>

              {/* Collapsible Alerts Body */}
              {notificationsExpanded && (
                <div className="animate-fade-in" style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '0.5rem', 
                  padding: '0.85rem 1.25rem',
                  maxHeight: '380px',
                  overflowY: 'auto'
                }}>
                  {alerts.map(alt => (
                    <div key={alt.id} style={{
                      background: alt.type === 'Critical' ? 'rgba(239, 68, 68, 0.12)' : alt.type === 'Warning' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                      border: `1px solid ${alt.type === 'Critical' ? 'rgba(239, 68, 68, 0.35)' : alt.type === 'Warning' ? 'rgba(245, 158, 11, 0.35)' : 'rgba(59, 130, 246, 0.35)'}`,
                      borderRadius: '8px',
                      padding: '0.65rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      transition: 'all 0.2s ease'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>
                          {alt.type === 'Critical' ? '🚨' : alt.type === 'Warning' ? '⚠️' : 'ℹ️'}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <span style={{ fontSize: '0.88rem', color: '#fff', fontWeight: 500 }}>{alt.message}</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--foreground-muted)' }}>{alt.timestamp} • {alt.type} Priority</span>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissAlert(alt.id);
                        }}
                        title="Dismiss alert"
                        style={{ 
                          background: 'rgba(255,255,255,0.08)', 
                          border: '1px solid rgba(255,255,255,0.1)', 
                          borderRadius: '6px',
                          color: 'rgba(255,255,255,0.7)', 
                          cursor: 'pointer', 
                          fontSize: '0.78rem',
                          padding: '0.25rem 0.55rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.color = '#fff';
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                          e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                        }}
                      >
                        Dismiss ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}


          {/* TAB 1: MISSION CONTROL (Overview) */}
          {activeTab === 'overview' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* KPI Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div className="glass-card" style={{ padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)' }}>Carbon Footprint Reduction</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34d399', margin: '0.25rem 0' }}>{totalCo2Saved.toFixed(1)} kg CO2</div>
                  <div style={{ fontSize: '0.75rem', color: '#10b981' }}>↑ 34% reduction vs baseline diesel</div>
                </div>

                <div className="glass-card" style={{ padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)' }}>Active Delivery Fleet</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#38bdf8', margin: '0.25rem 0' }}>{trucks.length} Trucks</div>
                  <div style={{ fontSize: '0.75rem', color: '#60a5fa' }}>{evTrucksCount} Electric Vehicles (EV) Active</div>
                </div>

                <div className="glass-card" style={{ padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)' }}>Sustainable Fill Optimization</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#c084fc', margin: '0.25rem 0' }}>88.4% Load</div>
                  <div style={{ fontSize: '0.75rem', color: '#a855f7' }}>Zero-empty pallet freight policy</div>
                </div>

                <div className="glass-card" style={{ padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)' }}>Human Safety Approvals</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: pendingApprovalsCount > 0 ? '#f87171' : '#34d399', margin: '0.25rem 0' }}>
                    {pendingApprovalsCount} Action Required
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>
                    {pendingApprovalsCount > 0 ? 'Orders paused until authorized' : 'All workflows authorized'}
                  </div>
                </div>
              </div>

              {/* Multi-Agent Deliberation Live Stream */}
              <AgentDeliberationStream />

              {/* Seasonal Festive Demand Analytics & Surge Visualizer */}
              <SeasonalDemandChart />

              {/* Real-time OpenStreetMap Fleet Tracking */}
              <TruckMap />

              {/* Workflows Visualizer with Human-in-the-Loop */}
              <WorkflowVisualizer />

            </div>
          )}

          {/* TAB 2: AGENTS COMMAND CENTER */}
          {activeTab === 'agents' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <SeasonalDemandChart />
              <AgentDeliberationStream />
              <WorkflowVisualizer />
            </div>
          )}

          {/* TAB 3: SUSTAINABLE FLEET & ROUTES */}
          {activeTab === 'fleet' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <TruckMap />
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>Eco-Friendly Delivery Fleet</h3>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--foreground-muted)' }}>
                      Managed autonomously by Logistics Agent with Sustainable Autofill to prevent empty transport miles.
                    </p>
                  </div>
                  <span className="badge badge-success">
                    {trucks.filter(t => t.status === 'In Transit').length} In Transit
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  {trucks.map(truck => {
                    const loadPct = Math.round((truck.currentLoad / truck.capacity) * 100);
                    return (
                      <div key={truck.id} style={{
                        background: 'rgba(0,0,0,0.25)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.3rem' }}>🚚</span>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{truck.id.toUpperCase()}</div>
                              <div style={{ fontSize: '0.72rem', color: '#38bdf8' }}>{truck.fuelType || 'Electric (EV)'}</div>
                            </div>
                          </div>
                          <span className={`badge ${truck.status === 'In Transit' ? 'badge-info' : truck.status === 'Loading' ? 'badge-warning' : 'badge-purple'}`}>
                            {truck.status}
                          </span>
                        </div>

                        {/* Pallet Load Progress Bar */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.35rem' }}>
                            <span style={{ color: 'var(--foreground-muted)' }}>Load Capacity:</span>
                            <span style={{ fontWeight: 600, color: loadPct >= 85 ? '#34d399' : '#fbbf24' }}>
                              {truck.currentLoad} / {truck.capacity} Pallets ({loadPct}%)
                            </span>
                          </div>
                          <div className="progress-track">
                            <div className={loadPct >= 85 ? 'progress-bar-green' : 'progress-bar-blue'} style={{ width: `${loadPct}%` }} />
                          </div>
                        </div>

                        {/* Route & ETA */}
                        <div style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <div>Route: {truck.originId || 'Central Hub'} ➔ {truck.destinationId || 'Downtown Store'}</div>
                          {truck.eta && <div>ETA: <strong style={{ color: '#fff' }}>{truck.eta}</strong></div>}
                          <div>Estimated Carbon Offset: <strong style={{ color: '#34d399' }}>+{truck.co2SavedKg || 45.2} kg CO2</strong></div>
                        </div>

                        {/* Sustainable Autofill Toggle */}
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          paddingTop: '0.65rem', 
                          borderTop: '1px solid rgba(255,255,255,0.06)' 
                        }}>
                          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                            Sustainable Autofill
                          </span>
                          <button
                            onClick={() => toggleAutofill(truck.id)}
                            style={{
                              background: truck.sustainableFillMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.08)',
                              border: `1px solid ${truck.sustainableFillMode ? '#10b981' : 'var(--glass-border)'}`,
                              color: truck.sustainableFillMode ? '#34d399' : 'rgba(255,255,255,0.5)',
                              borderRadius: '6px',
                              padding: '0.2rem 0.6rem',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            {truck.sustainableFillMode ? '✓ ENABLED' : 'DISABLED'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FACILITIES & INVENTORY */}
          {activeTab === 'inventory' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>Facilities & Stock Telemetry</h3>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--foreground-muted)' }}>
                      Monitored 24/7 by Inventory Agent with predictive demand analytics.
                    </p>
                  </div>
                  <button 
                    className="btn btn-danger" 
                    style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
                    onClick={() => triggerScenario('emergency_restock')}
                  >
                    Simulate Low Stock Alert
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {facilities.map(facility => (
                    <div key={facility.id} style={{
                      background: 'rgba(0,0,0,0.25)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '12px',
                      padding: '1.25rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff' }}>
                            {facility.name}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)' }}>
                            📍 {facility.location} • Lead Time: {facility.leadTimeDays || 2} Days
                          </div>
                        </div>
                        <span className={`badge ${facility.type === 'Warehouse' ? 'badge-primary' : facility.type === 'Store' ? 'badge-success' : 'badge-purple'}`}>
                          {facility.type}
                        </span>
                      </div>

                      {/* Inventory Table */}
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                          <thead>
                            <tr style={{ color: 'var(--foreground-muted)', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left' }}>
                              <th style={{ padding: '0.5rem' }}>Product</th>
                              <th style={{ padding: '0.5rem' }}>Stock Level</th>
                              <th style={{ padding: '0.5rem' }}>Predicted Demand</th>
                              <th style={{ padding: '0.5rem' }}>Health Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {facility.inventory.map((inv, idx) => {
                              const prod = products.find(p => p.id === inv.productId);
                              const isLow = inv.quantity < (inv.predictedDemand * 0.3);
                              return (
                                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                  <td style={{ padding: '0.65rem 0.5rem', color: '#fff', fontWeight: 600 }}>
                                    {prod?.name || inv.productId}
                                    <span style={{ fontSize: '0.72rem', color: 'var(--foreground-muted)', display: 'block' }}>
                                      Eco Score: {prod?.sustainabilityScore || 95}/100
                                    </span>
                                  </td>
                                  <td suppressHydrationWarning style={{ padding: '0.65rem 0.5rem', fontWeight: 700, color: isLow ? '#f87171' : '#f1f5f9' }}>
                                    {formatNumber(inv.quantity)} units
                                  </td>
                                  <td suppressHydrationWarning style={{ padding: '0.65rem 0.5rem', color: 'var(--foreground-muted)' }}>
                                    {formatNumber(inv.predictedDemand)} units
                                  </td>
                                  <td style={{ padding: '0.65rem 0.5rem' }}>
                                    <span className={`badge ${isLow ? 'badge-danger' : 'badge-success'}`}>
                                      {isLow ? 'CRITICAL DEPLETION' : 'BALANCED'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Floating Multi-Agent Chat Widget */}
      <ChatWidget />
    </div>
  );
}
