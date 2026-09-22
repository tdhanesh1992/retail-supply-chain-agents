'use client';

import React, { useState } from 'react';
import { useDashboard } from '../lib/store';
import { WarehouseTask } from '../lib/types';

export const FloorStaffTaskBoard: React.FC = () => {
  const {
    currentUser,
    warehouseTasks,
    updateWarehouseTaskStatus,
    reportDamagedItem,
    logout,
    switchUser,
    users,
    agentLogs,
    backendConnected
  } = useDashboard();

  const [selectedFilter, setSelectedFilter] = useState<'All' | 'MyRole' | 'Pending' | 'Completed'>('MyRole');
  const [damageModalOpen, setDamageModalOpen] = useState(false);
  const [selectedTaskForDamage, setSelectedTaskForDamage] = useState<WarehouseTask | null>(null);
  const [damageReason, setDamageReason] = useState('Broken seal / packaging puncture');
  const [damageQuantity, setDamageQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [handoffSuccessNotice, setHandoffSuccessNotice] = useState<string | null>(null);

  if (!currentUser) return null;

  // Filter tasks based on role
  const userRole = currentUser.role;
  const filteredTasks = warehouseTasks.filter(task => {
    if (selectedFilter === 'MyRole') {
      return task.assignedRole === userRole;
    }
    if (selectedFilter === 'Pending') {
      return task.status === 'Pending' || task.status === 'In Progress';
    }
    if (selectedFilter === 'Completed') {
      return task.status === 'Completed';
    }
    return true; // 'All'
  });

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    setIsSubmitting(true);
    await updateWarehouseTaskStatus(taskId, newStatus);
    setIsSubmitting(false);

    if (newStatus === 'Completed') {
      setHandoffSuccessNotice(`Task ${taskId} marked as Completed! Warehouse Agent autonomously dispatched the downstream task.`);
      setTimeout(() => setHandoffSuccessNotice(null), 6000);
    }
  };

  const openDamageModal = (task: WarehouseTask) => {
    setSelectedTaskForDamage(task);
    setDamageQuantity(task.quantity || 1);
    setDamageModalOpen(true);
  };

  const handleConfirmDamage = async () => {
    if (!selectedTaskForDamage) return;
    setIsSubmitting(true);
    await reportDamagedItem(
      selectedTaskForDamage.id,
      selectedTaskForDamage.productId || 'UNKNOWN-SKU',
      damageQuantity,
      damageReason
    );
    setIsSubmitting(false);
    setDamageModalOpen(false);
    setSelectedTaskForDamage(null);
    setHandoffSuccessNotice(`Damage report filed for ${selectedTaskForDamage.id}. Warehouse Agent generated an urgent replacement pick task for Picker Staff!`);
    setTimeout(() => setHandoffSuccessNotice(null), 7000);
  };

  // Filter logs relevant to warehouse operations
  const floorLogs = agentLogs.filter(
    l => l.fromAgent === 'Warehouse Agent' || l.toAgent.includes('Staff') || l.toAgent.includes('QC') || l.toAgent.includes('Crew') || l.toAgent.includes('Clerk') || l.actionType === 'DAMAGE_HANDLING' || l.actionType === 'COORDINATION'
  ).slice(0, 5);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Picker Staff': return '🛒';
      case 'Packer Staff': return '📦';
      case 'Quality Control Inspector': return '🔍';
      case 'Loading & Dispatch Crew': return '🚛';
      case 'Put-away & Storage Clerk': return '📥';
      default: return '📋';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>COMPLETED</span>;
      case 'In Progress':
        return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)' }}>IN PROGRESS</span>;
      case 'Damaged Flagged':
        return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.4)' }}>DEFECT / DAMAGED</span>;
      default:
        return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }}>PENDING</span>;
    }
  };

  const getPriorityBadge = (priority?: string) => {
    if (priority === 'Critical') {
      return <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>🔴 CRITICAL</span>;
    }
    if (priority === 'Urgent') {
      return <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>⚡ URGENT</span>;
    }
    return <span style={{ color: '#94a3b8', fontSize: '11px' }}>NORMAL</span>;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#090d16', color: '#f8fafc', padding: '24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Top Restricted Floor Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        padding: '16px 24px',
        backgroundColor: '#111827',
        borderRadius: '16px',
        border: '1px solid #1f2937',
        marginBottom: '24px',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            fontSize: '28px',
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            backgroundColor: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #334155'
          }}>
            {getRoleIcon(userRole)}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#f8fafc' }}>
                Warehouse Floor Operations Board
              </h1>
              <span style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600
              }}>
                🔒 Restricted Role Access
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
              Dedicated To-Do terminal for <strong>{currentUser.name}</strong> ({userRole}) • Coordinated by AI Warehouse Agent
            </p>
          </div>
        </div>

        {/* User Switcher and Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', backgroundColor: '#1e293b', borderRadius: '10px', border: '1px solid #334155' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Switch Staff:</span>
            <select
              value={currentUser.id}
              onChange={(e) => switchUser(e.target.value)}
              style={{
                backgroundColor: 'transparent',
                color: '#38bdf8',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <optgroup label="Floor Staff Roles">
                {users.filter(u => ['Picker Staff', 'Packer Staff', 'Quality Control Inspector', 'Loading & Dispatch Crew', 'Put-away & Storage Clerk'].includes(u.role)).map(u => (
                  <option key={u.id} value={u.id} style={{ backgroundColor: '#1e293b', color: '#f8fafc' }}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Management Roles">
                {users.filter(u => !['Picker Staff', 'Packer Staff', 'Quality Control Inspector', 'Loading & Dispatch Crew', 'Put-away & Storage Clerk'].includes(u.role)).map(u => (
                  <option key={u.id} value={u.id} style={{ backgroundColor: '#1e293b', color: '#f8fafc' }}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <button
            onClick={logout}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              backgroundColor: '#374151',
              color: '#f8fafc',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Autonomous Handoff Success Banner */}
      {handoffSuccessNotice && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10b981',
          color: '#34d399',
          padding: '14px 20px',
          borderRadius: '12px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '14px',
          animation: 'fadeIn 0.3s ease'
        }}>
          <span style={{ fontSize: '20px' }}>⚡</span>
          <span>{handoffSuccessNotice}</span>
        </div>
      )}

      {/* Control Filters and Role Context Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['MyRole', 'Pending', 'Completed', 'All'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                border: selectedFilter === filter ? '1px solid #3b82f6' : '1px solid #1f2937',
                backgroundColor: selectedFilter === filter ? '#1d4ed8' : '#111827',
                color: selectedFilter === filter ? '#ffffff' : '#94a3b8',
                cursor: 'pointer'
              }}
            >
              {filter === 'MyRole' ? `My Tasks (${userRole})` : filter}
            </button>
          ))}
        </div>

        <div style={{ fontSize: '13px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: backendConnected ? '#10b981' : '#f59e0b' }} />
          <span>{backendConnected ? 'Warehouse Dispatch Live' : 'Offline Mode'}</span>
        </div>
      </div>

      {/* Main Dedicated To-Do Activities Table */}
      <div style={{
        backgroundColor: '#111827',
        borderRadius: '16px',
        border: '1px solid #1f2937',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        marginBottom: '24px'
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#f8fafc' }}>
            Assigned Activities List ({filteredTasks.length})
          </h2>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Updates immediately trigger autonomous role-to-role handoffs
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#0f172a', color: '#94a3b8', borderBottom: '1px solid #1f2937' }}>
                <th style={{ padding: '14px 18px', fontWeight: 600 }}>Task ID</th>
                <th style={{ padding: '14px 18px', fontWeight: 600 }}>Activity Type</th>
                <th style={{ padding: '14px 18px', fontWeight: 600 }}>Item Description</th>
                <th style={{ padding: '14px 18px', fontWeight: 600 }}>Warehouse Location</th>
                <th style={{ padding: '14px 18px', fontWeight: 600 }}>Quantity</th>
                <th style={{ padding: '14px 18px', fontWeight: 600 }}>Priority</th>
                <th style={{ padding: '14px 18px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '14px 18px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
                    No assigned activities found under selected filter.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const isAssignedToMe = task.assignedRole === userRole;
                  return (
                    <tr
                      key={task.id}
                      style={{
                        borderBottom: '1px solid #1f2937',
                        backgroundColor: isAssignedToMe ? 'rgba(59, 130, 246, 0.04)' : 'transparent',
                        transition: 'background-color 0.15s'
                      }}
                    >
                      <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontWeight: 600, color: '#38bdf8' }}>
                        {task.id}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: '#1e293b',
                          color: '#cbd5e1',
                          fontSize: '11px',
                          fontWeight: 600
                        }}>
                          {task.taskType}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', color: '#f1f5f9', fontWeight: 500 }}>
                        <div>{task.itemDescription}</div>
                        {task.damageReason && (
                          <div style={{ fontSize: '11px', color: '#f87171', marginTop: '2px' }}>
                            Defect Note: {task.damageReason}
                          </div>
                        )}
                        {task.orderId && (
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            Ref: {task.orderId}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px', color: '#94a3b8' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          📍 {task.location}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 600, color: '#f8fafc' }}>
                        {task.quantity || 1} units
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        {getPriorityBadge(task.priority)}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        {getStatusBadge(task.status)}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                          {task.status === 'Pending' && (
                            <button
                              disabled={isSubmitting}
                              onClick={() => handleStatusChange(task.id, 'In Progress')}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                backgroundColor: '#1e3a8a',
                                color: '#93c5fd',
                                border: '1px solid #2563eb',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Start Activity
                            </button>
                          )}

                          {task.status === 'In Progress' && (
                            <button
                              disabled={isSubmitting}
                              onClick={() => handleStatusChange(task.id, 'Completed')}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                backgroundColor: '#065f46',
                                color: '#6ee7b7',
                                border: '1px solid #059669',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Mark Completed ✓
                            </button>
                          )}

                          {/* Quality Control or any staff can flag damaged items */}
                          {task.status !== 'Completed' && task.status !== 'Damaged Flagged' && (
                            <button
                              disabled={isSubmitting}
                              onClick={() => openDamageModal(task)}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                color: '#f87171',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Flag Defect
                            </button>
                          )}

                          {task.status === 'Completed' && (
                            <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>Done</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Autonomous Role Hand-Off Directives Feed */}
      <div style={{
        backgroundColor: '#111827',
        borderRadius: '16px',
        border: '1px solid #1f2937',
        padding: '20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🤖</span>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#f8fafc' }}>
              Warehouse Agent Live Orchestration Directives
            </h3>
          </div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Autonomous Inter-Role Coordination</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {floorLogs.length === 0 ? (
            <div style={{ fontSize: '13px', color: '#64748b' }}>Awaiting initial warehouse hand-off events.</div>
          ) : (
            floorLogs.map((log, idx) => (
              <div
                key={log.id || idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '10px 14px',
                  backgroundColor: '#0f172a',
                  borderRadius: '10px',
                  border: '1px solid #1e293b'
                }}
              >
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: log.actionType === 'DAMAGE_HANDLING' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                  color: log.actionType === 'DAMAGE_HANDLING' ? '#f87171' : '#60a5fa'
                }}>
                  {log.fromAgent} ➔ {log.toAgent}
                </span>
                <span style={{ fontSize: '13px', color: '#e2e8f0', flex: 1 }}>
                  {log.message}
                </span>
                <span style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>
                  {log.timestamp}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* QC Damage Reporting Modal */}
      {damageModalOpen && selectedTaskForDamage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#111827',
            border: '1px solid #374151',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)'
          }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>⚠️</span>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                  Log Damaged / Defective Stock
                </h3>
              </div>
              <button
                onClick={() => setDamageModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  Item Details
                </label>
                <div style={{ padding: '10px 14px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b', fontSize: '13px', color: '#f1f5f9' }}>
                  <strong>{selectedTaskForDamage.itemDescription}</strong>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    Task ID: {selectedTaskForDamage.id} • SKU: {selectedTaskForDamage.productId || 'PROD-SKU'}
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  Defective Quantity
                </label>
                <input
                  type="number"
                  min={1}
                  max={selectedTaskForDamage.quantity || 100}
                  value={damageQuantity}
                  onChange={(e) => setDamageQuantity(parseInt(e.target.value) || 1)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  Damage Category / Inspection Failure Reason
                </label>
                <select
                  value={damageReason}
                  onChange={(e) => setDamageReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    fontSize: '14px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="Broken seal / packaging puncture">Broken seal / packaging puncture</option>
                  <option value="Crushed outer box during transit">Crushed outer box during transit</option>
                  <option value="Water/Moisture contamination">Water/Moisture contamination</option>
                  <option value="Defective component / failed test">Defective component / failed test</option>
                  <option value="Mislabeled SKU barcode">Mislabeled SKU barcode</option>
                </select>
              </div>

              <div style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                fontSize: '12px',
                color: '#fca5a5'
              }}>
                ℹ️ Submitting this will quarantine the batch, instruct the Packer to scrap/hold, and automatically generate an <strong>URGENT replacement picking task</strong> for Pete Picker.
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #1f2937', display: 'flex', justifyContent: 'flex-end', gap: '12px', backgroundColor: '#0f172a' }}>
              <button
                onClick={() => setDamageModalOpen(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#1e293b',
                  color: '#94a3b8',
                  border: '1px solid #334155',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleConfirmDamage}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {isSubmitting ? 'Logging...' : 'Confirm Defect & Trigger Replacement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
