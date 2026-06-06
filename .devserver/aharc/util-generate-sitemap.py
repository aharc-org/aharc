#!/usr/bin/env python3
"""
generate-sitemap.py
Generates sitemap.xml for acme.co.uk
modify for real domain
"""

import os
from datetime import date

with open("CNAME") as f:
    BASE_URL = "https://" + f.read().strip()

EXCLUDE = {
    "404.html",
}

AUTO_DISCOVER = True


def get_url(path):
    if path == "index.html":
        return BASE_URL + "/"

    if path.endswith("/index.html"):
        return BASE_URL + "/" + path[:-10] + "/"

    return f"{BASE_URL}/{path}"


def discover_html():
    pages = []

    for root, dirs, files in os.walk("."):
        for file in files:
            if not file.endswith(".html"):
                continue

            if file in EXCLUDE:
                continue

            filepath = os.path.join(root, file).lstrip("./")

            pages.append(filepath)

    return sorted(pages)


def generate_sitemap():

    pages = discover_html() if AUTO_DISCOVER else ["index.html"]

    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]

    written = 0

    for page in pages:

        if not os.path.exists(page):
            continue

        lastmod = date.fromtimestamp(os.path.getmtime(page)).isoformat()

        lines.append("  <url>")
        lines.append(f"    <loc>{get_url(page)}</loc>")
        lines.append(f"    <lastmod>{lastmod}</lastmod>")
        lines.append("  </url>")

        written += 1

    lines.append("</urlset>")

    with open("sitemap.xml", "w") as f:
        f.write("\n".join(lines) + "\n")

    print(f"✅ sitemap.xml generated with {written} pages")
    print(f"   Base URL: {BASE_URL}")


if __name__ == "__main__":
    generate_sitemap()
