import type { MeetingStatus } from './status'

export type ResultVisibility = 'always' | 'after_vote' | 'after_close'

export function canSeeResults(visibility: ResultVisibility, status: MeetingStatus, hasVoted: boolean) {
  if (visibility === 'always') return true
  if (visibility === 'after_vote') return hasVoted
  return status === 'closed'
}
