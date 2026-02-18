# AI Setup Guide - Hugging Face Integration

This guide explains how to set up the AI-powered analytics features using Hugging Face.

## Overview

The system uses a modular AI service layer that supports multiple AI providers. Currently, it's configured to use Hugging Face's Mistral-7B model for intelligent analysis.

## Architecture

```
AI Service Layer (api/services/ai_service.py)
├── AIProvider (Abstract Base Class)
├── HuggingFaceProvider (Implementation)
└── AIService (Main Service Manager)

Views (api/views.py)
├── admin_ai_inventory_analysis
├── admin_ai_borrow_analysis
└── admin_ai_custom_analysis
```

## Setup Instructions

### 1. Get Hugging Face API Key

1. Go to https://huggingface.co/
2. Sign up for a free account (no credit card required)
3. Go to Settings → Access Tokens
4. Create a new token with "read" access
5. Copy the token

### 2. Configure Environment Variables

Add to your `.env` file:

```bash
HUGGINGFACE_API_KEY=hf_your_token_here
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

The `requests` library is required for API calls.

### 4. Test the Setup

```bash
python manage.py shell
```

Then run:

```python
from api.services.ai_service import ai_service

# Check if AI is available
print(ai_service.is_ai_available())  # Should print True

# Test inventory analysis
test_data = {
    "items": [
        {"name": "Laptop", "utilization": 85, "available": 1, "quantity": 5}
    ],
    "week_items": [
        {"item__name": "Laptop", "count": 10}
    ],
    "month_items": [
        {"item__name": "Laptop", "count": 35}
    ]
}

analysis = ai_service.analyze_inventory(test_data)
print(analysis)
```

## API Endpoints

### 1. Inventory Analysis
```
GET /api/admin/ai/inventory-analysis/
```

Returns AI-powered inventory insights based on current stock and borrow patterns.

**Response:**
```json
{
  "ai_available": true,
  "analytics": { ... },
  "ai_analysis": "Detailed AI analysis text..."
}
```

### 2. Borrow Pattern Analysis
```
GET /api/admin/ai/borrow-analysis/
```

Returns AI analysis of borrowing patterns and trends.

**Response:**
```json
{
  "ai_available": true,
  "borrow_data": { ... },
  "ai_analysis": "Detailed AI analysis text..."
}
```

### 3. Custom Analysis
```
POST /api/admin/ai/custom-analysis/
```

Generate custom AI analysis for any data type.

**Request:**
```json
{
  "analysis_type": "user_behavior",
  "data": { ... }
}
```

**Response:**
```json
{
  "ai_available": true,
  "analysis_type": "user_behavior",
  "ai_analysis": "Detailed AI analysis text..."
}
```

## Extending the System

### Adding a New AI Provider

1. Create a new class inheriting from `AIProvider`:

```python
class NewAIProvider(AIProvider):
    def is_available(self) -> bool:
        # Check if provider is configured
        pass
    
    def analyze(self, prompt: str, context: Dict[str, Any] = None) -> str:
        # Implement analysis logic
        pass
```

2. Register in `AIService.__init__()`:

```python
self.providers = {
    "huggingface": HuggingFaceProvider(),
    "new_provider": NewAIProvider(),
}
```

3. Switch providers:

```python
ai_service.set_provider("new_provider")
```

### Adding New Analysis Types

Add new methods to `AIService`:

```python
def analyze_custom_metric(self, data: Dict[str, Any]) -> str:
    provider = self.get_active_provider()
    if not provider or not provider.is_available():
        return None
    
    prompt = self._format_custom_metric_prompt(data)
    return provider.analyze(prompt, context=data)

@staticmethod
def _format_custom_metric_prompt(data: Dict[str, Any]) -> str:
    # Format data for AI analysis
    return f"Analyze this data: {data}"
```

## Deployment

### On Supabase + Cloud Backend

1. Set `HUGGINGFACE_API_KEY` in your deployment environment variables
2. The AI service will automatically detect and use the API key
3. No additional setup required

### Environment Variables

```bash
# Required for AI features
HUGGINGFACE_API_KEY=hf_your_token_here

# Optional - for switching providers
AI_PROVIDER=huggingface  # default
```

## Troubleshooting

### "AI service not configured"
- Check that `HUGGINGFACE_API_KEY` is set in `.env`
- Verify the API key is valid on Hugging Face website
- Restart the Django server after adding the key

### Slow AI Responses
- Hugging Face free tier has rate limits
- Responses may take 10-30 seconds on first call
- Consider upgrading to paid tier for production

### API Errors
- Check Hugging Face status page
- Verify internet connection
- Check API key permissions

## Future Enhancements

The modular architecture supports:
- Multiple AI providers (OpenAI, Google, etc.)
- Caching of AI responses
- Async AI processing
- Custom model fine-tuning
- Real-time streaming responses

## Support

For issues with Hugging Face API:
- Visit: https://huggingface.co/docs/api-inference
- Check: https://status.huggingface.co/
