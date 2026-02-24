import { arrayUnion, collection, doc, getDocs, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

const DEFAULT_BADGES = [
  {
    id: 'distance-5k',
    name: '5 km Runner',
    description: 'Run a total distance of 5 km.',
    icon: '🏃',
    requirementType: 'distance',
    requirementValue: 5000,
  },
]

const getProgressValue = (badge, stats) => {
  if (!badge || !stats) return 0
  switch (badge.requirementType) {
    case 'distance':
      return stats.totalDistance || 0
    case 'area':
      return stats.totalArea || 0
    case 'captures':
      return stats.totalCaptures || 0
    default:
      return 0
  }
}

export const fetchBadges = async () => {
  const snapshot = await getDocs(collection(db, 'badges'))
  const remote = snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() }))
  const merged = new Map()
  DEFAULT_BADGES.forEach((badge) => {
    merged.set(badge.id, badge)
  })
  remote.forEach((badge) => {
    if (badge?.id) merged.set(badge.id, badge)
  })
  return Array.from(merged.values()).sort(
    (a, b) => (a.requirementValue || 0) - (b.requirementValue || 0)
  )
}

export const getEligibleBadges = (badges, stats, earnedBadges = []) => {
  const earnedSet = new Set(earnedBadges)
  return badges.filter((badge) => {
    if (!badge || earnedSet.has(badge.id)) return false
    const progress = getProgressValue(badge, stats)
    return progress >= (badge.requirementValue || 0)
  })
}

export const awardBadges = async ({ userId, badges, stats, earnedBadges = [] }) => {
  if (!userId) return []
  const eligible = getEligibleBadges(badges, stats, earnedBadges)
  if (!eligible.length) return []
  await updateDoc(doc(db, 'users', userId), {
    earnedBadges: arrayUnion(...eligible.map((badge) => badge.id)),
  })
  return eligible
}
