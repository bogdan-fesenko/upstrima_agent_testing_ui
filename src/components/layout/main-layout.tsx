'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { AgentPreviewSidebar } from './agent-preview-sidebar';
import { Agent } from '@/lib/api';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showAgentPreview, setShowAgentPreview] = useState(false);

  // Listen for agent selection events
  useEffect(() => {
    const handleAgentSelected = (event: any) => {
      const { agentId, agent: eventAgent } = event.detail;
      
      // Show the preview sidebar
      setShowAgentPreview(true);
      
      // If the event contains the agent data, update our state
      if (eventAgent) {
        setSelectedAgent(eventAgent);
      }
    };
    
    window.addEventListener('agentSelected', handleAgentSelected);
    
    return () => {
      window.removeEventListener('agentSelected', handleAgentSelected);
    };
  }, []);

  // Get the selected agent from the page component
  useEffect(() => {
    // This is a workaround to get the selected agent from the page component
    // In a real app, you would use a global state management solution
    const checkForSelectedAgent = () => {
      if (window && (window as any).__selectedAgent) {
        setSelectedAgent((window as any).__selectedAgent);
      }
    };

    // Check immediately and then set up an interval
    checkForSelectedAgent();
    const interval = setInterval(checkForSelectedAgent, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-upstrima-dark">
      {/* Header - removed as it's not in the design */}
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - reduced width by ~15% */}
        <div className="w-80 border-r border-upstrima-light-gray bg-upstrima-dark-gray">
          <Sidebar />
        </div>
        
        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>

        {/* Agent preview sidebar - always shown when agent is selected */}
        {selectedAgent && (
          <AgentPreviewSidebar
            agent={selectedAgent}
            onClose={() => setSelectedAgent(null)}
          />
        )}
      </div>
    </div>
  );
}