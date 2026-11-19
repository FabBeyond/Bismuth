CREATE TABLE reaction_roles (
  guild_id   BIGINT NOT NULL,
  message_id BIGINT NOT NULL,
  emoji      TEXT   NOT NULL,
  role_id    BIGINT NOT NULL,
  PRIMARY    KEY(message_id, emoji)
)
