from pypdf import PdfReader
import re
import json

transcript = "Transcript Report - Copy.pdf"
output = "transcript.json"

def parseTransript(transcript, output):
    # pull data from PDF https://pypi.org/project/pypdf/
    reader = PdfReader(transcript)
    number_of_pages = reader.get_num_pages()
    data = ""

    for n in range(0, number_of_pages):
        page = reader.get_page(n)
        data += page.extract_text()

    # regex to find locations of terms/classes src: https://regexr.com/ https://www.w3schools.com/python/python_regex.asp
    terms = re.finditer("(?P<term>(Fall|Spr|Sum)\\s20\\d{2})", data)
    # TODO: i can probably better optimize the regex
    classes = re.finditer("(?P<course>[A-Z]{3} ([0-9]{4}[CL]?|L0{3})) "
                          + "(?P<name>.*?)"
                          + "(?:\\s(?P<grade>A|A-|[BCD][+-]?|P|S|U|E|WF?|NG|[IN]\\*?|U|H|E))? "
                          + "(?P<credit_attempted>[0-9]\\.[0-9]{2})"
                          + "(?:\\s(?P<earned_hours>[0-9]\\.[0-9]{2}))?"
                          + "(?:\\s(?P<carried_hours>[0-9]\\.[0-9]{2}))?", data)

    # store index of where terms are in data string
    terms_index = {}
    for t in terms:
        terms_index[t.end()] = t.groupdict()['term']

    # store index of where classes are in data string
    class_index = {}
    for c in classes:
        class_index[c.start()] = c.groupdict()

    # sort courses by term
    ret = {}
    for keys, value in class_index.items():
        term = 0
        for t_keys in terms_index:
            if keys >= t_keys:
                term = t_keys
        if terms_index[term] not in ret:
            ret[terms_index[term]] = []
        ret[terms_index[term]].append(value)

    # format pairings and dump to json file src: https://www.geeksforgeeks.org/python/json-dump-in-python/
    file = open(output, "w")
    file.write(json.dumps(ret, indent=4))

'''
for keys, value in ret.items():
    print(keys + ":")
    for v in value:
        print(v)
'''

parseTransript(transcript, output)