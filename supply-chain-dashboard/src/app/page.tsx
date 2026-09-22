'use client';

import React from 'react';
import { useDashboard } from '../lib/store';
import LoginScreen from '../components/LoginScreen';
import Dashboard from '../components/Dashboard';

export default function Home() {
  const { currentUser } = useDashboard();

  if (!currentUser) {
    return <LoginScreen />;
  }

  return <Dashboard />;
}
