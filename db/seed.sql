-- Demo events. All venues and links are FICTIONAL placeholders.
-- scripts/init-db.js runs this file only once (tracked in app_meta),
-- and only when SEED_DEMO_EVENTS is not "false".
-- Dates are relative to the day the seed runs, in UK local time.

INSERT INTO events (slug, title, format, theme, region, starts_at, duration_minutes, venue_name, venue_address, online_link, capacity, description)
SELECT v.slug, v.title, v.format, v.theme, v.region,
       ((date_trunc('day', now() AT TIME ZONE 'Europe/London') + v.offset_interval) AT TIME ZONE 'Europe/London'),
       v.duration_minutes, v.venue_name, v.venue_address, v.online_link, v.capacity, v.description
FROM (VALUES
  ('early-start-online-huddle-demo',
   'Early Start Online Huddle',
   'online', 'general', '',
   interval '2 days 07:30', 75,
   '', '', 'https://meet.example.com/nh-early-start-demo', 30,
   'A relaxed online meeting to start the day. Everyone gets a short slot to say who they help and what kind of introduction would make their week. Afterwards we split into small breakout rooms so you can talk properly.' || E'\n\n' || 'Bring a coffee and a one-line pitch. Cameras on if you can.'),

  ('b2b-referral-roundtable-demo',
   'B2B Referral Roundtable',
   'online', 'b2b', '',
   interval '4 days 12:00', 60,
   '', '', 'https://meet.example.com/nh-b2b-roundtable-demo', 24,
   'For businesses that sell to other businesses. Each attendee shares one ideal client profile and one introduction they can offer. The host keeps track of who asked for what so nobody leaves without a follow-up.'),

  ('speed-huddle-lunchtime-demo',
   'Lunchtime Speed Huddle',
   'speed', 'general', '',
   interval '5 days 12:30', 45,
   '', '', 'https://meet.example.com/nh-speed-lunch-demo', 20,
   'Six-minute one-to-one rounds in private video rooms, rotated automatically. You will meet up to six people in 45 minutes. Have your contact details ready to paste in the chat.'),

  ('women-in-business-coffee-online-demo',
   'Women in Business Coffee Morning',
   'online', 'women', '',
   interval '6 days 10:00', 60,
   '', '', 'https://meet.example.com/nh-women-coffee-demo', 25,
   'A supportive online meeting for women running or growing a business. A short talk from a member about something that worked for them, then open discussion and introductions. Everyone is welcome to attend.'),

  ('leeds-breakfast-huddle-demo',
   'Leeds Breakfast Huddle',
   'face2face', 'general', 'yorkshire',
   interval '8 days 07:15', 105,
   'The Lantern Room (demo venue)', '14 Quayside Walk, Leeds (fictional address for demo purposes)', '', 18,
   'Full cooked or continental breakfast with a table of local business owners. Round-the-table introductions, a ten-minute member spotlight and plenty of time to arrange follow-up 1-1s.' || E'\n\n' || 'Breakfast is paid for at the venue.'),

  ('manchester-evening-mixer-demo',
   'Manchester Evening Mixer',
   'face2face', 'general', 'north-west',
   interval '9 days 18:00', 120,
   'The Copper Kettle Bar (demo venue)', '3 Mill Yard Lane, Manchester (fictional address for demo purposes)', '', 30,
   'An after-work mixer for members and visitors across the North West. No formal pitches, just good conversation, a short welcome from the host and introductions where they help.'),

  ('money-matters-online-demo',
   'Money Matters: Cash Flow Clinic',
   'online', 'money-matters', '',
   interval '11 days 13:00', 60,
   '', '', 'https://meet.example.com/nh-money-matters-demo', 40,
   'A themed meeting about the money side of running a business. A member accountant leads a 15-minute practical session on cash flow forecasting, followed by networking breakouts. Not financial advice.'),

  ('neuro-inclusive-online-demo',
   'Neuro-inclusive Networking',
   'online', 'neuro-inclusive', '',
   interval '12 days 11:00', 60,
   '', '', 'https://meet.example.com/nh-neuro-inclusive-demo', 16,
   'A calmer, structured format: the agenda is shared in advance, the chat is always an option instead of speaking, and cameras are optional. Smaller groups and clear time-keeping throughout.'),

  ('bristol-brunch-huddle-demo',
   'Bristol Brunch Huddle',
   'face2face', 'general', 'south-west',
   interval '13 days 10:30', 120,
   'Harbourside Kitchen (demo venue)', '27 Ferry Steps, Bristol (fictional address for demo purposes)', '', 16,
   'A late-morning brunch meeting for people who prefer not to start at dawn. Introductions, a member spotlight and time to book 1-1s with each other.'),

  ('cross-border-trade-online-demo',
   'Cross-border Trade Huddle',
   'online', 'cross-border', '',
   interval '15 days 09:00', 60,
   '', '', 'https://meet.example.com/nh-cross-border-demo', 30,
   'For UK businesses selling abroad and overseas businesses selling into the UK. Swap contacts, practical tips on logistics and partners, and introductions across markets.')
) AS v(slug, title, format, theme, region, offset_interval, duration_minutes, venue_name, venue_address, online_link, capacity, description)
ON CONFLICT (slug) DO NOTHING;
