export { voterNameSchema, selectionSchema } from './schema'

/** order: 모임 안에서 처음 투표한 순번 (이름이 바뀌어도 유지 → 색 고정) */
export type Voter = { name: string; order: number }
