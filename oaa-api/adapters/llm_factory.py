# oaa-api/adapters/llm_factory.py
"""
Factory for creating LLM adapters based on configuration.
Supports runtime provider switching via environment variables.
"""
import os
from typing import Optional, List

from .llm_base import LLMAdapter
from .anthropic_adapter import AnthropicAdapter
from .openai_adapter import OpenAIAdapter
from .google_adapter import GoogleAdapter


class LLMFactory:
    """
    Factory to create the appropriate LLM adapter based on configuration.
    
    Constitutional Principle: No vendor lock-in.
    Switch models with a single environment variable.
    """
    
    # Provider to adapter mapping
    _adapters = {
        'anthropic': AnthropicAdapter,
        'openai': OpenAIAdapter,
        'google': GoogleAdapter,
        'gemini': GoogleAdapter,  # Alias
    }
    
    # Default models per provider
    _default_models = {
        'anthropic': 'claude-sonnet-4-20250514',
        'openai': 'gpt-4o',
        'google': 'gemini-2.0-flash-exp',
        'gemini': 'gemini-2.0-flash-exp',
    }
    
    @classmethod
    def create_adapter(
        cls,
        provider: Optional[str] = None,
        model: Optional[str] = None
    ) -> LLMAdapter:
        """
        Create an LLM adapter based on environment configuration.
        
        Args:
            provider: Override provider (anthropic, openai, google)
            model: Override specific model
            
        Returns:
            Configured LLM adapter
            
        Environment Variables:
            LLM_PROVIDER: Default provider (default: anthropic)
            LLM_MODEL: Default model for the provider
            ANTHROPIC_API_KEY: Claude API key
            OPENAI_API_KEY: GPT API key  
            GOOGLE_API_KEY / GEMINI_API_KEY: Gemini API key
        """
        # Get provider from env or param
        provider = provider or os.environ.get("LLM_PROVIDER", "anthropic")
        provider = provider.lower()
        
        if provider not in cls._adapters:
            raise ValueError(f"Unknown LLM provider: {provider}. "
                           f"Available: {list(cls._adapters.keys())}")
        
        # Get model from env or param or default
        model = model or os.environ.get("LLM_MODEL") or cls._default_models.get(provider)
        
        # Create adapter
        adapter_class = cls._adapters[provider]
        adapter = adapter_class(model=model)
        
        # Verify adapter is available
        if not adapter.is_available():
            raise ValueError(
                f"LLM adapter '{provider}' is not properly configured. "
                f"Check API key environment variable."
            )
        
        return adapter
    
    @classmethod
    def get_available_providers(cls) -> List[str]:
        """Return list of providers that are currently available (have API keys)"""
        providers = []
        
        if os.environ.get("ANTHROPIC_API_KEY"):
            providers.append("anthropic")
        if os.environ.get("OPENAI_API_KEY"):
            providers.append("openai")
        if os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY"):
            providers.append("google")
        
        return providers
    
    @classmethod
    def get_default_provider(cls) -> str:
        """Get the default provider from env or first available"""
        env_provider = os.environ.get("LLM_PROVIDER", "").lower()
        
        if env_provider and env_provider in cls._adapters:
            return env_provider
        
        # Return first available
        available = cls.get_available_providers()
        return available[0] if available else "anthropic"
    
    @classmethod
    def create_best_available(cls, preferred: Optional[str] = None) -> LLMAdapter:
        """
        Create the best available adapter, with optional preference.
        Falls back to other providers if preferred is unavailable.
        """
        available = cls.get_available_providers()
        
        if not available:
            raise ValueError("No LLM providers configured. Please set at least one API key.")
        
        # Try preferred first
        if preferred and preferred.lower() in available:
            return cls.create_adapter(provider=preferred)
        
        # Fall back to first available
        return cls.create_adapter(provider=available[0])
