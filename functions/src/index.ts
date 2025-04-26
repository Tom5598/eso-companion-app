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
admin.initializeApp();

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
    const survey = event.params.surveyId;
    if (!survey) return;

    const title = event.data?.data()?.title || 'New Survey';
    const surveyId = event.params.surveyId;

    // 1) Fetch all user emails once
    const usersSnap = await admin.firestore().collection('users').get();
    const emails = Array.from(
      new Set(
        usersSnap.docs
          .map(d => (d.data().email as string))
          .filter(e => !!e)
      )
    );
    if (emails.length === 0) return;

    // 2) Batch‐write into `mail/` for the Trigger Email extension
    const db = admin.firestore();
    const batch = db.batch();
    const mailCol = db.collection('mail');
    emails.forEach(email => {
      const docRef = mailCol.doc();
      batch.set(docRef, {
        to: email,
        message: {
          subject: `New Survey Available: ${title}`,
          html: `
            <p>Hello,</p>
            <p>A new survey titled "<strong>${title}</strong>" has been published.</p>
            <p>
              Please fill it out here:
              <a href="https://eso-companion-app-89474.web.app//surveys/${surveyId}">
                Take the Survey
              </a>
            </p>
            <p>Thank you!</p>
          `
        }
      });
    });

    // 3) Commit
    await batch.commit();
  }
);