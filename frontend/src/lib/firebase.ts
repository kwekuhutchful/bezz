import { initializeApp } from 'firebase/app'
import { getAuth, signInWithCustomToken } from 'firebase/auth'

// Firebase configuration - using correct values from Firebase console
const firebaseConfig = {
  apiKey: "AIzaSyCcbWyoYIGFwgH0byeJFSUP_HAjXR1v_HQ",
  authDomain: "bezz-777eb.firebaseapp.com",
  projectId: "bezz-777eb",
  storageBucket: "bezz-777eb.firebasestorage.app",
  messagingSenderId: "981046325818",
  appId: "1:981046325818:web:090f9e34114eef19c6bb03",
  measurementId: "G-NFD3RB53GJ"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication
export const auth = getAuth(app)

// Helper function to exchange custom token for ID token
export const exchangeCustomTokenForIdToken = async (customToken: string): Promise<string> => {
  try {
    const userCredential = await signInWithCustomToken(auth, customToken)
    const idToken = await userCredential.user.getIdToken()
    return idToken
  } catch (error) {
    console.error('Failed to exchange custom token:', error)
    throw error
  }
}

// Export for backward compatibility
export { app }
export const db = null // Firestore is handled by backend 