CREATE TABLE level_settings (
  guild_id            BIGINT PRIMARY KEY,
  xp_min              INT     NOT NULL DEFAULT 15,
  xp_max              INT     NOT NULL DEFAULT 25,
  cooldown            INT     NOT NULL DEFAULT 60,
  curve_a             INT     NOT NULL DEFAULT 5,
  curve_b             INT     NOT NULL DEFAULT 50,
  announce_channel_id BIGINT,
  CHECK (xp_min >= 0 AND xp_min <= xp_max),
  CHECK (cooldown BETWEEN 0 AND 3600),
  CHECK (curve_a >= 0 AND curve_b >= 0 AND curve_a + curve_b > 0)
);
CREATE TABLE member_xp (
  guild_id BIGINT NOT NULL,
  user_id  BIGINT NOT NULL,
  xp       BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY(guild_id, user_id)
);
CREATE TABLE level_rewards (
  guild_id BIGINT NOT NULL,
  level    INT    NOT NULL,
  role_id  BIGINT NOT NULL,
  PRIMARY KEY(guild_id, level)
);

CREATE OR REPLACE FUNCTION notify_settings_changed() RETURNS trigger AS $$
DECLARE
  gid BIGINT;

BEGIN
  IF TG_OP = 'DELETE' THEN gid := OLD.guild_id; ELSE gid := NEW.guild_id; END IF;
  PERFORM pg_notify('settings_changed', TG_TABLE_NAME || ':' || gid);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER level_settings_notify
AFTER INSERT OR UPDATE OR DELETE ON level_settings
FOR EACH ROW EXECUTE FUNCTION notify_settings_changed();

CREATE TRIGGER server_modules_notify
AFTER INSERT OR UPDATE OR DELETE ON server_modules
FOR EACH ROW EXECUTE FUNCTION notify_settings_changed();
