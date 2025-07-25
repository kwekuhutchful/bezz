import { initializeApp } from 'firebase/app'
import { getAuth, signInWithCustomToken } from 'firebase/auth'

// Firebase configuration - using environment variables from backend
const firebaseConfig = {
  apiKey: "AIzaSyBJKqGxGVP-PQcR-XYsY5XpGJgPuVnTmHc", // Public API key (safe to expose)
  authDomain: "bezz-777eb.firebaseapp.com",
  projectId: "bezz-777eb",
  storageBucket: "bezz-777eb.appspot.com",
  messagingSenderId: "123456789", // Replace with actual
  appId: "1:123456789:web:abcdef123456" // Replace with actual
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