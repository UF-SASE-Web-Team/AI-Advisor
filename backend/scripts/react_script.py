import openai
import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain.agents import create_agent
from langchain.tools import tool
from typing import Any
import json
import re
from sentence_transformers import SentenceTransformer, util

from timeit import timeit
# from tools.core import parse_class_code, get_class_times, get_reqs_filled, get_reqs_needed

load_dotenv()

# llm = ChatOpenAI(
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
    # TODO: Make this more efficient
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
    """ Gets course info given a course name or course code """
    text: str = ""
    with open("../data/courses.json") as file:
        text += file.read()
    data = json.loads(text)

    # Check if course code or name
    key = "name"
    has_code = re.search("[A-Z]{3}[0-9]{4}", course_name)
    if has_code != None:
        key = "code"
    
    # Convert to a map
    data_map = {}
    for item in data:
        data_map[item[key]] = item

    # Find most similiar search
    options = list(data_map.keys())
    result = search_similarity(course_name, options)
    if result == None:
        return "Course was not found"
    
    print(data_map[result])
    return data_map[result]

def get_reddit_data_professor(professor_name: str):
    """ Gets insight from reddit data for a professor"""
    text: str = ""
    with open("../data/reddit_post_data.json") as file:
        text += file.read()
    data = json.loads(text).values()

    # Convert to a map
    data_map = {}
    for item in data:
        if item["professor"] not in data_map:
            data_map[item["professor"]] = []
        if len(item["postText"]) > 0:
            data_map[item["professor"]].append((item["postText"], item["comments"]))

    # Find most similiar search
    options = list(data_map.keys())
    result = search_similarity(professor_name, options)
    if result == None:
        return "Professor was not found"
    
    return data_map[result]

def get_reddit_data_topics(topic: str):
    """ Gets insight from reddit data for a topic or question"""
    text: str = ""
    with open("../data/reddit_post_data.json") as file:
        text += file.read()
    data = json.loads(text).values()

    # Convert to a map
    data_map = {}
    for item in data:
        if item["title"] not in data_map:
            data_map[item["title"]] = []
        if len(item["postText"]) > 0:
            data_map[item["title"]].append((item["postText"], item["comments"]))

    # Find most similiar search
    options = list(data_map.keys())
    result = search_similarity(topic, options)
    if result == None:
        return "Topic was not found"
    
    return data_map[result]
    

# llm.invoke("test")
def ask(prompt: str, llm: Any):
  agent = create_agent(llm, tools=[
    get_professor_rating,
    get_course_info,
    get_reddit_data_professor,
    get_reddit_data_topics
    # get_class_times,
    # get_reqs_filled,
    # get_reqs_needed
  ])
  res = agent.invoke(
      {"messages": [
         {"role": "system", "content": """
          Make sure to use the tools strictly and use only data from there. Do not hallucinate data or use other info.
          Only answer academic inquiries.
          Some basic info about user is:
            STUDENT UNIVERSITY: University of Florida
          """}, 
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

def parse_tool_call(tool_call: dict):
    function_call: str = f"{tool_call["name"]}("
    for arg in tool_call["args"]:
        function_call += f"{arg}={tool_call["args"][arg]}"
    function_call += ")"
    return function_call

def parse_tool_calls(calls: list[dict]):
    calls = []
    for item in calls:
        print(item)
        calls.append(parse_tool_call(item))
    return ", ".join(calls)

def run_ask_loop():
    while True:
        prompt = input("Prompt: ")
        tools, response = ask(prompt=prompt, llm=llm)
        print("Tools Called:")
        for tool in tools:
            print(parse_tool_call(tool))
        print(f"Response: {response}")
        print()

if __name__ == "__main__":
    # EXAMPLE_PROMPT_1 = """
    # I want to take to take Penetration Testing and I would like to see what the professor is like.
    # """
    # EXAMPLE_PROMPT_2 = """
    # I want to take to take Applications in Biological Engineering and I would like to see what other people think about it.
    # """
    # tools, response = ask(prompt=EXAMPLE_PROMPT_1, llm=llm)
    # print("Tools Called:")
    # for tool in tools:
    #     print(parse_tool_call(tool))
    run_ask_loop()
    # test = get_reddit_data_professor(professor_name="John Mendoza-Garcia")
    # print(test)
    # run_ask_loop()
    # print(tools)
    # print(response)
    # stuff = get_professor_rating(professor_name="John Mendoza-Garcia")
    # stuff1= get_course_info(course_name="Applications in Biological Engineering")
    
# ask(prompt="I want to take COP3504 and I would like to see what requirements it fulfills.", llm=mercury_llm)

