-- Add notes field to leads for storing web quote form details
alter table leads add column if not exists notes text;
