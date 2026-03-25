import openai
import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain.agents import create_agent
from langchain.tools import tool
from typing import Any
import json
from sentence_transformers import SentenceTransformer, util

from timeit import timeit
# from tools.core import parse_class_code, get_class_times, get_reqs_filled, get_reqs_needed

load_dotenv()

# mercury_llm = ChatOpenAI(
#   model="inception/mercury",
#   api_key=os.getenv("MERCURY_LLM_API_KEY"),
#   base_url="https://openrouter.ai/api/v1"
# )

llm = ChatOpenAI(
    model="gpt-5-nano",
    reasoning_effort="low",
    max_retries=2,
    api_key=os.getenv("LLM_API_KEY"), # type: ignore
    base_url="https://api.ai.it.ufl.edu",
)

# 1. Load a pre-trained model 
# 'all-MiniLM-L6-v2' is fast and efficient for general use
model = SentenceTransformer('all-MiniLM-L6-v2')

def search_similarity(word: str, options: list[str]):
    word_embedding = model.encode([word])[0]
    options_embedding = model.encode(options)

    current = None
    current_similarity = 0
    for i in range(len(options)):
        option_sim = util.cos_sim(word_embedding, options_embedding[i])
        if option_sim > current_similarity:
            current_similarity = option_sim
            current = options[i]

    SIMILARITY_THRESHOLD = 0.1
    if current_similarity > SIMILARITY_THRESHOLD:
        return current
    return None

def get_professor_rating(professor_name: str):
    """  Get professor rating and other info given a professor name """
    text: str = ""
    with open("../data/uf_cs_professors.json") as file:
        text += file.read()
    data = json.loads(text)

    # Convert to a map
    data_map = {}
    for item in data:
        data_map[item["name"]] = item

    # Find most similiar search
    options = list(data_map.keys())
    result = search_similarity(professor_name, options)
    if result == None:
        return "Professor was not found"
    
    return data_map[result]

def get_course_info(course_name: str):
    """ Gets course info given a course name """
    text: str = ""
    with open("../data/courses.json") as file:
        text += file.read()
    data = json.loads(text)
    
    # Convert to a map
    data_map = {}
    for item in data:
        data_map[item["name"]] = item

    # Find most similiar search
    options = list(data_map.keys())
    result = search_similarity(course_name, options)
    if result == None:
        return "Course was not found"
    
    return data_map[result]

# llm.invoke("test")
def ask(prompt: str, llm: Any):
  agent = create_agent(llm, tools=[
    get_professor_rating,
    get_course_info
    # get_class_times,
    # get_reqs_filled,
    # get_reqs_needed
  ])
  res = agent.invoke(
      {"messages": [
         {"role": "system", "content": "Make sure to use the tools strictly and use only data from there. Do not hallucinate data or use other info."}, 
         {"role": "user", "content": prompt}
      ]}
  )
  tools_used: list[str] = []
  for message in res["messages"]:
      try:
          tools_used += message.tool_calls
      except:
          pass
  return tools_used, res["messages"][-1].content

if __name__ == "__main__":
    tools, response = ask(prompt="I want to take to take Penetration Testing: Ethical Hacking and I would like to see what the professor is like.", llm=llm)
    # print(tools)
    # print(response)
    # stuff = get_professor_rating(professor_name="John Mendoza-Garcia")
    # stuff1= get_course_info(course_name="Applications in Biological Engineering")
    print(tools)
    print(response)
# ask(prompt="I want to take COP3504 and I would like to see what requirements it fulfills.", llm=mercury_llm)

