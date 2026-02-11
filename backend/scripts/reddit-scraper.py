import requests
from bs4 import BeautifulSoup
import json
import os
import time
from urllib.parse import quote

HEADERS = {'User-Agent': 'UFProfSearchBot/1.0'}
fileName = "profSearch.json"
profListFile = "profList.json"


def getProfessors():
    coursesJson = "s26.json"
    targetDept = "Computer & Information Science & Engineering"
    profList = set()

    with open(coursesJson, 'r') as f:
        courses = json.load(f)

    for course in courses:
        if 'sections' in course:
            for section in course['sections']:
                if section.get('deptName') == targetDept:
                    if 'instructors' in section:
                        for instructor in section['instructors']:
                            if 'name' in instructor:
                                profList.add(instructor['name'])

    with open("profList.json", 'w') as f:
        json.dump(list(profList), f, indent=4)

    print(f"{len(profList)} professors saved")


def redditScrape():
    if os.path.exists(fileName):
        with open(fileName, 'r') as f:
            db = json.load(f)
    else:
        db = {}

    with open(profListFile, 'r') as f:
        professors = json.load(f)

    for prof in professors:
        print(f"Searching for: {prof}")

        query = quote(prof)
        baseURL = f"https://old.reddit.com/r/ufl/search?q={query}&restrict_sr=on&sort=relevance&t=all"
        searchingURL = baseURL

        maxPosts = 50
        postFound = 0

        while postFound < maxPosts:
            postIDs = scrapePage(db, searchingURL, prof)

            if not postIDs:
                break

            postFound += len(postIDs)

            lastID = postIDs[-1]
            searchingURL = f"{baseURL}&count=25&after=t3_{lastID}"

            time.sleep(2)


def scrapePage(db, searchingURL, prof_name):
    try:
        response = requests.get(searchingURL, headers=HEADERS, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        items = soup.find_all('div', class_='search-result-link')

        if not items:
            return []

        found_ids = []
        for item in items:
            postId = item.get('data-fullname')[3:]
            found_ids.append(postId)

            if postId not in db:
                title_link = item.find('a', class_='search-title')
                if title_link:
                    db[postId] = {
                        "professor": prof_name,
                        "title": title_link.text,
                        "url": title_link['href'] if not title_link['href'].startswith('/r/') else f"https://old.reddit.com{title_link['href']}"
                    }

        with open(fileName, 'w') as f:
            json.dump(db, f, indent=4)

        return found_ids

    except Exception as e:
        print(f"Request failed: {e}")
        return []


if __name__ == "__main__":
    getProfessors()
    redditScrape()
