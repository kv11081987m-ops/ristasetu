const crypto = require('crypto');
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret, defineString } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');
const { getAuth } = require('firebase-admin/auth');
const cloudinary = require('cloudinary').v2;

initializeApp();
const db = getFirestore();
const fcm = getMessaging();

// ── Cloudinary (KYC document signing only — profile photos stay unsigned) ─
// CLOUDINARY_API_KEY/API_SECRET must be provisioned as Firebase secrets
// (`firebase functions:secrets:set CLOUDINARY_API_KEY` etc.) and
// CLOUDINARY_CLOUD_NAME as a regular (non-secret) functions/.env value —
// none of these exist yet as of this commit, so the two functions below
// will fail at deploy/runtime until that's done. See project chat log.
const CLOUDINARY_CLOUD_NAME = defineString('CLOUDINARY_CLOUD_NAME');
const CLOUDINARY_API_KEY = defineSecret('CLOUDINARY_API_KEY');
const CLOUDINARY_API_SECRET = defineSecret('CLOUDINARY_API_SECRET');
const CLOUDINARY_SECRETS = [CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET];
const KYC_UPLOAD_PRESET = 'ristasetu_kyc_secure';

const configureCloudinary = () => cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME.value(),
  api_key: CLOUDINARY_API_KEY.value(),
  api_secret: CLOUDINARY_API_SECRET.value(),
});

// ── Password hashing (server-side only) ─────────────────────────────────
// Passwords are hashed here with scrypt (memory-hard, per-user random salt)
// — never on the client. `LEGACY_PEPPER` exists only to verify passwords
// set under the old client-side SHA256(password+pepper) scheme so existing
// users aren't locked out; every successful legacy login is transparently
// re-hashed into the new scheme below.
const LEGACY_PEPPER = 'ristasetu-2026';

const hashPasswordServerSide = (password, salt) =>
  crypto.scryptSync(password, salt, 64).toString('hex');

const legacyHashPassword = (password) =>
  crypto.createHash('sha256').update(password + LEGACY_PEPPER).digest('hex');

const safeEqualHex = (a, b) => {
  try {
    const bufA = Buffer.from(a, 'hex');
    const bufB = Buffer.from(b, 'hex');
    return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
};

// ── Login rate limiting ──────────────────────────────────────────────────
const LOGIN_ATTEMPT_LIMIT = 5;
const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

async function assertNotRateLimited(rsId) {
  const snap = await db.collection('login_attempts').doc(rsId).get();
  if (!snap.exists) return;
  const { count, windowStart } = snap.data();
  if (Date.now() - windowStart < LOGIN_ATTEMPT_WINDOW_MS && count >= LOGIN_ATTEMPT_LIMIT) {
    throw new HttpsError('resource-exhausted', 'Bahut zyada galat attempts. 15 minute baad dobara try karein.');
  }
}

async function recordFailedAttempt(rsId) {
  const ref = db.collection('login_attempts').doc(rsId);
  const snap = await ref.get();
  const now = Date.now();
  if (!snap.exists || now - snap.data().windowStart > LOGIN_ATTEMPT_WINDOW_MS) {
    await ref.set({ count: 1, windowStart: now });
  } else {
    await ref.update({ count: FieldValue.increment(1) });
  }
}

const clearAttempts = (rsId) => db.collection('login_attempts').doc(rsId).delete().catch(() => {});

// ── Helper: send FCM push to a user and clean up invalid tokens ────────────
async function pushToUser(userId, title, body, url = '/') {
  const snap = await db.collection('users').doc(userId).get();
  if (!snap.exists) return;

  const tokens = snap.data().fcmTokens || [];
  if (tokens.length === 0) return;

  const res = await fcm.sendEachForMulticast({
    tokens,
    notification: { title, body },
    data: { url },
    webpush: {
      notification: {
        icon: 'https://ristasetu.com/icons/icon-192.png',
        badge: 'https://ristasetu.com/icons/icon-72.png',
        requireInteraction: false,
      },
      fcmOptions: { link: `https://ristasetu.com${url}` },
    },
  });

  // Remove tokens that FCM rejected as invalid
  const dead = tokens.filter((_, i) => !res.responses[i].success &&
    ['registration-token-not-registered', 'invalid-registration-token']
      .includes(res.responses[i].error?.code));

  if (dead.length > 0) {
    await db.collection('users').doc(userId).update({
      fcmTokens: FieldValue.arrayRemove(...dead),
    });
  }
}

// ── RS ID Login — verify password server-side, return custom token ───────
// Client sends { rsId, password } (raw password, over HTTPS — never hashed
// client-side). Hashing + comparison happen here with a per-user salt; we
// never return uid/phone/hash back. Rate-limited per RS ID.
exports.verifyRsLogin = onCall(async (request) => {
  const { rsId, password } = request.data;

  if (!rsId || !/^RS\d{6}$/i.test(String(rsId))) {
    throw new HttpsError('invalid-argument', 'RS ID galat format mein hai.');
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    throw new HttpsError('invalid-argument', 'Password invalid hai.');
  }

  const normalizedId = String(rsId).toUpperCase();
  await assertNotRateLimited(normalizedId);

  // Admin SDK read — bypasses Firestore security rules
  const indexDoc = await db.collection('password_index').doc(normalizedId).get();
  if (!indexDoc.exists) {
    await recordFailedAttempt(normalizedId);
    throw new HttpsError('not-found', 'Yeh RS ID nahi mili. OTP se login karein aur Settings mein password set karein.');
  }

  const { uid, salt, hash: storedHash, passwordHash: legacyHash, hasPassword } = indexDoc.data();

  if (!hasPassword && !storedHash && !legacyHash) {
    throw new HttpsError('failed-precondition', 'Password set nahi hai. OTP se login karein aur Settings mein password set karein.');
  }

  let verified = false;
  if (salt && storedHash) {
    verified = safeEqualHex(hashPasswordServerSide(password, salt), storedHash);
  } else if (legacyHash) {
    // Old scheme: client used to send SHA256(password + pepper) directly.
    // Verify the same way once, then transparently upgrade to scrypt+salt.
    verified = legacyHashPassword(password) === legacyHash;
    if (verified) {
      const newSalt = crypto.randomBytes(16).toString('hex');
      await db.collection('password_index').doc(normalizedId).set({
        uid, salt: newSalt, hash: hashPasswordServerSide(password, newSalt),
      });
    }
  }

  if (!verified) {
    await recordFailedAttempt(normalizedId);
    throw new HttpsError('unauthenticated', 'Galat password. Dobara check karein.');
  }

  await clearAttempts(normalizedId);
  // Issue a one-time custom token — only usable for Firebase Auth sign-in
  const customToken = await getAuth().createCustomToken(uid);
  return { customToken };
});

// ── Set/change RS ID password — hashes + stores server-side only ─────────
// Called after the client has already linked/updated its Firebase Auth
// credential directly with the raw new password (Firebase Auth does its
// own strong server-side hashing for that). This function is solely
// responsible for the separate password_index lookup table used by
// verifyRsLogin above, so that table is never writable by the client.
exports.setRsPassword = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Pehle login karein.');
  }
  const { newPassword } = request.data;
  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    throw new HttpsError('invalid-argument', 'Password kam se kam 8 characters ka hona chahiye.');
  }

  const uid = request.auth.uid;
  const userSnap = await db.collection('users').doc(uid).get();
  const rsId = userSnap.data()?.ristaSetuId;
  if (!rsId) {
    throw new HttpsError('failed-precondition', 'RistaSetu ID nahi mili.');
  }

  const normalizedId = String(rsId).toUpperCase();
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPasswordServerSide(newPassword, salt);

  await db.collection('password_index').doc(normalizedId).set({ uid, salt, hash });
  await db.collection('users').doc(uid).update({ hasPassword: true });
  await clearAttempts(normalizedId);

  return { ok: true };
});

// ── Biodata PDF download limit (3/month free) — enforced server-side ─────
// Previously tracked in localStorage on the client, which meant clearing
// site data / incognito trivially bypassed the free-tier cap. The count now
// lives in Firestore and is only ever incremented from here.
const BIODATA_FREE_LIMIT = 3;

exports.recordBiodataDownload = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Pehle login karein.');
  }
  const uid = request.auth.uid;

  const userSnap = await db.collection('users').doc(uid).get();
  if (userSnap.data()?.isPremium) {
    return { allowed: true, unlimited: true };
  }

  const month = new Date().toISOString().slice(0, 7); // YYYY-MM
  const ref = db.collection('biodata_downloads').doc(uid);
  const snap = await ref.get();
  const current = (snap.exists && snap.data().month === month) ? snap.data().count : 0;

  if (current >= BIODATA_FREE_LIMIT) {
    throw new HttpsError(
      'resource-exhausted',
      `Is mahine ${BIODATA_FREE_LIMIT} free downloads ho chuke hain. Premium lein unlimited downloads ke liye.`
    );
  }

  await ref.set({ month, count: current + 1 });
  return { allowed: true, remaining: BIODATA_FREE_LIMIT - (current + 1) };
});

// ── KYC document upload — server-generated signature only ────────────────
// Government ID scans must never go through the shared unsigned preset
// used for profile photos. A *signed* Cloudinary upload requires a
// signature computed with the API secret, which can never be exposed to
// the browser — this function computes it; the client then performs the
// actual file upload itself directly to Cloudinary (the file bytes never
// pass through our server, only these signed params do). `type:
// 'authenticated'` on the resulting asset means the delivered URL is not
// publicly viewable without a further signed request (see
// getKycDocumentUrl below).
exports.getKycUploadSignature = onCall({ secrets: CLOUDINARY_SECRETS }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Pehle login karein.');
  }
  configureCloudinary();

  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = {
    timestamp,
    folder: 'ristasetu-kyc',
    type: 'authenticated',
    upload_preset: KYC_UPLOAD_PRESET,
  };
  const signature = cloudinary.utils.api_sign_request(paramsToSign, CLOUDINARY_API_SECRET.value());

  return {
    ...paramsToSign,
    signature,
    apiKey: CLOUDINARY_API_KEY.value(),
    cloudName: CLOUDINARY_CLOUD_NAME.value(),
  };
});

// ── Admin-only: short-lived signed URL to view a KYC document ────────────
// Reads the Cloudinary public_id from the owner/admin-only private/kyc
// subcollection (never trusts a client-supplied URL) and mints a URL that
// expires in 5 minutes — the raw document is never persistently
// world-viewable the way the old unsigned-upload URL was.
exports.getKycDocumentUrl = onCall({ secrets: CLOUDINARY_SECRETS }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Pehle login karein.');
  }
  const callerSnap = await db.collection('users').doc(request.auth.uid).get();
  if (callerSnap.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Sirf admin KYC documents dekh sakte hain.');
  }

  const { userId } = request.data;
  if (!userId || typeof userId !== 'string') {
    throw new HttpsError('invalid-argument', 'userId zaroori hai.');
  }

  const kycSnap = await db.collection('users').doc(userId).collection('private').doc('kyc').get();
  const { documentPublicId, documentFormat } = kycSnap.data() || {};
  if (!documentPublicId) {
    throw new HttpsError('not-found', 'KYC document nahi mila.');
  }

  configureCloudinary();
  const url = cloudinary.utils.private_download_url(documentPublicId, documentFormat || 'jpg', {
    resource_type: 'image',
    type: 'authenticated',
    expires_at: Math.floor(Date.now() / 1000) + 300,
  });

  return { url };
});

// ── Shaadi confirmed → archive both profiles server-side ──────────────────
// Archiving used to depend on the initiator's client being open in that
// specific chat (a useEffect watching the live snapshot). If they weren't,
// their profile silently stayed active/matchable forever. This trigger
// fires the moment status flips to 'confirmed', independent of either
// client's online state, and archives both users.
exports.onShaadiConfirmed = onDocumentUpdated('shaadi_requests/{chatId}', async (event) => {
  const before = event.data.before.data();
  const after  = event.data.after.data();
  if (before.status === after.status || after.status !== 'confirmed') return;

  const { initiatorId, receiverId } = after;
  const archive = (uid, otherUid) => db.collection('users').doc(uid).update({
    maritalStatus: 'married',
    marriedAt: FieldValue.serverTimestamp(),
    marriedWith: otherUid,
    isActive: false,
  });

  await Promise.all([
    archive(initiatorId, receiverId),
    archive(receiverId, initiatorId),
  ]);
});

// ── 1. New interest received ───────────────────────────────────────────────
exports.onNewInterest = onDocumentCreated('interests/{id}', async (event) => {
  const { senderId, receiverId } = event.data.data();
  const senderSnap = await db.collection('users').doc(senderId).get();
  const senderName = senderSnap.data()?.name || 'Kisi ne';

  await pushToUser(
    receiverId,
    '💌 Naya Interest Mila!',
    `${senderName} ne aapka profile pasand kiya`,
    '/interests'
  );
});

// ── 2. Interest accepted → notify the original sender ─────────────────────
exports.onInterestUpdated = onDocumentUpdated('interests/{id}', async (event) => {
  const before = event.data.before.data();
  const after  = event.data.after.data();
  if (before.status === after.status || after.status !== 'accepted') return;

  const receiverSnap = await db.collection('users').doc(after.receiverId).get();
  const receiverName = receiverSnap.data()?.name || 'Aapke match ne';

  await pushToUser(
    after.senderId,
    '🎉 Interest Accept Hua!',
    `${receiverName} ne aapka interest accept kar liya. Ab chat karein!`,
    '/chat'
  );
});

// ── 3. New chat message ────────────────────────────────────────────────────
exports.onNewMessage = onDocumentCreated('chats/{chatId}/messages/{msgId}', async (event) => {
  const { senderId, text } = event.data.data();
  const chatId = event.params.chatId;

  const chatSnap = await db.collection('chats').doc(chatId).get();
  if (!chatSnap.exists) return;

  const recipientId = (chatSnap.data().participants || []).find(id => id !== senderId);
  if (!recipientId) return;

  const senderSnap = await db.collection('users').doc(senderId).get();
  const senderName = senderSnap.data()?.name || 'Naya message';
  const preview = text.length > 60 ? text.slice(0, 60) + '…' : text;

  await pushToUser(recipientId, `💬 ${senderName}`, preview, '/chat');
});
