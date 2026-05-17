const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();
const db = getFirestore();
const fcm = getMessaging();

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
