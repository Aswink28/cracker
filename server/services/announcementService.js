import { Announcement } from '../models/Announcement.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Ceiling on simultaneously visible messages.
 *
 * The strip scrolls a single track, so every extra message makes each one wait
 * longer to come round. Past a couple of dozen a new promotion is effectively
 * invisible, which is worse than being told to disable an old one.
 */
const MAX_ACTIVE = 20;

export async function listAnnouncements({ includeInactive = false } = {}) {
  const filter = includeInactive ? {} : { active: true };

  const announcements = await Announcement.find(filter)
    .sort({ displayOrder: 1, createdAt: 1 })
    .lean();

  return announcements.map(serialise);
}

export async function getAnnouncementById(id) {
  const announcement = await Announcement.findById(id).lean();
  if (!announcement) throw ApiError.notFound('Announcement not found');
  return serialise(announcement);
}

export async function createAnnouncement(payload) {
  if (payload.active !== false) await assertRoom();

  const announcement = await Announcement.create(payload);
  return serialise(announcement.toObject());
}

export async function updateAnnouncement(id, payload) {
  const existing = await Announcement.findById(id);
  if (!existing) throw ApiError.notFound('Announcement not found');

  // Only re-enabling counts against the cap. Editing the text of a message
  // that is already live must never be blocked by it.
  if (payload.active === true && existing.active === false) await assertRoom();

  const announcement = await Announcement.findByIdAndUpdate(
    id,
    { $set: payload },
    { new: true, runValidators: true },
  ).lean();

  return serialise(announcement);
}

/**
 * Announcements carry no images and nothing references them, so unlike a
 * category they can simply be removed.
 */
export async function deleteAnnouncement(id) {
  const announcement = await Announcement.findByIdAndDelete(id).lean();
  if (!announcement) throw ApiError.notFound('Announcement not found');
  return { id };
}

async function assertRoom() {
  const active = await Announcement.countDocuments({ active: true });
  if (active >= MAX_ACTIVE) {
    throw ApiError.conflict(
      `The offers strip already shows ${MAX_ACTIVE} messages. Disable one before adding another.`,
    );
  }
}

function serialise(doc) {
  if (!doc) return doc;
  const { _id, __v, ...rest } = doc;
  return { id: _id?.toString?.() ?? _id, ...rest };
}
