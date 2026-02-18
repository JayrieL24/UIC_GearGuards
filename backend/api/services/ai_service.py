"""
AI Service Layer - Modular and extensible for future AI features
Supports multiple AI providers and analysis types
"""

import os
import requests
from abc import ABC, abstractmethod
from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)


class AIProvider(ABC):
    """Abstract base class for AI providers"""

    @abstractmethod
    def analyze(self, prompt: str, context: Dict[str, Any] = None) -> str:
        """Analyze data and return insights"""
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Check if provider is available"""
        pass


class GoogleGeminiProvider(AIProvider):
    """Google Gemini API provider - completely free"""

    def __init__(self):
        self.api_key = os.getenv("GOOGLE_GEMINI_API_KEY")
        self.api_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
        self.timeout = 30

    def is_available(self) -> bool:
        """Check if Google Gemini API key is configured"""
        return bool(self.api_key)

    def analyze(self, prompt: str, context: Dict[str, Any] = None) -> str:
        """Call Google Gemini API for analysis"""
        if not self.is_available():
            logger.warning("Google Gemini API key not configured")
            return self._generate_fallback_analysis(context)

        try:
            url = f"{self.api_url}?key={self.api_key}"
            headers = {"Content-Type": "application/json"}
            payload = {
                "contents": [{
                    "parts": [{
                        "text": f"You are an expert equipment management analyst. Provide concise, actionable insights.\n\n{prompt}"
                    }]
                }],
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 500,
                }
            }

            response = requests.post(
                url,
                headers=headers,
                json=payload,
                timeout=self.timeout,
            )

            if response.status_code == 200:
                result = response.json()
                if "candidates" in result and len(result["candidates"]) > 0:
                    text = result["candidates"][0]["content"]["parts"][0]["text"]
                    return text.strip()
                return self._generate_fallback_analysis(context)
            else:
                logger.error(f"Google Gemini API error: {response.status_code}")
                logger.error(f"Response: {response.text}")
                return self._generate_fallback_analysis(context)

        except requests.exceptions.Timeout:
            logger.error("Google Gemini API request timeout")
            return self._generate_fallback_analysis(context)
        except Exception as e:
            logger.error(f"Google Gemini API error: {str(e)}")
            return self._generate_fallback_analysis(context)

    def _generate_fallback_analysis(self, context: Dict[str, Any]) -> str:
        """Generate rule-based analysis when AI is unavailable"""
        if not context:
            return "Unable to generate analysis - no data available."
        
        if "items" in context:
            return self._analyze_inventory_fallback(context)
        elif "stats" in context:
            return self._analyze_borrow_fallback(context)
        else:
            return "Analysis generated based on available data patterns."

    def _analyze_inventory_fallback(self, data: Dict[str, Any]) -> str:
        """Generate inventory analysis based on data patterns"""
        items = data.get("items", [])
        week_items = data.get("week_items", [])
        
        analysis = []
        analysis.append("📊 INVENTORY ANALYSIS\n")
        
        high_util = [item for item in items if item.get("utilization", 0) > 80]
        if high_util:
            analysis.append(f"⚠️ HIGH DEMAND ALERT: {len(high_util)} items are over 80% utilized:")
            for item in high_util[:3]:
                analysis.append(f"  • {item['name']}: {item['utilization']}% utilized - Consider increasing stock")
        
        low_util = [item for item in items if item.get("utilization", 0) < 20 and item.get("quantity", 0) > 0]
        if low_util:
            analysis.append(f"\n💡 OPTIMIZATION OPPORTUNITY: {len(low_util)} items are underutilized:")
            for item in low_util[:3]:
                analysis.append(f"  • {item['name']}: Only {item['utilization']}% utilized - Review necessity")
        
        if week_items:
            analysis.append(f"\n🔥 TRENDING THIS WEEK:")
            for item in week_items[:3]:
                analysis.append(f"  • {item['item__name']}: {item['count']} borrows")
        
        analysis.append("\n✅ RECOMMENDATIONS:")
        if high_util:
            analysis.append("  1. Increase stock for high-demand items to prevent shortages")
        if low_util:
            analysis.append("  2. Consider reallocating budget from underutilized equipment")
        if week_items:
            analysis.append("  3. Monitor trending items for potential stock increases")
        
        return "\n".join(analysis)

    def _analyze_borrow_fallback(self, data: Dict[str, Any]) -> str:
        """Generate borrow pattern analysis based on data patterns"""
        stats = data.get("stats", {})
        top_borrowers = data.get("top_borrowers", [])
        
        analysis = []
        analysis.append("📈 BORROW PATTERN ANALYSIS\n")
        
        total = stats.get("total_borrows", 0)
        active = stats.get("active_borrows", 0)
        late = stats.get("late_borrows", 0)
        not_returned = stats.get("not_returned_borrows", 0)
        
        if total > 0:
            late_rate = (late / total) * 100
            not_returned_rate = (not_returned / total) * 100
            
            analysis.append(f"📊 SYSTEM HEALTH:")
            analysis.append(f"  • Total Borrows: {total}")
            analysis.append(f"  • Currently Active: {active}")
            analysis.append(f"  • Late Return Rate: {late_rate:.1f}%")
            analysis.append(f"  • Not Returned Rate: {not_returned_rate:.1f}%")
            
            if late_rate > 10:
                analysis.append(f"\n⚠️ CONCERN: Late return rate is {late_rate:.1f}% (target: <10%)")
                analysis.append("  Consider implementing reminder notifications or penalties")
            
            if not_returned_rate > 5:
                analysis.append(f"\n🚨 ALERT: {not_returned_rate:.1f}% of items not returned")
                analysis.append("  Immediate follow-up required with borrowers")
        
        if top_borrowers:
            analysis.append(f"\n👥 TOP BORROWERS:")
            for borrower in top_borrowers[:5]:
                analysis.append(f"  • {borrower['borrower__username']}: {borrower['count']} items")
        
        analysis.append("\n✅ RECOMMENDATIONS:")
        if late > 0:
            analysis.append("  1. Implement automated reminder system for due dates")
        if not_returned > 0:
            analysis.append("  2. Contact users with unreturned items immediately")
        analysis.append("  3. Consider incentives for on-time returns")
        analysis.append("  4. Review borrowing policies if issues persist")
        
        return "\n".join(analysis)


class OpenAIProvider(AIProvider):
    """OpenAI API provider for text generation"""

    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.api_url = "https://api.openai.com/v1/chat/completions"
        self.model = "gpt-3.5-turbo"
        self.timeout = 30

    def is_available(self) -> bool:
        """Check if OpenAI API key is configured"""
        return bool(self.api_key)

    def analyze(self, prompt: str, context: Dict[str, Any] = None) -> str:
        """Call OpenAI API for analysis"""
        if not self.is_available():
            logger.warning("OpenAI API key not configured")
            return self._generate_fallback_analysis(context)

        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": self.model,
                "messages": [
                    {
                        "role": "system",
                        "content": "You are an expert equipment management analyst. Provide concise, actionable insights based on data."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "max_tokens": 500,
                "temperature": 0.7
            }

            response = requests.post(
                self.api_url,
                headers=headers,
                json=payload,
                timeout=self.timeout,
            )

            if response.status_code == 200:
                result = response.json()
                return result["choices"][0]["message"]["content"].strip()
            else:
                logger.error(f"OpenAI API error: {response.status_code}")
                logger.error(f"Response: {response.text}")
                return self._generate_fallback_analysis(context)

        except requests.exceptions.Timeout:
            logger.error("OpenAI API request timeout")
            return self._generate_fallback_analysis(context)
        except Exception as e:
            logger.error(f"OpenAI API error: {str(e)}")
            return self._generate_fallback_analysis(context)

    def _generate_fallback_analysis(self, context: Dict[str, Any]) -> str:
        """Generate rule-based analysis when AI is unavailable"""
        if not context:
            return "Unable to generate analysis - no data available."
        
        # Check if this is inventory or borrow analysis based on context keys
        if "items" in context:
            return self._analyze_inventory_fallback(context)
        elif "stats" in context:
            return self._analyze_borrow_fallback(context)
        else:
            return "Analysis generated based on available data patterns."

    def _analyze_inventory_fallback(self, data: Dict[str, Any]) -> str:
        """Generate inventory analysis based on data patterns"""
        items = data.get("items", [])
        week_items = data.get("week_items", [])
        
        analysis = []
        analysis.append("📊 INVENTORY ANALYSIS\n")
        
        # High utilization items
        high_util = [item for item in items if item.get("utilization", 0) > 80]
        if high_util:
            analysis.append(f"⚠️ HIGH DEMAND ALERT: {len(high_util)} items are over 80% utilized:")
            for item in high_util[:3]:
                analysis.append(f"  • {item['name']}: {item['utilization']}% utilized - Consider increasing stock")
        
        # Low utilization items
        low_util = [item for item in items if item.get("utilization", 0) < 20 and item.get("quantity", 0) > 0]
        if low_util:
            analysis.append(f"\n💡 OPTIMIZATION OPPORTUNITY: {len(low_util)} items are underutilized:")
            for item in low_util[:3]:
                analysis.append(f"  • {item['name']}: Only {item['utilization']}% utilized - Review necessity")
        
        # Popular items
        if week_items:
            analysis.append(f"\n🔥 TRENDING THIS WEEK:")
            for item in week_items[:3]:
                analysis.append(f"  • {item['item__name']}: {item['count']} borrows")
        
        analysis.append("\n✅ RECOMMENDATIONS:")
        if high_util:
            analysis.append("  1. Increase stock for high-demand items to prevent shortages")
        if low_util:
            analysis.append("  2. Consider reallocating budget from underutilized equipment")
        if week_items:
            analysis.append("  3. Monitor trending items for potential stock increases")
        
        return "\n".join(analysis)

    def _analyze_borrow_fallback(self, data: Dict[str, Any]) -> str:
        """Generate borrow pattern analysis based on data patterns"""
        stats = data.get("stats", {})
        top_borrowers = data.get("top_borrowers", [])
        
        analysis = []
        analysis.append("📈 BORROW PATTERN ANALYSIS\n")
        
        total = stats.get("total_borrows", 0)
        active = stats.get("active_borrows", 0)
        late = stats.get("late_borrows", 0)
        not_returned = stats.get("not_returned_borrows", 0)
        
        # Overall health
        if total > 0:
            late_rate = (late / total) * 100
            not_returned_rate = (not_returned / total) * 100
            
            analysis.append(f"📊 SYSTEM HEALTH:")
            analysis.append(f"  • Total Borrows: {total}")
            analysis.append(f"  • Currently Active: {active}")
            analysis.append(f"  • Late Return Rate: {late_rate:.1f}%")
            analysis.append(f"  • Not Returned Rate: {not_returned_rate:.1f}%")
            
            if late_rate > 10:
                analysis.append(f"\n⚠️ CONCERN: Late return rate is {late_rate:.1f}% (target: <10%)")
                analysis.append("  Consider implementing reminder notifications or penalties")
            
            if not_returned_rate > 5:
                analysis.append(f"\n🚨 ALERT: {not_returned_rate:.1f}% of items not returned")
                analysis.append("  Immediate follow-up required with borrowers")
        
        # Top borrowers
        if top_borrowers:
            analysis.append(f"\n👥 TOP BORROWERS:")
            for borrower in top_borrowers[:5]:
                analysis.append(f"  • {borrower['borrower__username']}: {borrower['count']} items")
        
        analysis.append("\n✅ RECOMMENDATIONS:")
        if late > 0:
            analysis.append("  1. Implement automated reminder system for due dates")
        if not_returned > 0:
            analysis.append("  2. Contact users with unreturned items immediately")
        analysis.append("  3. Consider incentives for on-time returns")
        analysis.append("  4. Review borrowing policies if issues persist")
        
        return "\n".join(analysis)


class HuggingFaceProvider(AIProvider):
    """Hugging Face API provider for text generation"""

    def __init__(self):
        self.api_key = os.getenv("HUGGINGFACE_API_KEY")
        # Using Facebook's BART for summarization/text generation - very stable
        self.model = "facebook/bart-large-cnn"
        # Updated to new Hugging Face router endpoint
        self.api_url = f"https://router.huggingface.co/models/{self.model}"
        self.timeout = 30

    def is_available(self) -> bool:
        """Check if Hugging Face API key is configured"""
        return bool(self.api_key)

    def analyze(self, prompt: str, context: Dict[str, Any] = None) -> str:
        """Call Hugging Face API for analysis with fallback to rule-based analysis"""
        if not self.is_available():
            logger.warning("Hugging Face API key not configured")
            return self._generate_fallback_analysis(context)

        try:
            headers = {"Authorization": f"Bearer {self.api_key}"}
            # BART uses summarization, so we format the prompt differently
            payload = {
                "inputs": prompt,
                "parameters": {
                    "max_length": 500,
                    "min_length": 100,
                    "do_sample": False,
                },
            }

            response = requests.post(
                self.api_url,
                headers=headers,
                json=payload,
                timeout=self.timeout,
            )

            if response.status_code == 200:
                result = response.json()
                if isinstance(result, list) and len(result) > 0:
                    return result[0].get("summary_text", "").strip()
                elif isinstance(result, dict):
                    return result.get("summary_text", "").strip()
                return self._generate_fallback_analysis(context)
            else:
                logger.error(f"Hugging Face API error: {response.status_code}")
                logger.error(f"Response: {response.text}")
                return self._generate_fallback_analysis(context)

        except requests.exceptions.Timeout:
            logger.error("Hugging Face API request timeout")
            return self._generate_fallback_analysis(context)
        except Exception as e:
            logger.error(f"Hugging Face API error: {str(e)}")
            return self._generate_fallback_analysis(context)

    def _generate_fallback_analysis(self, context: Dict[str, Any]) -> str:
        """Generate rule-based analysis when AI is unavailable"""
        if not context:
            return "Unable to generate analysis - no data available."
        
        # Check if this is inventory or borrow analysis based on context keys
        if "items" in context:
            return self._analyze_inventory_fallback(context)
        elif "stats" in context:
            return self._analyze_borrow_fallback(context)
        else:
            return "Analysis generated based on available data patterns."

    def _analyze_inventory_fallback(self, data: Dict[str, Any]) -> str:
        """Generate inventory analysis based on data patterns"""
        items = data.get("items", [])
        week_items = data.get("week_items", [])
        
        analysis = []
        analysis.append("📊 INVENTORY ANALYSIS\n")
        
        # High utilization items
        high_util = [item for item in items if item.get("utilization", 0) > 80]
        if high_util:
            analysis.append(f"⚠️ HIGH DEMAND ALERT: {len(high_util)} items are over 80% utilized:")
            for item in high_util[:3]:
                analysis.append(f"  • {item['name']}: {item['utilization']}% utilized - Consider increasing stock")
        
        # Low utilization items
        low_util = [item for item in items if item.get("utilization", 0) < 20 and item.get("quantity", 0) > 0]
        if low_util:
            analysis.append(f"\n💡 OPTIMIZATION OPPORTUNITY: {len(low_util)} items are underutilized:")
            for item in low_util[:3]:
                analysis.append(f"  • {item['name']}: Only {item['utilization']}% utilized - Review necessity")
        
        # Popular items
        if week_items:
            analysis.append(f"\n🔥 TRENDING THIS WEEK:")
            for item in week_items[:3]:
                analysis.append(f"  • {item['item__name']}: {item['count']} borrows")
        
        analysis.append("\n✅ RECOMMENDATIONS:")
        if high_util:
            analysis.append("  1. Increase stock for high-demand items to prevent shortages")
        if low_util:
            analysis.append("  2. Consider reallocating budget from underutilized equipment")
        if week_items:
            analysis.append("  3. Monitor trending items for potential stock increases")
        
        return "\n".join(analysis)

    def _analyze_borrow_fallback(self, data: Dict[str, Any]) -> str:
        """Generate borrow pattern analysis based on data patterns"""
        stats = data.get("stats", {})
        top_borrowers = data.get("top_borrowers", [])
        
        analysis = []
        analysis.append("📈 BORROW PATTERN ANALYSIS\n")
        
        total = stats.get("total_borrows", 0)
        active = stats.get("active_borrows", 0)
        late = stats.get("late_borrows", 0)
        not_returned = stats.get("not_returned_borrows", 0)
        
        # Overall health
        if total > 0:
            late_rate = (late / total) * 100
            not_returned_rate = (not_returned / total) * 100
            
            analysis.append(f"📊 SYSTEM HEALTH:")
            analysis.append(f"  • Total Borrows: {total}")
            analysis.append(f"  • Currently Active: {active}")
            analysis.append(f"  • Late Return Rate: {late_rate:.1f}%")
            analysis.append(f"  • Not Returned Rate: {not_returned_rate:.1f}%")
            
            if late_rate > 10:
                analysis.append(f"\n⚠️ CONCERN: Late return rate is {late_rate:.1f}% (target: <10%)")
                analysis.append("  Consider implementing reminder notifications or penalties")
            
            if not_returned_rate > 5:
                analysis.append(f"\n🚨 ALERT: {not_returned_rate:.1f}% of items not returned")
                analysis.append("  Immediate follow-up required with borrowers")
        
        # Top borrowers
        if top_borrowers:
            analysis.append(f"\n👥 TOP BORROWERS:")
            for borrower in top_borrowers[:5]:
                analysis.append(f"  • {borrower['borrower__username']}: {borrower['count']} items")
        
        analysis.append("\n✅ RECOMMENDATIONS:")
        if late > 0:
            analysis.append("  1. Implement automated reminder system for due dates")
        if not_returned > 0:
            analysis.append("  2. Contact users with unreturned items immediately")
        analysis.append("  3. Consider incentives for on-time returns")
        analysis.append("  4. Review borrowing policies if issues persist")
        
        return "\n".join(analysis)


class AIService:
    """Main AI Service - manages different AI providers and analysis types"""

    def __init__(self):
        self.providers = {
            "gemini": GoogleGeminiProvider(),
            "openai": OpenAIProvider(),
            "huggingface": HuggingFaceProvider(),
        }
        # Try Gemini first (free), then OpenAI, then Hugging Face
        self.active_provider = "gemini"

    def set_provider(self, provider_name: str):
        """Switch between AI providers"""
        if provider_name in self.providers:
            self.active_provider = provider_name
        else:
            logger.warning(f"Provider {provider_name} not found")

    def get_active_provider(self) -> AIProvider:
        """Get currently active provider, fallback to alternatives if unavailable"""
        provider = self.providers.get(self.active_provider)
        
        # If active provider is not available, try alternatives
        if not provider or not provider.is_available():
            for name, alt_provider in self.providers.items():
                if name != self.active_provider and alt_provider.is_available():
                    logger.info(f"Switching to {name} provider")
                    self.active_provider = name
                    return alt_provider
        
        return provider

    def is_ai_available(self) -> bool:
        """Check if any AI provider is available"""
        provider = self.get_active_provider()
        return provider and provider.is_available()

    def analyze_inventory(self, analytics_data: Dict[str, Any]) -> str:
        """Analyze inventory data and generate recommendations"""
        provider = self.get_active_provider()
        if not provider or not provider.is_available():
            return None

        # Format data for AI analysis
        prompt = self._format_inventory_prompt(analytics_data)
        return provider.analyze(prompt, context=analytics_data)

    def analyze_borrow_patterns(self, borrow_data: Dict[str, Any]) -> str:
        """Analyze borrow patterns and trends"""
        provider = self.get_active_provider()
        if not provider or not provider.is_available():
            return None

        prompt = self._format_borrow_patterns_prompt(borrow_data)
        return provider.analyze(prompt, context=borrow_data)

    def analyze_user_behavior(self, user_data: Dict[str, Any]) -> str:
        """Analyze user borrowing behavior"""
        provider = self.get_active_provider()
        if not provider or not provider.is_available():
            return None

        prompt = self._format_user_behavior_prompt(user_data)
        return provider.analyze(prompt, context=user_data)

    def generate_custom_analysis(self, analysis_type: str, data: Dict[str, Any]) -> str:
        """Generate custom analysis for extensibility"""
        provider = self.get_active_provider()
        if not provider or not provider.is_available():
            return None

        prompt = self._format_custom_prompt(analysis_type, data)
        return provider.analyze(prompt, context=data)

    @staticmethod
    def _format_inventory_prompt(data: Dict[str, Any]) -> str:
        """Format inventory data for AI analysis"""
        items = data.get("items", [])
        week_items = data.get("week_items", [])
        month_items = data.get("month_items", [])

        items_summary = "\n".join(
            [f"- {item['name']}: {item['utilization']}% utilized ({item['available']}/{item['quantity']} available)" 
             for item in items[:10]]
        )

        week_summary = "\n".join(
            [f"- {item['item__name']}: {item['count']} borrows" for item in week_items[:5]]
        )

        month_summary = "\n".join(
            [f"- {item['item__name']}: {item['count']} borrows" for item in month_items[:5]]
        )

        prompt = f"""Analyze the following equipment inventory and borrowing data, then provide strategic recommendations:

CURRENT INVENTORY STATUS:
{items_summary}

TOP BORROWED ITEMS (This Week):
{week_summary}

TOP BORROWED ITEMS (This Month):
{month_summary}

Based on this data, provide:
1. Items that need immediate stock increase
2. Items that are underutilized and could be removed
3. Predicted demand for the next month
4. Recommendations for inventory optimization
5. Risk assessment for equipment availability

Keep recommendations concise and actionable."""

        return prompt

    @staticmethod
    def _format_borrow_patterns_prompt(data: Dict[str, Any]) -> str:
        """Format borrow pattern data for AI analysis"""
        stats = data.get("stats", {})
        top_borrowers = data.get("top_borrowers", [])

        borrowers_summary = "\n".join(
            [f"- {b['borrower__username']}: {b['count']} items borrowed" 
             for b in top_borrowers[:5]]
        )

        prompt = f"""Analyze the following borrow patterns and provide insights:

BORROW STATISTICS:
- Total Borrows: {stats.get('total_borrows', 0)}
- Active: {stats.get('active_borrows', 0)}
- Returned: {stats.get('returned_borrows', 0)}
- Late: {stats.get('late_borrows', 0)}
- Not Returned: {stats.get('not_returned_borrows', 0)}

TOP BORROWERS:
{borrowers_summary}

Provide analysis on:
1. Overall borrow health and trends
2. Late return patterns and potential issues
3. User behavior insights
4. Recommendations to improve return rates
5. Suggested policies or interventions

Keep analysis focused and actionable."""

        return prompt

    @staticmethod
    def _format_user_behavior_prompt(data: Dict[str, Any]) -> str:
        """Format user behavior data for AI analysis"""
        prompt = f"""Analyze user borrowing behavior and provide insights:

USER DATA:
{str(data)}

Provide analysis on:
1. User borrowing patterns
2. Risk assessment for non-returns
3. Recommendations for user engagement
4. Suggested interventions or policies

Keep analysis concise and actionable."""

        return prompt

    @staticmethod
    def _format_custom_prompt(analysis_type: str, data: Dict[str, Any]) -> str:
        """Format custom analysis request"""
        prompt = f"""Perform {analysis_type} analysis on the following data:

DATA:
{str(data)}

Provide detailed, actionable insights."""

        return prompt


# Global AI Service instance
ai_service = AIService()
