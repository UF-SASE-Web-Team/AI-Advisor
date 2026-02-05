import requests
from bs4 import BeautifulSoup
import json
import os

HEADERS = {'User-Agent': 'ProfScraper/1.0'}
nextPageStem = "&count=25&after=t3_"


def redditScrape(searchTerm, fileName, count):
    SEARCH_URL_BASE = f"https://old.reddit.com/r/ufl/search?q={searchTerm}&restrict_sr=on&sort=relevance&t=all"
    SEARCHING_URL = SEARCH_URL_BASE
    if os.path.exists(fileName):
        with open(fileName, 'r') as f:
            db = json.load(f)
        print(f"{len(db)} entries")
    else:
        db = {}
        print(f"making {fileName}")
    count = len(db)
    while (len(db) < 400):
        scrapePage(db, SEARCHING_URL)
        SEARCHING_URL = SEARCH_URL_BASE + nextPageStem + list(db.keys())[-1]
        if count == len(db):
            break
        count = len(db)


def scrapePage(db, SEARCHING_URL):
    try:
        response = requests.get(SEARCHING_URL, headers=HEADERS)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        items = soup.find_all('div', class_='search-result-link')

        for item in items:
            postId = item.get('data-fullname')
            truncPostId = postId[3:]
            if truncPostId in db:
                continue

            titleLink = item.find('a', class_='search-title')
            if not titleLink:
                continue

            title = titleLink.text
            url = titleLink['href']

            if url.startswith('/r/'):
                url = f"https://old.reddit.com{url}"

            db[truncPostId] = {
                "title": title,
                "url": url,
            }

        with open(fileName, 'w') as f:
            json.dump(db, f, indent=4)

        print(
            f"{len(db)} posts total")

    except Exception as e:
        print(e)


if __name__ == "__main__":
    searchTerm = input("Type in a search term: ")
    fileName = input("Type name of json file (add .json to end): ")
    redditScrape(searchTerm, fileName, 25)
