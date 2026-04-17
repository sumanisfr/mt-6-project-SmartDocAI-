from markdown import markdown
from bs4 import BeautifulSoup
import re


def slugify(text: str):

    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')


def parse_markdown(content: str):

    html = markdown(content, extensions=["fenced_code", "tables"])

    soup = BeautifulSoup(html, "html.parser")

    headings = []

    for tag in soup.find_all(["h1", "h2", "h3"]):

        title = tag.text.strip()
        slug = slugify(title)

        tag["id"] = slug

        headings.append({
            "level": tag.name,
            "title": title,
            "id": slug
        })

    return {
        "html": str(soup),
        "headings": headings
    }
