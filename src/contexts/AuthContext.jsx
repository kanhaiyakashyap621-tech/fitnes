import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (uid) => {
    const snapshot = await getDoc(doc(db, 'users', uid))
    if (snapshot.exists()) {
      setProfile(snapshot.data())
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
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

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

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      signUp,
      signIn,
      logout,
      refreshProfile: () => user && fetchProfile(user.uid),
    }),
    [user, profile, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
