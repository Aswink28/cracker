import * as announcementService from '../services/announcementService.js';
import * as stripSettingsService from '../services/stripSettingsService.js';
import { revalidateStorefront } from '../services/revalidateService.js';

function publicCache(res, seconds = 600) {
  res.set(
    'Cache-Control',
    `public, max-age=0, s-maxage=${seconds}, stale-while-revalidate=${seconds * 4}`,
  );
}

/** GET /api/announcements */
export async function getAnnouncements(req, res) {
  const isAdmin = Boolean(req.admin);
  const announcements = await announcementService.listAnnouncements({
    includeInactive: isAdmin,
  });

  if (!isAdmin) publicCache(res);

  res.json({ success: true, announcements });
}

/** GET /api/announcements/settings - what the storefront needs to render the strip. */
export async function getStripSettings(req, res) {
  const settings = await stripSettingsService.getStripSettings();
  if (!req.admin) publicCache(res);
  res.json({ success: true, settings });
}

/** PUT /api/announcements/settings */
export async function updateStripSettings(req, res) {
  const settings = await stripSettingsService.updateStripSettings(req.body);
  await revalidateStorefront(['announcements']);
  res.json({ success: true, settings });
}

/** GET /api/announcements/:id */
export async function getAnnouncementById(req, res) {
  const announcement = await announcementService.getAnnouncementById(req.params.id);
  res.json({ success: true, announcement });
}

/** POST /api/announcements */
export async function createAnnouncement(req, res) {
  const announcement = await announcementService.createAnnouncement(req.body);
  await revalidateStorefront(['announcements']);
  res.status(201).json({ success: true, announcement });
}

/** PUT /api/announcements/:id */
export async function updateAnnouncement(req, res) {
  const announcement = await announcementService.updateAnnouncement(req.params.id, req.body);
  await revalidateStorefront(['announcements']);
  res.json({ success: true, announcement });
}

/** DELETE /api/announcements/:id */
export async function deleteAnnouncement(req, res) {
  await announcementService.deleteAnnouncement(req.params.id);
  await revalidateStorefront(['announcements']);
  res.json({ success: true, message: 'Announcement deleted' });
}
