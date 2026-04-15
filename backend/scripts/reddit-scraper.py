import requests
from bs4 import BeautifulSoup
import json
import os
import time
from urllib.parse import quote

HEADERS = {'User-Agent': 'UFProfSearchBot/1.0'}
postDataFile = "postData.json"
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


def getProfPosts():
    if os.path.exists(postDataFile):
        with open(postDataFile, 'r') as f:
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

        with open(postDataFile, 'w') as f:
            json.dump(db, f, indent=4)

        return found_ids

    except Exception as e:
        print(f"Request failed: {e}")
        return []


def getPostData():
    if not os.path.exists(postDataFile):
        print(f"{postDataFile} not found")
        return

    with open(postDataFile, 'r') as f:
        allPosts = json.load(f)

    postData = {}

    try:
        for postID, postInfo in allPosts.items():
            if 'postText' in postInfo and 'comments' in postInfo:
                continue

            url = postInfo.get('url')
            if not url:
                continue

            if not url.startswith('https://old.reddit.com'):
                if url.startswith('/'):
                    url = f"https://old.reddit.com{url}"
                else:
                    url = f"https://old.reddit.com/{url}"

            json_url = url.rstrip('/') + '.json'

            print(f"Fetching {postInfo.get('title')}")

            try:
                time.sleep(2)
                response = requests.get(json_url, headers=HEADERS, timeout=10)
                response.raise_for_status()
                data = response.json()

                postText = ""
                comments = []

                if data and len(data) > 0:
                    post = data[0]['data']['children'][0]['data']
                    postText = post.get('selftext', '')

                    if len(data) > 1 and 'children' in data[1]['data']:
                        for comment in data[1]['data']['children']:
                            if comment.get('kind') == 't1':
                                commentData = comment['data']
                                comments.append({
                                    "author": commentData.get('author'),
                                    "text": commentData.get('body'),
                                    "score": commentData.get('score')
                                })

                postData[postID] = {
                    "id": postID,
                    "professor": postInfo.get('professor'),
                    "title": postInfo.get('title'),
                    "url": url,
                    "postText": postText,
                    "comments": comments
                }

            except Exception as e:
                print(f"Failed to fetch {url}: {e}")
                break

    finally:
        for pid, pdata in postData.items():
            if pid in allPosts:
                allPosts[pid].update({
                    'postText': pdata.get('postText', ''),
                    'comments': pdata.get('comments', [])
                })
            else:
                allPosts[pid] = pdata

        with open(postDataFile, 'w') as f:
            json.dump(allPosts, f, indent=4)

        print(f"saved posts: {len(postData)}, total posts: {len(allPosts)}")


if __name__ == "__main__":
    # you will have to run the file two or three times.
    # once you run it the first time and get rate limited, you can comment out getProfessors() and getProfPosts()
    # i believe with the way it is set up and reddits rate limits you will have to run it a total of three times :skull:
    
    # getProfessors()
    # getProfPosts()
    getPostData()
