-- The fourteen seed journeys. Steps arrive as a jsonb array; this links them
-- into the step graph so the seed itself stays readable. A step may name a
-- branch target by position ("yes"/"no"), which is how a condition rejoins.
create or replace function public.seed_journey(
  _key text, _name text, _brand public.contact_brand, _trigger text,
  _goal text, _enabled boolean, _steps jsonb, _description text default null,
  _allow_reentry boolean default false
) returns uuid language plpgsql volatile security definer set search_path = public as $$
declare
  v_journey uuid;
  v_ids uuid[] := '{}';
  v_step jsonb;
  v_pos int := 0;
  v_id uuid;
  v_yes int;
  v_no int;
begin
  insert into public.journeys (key, name, description, brand, trigger_event,
                               goal_event, enabled, allow_reentry)
  values (_key, _name, _description, _brand, _trigger, _goal, _enabled, _allow_reentry)
  on conflict (key) do update set
    name = excluded.name, description = excluded.description, brand = excluded.brand,
    trigger_event = excluded.trigger_event, goal_event = excluded.goal_event,
    allow_reentry = excluded.allow_reentry
  returning id into v_journey;

  -- Re-seeding replaces the step graph. Runs pointing at a deleted step are
  -- ended rather than left dangling at a step that no longer exists.
  update public.journey_runs set status = 'exited', completed_at = now(), exit_reason = 'reseeded'
    where journey_id = v_journey and status = 'active';
  delete from public.journey_steps where journey_id = v_journey;

  for v_step in select * from jsonb_array_elements(_steps) loop
    v_pos := v_pos + 1;
    insert into public.journey_steps (journey_id, position, type, config)
    values (v_journey, v_pos, (v_step->>'type')::public.journey_step_type,
            coalesce(v_step->'config', '{}'::jsonb))
    returning id into v_id;
    v_ids := v_ids || v_id;
  end loop;

  -- Default flow is straight down; explicit targets override it.
  for v_pos in 1 .. coalesce(array_length(v_ids, 1), 0) loop
    v_step := _steps -> (v_pos - 1);
    v_yes := nullif(v_step->>'yes', '')::int;
    v_no  := nullif(v_step->>'no', '')::int;
    update public.journey_steps set
      next_step_id = case
        when v_step ? 'yes' then v_ids[v_yes]
        when v_step ? 'end' then null
        else v_ids[v_pos + 1] end,
      alt_step_id = case when v_step ? 'no' then v_ids[v_no] else null end
    where id = v_ids[v_pos];
  end loop;

  return v_journey;
end $$;

-- Templates hold the body only. The runner wraps every marketing send in the
-- brand layout and appends the unsubscribe link and postal address, so no
-- template can accidentally omit them.
create or replace function public.seed_template(
  _key text, _brand public.contact_brand, _subject text, _html text
) returns void language sql volatile security definer set search_path = public as $$
  insert into public.email_templates (key, brand, subject, html)
  values (_key, _brand, _subject, _html)
  on conflict (key) do update set
    brand = excluded.brand, subject = excluded.subject,
    html = excluded.html, updated_at = now()
$$;

select public.seed_template('waitlist_welcome', 'show',
  'You are on the list, {first_name}',
  '<p>Thanks for joining the waitlist for the IHNM Show. We tape in front of a live audience at Studio A in San Jose, and the first season starts in March 2027.</p>
   <p>You are number <strong>{position}</strong> in line. The first 100 people get first access to seats.</p>
   <p>Want to move up? Every friend who joins with your link moves you up five spots.</p>
   <p><a class="btn" href="{referral_url}">Share your link</a></p>');

select public.seed_template('waitlist_what_it_is', 'show',
  'What the IHNM Show actually is',
  '<p>A live-audience talk show about the Bible, history and what is happening right now &mdash; taped in a room with real people in it, not a studio talking into a camera.</p>
   <p>Each taping runs about ninety minutes. There is a Kids'' Room for children from newborn through ten, and the shuttle runs from the lot.</p>
   <p><a class="btn" href="{site_url}/about">Read what we believe</a></p>');

select public.seed_template('waitlist_share_nudge', 'show',
  'Move up the list, {first_name}',
  '<p>You have not shared your link yet. Here is the short version you can paste anywhere:</p>
   <blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid #b8893b;background:#faf6ee">
     The IHNM Show tapes live in San Jose starting March 2027. I am on the waitlist &mdash; join with my link and we both move up.
   </blockquote>
   <p><a class="btn" href="{referral_url}">Copy your link</a></p>');

select public.seed_template('sponsor_media_kit', 'show',
  'The IHNM Show media kit',
  '<p>Thanks for asking about sponsorship. The media kit has the audience, the format and every package in it.</p>
   <p><a class="btn" href="{media_kit_url}">Open the media kit</a></p>
   <p>Founding rates hold for sponsors who sign before the first taping. Reply to this email and I will walk you through it.</p>');

select public.seed_template('sponsor_founding_rates', 'show',
  'Founding sponsor rates, {first_name}',
  '<p>A quick follow-up on the packages. Founding rates are roughly half the standard rate and they hold for the first season:</p>
   <ul>
     <li><strong>Episode Sponsor</strong> &mdash; $250/month founding, $500 standard</li>
     <li><strong>Season Sponsor</strong> &mdash; see the kit for the season tiers</li>
   </ul>
   <p><a class="btn" href="{site_url}/partner">See every package</a></p>');

select public.seed_template('sponsor_hold_spot', 'show',
  'Can I hold a spot for you?',
  '<p>There are a limited number of founding sponsor slots for the first season. I can hold one for you for a week without any commitment.</p>
   <p>Just reply with a yes and I will take it off the list while you decide.</p>');

select public.seed_template('manuscript_received', 'publishing',
  'We have your manuscript, {first_name}',
  '<p>Thanks for sending <strong>{book_title}</strong> to IHNM Publishing House.</p>
   <p>Every submission gets read by a person. That takes us four to six weeks, and we will write back either way.</p>');

select public.seed_template('manuscript_still_reading', 'publishing',
  'Still reading {book_title}',
  '<p>A short note so you are not left wondering: your manuscript is still with us and still in the queue.</p>
   <p>If anything about the book has changed since you sent it, reply here and we will attach your note to the file.</p>');

select public.seed_template('winback_still_want', 'show',
  'Still want to hear from us, {first_name}?',
  '<p>We have not heard from you in a couple of months, and we would rather send nothing than send mail you do not read.</p>
   <p>Click once and we will keep you on the list. Do nothing and we will quietly take you off.</p>
   <p><a class="btn" href="{keep_url}">Keep me on the list</a></p>');

-- 1. Waitlist welcome. Live: waitlist_joined already fires on every signup.
select public.seed_journey('waitlist_welcome', 'Waitlist welcome', 'show',
  'waitlist_joined', null, true, '[
    {"type":"send_email","config":{"template":"waitlist_welcome"}},
    {"type":"wait","config":{"days":3}},
    {"type":"send_email","config":{"template":"waitlist_what_it_is"}},
    {"type":"wait","config":{"days":4}},
    {"type":"condition","config":{"kind":"not_did_event","event":"referral_made"},"yes":6,"no":7},
    {"type":"send_email","config":{"template":"waitlist_share_nudge"},"end":true},
    {"type":"add_tag","config":{"tag":"referred_someone"},"end":true}
  ]'::jsonb,
  'Welcome and referral link, then what the show is, then a share nudge only for people who have not referred anyone.');

-- 1b. First access when seats open. Needs an admin action to emit
-- tickets_opened per contact, which does not exist until tickets do.
select public.seed_journey('waitlist_first_access', 'Waitlist first access', 'show',
  'tickets_opened', 'ticket_reserved', false, '[
    {"type":"send_email","config":{"template":"waitlist_first_access"}},
    {"type":"wait","config":{"days":3}},
    {"type":"condition","config":{"kind":"not_did_event","event":"ticket_reserved"},"yes":4,"no":5},
    {"type":"send_email","config":{"template":"waitlist_first_access_reminder"},"end":true},
    {"type":"add_tag","config":{"tag":"first_access_converted"},"end":true}
  ]'::jsonb, 'Fires when the first 100 are invited to reserve.');

-- 2. First visit.
select public.seed_journey('first_visit', 'First visit', 'show',
  'ticket_reserved', null, false, '[
    {"type":"send_email","config":{"template":"ticket_confirmation"}},
    {"type":"wait","config":{"days_before_event":2}},
    {"type":"send_email","config":{"template":"two_days_before"}},
    {"type":"wait","config":{"hours_before_event":2}},
    {"type":"send_email","config":{"template":"two_hours_before"}},
    {"type":"wait","config":{"days":1}},
    {"type":"send_email","config":{"template":"after_recording_thanks"}},
    {"type":"wait","config":{"until_event":"episode_released"}},
    {"type":"send_email","config":{"template":"you_were_in_the_room"}},
    {"type":"wait","config":{"days":3}},
    {"type":"send_email","config":{"template":"reserve_your_next"}}
  ]'::jsonb, 'Confirmation through to the next booking.');

-- 3. VIP upgrade offer.
select public.seed_journey('vip_upgrade', 'VIP upgrade offer', 'show',
  'vip_seats_released', 'ticket_upgraded_vip', false, '[
    {"type":"condition","config":{"kind":"has_tag","tag":"general_admission"},"yes":2,"no":3},
    {"type":"send_email","config":{"template":"vip_upgrade_offer"},"end":true},
    {"type":"add_tag","config":{"tag":"not_ga"},"end":true}
  ]'::jsonb, 'Only general admission holders, when VIP seats release.');

-- 4. No-show.
select public.seed_journey('no_show', 'No-show rebook', 'show',
  'no_show', 'ticket_reserved', false, '[
    {"type":"wait","config":{"days":1}},
    {"type":"send_email","config":{"template":"we_missed_you"}}
  ]'::jsonb, 'We missed you, with a rebook link.');

-- 5. Regulars.
select public.seed_journey('regulars', 'Regulars invitation', 'show',
  'checked_in', null, false, '[
    {"type":"condition","config":{"kind":"event_count_at_least","event":"checked_in","count":3},"yes":2,"no":4},
    {"type":"add_tag","config":{"tag":"regular"}},
    {"type":"send_email","config":{"template":"serve_and_give"},"end":true},
    {"type":"add_tag","config":{"tag":"attended"},"end":true}
  ]'::jsonb, 'Third check-in triggers the invitation to volunteer and to give monthly.', true);

-- 6. Kids'' Room families.
select public.seed_journey('kids_room', 'Kids'' Room families', 'show',
  'kids_room_registered', null, false, '[
    {"type":"send_email","config":{"template":"kids_room_details"}},
    {"type":"wait","config":{"days":1}},
    {"type":"send_email","config":{"template":"kids_room_recap"}}
  ]'::jsonb, 'Check-in steps before, a short recap after.', true);

-- 7. First gift.
select public.seed_journey('first_gift', 'First gift', 'show',
  'donation_made', null, false, '[
    {"type":"send_email","config":{"template":"gift_thank_you"}},
    {"type":"wait","config":{"days":7}},
    {"type":"send_email","config":{"template":"impact_story"}},
    {"type":"wait","config":{"days":23}},
    {"type":"condition","config":{"kind":"event_count_at_least","event":"donation_made","count":2},"yes":6,"no":7},
    {"type":"send_email","config":{"template":"invite_monthly"},"end":true},
    {"type":"send_email","config":{"template":"gentle_second_gift"},"end":true}
  ]'::jsonb, 'Thank-you, impact story, then either monthly giving or a gentle second ask.');

-- 7b. Lapsed monthly giver.
select public.seed_journey('lapsed_monthly', 'Lapsed monthly giver', 'show',
  'monthly_gift_canceled', 'donation_made', false, '[
    {"type":"wait","config":{"days":2}},
    {"type":"send_email","config":{"template":"can_we_help"}},
    {"type":"admin_task","config":{"title":"Monthly gift canceled: {first_name}","detail":"Reach out personally to {email}."}}
  ]'::jsonb, 'Can we help, plus a task to follow up by hand.');

-- 8. Sponsor inquiry. Live: sponsor_inquiry fires from the partner form.
select public.seed_journey('sponsor_inquiry', 'Sponsor inquiry', 'show',
  'sponsor_inquiry', 'sponsor_signed', true, '[
    {"type":"send_email","config":{"template":"sponsor_media_kit"}},
    {"type":"wait","config":{"days":3}},
    {"type":"send_email","config":{"template":"sponsor_founding_rates"}},
    {"type":"wait","config":{"days":4}},
    {"type":"send_email","config":{"template":"sponsor_hold_spot"}},
    {"type":"admin_task","config":{"title":"Call sponsor prospect {first_name}","detail":"Three emails sent with no signature. Call {email}."}}
  ]'::jsonb, 'Media kit, founding rates, hold-a-spot, then a task to call.');

-- 8b. Signed sponsor.
select public.seed_journey('sponsor_signed', 'Signed sponsor', 'show',
  'sponsor_signed', null, false, '[
    {"type":"send_email","config":{"template":"sponsor_welcome"}},
    {"type":"admin_task","config":{"title":"Collect logo and assets from {first_name}","detail":"Sponsor signed. Request logo files and copy."}},
    {"type":"wait","config":{"days":30}},
    {"type":"send_email","config":{"template":"sponsor_monthly_recap"}}
  ]'::jsonb, 'Welcome, asset request, monthly recap.', true);

-- 9. Studio rentals.
select public.seed_journey('rental_quote', 'Rental quote abandoned', 'show',
  'rental_quote_started', 'rental_booked', false, '[
    {"type":"wait","config":{"hours":1}},
    {"type":"send_email","config":{"template":"rental_quote_reminder"}},
    {"type":"wait","config":{"days":1}},
    {"type":"send_email","config":{"template":"rental_quote_last_call"}}
  ]'::jsonb, 'A quote started but not booked, nudged at an hour and a day.', true);

select public.seed_journey('rental_booked', 'Rental booked', 'show',
  'rental_booked', null, false, '[
    {"type":"wait","config":{"days_before_event":3}},
    {"type":"send_email","config":{"template":"rental_prep"}},
    {"type":"wait","config":{"until_event":"rental_completed"}},
    {"type":"send_email","config":{"template":"rental_thanks_review"}},
    {"type":"wait","config":{"days":7}},
    {"type":"condition","config":{"kind":"event_count_at_least","event":"rental_booked","count":2},"yes":7,"no":8},
    {"type":"send_email","config":{"template":"rental_hour_pack"},"end":true},
    {"type":"send_email","config":{"template":"rental_rebook"},"end":true}
  ]'::jsonb, 'Prep, thank-you and review, then an hour pack for repeat renters.', true);

-- 10. Volunteers.
select public.seed_journey('volunteers', 'Volunteer onboarding', 'show',
  'volunteer_signed_up', null, false, '[
    {"type":"send_email","config":{"template":"volunteer_welcome"}},
    {"type":"wait","config":{"days_before_event":2}},
    {"type":"send_email","config":{"template":"shift_reminder_2_days"}},
    {"type":"wait","config":{"hours_before_event":2}},
    {"type":"send_email","config":{"template":"shift_reminder_2_hours"}},
    {"type":"wait","config":{"days":1}},
    {"type":"condition","config":{"kind":"event_count_at_least","event":"shift_completed","count":5},"yes":8,"no":9},
    {"type":"send_email","config":{"template":"volunteer_five_shifts"},"end":true},
    {"type":"add_tag","config":{"tag":"volunteer_active"},"end":true}
  ]'::jsonb, 'Welcome, shift reminders, thank-you at five shifts.', true);

select public.seed_journey('volunteer_winback', 'Volunteer win-back', 'show',
  'volunteer_went_quiet', 'shift_completed', false, '[
    {"type":"send_email","config":{"template":"volunteer_come_back"}}
  ]'::jsonb, 'Forty-five days with no shift.', true);

-- 11. Guests.
select public.seed_journey('guests', 'Guest journey', 'show',
  'guest_booked', null, false, '[
    {"type":"send_email","config":{"template":"guest_briefing"}},
    {"type":"wait","config":{"until_event":"episode_released_to_guest"}},
    {"type":"send_email","config":{"template":"guest_clip_pack"}},
    {"type":"wait","config":{"days":3}},
    {"type":"send_email","config":{"template":"guest_posting_reminder"}},
    {"type":"wait","config":{"days":27}},
    {"type":"send_email","config":{"template":"guest_episode_results"}}
  ]'::jsonb, 'Briefing, clip pack, posting reminder, results.', true);

-- 12. Episode interest. The track function already emits link_clicked with
-- topic tags; this waits on there being related episodes to point at.
select public.seed_journey('episode_interest', 'Episode topic follow-up', 'show',
  'link_clicked', null, false, '[
    {"type":"wait","config":{"days":3}},
    {"type":"send_email","config":{"template":"related_episode"}}
  ]'::jsonb, 'A related episode on the topic they clicked.', true);

-- 13. Cross-brand handoff, only with publishing consent.
select public.seed_journey('cross_brand_books', 'Show to publishing handoff', 'show',
  'link_clicked', null, false, '[
    {"type":"condition","config":{"kind":"has_interest","interest":"books"},"yes":2,"no":3},
    {"type":"start_journey","config":{"journey":"publishing_welcome"},"end":true},
    {"type":"add_tag","config":{"tag":"no_book_interest"},"end":true}
  ]'::jsonb, 'Clicked a book or author interview and consented to publishing mail.', true);

-- 14. Win-back. Live: sweep_quiet_contacts emits went_quiet daily.
select public.seed_journey('winback', 'Win-back', 'show',
  'went_quiet', 'link_clicked', true, '[
    {"type":"send_email","config":{"template":"winback_still_want"}},
    {"type":"wait","config":{"days":14}},
    {"type":"condition","config":{"kind":"did_event","event":"link_clicked","within_days":14},"yes":4,"no":5},
    {"type":"add_tag","config":{"tag":"reengaged"},"end":true},
    {"type":"notify_admin","config":{"subject":"Unsubscribing a quiet contact","body":"No click in 14 days after the win-back email."},"end":true}
  ]'::jsonb, 'Still want to hear from us, then off the list if no click in fourteen days.', true);

-- Manuscript follow-up. Live: submission_sent fires from the publishing form.
select public.seed_journey('manuscript_followup', 'Manuscript follow-up', 'publishing',
  'submission_sent', null, true, '[
    {"type":"send_email","config":{"template":"manuscript_received"}},
    {"type":"wait","config":{"days":21}},
    {"type":"send_email","config":{"template":"manuscript_still_reading"}}
  ]'::jsonb, 'Receipt, then a status note three weeks later.', true);
