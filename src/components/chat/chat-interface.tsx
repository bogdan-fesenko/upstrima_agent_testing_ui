'use client';

import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import {
  executeAgent,
  ChatMessage,
  Agent,
  getLatestOrCreateChat,
  getChatMessages,
  uploadFile,
  FileInfo,
  addChatMessage,
  deleteFile,
  getFileDownloadUrl,
  updateFileMetadata
} from '@/lib/api';
import { Send, Paperclip, ChevronDown, ThumbsUp, ThumbsDown, Copy, RotateCcw, History, X, Download, Edit, Trash2, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatInterfaceProps {
  agent: Agent;
  chatId?: string;
}

import { createChat } from '@/lib/api';

export function ChatInterface({ agent, chatId: initialChatId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileInfo[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Check localStorage for existing chat ID first, then use initialChatId as fallback
  const [chatId, setChatId] = useState<string | undefined>(() => {
    if (initialChatId) return initialChatId;
    if (typeof window !== 'undefined' && agent) {
      const savedChatId = localStorage.getItem(`lastChatId_${agent.id}`);
      return savedChatId || undefined;
    }
    return undefined;
  });
  
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Create a ref outside of the useEffect to track the last agent ID
  const lastAgentIdRef = useRef<string | null>(null);
  
  // Listen for chat creation events from the agent preview sidebar
  useEffect(() => {
    const handleChatCreated = (event: Event) => {
      const customEvent = event as CustomEvent<{ chatId: string; agentId: string }>;
      const { chatId, agentId } = customEvent.detail;
      
      if (agentId === agent?.id && chatId) {
        console.log(`New chat created from agent preview: ${chatId}`);
        
        // Update the chat ID
        setChatId(chatId);
        
        // Reset state
        setMessages([]);
        setError(null);
        setUploadedFiles([]);
        
        // Fetch messages for the new chat
        const fetchMessages = async () => {
          try {
            const chatMessages = await getChatMessages(chatId);
            setMessages(chatMessages);
          } catch (err) {
            console.error('Error fetching messages for new chat:', err);
          }
        };
        
        fetchMessages();
      }
    };
    
    window.addEventListener('chatCreated', handleChatCreated);
    
    return () => {
      window.removeEventListener('chatCreated', handleChatCreated);
    };
  }, [agent?.id]);

  // Handle agent changes with memoization to prevent unnecessary reloads
  useEffect(() => {
    console.log('ChatInterface received agent:', agent);
    
    // Only proceed if the agent ID has actually changed
    if (agent && (!lastAgentIdRef.current || lastAgentIdRef.current !== agent.id)) {
      lastAgentIdRef.current = agent.id;
      
      // Reset state when agent changes
      setMessages([]);
      setError(null);
      setUploadedFiles([]);
      
      // Initialize chat for the new agent
      const initializeChat = async () => {
        try {
          console.log(`Fetching latest or creating new chat for agent: ${agent.name} (${agent.id})`);
          const chat = await getLatestOrCreateChat(agent.id);
          console.log('Fetched or created chat:', chat);
          
          // Set the chat ID for the current agent
          setChatId(chat.id);
          
          // Store the chat ID in localStorage to persist across page reloads
          localStorage.setItem(`lastChatId_${agent.id}`, chat.id);
          
          // Fetch messages for this chat
          try {
            const chatMessages = await getChatMessages(chat.id);
            
            // Check if there are any messages or if a welcome message already exists
            const hasWelcomeMessage = chatMessages.some(msg =>
              msg.role === 'assistant' && msg.metadata && msg.metadata.isWelcomeMessage === true
            );
            
            console.log('Chat messages:', chatMessages.length, 'Has welcome message:', hasWelcomeMessage);
            
            if (chatMessages.length === 0 && agent.welcome_message && !hasWelcomeMessage) {
              // No messages and no welcome message, add one
              console.log('No messages found, adding welcome message');
              try {
                // Add welcome message to the database
                const welcomeMessageRequest = {
                  role: 'assistant' as const,
                  content: agent.welcome_message,
                  metadata: { isWelcomeMessage: true }
                };
                
                // Save to database
                const result = await addChatMessage(chat.id, welcomeMessageRequest);
                console.log('Added welcome message to database:', result);
                
                // Fetch messages again to get the welcome message with proper ID
                const updatedMessages = await getChatMessages(chat.id);
                setMessages(updatedMessages);
              } catch (welcomeErr) {
                console.error('Error adding welcome message:', welcomeErr);
                
                // Fallback to local-only welcome message if database save fails
                const welcomeMessage = {
                  id: Date.now().toString(),
                  role: 'assistant' as const,
                  content: agent.welcome_message,
                  chat_id: chat.id,
                  created_at: new Date().toISOString(),
                };
                
                setMessages([welcomeMessage]);
              }
            } else {
              // There are existing messages, just set them
              setMessages(chatMessages);
            }
          } catch (msgErr) {
            console.error('Error fetching chat messages:', msgErr);
            setMessages([]);
          }
        } catch (err) {
          console.error('Error fetching or creating chat:', err);
          setError('Failed to fetch or create chat');
        }
      };
    
      initializeChat();
    }
  }, [agent]); // Include the entire agent object in the dependency array

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle file upload button click
  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Handle file selection
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !chatId) return;
    
    const files = Array.from(e.target.files);
    setIsLoading(true);
    setError(null);
    
    try {
      const uploadedFileInfos: FileInfo[] = [];
      
      for (const file of files) {
        const fileInfo = await uploadFile(file, chatId);
        uploadedFileInfos.push(fileInfo);
      }
      
      setUploadedFiles(prev => [...prev, ...uploadedFileInfos]);
      console.log('Files uploaded:', uploadedFileInfos);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error uploading files:', err);
      setError('Failed to upload files');
    } finally {
      setIsLoading(false);
    }
  };

  // Remove a file from the uploaded files list
  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };
  
  // Handle file download
  const handleDownloadFile = async (fileId: string) => {
    try {
      setIsLoading(true);
      // Get a signed download URL
      const downloadData = await getFileDownloadUrl(fileId);
      
      // Open the URL in a new tab/window
      window.open(downloadData.url, '_blank');
      
      console.log(`File download initiated: ${fileId}`);
    } catch (err) {
      console.error('Error downloading file:', err);
      setError('Failed to download file');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle file deletion (permanently delete from storage)
  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to permanently delete this file?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      // Delete the file from storage and database
      await deleteFile(fileId);
      
      // Remove from local state
      setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
      
      console.log(`File deleted: ${fileId}`);
    } catch (err) {
      console.error('Error deleting file:', err);
      setError('Failed to delete file');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle file rename
  const handleRenameFile = async (fileId: string) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (!file) return;
    
    const newName = prompt('Enter new filename:', file.filename);
    if (!newName || newName === file.filename) return;
    
    try {
      setIsLoading(true);
      // Update file metadata
      const updatedFile = await updateFileMetadata(fileId, { filename: newName });
      
      // Update local state
      setUploadedFiles(prev =>
        prev.map(f => f.id === fileId ? updatedFile : f)
      );
      
      console.log(`File renamed: ${fileId} to ${newName}`);
    } catch (err) {
      console.error('Error renaming file:', err);
      setError('Failed to rename file');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if ((!inputValue.trim() && uploadedFiles.length === 0) || isLoading) return;

    // Ensure we have a valid chat ID
    if (!chatId) {
      console.error('No chat ID available. Cannot send message.');
      setError('No active chat. Please try refreshing the page.');
      return;
    }

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: inputValue,
      chat_id: chatId,
      created_at: new Date().toISOString(),
    };

    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      console.log(`Executing agent with ID: ${agent.id}, chat ID: ${chatId}`);
      
      // Prepare file paths for the agent
      const filePaths = uploadedFiles.map(file => file.url);
      
      // Execute agent with the current chat ID and file paths
      const result = await executeAgent(
        agent.id,
        chatId,
        {
          text: inputValue,
          file_urls: filePaths.length > 0 ? filePaths : undefined
        }
      );
      
      console.log('Agent execution result:', result);

      // Add assistant message to chat
      const assistantMessage = {
        id: Date.now().toString(),
        role: 'assistant' as const,
        content: result.response || 'No response received',
        chat_id: chatId,
        created_at: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Clear uploaded files after sending
      setUploadedFiles([]);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Handle key press (Enter to send)
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // Handle creating a new chat
  const handleNewChat = async () => {
    if (!agent) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Create a new chat for the current agent
      const newChat = await createChat(agent.id);
      console.log('Created new chat:', newChat);
      
      // Update the chat ID
      setChatId(newChat.id);
      
      // Store the new chat ID in localStorage
      localStorage.setItem(`lastChatId_${agent.id}`, newChat.id);
      
      // Clear uploaded files
      setUploadedFiles([]);
      
      // Reset input
      setInputValue('');
      
      // For a new chat, we always want to add a welcome message if available
      console.log('Creating welcome message for new chat');
      if (agent.welcome_message) {
        // For a new chat, we don't need to check for existing welcome messages
        try {
          // Add welcome message to the database
          const welcomeMessageRequest = {
            role: 'assistant' as const,
            content: agent.welcome_message,
            metadata: { isWelcomeMessage: true }
          };
          
          // Save to database
          const result = await addChatMessage(newChat.id, welcomeMessageRequest);
          console.log('Added welcome message to database for new chat:', result);
          
          // Fetch messages again to get the welcome message with proper ID
          const updatedMessages = await getChatMessages(newChat.id);
          setMessages(updatedMessages);
        } catch (welcomeErr) {
          console.error('Error adding welcome message to new chat:', welcomeErr);
          
          // Fallback to local-only welcome message if database save fails
          const welcomeMessage = {
            id: Date.now().toString(),
            role: 'assistant' as const,
            content: agent.welcome_message,
            chat_id: newChat.id,
            created_at: new Date().toISOString(),
          };
          
          setMessages([welcomeMessage]);
        }
      } else {
        // Clear messages if no welcome message
        setMessages([]);
      }
    } catch (err) {
      console.error('Error creating new chat:', err);
      setError('Failed to create new chat');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-upstrima-dark">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-upstrima-light-gray">
        <div className="flex items-center">
          <div className="flex items-center gap-2">
            <span className="text-upstrima-teal">✦</span>
            <h2 className="text-white font-medium">Upstrima model</h2>
          </div>
          <div className="ml-4">
            <Button
              className="bg-upstrima-medium-gray hover:bg-upstrima-light-gray text-white border-none flex items-center gap-2"
              onClick={handleNewChat}
            >
              <Plus className="h-4 w-4 text-upstrima-teal" />
              <span>Create new chat</span>
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-upstrima-medium-gray/50 px-2 py-1 rounded-md">
            <span className="h-2 w-2 rounded-full bg-upstrima-green"></span>
            <span className="text-xs text-white">WITSML</span>
          </div>
          <div className="flex items-center gap-1 bg-upstrima-medium-gray/50 px-2 py-1 rounded-md">
            <span className="text-xs text-white">⚡ 362</span>
          </div>
          <Button className="bg-upstrima-medium-gray hover:bg-upstrima-light-gray text-white border-none">
            Upgrade
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <p>Start a conversation with {agent.name}</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}

        {isLoading && (
          <div className="flex items-center justify-center">
            <div className="animate-pulse text-gray-400">Thinking...</div>
          </div>
        )}

        {error && (
          <div className="text-red-500 text-center p-2 bg-red-500/10 rounded-md">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-upstrima-light-gray">
        {/* Uploaded files */}
        {uploadedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {uploadedFiles.map(file => (
              <div key={file.id} className="flex items-center bg-upstrima-medium-gray rounded-md px-2 py-1">
                <span className="text-xs mr-1 max-w-[150px] truncate text-white">{file.filename}</span>
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 p-0 ml-1 text-gray-400 hover:text-white"
                    onClick={() => handleDownloadFile(file.id)}
                    title="Download file"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 p-0 text-gray-400 hover:text-white"
                        title="File options"
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 bg-upstrima-medium-gray border-upstrima-light-gray">
                      <DropdownMenuItem onClick={() => handleRenameFile(file.id)} className="text-white hover:bg-upstrima-light-gray">
                        <Edit className="h-3 w-3 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteFile(file.id)} className="text-white hover:bg-upstrima-light-gray">
                        <Trash2 className="h-3 w-3 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 p-0 text-gray-400 hover:text-white"
                    onClick={() => removeFile(file.id)}
                    title="Remove from chat"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex items-center gap-2">
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple
          />
          
          {/* File upload button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFileUploadClick}
            disabled={isLoading}
            className="text-gray-400 hover:text-white"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          
          <div className="relative flex-1">
            <Input
              placeholder="Type your message here..."
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="pr-10 bg-upstrima-medium-gray border-upstrima-light-gray text-white placeholder-gray-400 focus:ring-upstrima-teal focus:border-upstrima-teal"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSendMessage}
                disabled={((!inputValue.trim() && uploadedFiles.length === 0) || isLoading)}
                className="text-gray-400 hover:text-white"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <History className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Message bubble component
function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isFileUpload = isSystem && message.metadata && message.metadata.file_upload_notification;
  const [copied, setCopied] = useState(false);
  
  const handleCopyContent = () => {
    navigator.clipboard.writeText(message.content)
      .then(() => {
        console.log('Message copied to clipboard');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
      })
      .catch(err => {
        console.error('Failed to copy message: ', err);
      });
  };

  // Special rendering for file upload notifications
  if (isFileUpload) {
    const fileNames = message.metadata?.files || [];
    
    return (
      <div className="flex justify-center my-4">
        <div className="bg-upstrima-medium-gray rounded-md px-4 py-2 max-w-[80%] text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Paperclip className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-white">Files Uploaded</span>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {fileNames.map((fileName: string, index: number) => (
              <div key={index} className="bg-upstrima-light-gray rounded-md px-2 py-1 text-xs text-white">
                {fileName}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Regular system messages (not file uploads)
  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-upstrima-medium-gray/50 rounded-md px-3 py-1 max-w-[80%] text-center">
          <span className="text-xs text-gray-400">{message.content}</span>
        </div>
      </div>
    );
  }

  // Regular user or assistant messages
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${isUser ? '' : 'w-full'}`}>
        {!isUser && (
          <div className="flex items-center gap-2 mb-1 text-xs text-gray-400">
            <div className="flex items-center justify-center h-5 w-5 rounded-md bg-upstrima-medium-gray">
              <span className="text-white">AI</span>
            </div>
            <span>Based on unverified sources</span>
          </div>
        )}
        
        <Card className={`p-4 ${isUser ? 'bg-upstrima-medium-gray text-white border-none' : 'bg-upstrima-medium-gray border-upstrima-light-gray'}`}>
          {isUser ? (
            <div className="whitespace-pre-wrap">{message.content}</div>
          ) : (
            <div className="markdown-content text-white">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  table: (props) => (
                    <div className="table-wrapper">
                      <table {...props} />
                    </div>
                  )
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </Card>
        
        {!isUser && (
          <div className="flex items-center gap-2 mt-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 relative text-gray-400 hover:text-white hover:bg-upstrima-medium-gray" onClick={handleCopyContent} title="Copy to clipboard">
              {copied ? (
                <span className="text-xs absolute -top-5 left-1/2 transform -translate-x-1/2 bg-upstrima-medium-gray px-1 py-0.5 rounded text-white">Copied!</span>
              ) : null}
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white hover:bg-upstrima-medium-gray">
              <ThumbsUp className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white hover:bg-upstrima-medium-gray">
              <ThumbsDown className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white hover:bg-upstrima-medium-gray">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}