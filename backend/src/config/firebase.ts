import admin from 'firebase-admin';
import { env, isProduction } from './env';

const isPlaceholderKey = !env.FIREBASE.privateKey ||
  env.FIREBASE.privateKey.includes('YOUR_KEY') ||
  env.FIREBASE.privateKey.length < 100;
const isPlaceholderEmail = !env.FIREBASE.clientEmail ||
  env.FIREBASE.clientEmail.includes('your-');

const hasValidCredentials = env.FIREBASE.projectId &&
  !isPlaceholderKey &&
  !isPlaceholderEmail;

if (!hasValidCredentials) {
  console.warn('[Firebase] Using placeholder/missing Firebase Admin credentials. Authentication will fail until real credentials are configured.');
  if (isProduction) {
    throw new Error('Firebase Admin credentials are required in production');
  }
}

let firebaseApp: admin.app.App;
let firebaseAuth: admin.auth.Auth;
let firestore: admin.firestore.Firestore;

if (hasValidCredentials) {
  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE.projectId,
      privateKey: env.FIREBASE.privateKey,
      clientEmail: env.FIREBASE.clientEmail,
    }),
  });
  firebaseAuth = admin.auth(firebaseApp);
  firestore = admin.firestore(firebaseApp);
  console.log('[Firebase] Admin initialized successfully');
} else {
  // Create placeholder instances for dev mode - will fail at runtime
  firebaseApp = admin.initializeApp({
    projectId: env.FIREBASE.projectId || 'placeholder',
  });
  firebaseAuth = admin.auth(firebaseApp);
  firestore = admin.firestore(firebaseApp);
}

export { firebaseAuth, firestore };
export default admin;
