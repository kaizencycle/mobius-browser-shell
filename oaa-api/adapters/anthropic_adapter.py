# oaa-api/adapters/anthropic_adapter.py
"""
Anthropic Claude adapter for the model-agnostic LLM system.
"""
import os
from typing import List

from .llm_base import LLMAdapter, Message


class AnthropicAdapter(LLMAdapter):
    """Adapter for Anthropic's Claude models"""
    
    def __init__(self, model: str = "claude-sonnet-4-20250514"):
        self.model = model
        self.client = None
        
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if api_key:
            try:
                from anthropic import Anthropic
                self.client = Anthropic(api_key=api_key)
            except ImportError:
                pass
    
    def is_available(self) -> bool:
        return self.client is not None
    
    def get_model_name(self) -> str:
        return f"Claude ({self.model})"
    
    def get_provider_name(self) -> str:
        return "anthropic"
    
    def generate_response(
        self,
        system_prompt: str,
        messages: List[Message],
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> str:
        if not self.client:
            raise ValueError("Anthropic API key not configured")
        
        try:
            from anthropic import APIError
            
            # Convert our standard Message format to Anthropic format
            anthropic_messages = [
                {"role": msg.role, "content": msg.content}
                for msg in messages
            ]
            
            response = self.client.messages.create(
                model=self.model,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system_prompt,
                messages=anthropic_messages
            )
            
            return response.content[0].text
        
        except Exception as e:
            raise Exception(f"Anthropic API error: {str(e)}")
