import httpx
import asyncio
import logging
import time
from typing import Dict, Any, Optional, List
from datetime import datetime
import jwt
from app.config import settings

logger = logging.getLogger(__name__)

class SenutoClient:
    """
    Senuto API Client with token management, rate limiting, and retry logic.
    """
    def __init__(self):
        self.base_url = settings.SENUTO_API_URL.rstrip('/')
        self.email = settings.SENUTO_EMAIL
        self.password = settings.SENUTO_PASSWORD
        self._token: Optional[str] = None
        self._token_exp: int = 0
        self._semaphore = asyncio.Semaphore(5)  # Max 5 concurrent requests
        self._last_request_time = 0
        self._request_interval = 0.2  # 200ms between requests

    async def _get_token(self) -> str:
        """Get valid JWT token, refreshing if necessary."""
        now = int(time.time())
        if self._token and self._token_exp > now + 300:  # 5 min buffer
            return self._token

        logger.info("🔑 Refreshing Senuto API token...")
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.post(
                    f"{self.base_url}/users/token",
                    json={"email": self.email, "password": self.password},
                    timeout=10
                )
                resp.raise_for_status()
                data = resp.json()
                
                if not data.get("success"):
                    raise Exception(f"Senuto login failed: {data.get('data', {}).get('error', 'Unknown error')}")
                
                self._token = data["data"]["token"]
                
                # Decode JWT to get expiration
                decoded = jwt.decode(self._token, options={"verify_signature": False})
                self._token_exp = decoded.get("exp", now + 3600)
                
                return self._token
            except Exception as e:
                logger.error(f"❌ Senuto authentication error: {e}")
                raise

    async def _request(self, method: str, path: str, params: Optional[Dict] = None, json_body: Optional[Dict] = None, data_body: Optional[Dict] = None) -> Dict[str, Any]:
        """Execute rate-limited request with retries."""
        async with self._semaphore:
            # Simple rate limiting
            elapsed = time.time() - self._last_request_time
            if elapsed < self._request_interval:
                await asyncio.sleep(self._request_interval - elapsed)

            token = await self._get_token()
            headers = {
                "Authorization": f"Bearer {token}",
                "Accept": "application/json",
                "User-Agent": "SiteSpector/1.0"
            }

            async with httpx.AsyncClient(timeout=settings.SENUTO_TIMEOUT) as client:
                for attempt in range(3):
                    try:
                        self._last_request_time = time.time()
                        if method == "GET":
                            resp = await client.get(f"{self.base_url}{path}", params=params, headers=headers)
                        else:
                            resp = await client.post(f"{self.base_url}{path}", params=params, json=json_body, data=data_body, headers=headers)
                        
                        resp.raise_for_status()
                        result = resp.json()
                        
                        if not result.get("success"):
                            logger.warning(f"Senuto API returned success=False for {path}: {result}")
                        
                        return result.get("data", {})
                    except httpx.HTTPStatusError as e:
                        if e.response.status_code == 429:  # Too Many Requests
                            wait = (attempt + 1) * 2
                            logger.warning(f"⏳ Senuto rate limit (429). Waiting {wait}s...")
                            await asyncio.sleep(wait)
                            continue
                        logger.error(f"❌ Senuto API HTTP error {e.response.status_code} for {path}: {e.response.text}")
                        raise
                    except Exception as e:
                        if attempt == 2:
                            logger.error(f"❌ Senuto API error after 3 attempts: {e}")
                            raise
                        await asyncio.sleep(1)
            return {}

    async def analyze_domain(self, domain: str, country_id: int, fetch_mode: str) -> Dict[str, Any]:
        """
        Comprehensive domain analysis: Visibility + Backlinks.
        """
        logger.info(f"📊 Starting full Senuto analysis for {domain} (country={country_id}, mode={fetch_mode})")
        
        # Clean domain
        from urllib.parse import urlparse
        if "://" in domain:
            domain = urlparse(domain).netloc
        domain = domain.replace("www.", "")

        # Group A: Parallel GETs
        try:
            group_a = await asyncio.gather(
                self._request("GET", "/visibility_analysis/reports/dashboard/getDomainData", params={"domain": domain, "fetch_mode": fetch_mode, "country_id": country_id}),
                self._request("GET", "/visibility_analysis/reports/dashboard/getDomainStatistics", params={"domain": domain, "fetch_mode": fetch_mode, "country_id": country_id}),
                self._request("GET", "/visibility_analysis/reports/domain_seasonality/getSeasonalityChartData", params={"domain": domain, "fetch_mode": fetch_mode}),
                self._request("GET", "/visibility_analysis/reports/domain_positions/getPositionsSumsDistributionChartData", params={"domain": domain, "fetch_mode": fetch_mode}),
                return_exceptions=True
            )
        except Exception as e:
            logger.error(f"Error in Senuto Group A: {e}")
            group_a = [{}, {}, {}, {}]

        # Group B: Parallel POSTs (Visibility)
        try:
            group_b = await asyncio.gather(
                self._request("POST", "/visibility_analysis/reports/positions/getData", data_body={"domain": domain, "fetch_mode": fetch_mode, "country_id": country_id, "limit": 100, "page": 1}),
                self._request("POST", "/visibility_analysis/reports/positions/getWins", data_body={"domain": domain, "fetch_mode": fetch_mode, "country_id": country_id, "limit": 50, "page": 1}),
                self._request("POST", "/visibility_analysis/reports/positions/getLosses", data_body={"domain": domain, "fetch_mode": fetch_mode, "country_id": country_id, "limit": 50, "page": 1}),
                self._request("POST", "/visibility_analysis/reports/competitors/getData", json_body={"domain": domain, "fetch_mode": fetch_mode, "country_id": country_id}),
                self._request("POST", "/visibility_analysis/reports/cannibalization/getKeywords", json_body={"domain": domain, "fetch_mode": fetch_mode, "country_id": country_id}),
                self._request("POST", "/visibility_analysis/reports/sections/getSections", data_body={"domain": domain, "fetch_mode": fetch_mode, "country_id": country_id, "limit": 50, "page": 1}),
                return_exceptions=True
            )
        except Exception as e:
            logger.error(f"Error in Senuto Group B: {e}")
            group_b = [{}, {}, {}, {}, {}, {}]

        # Group C: Parallel POSTs (Backlinks)
        try:
            group_c = await asyncio.gather(
                self._request("POST", "/backlinks/reports/statistics/getData", json_body={"domain": domain, "competitors": []}),
                self._request("POST", "/backlinks/reports/statistics/getLinkAttributes", json_body={"domain": domain, "competitors": []}),
                self._request("POST", "/backlinks/reports/anchors/getCloud", json_body={"domain": domain, "competitors": []}),
                self._request("POST", "/backlinks/reports/references/getDomains", json_body={"domain": domain}),
                self._request("POST", "/backlinks/reports/backlinks/getData", json_body={"domain": domain}),
                return_exceptions=True
            )
        except Exception as e:
            logger.error(f"Error in Senuto Group C: {e}")
            group_c = [{}, {}, {}, {}, {}]

        # Helper to safely get result from gather
        def s(res): return res if not isinstance(res, Exception) else {}

        return {
            "country_id": country_id,
            "fetch_mode": fetch_mode,
            "fetched_at": datetime.utcnow().isoformat(),
            "visibility": {
                "dashboard": s(group_a[0]),
                "statistics": s(group_a[1]),
                "seasonality": s(group_a[2]),
                "distribution": s(group_a[3]),
                "positions": s(group_b[0]),
                "wins": s(group_b[1]),
                "losses": s(group_b[2]),
                "competitors": s(group_b[3]),
                "cannibalization": s(group_b[4]),
                "sections": s(group_b[5]),
            },
            "backlinks": {
                "statistics": s(group_c[0]),
                "link_attributes": s(group_c[1]),
                "anchors": s(group_c[2]),
                "ref_domains": s(group_c[3]),
                "list": s(group_c[4]),
            }
        }

# Global instance
senuto_client = SenutoClient()

async def analyze_domain(domain: str, country_id: int = 200, fetch_mode: str = "subdomain") -> Dict[str, Any]:
    return await senuto_client.analyze_domain(domain, country_id, fetch_mode)
