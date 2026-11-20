CREATE TABLE bot_guilds (
  guild_id  BIGINT PRIMARY KEY,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now()
)
