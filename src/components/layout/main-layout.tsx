'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './sidebar';
import { AgentPreviewSidebar } from './agent-preview-sidebar';
import { Agent } from '@/lib/api';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  // Listen for agent selection events
  useEffect(() => {
    // Define a type for the custom event
    interface AgentSelectedEventDetail {
      agent?: Agent;
    }
    
    const handleAgentSelected = (event: Event) => {
      // Cast to CustomEvent to access detail property
      const customEvent = event as CustomEvent<AgentSelectedEventDetail>;
      const { agent: eventAgent } = customEvent.detail;
      
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
      // Define a type for the window with our custom property
      type CustomWindow = Window & typeof globalThis & {
        __selectedAgent?: Agent;
      };
      
      const customWindow = window as CustomWindow;
      if (customWindow && customWindow.__selectedAgent) {
        setSelectedAgent(customWindow.__selectedAgent);
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