class Secret:
    def __init__(self, value, auth_type="bearer"):
        self.value = value
        self.auth_type = auth_type

    def __repr__(self):
        return "Secret(********)"

    def __str___(self):
        return "*******"
