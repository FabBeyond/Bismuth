DELETE FROM reaction_roles;
ALTER TABLE reaction_roles ADD COLUMN channel_id BIGINT;
