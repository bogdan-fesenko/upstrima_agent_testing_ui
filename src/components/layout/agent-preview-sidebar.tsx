'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Agent, getAgent, createChat, addChatMessage, getChatMessages } from '@/lib/api';
import { X, Star, User } from 'lucide-react';

interface AgentPreviewSidebarProps {
  agent: Agent | null;
  onClose: () => void;
}

export function AgentPreviewSidebar({ agent: propAgent, onClose }: AgentPreviewSidebarProps) {
  const [expanded, setExpanded] = useState(false);
  const [agent, setAgent] = useState<Agent | null>(propAgent);
  const [loading, setLoading] = useState(false);
  // Removed showOutputInstructions state as instructions will always be visible

  // Listen for agent selection events
  useEffect(() => {
    const handleAgentSelected = async (event: any) => {
      const { agentId, agent: eventAgent } = event.detail;
      
      if (eventAgent) {
        // If the event already contains the agent data, use it
        setAgent(eventAgent);
      } else if (agentId) {
        // Otherwise, fetch the agent data
        try {
          setLoading(true);
          const fetchedAgent = await getAgent(agentId);
          setAgent(fetchedAgent);
        } catch (error) {
          console.error('Failed to fetch agent:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    window.addEventListener('agentSelected', handleAgentSelected);
    
    return () => {
      window.removeEventListener('agentSelected', handleAgentSelected);
    };
  }, []);

  // Update local state when prop changes
  useEffect(() => {
    if (propAgent) {
      setAgent(propAgent);
    }
  }, [propAgent]);

  if (loading) {
    return (
      <div className="w-[26rem] border-l border-upstrima-light-gray bg-upstrima-dark flex flex-col h-full items-center justify-center">
        <p className="text-white">Loading agent details...</p>
      </div>
    );
  }

  if (!agent) return null;

  // Format date to DD/MM/YY
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().slice(2)}`;
  };

  // Get creator from agent data or use placeholder
  const creator = agent.creator || "John Doe";
  
  // Get category from agent data or use placeholder
  const category = agent.category || "Well planning";
  
  // Placeholder for rating - in a real app, this would come from the database
  const rating = 4.4;

  // Format date for display
  const publicDate = agent.created_at ?
    `${new Date(agent.created_at).getDate()}/${new Date(agent.created_at).getMonth() + 1}/${new Date(agent.created_at).getFullYear().toString().slice(-2)}` :
    "12/12/24";
    
  // Handle restarting the agent (creating a new chat)
  const [isRestarting, setIsRestarting] = useState(false);
  
  const handleRestartAgent = async () => {
    if (!agent) return;
    
    setIsRestarting(true);
    
    try {
      // Create a new chat for the current agent
      const newChat = await createChat(agent.id);
      console.log('Created new chat:', newChat);
      
      // Store the new chat ID in localStorage
      localStorage.setItem(`lastChatId_${agent.id}`, newChat.id);
      
      // For a new chat, we always want to add a welcome message if available
      if (agent.welcome_message) {
        try {
          // Add welcome message to the database
          const welcomeMessageRequest = {
            role: 'assistant' as const,
            content: agent.welcome_message,
            metadata: { isWelcomeMessage: true }
          };
          
          // Save to database
          await addChatMessage(newChat.id, welcomeMessageRequest);
          console.log('Added welcome message to database for new chat');
          
          // Dispatch a custom event to notify the chat interface to reload
          if (typeof window !== 'undefined') {
            const event = new CustomEvent('chatCreated', {
              detail: {
                chatId: newChat.id,
                agentId: agent.id
              }
            });
            window.dispatchEvent(event);
          }
        } catch (error) {
          console.error('Error adding welcome message to new chat:', error);
        }
      }
      
      // Show success message or notification
      console.log('Successfully created new chat');
    } catch (error) {
      console.error('Error creating new chat:', error);
    } finally {
      setIsRestarting(false);
    }
  };

  return (
    <div className="w-[26rem] border-l border-upstrima-light-gray bg-upstrima-dark flex flex-col h-full">
      <div className="p-4 border-b border-upstrima-light-gray flex justify-between items-center">
        <h2 className="text-lg font-medium text-white">AI Agent preview</h2>
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Agent header with icon and info */}
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            {/* Agent icon - always using the Upstrima logo */}
            <div className="w-32 h-32 bg-upstrima-medium-gray rounded-md flex items-center justify-center">
              <div className="w-16 h-16 flex items-center justify-center">
                <svg width="48" height="48" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  <path d="M50 0 L100 0 L50 100 L0 100 Z" fill="url(#gradient)" />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00ff7f" />
                      <stop offset="100%" stopColor="#00bfff" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* Category and rating */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="bg-upstrima-medium-gray text-white px-3 py-1 rounded-md text-sm">
                  {category}
                </span>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-upstrima-teal fill-upstrima-teal" />
                  <span className="text-white">{rating}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Agent name and description */}
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">{agent.name}</h1>
            <p className="text-gray-400">{agent.description}</p>
          </div>

          {/* Agent metadata */}
          <div className="grid grid-cols-3 border-t border-upstrima-light-gray pt-4">
            <div className="flex flex-col items-center">
              <span className="text-white">{category}</span>
              <span className="text-xs text-gray-400">Category</span>
            </div>
            <div className="flex flex-col items-center border-l border-r border-upstrima-light-gray">
              <span className="text-white">{publicDate}</span>
              <span className="text-xs text-gray-400">Public date</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center">
                <User className="h-4 w-4 text-white mr-1" />
                <span className="text-white">{creator}</span>
              </div>
              <span className="text-xs text-gray-400">Creator</span>
            </div>
          </div>
        </div>

        {/* Input instructions */}
        <div className="bg-upstrima-medium-gray rounded-md p-5">
          <h3 className="text-white text-lg font-medium mb-2">Input instructions</h3>
          <p className="text-gray-300 text-sm">
            {agent.input_instructions || "No input instructions provided."}
          </p>
        </div>

        {/* Output instructions (always visible) */}
        <div>
          <h3 className="text-white text-lg font-medium mb-2">Output instructions</h3>
          <div className="bg-upstrima-medium-gray rounded-md p-5">
            <p className="text-gray-300 text-sm">
              {agent.output_instructions || "No output instructions provided."}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-2">
          <Button
            className="w-full bg-white hover:bg-gray-100 text-black"
            onClick={handleRestartAgent}
            disabled={isRestarting}
          >
            {isRestarting ? 'Creating new chat...' : 'Restart AI Agent'}
          </Button>
          <Button className="w-full bg-upstrima-medium-gray hover:bg-upstrima-light-gray text-white">
            Edit agent
          </Button>
        </div>
      </div>
    </div>
  );
}