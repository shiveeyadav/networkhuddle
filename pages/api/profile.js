import { createHandler } from '../../lib/api';
import { query } from '../../lib/db';
import { uniqueUserSlug } from '../../lib/auth';
import { REGIONS, INDUSTRIES } from '../../lib/constants';
import * as v from '../../lib/validate';

export default createHandler({ auth: true }, async (req, res, user) => {
  const b = req.body;
  const name = v.text(b.name, { label: 'Name', max: 80, required: true });
  const data = {
    business_name: v.text(b.businessName, { label: 'Business name', max: 120 }),
    job_role: v.text(b.jobRole, { label: 'Role', max: 100 }),
    region: v.oneOf(b.region, REGIONS, { label: 'Region' }),
    industry: v.oneOf(b.industry, INDUSTRIES, { label: 'Industry' }),
    website: v.url(b.website, { label: 'Website' }),
    bio: v.text(b.bio, { label: 'Bio', max: 1000, multiline: true }),
    offer: v.text(b.offer, { label: 'What I offer', max: 600, multiline: true }),
    looking_for: v.text(b.lookingFor, { label: 'Who I’m looking to meet', max: 600, multiline: true }),
    avatar_url: v.url(b.avatarUrl, { label: 'Photo URL' }),
    linkedin_url: v.url(b.linkedinUrl, { label: 'LinkedIn URL', hostSuffix: 'linkedin.com' }),
    is_public: v.bool(b.isPublic),
  };

  // Keep the profile URL stable unless the name actually changed.
  const slug = name === user.name ? user.slug : await uniqueUserSlug(name, user.id);

  const { rows } = await query(
    `UPDATE users SET
        name = $1, slug = $2, business_name = $3, job_role = $4, region = $5, industry = $6,
        website = $7, bio = $8, offer = $9, looking_for = $10, avatar_url = $11, linkedin_url = $12,
        is_public = $13, updated_at = now()
      WHERE id = $14
      RETURNING slug, name, business_name, job_role, region, industry, website, bio, offer,
                looking_for, avatar_url, linkedin_url, is_public`,
    [
      name,
      slug,
      data.business_name,
      data.job_role,
      data.region,
      data.industry,
      data.website,
      data.bio,
      data.offer,
      data.looking_for,
      data.avatar_url,
      data.linkedin_url,
      data.is_public,
      user.id,
    ]
  );
  const r = rows[0];
  return res.status(200).json({
    ok: true,
    profile: {
      slug: r.slug,
      name: r.name,
      businessName: r.business_name,
      jobRole: r.job_role,
      region: r.region,
      industry: r.industry,
      website: r.website,
      bio: r.bio,
      offer: r.offer,
      lookingFor: r.looking_for,
      avatarUrl: r.avatar_url,
      linkedinUrl: r.linkedin_url,
      isPublic: r.is_public,
    },
  });
});
