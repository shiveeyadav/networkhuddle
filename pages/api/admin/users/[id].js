import { createHandler } from '../../../../lib/api';
import { query } from '../../../../lib/db';
import { HttpError } from '../../../../lib/errors';
import * as v from '../../../../lib/validate';

const ACTIONS = [
  { value: 'member' },
  { value: 'unmember' },
  { value: 'suspend' },
  { value: 'unsuspend' },
  { value: 'delete' },
];

// Admin: mark/unmark members, suspend/unsuspend (hide + block login), or delete an account.
export default createHandler({ admin: true }, async (req, res, admin) => {
  const id = v.idParam(req.query.id);
  const action = v.oneOf(req.body.action, ACTIONS, { label: 'Action', required: true });

  const { rows } = await query('SELECT id, role, is_member, is_suspended FROM users WHERE id = $1', [id]);
  const target = rows[0];
  if (!target) throw new HttpError(404, 'User not found.');
  if (target.id === admin.id) throw new HttpError(400, 'You can’t change your own account here. Use Settings instead.');
  if (target.role === 'admin' && action !== 'member') {
    throw new HttpError(403, 'Admin accounts can’t be changed here.');
  }

  switch (action) {
    case 'member':
      await query(
        `UPDATE users SET is_member = TRUE, member_since = COALESCE(member_since, now()), updated_at = now() WHERE id = $1`,
        [id]
      );
      break;
    case 'unmember':
      await query(`UPDATE users SET is_member = FALSE, member_since = NULL, updated_at = now() WHERE id = $1`, [id]);
      break;
    case 'suspend':
      await query(`UPDATE users SET is_suspended = TRUE, updated_at = now() WHERE id = $1`, [id]);
      await query('DELETE FROM sessions WHERE user_id = $1', [id]);
      break;
    case 'unsuspend':
      await query(`UPDATE users SET is_suspended = FALSE, updated_at = now() WHERE id = $1`, [id]);
      break;
    case 'delete':
      // Sessions, bookings, 1-1s and reset tokens are removed by ON DELETE CASCADE.
      await query(`DELETE FROM users WHERE id = $1 AND role <> 'admin'`, [id]);
      break;
    default:
      throw new HttpError(400, 'Unknown action.');
  }

  return res.status(200).json({ ok: true });
});
