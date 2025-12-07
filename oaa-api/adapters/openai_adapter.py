# oaa-api/adapters/openai_adapter.py
"""
OpenAI GPT adapter for the model-agnostic LLM system.
"""
import os
from typing import List

from .llm_base import LLMAdapter, Message


class OpenAIAdapter(LLMAdapter):
    """Adapter for OpenAI's GPT models"""
    
    def __init__(self, model: str = "gpt-4o"):
        self.model = model
        self.client = None
        
        api_key = os.environ.get("OPENAI_API_KEY")
        if api_key:
            try:
                from openai import OpenAI
                self.client = OpenAI(api_key=api_key)
            except ImportError:
                pass
    
    def is_available(self) -> bool:
        return self.client is not None
    
    def get_model_name(self) -> str:
        return f"GPT ({self.model})"
    
    def get_provider_name(self) -> str:
        return "openai"
    
    def generate_response(
        self,
        system_prompt: str,
        messages: List[Message],
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> str:
        if not self.client:
            raise ValueError("OpenAI API key not configured")
        
        try:
            # Convert to OpenAI format (includes system as a message)
            openai_messages = [
                {"role": "system", "content": system_prompt}
            ]
            openai_messages.extend([
                {"role": msg.role, "content": msg.content}
                for msg in messages
            ])
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=openai_messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            return response.choices[0].message.content
        
        except Exception as e:
            raise Exception(f"OpenAI API error: {str(e)}")
