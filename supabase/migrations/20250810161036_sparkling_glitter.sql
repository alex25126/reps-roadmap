/*
  # Create workout tracking tables

  1. New Tables
    - `exercises`
      - `id` (uuid, primary key)
      - `name` (text)
      - `muscle_group` (text)
      - `sets` (integer)
      - `reps` (integer)
      - `weight` (numeric, optional)
      - `day` (text)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamp)
    - `progress_logs`
      - `id` (uuid, primary key)
      - `date` (date)
      - `muscle_group` (text)
      - `weight` (numeric, optional)
      - `reps` (integer, optional)
      - `notes` (text, optional)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
*/

-- Create exercises table
CREATE TABLE IF NOT EXISTS exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  muscle_group text NOT NULL,
  sets integer NOT NULL DEFAULT 1,
  reps integer NOT NULL DEFAULT 1,
  weight numeric,
  day text NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create progress_logs table
CREATE TABLE IF NOT EXISTS progress_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  muscle_group text NOT NULL,
  weight numeric,
  reps integer,
  notes text,
  user_id uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for exercises
CREATE POLICY "Users can manage their own exercises"
  ON exercises
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for progress_logs
CREATE POLICY "Users can manage their own progress logs"
  ON progress_logs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS exercises_user_id_idx ON exercises(user_id);
CREATE INDEX IF NOT EXISTS exercises_day_idx ON exercises(day);
CREATE INDEX IF NOT EXISTS progress_logs_user_id_idx ON progress_logs(user_id);
CREATE INDEX IF NOT EXISTS progress_logs_date_idx ON progress_logs(date);
CREATE INDEX IF NOT EXISTS progress_logs_muscle_group_idx ON progress_logs(muscle_group);