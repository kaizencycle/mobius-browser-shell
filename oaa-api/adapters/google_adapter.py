# oaa-api/adapters/google_adapter.py
"""
Google Gemini adapter for the model-agnostic LLM system.
"""
import os
from typing import List

from .llm_base import LLMAdapter, Message


class GoogleAdapter(LLMAdapter):
    """Adapter for Google's Gemini models"""
    
    def __init__(self, model: str = "gemini-2.0-flash-exp"):
        self.model_name = model
        self.model = None
        
        api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
        if api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=api_key)
                self.model = genai.GenerativeModel(model)
            except ImportError:
                pass
    
    def is_available(self) -> bool:
        return self.model is not None
    
    def get_model_name(self) -> str:
        return f"Gemini ({self.model_name})"
    
    def get_provider_name(self) -> str:
        return "google"
    
    def generate_response(
        self,
        system_prompt: str,
        messages: List[Message],
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> str:
        if not self.model:
            raise ValueError("Google API key not configured")
        
        try:
            # Build the full conversation as a prompt
            # Gemini works best with a combined prompt approach
            full_prompt = f"{system_prompt}\n\n"
            
            for msg in messages:
                role_prefix = "Student: " if msg.role == "user" else "Tutor: "
                full_prompt += f"{role_prefix}{msg.content}\n\n"
            
            full_prompt += "Tutor: "
            
            response = self.model.generate_content(
                full_prompt,
                generation_config={
                    "temperature": temperature,
                    "max_output_tokens": max_tokens,
                }
            )
            
            return response.text
        
        except Exception as e:
            raise Exception(f"Google API error: {str(e)}")
