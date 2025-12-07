# oaa-api/adapters/llm_base.py
"""
Base classes for the model-agnostic LLM adapter system.
Constitutional principle: No vendor lock-in.
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Optional
from dataclasses import dataclass


@dataclass
class Message:
    """Standardized message format across all LLMs"""
    role: str  # 'user' or 'assistant'
    content: str
    
    def to_dict(self) -> Dict[str, str]:
        return {"role": self.role, "content": self.content}
    
    @classmethod
    def from_dict(cls, data: Dict[str, str]) -> 'Message':
        return cls(role=data['role'], content=data['content'])


class LLMAdapter(ABC):
    """
    Base adapter that all LLM providers must implement.
    
    This abstraction allows OAA to use any LLM provider
    (Claude, GPT, Gemini, Llama, local models) without
    the frontend or business logic caring about the provider.
    """
    
    @abstractmethod
    def generate_response(
        self,
        system_prompt: str,
        messages: List[Message],
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> str:
        """
        Generate a response from the LLM.
        
        Args:
            system_prompt: The system/instruction prompt
            messages: Conversation history
            temperature: Sampling temperature (0.0 to 1.0)
            max_tokens: Maximum tokens in response
            
        Returns:
            The assistant's response text
        """
        pass
    
    @abstractmethod
    def is_available(self) -> bool:
        """Check if this adapter is properly configured"""
        pass
    
    @abstractmethod
    def get_model_name(self) -> str:
        """Return the current model identifier"""
        pass
    
    @abstractmethod
    def get_provider_name(self) -> str:
        """Return the provider name (anthropic, openai, google)"""
        pass
