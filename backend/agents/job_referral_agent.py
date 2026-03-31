from agents.base_agent import BaseAgent


class JobReferralAgent(BaseAgent):

    def __init__(self):
        super().__init__("Job Referral Agent")

    def process(self, user_input):

        if "job" in user_input.lower():
            return "I can help you find alumni who can give job referrals."

        elif "referral" in user_input.lower():
            return "Alumni can refer you to opportunities in their companies."

        else:
            return "Tell me if you are looking for a job or referral."