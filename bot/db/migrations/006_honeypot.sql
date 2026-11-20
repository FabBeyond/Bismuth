CREATE TABLE honeypot (
  guild_id   BIGINT NOT NULL,
  channel_id BIGINT NOT NULL,
  action     TEXT,
  message    TEXT,
  PRIMARY KEY(guild_id, channel_id)
)
