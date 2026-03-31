from agents.mentorship_agent import MentorshipAgent
from agents.job_referral_agent import JobReferralAgent
from agents.donation_agent import DonationAgent
from agents.reunion_agent import ReunionAgent


class Orchestrator:

    def __init__(self):
        self.mentorship_agent = MentorshipAgent()
        self.job_agent = JobReferralAgent()
        self.donation_agent = DonationAgent()
        self.reunion_agent = ReunionAgent()

    def route(self, user_input):

        if "mentor" in user_input.lower():
            return self.mentorship_agent.process(user_input)

        elif "job" in user_input.lower() or "referral" in user_input.lower():
            return self.job_agent.process(user_input)

        elif "donate" in user_input.lower():
            return self.donation_agent.process(user_input)

        elif "reunion" in user_input.lower() or "event" in user_input.lower():
            return self.reunion_agent.process(user_input)

        else:
            return "Sorry, I could not understand your request."