/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { onDocumentCreated } from 'firebase-functions/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
admin.initializeApp();
const db = getFirestore();
export const httpSetAdmin = functions.https.onRequest(async (req, res) => {
  const uid = 'hVXAybOZyLSRB2VsgVm3y21le3E3';
  if (!uid) {
    res.status(400).send('Missing uid');
    return;
  }
  await admin.auth().setCustomUserClaims(uid, { admin: true });
  res.send(`Granted admin to ${uid}`);
});

// 1) Trigger on creation of any survey definition
export const notifyNewSurvey = onDocumentCreated(
  'surveys/{surveyId}',
  async (event) => {
    const surveyId = event.params.surveyId;
    if (!surveyId) return;
    const title = event.data?.data()?.title || 'New Survey';

    // 1) Fetch all user emails once
    const usersSnap = await admin.firestore().collection('users').get();
    const emails = Array.from(
      new Set(
        usersSnap.docs.map((d) => d.data().email as string).filter((e) => !!e)
      )
    );
    if (emails.length === 0) return;

    // 2) Batch‐write into `mail/` for the Trigger Email extension
    const db = admin.firestore();
    const batch = db.batch();
    const mailCol = db.collection('mail');
    emails.forEach((email) => {
      const docRef = mailCol.doc();
      batch.set(docRef, {
        to: email,
        message: {
          subject: `New Survey Available On ESO Companion-App`,
          html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <title>Survey Notification</title>
            </head>
            <body style="margin:0; padding:0; background-color:#f5f5f5;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f5f5f5;">
                <tr>
                  <td align="center" style="padding:20px 0;">
                    <!-- Container -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; background-color:#ffffff; border-radius:8px; overflow:hidden; font-family:Arial, sans-serif;">
                      
                      <!-- Header -->
                      <tr>
                        <td style="background-color:#0052cc; padding:20px; text-align:center;">
                          <h1 style="color:#ffffff; margin:0; font-size:22px; line-height:1.2;">Survey Notification</h1>
                        </td>
                      </tr>
                      
                      <!-- Body -->
                      <tr>
                        <td style="padding:20px; color:#333333; font-size:16px; line-height:1.5;">
                          <p style="margin-top:0;">Hello,</p>
                          <p>A new survey has been published.</p>
                          <p>Please fill it out by clicking the button below:</p>
                          
                          <!-- Button -->
                          <p style="text-align:center; margin:30px 0;">
                            <a href="https://eso-companion-app-89474.web.app/survey/${surveyId}"
                              style="background-color:#0052cc; color:#ffffff; text-decoration:none; padding:12px 24px; border-radius:4px; display:inline-block; font-weight:bold; font-size:16px;">
                              Take the Survey
                            </a>
                          </p>
                          
                          <p>Thank you!</p>
                        </td>
                      </tr>
                      
                      <!-- Footer -->
                      <tr>
                        <td style="background-color:#f0f0f0; padding:15px 20px; font-size:12px; color:#777777; text-align:center;">
                          <p style="margin:0;">&copy; 2025 Your Company. All rights reserved.</p>
                          <p style="margin:5px 0 0;">1234 Main St, Suite 100, City, Country</p>
                        </td>
                      </tr>
                      
                    </table>
                    <!-- End Container -->
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `,
        },
      });
    });
    // 3) Commit
    await batch.commit();
  }
);

/**
 * Triggered whenever a message is published to the
 * Pub/Sub topic "daily-commodity-update".
 */
export const dailyCommodityPubSub = functions.pubsub.onMessagePublished(
  'daily-commodity-update',
  async (event) => {
    const today = new Date();
    const batch = db.batch();
    // Fetch all commodity docs
    const snap = await db.collection('commodities').get();
    snap.docs.forEach((doc) => {
      const newPrice = +(Math.random() * 100).toFixed(2);
      const newVolume = Math.floor(Math.random() * 1000 + 100);
      const entry = {
        date: today,
        price: newPrice,
        volume: newVolume,
      };
      batch.update(doc.ref, {
        currentPrice: newPrice,
        currentVolume: newVolume,
        historical: FieldValue.arrayUnion(entry),
      });
    });
    await batch.commit();
  }
);

export const purgeReadNotifications = functions.pubsub.onMessagePublished(
  'weekly-read-notifications-purge',
  async () => {
    const snapshot = await db
      .collectionGroup('notifications')
      .where('read', '==', true)
      .get();

    if (snapshot.empty) return;
    let batch = db.batch();
    let count = 0;
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      count++;
      if (count === 500) {
        batch.commit();
        batch = db.batch();
        count = 0;
      }
    });
    if (count > 0) {
      await batch.commit();
    }
  }
);
