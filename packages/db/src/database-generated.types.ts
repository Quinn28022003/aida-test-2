export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agent_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          access: Database["public"]["Enums"]["agent_member_access"]
          agent_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          org_id: string
          revoked_at: string | null
          status: Database["public"]["Enums"]["invitation_status"]
          token_hash: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          access?: Database["public"]["Enums"]["agent_member_access"]
          agent_id: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by?: string | null
          org_id: string
          revoked_at?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
          token_hash: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          access?: Database["public"]["Enums"]["agent_member_access"]
          agent_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          org_id?: string
          revoked_at?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
          token_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_invitations_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_invitations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_invitations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_invocations: {
        Row: {
          agent_id: string
          agent_version_id: string | null
          completed_at: string | null
          conversation_id: string
          created_at: string
          error: Json | null
          error_class: string | null
          fallback_state: string | null
          finish_reason: string | null
          id: string
          job_id: string
          latency_ms: number | null
          model_health_state: string | null
          model_name: string
          model_provider: string
          org_id: string
          output_log: Json | null
          project_id: string
          prompt_log: Json | null
          prompt_template_id: string | null
          reasoning_trace: Json | null
          request_id: string | null
          requested_by: string | null
          response_message_id: string | null
          retrieval_event_id: string | null
          retry_count: number
          started_at: string | null
          status: Database["public"]["Enums"]["invocation_status"]
          token_input: number | null
          token_output: number | null
          trace_id: string | null
          trigger_message_id: string
        }
        Insert: {
          agent_id: string
          agent_version_id?: string | null
          completed_at?: string | null
          conversation_id: string
          created_at?: string
          error?: Json | null
          error_class?: string | null
          fallback_state?: string | null
          finish_reason?: string | null
          id?: string
          job_id: string
          latency_ms?: number | null
          model_health_state?: string | null
          model_name: string
          model_provider?: string
          org_id: string
          output_log?: Json | null
          project_id: string
          prompt_log?: Json | null
          prompt_template_id?: string | null
          reasoning_trace?: Json | null
          request_id?: string | null
          requested_by?: string | null
          response_message_id?: string | null
          retrieval_event_id?: string | null
          retry_count?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["invocation_status"]
          token_input?: number | null
          token_output?: number | null
          trace_id?: string | null
          trigger_message_id: string
        }
        Update: {
          agent_id?: string
          agent_version_id?: string | null
          completed_at?: string | null
          conversation_id?: string
          created_at?: string
          error?: Json | null
          error_class?: string | null
          fallback_state?: string | null
          finish_reason?: string | null
          id?: string
          job_id?: string
          latency_ms?: number | null
          model_health_state?: string | null
          model_name?: string
          model_provider?: string
          org_id?: string
          output_log?: Json | null
          project_id?: string
          prompt_log?: Json | null
          prompt_template_id?: string | null
          reasoning_trace?: Json | null
          request_id?: string | null
          requested_by?: string | null
          response_message_id?: string | null
          retrieval_event_id?: string | null
          retry_count?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["invocation_status"]
          token_input?: number | null
          token_output?: number | null
          trace_id?: string | null
          trigger_message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_invocations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_invocations_agent_version_id_fkey"
            columns: ["agent_version_id"]
            isOneToOne: false
            referencedRelation: "agent_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_invocations_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_invocations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_invocations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_invocations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_invocations_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_invocations_response_message_id_fkey"
            columns: ["response_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_invocations_retrieval_event_id_fkey"
            columns: ["retrieval_event_id"]
            isOneToOne: false
            referencedRelation: "retrieval_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_invocations_trigger_message_id_fkey"
            columns: ["trigger_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_members: {
        Row: {
          access: Database["public"]["Enums"]["agent_member_access"]
          agent_id: string
          created_at: string
          created_by: string | null
          id: string
          org_id: string
          revoked_at: string | null
          subject_id: string
          subject_type: string
        }
        Insert: {
          access?: Database["public"]["Enums"]["agent_member_access"]
          agent_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          org_id: string
          revoked_at?: string | null
          subject_id: string
          subject_type: string
        }
        Update: {
          access?: Database["public"]["Enums"]["agent_member_access"]
          agent_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          org_id?: string
          revoked_at?: string | null
          subject_id?: string
          subject_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_members_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_members_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_tools: {
        Row: {
          agent_id: string
          org_id: string
          policy: Json
          tool_id: string
        }
        Insert: {
          agent_id: string
          org_id: string
          policy?: Json
          tool_id: string
        }
        Update: {
          agent_id?: string
          org_id?: string
          policy?: Json
          tool_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_tools_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_tools_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_tools_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_versions: {
        Row: {
          agent_id: string
          created_at: string
          created_by: string | null
          id: string
          instructions: string
          max_output_tokens: number
          memory_policy: Json
          model_name: string
          model_profile: string
          model_provider: string
          org_id: string
          rag_policy: Json
          response_policy: Json
          status: Database["public"]["Enums"]["agent_version_status"]
          temperature: number
          tool_policy: Json
          version: number
        }
        Insert: {
          agent_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          instructions: string
          max_output_tokens?: number
          memory_policy?: Json
          model_name: string
          model_profile?: string
          model_provider?: string
          org_id: string
          rag_policy?: Json
          response_policy?: Json
          status?: Database["public"]["Enums"]["agent_version_status"]
          temperature?: number
          tool_policy?: Json
          version?: number
        }
        Update: {
          agent_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          instructions?: string
          max_output_tokens?: number
          memory_policy?: Json
          model_name?: string
          model_profile?: string
          model_provider?: string
          org_id?: string
          rag_policy?: Json
          response_policy?: Json
          status?: Database["public"]["Enums"]["agent_version_status"]
          temperature?: number
          tool_policy?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "agent_versions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_versions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          active_version_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          key: string
          name: string
          org_id: string
          status: Database["public"]["Enums"]["agent_status"]
          updated_at: string
        }
        Insert: {
          active_version_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          key: string
          name: string
          org_id: string
          status?: Database["public"]["Enums"]["agent_status"]
          updated_at?: string
        }
        Update: {
          active_version_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          key?: string
          name?: string
          org_id?: string
          status?: Database["public"]["Enums"]["agent_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agents_active_version_fk"
            columns: ["active_version_id"]
            isOneToOne: false
            referencedRelation: "agent_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      approvals: {
        Row: {
          approver_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          org_id: string
          reason: string | null
          requested_by_id: string | null
          requested_by_type: string
          resolved_at: string | null
          resource_id: string
          resource_type: string
          status: string
        }
        Insert: {
          approver_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          org_id: string
          reason?: string | null
          requested_by_id?: string | null
          requested_by_type: string
          resolved_at?: string | null
          resource_id: string
          resource_type: string
          status: string
        }
        Update: {
          approver_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          org_id?: string
          reason?: string | null
          requested_by_id?: string | null
          requested_by_type?: string
          resolved_at?: string | null
          resource_id?: string
          resource_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "approvals_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          action: string
          actor_id: string | null
          actor_type: string
          created_at: string
          id: string
          ip_address: unknown
          metadata: Json
          org_id: string | null
          request_id: string | null
          resource_id: string | null
          resource_type: string
          trace_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_type: string
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json
          org_id?: string | null
          request_id?: string | null
          resource_id?: string | null
          resource_type: string
          trace_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_type?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json
          org_id?: string | null
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string
          trace_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      background_jobs: {
        Row: {
          attempts: number
          created_at: string
          customer_job_id: string | null
          error: Json | null
          id: string
          locked_at: string | null
          locked_by: string | null
          max_attempts: number
          org_id: string | null
          payload: Json
          project_id: string | null
          request_id: string | null
          run_after: string
          status: Database["public"]["Enums"]["background_job_status"]
          trace_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          customer_job_id?: string | null
          error?: Json | null
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          org_id?: string | null
          payload: Json
          project_id?: string | null
          request_id?: string | null
          run_after?: string
          status?: Database["public"]["Enums"]["background_job_status"]
          trace_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          customer_job_id?: string | null
          error?: Json | null
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          org_id?: string | null
          payload?: Json
          project_id?: string | null
          request_id?: string | null
          run_after?: string
          status?: Database["public"]["Enums"]["background_job_status"]
          trace_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "background_jobs_customer_job_id_fkey"
            columns: ["customer_job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "background_jobs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "background_jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          access_level: Database["public"]["Enums"]["access_level"]
          conversation_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          job_id: string
          org_id: string
          project_id: string
          revoked_at: string | null
          status: Database["public"]["Enums"]["invitation_status"]
          token_hash: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          access_level?: Database["public"]["Enums"]["access_level"]
          conversation_id: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by?: string | null
          job_id: string
          org_id: string
          project_id: string
          revoked_at?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
          token_hash: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          access_level?: Database["public"]["Enums"]["access_level"]
          conversation_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          job_id?: string
          org_id?: string
          project_id?: string
          revoked_at?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
          token_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_invitations_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_invitations_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_invitations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_invitations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_invitations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_members: {
        Row: {
          access_level: Database["public"]["Enums"]["access_level"]
          added_by: string | null
          conversation_id: string
          created_at: string
          id: string
          job_id: string
          org_id: string
          project_id: string
          subject_id: string
          subject_type: Database["public"]["Enums"]["subject_type"]
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["access_level"]
          added_by?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          job_id: string
          org_id: string
          project_id: string
          subject_id: string
          subject_type: Database["public"]["Enums"]["subject_type"]
        }
        Update: {
          access_level?: Database["public"]["Enums"]["access_level"]
          added_by?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          job_id?: string
          org_id?: string
          project_id?: string
          subject_id?: string
          subject_type?: Database["public"]["Enums"]["subject_type"]
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_members_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_memory: {
        Row: {
          confidence: number
          conversation_id: string
          created_at: string
          expires_at: string | null
          id: string
          key: string
          org_id: string
          source_message_id: string | null
          updated_at: string
          value: Json
        }
        Insert: {
          confidence?: number
          conversation_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          key: string
          org_id: string
          source_message_id?: string | null
          updated_at?: string
          value: Json
        }
        Update: {
          confidence?: number
          conversation_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          key?: string
          org_id?: string
          source_message_id?: string | null
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "conversation_memory_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_memory_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_memory_source_message_id_fkey"
            columns: ["source_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_summaries: {
        Row: {
          conversation_id: string
          covered_message_from: string | null
          covered_message_to: string | null
          created_at: string
          id: string
          org_id: string
          scope_id: string | null
          scope_type: string
          summary: string
          token_count: number
        }
        Insert: {
          conversation_id: string
          covered_message_from?: string | null
          covered_message_to?: string | null
          created_at?: string
          id?: string
          org_id: string
          scope_id?: string | null
          scope_type?: string
          summary: string
          token_count: number
        }
        Update: {
          conversation_id?: string
          covered_message_from?: string | null
          covered_message_to?: string | null
          created_at?: string
          id?: string
          org_id?: string
          scope_id?: string | null
          scope_type?: string
          summary?: string
          token_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "conversation_summaries_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_summaries_covered_message_from_fkey"
            columns: ["covered_message_from"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_summaries_covered_message_to_fkey"
            columns: ["covered_message_to"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_summaries_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_user_state: {
        Row: {
          archived_at: string | null
          conversation_id: string
          created_at: string
          job_id: string
          last_read_at: string | null
          last_read_message_id: string | null
          last_seen_at: string | null
          muted_at: string | null
          org_id: string
          pinned_at: string | null
          project_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          conversation_id: string
          created_at?: string
          job_id: string
          last_read_at?: string | null
          last_read_message_id?: string | null
          last_seen_at?: string | null
          muted_at?: string | null
          org_id: string
          pinned_at?: string | null
          project_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          conversation_id?: string
          created_at?: string
          job_id?: string
          last_read_at?: string | null
          last_read_message_id?: string | null
          last_seen_at?: string | null
          muted_at?: string | null
          org_id?: string
          pinned_at?: string | null
          project_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_user_state_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_user_state_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_user_state_last_read_message_id_fkey"
            columns: ["last_read_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_user_state_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_user_state_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_user_state_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          job_id: string
          metadata: Json
          org_id: string
          primary_agent_id: string | null
          priority: Database["public"]["Enums"]["conversation_priority"]
          project_id: string
          status: Database["public"]["Enums"]["conversation_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          job_id: string
          metadata?: Json
          org_id: string
          primary_agent_id?: string | null
          priority?: Database["public"]["Enums"]["conversation_priority"]
          project_id: string
          status?: Database["public"]["Enums"]["conversation_status"]
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          job_id?: string
          metadata?: Json
          org_id?: string
          primary_agent_id?: string | null
          priority?: Database["public"]["Enums"]["conversation_priority"]
          project_id?: string
          status?: Database["public"]["Enums"]["conversation_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_primary_agent_id_fkey"
            columns: ["primary_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      document_acl: {
        Row: {
          created_at: string
          created_by: string | null
          document_id: string
          id: string
          org_id: string
          permission: string
          project_id: string | null
          subject_id: string
          subject_type: Database["public"]["Enums"]["subject_type"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          document_id: string
          id?: string
          org_id: string
          permission: string
          project_id?: string | null
          subject_id: string
          subject_type: Database["public"]["Enums"]["subject_type"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          document_id?: string
          id?: string
          org_id?: string
          permission?: string
          project_id?: string | null
          subject_id?: string
          subject_type?: Database["public"]["Enums"]["subject_type"]
        }
        Relationships: [
          {
            foreignKeyName: "document_acl_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_acl_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_acl_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_acl_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      document_chunk_sources: {
        Row: {
          bounding_box: Json | null
          chunk_id: string
          created_at: string
          id: string
          org_id: string
          page_number: number | null
          section_title: string | null
        }
        Insert: {
          bounding_box?: Json | null
          chunk_id: string
          created_at?: string
          id?: string
          org_id: string
          page_number?: number | null
          section_title?: string | null
        }
        Update: {
          bounding_box?: Json | null
          chunk_id?: string
          created_at?: string
          id?: string
          org_id?: string
          page_number?: number | null
          section_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_chunk_sources_chunk_id_fkey"
            columns: ["chunk_id"]
            isOneToOne: false
            referencedRelation: "document_chunks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_chunk_sources_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      document_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          deleted_at: string | null
          document_id: string
          embedding: string | null
          embedding_model: string | null
          embedding_version: string | null
          id: string
          metadata: Json
          org_id: string
          project_id: string | null
          token_count: number
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string
          deleted_at?: string | null
          document_id: string
          embedding?: string | null
          embedding_model?: string | null
          embedding_version?: string | null
          id?: string
          metadata?: Json
          org_id: string
          project_id?: string | null
          token_count: number
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          deleted_at?: string | null
          document_id?: string
          embedding?: string | null
          embedding_model?: string | null
          embedding_version?: string | null
          id?: string
          metadata?: Json
          org_id?: string
          project_id?: string | null
          token_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_chunks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_chunks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          checksum: string | null
          conversation_id: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          extraction_metadata: Json
          hard_deleted_at: string | null
          id: string
          ingestion_attempts: number
          ingestion_error: Json | null
          ingestion_last_failed_at: string | null
          ingestion_max_attempts: number
          ingestion_next_retry_at: string | null
          job_id: string | null
          mime_type: string
          name: string
          org_id: string
          owner_id: string | null
          project_id: string | null
          restore_until: string | null
          scope: Database["public"]["Enums"]["document_scope"]
          sensitivity: string
          size_bytes: number
          status: Database["public"]["Enums"]["document_status"]
          storage_bucket: string
          storage_path: string
          updated_at: string
          vault_folder_id: string | null
        }
        Insert: {
          checksum?: string | null
          conversation_id?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          extraction_metadata?: Json
          hard_deleted_at?: string | null
          id?: string
          ingestion_attempts?: number
          ingestion_error?: Json | null
          ingestion_last_failed_at?: string | null
          ingestion_max_attempts?: number
          ingestion_next_retry_at?: string | null
          job_id?: string | null
          mime_type: string
          name: string
          org_id: string
          owner_id?: string | null
          project_id?: string | null
          restore_until?: string | null
          scope: Database["public"]["Enums"]["document_scope"]
          sensitivity?: string
          size_bytes: number
          status?: Database["public"]["Enums"]["document_status"]
          storage_bucket: string
          storage_path: string
          updated_at?: string
          vault_folder_id?: string | null
        }
        Update: {
          checksum?: string | null
          conversation_id?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          extraction_metadata?: Json
          hard_deleted_at?: string | null
          id?: string
          ingestion_attempts?: number
          ingestion_error?: Json | null
          ingestion_last_failed_at?: string | null
          ingestion_max_attempts?: number
          ingestion_next_retry_at?: string | null
          job_id?: string | null
          mime_type?: string
          name?: string
          org_id?: string
          owner_id?: string | null
          project_id?: string | null
          restore_until?: string | null
          scope?: Database["public"]["Enums"]["document_scope"]
          sensitivity?: string
          size_bytes?: number
          status?: Database["public"]["Enums"]["document_status"]
          storage_bucket?: string
          storage_path?: string
          updated_at?: string
          vault_folder_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_vault_folder_id_fkey"
            columns: ["vault_folder_id"]
            isOneToOne: false
            referencedRelation: "vault_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      external_resource_grants: {
        Row: {
          action: string
          connection_id: string
          created_at: string
          created_by: string | null
          display_name: string | null
          external_resource_id: string
          granted_to_id: string
          granted_to_type: string
          id: string
          org_id: string
          provider: string
          resource_type: string
        }
        Insert: {
          action: string
          connection_id: string
          created_at?: string
          created_by?: string | null
          display_name?: string | null
          external_resource_id: string
          granted_to_id: string
          granted_to_type: string
          id?: string
          org_id: string
          provider: string
          resource_type: string
        }
        Update: {
          action?: string
          connection_id?: string
          created_at?: string
          created_by?: string | null
          display_name?: string | null
          external_resource_id?: string
          granted_to_id?: string
          granted_to_type?: string
          id?: string
          org_id?: string
          provider?: string
          resource_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_resource_grants_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "integration_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_resource_grants_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_resource_grants_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      form_fields: {
        Row: {
          ai_hint: string | null
          ai_hint_quality_score: number | null
          ai_hint_validated_at: string | null
          ai_hint_validation: Json | null
          created_at: string
          description: string | null
          field_type: string
          form_id: string
          id: string
          key: string
          label: string
          options: Json
          org_id: string
          position: number
          required: boolean
          updated_at: string
          validation: Json
        }
        Insert: {
          ai_hint?: string | null
          ai_hint_quality_score?: number | null
          ai_hint_validated_at?: string | null
          ai_hint_validation?: Json | null
          created_at?: string
          description?: string | null
          field_type: string
          form_id: string
          id?: string
          key: string
          label: string
          options?: Json
          org_id: string
          position?: number
          required?: boolean
          updated_at?: string
          validation?: Json
        }
        Update: {
          ai_hint?: string | null
          ai_hint_quality_score?: number | null
          ai_hint_validated_at?: string | null
          ai_hint_validation?: Json | null
          created_at?: string
          description?: string | null
          field_type?: string
          form_id?: string
          id?: string
          key?: string
          label?: string
          options?: Json
          org_id?: string
          position?: number
          required?: boolean
          updated_at?: string
          validation?: Json
        }
        Relationships: [
          {
            foreignKeyName: "form_fields_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_fields_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      form_response_values: {
        Row: {
          confidence: number | null
          document_id: string | null
          field_id: string
          filled_by: string
          id: string
          org_id: string
          response_id: string
          source: Json | null
          updated_at: string
          value: Json
        }
        Insert: {
          confidence?: number | null
          document_id?: string | null
          field_id: string
          filled_by: string
          id?: string
          org_id: string
          response_id: string
          source?: Json | null
          updated_at?: string
          value?: Json
        }
        Update: {
          confidence?: number | null
          document_id?: string | null
          field_id?: string
          filled_by?: string
          id?: string
          org_id?: string
          response_id?: string
          source?: Json | null
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "form_response_values_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_response_values_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "form_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_response_values_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_response_values_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "form_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      form_responses: {
        Row: {
          created_at: string
          form_id: string
          id: string
          org_id: string
          respondent_email: string | null
          respondent_profile_id: string | null
          session_id: string | null
          status: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          form_id: string
          id?: string
          org_id: string
          respondent_email?: string | null
          respondent_profile_id?: string | null
          session_id?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          form_id?: string
          id?: string
          org_id?: string
          respondent_email?: string | null
          respondent_profile_id?: string | null
          session_id?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_responses_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_responses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_responses_respondent_profile_id_fkey"
            columns: ["respondent_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      form_session_events: {
        Row: {
          content: Json
          created_at: string
          event_type: string
          form_id: string
          id: string
          org_id: string
          response_id: string
          session_id: string
        }
        Insert: {
          content?: Json
          created_at?: string
          event_type: string
          form_id: string
          id?: string
          org_id: string
          response_id: string
          session_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          event_type?: string
          form_id?: string
          id?: string
          org_id?: string
          response_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_session_events_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_session_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_session_events_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "form_responses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_session_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "form_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      form_sessions: {
        Row: {
          agent_invocation_id: string | null
          created_at: string
          expires_at: string
          form_id: string
          id: string
          org_id: string
          response_id: string
          status: string
          updated_at: string
        }
        Insert: {
          agent_invocation_id?: string | null
          created_at?: string
          expires_at: string
          form_id: string
          id?: string
          org_id: string
          response_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          agent_invocation_id?: string | null
          created_at?: string
          expires_at?: string
          form_id?: string
          id?: string
          org_id?: string
          response_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_sessions_agent_invocation_id_fkey"
            columns: ["agent_invocation_id"]
            isOneToOne: false
            referencedRelation: "agent_invocations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_sessions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_sessions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_sessions_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "form_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      forms: {
        Row: {
          ai_validated_at: string | null
          ai_validation_summary: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          embed_token_hash: string | null
          id: string
          org_id: string
          published_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          ai_validated_at?: string | null
          ai_validation_summary?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          embed_token_hash?: string | null
          id?: string
          org_id: string
          published_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          ai_validated_at?: string | null
          ai_validation_summary?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          embed_token_hash?: string | null
          id?: string
          org_id?: string
          published_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forms_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          created_at: string
          group_id: string
          org_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          org_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          org_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_roles: {
        Row: {
          group_id: string
          org_id: string
          role_id: string
        }
        Insert: {
          group_id: string
          org_id: string
          role_id: string
        }
        Update: {
          group_id?: string
          org_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_roles_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_roles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          org_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          org_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_connections: {
        Row: {
          auth_type: string
          connected_by: string | null
          created_at: string
          granted_external_scopes: string[]
          id: string
          metadata: Json
          org_id: string
          provider: string
          status: string
          updated_at: string
        }
        Insert: {
          auth_type: string
          connected_by?: string | null
          created_at?: string
          granted_external_scopes?: string[]
          id?: string
          metadata?: Json
          org_id: string
          provider: string
          status?: string
          updated_at?: string
        }
        Update: {
          auth_type?: string
          connected_by?: string | null
          created_at?: string
          granted_external_scopes?: string[]
          id?: string
          metadata?: Json
          org_id?: string
          provider?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_connections_connected_by_fkey"
            columns: ["connected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_connections_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_credentials: {
        Row: {
          algorithm: string
          connection_id: string
          created_at: string
          credential_type: string
          encrypted_secret: string
          encryption_key_id: string
          expires_at: string | null
          id: string
          nonce: string
          org_id: string
          status: string
          updated_at: string
        }
        Insert: {
          algorithm?: string
          connection_id: string
          created_at?: string
          credential_type: string
          encrypted_secret: string
          encryption_key_id: string
          expires_at?: string | null
          id?: string
          nonce: string
          org_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          algorithm?: string
          connection_id?: string
          created_at?: string
          credential_type?: string
          encrypted_secret?: string
          encryption_key_id?: string
          expires_at?: string | null
          id?: string
          nonce?: string
          org_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_credentials_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "integration_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_credentials_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      job_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          access_level: Database["public"]["Enums"]["access_level"]
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          job_id: string
          org_id: string
          project_id: string
          revoked_at: string | null
          status: Database["public"]["Enums"]["invitation_status"]
          token_hash: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          access_level?: Database["public"]["Enums"]["access_level"]
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by?: string | null
          job_id: string
          org_id: string
          project_id: string
          revoked_at?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
          token_hash: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          access_level?: Database["public"]["Enums"]["access_level"]
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          job_id?: string
          org_id?: string
          project_id?: string
          revoked_at?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
          token_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_invitations_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_invitations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_invitations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_invitations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      job_members: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          job_id: string
          member_kind: string
          org_id: string
          project_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          job_id: string
          member_kind: string
          org_id: string
          project_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          job_id?: string
          member_kind?: string
          org_id?: string
          project_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_members_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          created_at: string
          created_by: string | null
          customer_profile_id: string
          external_ref: string | null
          id: string
          metadata: Json
          org_id: string
          project_id: string
          status: Database["public"]["Enums"]["customer_job_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_profile_id: string
          external_ref?: string | null
          id?: string
          metadata?: Json
          org_id: string
          project_id: string
          status?: Database["public"]["Enums"]["customer_job_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_profile_id?: string
          external_ref?: string | null
          id?: string
          metadata?: Json
          org_id?: string
          project_id?: string
          status?: Database["public"]["Enums"]["customer_job_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_hub_items: {
        Row: {
          added_by: string | null
          created_at: string
          document_id: string | null
          folder_id: string | null
          id: string
          item_type: string
          knowledge_hub_id: string
          org_id: string
          project_id: string | null
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          document_id?: string | null
          folder_id?: string | null
          id?: string
          item_type: string
          knowledge_hub_id: string
          org_id: string
          project_id?: string | null
        }
        Update: {
          added_by?: string | null
          created_at?: string
          document_id?: string | null
          folder_id?: string | null
          id?: string
          item_type?: string
          knowledge_hub_id?: string
          org_id?: string
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_hub_items_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_hub_items_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_hub_items_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "vault_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_hub_items_knowledge_hub_id_fkey"
            columns: ["knowledge_hub_id"]
            isOneToOne: false
            referencedRelation: "knowledge_hubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_hub_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_hub_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_hubs: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          hard_deleted_at: string | null
          id: string
          name: string
          org_id: string
          project_id: string | null
          restore_until: string | null
          status: Database["public"]["Enums"]["vault_resource_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          hard_deleted_at?: string | null
          id?: string
          name: string
          org_id: string
          project_id?: string | null
          restore_until?: string | null
          status?: Database["public"]["Enums"]["vault_resource_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          hard_deleted_at?: string | null
          id?: string
          name?: string
          org_id?: string
          project_id?: string | null
          restore_until?: string | null
          status?: Database["public"]["Enums"]["vault_resource_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_hubs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_hubs_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_hubs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_hubs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      member_roles: {
        Row: {
          assigned_by: string | null
          created_at: string
          org_id: string
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          org_id: string
          role_id: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          org_id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_roles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_items: {
        Row: {
          confidence: number
          created_at: string
          expires_at: string | null
          id: string
          key: string
          org_id: string
          scope_id: string
          scope_type: string
          source_message_id: string | null
          updated_at: string
          value: Json
        }
        Insert: {
          confidence?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          key: string
          org_id: string
          scope_id: string
          scope_type: string
          source_message_id?: string | null
          updated_at?: string
          value: Json
        }
        Update: {
          confidence?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          key?: string
          org_id?: string
          scope_id?: string
          scope_type?: string
          source_message_id?: string | null
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "memory_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_items_source_message_id_fkey"
            columns: ["source_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_attachments: {
        Row: {
          access_scope: string
          conversation_id: string
          created_at: string
          document_id: string
          id: string
          message_id: string
          org_id: string
        }
        Insert: {
          access_scope?: string
          conversation_id: string
          created_at?: string
          document_id: string
          id?: string
          message_id: string
          org_id: string
        }
        Update: {
          access_scope?: string
          conversation_id?: string
          created_at?: string
          document_id?: string
          id?: string
          message_id?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_attachments_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_attachments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_attachments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      message_mentions: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          job_id: string
          mention_text: string
          message_id: string
          org_id: string
          project_id: string
          target_id: string
          target_type: Database["public"]["Enums"]["subject_type"]
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          job_id: string
          mention_text: string
          message_id: string
          org_id: string
          project_id: string
          target_id: string
          target_type: Database["public"]["Enums"]["subject_type"]
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          job_id?: string
          mention_text?: string
          message_id?: string
          org_id?: string
          project_id?: string
          target_id?: string
          target_type?: Database["public"]["Enums"]["subject_type"]
        }
        Relationships: [
          {
            foreignKeyName: "message_mentions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_mentions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_mentions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_mentions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_mentions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string | null
          client_message_id: string | null
          content: Json
          conversation_id: string
          created_at: string
          id: string
          job_id: string
          org_id: string
          parent_message_id: string | null
          project_id: string
          sender_id: string | null
          sender_type: Database["public"]["Enums"]["sender_type"]
          status: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          client_message_id?: string | null
          content?: Json
          conversation_id: string
          created_at?: string
          id?: string
          job_id: string
          org_id: string
          parent_message_id?: string | null
          project_id: string
          sender_id?: string | null
          sender_type: Database["public"]["Enums"]["sender_type"]
          status?: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          client_message_id?: string | null
          content?: Json
          conversation_id?: string
          created_at?: string
          id?: string
          job_id?: string
          org_id?: string
          parent_message_id?: string | null
          project_id?: string
          sender_id?: string | null
          sender_type?: Database["public"]["Enums"]["sender_type"]
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          initial_role_keys: string[]
          invited_by: string | null
          member_type: Database["public"]["Enums"]["member_type"]
          org_id: string
          revoked_at: string | null
          status: Database["public"]["Enums"]["invitation_status"]
          token_hash: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          initial_role_keys?: string[]
          invited_by?: string | null
          member_type?: Database["public"]["Enums"]["member_type"]
          org_id: string
          revoked_at?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
          token_hash: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          initial_role_keys?: string[]
          invited_by?: string | null
          member_type?: Database["public"]["Enums"]["member_type"]
          org_id?: string
          revoked_at?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
          token_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invitations_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invitations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          member_type: Database["public"]["Enums"]["member_type"]
          org_id: string
          status: Database["public"]["Enums"]["member_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          member_type?: Database["public"]["Enums"]["member_type"]
          org_id: string
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          member_type?: Database["public"]["Enums"]["member_type"]
          org_id?: string
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string | null
          data_region: string
          default_locale: string
          id: string
          name: string
          plan: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_region?: string
          default_locale?: string
          id?: string
          name: string
          plan?: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_region?: string
          default_locale?: string
          id?: string
          name?: string
          plan?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          description: string
          key: string
        }
        Insert: {
          description: string
          key: string
        }
        Update: {
          description?: string
          key?: string
        }
        Relationships: []
      }
      plugin_data_records: {
        Row: {
          collection_key: string
          created_at: string
          created_by: string | null
          data: Json
          id: string
          installation_id: string
          org_id: string
          owner_subject_id: string | null
          owner_subject_type: string
          plugin_id: string
          record_key: string
          search_text: string | null
          updated_at: string
          visibility: string
        }
        Insert: {
          collection_key: string
          created_at?: string
          created_by?: string | null
          data?: Json
          id?: string
          installation_id: string
          org_id: string
          owner_subject_id?: string | null
          owner_subject_type: string
          plugin_id: string
          record_key: string
          search_text?: string | null
          updated_at?: string
          visibility?: string
        }
        Update: {
          collection_key?: string
          created_at?: string
          created_by?: string | null
          data?: Json
          id?: string
          installation_id?: string
          org_id?: string
          owner_subject_id?: string | null
          owner_subject_type?: string
          plugin_id?: string
          record_key?: string
          search_text?: string | null
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "plugin_data_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plugin_data_records_installation_id_fkey"
            columns: ["installation_id"]
            isOneToOne: false
            referencedRelation: "plugin_installations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plugin_data_records_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plugin_data_records_plugin_id_fkey"
            columns: ["plugin_id"]
            isOneToOne: false
            referencedRelation: "plugins"
            referencedColumns: ["id"]
          },
        ]
      }
      plugin_installations: {
        Row: {
          config: Json
          id: string
          installed_at: string
          installed_by: string | null
          org_id: string
          plugin_id: string
          status: string
          updated_at: string
        }
        Insert: {
          config?: Json
          id?: string
          installed_at?: string
          installed_by?: string | null
          org_id: string
          plugin_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          config?: Json
          id?: string
          installed_at?: string
          installed_by?: string | null
          org_id?: string
          plugin_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plugin_installations_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plugin_installations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plugin_installations_plugin_id_fkey"
            columns: ["plugin_id"]
            isOneToOne: false
            referencedRelation: "plugins"
            referencedColumns: ["id"]
          },
        ]
      }
      plugin_ui_panels: {
        Row: {
          allowed_origins: string[]
          created_at: string
          id: string
          iframe_url: string
          key: string
          name: string
          org_id: string | null
          placement: string
          plugin_id: string
          required_permissions: string[]
          status: string
          updated_at: string
        }
        Insert: {
          allowed_origins?: string[]
          created_at?: string
          id?: string
          iframe_url: string
          key: string
          name: string
          org_id?: string | null
          placement: string
          plugin_id: string
          required_permissions?: string[]
          status?: string
          updated_at?: string
        }
        Update: {
          allowed_origins?: string[]
          created_at?: string
          id?: string
          iframe_url?: string
          key?: string
          name?: string
          org_id?: string | null
          placement?: string
          plugin_id?: string
          required_permissions?: string[]
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plugin_ui_panels_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plugin_ui_panels_plugin_id_fkey"
            columns: ["plugin_id"]
            isOneToOne: false
            referencedRelation: "plugins"
            referencedColumns: ["id"]
          },
        ]
      }
      plugins: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          metadata: Json
          name: string
          publisher_name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          metadata?: Json
          name: string
          publisher_name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          metadata?: Json
          name?: string
          publisher_name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          auth_user_id: string
          avatar_url: string | null
          created_at: string
          display_name: string
          email: string
          id: string
          timezone: string | null
          updated_at: string
        }
        Insert: {
          auth_user_id: string
          avatar_url?: string | null
          created_at?: string
          display_name: string
          email: string
          id?: string
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          auth_user_id?: string
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_agents: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          org_id: string
          project_id: string
          visibility: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          org_id: string
          project_id: string
          visibility?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          org_id?: string
          project_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_agents_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_agents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_agents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          org_id: string
          project_id: string
          project_role: Database["public"]["Enums"]["project_member_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          org_id: string
          project_id: string
          project_role?: Database["public"]["Enums"]["project_member_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          org_id?: string
          project_id?: string
          project_role?: Database["public"]["Enums"]["project_member_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          key: string
          name: string
          org_id: string
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          key: string
          name: string
          org_id: string
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          key?: string
          name?: string
          org_id?: string
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      retrieval_events: {
        Row: {
          agent_id: string | null
          candidate_chunk_ids: string[]
          conversation_id: string | null
          created_at: string
          filters: Json
          id: string
          latency_ms: number | null
          message_id: string | null
          org_id: string
          query: string
          request_id: string | null
          selected_chunk_ids: string[]
          trace_id: string | null
        }
        Insert: {
          agent_id?: string | null
          candidate_chunk_ids?: string[]
          conversation_id?: string | null
          created_at?: string
          filters?: Json
          id?: string
          latency_ms?: number | null
          message_id?: string | null
          org_id: string
          query: string
          request_id?: string | null
          selected_chunk_ids?: string[]
          trace_id?: string | null
        }
        Update: {
          agent_id?: string | null
          candidate_chunk_ids?: string[]
          conversation_id?: string | null
          created_at?: string
          filters?: Json
          id?: string
          latency_ms?: number | null
          message_id?: string | null
          org_id?: string
          query?: string
          request_id?: string | null
          selected_chunk_ids?: string[]
          trace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "retrieval_events_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retrieval_events_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retrieval_events_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retrieval_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          permission_key: string
          role_id: string
        }
        Insert: {
          permission_key: string
          role_id: string
        }
        Update: {
          permission_key?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          key: string
          name: string
          org_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          key: string
          name: string
          org_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          key?: string
          name?: string
          org_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      router_preferences: {
        Row: {
          agent_id: string | null
          created_at: string
          created_by: string | null
          id: string
          intent_key: string
          mode: string
          org_id: string
          subject_id: string | null
          subject_type: string
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          intent_key: string
          mode: string
          org_id: string
          subject_id?: string | null
          subject_type: string
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          intent_key?: string
          mode?: string
          org_id?: string
          subject_id?: string | null
          subject_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "router_preferences_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "router_preferences_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "router_preferences_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subject_permission_grants: {
        Row: {
          created_at: string
          expires_at: string | null
          granted_by: string | null
          org_id: string
          permission_key: string
          reason: string | null
          subject_id: string
          subject_type: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          granted_by?: string | null
          org_id: string
          permission_key: string
          reason?: string | null
          subject_id: string
          subject_type: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          granted_by?: string | null
          org_id?: string
          permission_key?: string
          reason?: string | null
          subject_id?: string
          subject_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "subject_permission_grants_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subject_permission_grants_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subject_permission_grants_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["key"]
          },
        ]
      }
      support_handoff_notifications: {
        Row: {
          channel: string
          created_at: string
          error: Json | null
          handoff_id: string
          id: string
          org_id: string
          provider: string
          provider_message_id: string | null
          recipient: string
          request_id: string | null
          sent_at: string | null
          status: string
          trace_id: string | null
        }
        Insert: {
          channel: string
          created_at?: string
          error?: Json | null
          handoff_id: string
          id?: string
          org_id: string
          provider: string
          provider_message_id?: string | null
          recipient: string
          request_id?: string | null
          sent_at?: string | null
          status?: string
          trace_id?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          error?: Json | null
          handoff_id?: string
          id?: string
          org_id?: string
          provider?: string
          provider_message_id?: string | null
          recipient?: string
          request_id?: string | null
          sent_at?: string | null
          status?: string
          trace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_handoff_notifications_handoff_id_fkey"
            columns: ["handoff_id"]
            isOneToOne: false
            referencedRelation: "support_handoffs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_handoff_notifications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      support_handoffs: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          conversation_id: string
          created_at: string
          id: string
          job_id: string
          notified_at: string | null
          org_id: string
          project_id: string
          reason: string | null
          requested_by: string | null
          resolved_at: string | null
          status: string
          summary: string | null
          target_id: string | null
          target_type: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          job_id: string
          notified_at?: string | null
          org_id: string
          project_id: string
          reason?: string | null
          requested_by?: string | null
          resolved_at?: string | null
          status?: string
          summary?: string | null
          target_id?: string | null
          target_type: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          job_id?: string
          notified_at?: string | null
          org_id?: string
          project_id?: string
          reason?: string | null
          requested_by?: string | null
          resolved_at?: string | null
          status?: string
          summary?: string | null
          target_id?: string | null
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_handoffs_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_handoffs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_handoffs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_handoffs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_handoffs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_handoffs_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_checklist_items: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          due_at: string | null
          id: string
          label: string
          org_id: string
          position: number
          status: Database["public"]["Enums"]["task_checklist_item_status"]
          task_id: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          due_at?: string | null
          id?: string
          label: string
          org_id: string
          position?: number
          status?: Database["public"]["Enums"]["task_checklist_item_status"]
          task_id: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          due_at?: string | null
          id?: string
          label?: string
          org_id?: string
          position?: number
          status?: Database["public"]["Enums"]["task_checklist_item_status"]
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_checklist_items_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_checklist_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_checklist_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_checklist_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          conversation_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_at: string | null
          id: string
          org_id: string
          progress: number
          reminder_offset_minutes: number
          reminder_sent_at: string | null
          source_message_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          conversation_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          org_id: string
          progress?: number
          reminder_offset_minutes?: number
          reminder_sent_at?: string | null
          source_message_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          conversation_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          org_id?: string
          progress?: number
          reminder_offset_minutes?: number
          reminder_sent_at?: string | null
          source_message_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_source_message_id_fkey"
            columns: ["source_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_invocations: {
        Row: {
          agent_id: string | null
          agent_invocation_id: string | null
          completed_at: string | null
          conversation_id: string | null
          created_at: string
          error: Json | null
          error_class: string | null
          id: string
          input: Json
          latency_ms: number | null
          message_id: string | null
          org_id: string
          output: Json | null
          request_id: string | null
          retry_count: number
          status: Database["public"]["Enums"]["invocation_status"]
          tool_id: string | null
          trace_id: string | null
        }
        Insert: {
          agent_id?: string | null
          agent_invocation_id?: string | null
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string
          error?: Json | null
          error_class?: string | null
          id?: string
          input?: Json
          latency_ms?: number | null
          message_id?: string | null
          org_id: string
          output?: Json | null
          request_id?: string | null
          retry_count?: number
          status?: Database["public"]["Enums"]["invocation_status"]
          tool_id?: string | null
          trace_id?: string | null
        }
        Update: {
          agent_id?: string | null
          agent_invocation_id?: string | null
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string
          error?: Json | null
          error_class?: string | null
          id?: string
          input?: Json
          latency_ms?: number | null
          message_id?: string | null
          org_id?: string
          output?: Json | null
          request_id?: string | null
          retry_count?: number
          status?: Database["public"]["Enums"]["invocation_status"]
          tool_id?: string | null
          trace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tool_invocations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_invocations_agent_invocation_id_fkey"
            columns: ["agent_invocation_id"]
            isOneToOne: false
            referencedRelation: "agent_invocations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_invocations_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_invocations_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_invocations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_invocations_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      tools: {
        Row: {
          auth_policy: Json
          created_at: string
          description: string
          id: string
          key: string
          name: string
          org_id: string | null
          plugin_id: string | null
          project_id: string | null
          required_external_scopes: string[]
          required_platform_capabilities: string[]
          resource_scope_requirements: Json
          risk_level: Database["public"]["Enums"]["tool_risk_level"]
          schema: Json
          type: string
        }
        Insert: {
          auth_policy?: Json
          created_at?: string
          description: string
          id?: string
          key: string
          name: string
          org_id?: string | null
          plugin_id?: string | null
          project_id?: string | null
          required_external_scopes?: string[]
          required_platform_capabilities?: string[]
          resource_scope_requirements?: Json
          risk_level?: Database["public"]["Enums"]["tool_risk_level"]
          schema: Json
          type: string
        }
        Update: {
          auth_policy?: Json
          created_at?: string
          description?: string
          id?: string
          key?: string
          name?: string
          org_id?: string | null
          plugin_id?: string | null
          project_id?: string | null
          required_external_scopes?: string[]
          required_platform_capabilities?: string[]
          resource_scope_requirements?: Json
          risk_level?: Database["public"]["Enums"]["tool_risk_level"]
          schema?: Json
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "tools_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tools_plugin_id_fk"
            columns: ["plugin_id"]
            isOneToOne: false
            referencedRelation: "plugins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tools_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_folders: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          hard_deleted_at: string | null
          id: string
          name: string
          org_id: string
          parent_folder_id: string | null
          project_id: string | null
          restore_until: string | null
          status: Database["public"]["Enums"]["vault_resource_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          hard_deleted_at?: string | null
          id?: string
          name: string
          org_id: string
          parent_folder_id?: string | null
          project_id?: string | null
          restore_until?: string | null
          status?: Database["public"]["Enums"]["vault_resource_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          hard_deleted_at?: string | null
          id?: string
          name?: string
          org_id?: string
          parent_folder_id?: string | null
          project_id?: string | null
          restore_until?: string | null
          status?: Database["public"]["Enums"]["vault_resource_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_folders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_folders_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_folders_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_folders_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "vault_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_folders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_conversation: {
        Args: { p_conversation_id: string }
        Returns: boolean
      }
      can_access_document: { Args: { p_document_id: string }; Returns: boolean }
      can_edit_conversation: {
        Args: { p_conversation_id: string }
        Returns: boolean
      }
      can_invoke_agent_in_conversation: {
        Args: { p_agent_id: string; p_conversation_id: string }
        Returns: boolean
      }
      can_start_conversation_with_agent: {
        Args: { p_agent_id: string }
        Returns: boolean
      }
      can_upload_document: {
        Args: {
          p_conversation_id: string
          p_job_id: string
          p_org_id: string
          p_owner_id: string
          p_project_id: string
          p_scope: Database["public"]["Enums"]["document_scope"]
        }
        Returns: boolean
      }
      current_profile: {
        Args: never
        Returns: {
          auth_user_id: string
          avatar_url: string | null
          created_at: string
          display_name: string
          email: string
          id: string
          timezone: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_profile_id: { Args: never; Returns: string }
      dearmor: { Args: { "": string }; Returns: string }
      ensure_default_domain_agent_for_project: {
        Args: { p_project_id: string }
        Returns: string
      }
      gen_random_uuid: { Args: never; Returns: string }
      gen_salt: { Args: { "": string }; Returns: string }
      has_agent_member_access: {
        Args: {
          p_agent_id: string
          p_required_access: Database["public"]["Enums"]["agent_member_access"][]
        }
        Returns: boolean
      }
      has_org_permission: {
        Args: { p_org_id: string; p_permission_key: string }
        Returns: boolean
      }
      is_active_internal_member: {
        Args: { p_org_id: string }
        Returns: boolean
      }
      is_conversation_member: {
        Args: { p_conversation_id: string }
        Returns: boolean
      }
      is_customer_job_member: { Args: { p_job_id: string }; Returns: boolean }
      is_internal_job_member: { Args: { p_job_id: string }; Returns: boolean }
      is_job_member: { Args: { p_job_id: string }; Returns: boolean }
      is_org_member: {
        Args: { p_member_type?: string; p_org_id: string }
        Returns: boolean
      }
      is_org_owner: { Args: { p_org_id: string }; Returns: boolean }
      is_project_member: { Args: { p_project_id: string }; Returns: boolean }
      pgp_armor_headers: {
        Args: { "": string }
        Returns: Record<string, unknown>[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      uuid_generate_v1: { Args: never; Returns: string }
      uuid_generate_v1mc: { Args: never; Returns: string }
      uuid_generate_v3: {
        Args: { name: string; namespace: string }
        Returns: string
      }
      uuid_generate_v4: { Args: never; Returns: string }
      uuid_generate_v5: {
        Args: { name: string; namespace: string }
        Returns: string
      }
      uuid_nil: { Args: never; Returns: string }
      uuid_ns_dns: { Args: never; Returns: string }
      uuid_ns_oid: { Args: never; Returns: string }
      uuid_ns_url: { Args: never; Returns: string }
      uuid_ns_x500: { Args: never; Returns: string }
    }
    Enums: {
      access_level: "viewer" | "editor"
      agent_member_access: "viewer" | "invoker" | "manager"
      agent_status: "draft" | "active" | "disabled" | "archived"
      agent_version_status: "draft" | "active" | "archived"
      background_job_status:
        | "queued"
        | "running"
        | "completed"
        | "failed"
        | "dead_letter"
        | "canceled"
      conversation_priority: "low" | "normal" | "high" | "urgent"
      conversation_status: "open" | "waiting" | "resolved" | "archived"
      customer_job_status: "open" | "closed" | "archived"
      document_scope: "org" | "group" | "agent" | "conversation" | "private"
      document_status:
        | "upload_pending"
        | "uploaded"
        | "extracting"
        | "chunking"
        | "embedding"
        | "indexed"
        | "failed"
        | "deleted"
      invitation_status: "pending" | "accepted" | "revoked" | "expired"
      invocation_status:
        | "queued"
        | "running"
        | "completed"
        | "failed"
        | "canceled"
        | "requires_approval"
      member_status: "invited" | "active" | "suspended" | "removed"
      member_type: "internal" | "service"
      project_member_role: "owner" | "admin" | "member"
      project_status: "active" | "archived"
      sender_type: "user" | "agent" | "router" | "system" | "tool"
      subject_type: "user" | "group" | "role" | "agent" | "conversation"
      task_checklist_item_status:
        | "todo"
        | "in_progress"
        | "blocked"
        | "done"
        | "skipped"
      task_status: "todo" | "in_progress" | "blocked" | "done" | "canceled"
      tool_risk_level: "low" | "medium" | "high"
      vault_resource_status: "active" | "trashed" | "deleted"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      access_level: ["viewer", "editor"],
      agent_member_access: ["viewer", "invoker", "manager"],
      agent_status: ["draft", "active", "disabled", "archived"],
      agent_version_status: ["draft", "active", "archived"],
      background_job_status: [
        "queued",
        "running",
        "completed",
        "failed",
        "dead_letter",
        "canceled",
      ],
      conversation_priority: ["low", "normal", "high", "urgent"],
      conversation_status: ["open", "waiting", "resolved", "archived"],
      customer_job_status: ["open", "closed", "archived"],
      document_scope: ["org", "group", "agent", "conversation", "private"],
      document_status: [
        "upload_pending",
        "uploaded",
        "extracting",
        "chunking",
        "embedding",
        "indexed",
        "failed",
        "deleted",
      ],
      invitation_status: ["pending", "accepted", "revoked", "expired"],
      invocation_status: [
        "queued",
        "running",
        "completed",
        "failed",
        "canceled",
        "requires_approval",
      ],
      member_status: ["invited", "active", "suspended", "removed"],
      member_type: ["internal", "service"],
      project_member_role: ["owner", "admin", "member"],
      project_status: ["active", "archived"],
      sender_type: ["user", "agent", "router", "system", "tool"],
      subject_type: ["user", "group", "role", "agent", "conversation"],
      task_checklist_item_status: [
        "todo",
        "in_progress",
        "blocked",
        "done",
        "skipped",
      ],
      task_status: ["todo", "in_progress", "blocked", "done", "canceled"],
      tool_risk_level: ["low", "medium", "high"],
      vault_resource_status: ["active", "trashed", "deleted"],
    },
  },
} as const

