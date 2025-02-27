"use client"

import { useState, useEffect } from "react"
import { validateWorkflowJson } from "@/lib/workflow-validator"

interface JsonPreviewProps {
  file: File | null
}

export function JsonPreview({ file }: JsonPreviewProps) {
  const [preview, setPreview] = useState<{
    content: any
    isValid: boolean
    errors: string[]
  }>({
    content: null,
    isValid: false,
    errors: [],
  })

  useEffect(() => {
    if (!file) {
      setPreview({
        content: null,
        isValid: false,
        errors: [],
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const validation = validateWorkflowJson(content)
        
        setPreview({
          content: JSON.parse(content),
          isValid: validation.valid,
          errors: validation.errors,
        })
      } catch (error) {
        setPreview({
          content: null,
          isValid: false,
          errors: [error instanceof Error ? error.message : "Failed to parse JSON"],
        })
      }
    }
    reader.readAsText(file)
  }, [file])

  if (!file || !preview.content) {
    return null
  }

  return (
    <div className="mt-4 space-y-2">
      <h3 className="text-sm font-medium">JSON Preview</h3>
      
      {!preview.isValid && (
        <div className="p-3 text-sm bg-red-50 text-red-800 rounded-md">
          <p className="font-medium">Validation Errors:</p>
          <ul className="list-disc pl-5 mt-1">
            {preview.errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      
      {preview.isValid && (
        <div className="p-3 text-sm bg-green-50 text-green-800 rounded-md">
          <p>✓ JSON is valid</p>
        </div>
      )}
      
      <div className="mt-2">
        <p className="text-sm text-muted-foreground mb-1">Structure:</p>
        <div className="p-3 bg-muted rounded-md text-xs overflow-auto max-h-40">
          <pre>
            {JSON.stringify(
              {
                name: preview.content.name,
                description: preview.content.description,
                nodes: Array.isArray(preview.content.nodes) 
                  ? `[${preview.content.nodes.length} nodes]` 
                  : "Invalid nodes",
                edges: Array.isArray(preview.content.edges) 
                  ? `[${preview.content.edges.length} edges]` 
                  : "Invalid edges",
                config: preview.content.config ? "Present" : "Not present",
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </div>
  )
}