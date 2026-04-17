import re


def sort_keys(keys):

    def sort_key(name):

        name_lower = name.lower()

        # priority files
        if name_lower in ["index", "intro", "readme"]:
            return (0, name_lower)

        # numbered files
        match = re.match(r"(\d+)[-_ ]?(.*)", name_lower)
        if match:
            return (1, int(match.group(1)), match.group(2))

        return (2, name_lower)

    return sorted(keys, key=sort_key)