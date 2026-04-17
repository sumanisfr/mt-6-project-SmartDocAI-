def sort_sidebar(tree):

    if not isinstance(tree, dict):
        return tree

    sorted_tree = {}

    from utils.sidebar_sorter import sort_keys

    for key in sort_keys(tree.keys()):
        sorted_tree[key] = sort_sidebar(tree[key])

    return sorted_tree