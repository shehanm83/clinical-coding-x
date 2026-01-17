# MRCM - Machine Readable Concept Model

MRCM defines the **rules** for how SNOMED CT concepts can be combined and what attributes are valid for different concept types.

## What is MRCM?

The **Machine Readable Concept Model** specifies:

1. **Domain constraints** - Which attributes apply to which concepts
2. **Range constraints** - What values are valid for each attribute
3. **Cardinality** - How many values an attribute can have

```
Example Rule:
  Domain: Clinical finding (< 404684003)
  Attribute: Severity (246112005)
  Range: Severity qualifier values (< 272141005)

  Means: Any clinical finding can have a Severity attribute
         with values like Mild, Moderate, or Severe
```

---

## Why MRCM Matters

### Problem: Invalid Attribute Combinations

Without MRCM, we might ask clinically invalid questions:

```
❌ "What is the laterality of diabetes?"
   (Diabetes has no laterality - it's a systemic disease)

❌ "What is the clinical course of hypertension?"
   (Hypertension is chronic by definition)

❌ "What is the severity of the left arm?"
   (Body structures don't have severity)
```

### Solution: MRCM Validation

MRCM tells us which questions are valid:

```
✓ "What is the severity of chest pain?"
   (Pain can be Mild, Moderate, or Severe)

✓ "What is the laterality of arm pain?"
   (Arms are paired structures)

✓ "What is the clinical course of pneumonia?"
   (Infections can be Acute, Subacute, or Chronic)
```

---

## MRCM in This System

### Configuration File

The `config/mrcm-ranges.json` file contains pre-extracted attribute data:

```json
{
  "metadata": {
    "extraction_date": "2024-01-15",
    "snomed_version": "2024-01-01"
  },
  "attributes": {
    "246112005": {
      "name": "Severity",
      "is_qualifier": true,
      "values": [
        {"id": "255604002", "term": "Mild", "fsn": "Mild (qualifier value)"},
        {"id": "6736007", "term": "Moderate", "fsn": "Moderate (severity modifier)"},
        {"id": "24484000", "term": "Severe", "fsn": "Severe (severity modifier)"}
      ]
    },
    "272741003": {
      "name": "Laterality",
      "is_qualifier": true,
      "values": [
        {"id": "7771000", "term": "Left", "fsn": "Left (qualifier value)"},
        {"id": "24028007", "term": "Right", "fsn": "Right (qualifier value)"},
        {"id": "51440002", "term": "Bilateral", "fsn": "Bilateral (qualifier value)"}
      ]
    }
  }
}
```

### MrcmConfigProvider

The provider determines which attributes apply to a concept:

```python
from concept_extractor.core.mrcm import MrcmConfigProvider

mrcm = MrcmConfigProvider("config/mrcm-ranges.json")

# Get valid attributes for "Chest pain"
attrs = await mrcm.get_valid_attributes_async(
    concept_id="29857009",
    semantic_tag="finding",
    concept_term="Chest pain"
)

# Result:
# [
#   AttributeDefinition(id="246112005", name="Severity"),
#   AttributeDefinition(id="272741003", name="Laterality"),
# ]
```

---

## Attribute Applicability Rules

### 1. Severity (246112005)

**Always applicable** to clinical findings and disorders.

```
✓ Chest pain → Can be Mild, Moderate, Severe
✓ Diabetes → Can be Mild, Moderate, Severe
✓ Headache → Can be Mild, Moderate, Severe
```

### 2. Laterality (272741003)

**Only applicable** when the concept has a Finding site that is a **lateralizable body structure** (paired structure).

```
Lateralizable Body Structures:
- Arms, Legs, Hands, Feet
- Eyes, Ears
- Lungs, Kidneys, Breasts
- Sides of chest, abdomen

Examples:
✓ "Arm pain" → Has Finding site = Arm → Laterality applies
✓ "Chest pain" → Has Finding site = Chest wall → Laterality applies
✗ "Headache" → Head is midline → Laterality does NOT apply
✗ "Diabetes" → No Finding site → Laterality does NOT apply
```

### 3. Clinical Course (263502005)

**Only applicable** to non-chronic conditions.

```
✓ Chest pain → Can be Acute, Subacute, Chronic
✓ Pneumonia → Can be Acute, Subacute, Chronic
✗ Diabetes → Already chronic by definition
✗ Hypertension → Already chronic by definition
✗ COPD → "Chronic" is in the name
```

### 4. Occurrence (246454002)

**Only applicable** to episodic/recurrent conditions.

```
✓ Migraine → Can be First episode, Recurrent
✓ Seizure → Can be First episode, Recurrent
✗ Diabetes → Not episodic
✗ Hypertension → Not episodic
```

---

## Dynamic vs Keyword-Based Checks

### Dynamic Checks (with SNOMED client)

When the SNOMED client is available, we make **real hierarchy checks**:

```python
# 1. Get concept's existing relationships
relationships = await snomed_client.get_relationships(concept_id)

# 2. Check Finding site for lateralizable body structure
finding_site_id = get_finding_site(relationships)
is_lateralizable = await check_lateralizable(finding_site_id)

# 3. Check if chronic disease via ancestor traversal
ancestors = await snomed_client.get_ancestors(concept_id)
is_chronic = CHRONIC_DISEASE_CONCEPT in ancestors
```

### Keyword-Based Fallback

Without SNOMED client, we use **keyword heuristics**:

```python
# Laterality keywords
if any(kw in term for kw in ["arm", "leg", "eye", "ear", "chest", "lung"]):
    include_laterality = True

# Chronic disease keywords
if any(kw in term for kw in ["diabetes", "hypertension", "chronic", "copd"]):
    is_chronic = True
```

---

## Chronic Disease Detection

Chronic diseases should NOT get "Clinical course" questions.

### SNOMED Hierarchy Check

```python
# Chronic disease concept
CHRONIC_DISEASE_CONCEPT = "27624003"

# Well-known chronic disease parents
CHRONIC_PARENTS = {
    "73211009",   # Diabetes mellitus
    "38341003",   # Hypertensive disorder
    "13645005",   # COPD
    "195967001",  # Asthma
    "69896004",   # Rheumatoid arthritis
}

async def is_chronic(concept_id: str) -> bool:
    ancestors = await snomed_client.get_ancestors(concept_id)

    # Check if descendant of "Chronic disease"
    if CHRONIC_DISEASE_CONCEPT in ancestors:
        return True

    # Check if descendant of known chronic diseases
    for parent in CHRONIC_PARENTS:
        if parent in ancestors:
            return True

    return False
```

### Term-Based Check

```python
# If the concept term contains "chronic", it's chronic
if "chronic" in concept_term.lower():
    return True
```

---

## Semantic Tag Exclusions

Some semantic tags should NEVER get qualifier attributes:

| Semantic Tag | Reason |
|--------------|--------|
| `body structure` | Anatomical, not clinical |
| `substance` | Drugs don't have severity |
| `qualifier value` | Already a qualifier |
| `organism` | Pathogens, not conditions |
| `physical object` | Devices, not conditions |
| `attribute` | Meta-concept |

```python
EXCLUDED_TAGS = {
    "body structure",
    "substance",
    "qualifier value",
    "organism",
    "physical object",
    "attribute",
}

if semantic_tag in EXCLUDED_TAGS:
    return []  # No attributes
```

---

## Integration with Question Generator

The MRCM provider feeds into the Question Generator:

```
1. User selects: "Chest pain" (29857009)
                    │
                    ▼
2. MRCM returns valid attributes:
   - Severity (246112005)
   - Laterality (272741003)
                    │
                    ▼
3. Question Generator creates questions:
   - "How severe is the chest pain?"
     Options: Mild, Moderate, Severe

   - "Which side is affected?"
     Options: Left, Right, Bilateral
                    │
                    ▼
4. User answers → Post-coordinated expression:
   29857009 |Chest pain|:
     246112005 |Severity| = 24484000 |Severe|,
     272741003 |Laterality| = 7771000 |Left|
```

---

## References

- [SNOMED CT MRCM Guide](https://confluence.ihtsdotools.org/display/DOCMRCM)
- [MRCM Reference Sets](https://confluence.ihtsdotools.org/display/DOCRFSPG/4.2.10.+MRCM+Reference+Sets)
