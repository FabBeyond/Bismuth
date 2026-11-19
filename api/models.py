from pydantic import BaseModel

class ModuleUpdate(BaseModel):
    enabled: bool

class ReactionRole(BaseModel):
    channel_id: str
    message_id: str
    emoji: str
    role_id: str

