-- Tag the 15 existing full-swing catalog issues for the goal-first library:
-- plain-language title/description + goal (WHY) and miss (WHAT) tags.
--
-- Mapping is a best-effort first pass. Confident ones: direction faults -> SLICE/
-- PULL/PUSH + STRAIGHTER; power leaks -> THIN/LOW_WEAK + DISTANCE; posture/contact
-- faults -> THIN/FAT + CONTACT. The three marked (REVIEW) are genuinely ambiguous
-- on ball flight — adjust the miss if your coaching read differs.
--
-- Idempotent: safe to re-run. Only valid goal/miss values (see the CHECK
-- constraints in 20260711000000_issue_goal_miss.sql) are used.

-- ---------- plain-language copy ----------
UPDATE public.issues SET
  layman_title = 'You come over the top',
  layman_desc  = 'Your shoulders start the downswing, so the club swings across the ball. This is the classic slice (or a pull).'
WHERE id = '09584930-fd03-4d53-aa50-295d4cd1adac';

UPDATE public.issues SET
  layman_title = 'Flat shoulder turn',
  layman_desc  = 'Your lead shoulder stays level instead of tilting down, throwing the club off plane and costing crisp contact.'
WHERE id = '103a42d5-e760-4ead-8233-03e4a4ee6d52';

UPDATE public.issues SET
  layman_title = 'You cast the club',
  layman_desc  = 'You throw the clubhead out early from the top, so you lose power and catch it thin or weak.'
WHERE id = '19040c4b-3def-4115-89a3-25498abad378';

UPDATE public.issues SET
  layman_title = 'You scoop at impact',
  layman_desc  = 'You flick your wrists to lift the ball, adding loft and causing thin or fat strikes.'
WHERE id = '34e1e4b5-8b0b-417f-b564-acbcf4058449';

UPDATE public.issues SET
  layman_title = 'You stand up in the downswing (early extension)',
  layman_desc  = 'Your hips push toward the ball and your chest rises, so your arms get stuck. That leads to blocks to the right and thin strikes.'
WHERE id = '4660a447-3c46-4d3f-97a8-ef324c775271';

UPDATE public.issues SET
  layman_title = 'You sway off the ball',
  layman_desc  = 'Your hips slide away from the target instead of turning, so you can''t get your weight forward. Fat and thin contact.'
WHERE id = '6f1dcde9-9291-412b-a5e5-998aa7377a28';

UPDATE public.issues SET
  layman_title = 'Flying elbow at the top',
  layman_desc  = 'Your trail elbow lifts away from your body at the top, upsetting timing and making contact inconsistent.'
WHERE id = '7b82de13-11f1-4a31-b098-0d062f7330c1';

UPDATE public.issues SET
  layman_title = 'Chicken wing through impact',
  layman_desc  = 'Your lead arm collapses and bends at impact, killing width and speed. Weak, thin shots.'
WHERE id = '9b7574a6-724d-4852-b9bb-5e867f06d5de';

UPDATE public.issues SET
  layman_title = 'You slide past the ball',
  layman_desc  = 'Your lower body slides toward the target instead of rotating, so the club lags behind and you push it right.'
WHERE id = '9dd1a334-7b77-4e0c-a2cd-1fe3339cbfc3';

UPDATE public.issues SET
  layman_title = 'You lunge toward the target',
  layman_desc  = 'Your upper body drives ahead of your hips, steepening the swing. Steep, spinny, inconsistent strikes.'
WHERE id = 'b0735202-6482-44e6-b7c0-8648d3749052';

UPDATE public.issues SET
  layman_title = 'Reverse spine at the top',
  layman_desc  = 'Your upper body tilts toward the target at the top, stalling your legs. Power loss and slices.'
WHERE id = 'bc3041a7-dfba-4f73-b775-e1d76ed66509';

UPDATE public.issues SET
  layman_title = 'You lose your posture',
  layman_desc  = 'You stand up out of your spine angle through the ball, so contact wanders. Thin and fat strikes.'
WHERE id = 'c280834c-2924-4833-8661-096f9f18c2fb';

UPDATE public.issues SET
  layman_title = 'S-posture at address',
  layman_desc  = 'Your lower back over-arches at setup, switching off your core and costing consistent contact.'
WHERE id = 'd0d6a146-4d3e-400e-bc09-edd930221a10';

UPDATE public.issues SET
  layman_title = 'C-posture at address',
  layman_desc  = 'A rounded upper back and slumped shoulders limit your turn, cutting power and consistency.'
WHERE id = 'd525a0d5-92df-4dd3-85b3-41191f793bda';

UPDATE public.issues SET
  layman_title = 'You hang back',
  layman_desc  = 'Your weight stays on your back foot through impact, so you hit the ground behind the ball or lose speed.'
WHERE id = 'fef8fbdd-353c-4c68-b2a5-f1cc0512a355';

-- ---------- goal tags (WHY) ----------
INSERT INTO public.issue_goals (issue_id, goal) VALUES
  ('09584930-fd03-4d53-aa50-295d4cd1adac','STRAIGHTER'),
  ('09584930-fd03-4d53-aa50-295d4cd1adac','DISTANCE'),
  ('09584930-fd03-4d53-aa50-295d4cd1adac','BIG_MISS'),
  ('103a42d5-e760-4ead-8233-03e4a4ee6d52','CONTACT'),   -- REVIEW: flat shoulder plane
  ('103a42d5-e760-4ead-8233-03e4a4ee6d52','DISTANCE'),
  ('19040c4b-3def-4115-89a3-25498abad378','DISTANCE'),
  ('19040c4b-3def-4115-89a3-25498abad378','CONTACT'),
  ('34e1e4b5-8b0b-417f-b564-acbcf4058449','DISTANCE'),
  ('34e1e4b5-8b0b-417f-b564-acbcf4058449','CONTACT'),
  ('4660a447-3c46-4d3f-97a8-ef324c775271','CONTACT'),
  ('4660a447-3c46-4d3f-97a8-ef324c775271','STRAIGHTER'),
  ('6f1dcde9-9291-412b-a5e5-998aa7377a28','CONTACT'),
  ('6f1dcde9-9291-412b-a5e5-998aa7377a28','DISTANCE'),
  ('7b82de13-11f1-4a31-b098-0d062f7330c1','CONTACT'),   -- REVIEW: flying elbow
  ('7b82de13-11f1-4a31-b098-0d062f7330c1','DISTANCE'),
  ('9b7574a6-724d-4852-b9bb-5e867f06d5de','DISTANCE'),
  ('9b7574a6-724d-4852-b9bb-5e867f06d5de','CONTACT'),
  ('9dd1a334-7b77-4e0c-a2cd-1fe3339cbfc3','STRAIGHTER'),
  ('9dd1a334-7b77-4e0c-a2cd-1fe3339cbfc3','DISTANCE'),
  ('b0735202-6482-44e6-b7c0-8648d3749052','CONTACT'),   -- REVIEW: forward lunge
  ('bc3041a7-dfba-4f73-b775-e1d76ed66509','STRAIGHTER'),
  ('bc3041a7-dfba-4f73-b775-e1d76ed66509','DISTANCE'),
  ('bc3041a7-dfba-4f73-b775-e1d76ed66509','BIG_MISS'),
  ('c280834c-2924-4833-8661-096f9f18c2fb','CONTACT'),
  ('d0d6a146-4d3e-400e-bc09-edd930221a10','CONTACT'),
  ('d525a0d5-92df-4dd3-85b3-41191f793bda','CONTACT'),
  ('d525a0d5-92df-4dd3-85b3-41191f793bda','DISTANCE'),
  ('fef8fbdd-353c-4c68-b2a5-f1cc0512a355','CONTACT'),
  ('fef8fbdd-353c-4c68-b2a5-f1cc0512a355','DISTANCE')
ON CONFLICT (issue_id, goal) DO NOTHING;

-- ---------- miss tags (WHAT the golfer sees) ----------
INSERT INTO public.issue_misses (issue_id, miss) VALUES
  ('09584930-fd03-4d53-aa50-295d4cd1adac','SLICE'),
  ('09584930-fd03-4d53-aa50-295d4cd1adac','PULL'),
  ('103a42d5-e760-4ead-8233-03e4a4ee6d52','THIN'),      -- REVIEW: flat shoulder plane
  ('19040c4b-3def-4115-89a3-25498abad378','THIN'),
  ('19040c4b-3def-4115-89a3-25498abad378','LOW_WEAK'),
  ('34e1e4b5-8b0b-417f-b564-acbcf4058449','THIN'),
  ('34e1e4b5-8b0b-417f-b564-acbcf4058449','FAT'),
  ('4660a447-3c46-4d3f-97a8-ef324c775271','PUSH'),
  ('4660a447-3c46-4d3f-97a8-ef324c775271','THIN'),
  ('6f1dcde9-9291-412b-a5e5-998aa7377a28','FAT'),
  ('6f1dcde9-9291-412b-a5e5-998aa7377a28','THIN'),
  ('7b82de13-11f1-4a31-b098-0d062f7330c1','THIN'),      -- REVIEW: flying elbow
  ('9b7574a6-724d-4852-b9bb-5e867f06d5de','THIN'),
  ('9b7574a6-724d-4852-b9bb-5e867f06d5de','LOW_WEAK'),
  ('9dd1a334-7b77-4e0c-a2cd-1fe3339cbfc3','PUSH'),
  ('9dd1a334-7b77-4e0c-a2cd-1fe3339cbfc3','THIN'),
  ('b0735202-6482-44e6-b7c0-8648d3749052','FAT'),       -- REVIEW: forward lunge
  ('b0735202-6482-44e6-b7c0-8648d3749052','THIN'),
  ('bc3041a7-dfba-4f73-b775-e1d76ed66509','SLICE'),
  ('c280834c-2924-4833-8661-096f9f18c2fb','THIN'),
  ('c280834c-2924-4833-8661-096f9f18c2fb','FAT'),
  ('d0d6a146-4d3e-400e-bc09-edd930221a10','THIN'),
  ('d0d6a146-4d3e-400e-bc09-edd930221a10','FAT'),
  ('d525a0d5-92df-4dd3-85b3-41191f793bda','THIN'),
  ('fef8fbdd-353c-4c68-b2a5-f1cc0512a355','FAT'),
  ('fef8fbdd-353c-4c68-b2a5-f1cc0512a355','THIN')
ON CONFLICT (issue_id, miss) DO NOTHING;
