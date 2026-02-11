import asyncio
import logging
import time
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import httpx
import jwt

from app.config import settings

logger = logging.getLogger(__name__)


class SenutoClient:
    """
    Senuto API client with token management, rate limiting and retries.
    """

    def __init__(self):
        self.base_url = settings.SENUTO_API_URL.rstrip("/")
        self.email = settings.SENUTO_EMAIL
        self.password = settings.SENUTO_PASSWORD
        self._token: Optional[str] = None
        self._token_exp: int = 0
        self._semaphore = asyncio.Semaphore(5)  # Max 5 concurrent requests
        self._last_request_time = 0.0
        self._request_interval = 0.2  # 200ms between requests

    async def _get_token(self) -> str:
        """Get valid JWT token, refreshing if necessary."""
        now = int(time.time())
        if self._token and self._token_exp > now + 300:
            return self._token

        logger.info("Refreshing Senuto API token")
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.base_url}/users/token",
                json={"email": self.email, "password": self.password},
                timeout=10,
            )
            resp.raise_for_status()
            data = resp.json()

            if not data.get("success"):
                raise RuntimeError(
                    f"Senuto login failed: {data.get('data', {}).get('error', 'Unknown error')}"
                )

            self._token = data["data"]["token"]
            decoded = jwt.decode(self._token, options={"verify_signature": False})
            self._token_exp = decoded.get("exp", now + 3600)
            return self._token

    async def _request_raw(
        self,
        method: str,
        path: str,
        params: Optional[Dict[str, Any]] = None,
        json_body: Optional[Dict[str, Any]] = None,
        data_body: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Execute rate-limited request with retries and return full response JSON."""
        async with self._semaphore:
            elapsed = time.time() - self._last_request_time
            if elapsed < self._request_interval:
                await asyncio.sleep(self._request_interval - elapsed)

            token = await self._get_token()
            headers = {
                "Authorization": f"Bearer {token}",
                "Accept": "application/json",
                "User-Agent": "SiteSpector/1.0",
            }

            async with httpx.AsyncClient(timeout=settings.SENUTO_TIMEOUT) as client:
                for attempt in range(3):
                    try:
                        self._last_request_time = time.time()
                        if method == "GET":
                            resp = await client.get(
                                f"{self.base_url}{path}", params=params, headers=headers
                            )
                        else:
                            resp = await client.post(
                                f"{self.base_url}{path}",
                                params=params,
                                json=json_body,
                                data=data_body,
                                headers=headers,
                            )

                        resp.raise_for_status()
                        result = resp.json()
                        if not result.get("success"):
                            logger.warning(
                                "Senuto API returned success=False for %s: %s", path, result
                            )
                        return result
                    except httpx.HTTPStatusError as e:
                        if e.response.status_code == 429:
                            wait = (attempt + 1) * 2
                            logger.warning("Senuto rate limit on %s. Waiting %ss", path, wait)
                            await asyncio.sleep(wait)
                            continue
                        logger.error(
                            "Senuto API HTTP error %s for %s: %s",
                            e.response.status_code,
                            path,
                            e.response.text,
                        )
                        raise
                    except Exception as e:
                        if attempt == 2:
                            logger.error("Senuto API error after 3 attempts for %s: %s", path, e)
                            raise
                        await asyncio.sleep(1)

            return {}

    async def _request(
        self,
        method: str,
        path: str,
        params: Optional[Dict[str, Any]] = None,
        json_body: Optional[Dict[str, Any]] = None,
        data_body: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Execute request and return only Senuto `data` payload."""
        result = await self._request_raw(
            method=method,
            path=path,
            params=params,
            json_body=json_body,
            data_body=data_body,
        )
        return result.get("data", {})

    async def _fetch_paginated(
        self,
        method: str,
        path: str,
        body: Dict[str, Any],
        max_items: int = 10000,
        page_size: int = 100,
        use_json_for_post: bool = True,
        return_total: bool = False,
    ) -> List[Dict[str, Any]] | Tuple[List[Dict[str, Any]], Optional[int]]:
        """Fetch paginated data up to max_items."""
        all_items: List[Dict[str, Any]] = []
        page = 1
        total_count: Optional[int] = None

        while len(all_items) < max_items:
            current_body = {**body, "page": page, "limit": page_size}
            if method == "GET":
                result = await self._request_raw("GET", path, params=current_body)
            else:
                result = await self._request_raw(
                    "POST",
                    path,
                    json_body=current_body if use_json_for_post else None,
                    data_body=None if use_json_for_post else current_body,
                )

            data = result.get("data", {})
            pagination = result.get("pagination", {})
            if isinstance(pagination, dict):
                count = pagination.get("count")
                if isinstance(count, int):
                    total_count = count

            items = data if isinstance(data, list) else data.get("items", [])
            if not items:
                break

            all_items.extend(items)
            if len(items) < page_size:
                break
            page += 1

        sliced = all_items[:max_items]
        if return_total:
            return sliced, total_count
        return sliced

    async def analyze_domain(self, domain: str, country_id: int, fetch_mode: str) -> Dict[str, Any]:
        """Comprehensive domain analysis: Visibility + Backlinks + AI Overviews."""
        logger.info(
            "Starting full Senuto analysis for %s (country=%s, mode=%s)",
            domain,
            country_id,
            fetch_mode,
        )

        from urllib.parse import urlparse

        if "://" in domain:
            domain = urlparse(domain).netloc
        domain = domain.replace("www.", "")

        base_payload = {"domain": domain, "fetch_mode": fetch_mode, "country_id": country_id}

        # Group A: Dashboard and charts
        group_a = await asyncio.gather(
            self._request(
                "GET",
                "/visibility_analysis/reports/dashboard/getDomainData",
                params=base_payload,
            ),
            self._request(
                "GET",
                "/visibility_analysis/reports/dashboard/getDomainStatistics",
                params=base_payload,
            ),
            self._request(
                "GET",
                "/visibility_analysis/reports/domain_seasonality/getSeasonalityChartData",
                params={"domain": domain, "fetch_mode": fetch_mode},
            ),
            self._request(
                "GET",
                "/visibility_analysis/reports/domain_positions/getPositionsSumsDistributionChartData",
                params={"domain": domain, "fetch_mode": fetch_mode},
            ),
            return_exceptions=True,
        )

        # Main positions need total count metadata
        positions_data, positions_total = await self._fetch_paginated(
            "POST",
            "/visibility_analysis/reports/positions/getData",
            base_payload,
            max_items=10000,
            return_total=True,
        )

        # Group B: Remaining visibility endpoints
        group_b = await asyncio.gather(
            self._fetch_paginated(
                "POST",
                "/visibility_analysis/reports/positions/getWins",
                base_payload,
                max_items=5000,
            ),
            self._fetch_paginated(
                "POST",
                "/visibility_analysis/reports/positions/getLosses",
                base_payload,
                max_items=5000,
            ),
            self._request(
                "POST",
                "/visibility_analysis/reports/competitors/getData",
                json_body=base_payload,
            ),
            self._request(
                "POST",
                "/visibility_analysis/reports/cannibalization/getKeywords",
                json_body=base_payload,
            ),
            self._fetch_paginated(
                "POST",
                "/visibility_analysis/reports/sections/getSections",
                base_payload,
                max_items=1000,
            ),
            return_exceptions=True,
        )

        # Group C: Backlinks
        group_c = await asyncio.gather(
            self._request(
                "POST",
                "/backlinks/reports/statistics/getData",
                json_body={"domain": domain, "competitors": []},
            ),
            self._request(
                "POST",
                "/backlinks/reports/statistics/getLinkAttributes",
                json_body={"domain": domain, "competitors": []},
            ),
            self._request(
                "POST",
                "/backlinks/reports/anchors/getCloud",
                json_body={"domain": domain, "competitors": []},
            ),
            self._fetch_paginated(
                "POST",
                "/backlinks/reports/references/getDomains",
                {"domain": domain},
                max_items=2000,
            ),
            self._fetch_paginated(
                "POST",
                "/backlinks/reports/backlinks/getData",
                {"domain": domain},
                max_items=5000,
            ),
            return_exceptions=True,
        )

        # Group D: AI Overviews
        group_d = await asyncio.gather(
            self._request(
                "GET",
                "/visibility_analysis/reports/ai_overviews/getStatistics",
                params=base_payload,
            ),
            self._fetch_paginated(
                "POST",
                "/visibility_analysis/reports/ai_overviews/getKeywords",
                base_payload,
                max_items=5000,
            ),
            self._request(
                "POST",
                "/visibility_analysis/reports/ai_overviews/getCompetitors",
                json_body=base_payload,
            ),
            return_exceptions=True,
        )

        # Group E: sections detail
        group_e = await asyncio.gather(
            self._fetch_paginated(
                "POST",
                "/visibility_analysis/reports/sections/getSubdomains",
                base_payload,
                max_items=500,
            ),
            self._fetch_paginated(
                "POST",
                "/visibility_analysis/reports/sections/getUrls",
                base_payload,
                max_items=1000,
            ),
            return_exceptions=True,
        )

        def s(res: Any, default: Any = None) -> Any:
            if isinstance(res, Exception):
                return default
            return res

        wins = s(group_b[0], [])
        losses = s(group_b[1], [])
        competitors = s(group_b[2], [])
        cannibalization = s(group_b[3], {})
        sections = s(group_b[4], [])

        backlinks_statistics = s(group_c[0], {})
        backlinks_link_attributes = s(group_c[1], {})
        backlinks_anchors = s(group_c[2], {})
        backlinks_ref_domains = s(group_c[3], [])
        backlinks_list = s(group_c[4], [])

        aio_statistics = s(group_d[0], {})
        aio_keywords = s(group_d[1], [])
        aio_competitors = s(group_d[2], [])

        sections_subdomains = s(group_e[0], [])
        sections_urls = s(group_e[1], [])

        logger.info(
            "Senuto payload counts for %s: positions=%s(total=%s), wins=%s, losses=%s, backlinks=%s, aio_keywords=%s, sections_urls=%s",
            domain,
            len(positions_data),
            positions_total,
            len(wins),
            len(losses),
            len(backlinks_list),
            len(aio_keywords),
            len(sections_urls),
        )

        return {
            "country_id": country_id,
            "fetch_mode": fetch_mode,
            "fetched_at": datetime.utcnow().isoformat(),
            "_meta": {
                "positions_count": len(positions_data),
                "positions_total": positions_total,
                "wins_count": len(wins),
                "losses_count": len(losses),
                "backlinks_count": len(backlinks_list),
                "ai_overviews_keywords_count": len(aio_keywords),
                "sections_urls_count": len(sections_urls),
                "is_complete": True,
            },
            "visibility": {
                "dashboard": s(group_a[0], {}),
                "statistics": s(group_a[1], {}),
                "seasonality": s(group_a[2], {}),
                "distribution": s(group_a[3], []),
                "positions": positions_data,
                "wins": wins,
                "losses": losses,
                "competitors": competitors,
                "cannibalization": cannibalization,
                "sections": sections,
                "sections_subdomains": sections_subdomains,
                "sections_urls": sections_urls,
                "ai_overviews": {
                    "statistics": aio_statistics,
                    "keywords": aio_keywords,
                    "competitors": aio_competitors,
                },
            },
            "backlinks": {
                "statistics": backlinks_statistics,
                "link_attributes": backlinks_link_attributes,
                "anchors": backlinks_anchors,
                "ref_domains": backlinks_ref_domains,
                "list": backlinks_list,
            },
        }


senuto_client = SenutoClient()


async def analyze_domain(domain: str, country_id: int = 200, fetch_mode: str = "subdomain") -> Dict[str, Any]:
    return await senuto_client.analyze_domain(domain, country_id, fetch_mode)
