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
            admissions: {
                Row: {
                    id: string
                    student_name: string
                    student_id_card: string | null
                    birth_date: string | null
                    gender: string | null
                    parent_name: string
                    parent_phone: string
                    parent_email: string | null
                    address: string | null
                    previous_school: string | null
                    grade_applying: string
                    program_applying: string
                    status: string
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    student_name: string
                    student_id_card?: string | null
                    birth_date?: string | null
                    gender?: string | null
                    parent_name: string
                    parent_phone: string
                    parent_email?: string | null
                    address?: string | null
                    previous_school?: string | null
                    grade_applying: string
                    program_applying: string
                    status?: string
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    student_name?: string
                    student_id_card?: string | null
                    birth_date?: string | null
                    gender?: string | null
                    parent_name?: string
                    parent_phone?: string
                    parent_email?: string | null
                    address?: string | null
                    previous_school?: string | null
                    grade_applying?: string
                    program_applying?: string
                    status?: string
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            curriculum_programs: {
                Row: {
                    id: string
                    title: string
                    description: string | null
                    icon: string | null
                    color: string | null
                    subjects: string[] | null
                    careers: string[] | null
                    order_position: number
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    description?: string | null
                    icon?: string | null
                    color?: string | null
                    subjects?: string[] | null
                    careers?: string[] | null
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    description?: string | null
                    icon?: string | null
                    color?: string | null
                    subjects?: string[] | null
                    careers?: string[] | null
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            curriculum_activities: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    icon: string | null
                    order_position: number
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string | null
                    icon?: string | null
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    description?: string | null
                    icon?: string | null
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            faq: {
                Row: {
                    id: string
                    question: string
                    answer: string
                    order_position: number
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    question: string
                    answer: string
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    question?: string
                    answer?: string
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            milestones: {
                Row: {
                    id: string
                    year: string
                    event: string
                    image_url: string | null
                    order_position: number
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    year: string
                    event: string
                    image_url?: string | null
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    year?: string
                    event?: string
                    image_url?: string | null
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            facilities: {
                Row: {
                    id: string
                    title: string
                    description: string | null
                    icon: string
                    order_position: number
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    description?: string
                    icon?: string
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    description?: string
                    icon?: string
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            administrators: {
                Row: {
                    id: string
                    name: string
                    position: string
                    education: string | null
                    quote: string | null
                    photo_url: string | null
                    order_position: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    position: string
                    education?: string | null
                    quote?: string | null
                    photo_url?: string | null
                    order_position?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    position?: string
                    education?: string | null
                    quote?: string | null
                    photo_url?: string | null
                    order_position?: number
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            albums: {
                Row: {
                    id: string
                    title: string
                    description: string | null
                    cover_image: string | null
                    date: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    description?: string | null
                    cover_image?: string | null
                    date?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    description?: string | null
                    cover_image?: string | null
                    date?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            events: {
                Row: {
                    id: string
                    title: string
                    description: string | null
                    start_date: string
                    end_date: string | null
                    event_type: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    description?: string | null
                    start_date: string
                    end_date?: string | null
                    event_type?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    description?: string | null
                    start_date?: string
                    end_date?: string | null
                    event_type?: string
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            news: {
                Row: {
                    id: string
                    title: string
                    content: string
                    excerpt: string | null
                    image_url: string | null
                    category: string
                    published: boolean
                    published_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    content: string
                    excerpt?: string | null
                    image_url?: string | null
                    category?: string
                    published?: boolean
                    published_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    content?: string
                    excerpt?: string | null
                    image_url?: string | null
                    category?: string
                    published?: boolean
                    published_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            photos: {
                Row: {
                    id: string
                    album_id: string
                    image_url: string
                    caption: string | null
                    order_position: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    album_id: string
                    image_url: string
                    caption?: string | null
                    order_position?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    album_id?: string
                    image_url?: string
                    caption?: string | null
                    order_position?: number
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "photos_album_id_fkey"
                        columns: ["album_id"]
                        isOneToOne: false
                        referencedRelation: "albums"
                        referencedColumns: ["id"]
                    }
                ]
            }
            school_settings: {
                Row: {
                    id: string
                    school_name: string | null
                    school_name_en: string | null
                    slogan: string | null
                    address: string | null
                    phone: string | null
                    email: string | null
                    website: string | null
                    facebook: string | null
                    line_id: string | null
                    vision: string | null
                    mission: string | null
                    logo_url: string | null
                    hero_image_url: string | null
                    about_text: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    school_name?: string | null
                    school_name_en?: string | null
                    slogan?: string | null
                    address?: string | null
                    phone?: string | null
                    email?: string | null
                    website?: string | null
                    facebook?: string | null
                    line_id?: string | null
                    vision?: string | null
                    mission?: string | null
                    logo_url?: string | null
                    hero_image_url?: string | null
                    about_text?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    school_name?: string | null
                    school_name_en?: string | null
                    slogan?: string | null
                    address?: string | null
                    phone?: string | null
                    email?: string | null
                    website?: string | null
                    facebook?: string | null
                    line_id?: string | null
                    vision?: string | null
                    mission?: string | null
                    logo_url?: string | null
                    hero_image_url?: string | null
                    about_text?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            staff: {
                Row: {
                    id: string
                    name: string
                    position: string
                    department: string | null
                    subject: string | null
                    education: string | null
                    experience: string | null
                    photo_url: string | null
                    staff_type: string
                    order_position: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    position: string
                    department?: string | null
                    subject?: string | null
                    education?: string | null
                    experience?: string | null
                    photo_url?: string | null
                    staff_type?: string
                    order_position?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    position?: string
                    department?: string | null
                    subject?: string | null
                    education?: string | null
                    experience?: string | null
                    photo_url?: string | null
                    staff_type?: string
                    order_position?: number
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            student_achievements: {
                Row: {
                    id: string
                    title: string
                    description: string | null
                    year: string | null
                    category: string | null
                    icon: string | null
                    order_position: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    description?: string | null
                    year?: string | null
                    category?: string | null
                    icon?: string | null
                    order_position?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    description?: string | null
                    year?: string | null
                    category?: string | null
                    icon?: string | null
                    order_position?: number
                    created_at?: string
                }
                Relationships: []
            }
            student_activities: {
                Row: {
                    id: string
                    name: string
                    members: number
                    description: string | null
                    order_position: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    members?: number
                    description?: string | null
                    order_position?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    members?: number
                    description?: string | null
                    order_position?: number
                    created_at?: string
                }
                Relationships: []
            }
            student_stats: {
                Row: {
                    id: string
                    label: string
                    value: string
                    icon: string
                    color: string
                    order_position: number
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    label: string
                    value: string
                    icon?: string
                    color?: string
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    label?: string
                    value?: string
                    icon?: string
                    color?: string
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                }
                Relationships: []
            }
            grade_data: {
                Row: {
                    id: string
                    level: string
                    rooms: number
                    students: number
                    boys: number
                    girls: number
                    order_position: number
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    level: string
                    rooms?: number
                    students?: number
                    boys?: number
                    girls?: number
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    level?: string
                    rooms?: number
                    students?: number
                    boys?: number
                    girls?: number
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                }
                Relationships: []
            }
            student_council: {
                Row: {
                    id: string
                    name: string
                    position: string
                    class: string | null
                    initial: string | null
                    image_url: string | null
                    order_position: number
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    position: string
                    class?: string
                    initial?: string
                    image_url?: string
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    position?: string
                    class?: string
                    initial?: string
                    image_url?: string
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                }
                Relationships: []
            }
            newsletters: {
                Row: {
                    id: string
                    issue_no: string
                    academic_year: string
                    issue_date: string
                    title: string
                    summary: string | null
                    content: string | null
                    category: string
                    image_url: string | null
                    file_url: string | null
                    views: number
                    is_published: boolean
                    order_position: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    issue_no?: string
                    academic_year?: string
                    issue_date?: string
                    title: string
                    summary?: string | null
                    content?: string | null
                    category?: string
                    image_url?: string | null
                    file_url?: string | null
                    views?: number
                    is_published?: boolean
                    order_position?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    issue_no?: string
                    academic_year?: string
                    issue_date?: string
                    title?: string
                    summary?: string | null
                    content?: string | null
                    category?: string
                    image_url?: string | null
                    file_url?: string | null
                    views?: number
                    is_published?: boolean
                    order_position?: number
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            media_resources: {
                Row: {
                    id: string
                    teacher_name: string
                    teacher_photo_url: string | null
                    subject_department: string
                    title: string
                    description: string | null
                    google_site_url: string
                    grade_level: string | null
                    badge_color: string
                    views: number
                    order_position: number
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    teacher_name: string
                    teacher_photo_url?: string | null
                    subject_department?: string
                    title: string
                    description?: string | null
                    google_site_url: string
                    grade_level?: string | null
                    badge_color?: string
                    views?: number
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    teacher_name?: string
                    teacher_photo_url?: string | null
                    subject_department?: string
                    title?: string
                    description?: string | null
                    google_site_url?: string
                    grade_level?: string | null
                    badge_color?: string
                    views?: number
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            admin_users: {
                Row: {
                    id: string
                    username: string
                    password: string
                    display_name: string
                    email: string | null
                    role: string
                    permissions: string[]
                    is_active: boolean
                    last_login: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    username: string
                    password: string
                    display_name: string
                    email?: string | null
                    role?: string
                    permissions?: string[]
                    is_active?: boolean
                    last_login?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    username?: string
                    password?: string
                    display_name?: string
                    email?: string | null
                    role?: string
                    permissions?: string[]
                    is_active?: boolean
                    last_login?: string | null
                    created_at?: string
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
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
    EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
    ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
    ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never