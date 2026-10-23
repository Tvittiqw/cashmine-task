import type { ClaimDto } from '../../lib/api/endpoints';

function asSentence(text: string): string {
  const trimmed = text.trim();
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

/** Why a failed claim failed, in the server's words, plus where the money is now. */
export function failureMessage(claim: ClaimDto): string {
  const returned = `${claim.amount} ${claim.asset} is back in your available balance.`;
  return claim.failureReason ? `${asSentence(claim.failureReason)} ${returned}` : returned;
}

export function failedClaimNotice(claim: ClaimDto): string {
  return `Your claim of ${claim.amount} ${claim.asset} failed. ${failureMessage(claim)}`;
}
