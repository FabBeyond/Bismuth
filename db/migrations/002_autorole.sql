CREATE TABLE autoroles (
  guild_id BIGINT NOT NULL,
  role_id  BIGINT NOT NULL,
  PRIMARY KEY(guild_id, role_id)
)
