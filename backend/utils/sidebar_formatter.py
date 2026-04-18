import re

def clean_name(name):

    name = name.replace(".md", "")

    # remove numbering (01-, 1_, etc.)
    name = re.sub(r"^\d+[-_ ]*", "", name)

    # format text
    return name.replace("_", " ").title()