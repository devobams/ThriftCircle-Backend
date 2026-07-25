import {
  findGroupSchedule,
  findContributionById,
  updateContribution,
  createContributionStatusLog,
} from "./contributions.model.js";

/**
 * Returns the contribution schedule for a group.
 */
export async function getContributionSchedule(groupId) {
  return findGroupSchedule(groupId);
}

/**
 * Member submits proof of payment.
 *
 * TODO:
 * - Ensure contribution exists.
 * - Ensure authenticated user owns the contribution.
 * - Ensure contribution is still pending.
 * - Upload/store proof of payment.
 * - Update contribution:
 *      status -> "submitted"
 *      proofOfPaymentUrl
 * - Create ContributionStatusLog.
 * - Return updated contribution.
 */
export async function submitPayment(
  contributionId,
  userId,
  proofOfPaymentUrl
) {
  throw new Error("submitPayment() not implemented.");
}

/**
 * Organizer confirms a contribution payment.
 *
 * TODO:
 * - Ensure contribution exists.
 * - Ensure authenticated user is organizer.
 * - Ensure contribution is submitted.
 * - Update:
 *      status -> "confirmed"
 *      confirmedById
 *      confirmedAt
 * - Create ContributionStatusLog.
 * - Return updated contribution.
 */
export async function confirmContribution(
  contributionId,
  organizerId,
  note
) {
  throw new Error("confirmContribution() not implemented.");
}

/**
 * Organizer rejects a submitted payment.
 *
 * TODO:
 * - Ensure contribution exists.
 * - Ensure authenticated user is organizer.
 * - Ensure contribution is submitted.
 * - Update:
 *      status -> "rejected"
 *      rejectionReason
 * - Create ContributionStatusLog.
 * - Return updated contribution.
 */
export async function rejectContribution(
  contributionId,
  organizerId,
  rejectionReason,
  note
) {
  throw new Error("rejectContribution() not implemented.");
}