# Só Amizade - Security Specification & Access Control Model

## 1. Data Invariants
1. **Age Invariant**: Every registered user must have `is18Plus == true` and validated age. Minors under 18 are prohibited.
2. **Identity Integrity**: Users can never author a post, comment, friend request, message, or reaction on behalf of another user (`authorId == request.auth.uid`, `senderId == request.auth.uid`).
3. **Friendship Gate**: Private messages can only be sent and read if users are authorized participants of that conversation.
4. **Admin Protection**: Client users cannot escalate their own role (`role`, `isSuspended`, `isBanned`, `plan`). Roles and admin statuses are strictly protected and verified via `/admins/{uid}` or backend authorization.
5. **Report Isolation**: Normal users cannot read or delete reports filed by other users. Only admins/moderators can view and update the moderation queue.
6. **Audit Immutability**: `adminLogs` are append-only by authorized admins and can never be modified or deleted.
7. **PII Isolation**: Sensitive user fields like `birthDate` are strictly non-public; public profile reads do not expose personal verification details.
8. **Catch-All Default Deny**: All unspecified paths are closed by default: `match /{document=**} { allow read, write: if false; }`.

## 2. The Dirty Dozen Payloads (Targeted Malicious Payloads)
1. **Self-Promotion to Admin**: Sending `{ role: "admin", isBanned: false }` to `/users/{myUid}`. Expected: PERMISSION_DENIED.
2. **Impersonated Post Creation**: Sending `{ authorId: "victimUid", content: "Post prejudicial" }` to `/posts/{postId}`. Expected: PERMISSION_DENIED.
3. **Foreign Conversation Sniffing**: User C attempting to read `/conversations/{convAB}/messages`. Expected: PERMISSION_DENIED.
4. **Unauthenticated Read of Reports**: Anonymous client querying `/reports`. Expected: PERMISSION_DENIED.
5. **Tampering with Admin Audit Logs**: Normal user attempting to delete `/adminLogs/{logId}`. Expected: PERMISSION_DENIED.
6. **Resource Exhaustion Injection**: Post creation with 50,000 character string in `content`. Expected: PERMISSION_DENIED.
7. **Bypassing Friendship to Read Messages**: Non-participant querying private messages. Expected: PERMISSION_DENIED.
8. **Forging Verified Badge / Só Amizade+ Plan**: User attempting `{ plan: "plus" }` update without server payment validation. Expected: PERMISSION_DENIED.
9. **Malicious Document ID Poisoning**: Document path with non-alphanumeric malicious string `../../root`. Expected: PERMISSION_DENIED.
10. **Shadow Field Injection**: Adding `{ shadowGhostToken: "adminKey", isSuperUser: true }` to user profile. Expected: PERMISSION_DENIED.
11. **Altering Another User's Friend Request**: User B trying to change `senderId` or cancel User A's sent request. Expected: PERMISSION_DENIED.
12. **Modifying an Official Platform Announcement**: Normal user attempting to update or delete `/officialAnnouncements/{annId}`. Expected: PERMISSION_DENIED.
