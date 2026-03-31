from agents.base_agent import BaseAgent


class DonationAgent(BaseAgent):

    def __init__(self):
        super().__init__("Donation Agent")

    def process(self, user_input):

        if "donate" in user_input.lower():
            return "Thank you for your interest in donating to the alumni fund."

        elif "fund" in user_input.lower():
            return "You can contribute to scholarships and campus development."

        else:
            return "Let me know if you want information about alumni donations."