export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, Json | string | number | null>;
        Insert: Record<string, Json | string | number | null>;
        Update: Record<string, Json | string | number | null>;
      };
    };
  };
}
