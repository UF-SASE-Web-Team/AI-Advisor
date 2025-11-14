import collections
from ortools.sat.python import cp_model

def get_all_courses_data():
    """
    Dummy function to simulate fetching all available courses for a semester.
    
    Schema:
    {
        course_code: {
            "name": str,
            "credits": int,
            "type": "major" | "minor" | "elective",
            "prereqs": [[str], [str]], # List of course codes
            "coreqs": [str],
            "sections": [
                {
                    "section_id": str,
                    "slots": [(day, period), ...]
                }
            ]
        }
    }
    """
    
    return {
        "COP4600": {
            "name": "Operating Systems",
            "credits": 3,
            "type": "major",
            "prereqs": ["COP3530", "CDA3101"],
            "coreqs": [],
            "sections": [
                {"section_id": "12345", "slots": [('M', 2), ('W', 2), ('F', 2)]},
                {"section_id": "12346", "slots": [('T', 3), ('R', 3)]},
            ]
        },
        "COP3530": {
            "name": "Data Structures & Algs",
            "credits": 3,
            "type": "major",
            "prereqs": ["COP3503", "COT3100"],
            "coreqs": [],
            "sections": [
                {"section_id": "12347", "slots": [('M', 3), ('W', 3), ('F', 3)]},
                {"section_id": "12348", "slots": [('T', 4), ('R', 4)]},
            ]
        },
        "CDA3101": {
            "name": "Intro to Computer Org",
            "credits": 3,
            "type": "major",
            "prereqs": ["COP3502"],
            "coreqs": [],
            "sections": [
                {"section_id": "12349", "slots": [('M', 2), ('W', 2), ('F', 2)]},
            ]
        },
        # --- Minor Courses ---
        "STA3032": {
            "name": "Engineering Statistics",
            "credits": 3,
            "type": "minor",
            "prereqs": [["MAC2312"], ['STA2023']],
            "coreqs": [],
            "sections": [
                {"section_id": "12350", "slots": [('T', 1), ('T', 2), ('R', 1), ('R', 2)]},
            ]
        },
        "MAS3114": {
            "name": "Computational Linear Alg",
            "credits": 3,
            "type": "minor",
            "prereqs": ["MAC2312"],
            "coreqs": [], 
            "sections": [
                {"section_id": "12351", "slots": [('M', 5), ('W', 5)]},
            ]
        },
        # --- Elective Courses ---
        "ART2000": {
            "name": "Art Appreciation",
            "credits": 3,
            "type": "elective",
            "prereqs": [],
            "coreqs": [],
            "sections": [
                {"section_id": "12352", "slots": [('F', 1)]}, # This one will be on the blacklist
                {"section_id": "12353", "slots": [('M', 6), ('W', 6)]},
            ]
        },
        "ENC3246": {
            "name": "Professional Communication",
            "credits": 3,
            "type": "elective",
            "prereqs": [],
            "coreqs": [],
            "sections": [
                {"section_id": "12354", "slots": [('T', 5), ('R', 5)]},
            ]
        }
    }


def get_completed_courses():
    """
    Dummy function to simulate fetching the user's completed courses.
    Returns a set for fast lookups.
    """
    return {
        "COP3502",
        "COP3503",  
        "COT3100",  
        "MAC2311",
        "MAC2312",
        "MAC2313",
    }

def get_user_blacklist():
    """
    Dummy function to simulate fetching the user's blocked time slots.
    Returns a set of (day, period) tuples.
    """
    return {
        ('F', 1),
    }

def get_user_preferences():
    """
    Dummy function to simulate fetching the user's schedule goals.
    """
    return {
        "X_major": 1,
        "Y_minor": 2,     
        "Z_elective": 1, 
        "min_credits": 12,
        "max_credits": 15,
    }

def filter_eligible_data(all_courses, completed_set, blacklist_set):
    eligible_courses = {}
    eligible_sections = {} # {section_id: {data...}}
        
    for code, course in all_courses.items():
        prereq_groups = course['prereqs']
        prereqs_met = False

        if not prereq_groups:
            prereqs_met = True
        else:
            for group in prereq_groups:
                if not group:  # Empty group means no prereqs
                    prereqs_met = True
                    break

                prereq_set = set(group)
                if prereq_set.issubset(completed_set):
                    prereqs_met = True
                    break
        
        if not prereqs_met:
            continue

        valid_sections = []
        for section in course['sections']:
            section_id = section['section_id']
            section_slots = set(section['slots'])
            
            if not section_slots.isdisjoint(blacklist_set):
                continue
                
            valid_sections.append(section)
            
            eligible_sections[section_id] = {
                "course_code": code,
                "slots": section['slots']
            }

        if valid_sections:
            eligible_sections[code] = course.copy()
            eligible_sections[code]['sections'] = valid_sections
            
    return eligible_courses, eligible_sections


def solve_schedule(eligible_courses, eligible_sections, user_prefs, completed_courses):
    """
    The main CP-SAT solver function.
    """
    
    model = cp_model.CpModel()
    
    c_vars = {} # {course_code: BoolVar}
    s_vars = {} # {section_id: BoolVar}
    
    # A helper map to link courses to their sections
    # {course_code: [s_var_1, s_var_2, ...]}
    course_to_section_vars = collections.defaultdict(list)
    
    for code, course in eligible_courses.items():
        c_vars[code] = model.NewBoolVar(f"c_{code}")
        for section in course['sections']:
            s_id = section['section_id']
            s_vars[s_id] = model.NewBoolVar(f"s_{s_id}")
            course_to_section_vars[code].append(s_vars[s_id])
            
    print(f"Model created with {len(c_vars)} eligible courses and {len(s_vars)} eligible sections.")
            
    # 1. Link Course & Section variables
    for code, section_vars in course_to_section_vars.items():
        # If c_vars[code] is 1, sum(section_vars) must be 1.
        model.Add(sum(section_vars) == 1).OnlyEnforceIf(c_vars[code])
        # If c_vars[code] is 0, sum(section_vars) must be 0.
        model.Add(sum(section_vars) == 0).OnlyEnforceIf(c_vars[code].Not())

    # 2. Course Count Constraints (X, Y, Z)
    majors = [v for c, v in c_vars.items() if eligible_courses[c]['type'] == 'major']
    minors = [v for c, v in c_vars.items() if eligible_courses[c]['type'] == 'minor']
    electives = [v for c, v in c_vars.items() if eligible_courses[c]['type'] == 'elective']
    
    model.Add(sum(majors) == user_prefs['X_major'])
    model.Add(sum(minors) == user_prefs['Y_minor'])
    model.Add(sum(electives) == user_prefs['Z_elective'])

    # 3. Credit Range Constraints
    all_credits = []
    for code, var in c_vars.items():
        credits = eligible_courses[code]['credits']
        all_credits.append(credits * var)
        
    total_credits = sum(all_credits)
    model.Add(total_credits >= user_prefs['min_credits'])
    model.Add(total_credits <= user_prefs['max_credits'])

    # 4. Corequisite Constraints
    for code, course in eligible_courses.items():
        for coreq_code in course['coreqs']:
            if coreq_code in c_vars:
                model.AddImplication(c_vars[code], c_vars[coreq_code])
            else:
                if coreq_code not in completed_courses:
                    model.Add(c_vars[code] == 0)


    # 5. No Time Conflicts
    # We build a map of {slot: [list of sections that use it]}
    slot_to_sections = collections.defaultdict(list)
    for s_id, section in eligible_sections.items():
        for slot in section['slots']:
            slot_to_sections[slot].append(s_vars[s_id])
            
    # Now, for any slot with > 1 section, add a constraint
    conflict_count = 0
    for slot, conflicting_vars in slot_to_sections.items():
        if len(conflicting_vars) > 1:
            model.AddAtMostOne(conflicting_vars)
            conflict_count += 1
    
    solver = cp_model.CpSolver()
    status = solver.Solve(model)
    print(f"Solver finished with status: {solver.StatusName(status)}")
    
    if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
        
        final_schedule_sections = []
        
        for s_id, var in s_vars.items():
            if solver.Value(var) == 1:
                final_schedule_sections.append(s_id)

        print_schedule(final_schedule_sections, eligible_courses, eligible_sections)
    else:
        print("Try adjusting your preferences (e.g., X/Y/Z, credit limits) or blacklist.")


def print_schedule(final_schedule_sections, eligible_courses, eligible_sections):
    print("\n--- Your Schedule ---")
    schedule_by_day = collections.defaultdict(list)
    final_total_credits = 0
    
    for s_id in final_schedule_sections:
        section_data = eligible_sections[s_id]
        course_code = section_data['course_code']
        course_data = eligible_courses[course_code]
        
        print(f"\n* {course_code} - {course_data['name']} ({course_data['credits']} credits)")
        print(f"  Section: {s_id}")
        print(f"  Type: {course_data['type']}")
        
        final_total_credits += course_data['credits']
        
        for day, period in section_data['slots']:
            schedule_by_day[day].append(f"P{period}: {course_code}")
        
    print(f"\nTotal Courses: {len(final_schedule_sections)}")
    print(f"Total Credits: {final_total_credits}")


if __name__ == "__main__":
    all_courses = get_all_courses_data()
    completed_courses = get_completed_courses()
    blacklist = get_user_blacklist()
    prefs = get_user_preferences()
    
    eligible_courses, eligible_sections = filter_eligible_data(
        all_courses, completed_courses, blacklist
    )
    
    if not eligible_courses:
        print("\nNo courses are eligible after filtering. Cannot run solver.")
    else:
        solve_schedule(eligible_courses, eligible_sections, prefs, completed_courses)