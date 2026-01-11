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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      account_types: {
        Row: {
          balance_nature: Database["public"]["Enums"]["balance_nature"]
          code: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          balance_nature: Database["public"]["Enums"]["balance_nature"]
          code: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          balance_nature?: Database["public"]["Enums"]["balance_nature"]
          code?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      accounts: {
        Row: {
          account_type_id: string
          closed_at: string | null
          created_at: string
          currency_code: string
          external_id: string | null
          id: string
          institution_name: string | null
          name: string
          opened_at: string | null
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          account_type_id: string
          closed_at?: string | null
          created_at?: string
          currency_code: string
          external_id?: string | null
          id?: string
          institution_name?: string | null
          name: string
          opened_at?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          account_type_id?: string
          closed_at?: string | null
          created_at?: string
          currency_code?: string
          external_id?: string | null
          id?: string
          institution_name?: string | null
          name?: string
          opened_at?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_account_type_id_fkey"
            columns: ["account_type_id"]
            isOneToOne: false
            referencedRelation: "account_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_account_details: {
        Row: {
          account_id: string
          bank_name: string | null
          created_at: string
          interest_rate_annual: number | null
          kind: Database["public"]["Enums"]["bank_account_kind"]
          masked_number: string | null
          monthly_fee: number | null
          overdraft_limit: number | null
          updated_at: string
        }
        Insert: {
          account_id: string
          bank_name?: string | null
          created_at?: string
          interest_rate_annual?: number | null
          kind: Database["public"]["Enums"]["bank_account_kind"]
          masked_number?: string | null
          monthly_fee?: number | null
          overdraft_limit?: number | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          bank_name?: string | null
          created_at?: string
          interest_rate_annual?: number | null
          kind?: Database["public"]["Enums"]["bank_account_kind"]
          masked_number?: string | null
          monthly_fee?: number | null
          overdraft_limit?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_account_details_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_category_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_card_details: {
        Row: {
          account_id: string
          bank_name: string | null
          billing_cycle_day: number | null
          created_at: string
          credit_limit: number | null
          interest_rate_annual: number | null
          interest_rate_monthly: number | null
          issuer: string | null
          last_statement_date: string | null
          last4: string | null
          management_fee: number | null
          management_fee_period: string | null
          payment_due_day: number | null
          updated_at: string
        }
        Insert: {
          account_id: string
          bank_name?: string | null
          billing_cycle_day?: number | null
          created_at?: string
          credit_limit?: number | null
          interest_rate_annual?: number | null
          interest_rate_monthly?: number | null
          issuer?: string | null
          last_statement_date?: string | null
          last4?: string | null
          management_fee?: number | null
          management_fee_period?: string | null
          payment_due_day?: number | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          bank_name?: string | null
          billing_cycle_day?: number | null
          created_at?: string
          credit_limit?: number | null
          interest_rate_annual?: number | null
          interest_rate_monthly?: number | null
          issuer?: string | null
          last_statement_date?: string | null
          last4?: string | null
          management_fee?: number | null
          management_fee_period?: string | null
          payment_due_day?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_card_details_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      reconciliations: {
        Row: {
          account_id: string
          calculated_balance_before: number
          created_at: string
          delta: number
          entered_balance: number
          id: string
          note: string | null
          occurred_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          calculated_balance_before: number
          created_at?: string
          delta: number
          entered_balance: number
          id?: string
          note?: string | null
          occurred_at: string
          user_id: string
        }
        Update: {
          account_id?: string
          calculated_balance_before?: number
          created_at?: string
          delta?: number
          entered_balance?: number
          id?: string
          note?: string | null
          occurred_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reconciliations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_tags: {
        Row: {
          tag_id: string
          transaction_id: string
        }
        Insert: {
          tag_id: string
          transaction_id: string
        }
        Update: {
          tag_id?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_tags_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string
          balance_after: number | null
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          kind: Database["public"]["Enums"]["transaction_kind"]
          occurred_at: string
          posted_at: string | null
          reconciliation_id: string | null
          signed_amount: number
          source: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          transfer_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          balance_after?: number | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["transaction_kind"]
          occurred_at: string
          posted_at?: string | null
          reconciliation_id?: string | null
          signed_amount: number
          source?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          transfer_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          balance_after?: number | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["transaction_kind"]
          occurred_at?: string
          posted_at?: string | null
          reconciliation_id?: string | null
          signed_amount?: number
          source?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          transfer_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_reconciliation_id_fkey"
            columns: ["reconciliation_id"]
            isOneToOne: false
            referencedRelation: "reconciliations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transfers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transfers: {
        Row: {
          amount: number
          created_at: string
          currency_code: string
          from_account_id: string
          from_transaction_id: string | null
          id: string
          occurred_at: string
          status: Database["public"]["Enums"]["transaction_status"]
          to_account_id: string
          to_transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency_code: string
          from_account_id: string
          from_transaction_id?: string | null
          id?: string
          occurred_at: string
          status?: Database["public"]["Enums"]["transaction_status"]
          to_account_id: string
          to_transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency_code?: string
          from_account_id?: string
          from_transaction_id?: string | null
          id?: string
          occurred_at?: string
          status?: Database["public"]["Enums"]["transaction_status"]
          to_account_id?: string
          to_transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfers_from_account_id_fkey"
            columns: ["from_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_from_transaction_id_fkey"
            columns: ["from_transaction_id"]
            isOneToOne: true
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_to_account_id_fkey"
            columns: ["to_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_to_transaction_id_fkey"
            columns: ["to_transaction_id"]
            isOneToOne: true
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
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
      account_status: "ACTIVE" | "CLOSED"
      balance_nature: "ASSET" | "LIABILITY"
      bank_account_kind: "SAVINGS" | "CHECKING"
      HistoryStatus: "EN_CURSO" | "FINALIZADA" | "MANTENIMIENTO" | "CANCELADA"
      NotificationStatus:
        | "PENDING"
        | "PROCESSING"
        | "DONE"
        | "CANCELLED"
        | "DEAD_LETTER"
      PaymentMethod: "EFECTIVO" | "TARJETA" | "NEQUI" | "DAVIPLATA"
      Role: "ADMIN" | "RECEPCIONISTA"
      RoomStatus: "DISPONIBLE" | "OCUPADA" | "MANTENIMIENTO" | "LIMPIEZA"
      ServiceType: "RATO" | "AMANECIDA" | "MANTENIMIENTO"
      transaction_kind:
        | "NORMAL"
        | "TRANSFER"
        | "ADJUSTMENT"
        | "FEE"
        | "INTEREST"
      transaction_status: "PENDING" | "POSTED" | "VOID"
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
      account_status: ["ACTIVE", "CLOSED"],
      balance_nature: ["ASSET", "LIABILITY"],
      bank_account_kind: ["SAVINGS", "CHECKING"],
      HistoryStatus: ["EN_CURSO", "FINALIZADA", "MANTENIMIENTO", "CANCELADA"],
      NotificationStatus: [
        "PENDING",
        "PROCESSING",
        "DONE",
        "CANCELLED",
        "DEAD_LETTER",
      ],
      PaymentMethod: ["EFECTIVO", "TARJETA", "NEQUI", "DAVIPLATA"],
      Role: ["ADMIN", "RECEPCIONISTA"],
      RoomStatus: ["DISPONIBLE", "OCUPADA", "MANTENIMIENTO", "LIMPIEZA"],
      ServiceType: ["RATO", "AMANECIDA", "MANTENIMIENTO"],
      transaction_kind: ["NORMAL", "TRANSFER", "ADJUSTMENT", "FEE", "INTEREST"],
      transaction_status: ["PENDING", "POSTED", "VOID"],
    },
  },
} as const