export type ScheduleConfigRequest = {
    x: number;
    y: number;
    z: number;
    min_creds: number;
    max_creds: number;
    blacklisted_periods: Array<{ day: string; period: number }>;
};

export type ScheduledCourse = {
    course_id: string;
    course_name: string;
    credits: number;
    course_type: string;
    day: string;
    period: number;
};

export type SolveResponse = {
    status: "success" | "error";
    total_credits?: number;
    scheduled_courses?: ScheduledCourse[];
    error_message?: string;
};

export async function fetchSchedule(url: string, options: { method: string; body?: string, headers?: string}) {
    console.log(`Mock POST for schedule config: ${options.method} ${url}`);

    if (options.body) {
        console.log("Body:", JSON.parse(options.body));
    }

    await new Promise((r) => setTimeout(r, 500));
    const body = options.body ? JSON.parse(options.body) : {};
    if (body.min_creds > body.max_creds) {
        const errorResponse: SolveResponse = {
            status: "error",
            error_message: "min credits cannot be smaller than max credits",
        };
        return { json: async () => errorResponse};
    }

    const successResponse: SolveResponse = {
            status: "success",
            total_credits: 9,
            scheduled_courses: [
            {
                course_id: "COP3502",
                course_name: "Programming Fundamentals 1",
                credits: 3,
                course_type: "Core",
                day: "MWF",
                period: 1,
            },
            {
                course_id: "MAC2312",
                course_name: "Calculus 2",
                credits: 3,
                course_type: "Core",
                day: "MWF",
                period: 3,
            },
            {
                course_id: "COT3100",
                course_name: "Discrete Structures",
                credits: 3,
                course_type: "Core",
                day: "MWF",
                period: 5,
            },
            ],
        };

    return { json: async () => successResponse };
}