-- Drops the two-rooms sentence: a parent has already picked a room by age
-- when they registered, so restating the split and the capacity only made the
-- email longer. Replaced with the arrival time, which is the thing a parent
-- actually needs to act on.
select public.seed_template('kids_room_details', 'show',
  'Kids'' Room for {taping_date}',
  '<p>Your children are registered for the Kids'' Room on <strong>{taping_date}</strong>.</p>
   <p>Please arrive 20 minutes before the taping. Check your children in at the Kids'' Room desk first, then take your seat &mdash; that is what gets you into the audience before we start. Bring anything your child needs for about two hours.</p>
   <p>Whoever checks a child in is the only person who can check them out.</p>');
