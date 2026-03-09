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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      chats: {
        Row: {
          created_at: string | null
          id: string
          is_archived: boolean | null
          model_id: string
          perspectives: string[]
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          model_id: string
          perspectives?: string[]
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          model_id?: string
          perspectives?: string[]
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      context_prompts: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_enabled: boolean
          is_global: boolean
          name: string
          position: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_enabled?: boolean
          is_global?: boolean
          name: string
          position?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_enabled?: boolean
          is_global?: boolean
          name?: string
          position?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      county_scores: {
        Row: {
          clipped_curtailed_score: number | null
          coop_density_score: number | null
          county_name: string
          created_at: string | null
          data_sources: Json | null
          fiber_score: number | null
          fips_code: string
          grid_reliability_score: number | null
          id: string
          labor_score: number | null
          last_permitting_update: string | null
          permitting_score: number | null
          state_abbr: string
          state_fips: string
          updated_at: string | null
        }
        Insert: {
          clipped_curtailed_score?: number | null
          coop_density_score?: number | null
          county_name: string
          created_at?: string | null
          data_sources?: Json | null
          fiber_score?: number | null
          fips_code: string
          grid_reliability_score?: number | null
          id?: string
          labor_score?: number | null
          last_permitting_update?: string | null
          permitting_score?: number | null
          state_abbr: string
          state_fips: string
          updated_at?: string | null
        }
        Update: {
          clipped_curtailed_score?: number | null
          coop_density_score?: number | null
          county_name?: string
          created_at?: string | null
          data_sources?: Json | null
          fiber_score?: number | null
          fips_code?: string
          grid_reliability_score?: number | null
          id?: string
          labor_score?: number | null
          last_permitting_update?: string | null
          permitting_score?: number | null
          state_abbr?: string
          state_fips?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      hub_regions: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          geojson: Json
          id: string
          name: string
          priority_rank: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          geojson: Json
          id?: string
          name: string
          priority_rank?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          geojson?: Json
          id?: string
          name?: string
          priority_rank?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string | null
          id: string
          perspective: string | null
          role: string
          sequence_num: number
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string | null
          id?: string
          perspective?: string | null
          role: string
          sequence_num?: number
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string | null
          id?: string
          perspective?: string | null
          role?: string
          sequence_num?: number
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      permitting_sentiment: {
        Row: {
          created_at: string | null
          evidence: Json | null
          fips_code: string
          id: string
          moratoria_active: boolean | null
          sentiment_label: string
          sentiment_score: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          evidence?: Json | null
          fips_code: string
          id?: string
          moratoria_active?: boolean | null
          sentiment_label: string
          sentiment_score?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          evidence?: Json | null
          fips_code?: string
          id?: string
          moratoria_active?: boolean | null
          sentiment_label?: string
          sentiment_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permitting_sentiment_fips_code_fkey"
            columns: ["fips_code"]
            isOneToOne: true
            referencedRelation: "county_scores"
            referencedColumns: ["fips_code"]
          },
        ]
      }
      perspectives: {
        Row: {
          created_at: string | null
          description: string
          icon: string | null
          id: string
          is_enabled: boolean
          is_global: boolean
          name: string
          position: number
          slug: string
          system_prompt: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          icon?: string | null
          id?: string
          is_enabled?: boolean
          is_global?: boolean
          name: string
          position?: number
          slug: string
          system_prompt: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          icon?: string | null
          id?: string
          is_enabled?: boolean
          is_global?: boolean
          name?: string
          position?: number
          slug?: string
          system_prompt?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      timeline_annotations: {
        Row: {
          created_at: string | null
          date: string
          id: string
          label: string
          row_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          label: string
          row_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          label?: string
          row_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timeline_annotations_row_id_fkey"
            columns: ["row_id"]
            isOneToOne: false
            referencedRelation: "timeline_rows"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_milestones: {
        Row: {
          created_at: string | null
          date: string
          id: string
          label: string
          position: number
          row_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          label: string
          position?: number
          row_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          label?: string
          position?: number
          row_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timeline_milestones_row_id_fkey"
            columns: ["row_id"]
            isOneToOne: false
            referencedRelation: "timeline_rows"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_phases: {
        Row: {
          created_at: string | null
          date: string
          id: string
          label: string
          position: number
          timeline_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          label: string
          position?: number
          timeline_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          label?: string
          position?: number
          timeline_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timeline_phases_timeline_id_fkey"
            columns: ["timeline_id"]
            isOneToOne: false
            referencedRelation: "timelines"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_rows: {
        Row: {
          color: string
          created_at: string | null
          end_date: string
          id: string
          label: string
          position: number
          start_date: string
          timeline_id: string
          updated_at: string | null
        }
        Insert: {
          color?: string
          created_at?: string | null
          end_date: string
          id?: string
          label: string
          position?: number
          start_date: string
          timeline_id: string
          updated_at?: string | null
        }
        Update: {
          color?: string
          created_at?: string | null
          end_date?: string
          id?: string
          label?: string
          position?: number
          start_date?: string
          timeline_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timeline_rows_timeline_id_fkey"
            columns: ["timeline_id"]
            isOneToOne: false
            referencedRelation: "timelines"
            referencedColumns: ["id"]
          },
        ]
      }
      timelines: {
        Row: {
          created_at: string | null
          end_year: number
          id: string
          notes: string | null
          start_year: number
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_year?: number
          id?: string
          notes?: string | null
          start_year?: number
          title?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_year?: number
          id?: string
          notes?: string | null
          start_year?: number
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tracker_activity_log: {
        Row: {
          created_at: string | null
          id: string
          logged_by: string | null
          site_id: string | null
          source_link: string | null
          source_type: Database["public"]["Enums"]["activity_source"] | null
          summary: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          logged_by?: string | null
          site_id?: string | null
          source_link?: string | null
          source_type?: Database["public"]["Enums"]["activity_source"] | null
          summary?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          logged_by?: string | null
          site_id?: string | null
          source_link?: string | null
          source_type?: Database["public"]["Enums"]["activity_source"] | null
          summary?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracker_activity_log_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "tracker_site_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracker_activity_log_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "tracker_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      tracker_landowners: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          mailing_address: string | null
          name: string
          notes: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          mailing_address?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          mailing_address?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tracker_parcels: {
        Row: {
          apn: string
          area_acres: number | null
          created_at: string | null
          id: string
          landowner_id: string | null
          notes: string | null
          site_id: string
          updated_at: string | null
        }
        Insert: {
          apn: string
          area_acres?: number | null
          created_at?: string | null
          id?: string
          landowner_id?: string | null
          notes?: string | null
          site_id: string
          updated_at?: string | null
        }
        Update: {
          apn?: string
          area_acres?: number | null
          created_at?: string | null
          id?: string
          landowner_id?: string | null
          notes?: string | null
          site_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tracker_parcels_landowner_id_fkey"
            columns: ["landowner_id"]
            isOneToOne: false
            referencedRelation: "tracker_landowners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracker_parcels_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "tracker_site_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracker_parcels_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "tracker_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      tracker_partner_hubs: {
        Row: {
          hub_id: string
          partner_id: string
        }
        Insert: {
          hub_id: string
          partner_id: string
        }
        Update: {
          hub_id?: string
          partner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracker_partner_hubs_hub_id_fkey"
            columns: ["hub_id"]
            isOneToOne: false
            referencedRelation: "tracker_regional_hubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracker_partner_hubs_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "tracker_power_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      tracker_power_partners: {
        Row: {
          attio_link: string | null
          available_capacity: string | null
          created_at: string | null
          id: string
          ix_process_notes: string | null
          loi_signed: boolean | null
          name: string
          notes: Json | null
          parent_gt_id: string | null
          rate_structure: string | null
          relationship_stage:
            | Database["public"]["Enums"]["relationship_stage"]
            | null
          type: Database["public"]["Enums"]["partner_type"] | null
          updated_at: string | null
        }
        Insert: {
          attio_link?: string | null
          available_capacity?: string | null
          created_at?: string | null
          id?: string
          ix_process_notes?: string | null
          loi_signed?: boolean | null
          name: string
          notes?: Json | null
          parent_gt_id?: string | null
          rate_structure?: string | null
          relationship_stage?:
            | Database["public"]["Enums"]["relationship_stage"]
            | null
          type?: Database["public"]["Enums"]["partner_type"] | null
          updated_at?: string | null
        }
        Update: {
          attio_link?: string | null
          available_capacity?: string | null
          created_at?: string | null
          id?: string
          ix_process_notes?: string | null
          loi_signed?: boolean | null
          name?: string
          notes?: Json | null
          parent_gt_id?: string | null
          rate_structure?: string | null
          relationship_stage?:
            | Database["public"]["Enums"]["relationship_stage"]
            | null
          type?: Database["public"]["Enums"]["partner_type"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tracker_power_partners_parent_gt_id_fkey"
            columns: ["parent_gt_id"]
            isOneToOne: false
            referencedRelation: "tracker_power_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      tracker_regional_hubs: {
        Row: {
          created_at: string | null
          id: string
          name: string
          notes: Json | null
          status: Database["public"]["Enums"]["hub_status"] | null
          target_mw: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          notes?: Json | null
          status?: Database["public"]["Enums"]["hub_status"] | null
          target_mw?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          notes?: Json | null
          status?: Database["public"]["Enums"]["hub_status"] | null
          target_mw?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tracker_site_landowners: {
        Row: {
          landowner_id: string
          lease_status: Database["public"]["Enums"]["lease_status"] | null
          notes: string | null
          proximity: Database["public"]["Enums"]["landowner_proximity"]
          purpose: Database["public"]["Enums"]["landowner_purpose"][]
          site_id: string
        }
        Insert: {
          landowner_id: string
          lease_status?: Database["public"]["Enums"]["lease_status"] | null
          notes?: string | null
          proximity: Database["public"]["Enums"]["landowner_proximity"]
          purpose?: Database["public"]["Enums"]["landowner_purpose"][]
          site_id: string
        }
        Update: {
          landowner_id?: string
          lease_status?: Database["public"]["Enums"]["lease_status"] | null
          notes?: string | null
          proximity?: Database["public"]["Enums"]["landowner_proximity"]
          purpose?: Database["public"]["Enums"]["landowner_purpose"][]
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracker_site_landowners_landowner_id_fkey"
            columns: ["landowner_id"]
            isOneToOne: false
            referencedRelation: "tracker_landowners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracker_site_landowners_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "tracker_site_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracker_site_landowners_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "tracker_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      tracker_sites: {
        Row: {
          address: string | null
          ahj: string | null
          archived_at: string | null
          archived_reason: string | null
          asset_owner_id: string | null
          checkpoint_notes: Json | null
          construction_commissioned_completed: string | null
          construction_commissioned_forecast: string | null
          construction_commissioned_owner: string | null
          construction_commissioned_status:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          construction_complete_completed: string | null
          construction_complete_forecast: string | null
          construction_complete_owner: string | null
          construction_complete_status:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          construction_energized_completed: string | null
          construction_energized_forecast: string | null
          construction_energized_owner: string | null
          construction_energized_status:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          construction_equip_delivered_completed: string | null
          construction_equip_delivered_forecast: string | null
          construction_equip_delivered_owner: string | null
          construction_equip_delivered_status:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          control_engaged_completed: string | null
          control_engaged_forecast: string | null
          control_engaged_owner: string | null
          control_engaged_status:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          control_secured_completed: string | null
          control_secured_forecast: string | null
          control_secured_owner: string | null
          control_secured_status:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          coordinates: string | null
          created_at: string | null
          eng_design_completed: string | null
          eng_design_forecast: string | null
          eng_design_owner: string | null
          eng_design_status:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          eng_equip_ordered_amount: number | null
          eng_equip_ordered_amount_status:
            | Database["public"]["Enums"]["amount_status"]
            | null
          eng_equip_ordered_completed: string | null
          eng_equip_ordered_forecast: string | null
          eng_equip_ordered_owner: string | null
          eng_equip_ordered_status:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          fiber_capacity_completed: string | null
          fiber_capacity_forecast: string | null
          fiber_capacity_owner: string | null
          fiber_capacity_status:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          fiber_identified_completed: string | null
          fiber_identified_forecast: string | null
          fiber_identified_owner: string | null
          fiber_identified_status:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          fiber_secured_amount: number | null
          fiber_secured_amount_status:
            | Database["public"]["Enums"]["amount_status"]
            | null
          fiber_secured_completed: string | null
          fiber_secured_forecast: string | null
          fiber_secured_owner: string | null
          fiber_secured_status:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          id: string
          interested_offtakers: string[] | null
          mw_current: number | null
          mw_potential: number | null
          name: string
          permit_approved_amount: number | null
          permit_approved_amount_status:
            | Database["public"]["Enums"]["amount_status"]
            | null
          permit_approved_completed: string | null
          permit_approved_forecast: string | null
          permit_approved_owner: string | null
          permit_approved_status:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          permit_requirements_completed: string | null
          permit_requirements_forecast: string | null
          permit_requirements_owner: string | null
          permit_requirements_status:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          power_capacity_check_completed: string | null
          power_capacity_check_forecast: string | null
          power_capacity_check_owner: string | null
          power_capacity_check_status:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          power_capacity_indication_completed: string | null
          power_capacity_indication_forecast: string | null
          power_capacity_indication_owner: string | null
          power_capacity_indication_status:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          power_connection_completed: string | null
          power_connection_forecast: string | null
          power_connection_owner: string | null
          power_connection_status:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          power_deposit_amount: number | null
          power_deposit_amount_status:
            | Database["public"]["Enums"]["amount_status"]
            | null
          power_deposit_completed: string | null
          power_deposit_forecast: string | null
          power_deposit_owner: string | null
          power_deposit_status:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          power_service_request_completed: string | null
          power_service_request_forecast: string | null
          power_service_request_owner: string | null
          power_service_request_status:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          power_utility_design_completed: string | null
          power_utility_design_forecast: string | null
          power_utility_design_owner: string | null
          power_utility_design_status:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          priority: Database["public"]["Enums"]["site_priority"] | null
          regional_hub_id: string | null
          site_identified_completed: string | null
          site_identified_forecast: string | null
          site_identified_owner: string | null
          site_identified_status:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          site_notes: Json | null
          site_qualified_completed: string | null
          site_qualified_forecast: string | null
          site_qualified_owner: string | null
          site_qualified_status:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          site_type: Database["public"]["Enums"]["site_type_enum"] | null
          updated_at: string | null
          utility_id: string | null
        }
        Insert: {
          address?: string | null
          ahj?: string | null
          archived_at?: string | null
          archived_reason?: string | null
          asset_owner_id?: string | null
          checkpoint_notes?: Json | null
          construction_commissioned_completed?: string | null
          construction_commissioned_forecast?: string | null
          construction_commissioned_owner?: string | null
          construction_commissioned_status?:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          construction_complete_completed?: string | null
          construction_complete_forecast?: string | null
          construction_complete_owner?: string | null
          construction_complete_status?:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          construction_energized_completed?: string | null
          construction_energized_forecast?: string | null
          construction_energized_owner?: string | null
          construction_energized_status?:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          construction_equip_delivered_completed?: string | null
          construction_equip_delivered_forecast?: string | null
          construction_equip_delivered_owner?: string | null
          construction_equip_delivered_status?:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          control_engaged_completed?: string | null
          control_engaged_forecast?: string | null
          control_engaged_owner?: string | null
          control_engaged_status?:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          control_secured_completed?: string | null
          control_secured_forecast?: string | null
          control_secured_owner?: string | null
          control_secured_status?:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          coordinates?: string | null
          created_at?: string | null
          eng_design_completed?: string | null
          eng_design_forecast?: string | null
          eng_design_owner?: string | null
          eng_design_status?:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          eng_equip_ordered_amount?: number | null
          eng_equip_ordered_amount_status?:
            | Database["public"]["Enums"]["amount_status"]
            | null
          eng_equip_ordered_completed?: string | null
          eng_equip_ordered_forecast?: string | null
          eng_equip_ordered_owner?: string | null
          eng_equip_ordered_status?:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          fiber_capacity_completed?: string | null
          fiber_capacity_forecast?: string | null
          fiber_capacity_owner?: string | null
          fiber_capacity_status?:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          fiber_identified_completed?: string | null
          fiber_identified_forecast?: string | null
          fiber_identified_owner?: string | null
          fiber_identified_status?:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          fiber_secured_amount?: number | null
          fiber_secured_amount_status?:
            | Database["public"]["Enums"]["amount_status"]
            | null
          fiber_secured_completed?: string | null
          fiber_secured_forecast?: string | null
          fiber_secured_owner?: string | null
          fiber_secured_status?:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          id?: string
          interested_offtakers?: string[] | null
          mw_current?: number | null
          mw_potential?: number | null
          name: string
          permit_approved_amount?: number | null
          permit_approved_amount_status?:
            | Database["public"]["Enums"]["amount_status"]
            | null
          permit_approved_completed?: string | null
          permit_approved_forecast?: string | null
          permit_approved_owner?: string | null
          permit_approved_status?:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          permit_requirements_completed?: string | null
          permit_requirements_forecast?: string | null
          permit_requirements_owner?: string | null
          permit_requirements_status?:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          power_capacity_check_completed?: string | null
          power_capacity_check_forecast?: string | null
          power_capacity_check_owner?: string | null
          power_capacity_check_status?:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          power_capacity_indication_completed?: string | null
          power_capacity_indication_forecast?: string | null
          power_capacity_indication_owner?: string | null
          power_capacity_indication_status?:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          power_connection_completed?: string | null
          power_connection_forecast?: string | null
          power_connection_owner?: string | null
          power_connection_status?:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          power_deposit_amount?: number | null
          power_deposit_amount_status?:
            | Database["public"]["Enums"]["amount_status"]
            | null
          power_deposit_completed?: string | null
          power_deposit_forecast?: string | null
          power_deposit_owner?: string | null
          power_deposit_status?:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          power_service_request_completed?: string | null
          power_service_request_forecast?: string | null
          power_service_request_owner?: string | null
          power_service_request_status?:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          power_utility_design_completed?: string | null
          power_utility_design_forecast?: string | null
          power_utility_design_owner?: string | null
          power_utility_design_status?:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          priority?: Database["public"]["Enums"]["site_priority"] | null
          regional_hub_id?: string | null
          site_identified_completed?: string | null
          site_identified_forecast?: string | null
          site_identified_owner?: string | null
          site_identified_status?:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          site_notes?: Json | null
          site_qualified_completed?: string | null
          site_qualified_forecast?: string | null
          site_qualified_owner?: string | null
          site_qualified_status?:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          site_type?: Database["public"]["Enums"]["site_type_enum"] | null
          updated_at?: string | null
          utility_id?: string | null
        }
        Update: {
          address?: string | null
          ahj?: string | null
          archived_at?: string | null
          archived_reason?: string | null
          asset_owner_id?: string | null
          checkpoint_notes?: Json | null
          construction_commissioned_completed?: string | null
          construction_commissioned_forecast?: string | null
          construction_commissioned_owner?: string | null
          construction_commissioned_status?:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          construction_complete_completed?: string | null
          construction_complete_forecast?: string | null
          construction_complete_owner?: string | null
          construction_complete_status?:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          construction_energized_completed?: string | null
          construction_energized_forecast?: string | null
          construction_energized_owner?: string | null
          construction_energized_status?:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          construction_equip_delivered_completed?: string | null
          construction_equip_delivered_forecast?: string | null
          construction_equip_delivered_owner?: string | null
          construction_equip_delivered_status?:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          control_engaged_completed?: string | null
          control_engaged_forecast?: string | null
          control_engaged_owner?: string | null
          control_engaged_status?:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          control_secured_completed?: string | null
          control_secured_forecast?: string | null
          control_secured_owner?: string | null
          control_secured_status?:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          coordinates?: string | null
          created_at?: string | null
          eng_design_completed?: string | null
          eng_design_forecast?: string | null
          eng_design_owner?: string | null
          eng_design_status?:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          eng_equip_ordered_amount?: number | null
          eng_equip_ordered_amount_status?:
            | Database["public"]["Enums"]["amount_status"]
            | null
          eng_equip_ordered_completed?: string | null
          eng_equip_ordered_forecast?: string | null
          eng_equip_ordered_owner?: string | null
          eng_equip_ordered_status?:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          fiber_capacity_completed?: string | null
          fiber_capacity_forecast?: string | null
          fiber_capacity_owner?: string | null
          fiber_capacity_status?:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          fiber_identified_completed?: string | null
          fiber_identified_forecast?: string | null
          fiber_identified_owner?: string | null
          fiber_identified_status?:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          fiber_secured_amount?: number | null
          fiber_secured_amount_status?:
            | Database["public"]["Enums"]["amount_status"]
            | null
          fiber_secured_completed?: string | null
          fiber_secured_forecast?: string | null
          fiber_secured_owner?: string | null
          fiber_secured_status?:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          id?: string
          interested_offtakers?: string[] | null
          mw_current?: number | null
          mw_potential?: number | null
          name?: string
          permit_approved_amount?: number | null
          permit_approved_amount_status?:
            | Database["public"]["Enums"]["amount_status"]
            | null
          permit_approved_completed?: string | null
          permit_approved_forecast?: string | null
          permit_approved_owner?: string | null
          permit_approved_status?:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          permit_requirements_completed?: string | null
          permit_requirements_forecast?: string | null
          permit_requirements_owner?: string | null
          permit_requirements_status?:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          power_capacity_check_completed?: string | null
          power_capacity_check_forecast?: string | null
          power_capacity_check_owner?: string | null
          power_capacity_check_status?:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          power_capacity_indication_completed?: string | null
          power_capacity_indication_forecast?: string | null
          power_capacity_indication_owner?: string | null
          power_capacity_indication_status?:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          power_connection_completed?: string | null
          power_connection_forecast?: string | null
          power_connection_owner?: string | null
          power_connection_status?:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          power_deposit_amount?: number | null
          power_deposit_amount_status?:
            | Database["public"]["Enums"]["amount_status"]
            | null
          power_deposit_completed?: string | null
          power_deposit_forecast?: string | null
          power_deposit_owner?: string | null
          power_deposit_status?:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          power_service_request_completed?: string | null
          power_service_request_forecast?: string | null
          power_service_request_owner?: string | null
          power_service_request_status?:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          power_utility_design_completed?: string | null
          power_utility_design_forecast?: string | null
          power_utility_design_owner?: string | null
          power_utility_design_status?:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          priority?: Database["public"]["Enums"]["site_priority"] | null
          regional_hub_id?: string | null
          site_identified_completed?: string | null
          site_identified_forecast?: string | null
          site_identified_owner?: string | null
          site_identified_status?:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          site_notes?: Json | null
          site_qualified_completed?: string | null
          site_qualified_forecast?: string | null
          site_qualified_owner?: string | null
          site_qualified_status?:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          site_type?: Database["public"]["Enums"]["site_type_enum"] | null
          updated_at?: string | null
          utility_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tracker_sites_asset_owner_id_fkey"
            columns: ["asset_owner_id"]
            isOneToOne: false
            referencedRelation: "tracker_power_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracker_sites_regional_hub_id_fkey"
            columns: ["regional_hub_id"]
            isOneToOne: false
            referencedRelation: "tracker_regional_hubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracker_sites_utility_id_fkey"
            columns: ["utility_id"]
            isOneToOne: false
            referencedRelation: "tracker_power_partners"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      tracker_site_overview: {
        Row: {
          address: string | null
          ahj: string | null
          archived_at: string | null
          archived_reason: string | null
          asset_owner_id: string | null
          asset_owner_name: string | null
          capex_per_mw: number | null
          checkpoint_notes: Json | null
          construction_commissioned_completed: string | null
          construction_commissioned_forecast: string | null
          construction_commissioned_owner: string | null
          construction_commissioned_status:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          construction_complete_completed: string | null
          construction_complete_forecast: string | null
          construction_complete_owner: string | null
          construction_complete_status:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          construction_energized_completed: string | null
          construction_energized_forecast: string | null
          construction_energized_owner: string | null
          construction_energized_status:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          construction_equip_delivered_completed: string | null
          construction_equip_delivered_forecast: string | null
          construction_equip_delivered_owner: string | null
          construction_equip_delivered_status:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          construction_phase: string | null
          construction_ready: boolean | null
          construction_ready_date: string | null
          control_engaged_completed: string | null
          control_engaged_forecast: string | null
          control_engaged_owner: string | null
          control_engaged_status:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          control_secured_completed: string | null
          control_secured_forecast: string | null
          control_secured_owner: string | null
          control_secured_status:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          coordinates: string | null
          created_at: string | null
          days_to_cod: number | null
          days_to_construction_ready: number | null
          days_to_ix: number | null
          eng_design_completed: string | null
          eng_design_forecast: string | null
          eng_design_owner: string | null
          eng_design_status:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          eng_equip_ordered_amount: number | null
          eng_equip_ordered_amount_status:
            | Database["public"]["Enums"]["amount_status"]
            | null
          eng_equip_ordered_completed: string | null
          eng_equip_ordered_forecast: string | null
          eng_equip_ordered_owner: string | null
          eng_equip_ordered_status:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          engineering_phase: string | null
          fiber_capacity_completed: string | null
          fiber_capacity_forecast: string | null
          fiber_capacity_owner: string | null
          fiber_capacity_status:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          fiber_identified_completed: string | null
          fiber_identified_forecast: string | null
          fiber_identified_owner: string | null
          fiber_identified_status:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          fiber_phase: string | null
          fiber_secured_amount: number | null
          fiber_secured_amount_status:
            | Database["public"]["Enums"]["amount_status"]
            | null
          fiber_secured_completed: string | null
          fiber_secured_forecast: string | null
          fiber_secured_owner: string | null
          fiber_secured_status:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          hub_name: string | null
          id: string | null
          interested_offtakers: string[] | null
          is_archived: boolean | null
          mw_current: number | null
          mw_potential: number | null
          name: string | null
          next_step: string | null
          permit_approved_amount: number | null
          permit_approved_amount_status:
            | Database["public"]["Enums"]["amount_status"]
            | null
          permit_approved_completed: string | null
          permit_approved_forecast: string | null
          permit_approved_owner: string | null
          permit_approved_status:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          permit_requirements_completed: string | null
          permit_requirements_forecast: string | null
          permit_requirements_owner: string | null
          permit_requirements_status:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          permitting_phase: string | null
          power_capacity_check_completed: string | null
          power_capacity_check_forecast: string | null
          power_capacity_check_owner: string | null
          power_capacity_check_status:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          power_capacity_indication_completed: string | null
          power_capacity_indication_forecast: string | null
          power_capacity_indication_owner: string | null
          power_capacity_indication_status:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          power_connection_completed: string | null
          power_connection_forecast: string | null
          power_connection_owner: string | null
          power_connection_status:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          power_deposit_amount: number | null
          power_deposit_amount_status:
            | Database["public"]["Enums"]["amount_status"]
            | null
          power_deposit_completed: string | null
          power_deposit_forecast: string | null
          power_deposit_owner: string | null
          power_deposit_status:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          power_phase: string | null
          power_service_request_completed: string | null
          power_service_request_forecast: string | null
          power_service_request_owner: string | null
          power_service_request_status:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          power_utility_design_completed: string | null
          power_utility_design_forecast: string | null
          power_utility_design_owner: string | null
          power_utility_design_status:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          priority: Database["public"]["Enums"]["site_priority"] | null
          regional_hub_id: string | null
          site_control_phase: string | null
          site_identified_completed: string | null
          site_identified_forecast: string | null
          site_identified_owner: string | null
          site_identified_status:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          site_notes: Json | null
          has_activity: boolean | null
          dev_start_date: string | null
          site_qualified_completed: string | null
          site_qualified_forecast: string | null
          site_qualified_owner: string | null
          site_qualified_status:
            | Database["public"]["Enums"]["checkpoint_status"]
            | null
          site_type: Database["public"]["Enums"]["site_type_enum"] | null
          total_capex: number | null
          updated_at: string | null
          utility_id: string | null
          utility_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tracker_sites_asset_owner_id_fkey"
            columns: ["asset_owner_id"]
            isOneToOne: false
            referencedRelation: "tracker_power_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracker_sites_regional_hub_id_fkey"
            columns: ["regional_hub_id"]
            isOneToOne: false
            referencedRelation: "tracker_regional_hubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracker_sites_utility_id_fkey"
            columns: ["utility_id"]
            isOneToOne: false
            referencedRelation: "tracker_power_partners"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      activity_source:
        | "call"
        | "email"
        | "slack"
        | "meeting"
        | "manual"
        | "other"
      amount_status: "Estimated" | "Quoted" | "Approved" | "Paid"
      checkpoint_status:
        | "Not Started"
        | "In Progress"
        | "Complete"
        | "Waiting"
        | "N/A"
      hub_status: "Planning" | "Active Development" | "Operational"
      landowner_proximity: "Collocated" | "Adjacent"
      landowner_purpose:
        | "DC Location"
        | "Fiber Route"
        | "Access Easement"
        | "Utility Easement"
      lease_status:
        | "No Contact"
        | "Engaged"
        | "Amendment In Progress"
        | "Signed"
      partner_type:
        | "Distribution Co-op"
        | "G&T Co-op"
        | "Municipal Utility"
        | "IOU"
        | "IPP"
      relationship_stage:
        | "Identified"
        | "Initial Contact"
        | "Capacity Discussion"
        | "Under Contract"
      site_priority:
        | "Lead"
        | "Active"
        | "Pipeline"
        | "On Hold"
        | "Deprioritized"
      site_type_enum: "Solar" | "Wind" | "Solar + BESS" | "Substation" | "Other"
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
      activity_source: ["call", "email", "slack", "meeting", "manual", "other"],
      amount_status: ["Estimated", "Quoted", "Approved", "Paid"],
      checkpoint_status: [
        "Not Started",
        "In Progress",
        "Complete",
        "Waiting",
        "N/A",
      ],
      hub_status: ["Planning", "Active Development", "Operational"],
      landowner_proximity: ["Collocated", "Adjacent"],
      landowner_purpose: [
        "DC Location",
        "Fiber Route",
        "Access Easement",
        "Utility Easement",
      ],
      lease_status: [
        "No Contact",
        "Engaged",
        "Amendment In Progress",
        "Signed",
      ],
      partner_type: [
        "Distribution Co-op",
        "G&T Co-op",
        "Municipal Utility",
        "IOU",
        "IPP",
      ],
      relationship_stage: [
        "Identified",
        "Initial Contact",
        "Capacity Discussion",
        "Under Contract",
      ],
      site_priority: ["Lead", "Active", "Pipeline", "On Hold", "Deprioritized"],
      site_type_enum: ["Solar", "Wind", "Solar + BESS", "Substation", "Other"],
    },
  },
} as const
