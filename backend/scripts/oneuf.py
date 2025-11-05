# Extracts all UF courses for a given semester and outputs into a .json

import requests
import json

COURSES_BASE_URL = "https://one.ufl.edu/apix/soc/schedule/"
semester = "s26"

def main():
    res = get_courses(semester)
    with open(f"{semester}.json", 'w') as f:
        json.dump(res, f, indent=4)


def get_courses(sem):
    sems = {
        "s26": "2261",
        "f25": "2258",
    }

    all_courses = []
    last_control_number = 0

    while True:
        params = {
            "category": "CWSP",
            "term": sems[sem],
            "last-control-number": last_control_number
        }
        
        data = _get_request(COURSES_BASE_URL, params) 
        courses = data[0]["COURSES"]
        if courses[0]["code"] == "0000":
            break
            
        all_courses.extend(courses)
        
        last_control_number = data[0]["LASTCONTROLNUMBER"]
    
    seen_courses = set()
    unique_courses = []
    for course in all_courses:
        k = (course["code"], course["name"])
        if k not in seen_courses:
            seen_courses.add(k)
            unique_courses.append(course)

    print("Unique courses: ", len(unique_courses))
    return unique_courses

def _get_request(base_url, params_dict):
    url = base_url + '?'
    for key, val in params_dict.items():
        url += f"{key}={val}&"
    url = url[:-1]

    print(f"URL: {url}")
    
    res = requests.get(url)
    return res.json()

if __name__ == "__main__":
    main()