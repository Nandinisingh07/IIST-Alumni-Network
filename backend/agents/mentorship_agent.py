from agents.base_agent import BaseAgent


class MentorshipAgent(BaseAgent):

    def __init__(self):
        super().__init__("Mentorship Agent")

    def process(self, user_input):

        if "mentor" in user_input.lower():
            return "I can help connect you with alumni mentors."

        elif "guidance" in user_input.lower():
            return "Alumni mentors can guide you in your career."

        else:
            return "Please tell me if you are looking for mentorship or career guidance."