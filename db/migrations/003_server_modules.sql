CREATE TABLE server_modules (
  guild_id  BIGINT NOT NULL,
  module_id TEXT,
  enabled   BOOLEAN,
  PRIMARY KEY(guild_id, module_id)
)
