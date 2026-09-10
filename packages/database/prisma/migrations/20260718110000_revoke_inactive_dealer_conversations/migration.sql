-- Close dealer conversation participation for memberships and organizations
-- that were already inactive before transactional revocation was introduced.
-- This migration was confirmed as pending on the configured Neon database on
-- 2026-07-22 before these safety guards were added.
SET lock_timeout = '5s';
SET statement_timeout = '30s';

-- Refuse to touch participation data if its tenant bindings are inconsistent.
-- The application authorizes dealer messages through the same account/member,
-- member/organization and conversation/organization relationships.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "ConversationParticipant" AS participant
    LEFT JOIN "DealerMember" AS member
      ON member."id" = participant."dealerMemberId"
    JOIN "Conversation" AS conversation
      ON conversation."id" = participant."conversationId"
    WHERE
      (
        participant."role" = 'dealer_member'
        AND (
          member."id" IS NULL
          OR participant."accountId" <> member."accountId"
          OR conversation."dealerOrgId" IS DISTINCT FROM member."dealerOrgId"
        )
      )
      OR (
        participant."role" <> 'dealer_member'
        AND participant."dealerMemberId" IS NOT NULL
      )
  ) THEN
    RAISE EXCEPTION
      'Dealer conversation tenant bindings are inconsistent; refusing revocation backfill';
  END IF;
END $$;

UPDATE "ConversationParticipant" AS participant
SET "leftAt" = COALESCE(
  member."disabledAt",
  member."clerkDeletedAt",
  organization."deletedAt",
  CURRENT_TIMESTAMP
)
FROM "DealerMember" AS member
JOIN "DealerOrg" AS organization ON organization."id" = member."dealerOrgId"
WHERE participant."dealerMemberId" = member."id"
  AND participant."leftAt" IS NULL
  AND (
    member."status" <> 'active'
    OR member."disabledAt" IS NOT NULL
    OR member."clerkDeletedAt" IS NOT NULL
    OR organization."deletedAt" IS NOT NULL
  );

RESET statement_timeout;
RESET lock_timeout;
