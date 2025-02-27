import admin from "firebase-admin";
import { getStorage } from "firebase-admin/storage";
import 'dotenv/config';

admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_KEY)),
    storageBucket: "milanote-c2d89.firebasestorage.app",
});

const bucket = getStorage().bucket();

export { bucket };