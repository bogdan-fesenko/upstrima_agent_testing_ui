'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { ChatInterface } from '@/components/chat/chat-interface';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { listAgents, Agent } from '@/lib/api';

export default function Home() {
  const router = useRouter();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  
  // Get agent ID from URL if present
  const getAgentIdFromUrl = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('agent');
    }
    return null;
  };

  // Function to fetch agents without automatically setting selected agent
  // Wrapped in useCallback to prevent unnecessary re-renders
  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      const agentsData = await listAgents();
      console.log('Fetched agents:', agentsData);
      
      // Just update the agents list without changing selection
      setAgents(agentsData);
      
      // Only set selected agent if we don't have one yet
      if (!selectedAgent && agentsData.length > 0) {
        // Check if there's an agent ID in the URL
        const agentId = getAgentIdFromUrl();
        
        if (agentId) {
          // Find the agent with the matching ID
          const agent = agentsData.find((a: Agent) => a.id === agentId);
          if (agent) {
            console.log(`Found agent with ID ${agentId}:`, agent);
            setSelectedAgent(agent);
          } else {
            // If agent not found but we have agents, select the first one
            console.log(`Agent with ID ${agentId} not found, selecting first agent:`, agentsData[0]);
            setSelectedAgent(agentsData[0]);
          }
        } else {
          // No agent ID in URL, select the first one by default
          console.log('No agent ID in URL, selecting first agent:', agentsData[0]);
          setSelectedAgent(agentsData[0]);
        }
      }
      
      setError(null);
    } catch (err) {
      console.error('Failed to fetch agents:', err);
      setError('Failed to load AI agents');
    } finally {
      setLoading(false);
    }
  }, [selectedAgent]);

  // Fetch agents on component mount only
  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);
  
  // Handle agent selection more efficiently
  useEffect(() => {
    // Only handle popstate (browser back/forward) and custom events
    // without triggering unnecessary re-renders
    
    // Listen for popstate events (browser back/forward)
    const handlePopState = () => {
      const agentId = getAgentIdFromUrl();
      if (agentId && agents.length > 0) {
        const agent = agents.find((a: Agent) => a.id === agentId);
        if (agent && (!selectedAgent || selectedAgent.id !== agent.id)) {
          console.log(`Setting selected agent to: ${agent.name} (${agent.id})`);
          setSelectedAgent(agent);
          
          // Expose the selected agent to the main layout component
          if (typeof window !== 'undefined') {
            // Use a type assertion to add the property to window
            (window as Window & { __selectedAgent?: Agent }).__selectedAgent = agent;
          }
          
          // Dispatch an event to notify the agent preview sidebar
          const event = new CustomEvent('agentSelected', {
            detail: { agentId: agent.id, agent: agent }
          });
          window.dispatchEvent(event);
        }
      }
    };
    
    // Listen for custom agent selection event from sidebar
    const handleAgentSelected = (event: Event) => {
      // Cast to CustomEvent to access detail property
      const customEvent = event as CustomEvent;
      const { agentId } = customEvent.detail;
      
      if (agents.length > 0) {
        const agent = agents.find((a: Agent) => a.id === agentId);
        if (agent && (!selectedAgent || selectedAgent.id !== agent.id)) {
          console.log(`Setting selected agent to: ${agent.name} (${agent.id})`);
          setSelectedAgent(agent);
          
          // Expose the selected agent to the main layout component
          if (typeof window !== 'undefined') {
            // Use a type assertion to add the property to window
            (window as Window & { __selectedAgent?: Agent }).__selectedAgent = agent;
          }
        }
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('agentSelected', handleAgentSelected);
    
    // Initial check only if we don't have a selected agent yet
    if (!selectedAgent && agents.length > 0) {
      const agentId = getAgentIdFromUrl();
      if (agentId) {
        const agent = agents.find((a: Agent) => a.id === agentId);
        if (agent) {
          setSelectedAgent(agent);
        } else {
          setSelectedAgent(agents[0]);
        }
      } else {
        setSelectedAgent(agents[0]);
      }
    }
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('agentSelected', handleAgentSelected);
    };
  }, [agents, selectedAgent]);

  return (
    <MainLayout>
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-lg">Loading...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-destructive">
            <p className="text-lg">{error}</p>
            <p className="mt-2">Please try again later</p>
          </div>
        </div>
      ) : selectedAgent ? (
        <ChatInterface
          agent={selectedAgent}
          chatId={undefined} // Let the component handle chat ID retrieval from localStorage
        />
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">No AI agents available</p>
            <p className="mt-2 mb-6 text-muted-foreground">Create a new AI agent to get started</p>
            <Button
              onClick={() => router.push('/create-agent')}
              className="px-6"
            >
              <Plus className="mr-2 h-4 w-4" /> Create new AI Agent
            </Button>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
