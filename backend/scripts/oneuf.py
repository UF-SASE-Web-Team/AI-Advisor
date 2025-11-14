# Extracts all UF courses for a given semester and outputs into a .json

import requests
import json
import re

COURSES_BASE_URL = "https://one.ufl.edu/apix/soc/schedule/"
semester = "s26"

def main():
    depts = [19140000, 19050000, 16320000, 16480000, 16360000]
    all_courses = []
    for dept in depts:
        all_courses.extend(get_courses(semester, dept))
    with open(f"{semester}.json", "w") as f:
        json.dump(all_courses, f, indent=4)


def get_courses(sem, dept):
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
            "last-control-number": last_control_number,
            "dept": dept
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

    # add extra keys
    for course in unique_courses:
        # course code prefix
        course["codePrefix"] = course["code"][:3]

        # prereqs + coreqs
        course["prereqsParsed"] = ""
        course["coreqsParsed"] = ""

        raw = course["prerequisites"]
        if not raw:
            continue
        prereqs, coreqs = [], []
        if raw.startswith("Prereq:") and "Coreq:" in raw:
            prereqs = parse_classes(raw.split('Coreq:')[0])
            coreqs = parse_classes(raw.split('Coreq:')[1])
        elif raw.startswith("Coreq:"):
            coreqs = parse_classes(raw)
        else:
            prereqs = parse_classes(raw)

        if prereqs:
            course["prereqsParsed"] = ' '.join(prereqs)
        if coreqs:
            course["coreqsParsed"] = ' '.join(coreqs)
        
        """
        if prereqs or coreqs:
            print(course["name"])
            print(raw)
            if prereqs:
                print("PREREQS:", ' '.join(prereqs))
            if coreqs:
                print("COREQS:", ' '.join(coreqs))
            print()
        """
        
        #print("MATCH: ", re.findall(rf"\(?{COURSE}\)?(?: (?:and|or|) \(?{COURSE}\)?)*", raw))
        #print()




    print(f"Loaded {len(unique_courses)} classes from dept. {dept}")
    return unique_courses

def _get_request(base_url, params_dict):
    url = base_url + '?'
    for key, val in params_dict.items():
        url += f"{key}={val}&"
    url = url[:-1]

    print(f"URL: {url}")
    
    res = requests.get(url)
    return res.json()

def parse_classes(raw):
    COURSE = r"[A-Z]{3}[0-9]{4}[CL]"
    # replace weird space with normal space
    raw = raw.replace('\xa0', ' ')
    # assumes periods are useless
    raw = raw.replace('.', '')
    # schwartz
    raw = raw.replace('3744C', '4744C')
    # removes the space between, for example, "COP 3530"
    raw = re.sub(r"([A-Z]{3}) (\d{4}[CL]?)", r"\1\2", raw)
    # they forgot the C
    raw = re.sub(r'(COP3502|COP3503|COP3504)(?!C)', r'\1C', raw)
    # doubles
    raw = raw.replace('and and', 'and')
    raw = raw.replace('or or', 'or')
    # handle "taken XYZ"
    raw = re.sub(r'taken [A-Z]{3} ?\d{4}[CL]?', '', raw)
    #start gpt
    # use the final conjunction in the list:
    raw = re.sub(rf'({COURSE}) *, *(?=(?:{COURSE} *, *)*or *{COURSE})',  r'\1 or ',  raw)
    raw = re.sub(rf'({COURSE}) *, *(?=(?:{COURSE} *, *)*and *{COURSE})', r'\1 and ', raw)
    # any remaining commas default to "and"
    raw = re.sub(rf'({COURSE}) *, *', r'\1 and ', raw)
    #end gpt
    
    # extract relevant parts
    prereqs = re.findall(rf"(?:{COURSE}?|and|or|taken|\(|\))", raw)
    for i in range(len(prereqs) - 1, -1, -1):
        if prereqs[i] == ')' and prereqs[i-1] in ("and", "or"):
            prereqs.pop(i-1)
        elif prereqs[i] == '(' and i < len(prereqs) - 1:
            if prereqs[i+1] == ')':
                prereqs.pop(i+1)
                prereqs.pop(i)
            elif i < len(prereqs) - 2 and prereqs[i+2] == ')':
                prereqs.pop(i+2)
                prereqs.pop(i)
    while prereqs and prereqs[-1] in ("and", "or"):
        prereqs.pop()
    while prereqs and prereqs[0] in ("and", "or"):
        prereqs.pop(0)
    if prereqs and prereqs[0] == '(' and prereqs[-1] == ')':
        depth = 0
        closes_at_end = True
        for i in range(len(prereqs)):
            if prereqs[i] == '(':
                depth += 1
            elif prereqs[i] == ')':
                depth -= 1
                if depth == 0 and i < len(prereqs) - 1:
                    closes_at_end = False
                    break
        if closes_at_end:
            prereqs = prereqs[1:-1]
            
    return prereqs

if __name__ == "__main__":
    main()