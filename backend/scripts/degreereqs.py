import requests
from bs4 import BeautifulSoup
from pprint import pprint

def parseCatalog():

  # Parses catalog to get course codes and titles
  catalog = requests.get("https://catalog.ufl.edu/UGRD/colleges-schools/UGENG/CPS_BSCS/#text")
  soup = BeautifulSoup(catalog.text, 'html.parser')
  content = soup.find_all()
  parsed_content = []
  end_found = False
  start_found = False
  for item in content:
    if (item.name == "h2") and (item.text == "Required Courses"):
      start_found = True
    elif (item.name == "h3") and (item.text == "Interdisciplinary Electives | Select one option"):
      end_found = True
    if (start_found == True) and (end_found == False):
      if (item.name == "td") and ("or" in item.text):
        split = item.text.split("or\xa0")
        if split[0] == "":
          parsed_content[-1][1].append("".join(split[1].split()))
      elif (item.name == "a") and ("/search/?P=" in str(item.get('href'))):
        parsed_content.append(
          (True, ["".join(item.get_attribute_list("href")[0][11:].split("%20"))]))
      elif item.name == "span":
        parsed_content.append(
          (False, [item.text]))

  # Goes through content and identifies what courses are significant
  processed_reqs = {}
  key = parsed_content[0][0]
  for item in parsed_content:
    if item[0] == True:
      processed_reqs[key].append(item[1])
    elif item[0] == False:
      if ("".join(item[1][0].split(" "))).isalpha():
        key = item[1][0]
        processed_reqs[key] = []

  # Clears empty requirements and ensures or statements are satisfied
  processed_keys = list(processed_reqs.keys())
  for key in processed_keys:
    if len(processed_reqs[key]) == 0:
      processed_reqs.pop(key)

  pprint(processed_reqs)

