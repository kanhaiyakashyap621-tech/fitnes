import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import {
  arrayRemove,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { auth, db } from '../firebase'

const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [room, setRoom] = useState(null)
  const [roomLoading, setRoomLoading] = useState(false)

  const normalizeProfile = async (uid, data) => {
    const updates = {}
    if (typeof data.totalDistance !== 'number' || Number.isNaN(data.totalDistance)) {
      updates.totalDistance = 0
    }
    if (typeof data.totalArea !== 'number' || Number.isNaN(data.totalArea)) {
      updates.totalArea = 0
    }
    if (!Number.isInteger(data.totalCaptures) || data.totalCaptures < 0) {
      updates.totalCaptures = 0
    }
    if (!Array.isArray(data.earnedBadges)) {
      updates.earnedBadges = []
    }
    if (!Array.isArray(data.fcmTokens)) {
      updates.fcmTokens = []
    }
    if (!Object.prototype.hasOwnProperty.call(data, 'currentRoomId')) {
      updates.currentRoomId = null
    }
    if (!Object.prototype.hasOwnProperty.call(data, 'createdAt')) {
      updates.createdAt = serverTimestamp()
    }
    if (Object.keys(updates).length) {
      await setDoc(doc(db, 'users', uid), updates, { merge: true })
    }
    return { ...data, ...updates }
  }

  const fetchProfile = async (uid) => {
    const snapshot = await getDoc(doc(db, 'users', uid))
    if (snapshot.exists()) {
      const data = snapshot.data()
      const normalized = await normalizeProfile(uid, data)
      setProfile(normalized)
    } else {
      setProfile(null)
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        await fetchProfile(currentUser.uid)
      } else {
        setProfile(null)
        setRoom(null)
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!profile?.currentRoomId) {
      setRoom(null)
      setRoomLoading(false)
      return
    }
    setRoomLoading(true)
    const roomRef = doc(db, 'rooms', profile.currentRoomId)
    const unsub = onSnapshot(
      roomRef,
      (snapshot) => {
        setRoom(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null)
        setRoomLoading(false)
      },
      () => {
        setRoom(null)
        setRoomLoading(false)
      }
    )
    return () => unsub()
  }, [profile?.currentRoomId])

  const signUp = async ({ username, email, password }) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(credential.user, { displayName: username })
    const userRef = doc(db, 'users', credential.user.uid)
    await setDoc(userRef, {
      username,
      email,
      totalDistance: 0,
      totalArea: 0,
      totalCaptures: 0,
      earnedBadges: [],
      fcmTokens: [],
      currentRoomId: null,
      createdAt: serverTimestamp(),
    })
    await fetchProfile(credential.user.uid)
    return credential
  }

  const signIn = async (email, password) => {
    const credential = await signInWithEmailAndPassword(auth, email, password)
    await fetchProfile(credential.user.uid)
    return credential
  }

  const logout = async () => {
    await signOut(auth)
  }

  const leaveRoom = async () => {
    if (!user || !profile?.currentRoomId) return
    const roomId = profile.currentRoomId
    await runTransaction(db, async (transaction) => {
      const roomRef = doc(db, 'rooms', roomId)
      const userRef = doc(db, 'users', user.uid)
      const roomSnap = await transaction.get(roomRef)
      if (roomSnap.exists()) {
        const members = roomSnap.data().members || []
        if (members.includes(user.uid)) {
          transaction.update(roomRef, { members: arrayRemove(user.uid) })
        }
      }
      transaction.set(userRef, { currentRoomId: null }, { merge: true })
    })
    await fetchProfile(user.uid)
  }

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      room,
      roomLoading,
      signUp,
      signIn,
      logout,
      leaveRoom,
      refreshProfile: () => user && fetchProfile(user.uid),
    }),
    [user, profile, loading, room, roomLoading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
