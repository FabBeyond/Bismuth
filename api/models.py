from pydantic import BaseModel, Field

class ModuleUpdate(BaseModel):
    enabled: bool

class ReactionRole(BaseModel):
    channel_id: str
    message_id: str
    emoji: str
    role_id: str

class SendMessage(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
