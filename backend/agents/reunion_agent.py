from agents.base_agent import BaseAgent


class ReunionAgent(BaseAgent):

    def __init__(self):
        super().__init__("Reunion Agent")

    def process(self, user_input):

        if "reunion" in user_input.lower():
            return "I can help you register for upcoming alumni reunions."

        elif "event" in user_input.lower():
            return "There are several alumni networking events planned."

        else:
            return "Tell me if you want information about alumni events or reunions."