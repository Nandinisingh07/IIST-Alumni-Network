class BaseAgent:
    def __init__(self, name):
        self.name = name

    def process(self, user_input):
        raise NotImplementedError("Each agent must implement the process method")