import openai
import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain.agents import create_agent
from langchain.tools import tool
from typing import Any
import json

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

def get_professor_rating(professor_name: str):
    text: str = ""
    headers
    with open("../data/uf_cs_professors.json") as file:
        text += file.read()
    data = json.loads(text)

    # Convert to a map
    data_map = {}
    for item in data:
        data_map[item["name"]] = item

    # 
    
    return "Professor was not found"

def get_course_info(course_name: str):
    text: str = ""
    with open("../data/courses.json") as file:
        text += file.read()
    data = json.loads(text)
    for item in data:
        if item["name"] == course_name:
            return item
    return "Class was not found"

# llm.invoke("test")
def ask(prompt: str, llm: Any):
  agent = create_agent(llm, tools=[
    get_professor_rating
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
    # tools, response = ask(prompt="I want to take COP3504 and I would like to see what requirements it fulfills.", llm=llm)
    # print(tools)
    # print(response)
    # stuff = get_professor_rating(professor_name="John Mendoza-Garcia")
    # stuff1= get_course_info(course_name="Applications in Biological Engineering")
    example_prompt = """

    """
    print(stuff1)
# ask(prompt="I want to take COP3504 and I would like to see what requirements it fulfills.", llm=mercury_llm)

