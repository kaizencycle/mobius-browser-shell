# OAA API - Model-Agnostic AI Tutoring

> Constitutional AI Architecture: **No vendor lock-in**

## Architecture

```
┌─────────────────────────────────────────────┐
│         Mobius Browser (Frontend)           │
│              OAALab Component               │
└────────────────┬────────────────────────────┘
                 │
                 │ POST /api/tutor
                 │ { subject, message, history }
                 │
┌────────────────▼────────────────────────────┐
│          OAA API (Backend)                  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │   LLM Factory (Model Agnostic)       │  │
│  │                                      │  │
│  │  provider = env.get('LLM_PROVIDER')  │  │
│  │  if provider == 'anthropic': Claude  │  │
│  │  elif provider == 'openai': GPT      │  │
│  │  elif provider == 'google': Gemini   │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐     │
│  │Anthropic│ │ OpenAI  │ │  Google  │     │
│  │ Adapter │ │ Adapter │ │  Adapter │     │
│  └─────────┘ └─────────┘ └──────────┘     │
└─────────────────────────────────────────────┘
```

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Set API key (at least one)
export ANTHROPIC_API_KEY=sk-ant-...
# or
export OPENAI_API_KEY=sk-...
# or
export GOOGLE_API_KEY=...

# 3. Run server
python app.py
```

## API Endpoints

### `POST /api/tutor`
Chat with the AI tutor.

```json
{
  "subject": "math",
  "message": "What is calculus?",
  "conversationHistory": [
    {"role": "user", "content": "Hi"},
    {"role": "assistant", "content": "Hello!"}
  ],
  "provider": "anthropic"  // optional override
}
```

**Response:**
```json
{
  "response": "Calculus is...",
  "model": "Claude (claude-sonnet-4-20250514)",
  "provider": "anthropic",
  "subject": "math"
}
```

### `GET /api/tutor/providers`
List available LLM providers.

```json
{
  "providers": ["anthropic", "openai", "google"],
  "default": "anthropic"
}
```

### `GET /api/tutor/health`
Health check.

```json
{
  "status": "healthy",
  "providers_configured": 2,
  "providers": ["anthropic", "google"]
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LLM_PROVIDER` | Default provider | `anthropic` |
| `LLM_MODEL` | Override model | Provider default |
| `ANTHROPIC_API_KEY` | Claude API key | - |
| `OPENAI_API_KEY` | GPT API key | - |
| `GOOGLE_API_KEY` | Gemini API key | - |
| `PORT` | Server port | `5000` |

## Supported Subjects

- `math` - Mathematics (Calculus, Linear Algebra, etc.)
- `physics` - Physics (Mechanics, Quantum, etc.)
- `cs` - Computer Science (Algorithms, Systems, etc.)
- `bio` - Biology (Genetics, Ecology, etc.)
- `chem` - Chemistry (Organic, Inorganic, etc.)
- `eng` - Engineering (Robotics, Aerospace, etc.)
- `astro` - Astronomy (Cosmology, Astrophysics, etc.)
- `earth` - Earth Science (Geology, Climate, etc.)

## Deployment (Render)

1. Create a new Web Service
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `gunicorn app:app`
4. Add environment variables:
   - `LLM_PROVIDER=anthropic`
   - `ANTHROPIC_API_KEY=sk-ant-...`

## Adding New Providers

1. Create `adapters/new_adapter.py` implementing `LLMAdapter`
2. Add to `adapters/__init__.py`
3. Register in `LLMFactory._adapters`

---

*"We heal as we walk. We learn as we build."* — Mobius Systems
