'use client';

import React, { useState, useEffect } from 'react';
// Removing unused imports
import { Button } from '@/components/ui/button';
import { listAgents, Agent } from '@/lib/api';
import { Plus } from 'lucide-react';

export function Sidebar() {
  const [activeTab, setActiveTab] = useState('all');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch agents on component mount
  useEffect(() => {
    fetchAgents();
  }, []);

  async function fetchAgents() {
    try {
      setLoading(true);
      const data = await listAgents();
      setAgents(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch agents:', err);
      setError('Failed to load AI agents');
    } finally {
      setLoading(false);
    }
  }

  // Filter agents based on active tab
  const filteredAgents = agents.filter(agent => {
    if (activeTab === 'all') return true;
    if (activeTab === 'my') return true; // In a real app, filter by ownership
    if (activeTab === 'installed') return agent.agent_type === 'active';
    if (activeTab === 'pinned') return false; // In a real app, filter by pinned status
    return true;
  });

  // No date grouping - show all agents

  return (
    <div className="flex flex-col h-full">
      {/* Header with Upstrima logo */}
      <div className="p-5 border-b border-upstrima-light-gray flex">
        {/* Using next/image is recommended, but for simplicity keeping the img tag with eslint-disable */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/upstrima-logo.png" alt="Upstrima" className="h-14 ml-[20%]" />
      </div>

      {/* Create new AI Agent button */}
      <div className="p-5">
        <Button className="w-full bg-white hover:bg-gray-100 text-black flex items-center justify-center gap-2">
          <Plus className="h-4 w-4" />
          <span>Create new AI Agent</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="px-5 flex space-x-2 text-sm">
        <button
          className={`px-2 py-1 ${activeTab === 'all' ? 'text-white' : 'text-gray-400'}`}
          onClick={() => setActiveTab('all')}
        >
          All
        </button>
        <button
          className={`px-2 py-1 ${activeTab === 'my' ? 'text-white' : 'text-gray-400'}`}
          onClick={() => setActiveTab('my')}
        >
          My agents
        </button>
        <button
          className={`px-2 py-1 ${activeTab === 'installed' ? 'text-white' : 'text-gray-400'}`}
          onClick={() => setActiveTab('installed')}
        >
          Installed
        </button>
        <button
          className={`px-2 py-1 ${activeTab === 'pinned' ? 'text-white' : 'text-gray-400'}`}
          onClick={() => setActiveTab('pinned')}
        >
          Pinned
        </button>
      </div>

      {/* Categories filter */}
      <div className="p-5">
        <Button variant="outline" className="w-full flex justify-between bg-upstrima-medium-gray text-white border-upstrima-light-gray">
          All categories
          <span>⋮⋮</span>
        </Button>
      </div>

      {/* Agent list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-400">Loading...</div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">{error}</div>
        ) : (
          <div className="space-y-4">
            {/* All agents section */}
            <div>
              <div>
                {filteredAgents.map((agent) => (
                  <AgentItem key={agent.id} agent={agent} />
                ))}
              </div>
            </div>

            {/* If no agents are found */}
            {filteredAgents.length === 0 && (
              <div className="p-4 text-center text-gray-400">
                No AI agents found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Removed "Get questions" section */}

      {/* User profile */}
      <div className="p-5 border-t border-upstrima-light-gray">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-white overflow-hidden mr-3">
            {/* White background instead of photo */}
          </div>
          <div className="flex-1">
            <p className="font-medium text-white">Test User</p>
            <p className="text-xs text-gray-400">full ownership</p>
          </div>
          <button className="text-gray-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// Agent item component
function AgentItem({ agent }: { agent: Agent }) {
  const handleAgentClick = () => {
    // Dispatch the custom event with the full agent object
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('agentSelected', {
        detail: {
          agentId: agent.id,
          agent: agent
        }
      });
      window.dispatchEvent(event);
      
      // Store the selected agent in the window object for other components to access
      // Define a type for the window with our custom property
      (window as Window & typeof globalThis & { __selectedAgent?: Agent }).__selectedAgent = agent;
      
      // Update URL without page reload using history API
      const url = new URL(window.location.href);
      url.searchParams.set('agent', agent.id);
      window.history.pushState({}, '', url);
    }
  };
  
  return (
    <div
      className="px-4 py-2 hover:bg-upstrima-medium-gray cursor-pointer"
      onClick={handleAgentClick}
    >
      <div className="flex items-center">
        <div className="w-8 h-8 bg-upstrima-medium-gray rounded-md flex items-center justify-center mr-3">
          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <span className="text-white truncate">{agent.name}</span>
      </div>
    </div>
  );
}