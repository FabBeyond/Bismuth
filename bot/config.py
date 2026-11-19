import os

from dotenv import load_dotenv

load_dotenv()

TOKEN = os.environ["DISCORD_TOKEN"]
DATABASE_URL = os.getenv("DATABASE_URL")
DEV_GUILD_ID = int(os.getenv("DEV_GUILD_ID", 0)) or None
