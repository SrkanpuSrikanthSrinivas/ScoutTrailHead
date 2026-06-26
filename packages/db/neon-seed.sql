-- ============================================================
--  Trailhead — OPTIONAL demo seed
--  Run AFTER neon-setup.sql. Creates a TROOP 216 you can log into.
--  Logins (all password: password123):
--    admin@example.com    (admin)
--    web@example.com      (web setup)
--    finance@example.com  (finance)
--  After running, scroll to the final SELECT for your invite/intake code.
-- ============================================================

DO $$
DECLARE
  t_id uuid;
  s_id uuid;
  code text := upper(substr(md5(random()::text), 1, 8));
  pw   text := '$2a$10$E2G7hWcTWWCL6Xay2Q07Q.O9zMQqXhhJW0WVM41u0y.wwlxBe7S02';   -- bcrypt hash of "password123"
BEGIN
  INSERT INTO troops (name, invite_code) VALUES ('TROOP 216 100', code) RETURNING id INTO t_id;

  INSERT INTO users (troop_id, email, password_hash, name, role) VALUES
    (t_id, 'admin@example.com',   pw, 'Troop Admin',   'admin'),
    (t_id, 'web@example.com',     pw, 'Wendy Web',     'web_setup'),
    (t_id, 'finance@example.com', pw, 'Frank Finance', 'finance');

  -- a scout waiting in each stage of the workflow
  INSERT INTO scouts (troop_id, name, type, status, parent_name, contact)
    VALUES (t_id, 'Aiden Rao', 'new', 'submitted', 'Aiden''s parent', 'parent@example.com') RETURNING id INTO s_id;
  INSERT INTO scout_events (scout_id, actor, action, to_status) VALUES (s_id, 'Parent intake', 'Submitted via intake link', 'submitted');

  INSERT INTO scouts (troop_id, name, type, status, parent_name, contact)
    VALUES (t_id, 'Maya Chen', 'new', 'web_setup', 'Maya''s parent', 'parent@example.com') RETURNING id INTO s_id;
  INSERT INTO scout_events (scout_id, actor, action, to_status) VALUES
    (s_id, 'Parent intake', 'Submitted via intake link', 'submitted'),
    (s_id, 'Wendy Web', 'Start web setup', 'web_setup');

  INSERT INTO scouts (troop_id, name, type, status, parent_name, contact, rank)
    VALUES (t_id, 'Leo Park', 'transfer', 'finance', 'Leo''s parent', 'parent@example.com', 'First Class') RETURNING id INTO s_id;
  INSERT INTO scout_events (scout_id, actor, action, to_status) VALUES
    (s_id, 'Parent intake', 'Submitted via intake link', 'submitted'),
    (s_id, 'Wendy Web', 'Sent to finance', 'finance');

  -- one already-approved scout on the roster
  INSERT INTO scouts (troop_id, name, type, status, rank, joined)
    VALUES (t_id, 'Sofia Nguyen', 'new', 'active', 'Tenderfoot', CURRENT_DATE) RETURNING id INTO s_id;
  INSERT INTO scout_events (scout_id, actor, action, to_status) VALUES (s_id, 'Frank Finance', 'Payment confirmed — approved to roster', 'active');

  INSERT INTO inventory (troop_id, name, category, total, out, min) VALUES
    (t_id, '4-person dome tent', 'Tents', 8, 2, 2),
    (t_id, '2-person backpacking tent', 'Tents', 6, 0, 1),
    (t_id, 'Troop flag', 'Flags', 1, 0, 1),
    (t_id, 'U.S. flag', 'Flags', 2, 0, 1),
    (t_id, 'Patrol flags', 'Flags', 4, 1, 1),
    (t_id, 'Camp stove (propane)', 'Equipment', 4, 0, 1),
    (t_id, 'Dutch oven', 'Equipment', 3, 0, 1),
    (t_id, 'First aid kit', 'Equipment', 5, 1, 2),
    (t_id, 'Lantern', 'Equipment', 6, 0, 2),
    (t_id, 'Blank merit badge backing', 'Merit Badges', 40, 0, 10),
    (t_id, 'First Aid badge (stock)', 'Merit Badges', 6, 0, 3),
    (t_id, 'Camping badge (stock)', 'Merit Badges', 5, 0, 3);

  INSERT INTO faqs (troop_id, question, answer, position) VALUES
    (t_id, 'How does my child join the troop?', 'Use the troop''s online intake link to submit your scout''s details. The request goes to our web setup committee to get records and accounts ready, then to finance to confirm fees. Once payment clears, your scout is added to the active roster.', 0),
    (t_id, 'What does it cost to register?', 'There''s an annual BSA national fee plus a council fee, and our troop has modest annual dues covering advancement awards, activities, and equipment. Ask the committee for this year''s exact figures — financial aid is available so cost is never a barrier.', 1),
    (t_id, 'My child is transferring from another troop — what''s different?', 'Transfers keep their rank and earned merit badges. During web setup we pull records from Scoutbook so advancement carries over. Bring the prior unit number and BSA member ID if you have them.', 2),
    (t_id, 'What does my scout need for the first campout?', 'Standard Scout basics: water bottle, mess kit, weather-appropriate clothing, sleeping bag, and a flashlight. The troop provides tents, cooking gear, and patrol equipment — see the Gear list for what''s on hand.', 3),
    (t_id, 'How do advancement and merit badges work?', 'Scouts progress through ranks from Scout to Eagle at their own pace. Merit badges are earned with approved counselors. We record each scout''s rank and which badges are earned and physically awarded.', 4),
    (t_id, 'Who do I contact with questions?', 'Reach out to the troop committee or your patrol leader. Scoutmaster handles program, committee handles registration and finances, and the advancement chair handles badges and ranks.', 5);
END $$;

-- Your troop invite code (committee join) + parent intake link path /intake/<CODE>:
SELECT name AS troop, invite_code AS code FROM troops ORDER BY created_at DESC LIMIT 1;
