from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import asdict, dataclass
from typing import Any


@dataclass
class Product:
    title: str
    metric: str
    source: str


def _clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def _extract_products_from_text(text: str, source: str, limit: int = 8) -> list[Product]:
    lines = [_clean_text(line) for line in text.splitlines()]
    lines = [line for line in lines if len(line) >= 8]

    products: list[Product] = []
    seen: set[str] = set()

    for line in lines:
        if line in seen:
            continue
        seen.add(line)

        looks_like_product = any(
            token.lower() in line.lower()
            for token in [
                "sale",
                "sold",
                "price",
                "销量",
                "销售",
                "热卖",
                "商品",
                "¥",
                "$",
              ]
        )

        if looks_like_product:
            products.append(Product(title=line[:160], metric="页面文本命中热卖/价格/销量关键词", source=source))

        if len(products) >= limit:
            break

    return products


def scrape_tiktok_data(market: str, category: str, url: str | None = None) -> dict[str, Any]:
    try:
        from playwright.sync_api import sync_playwright
    except Exception as exc:
        return {
            "ok": False,
            "error": "Python 环境还没有安装 Playwright。请运行 pip install -r requirements.txt 和 python -m playwright install chromium。",
            "detail": str(exc),
            "data": [],
            "source": "playwright",
        }

    target_url = url or "https://www.tiktokshuju.com/goods/hot-sale"

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(locale="zh-CN")
            page.goto(target_url, wait_until="domcontentloaded", timeout=45000)
            page.wait_for_timeout(3000)

            body_text = page.locator("body").inner_text(timeout=10000)
            products = _extract_products_from_text(body_text, target_url)
            browser.close()

        return {
            "ok": True,
            "source": target_url,
            "market": market,
            "category": category,
            "data": [asdict(product) for product in products],
            "note": "这是页面公开文本抓取结果。若目标网站需要登录、验证码或更精确字段，需要补充登录态和页面选择器。",
        }
    except Exception as exc:
        return {
            "ok": False,
            "error": "Playwright 抓取失败，可能是目标网站反爬、需要登录、网络不可达或页面结构变化。",
            "detail": str(exc),
            "source": target_url,
            "data": [],
        }


def main() -> None:
    parser = argparse.ArgumentParser(description="Scrape cross-border ecommerce trend data.")
    parser.add_argument("--platform", default="TikTok Shop")
    parser.add_argument("--market", default="美国")
    parser.add_argument("--category", default="宠物用品")
    parser.add_argument("--url", default="")
    args = parser.parse_args()

    result = scrape_tiktok_data(args.market, args.category, args.url or None)
    result["platform"] = args.platform
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
