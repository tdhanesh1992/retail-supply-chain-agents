'use client';

import React, { useState } from 'react';
import { useDashboard } from '../lib/store';

const formatNumber = (num: number) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export const SeasonalDemandChart: React.FC = () => {
  const { seasonalHistory, triggerScenario } = useDashboard();
  const [metricView, setMetricView] = useState<'units' | 'surge' | 'stockout'>('units');
  const [isSimulating, setIsSimulating] = useState(false);

  const maxUnits = Math.max(...seasonalHistory.map(h => h.unitsSold), 125000);

  const handleApplyPromo = async () => {
    setIsSimulating(true);
    await triggerScenario('festive_surge', 15);
    setIsSimulating(false);
  };

  return (
    <div style={{
      backgroundColor: '#111827',
      borderRadius: '16px',
      border: '1px solid #1f2937',
      padding: '24px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      marginBottom: '24px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            fontSize: '24px',
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            🍁
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>
                Seasonal Demand & Festive Surge Analytics
              </h3>
              <span style={{
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                color: '#f59e0b',
                border: '1px solid rgba(245, 158, 11, 0.4)'
              }}>
                Seasonal Agent Telemetry
              </span>
            </div>
            <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
              Historical comparison (Past 3 Years) vs. 2026 AI-Predicted Festive Surge (+45%)
            </p>
          </div>
        </div>

        {/* Metric Selector */}
        <div style={{ display: 'flex', gap: '8px', backgroundColor: '#0f172a', padding: '4px', borderRadius: '10px', border: '1px solid #1e293b' }}>
          <button
            onClick={() => setMetricView('units')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              border: 'none',
              backgroundColor: metricView === 'units' ? '#3b82f6' : 'transparent',
              color: metricView === 'units' ? '#ffffff' : '#94a3b8',
              cursor: 'pointer'
            }}
          >
            Volume (Units Sold)
          </button>
          <button
            onClick={() => setMetricView('surge')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              border: 'none',
              backgroundColor: metricView === 'surge' ? '#f59e0b' : 'transparent',
              color: metricView === 'surge' ? '#ffffff' : '#94a3b8',
              cursor: 'pointer'
            }}
          >
            Surge Spike (%)
          </button>
          <button
            onClick={() => setMetricView('stockout')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              border: 'none',
              backgroundColor: metricView === 'stockout' ? '#10b981' : 'transparent',
              color: metricView === 'stockout' ? '#ffffff' : '#94a3b8',
              cursor: 'pointer'
            }}
          >
            Stockout Prevention (%)
          </button>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <div style={{ padding: '14px', backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Historical Average Peak</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>64,933 units</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>2023 - 2025 holiday baseline</div>
        </div>
        <div style={{ padding: '14px', backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
          <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600, textTransform: 'uppercase' }}>2026 Forecast Spike</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#fbbf24', marginTop: '4px' }}>+45.0% Surge</div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>118,500 projected demand</div>
        </div>
        <div style={{ padding: '14px', backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b' }}>
          <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600, textTransform: 'uppercase' }}>Stockout Mitigation</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#34d399', marginTop: '4px' }}>1.2% Risk</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Down from 8.4% in 2023</div>
        </div>
        <div style={{ padding: '14px', backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b' }}>
          <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600, textTransform: 'uppercase' }}>Recommended Promo</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#38bdf8', marginTop: '4px' }}>15% Green Promo</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Diwali / Pre-Holiday shelf</div>
        </div>
      </div>

      {/* Visual Chart Bars Container */}
      <div style={{
        padding: '24px',
        backgroundColor: '#0a0f1d',
        borderRadius: '14px',
        border: '1px solid #1e293b',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {seasonalHistory.map((item) => {
            const pctWidth = metricView === 'units'
              ? (item.unitsSold / maxUnits) * 100
              : metricView === 'surge'
              ? (item.peakSurgePct / 50) * 100
              : ((10 - item.stockoutRatePct) / 10) * 100;

            const barColor = item.isProjected
              ? 'linear-gradient(90deg, #f59e0b 0%, #ec4899 100%)'
              : metricView === 'units'
              ? 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)'
              : metricView === 'surge'
              ? 'linear-gradient(90deg, #eab308 0%, #f59e0b 100%)'
              : 'linear-gradient(90deg, #10b981 0%, #34d399 100%)';

            return (
              <div key={item.period} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600, color: item.isProjected ? '#fbbf24' : '#e2e8f0' }}>
                      {item.period}
                    </span>
                    {item.isProjected && (
                      <span style={{
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 700,
                        backgroundColor: 'rgba(236, 72, 153, 0.2)',
                        color: '#f472b6',
                        border: '1px solid rgba(236, 72, 153, 0.4)'
                      }}>
                        AI ACTIVE FORECAST
                      </span>
                    )}
                  </div>
                  <div suppressHydrationWarning style={{ fontWeight: 700, color: item.isProjected ? '#fbbf24' : '#94a3b8' }}>
                    {metricView === 'units' && `${formatNumber(item.unitsSold)} units`}
                    {metricView === 'surge' && `+${item.peakSurgePct}% spike`}
                    {metricView === 'stockout' && `${item.stockoutRatePct}% stockout rate`}
                  </div>
                </div>

                {/* Bar */}
                <div style={{
                  height: '24px',
                  width: '100%',
                  backgroundColor: '#1e293b',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.max(pctWidth, 6)}%`,
                    background: barColor,
                    borderRadius: '8px',
                    transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingRight: '10px'
                  }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
                      {metricView === 'units' ? `${(item.unitsSold / 1000).toFixed(1)}k` : metricView === 'surge' ? `+${item.peakSurgePct}%` : `${item.stockoutRatePct}%`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Autonomous Recommendation Box & Quick Action */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        padding: '16px 20px',
        backgroundColor: 'rgba(245, 158, 11, 0.08)',
        borderRadius: '12px',
        border: '1px solid rgba(245, 158, 11, 0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', maxWidth: '720px' }}>
          <span style={{ fontSize: '20px' }}>💡</span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#fbbf24' }}>
              Seasonal Agent Orchestration Recommendation
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#cbd5e1', lineHeight: '1.4' }}>
              Historical surge velocity indicates high consumer propensity for Zero-Plastic Detergent and Bamboo personal care products. Pre-stocking 1,400 units via Electric Truck T-101 prevents a projected $28,400 stockout penalty while locking in Net-Zero delivery.
            </p>
          </div>
        </div>

        <button
          disabled={isSimulating}
          onClick={handleApplyPromo}
          style={{
            padding: '10px 18px',
            borderRadius: '10px',
            backgroundColor: '#f59e0b',
            color: '#0f172a',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap'
          }}
        >
          {isSimulating ? 'Deploying Promo...' : '⚡ Trigger Festive Surge Restock'}
        </button>
      </div>
    </div>
  );
};
