/*
  # Remove Prompt Enhancement System

  1. Cleanup
    - Drop trigger and function for updated_at
    - Drop all RLS policies for prompt-related tables
    - Drop all indexes for prompt-related tables
    - Drop tables: prompt_improvements, prompt_feedback, prompts

  2. Reason
    - This system is not related to the hospital management application
    - Removing unused functionality to clean up the database
    - Eliminating potential sources of errors from missing Edge Functions
*/

-- Drop trigger first
DROP TRIGGER IF EXISTS update_prompts_updated_at ON prompts;

-- Note: NOT dropping update_updated_at_column() function as it's used by other tables

-- Drop all RLS policies for prompts table
DROP POLICY IF EXISTS "Anyone can create prompts" ON prompts;
DROP POLICY IF EXISTS "Users can view their own prompts" ON prompts;
DROP POLICY IF EXISTS "Users can update their own prompts" ON prompts;
DROP POLICY IF EXISTS "Users can delete their own prompts" ON prompts;

-- Drop all RLS policies for prompt_feedback table
DROP POLICY IF EXISTS "Anyone can create feedback" ON prompt_feedback;
DROP POLICY IF EXISTS "Anyone can view feedback" ON prompt_feedback;

-- Drop all RLS policies for prompt_improvements table
DROP POLICY IF EXISTS "Anyone can view improvements" ON prompt_improvements;
DROP POLICY IF EXISTS "System can create improvements" ON prompt_improvements;

-- Drop indexes
DROP INDEX IF EXISTS idx_prompt_improvements_prompt_id;
DROP INDEX IF EXISTS idx_prompt_feedback_prompt_id;
DROP INDEX IF EXISTS idx_prompts_created_at;
DROP INDEX IF EXISTS idx_prompts_status;
DROP INDEX IF EXISTS idx_prompts_user_id;

-- Drop tables (in correct order due to foreign key constraints)
DROP TABLE IF EXISTS prompt_improvements;
DROP TABLE IF EXISTS prompt_feedback;
DROP TABLE IF EXISTS prompts;
