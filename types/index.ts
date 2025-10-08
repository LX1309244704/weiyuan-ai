export interface User {
  id: string
  email: string
  username: string
  createdAt: string
  avatar?: string
}

export interface CanvasState {
  elements: CanvasElement[]
  selectedElement: string | null
  brushConfig: BrushConfig
}

export interface CanvasElement {
  id: string
  type: 'path' | 'rect' | 'circle' | 'text' | 'image'
  data: any
  position: { x: number; y: number }
  createdAt: string
}

export interface BrushConfig {
  size: number
  color: string
  opacity: number
}

export interface AIGenerationRequest {
  prompt: string
  imageData?: string
  type: 'image' | 'video'
  model: 'sd-1.5' | 'sd-xl' | 'dalle-3' | 'runway'
  creativity: number
  quality: 'fast' | 'standard' | 'high'
}

export interface AIGenerationResult {
  id: string
  request: AIGenerationRequest
  resultUrl: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: string
  completedAt?: string
}

export interface ChatMessage {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  imageData?: string
  generationRequest?: AIGenerationRequest
  generationResult?: AIGenerationResult
}