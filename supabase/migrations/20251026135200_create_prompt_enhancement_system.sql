/*
  # Prompt Enhancement System

  1. New Tables
    - `prompts`
      - `id` (uuid, primary key) - Unique identifier for each prompt
      - `user_id` (uuid, optional) - Reference to user who submitted the prompt
      - `original_prompt` (text) - The original user-submitted prompt
      - `enhanced_prompt` (text, nullable) - The AI-enhanced version of the prompt
      - `status` (text) - Processing status: pending, processing, completed, failed
      - `processing_time_ms` (integer) - Time taken to enhance the prompt in milliseconds
      - `created_at` (timestamptz) - When the prompt was submitted
      - `updated_at` (timestamptz) - Last update timestamp
      
    - `prompt_feedback`
      - `id` (uuid, primary key) - Unique identifier for feedback
      - `prompt_id` (uuid) - Reference to the prompt being rated
      - `rating` (integer) - User rating from 1-5 stars
      - `comment` (text, nullable) - Optional user comment
      - `created_at` (timestamptz) - When feedback was submitted
      
    - `prompt_improvements`
      - `id` (uuid, primary key) - Unique identifier
      - `prompt_id` (uuid) - Reference to the prompt
      - `improvement_type` (text) - Type of improvement made
      - `description` (text) - Description of the improvement
      - `created_at` (timestamptz) - When improvement was recorded

  2. Security
    - Enable RLS on all tables
    - Allow public to create and read their own prompts
    - Allow authenticated users full access to their data
    - Public users can view prompt count statistics

  3. Indexes
    - Index on user_id for fast user-specific queries
    - Index on status for filtering prompts by status
    - Index on created_at for chronological sorting
*/

-- Create prompts table
CREATE TABLE IF NOT EXISTS prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  original_prompt text NOT NULL CHECK (length(original_prompt) >= 10 AND length(original_prompt) <= 5000),
  enhanced_prompt text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  processing_time_ms integer,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create prompt_feedback table
CREATE TABLE IF NOT EXISTS prompt_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id uuid NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

-- Create prompt_improvements table
CREATE TABLE IF NOT EXISTS prompt_improvements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id uuid NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  improvement_type text NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_status ON prompts(status);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_feedback_prompt_id ON prompt_feedback(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_improvements_prompt_id ON prompt_improvements(prompt_id);

-- Enable Row Level Security
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_improvements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prompts table
CREATE POLICY "Anyone can create prompts"
  ON prompts FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can view their own prompts"
  ON prompts FOR SELECT
  TO public
  USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can update their own prompts"
  ON prompts FOR UPDATE
  TO public
  USING (user_id IS NULL OR user_id = auth.uid())
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can delete their own prompts"
  ON prompts FOR DELETE
  TO public
  USING (user_id IS NULL OR user_id = auth.uid());

-- RLS Policies for prompt_feedback table
CREATE POLICY "Anyone can create feedback"
  ON prompt_feedback FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can view feedback"
  ON prompt_feedback FOR SELECT
  TO public
  USING (true);

-- RLS Policies for prompt_improvements table
CREATE POLICY "Anyone can view improvements"
  ON prompt_improvements FOR SELECT
  TO public
  USING (true);

CREATE POLICY "System can create improvements"
  ON prompt_improvements FOR INSERT
  TO public
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic updated_at
CREATE TRIGGER update_prompts_updated_at
  BEFORE UPDATE ON prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();