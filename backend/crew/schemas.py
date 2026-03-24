from typing import Literal

from pydantic import BaseModel, Field


class FinalContentOutput(BaseModel):
    linkedin_post: str = Field(..., min_length=1)
    twitter_post: str = Field(..., min_length=1, max_length=280)
    image_prompt: str = Field(..., min_length=1)
    compliance_status: Literal["APPROVED", "REJECTED"]
    compliance_notes: str = Field(..., min_length=1)
