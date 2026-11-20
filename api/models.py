from typing import Literal

from pydantic import BaseModel, Field

class ModuleUpdate(BaseModel):
    enabled: bool

class ReactionRole(BaseModel):
    channel_id: str
    message_id: str
    emoji: str
    role_id: str

class AutoRole(BaseModel):
    role_id: str

class Honeypot(BaseModel):
    channel_id: str
    action: Literal["kick", "ban"]
    message: str | None = Field(default=None, max_length=2000)
    delete_seconds: int = Field(default=3600, ge=0, le=604800)

class SendMessage(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
