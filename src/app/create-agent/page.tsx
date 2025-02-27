'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { MainLayout } from '@/components/layout/main-layout';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createWorkflow, CreateWorkflowRequest } from "@/lib/api";
import { validateWorkflowJson } from "@/lib/workflow-validator";
import { debugWorkflowJson } from "@/lib/debug-tools";
import { JsonPreview } from "@/components/json-preview";

// Define form schema with Zod
const formSchema = z.object({
  name: z.string().min(3, {
    message: "Name must be at least 3 characters.",
  }),
  description: z.string().optional(),
  workflowFile: z
    .instanceof(File, { message: "Workflow JSON file is required" })
    .refine((file) => file.type === "application/json", {
      message: "File must be a JSON file",
    }),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateAgentPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Read the JSON file
      const fileContent = await data.workflowFile.text();
      
      // Debug the JSON file
      console.log("Debugging workflow JSON file...");
      const debugResult = debugWorkflowJson(fileContent);
      
      // Validate the JSON file
      const validationResult = debugResult.validationResult;
      if (!validationResult.valid) {
        throw new Error(`JSON validation failed: ${validationResult.errors.join(', ')}`);
      }
      
      const workflowJson = debugResult.parsed || JSON.parse(fileContent);

      // Create the workflow request
      // Make sure we're preserving the original structure from the JSON file
      // but overriding name and description with form values
      const workflowRequest: CreateWorkflowRequest = {
        name: data.name,
        description: data.description || workflowJson.description || "",
        // Ensure we're using the nodes from the JSON file
        nodes: workflowJson.nodes || [],
        // Ensure we're using the edges from the JSON file
        edges: workflowJson.edges || [],
        // Preserve any config from the JSON file
        config: workflowJson.config || {},
      };

      console.log("Submitting workflow request:", JSON.stringify(workflowRequest, null, 2));

      // Submit the workflow
      const result = await createWorkflow(workflowRequest);

      // Reset form
      form.reset();
      
      // Navigate back to home page
      router.push('/');
      
    } catch (err) {
      console.error("Failed to create workflow:", err);
      
      // Try to get more detailed error information
      let errorMessage = "";
      
      if (err instanceof Error) {
        if (err.message.includes("JSON validation failed")) {
          errorMessage = err.message;
        } else if (err.message.includes("Validation Error")) {
          errorMessage = "JSON file format is invalid. Please check that it contains valid nodes and edges.";
        } else {
          // Try to extract more detailed error information
          try {
            const errorObj = JSON.parse(err.message);
            if (errorObj.detail && errorObj.detail.errors) {
              errorMessage = `Validation errors: ${errorObj.detail.errors.join(', ')}`;
            } else if (errorObj.detail) {
              errorMessage = `Error: ${errorObj.detail}`;
            } else {
              errorMessage = err.message;
            }
          } catch {
            errorMessage = err.message;
          }
        }
      } else {
        errorMessage = "Failed to create AI agent. Please try again.";
      }
      
      setError(errorMessage);
      
      // Log additional debugging information
      console.log("Error details:", {
        error: err,
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <Link href="/" className="text-muted-foreground hover:text-primary mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left">
                  <path d="m12 19-7-7 7-7"/>
                  <path d="M19 12H5"/>
                </svg>
              </Link>
              <h1 className="text-2xl font-bold">Create New AI Agent</h1>
            </div>
            <p className="text-muted-foreground mt-1">
              Create a new AI agent by providing a name and uploading a workflow JSON file.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My AI Agent" {...field} />
                    </FormControl>
                    <FormDescription>
                      A descriptive name for your AI agent.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="This agent helps with..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A brief description of what this agent does.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="workflowFile"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>Workflow JSON File</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept=".json,application/json"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            onChange(file)
                            setSelectedFile(file)
                          } else {
                            setSelectedFile(null)
                          }
                        }}
                        {...fieldProps}
                      />
                    </FormControl>
                    <FormDescription>
                      Upload a JSON file containing the workflow definition.
                      <div className="flex flex-wrap gap-2 mt-1">
                        <a
                          href="/sample-workflow.json"
                          download="sample-workflow.json"
                          className="text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Download sample template
                        </a>
                        <span>•</span>
                        <a
                          href="/fixed-dmr-agent.json"
                          download="fixed-dmr-agent.json"
                          className="text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Download DMR agent template
                        </a>
                        <span>•</span>
                        <a
                          href="/workflow-guide.html"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View workflow guide
                        </a>
                      </div>
                    </FormDescription>
                    <FormMessage />
                    <JsonPreview file={selectedFile} />
                  </FormItem>
                )}
              />

              {error && (
                <div className="p-4 bg-red-50 text-red-800 rounded-md">
                  <p className="font-medium">Error:</p>
                  <p>{error}</p>
                </div>
              )}

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Agent"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </MainLayout>
  );
}