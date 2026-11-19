import os
from dotenv import load_dotenv

load_dotenv()
CLIENT_ID = os.environ["DISCORD_CLIENT_ID"]
CLIENT_SECRET = os.environ["DISCORD_CLIENT_SECRET"]
BOT_TOKEN = os.environ["DISCORD_BOT_TOKEN"]
REDIRECT_URI = os.environ["REDIRECT_URI"]
FRONTEND_URL = os.environ["FRONTEND_URL"]
SECURE_COOKIES = os.environ.get("SECURE_COOKIES", "false").lower() == "true"
DATABASE_URL = os.environ["DATABASE_URL"]
SESSION_SECRET = os.environ["SESSION_SECRET"]
API = "https://discord.com/api"

ADMINISTRATOR = 1 << 3
MANAGE_GUILD = 1 << 5
TEXT, VOICE, CATEGORY, ANNOUNCEMENT = 0, 2, 4, 5
MODULE_IDS = ["autoroles", "reactionroles"]
