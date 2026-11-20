DELETE FROM honeypot;
ALTER TABLE honeypot ADD COLUMN delete_seconds BIGINT;
