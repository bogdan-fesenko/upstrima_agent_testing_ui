/**
 * API service for interacting with the backend
 */

// Base URL for API requests
// When deploying to Vercel, set NEXT_PUBLIC_API_URL in the Vercel project settings
// pointing to your deployed backend URL (e.g., https://your-backend-api.com)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_PATH = '/api/v1';

// For debugging
if (process.env.NODE_ENV === 'development') {
  console.log(`Using API base URL: ${API_BASE_URL}`);
}

// Token constants
const AUTH_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_EXPIRY_KEY = 'token_expiry';

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMessage = typeof errorData.detail === 'string'
          ? errorData.detail
          : JSON.stringify(errorData.detail);
      }
    } catch {
      // If we can't parse the error as JSON, just use the status text
    }
    
    throw new Error(errorMessage);
  }
  
  return await response.json() as T;
}

// Types based on OpenAPI spec
export interface Agent {
  id: string;
  agent_id: string;
  name: string;
  description: string;
  version: number;
  agent_type: string;
  created_at: string; // ISO date-time
  updated_at: string; // ISO date-time
  // Additional metadata fields
  category?: string;
  creator?: string;
  input_instructions?: string;
  output_instructions?: string;
  icon?: string;
  welcome_message?: string;
}

export interface Chat {
  id: string;
  user_id: string;
  agent_id: string;
  title: string;
  created_at: string; // ISO date-time
  updated_at: string; // ISO date-time
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: ChatMessageMetadata;
  created_at: string; // ISO date-time
}

export interface Execution {
  id: string;
  agent_id: string;
  user_id: string;
  chat_id: string;
  input?: unknown;
  output?: unknown;
  status: string;
  error?: string;
  start_time: string; // ISO date-time
  end_time?: string; // ISO date-time
}

export interface NodeExecution {
  id: string;
  execution_id: string;
  node_id: string;
  node_type: string;
  input_data?: unknown;
  output_data?: unknown;
  status: string;
  error?: string;
  stack_trace?: string;
  start_time: string; // ISO date-time
  end_time?: string; // ISO date-time
}

export interface ExecutionDetail {
  execution: Execution;
  nodes: NodeExecution[];
}

export interface FileInfo {
  id: string;
  user_id: string;
  filename: string;
  url: string;
  content_type: string;
  size: number;
  created_at: string; // ISO date-time
}

// Request types
export interface CreateChatRequest {
  agent_id: string;
  title?: string;
}

export interface FileUploadMetadata {
  file_upload_notification: boolean;
  files: string[];
}

export interface WelcomeMessageMetadata {
  isWelcomeMessage: boolean;
}

export interface ChatMessageMetadata {
  file_upload_notification?: boolean;
  files?: string[];
  isWelcomeMessage?: boolean;
  error?: boolean;
  [key: string]: unknown; // Allow other metadata properties
}

export interface ChatMessageRequest {
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: ChatMessageMetadata;
}

export interface ExecuteRequest {
  chat_id: string;
  input: unknown; // Replace with the actual type if known
}

// API functions
export async function healthCheck(): Promise<{ status: string; message: string }> {
  const response = await fetch(`${API_BASE_URL}${API_PATH}/health`);
  return handleResponse<{ status: string; message: string }>(response);
}

// Agent endpoints
export async function listAgents(agentType?: string): Promise<Agent[]> {
  const url = new URL(`${API_BASE_URL}${API_PATH}/agents`);
  if (agentType) {
    url.searchParams.append('agent_type', agentType);
  }
  
  const token = await getAuthToken();
  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return handleResponse<Agent[]>(response);
}

export async function getAgent(agentId: string): Promise<Agent> {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}${API_PATH}/agents/${agentId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return handleResponse<Agent>(response);
}

export async function executeAgent(
  agentId: string,
  chatId: string,
  input: unknown // Replace with the actual type if known
): Promise<{ response: string; error?: string }> {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}${API_PATH}/agents/${agentId}/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      chat_id: chatId,
      input
    } as ExecuteRequest)
  });
  
  return handleResponse<{ response: string; error?: string }>(response);
}

export async function getLatestOrCreateChat(agentId: string): Promise<Chat> {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}${API_PATH}/chats/latest-or-new/${agentId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return handleResponse<Chat>(response);
}

// Chat endpoints
export async function createChat(agentId: string, title?: string): Promise<Chat> {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}${API_PATH}/chats`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      agent_id: agentId,
      title
    } as CreateChatRequest)
  });
  
  return handleResponse<Chat>(response);
}

export async function listChats(agentId?: string): Promise<Chat[]> {
  const url = new URL(`${API_BASE_URL}${API_PATH}/chats`);
  if (agentId) {
    url.searchParams.append('agent_id', agentId);
  }
  
  const token = await getAuthToken();
  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return handleResponse<Chat[]>(response);
}

export async function getChatMessages(
  chatId: string,
  limit: number = 50,
  offset: number = 0
): Promise<ChatMessage[]> {
  const url = new URL(`${API_BASE_URL}${API_PATH}/chats/${chatId}/messages`);
  url.searchParams.append('limit', limit.toString());
  url.searchParams.append('offset', offset.toString());
  
  const token = await getAuthToken();
  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return handleResponse<ChatMessage[]>(response);
}

export async function addChatMessage(
  chatId: string,
  message: ChatMessageRequest
): Promise<{ message_id: string; chat_id: string }> {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}${API_PATH}/chats/${chatId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(message)
  });
  
  return handleResponse<{ message_id: string; chat_id: string }>(response);
}

export async function clearChatHistory(
  chatId: string
): Promise<{ status: string; message: string }> {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}${API_PATH}/chats/${chatId}/messages`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return handleResponse<{ status: string; message: string }>(response);
}

// File endpoints
export async function uploadFile(
  file: globalThis.File,
  chatId?: string
): Promise<FileInfo> {
  const formData = new FormData();
  formData.append('file', file);
  
  if (chatId) {
    formData.append('chat_id', chatId);
  }
  
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}${API_PATH}/files/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  return handleResponse<FileInfo>(response);
}

export async function listFiles(
  limit: number = 50,
  offset: number = 0
): Promise<FileInfo[]> {
  const url = new URL(`${API_BASE_URL}${API_PATH}/files`);
  url.searchParams.append('limit', limit.toString());
  url.searchParams.append('offset', offset.toString());
  
  const token = await getAuthToken();
  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return handleResponse<FileInfo[]>(response);
}

export async function getFile(fileId: string): Promise<FileInfo> {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}${API_PATH}/files/${fileId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return handleResponse<FileInfo>(response);
}

export async function getChatFiles(chatId: string): Promise<FileInfo[]> {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}${API_PATH}/files/chat/${chatId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return handleResponse<FileInfo[]>(response);
}

export async function processFile(fileUrl: string): Promise<unknown> { // Replace with the actual type if known
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}${API_PATH}/files/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ file_url: fileUrl })
  });
  
  return handleResponse<unknown>(response); // Replace with the actual type if known
}

export async function deleteFile(fileId: string): Promise<void> {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}${API_PATH}/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to delete file: ${response.status} ${response.statusText}`);
  }
}

export interface FileUpdateRequest {
  filename?: string;
  content_type?: string;
}

export async function updateFileMetadata(fileId: string, updateData: FileUpdateRequest): Promise<FileInfo> {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}${API_PATH}/files/${fileId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updateData)
  });
  
  return handleResponse<FileInfo>(response);
}

export interface DownloadUrlResponse {
  url: string;
  expires_in: number;
}

export async function getFileDownloadUrl(fileId: string, expiresIn: number = 60): Promise<DownloadUrlResponse> {
  const token = await getAuthToken();
  const url = new URL(`${API_BASE_URL}${API_PATH}/files/${fileId}/download`);
  url.searchParams.append('expires_in', expiresIn.toString());
  
  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return handleResponse<DownloadUrlResponse>(response);
}

// Execution endpoints
export async function getExecution(executionId: string): Promise<ExecutionDetail> {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}${API_PATH}/executions/${executionId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return handleResponse<ExecutionDetail>(response);
}

export async function getChatExecutions(chatId: string): Promise<Execution[]> {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}${API_PATH}/executions/chat/${chatId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return handleResponse<Execution[]>(response);
}

export async function listExecutions(
  limit: number = 10,
  offset: number = 0,
  agentId?: string,
  status?: string
): Promise<Execution[]> {
  const url = new URL(`${API_BASE_URL}${API_PATH}/executions`);
  url.searchParams.append('limit', limit.toString());
  url.searchParams.append('offset', offset.toString());
  
  if (agentId) {
    url.searchParams.append('agent_id', agentId);
  }
  
  if (status) {
    url.searchParams.append('status', status);
  }
  
  const token = await getAuthToken();
  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return handleResponse<Execution[]>(response);
}

// Authentication interfaces
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    name?: string;
  };
}

// Authentication functions
export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}${API_PATH}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(credentials)
  });
  
  const authData = await handleResponse<AuthResponse>(response);
  
  // Store tokens and expiry
  storeAuthData(authData);
  
  return authData;
}

export async function signup(userData: SignupRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}${API_PATH}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });
  
  const authData = await handleResponse<AuthResponse>(response);
  
  // Store tokens and expiry
  storeAuthData(authData);
  
  return authData;
}

export async function logout(): Promise<void> {
  // Clear auth data from storage
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
}

export async function refreshToken(): Promise<AuthResponse | null> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  
  if (!refreshToken) {
    return null;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}${API_PATH}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
    
    const authData = await handleResponse<AuthResponse>(response);
    
    // Store new tokens and expiry
    storeAuthData(authData);
    
    return authData;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    // Clear invalid tokens
    logout();
    return null;
  }
}

// Helper function to store authentication data
function storeAuthData(authData: AuthResponse): void {
  localStorage.setItem(AUTH_TOKEN_KEY, authData.access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, authData.refresh_token);
  
  // Calculate and store token expiry time
  const expiryTime = Date.now() + authData.expires_in * 1000;
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
}

// Helper function to check if the user is authenticated
export function isAuthenticated(): boolean {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
  
  if (!token || !expiryTime) {
    return false;
  }
  
  // Check if token is expired
  return parseInt(expiryTime) > Date.now();
}

// Helper function to get the auth token with automatic refresh if needed
export async function getAuthToken(): Promise<string> {
  // For development purposes, we'll use a simple token approach
  // In a real application, this would be integrated with your backend auth system
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  
  if (!token) {
    // In development mode, use the special test token that the backend accepts
    if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
      console.log('Using test token for development');
      return 'test-token';
    }
    return '';
  }
  
  return token;
}

// For development, we'll skip the Supabase integration for now
// import { supabase } from './supabase';