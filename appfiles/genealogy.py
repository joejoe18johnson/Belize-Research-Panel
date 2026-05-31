import pandas as pd
from collections import deque


def clean_id(x):
    if pd.isna(x):
        return ""
    x = str(x).strip()
    if x.lower() in ["nan", "none", "<na>", ""]:
        return ""
    if x.endswith(".0"):
        x = x[:-2]
    return x


def clean(x):
    if pd.isna(x):
        return ""
    return str(x).strip()


def get_person(df, pid):
    pid = clean_id(pid)
    row = df[df["id"] == pid]
    if row.empty:
        return None
    return row.iloc[0]


def get_name(df, pid):
    p = get_person(df, pid)
    return "" if p is None else p["name"]


def gender_word(gender, male_word, female_word, neutral_word):
    g = clean(gender).lower()
    if g in ["m", "male", "man"]:
        return male_word
    if g in ["f", "female", "woman"]:
        return female_word
    return neutral_word


def parents_of(df, pid):
    p = get_person(df, pid)
    if p is None:
        return []

    out = []
    for col in ["mother_id", "father_id"]:
        val = clean_id(p.get(col, ""))
        if val:
            out.append(val)

    return out


def children_of(df, pid):
    pid = clean_id(pid)
    rows = df[(df["mother_id"] == pid) | (df["father_id"] == pid)]
    return rows["id"].tolist()


def spouses_of(df, pid):
    pid = clean_id(pid)

    out = df[df["spouse_id"] == pid]["id"].tolist()

    p = get_person(df, pid)
    if p is not None:
        spouse = clean_id(p.get("spouse_id", ""))
        if spouse:
            out.append(spouse)

    return list(dict.fromkeys([x for x in out if x and x != pid]))


def siblings_of(df, pid):
    pid = clean_id(pid)
    my_parents = set(parents_of(df, pid))

    if not my_parents:
        return []

    out = []

    for _, row in df.iterrows():
        other = clean_id(row["id"])

        if other == pid:
            continue

        if my_parents.intersection(set(parents_of(df, other))):
            out.append(other)

    return list(dict.fromkeys(out))


def ancestors_with_depth(df, pid, max_depth=30):
    pid = clean_id(pid)
    result = {}
    queue = deque([(pid, 0)])
    visited = set()

    while queue:
        current, depth = queue.popleft()

        if current in visited:
            continue

        visited.add(current)

        if depth > 0:
            result[current] = depth

        if depth >= max_depth:
            continue

        for parent in parents_of(df, current):
            queue.append((parent, depth + 1))

    return result


def descendants_with_depth(df, pid, max_depth=30):
    pid = clean_id(pid)
    result = {}
    queue = deque([(pid, 0)])
    visited = set()

    while queue:
        current, depth = queue.popleft()

        if current in visited:
            continue

        visited.add(current)

        if depth > 0:
            result[current] = depth

        if depth >= max_depth:
            continue

        for child in children_of(df, current):
            queue.append((child, depth + 1))

    return result


def lowest_common_ancestor(df, a, b):
    anc_a = ancestors_with_depth(df, a)
    anc_b = ancestors_with_depth(df, b)

    common = set(anc_a).intersection(set(anc_b))

    if not common:
        return None

    best = min(common, key=lambda x: anc_a[x] + anc_b[x])

    return {
        "ancestor": best,
        "up_a": anc_a[best],
        "up_b": anc_b[best],
    }


def ancestor_label(df, pid, depth):
    p = get_person(df, pid)
    gender = "" if p is None else p.get("gender", "")

    if depth == 1:
        return gender_word(gender, "father", "mother", "parent")

    if depth == 2:
        return gender_word(gender, "grandfather", "grandmother", "grandparent")

    return "great-" * (depth - 2) + gender_word(
        gender, "grandfather", "grandmother", "grandparent"
    )


def descendant_label(df, pid, depth):
    p = get_person(df, pid)
    gender = "" if p is None else p.get("gender", "")

    if depth == 1:
        return gender_word(gender, "son", "daughter", "child")

    if depth == 2:
        return gender_word(gender, "grandson", "granddaughter", "grandchild")

    return "great-" * (depth - 2) + gender_word(
        gender, "grandson", "granddaughter", "grandchild"
    )


def ordinal(n):
    vals = {
        1: "first",
        2: "second",
        3: "third",
        4: "fourth",
        5: "fifth",
        6: "sixth",
        7: "seventh",
        8: "eighth",
        9: "ninth",
        10: "tenth",
    }
    return vals.get(n, f"{n}th")


def cousin_label(degree, removed, up_a, up_b):
    label = f"{ordinal(degree)} cousin"

    if removed == 1:
        label += " once removed"
    elif removed == 2:
        label += " twice removed"
    elif removed > 2:
        label += f" {removed} times removed"

    if removed > 0:
        if up_a < up_b:
            label += " - older generation"
        elif up_a > up_b:
            label += " - younger generation"

    return label


def relationship_rank(label):
    """
    Lower number means closer relationship.
    Used to prefer first cousin-in-law over distant blood cousin.
    """
    if not label or label in ["relative", "unknown", "same person"]:
        return 999

    if "spouse" in label or "husband" in label or "wife" in label:
        return 1

    if "parent" in label or "father" in label or "mother" in label:
        return 2

    if "child" in label or "son" in label or "daughter" in label:
        return 2

    if "sibling" in label or "brother" in label or "sister" in label:
        return 3

    if "aunt" in label or "uncle" in label or "niece" in label or "nephew" in label:
        return 4

    if "first cousin" in label:
        return 5

    if "second cousin" in label:
        return 6

    if "third cousin" in label:
        return 7

    if "fourth cousin" in label:
        return 8

    if "cousin" in label:
        return 9

    return 50


# =========================================================
# STEP RELATIONSHIPS
# =========================================================

def stepparents_of(df, pid):
    out = []

    biological_parents = set(parents_of(df, pid))

    for parent in biological_parents:
        for spouse in spouses_of(df, parent):
            if spouse not in biological_parents:
                out.append(spouse)

    return list(dict.fromkeys(out))


def stepchildren_of(df, pid):
    out = []

    for spouse in spouses_of(df, pid):
        for child in children_of(df, spouse):
            if pid not in parents_of(df, child):
                out.append(child)

    return list(dict.fromkeys(out))


def stepsiblings_of(df, pid):
    out = []

    for stepparent in stepparents_of(df, pid):
        for child in children_of(df, stepparent):
            if child != pid and child not in siblings_of(df, pid):
                out.append(child)

    return list(dict.fromkeys(out))


# =========================================================
# IN-LAW RELATIONSHIPS
# =========================================================

def parents_in_law_of(df, pid):
    out = []

    for spouse in spouses_of(df, pid):
        out.extend(parents_of(df, spouse))

    return list(dict.fromkeys(out))


def children_in_law_of(df, pid):
    out = []

    for child in children_of(df, pid):
        out.extend(spouses_of(df, child))

    return list(dict.fromkeys(out))


def siblings_in_law_of(df, pid):
    out = []

    for spouse in spouses_of(df, pid):
        out.extend(siblings_of(df, spouse))

    for sib in siblings_of(df, pid):
        out.extend(spouses_of(df, sib))

    out = [x for x in out if x != pid]

    return list(dict.fromkeys(out))


def in_law_label_from_base(df, person_id, base):
    """
    Converts a spouse's blood relationship into the correct in-law label
    using the gender of the person being labelled.
    Example:
        spouse is aunt of B, but A is male -> A is uncle-in-law of B.
    """

    person = get_person(df, person_id)
    gender = "" if person is None else person.get("gender", "")

    base = clean(base).lower()

    # aunt / uncle ladder
    if "aunt" in base or "uncle" in base:
        if "grand aunt" in base or "grand uncle" in base:
            prefix = base.split("grand")[0]
            return prefix + "grand " + gender_word(gender, "uncle", "aunt", "aunt/uncle") + "-in-law"

        if "great-" in base:
            prefix = base.split("aunt")[0] if "aunt" in base else base.split("uncle")[0]
            return prefix + gender_word(gender, "uncle", "aunt", "aunt/uncle") + "-in-law"

        return gender_word(gender, "uncle", "aunt", "aunt/uncle") + "-in-law"

    # niece / nephew ladder
    if "niece" in base or "nephew" in base:
        if "grand niece" in base or "grand nephew" in base:
            prefix = base.split("grand")[0]
            return prefix + "grand " + gender_word(gender, "nephew", "niece", "niece/nephew") + "-in-law"

        if "great-" in base:
            prefix = base.split("niece")[0] if "niece" in base else base.split("nephew")[0]
            return prefix + gender_word(gender, "nephew", "niece", "niece/nephew") + "-in-law"

        return gender_word(gender, "nephew", "niece", "niece/nephew") + "-in-law"

    # parent / grandparent ladder
    if "father" in base or "mother" in base or "parent" in base:
        if "grand" in base:
            prefix = base.split("grand")[0]
            return prefix + "grand" + gender_word(gender, "father", "mother", "parent") + "-in-law"

        return gender_word(gender, "father", "mother", "parent") + "-in-law"

    # child / grandchild ladder
    if "son" in base or "daughter" in base or "child" in base:
        if "grand" in base:
            prefix = base.split("grand")[0]
            return prefix + "grand" + gender_word(gender, "son", "daughter", "child") + "-in-law"

        return gender_word(gender, "son", "daughter", "child") + "-in-law"

    # siblings
    if "brother" in base or "sister" in base or "sibling" in base:
        return gender_word(gender, "brother", "sister", "sibling") + "-in-law"

    # cousins are not gendered
    if "cousin" in base:
        return base + "-in-law"

    return base + "-in-law"


def spouse_based_in_law_relationship(df, a, b):
    """
    Checks both directions:
    1. A's spouse is blood-related to B
    2. A is blood-related to B's spouse

    The returned label uses A's gender where the relationship is gendered.
    """

    candidates = []

    for spouse in spouses_of(df, a):
        base = blood_relationship_only(df, spouse, b)

        if base not in ["relative", "unknown", "same person"]:
            candidates.append(in_law_label_from_base(df, a, base))

    for spouse in spouses_of(df, b):
        base = blood_relationship_only(df, a, spouse)

        if base not in ["relative", "unknown", "same person"]:
            candidates.append(in_law_label_from_base(df, a, base))

    if not candidates:
        return None

    return sorted(candidates, key=relationship_rank)[0]

# =========================================================
# BLOOD RELATIONSHIP ONLY
# =========================================================

def blood_relationship_only(df, a, b):
    a = clean_id(a)
    b = clean_id(b)

    if a == b:
        return "same person"

    A = get_person(df, a)
    B = get_person(df, b)

    if A is None or B is None:
        return "unknown"

    anc_b = ancestors_with_depth(df, b)

    if a in anc_b:
        return ancestor_label(df, a, anc_b[a])

    desc_b = descendants_with_depth(df, b)

    if a in desc_b:
        return descendant_label(df, a, desc_b[a])

    if b in siblings_of(df, a):
        shared = set(parents_of(df, a)).intersection(set(parents_of(df, b)))
        label = gender_word(A.get("gender", ""), "brother", "sister", "sibling")

        if len(shared) == 1:
            label = "half-" + label

        return label

    lca = lowest_common_ancestor(df, a, b)

    if lca is None:
        return "relative"

    up_a = lca["up_a"]
    up_b = lca["up_b"]

    if up_a == 1 and up_b >= 2:
        depth = up_b - 1
        base = gender_word(A.get("gender", ""), "uncle", "aunt", "aunt/uncle")

        if depth == 1:
            return base

        if depth == 2:
            return "grand " + base

        return "great-" * (depth - 2) + "grand " + base

    if up_b == 1 and up_a >= 2:
        depth = up_a - 1
        base = gender_word(A.get("gender", ""), "nephew", "niece", "niece/nephew")

        if depth == 1:
            return base

        if depth == 2:
            return "grand " + base

        return "great-" * (depth - 2) + "grand " + base

    degree = min(up_a, up_b) - 1
    removed = abs(up_a - up_b)

    if degree >= 1:
        return cousin_label(degree, removed, up_a, up_b)

    return "relative"


# =========================================================
# MAIN RELATIONSHIP FUNCTION
# =========================================================

def relationship(df, a, b):
    a = clean_id(a)
    b = clean_id(b)

    if a == b:
        return "same person"

    A = get_person(df, a)

    if A is None or get_person(df, b) is None:
        return "unknown"

    # Spouse
    if b in spouses_of(df, a):
        return gender_word(A.get("gender", ""), "husband", "wife", "spouse")

    # Step relationships
    if a in stepparents_of(df, b):
        return gender_word(A.get("gender", ""), "stepfather", "stepmother", "stepparent")

    if a in stepchildren_of(df, b):
        return gender_word(A.get("gender", ""), "stepson", "stepdaughter", "stepchild")

    if a in stepsiblings_of(df, b):
        return gender_word(A.get("gender", ""), "stepbrother", "stepsister", "stepsibling")

    # Core in-laws
    if a in parents_in_law_of(df, b):
        return gender_word(A.get("gender", ""), "father-in-law", "mother-in-law", "parent-in-law")

    if a in children_in_law_of(df, b):
        return gender_word(A.get("gender", ""), "son-in-law", "daughter-in-law", "child-in-law")

    if a in siblings_in_law_of(df, b):
        return gender_word(A.get("gender", ""), "brother-in-law", "sister-in-law", "sibling-in-law")

    blood = blood_relationship_only(df, a, b)
    inlaw = spouse_based_in_law_relationship(df, a, b)

    # Prefer a closer spouse-based in-law relationship over a distant blood cousin.
    if inlaw and relationship_rank(inlaw) <= relationship_rank(blood):
        return inlaw

    if blood != "relative":
        return blood

    if inlaw:
        return inlaw

    return "relative"