-- PLAYHUB Module 8: Template peak window columns

ALTER TABLE public.slot_templates
  ADD COLUMN IF NOT EXISTS peak_start_time TIME DEFAULT '17:00',
  ADD COLUMN IF NOT EXISTS peak_end_time TIME DEFAULT '22:00';

UPDATE public.slot_templates
SET
  peak_start_time = COALESCE(peak_start_time, '17:00'::time),
  peak_end_time = COALESCE(peak_end_time, '22:00'::time)
WHERE peak_start_time IS NULL OR peak_end_time IS NULL;
