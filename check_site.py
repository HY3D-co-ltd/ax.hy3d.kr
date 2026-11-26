
"""Check deployed pages, search metadata, and links."""
import argparse
import json
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit
from urllib.request import urlopen
from xml.etree import ElementTree

ROUTES = ("/", "/makit/", "/wbs/", "/ai-call/", "/ax-workspace/", "/ax-works/", "/contact/")
PUBLIC_ORIGIN = "https://ax.hy3d.kr"


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.meta = {}
        self.links = set()
        self.canonical = None
        self.has_title = False
        self.reading_schema = False
        self.types = set()

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "title":
            self.has_title = True
        elif tag == "meta" and ("name" in attrs or "property" in attrs):
            self.meta[attrs.get("name", attrs.get("property"))] = attrs.get("content", "")
        elif tag == "link" and attrs.get("rel") == "canonical":
            self.canonical = attrs.get("href")
        elif tag in {"a", "link"} and "href" in attrs:
            self.links.add(attrs["href"])
        elif tag in {"img", "script"} and attrs.get("src"):
            self.links.add(attrs["src"])
        elif tag == "script" and attrs.get("type") == "application/ld+json":
            self.reading_schema = True

    def handle_data(self, data):
        if self.reading_schema:
            entities = json.loads(data)
            for entity in entities if isinstance(entities, list) else [entities]:
                self.types.add(entity["@type"])
                if entity["@type"] == "FAQPage":
                    questions = entity.get("mainEntity")
                    if not isinstance(questions, list) or not questions:
                        raise ValueError("FAQPage mainEntity must be a nonempty array")
                    for question in questions:
                        if not question.get("name") or not question.get("acceptedAnswer", {}).get("text"):
                            raise ValueError("FAQ question and answer must contain text")

    def handle_endtag(self, tag):
        if tag == "script":
            self.reading_schema = False


def fetch(url):
    with urlopen(url, timeout=15) as response:
        if response.status != 200:
            raise ValueError(f"Expected HTTP 200, received {response.status}")
        return response.read()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--origin", default=PUBLIC_ORIGIN)
    origin = parser.parse_args().origin.rstrip("/")
    failures = []
    links = set()
    for route in ROUTES:
        try:
            page = Page()
            page.feed(fetch(origin + route).decode("utf-8"))
            if not page.has_title or not page.meta.get("description"):
                raise ValueError("Expected title and meta description")
            if page.canonical != PUBLIC_ORIGIN + route:
                raise ValueError(f"Unexpected canonical URL: {page.canonical}")
            if not all(page.meta.get(key) for key in ("og:title", "og:description", "og:image")):
                raise ValueError("Missing social preview title, description, or image")
            if page.meta.get("og:url") != page.canonical:
                raise ValueError("Social preview URL must match the canonical URL")
            preview_image = page.meta["og:image"]
            if not preview_image.startswith(PUBLIC_ORIGIN + "/assets/"):
                raise ValueError("Social preview image must use an absolute site asset URL")
            if page.meta.get("twitter:card") != "summary_large_image" or page.meta.get("twitter:image") != preview_image:
                raise ValueError("Social image must be consistent across preview formats")
            links.add(origin + urlsplit(preview_image).path)
            if "noindex" in page.meta.get("robots", ""):
                raise ValueError("Remove noindex from the published page")
            if route not in {"/", "/contact/"} and not {"Product", "FAQPage"} <= page.types:
                raise ValueError("Expected Product and FAQPage JSON-LD")
            for link in page.links:
                if link.startswith("#") or urlsplit(link).scheme not in {"", "https", "http"}:
                    continue
                links.add(urljoin(origin + route, link))
            print(f"OK {origin + route}")
        except (OSError, ValueError, KeyError) as error:
            failures.append(f"{origin + route} — {error}. Check the corresponding index.html and Pages deployment.")

    for link in sorted(links | {origin + "/robots.txt", origin + "/sitemap.xml"}):
        try:
            content = fetch(link)
            if link == origin + "/robots.txt" and b"Disallow: /" in content:
                raise ValueError("robots.txt blocks indexing")
            if link == origin + "/sitemap.xml":
                locations = {node.text for node in ElementTree.fromstring(content).iter("{http://www.sitemaps.org/schemas/sitemap/0.9}loc")}
                if locations != {PUBLIC_ORIGIN + route for route in ROUTES}:
                    raise ValueError("Sitemap URLs differ from the published routes")
        except (OSError, ValueError, ElementTree.ParseError) as error:
            failures.append(f"{link} — {error}. Check the link in the page source or the destination service.")
    if failures:
        raise SystemExit("\n".join(failures))


if __name__ == "__main__":
    main()
