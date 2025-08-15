export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      ai_insights: {
        Row: {
          action_required: string | null
          amount: string | null
          created_at: string | null
          description: string | null
          expires_at: string | null
          id: string
          insight_type: string
          is_acknowledged: boolean | null
          priority: Database["public"]["Enums"]["urgency_level"] | null
          related_document_ids: string[] | null
          savings_potential: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_required?: string | null
          amount?: string | null
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          insight_type: string
          is_acknowledged?: boolean | null
          priority?: Database["public"]["Enums"]["urgency_level"] | null
          related_document_ids?: string[] | null
          savings_potential?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_required?: string | null
          amount?: string | null
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          insight_type?: string
          is_acknowledged?: boolean | null
          priority?: Database["public"]["Enums"]["urgency_level"] | null
          related_document_ids?: string[] | null
          savings_potential?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          auto_rules: Json | null
          color: string | null
          created_at: string | null
          description: string | null
          document_count: number | null
          icon: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_rules?: Json | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          document_count?: number | null
          icon?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_rules?: Json | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          document_count?: number | null
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string | null
          id: string
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          conversation_id: string
          created_at: string | null
          id: string
          is_user_message: boolean | null
          message: string
          message_metadata: Json | null
          related_document_ids: string[] | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          id?: string
          is_user_message?: boolean | null
          message: string
          message_metadata?: Json | null
          related_document_ids?: string[] | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_user_message?: boolean | null
          message?: string
          message_metadata?: Json | null
          related_document_ids?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          comment_text: string
          created_at: string | null
          document_id: string
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comment_text: string
          created_at?: string | null
          document_id: string
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comment_text?: string
          created_at?: string | null
          document_id?: string
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_embeddings: {
        Row: {
          content_hash: string
          created_at: string | null
          document_id: string
          embedding_json: Json | null
          id: string
          model_version: string | null
        }
        Insert: {
          content_hash: string
          created_at?: string | null
          document_id: string
          embedding_json?: Json | null
          id?: string
          model_version?: string | null
        }
        Update: {
          content_hash?: string
          created_at?: string | null
          document_id?: string
          embedding_json?: Json | null
          id?: string
          model_version?: string | null
        }
        Relationships: []
      }
      document_relationships: {
        Row: {
          ai_detected: boolean | null
          confidence_score: number | null
          created_at: string | null
          document_id_1: string
          document_id_2: string
          id: string
          metadata: Json | null
          relationship_type: string
        }
        Insert: {
          ai_detected?: boolean | null
          confidence_score?: number | null
          created_at?: string | null
          document_id_1: string
          document_id_2: string
          id?: string
          metadata?: Json | null
          relationship_type: string
        }
        Update: {
          ai_detected?: boolean | null
          confidence_score?: number | null
          created_at?: string | null
          document_id_1?: string
          document_id_2?: string
          id?: string
          metadata?: Json | null
          relationship_type?: string
        }
        Relationships: []
      }
      document_shares: {
        Row: {
          access_count: number | null
          created_at: string | null
          document_id: string
          expires_at: string | null
          id: string
          is_public: boolean | null
          permission_level: string | null
          share_token: string | null
          shared_by: string
          shared_with_email: string | null
          shared_with_user_id: string | null
          updated_at: string | null
        }
        Insert: {
          access_count?: number | null
          created_at?: string | null
          document_id: string
          expires_at?: string | null
          id?: string
          is_public?: boolean | null
          permission_level?: string | null
          share_token?: string | null
          shared_by: string
          shared_with_email?: string | null
          shared_with_user_id?: string | null
          updated_at?: string | null
        }
        Update: {
          access_count?: number | null
          created_at?: string | null
          document_id?: string
          expires_at?: string | null
          id?: string
          is_public?: boolean | null
          permission_level?: string | null
          share_token?: string | null
          shared_by?: string
          shared_with_email?: string | null
          shared_with_user_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_shares_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_tags: {
        Row: {
          created_at: string | null
          document_id: string
          id: string
          is_ai_generated: boolean | null
          tag: string
        }
        Insert: {
          created_at?: string | null
          document_id: string
          id?: string
          is_ai_generated?: boolean | null
          tag: string
        }
        Update: {
          created_at?: string | null
          document_id?: string
          id?: string
          is_ai_generated?: boolean | null
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_tags_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          change_description: string | null
          created_at: string | null
          created_by: string
          document_id: string
          file_size: number | null
          file_url: string | null
          id: string
          version_number: number
        }
        Insert: {
          change_description?: string | null
          created_at?: string | null
          created_by: string
          document_id: string
          file_size?: number | null
          file_url?: string | null
          id?: string
          version_number?: number
        }
        Update: {
          change_description?: string | null
          created_at?: string | null
          created_by?: string
          document_id?: string
          file_size?: number | null
          file_url?: string | null
          id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          ai_confidence: number | null
          ai_summary: string | null
          ai_tags: string[] | null
          category: Database["public"]["Enums"]["document_category"] | null
          created_at: string | null
          download_url: string | null
          extracted_text: string | null
          file_type: string | null
          file_url: string | null
          id: string
          is_encrypted: boolean | null
          is_verified: boolean | null
          language_detected: string | null
          mime_type: string | null
          name: string
          ocr_confidence: number | null
          pages: number | null
          parent_document_id: string | null
          path: string | null
          shared_with_family: boolean | null
          size: number
          status: string | null
          storage_path: string | null
          tags: Json | null
          thumbnail_url: string | null
          updated_at: string | null
          upload_method: string | null
          user_id: string
          version: number | null
        }
        Insert: {
          ai_confidence?: number | null
          ai_summary?: string | null
          ai_tags?: string[] | null
          category?: Database["public"]["Enums"]["document_category"] | null
          created_at?: string | null
          download_url?: string | null
          extracted_text?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_encrypted?: boolean | null
          is_verified?: boolean | null
          language_detected?: string | null
          mime_type?: string | null
          name: string
          ocr_confidence?: number | null
          pages?: number | null
          parent_document_id?: string | null
          path?: string | null
          shared_with_family?: boolean | null
          size: number
          status?: string | null
          storage_path?: string | null
          tags?: Json | null
          thumbnail_url?: string | null
          updated_at?: string | null
          upload_method?: string | null
          user_id: string
          version?: number | null
        }
        Update: {
          ai_confidence?: number | null
          ai_summary?: string | null
          ai_tags?: string[] | null
          category?: Database["public"]["Enums"]["document_category"] | null
          created_at?: string | null
          download_url?: string | null
          extracted_text?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_encrypted?: boolean | null
          is_verified?: boolean | null
          language_detected?: string | null
          mime_type?: string | null
          name?: string
          ocr_confidence?: number | null
          pages?: number | null
          parent_document_id?: string | null
          path?: string | null
          shared_with_family?: boolean | null
          size?: number
          status?: string | null
          storage_path?: string | null
          tags?: Json | null
          thumbnail_url?: string | null
          updated_at?: string | null
          upload_method?: string | null
          user_id?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_parent_document_id_fkey"
            columns: ["parent_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_access: {
        Row: {
          access_duration_hours: number | null
          access_token: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          trusted_contact_email: string
          user_id: string
        }
        Insert: {
          access_duration_hours?: number | null
          access_token?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          trusted_contact_email: string
          user_id: string
        }
        Update: {
          access_duration_hours?: number | null
          access_token?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          trusted_contact_email?: string
          user_id?: string
        }
        Relationships: []
      }
      family_members: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          invited_by: string | null
          joined_at: string | null
          permissions: Json | null
          updated_at: string | null
          user_id: string | null
          vault_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          permissions?: Json | null
          updated_at?: string | null
          user_id?: string | null
          vault_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          permissions?: Json | null
          updated_at?: string | null
          user_id?: string | null
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "family_vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      family_vaults: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          owner_id: string
          storage_limit: number | null
          storage_used: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          owner_id: string
          storage_limit?: number | null
          storage_used?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          storage_limit?: number | null
          storage_used?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      integrations: {
        Row: {
          access_token: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          refresh_token: string | null
          service: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          refresh_token?: string | null
          service: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          refresh_token?: string | null
          service?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      professional_services: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          duration: string | null
          id: string
          is_active: boolean | null
          name: string
          original_price: number | null
          price_amount: number | null
          price_currency: string | null
          provider_name: string | null
          rating: number | null
          review_count: number | null
          savings_text: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          original_price?: number | null
          price_amount?: number | null
          price_currency?: string | null
          provider_name?: string | null
          rating?: number | null
          review_count?: number | null
          savings_text?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          original_price?: number | null
          price_amount?: number | null
          price_currency?: string | null
          provider_name?: string | null
          rating?: number | null
          review_count?: number | null
          savings_text?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ai_queries_limit: number | null
          ai_queries_used: number | null
          avatar_url: string | null
          created_at: string | null
          dark_mode: boolean | null
          display_name: string | null
          full_name: string | null
          id: string
          language_preference: string | null
          monthly_uploads: number | null
          phone: string | null
          tier: string | null
          total_storage_used: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_queries_limit?: number | null
          ai_queries_used?: number | null
          avatar_url?: string | null
          created_at?: string | null
          dark_mode?: boolean | null
          display_name?: string | null
          full_name?: string | null
          id?: string
          language_preference?: string | null
          monthly_uploads?: number | null
          phone?: string | null
          tier?: string | null
          total_storage_used?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_queries_limit?: number | null
          ai_queries_used?: number | null
          avatar_url?: string | null
          created_at?: string | null
          dark_mode?: boolean | null
          display_name?: string | null
          full_name?: string | null
          id?: string
          language_preference?: string | null
          monthly_uploads?: number | null
          phone?: string | null
          tier?: string | null
          total_storage_used?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          amount: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          id: string
          is_auto_generated: boolean | null
          is_completed: boolean | null
          related_document_id: string | null
          reminder_date: string
          title: string
          updated_at: string | null
          urgency: Database["public"]["Enums"]["urgency_level"] | null
          user_id: string
        }
        Insert: {
          amount?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_auto_generated?: boolean | null
          is_completed?: boolean | null
          related_document_id?: string | null
          reminder_date: string
          title: string
          updated_at?: string | null
          urgency?: Database["public"]["Enums"]["urgency_level"] | null
          user_id: string
        }
        Update: {
          amount?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_auto_generated?: boolean | null
          is_completed?: boolean | null
          related_document_id?: string | null
          reminder_date?: string
          title?: string
          updated_at?: string | null
          urgency?: Database["public"]["Enums"]["urgency_level"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_related_document_id_fkey"
            columns: ["related_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_tags: {
        Row: {
          ai_query: string | null
          color: string | null
          created_at: string | null
          description: string | null
          document_count: number | null
          id: string
          is_system_generated: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_query?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          document_count?: number | null
          id?: string
          is_system_generated?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_query?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          document_count?: number | null
          id?: string
          is_system_generated?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_activity: {
        Row: {
          activity_type: string
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      document_category:
        | "Financial"
        | "Medical"
        | "Legal"
        | "Insurance"
        | "Education"
        | "Personal"
        | "Identity"
        | "Property"
      document_status: "uploading" | "processing" | "completed" | "error"
      family_role: "owner" | "admin" | "member" | "viewer"
      family_status: "pending" | "accepted" | "rejected" | "suspended"
      notification_type:
        | "reminder"
        | "expiry"
        | "sharing"
        | "payment"
        | "system"
      payment_status: "pending" | "completed" | "failed" | "refunded"
      professional_type:
        | "ca"
        | "lawyer"
        | "financial_advisor"
        | "insurance_agent"
        | "tax_consultant"
      relationship_type: "similar" | "related" | "duplicate" | "version"
      subscription_tier: "free" | "premium" | "family_plus" | "business"
      urgency_level: "low" | "medium" | "high"
      user_role: "user" | "family_admin" | "admin"
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
      document_category: [
        "Financial",
        "Medical",
        "Legal",
        "Insurance",
        "Education",
        "Personal",
        "Identity",
        "Property",
      ],
      document_status: ["uploading", "processing", "completed", "error"],
      family_role: ["owner", "admin", "member", "viewer"],
      family_status: ["pending", "accepted", "rejected", "suspended"],
      notification_type: ["reminder", "expiry", "sharing", "payment", "system"],
      payment_status: ["pending", "completed", "failed", "refunded"],
      professional_type: [
        "ca",
        "lawyer",
        "financial_advisor",
        "insurance_agent",
        "tax_consultant",
      ],
      relationship_type: ["similar", "related", "duplicate", "version"],
      subscription_tier: ["free", "premium", "family_plus", "business"],
      urgency_level: ["low", "medium", "high"],
      user_role: ["user", "family_admin", "admin"],
    },
  },
} as const
