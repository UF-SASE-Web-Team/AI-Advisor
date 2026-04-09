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
from supabase import create_client, Client
from langgraph.checkpoint.memory import MemorySaver
from timeit import timeit
from react_tools import *
# from tools.core import parse_class_code, get_class_times, get_reqs_filled, get_reqs_needed

load_dotenv()

# llm = ChatOpenAI(
#   model="inception/mercury",
#   api_key=os.getenv("MERCURY_LLM_API_KEY"),
#   base_url="https://openrouter.ai/api/v1"
# )

llm = ChatOpenAI(
    model="gpt-oss-120b",
    reasoning_effort="low",
    max_retries=2,
    api_key=os.getenv("LLM_API_KEY"), # type: ignore
    base_url="https://api.ai.it.ufl.edu",
)

memory = MemorySaver()

agent = create_agent(llm, tools=[
  get_professor_rating,
  get_course_info,
  get_reddit_data_professor,
  get_reddit_data_topics
  # get_class_times,
  # get_reqs_filled,
  # get_reqs_needed
], checkpointer=memory)

config = {"configurable": {"thread_id": "student_session_1"}}

# llm.invoke("test")
def ask(prompt: str, llm: Any):
  res = agent.invoke(
      {"messages": [
         {"role": "system", "content": """
          Make sure to use the tools strictly and use only data from there. Do not hallucinate data or use other info.
          Only answer academic inquiries.
          Some basic info about user is:
            STUDENT UNIVERSITY: University of Florida
          """}, 
         {"role": "user", "content": prompt}
      ]}, config=config
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
    tool_calls = []
    for item in calls:
        tool_calls.append(parse_tool_call(item))
    return ", ".join(tool_calls)

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
    EXAMPLE_PROMPT_1 = """
    I want to take to take Penetration Testing and I would like to see what the professor is like.
    """
    # EXAMPLE_PROMPT_2 = """
    # I want to take to take Applications in Biological Engineering and I would like to see what other people think about it.
    # """
    # tools, response = ask(prompt=EXAMPLE_PROMPT_1, llm=llm)
    get_professor_rating("Michael Link")
    # print("Tools Called:")
    # for tool in tools:
    #     print(parse_tool_call(tool))
    # run_ask_loop()
    # test = get_reddit_data_professor(professor_name="John Mendoza-Garcia")
    # print(test)
    # run_ask_loop()
    # print(tools)
    # print(response)
    # stuff = get_professor_rating(professor_name="John Mendoza-Garcia")
    # stuff1= get_course_info(course_name="Applications in Biological Engineering")
    
# ask(prompt="I want to take COP3504 and I would like to see what requirements it fulfills.", llm=mercury_llm)

