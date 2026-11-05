import { createHandler } from '../../../lib/api';
import { destroySession } from '../../../lib/auth';

export default createHandler({}, async (req, res) => {
  await destroySession(req, res);
  return res.status(200).json({ ok: true });
});
