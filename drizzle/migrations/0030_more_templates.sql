-- The emails the switched-off journeys send. Writing them here does not turn
-- anything on: the enable guard still refuses a journey until every template
-- it references exists, and these journeys also wait on events that nothing
-- emits yet.
--
-- Merge fields resolve from the triggering event's payload, so a step that
-- says {taping_date} requires the event that starts the run to carry
-- taping_date. Where a value is missing the field renders empty rather than
-- printing the placeholder.

-- ---------------------------------------------------------------- waitlist
select public.seed_template('waitlist_first_access', 'show',
  'Seats are open, {first_name}',
  '<p>You were on the waitlist, so you get first access. Seats for the first tapings are open to you before anyone else.</p>
   <p><a class="btn" href="{site_url}/tickets">Reserve your seat</a></p>
   <p>The rest of the list hears about it in a few days.</p>');

select public.seed_template('waitlist_first_access_reminder', 'show',
  'Your early access is still open',
  '<p>A reminder that your seat is still reservable. Once first access closes the remaining seats go to everyone.</p>
   <p><a class="btn" href="{site_url}/tickets">Reserve your seat</a></p>');

-- ------------------------------------------------------------------ visits
select public.seed_template('ticket_confirmation', 'show',
  'You have a seat for {taping_date}',
  '<p>Your seat is reserved for <strong>{taping_date}</strong> at Studio A in San Jose.</p>
   <p>We will write again two days before with everything you need for the night.</p>
   <p><a class="btn" href="{site_url}/account">See your reservation</a></p>');

select public.seed_template('after_recording_thanks', 'show',
  'Thank you for being in the room',
  '<p>A room with people in it is what makes the show work, and you were in it. Thank you.</p>
   <p>If you took a photo at the backdrop, tag us and we will share it.</p>
   <p>The episode takes a few weeks to cut. We will send it to you the day it goes out.</p>');

select public.seed_template('you_were_in_the_room', 'show',
  'The episode you saw taped is out',
  '<p>The episode from <strong>{taping_date}</strong> is live. You were there when it happened.</p>
   <p><a class="btn" href="{episode_url}">Watch it</a></p>');

select public.seed_template('reserve_your_next', 'show',
  'Come back, {first_name}',
  '<p>If you enjoyed the last one, the next tapings are open.</p>
   <p><a class="btn" href="{site_url}/tickets">See what is coming up</a></p>');

select public.seed_template('we_missed_you', 'show',
  'We missed you, {first_name}',
  '<p>Your seat was held for <strong>{taping_date}</strong> and stayed empty. No hard feelings &mdash; things come up.</p>
   <p>If you still want to come, booking again takes a minute.</p>
   <p><a class="btn" href="{site_url}/tickets">Pick another date</a></p>
   <p>If you would rather we stopped holding seats for you, just say so and we will.</p>');

select public.seed_template('vip_upgrade_offer', 'show',
  'VIP seats just opened for {taping_date}',
  '<p>You are holding a general admission seat for <strong>{taping_date}</strong>. A few VIP seats have been released.</p>
   <p>VIP is closer to the stage and seated first.</p>
   <p><a class="btn" href="{site_url}/account">Upgrade your seat</a></p>
   <p>If you are happy where you are, ignore this &mdash; your seat is not going anywhere.</p>');

select public.seed_template('serve_and_give', 'show',
  'You keep coming back, {first_name}',
  '<p>That is three tapings now. The people who keep turning up are the reason there is a show at all.</p>
   <p>Two ways to go further, both entirely optional:</p>
   <ul>
     <li><a href="{site_url}/serve">Serve on the crew</a> &mdash; the door, the Kids'' Room, the shuttle.</li>
     <li><a href="{site_url}/give">Give monthly</a> &mdash; what keeps the lights on between seasons.</li>
   </ul>');

-- -------------------------------------------------------------- Kids'' Room
select public.seed_template('kids_room_details', 'show',
  'Kids'' Room for {taping_date}',
  '<p>Your children are registered for the Kids'' Room on <strong>{taping_date}</strong>.</p>
   <p>There are two rooms, each with six places: one for newborn through four, one for five through ten. Check in at the Kids'' Room desk before you take your seat, and bring anything your child needs for about two hours.</p>
   <p>Whoever checks a child in is the only person who can check them out.</p>');

select public.seed_template('kids_room_recap', 'show',
  'How it went in the Kids'' Room',
  '<p>Thank you for trusting us with your children. They were looked after by the same crew who will be there next time.</p>
   <p>If anything could have gone better, tell us plainly &mdash; a small room only works if we hear about it early.</p>');

-- ------------------------------------------------------------------ giving
select public.seed_template('gift_thank_you', 'show',
  'Thank you, {first_name}',
  '<p>Your gift of <strong>{amount}</strong> came through. Thank you.</p>
   <p>Keep this email: it is your record of the gift.</p>
   <p>We are a non-profit pending, so this is not yet tax deductible. We will write to everyone who gave once that status comes through.</p>');

select public.seed_template('invite_monthly', 'show',
  'Would you give monthly, {first_name}?',
  '<p>You have given twice now, which puts you among a small number of people carrying this.</p>
   <p>A monthly gift, at any size, is what lets us plan past the next taping instead of up to it.</p>
   <p><a class="btn" href="{site_url}/give">Give monthly</a></p>
   <p>One-off gifts matter just as much. This is an invitation, not a nudge.</p>');

select public.seed_template('gentle_second_gift', 'show',
  'A month on',
  '<p>You gave a month ago and we have not asked since. This is the once.</p>
   <p>If it is the right time, the page is here. If it is not, that is genuinely fine.</p>
   <p><a class="btn" href="{site_url}/give">Give again</a></p>');

select public.seed_template('can_we_help', 'show',
  'Can we help, {first_name}?',
  '<p>Your monthly gift stopped. If that was deliberate, thank you for everything you gave &mdash; no explanation needed.</p>
   <p>If it was a card expiring or a bank change, we can sort it out in a minute. Just reply.</p>');

-- ---------------------------------------------------------------- sponsors
select public.seed_template('sponsor_welcome', 'show',
  'Welcome aboard, {first_name}',
  '<p>Thank you for sponsoring the IHNM Show. You are a founding sponsor, which is a thing that can only be true once.</p>
   <p>To get you on air we need:</p>
   <ul>
     <li>Your logo, as SVG or a PNG at least 1000px wide</li>
     <li>The exact wording of your name as you want it read</li>
     <li>A link for the audience to follow</li>
   </ul>
   <p>Reply with those and we will take it from there.</p>');

-- ------------------------------------------------------------- volunteers
select public.seed_template('volunteer_welcome', 'show',
  'Thank you for signing up to serve',
  '<p>Thank you for putting your name down. Crew is how a taping actually happens: the door, the Kids'' Room, the shuttle, the floor.</p>
   <p>We will send you shift details two days before and again two hours before, so you do not have to remember anything.</p>
   <p><a class="btn" href="{site_url}/serve">See what the roles involve</a></p>');

select public.seed_template('shift_reminder_2_days', 'show',
  'Your shift on {shift_date}',
  '<p>You are on the crew for <strong>{shift_date}</strong> at Studio A in San Jose.</p>
   <p>Role: <strong>{role}</strong>.</p>
   <p>If something has come up, tell us now rather than on the night &mdash; we can cover it with notice.</p>');

select public.seed_template('shift_reminder_2_hours', 'show',
  'See you shortly',
  '<p>Your shift is in about two hours. Role: <strong>{role}</strong>.</p>
   <p>Studio A, San Jose. See you there.</p>');

select public.seed_template('volunteer_five_shifts', 'show',
  'Five shifts, {first_name}',
  '<p>That is five shifts you have served. Most people never get past one.</p>
   <p>Nothing is being asked of you here. We just did not want it to go unsaid.</p>');

select public.seed_template('volunteer_come_back', 'show',
  'We would love to have you back',
  '<p>It has been a while since your last shift. No obligation at all &mdash; but if the season has changed for you, there is always a place.</p>
   <p><a class="btn" href="{site_url}/serve">Pick up a shift</a></p>');

-- ----------------------------------------------------------------- rentals
select public.seed_template('rental_quote_reminder', 'show',
  'Your studio quote is saved',
  '<p>You started a quote for Studio A and did not finish it. It is still here.</p>
   <p><a class="btn" href="{site_url}/rent">Pick up where you left off</a></p>');

select public.seed_template('rental_quote_last_call', 'show',
  'Still want the studio?',
  '<p>Your quote is a day old. Dates go in the order they are booked, so if you have one in mind it is worth holding now.</p>
   <p><a class="btn" href="{site_url}/rent">Finish your booking</a></p>
   <p>If the plan changed, no reply needed &mdash; we will not chase this again.</p>');

select public.seed_template('rental_thanks_review', 'show',
  'Thank you for using Studio A',
  '<p>Thank you for booking with us. We hope the room did what you needed.</p>
   <p>If you have two minutes, tell us how it went &mdash; what worked and what did not. We would rather hear it from you than guess.</p>');

select public.seed_template('rental_rebook', 'show',
  'The room is here when you need it',
  '<p>If the last session went well, the calendar is open.</p>
   <p><a class="btn" href="{site_url}/rent">Check available dates</a></p>');

-- ------------------------------------------------------------------ guests
select public.seed_template('guest_clip_pack', 'show',
  'Your episode is out, {first_name}',
  '<p>Your episode is live.</p>
   <p><a class="btn" href="{episode_url}">Watch it</a></p>
   <p>Reply and we will send you the clips cut for social, sized for each platform.</p>');

select public.seed_template('guest_posting_reminder', 'show',
  'A nudge about the clips',
  '<p>Your episode went out a few days ago. If you have not shared it yet, this is the moment it travels furthest.</p>
   <p><a class="btn" href="{episode_url}">Your episode</a></p>
   <p>Tag us and we will push it from our side too.</p>');

select public.seed_template('guest_episode_results', 'show',
  'How your episode did',
  '<p>A month on, here is how your episode travelled. Thank you for giving us the time.</p>
   <p><a class="btn" href="{episode_url}">Your episode</a></p>
   <p>If you would come back on, say the word.</p>');

-- ---------------------------------------------------------------- episodes
select public.seed_template('related_episode', 'show',
  'Another one on {topic}',
  '<p>You watched something of ours on {topic}. Here is the other one.</p>
   <p><a class="btn" href="{episode_url}">Watch it</a></p>');
