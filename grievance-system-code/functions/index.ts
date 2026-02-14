import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Auto-assign grievances based on category and department
export const autoAssignGrievance = functions.firestore
  .document('grievances/{grievanceId}')
  .onCreate(async (snap, context) => {
    const grievance = snap.data();
    
    // Skip if already assigned
    if (grievance.assignedTo) {
      return null;
    }

    try {
      // Find available authority based on category/department
      const authoritiesQuery = await admin.firestore()
        .collection('users')
        .where('role', '==', 'authority')
        .get();

      if (authoritiesQuery.empty) {
        console.log('No authorities found for assignment');
        return null;
      }

      // Simple assignment: assign to first available authority
      // In production, implement more sophisticated logic
      const assignedAuthority = authoritiesQuery.docs[0];
      
      await snap.ref.update({
        assignedTo: assignedAuthority.id,
        status: 'in_review',
      });

      // Send notification
      await sendNotification(assignedAuthority.id, {
        title: 'New Grievance Assigned',
        body: `A new ${grievance.category} grievance has been assigned to you`,
      });

      return null;
    } catch (error) {
      console.error('Error in autoAssignGrievance:', error);
      return null;
    }
  });

// SLA Escalation - Check for overdue grievances
export const escalateSLA = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    const oneHourAgo = admin.firestore.Timestamp.fromMillis(now.toMillis() - 3600000);

    try {
      // Find grievances past SLA deadline
      const overdueQuery = await admin.firestore()
        .collection('grievances')
        .where('status', 'in', ['submitted', 'in_review', 'action_taken'])
        .where('slaDeadline', '<', now)
        .get();

      for (const doc of overdueQuery.docs) {
        const grievance = doc.data();
        
        // Escalate to admin
        await doc.ref.update({
          escalated: true,
          escalatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Notify admin
        const adminsQuery = await admin.firestore()
          .collection('users')
          .where('role', '==', 'admin')
          .get();

        for (const adminDoc of adminsQuery.docs) {
          await sendNotification(adminDoc.id, {
            title: 'Grievance Escalated',
            body: `Grievance ${doc.id.substring(0, 8)} has exceeded SLA deadline`,
          });
        }
      }

      console.log(`Escalated ${overdueQuery.size} grievances`);
      return null;
    } catch (error) {
      console.error('Error in escalateSLA:', error);
      return null;
    }
  });

// Classify grievance using Vertex AI (placeholder)
export const classifyGrievance = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { text } = data;
  if (!text) {
    throw new functions.https.HttpsError('invalid-argument', 'Text is required');
  }

  // Placeholder for Vertex AI classification
  // In production, call Vertex AI endpoint here
  const category = classifyByKeywords(text);
  const urgencyScore = calculateUrgencyScore(text);

  return {
    category,
    urgencyScore,
  };
});

// Helper function for keyword-based classification
function classifyByKeywords(text: string): string {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('exam') || lowerText.includes('grade') || lowerText.includes('course')) {
    return 'academic';
  }
  if (lowerText.includes('building') || lowerText.includes('room') || lowerText.includes('facility')) {
    return 'infrastructure';
  }
  if (lowerText.includes('safety') || lowerText.includes('security') || lowerText.includes('harassment')) {
    return 'safety';
  }
  return 'administration';
}

// Helper function for urgency scoring
function calculateUrgencyScore(text: string): number {
  const urgencyKeywords = ['urgent', 'critical', 'immediate', 'emergency', 'asap'];
  const lowerText = text.toLowerCase();
  
  let score = 30;
  urgencyKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      score += 15;
    }
  });
  
  return Math.min(score, 100);
}

// Send notification helper
async function sendNotification(userId: string, notification: { title: string; body: string }) {
  // In production, implement FCM push notifications
  // For now, store in a notifications collection
  await admin.firestore().collection('notifications').add({
    userId,
    title: notification.title,
    body: notification.body,
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

