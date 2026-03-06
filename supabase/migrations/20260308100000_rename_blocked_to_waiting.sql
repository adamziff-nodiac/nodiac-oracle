-- Rename checkpoint_status enum value: Blocked → Waiting
-- This aligns with GTD terminology (the ball is in someone else's court)

ALTER TYPE checkpoint_status RENAME VALUE 'Blocked' TO 'Waiting';
