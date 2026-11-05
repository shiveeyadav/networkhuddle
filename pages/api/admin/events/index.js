import { createHandler } from '../../../../lib/api';
import { query } from '../../../../lib/db';
import { HttpError, badRequest } from '../../../../lib/errors';
import { parseEventInput, uniqueEventSlug } from '../../../../lib/events';

// Admin: create a meeting. startsAtLocal is UK local time (Europe/London).
export default createHandler({ admin: true }, async (req, res, user) => {
  const input = parseEventInput(req.body);

  const check = await query(`SELECT ($1::timestamp AT TIME ZONE 'Europe/London') > now() AS future`, [
    input.startsAtLocal,
  ]);
  if (!check.rows[0].future) throw badRequest('The start time must be in the future.');

  const slug = await uniqueEventSlug(input.title, input.startsAtLocal.slice(0, 10));
  try {
    const { rows } = await query(
      `INSERT INTO events (slug, title, format, theme, region, starts_at, duration_minutes,
                           venue_name, venue_address, online_link, capacity, description, created_by)
       VALUES ($1, $2, $3, $4, $5, ($6::timestamp AT TIME ZONE 'Europe/London'), $7, $8, $9, $10, $11, $12, $13)
       RETURNING id, slug`,
      [
        slug,
        input.title,
        input.format,
        input.theme,
        input.region,
        input.startsAtLocal,
        input.durationMinutes,
        input.venueName,
        input.venueAddress,
        input.onlineLink,
        input.capacity,
        input.description,
        user.id,
      ]
    );
    return res.status(201).json({ ok: true, id: rows[0].id, slug: rows[0].slug });
  } catch (err) {
    if (err && err.code === '23505') throw new HttpError(409, 'A meeting with that title and date was just created. Please try again.');
    throw err;
  }
});
