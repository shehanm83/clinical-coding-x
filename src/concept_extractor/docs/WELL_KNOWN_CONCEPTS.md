# Well-Known SNOMED CT Concepts

This document lists SNOMED CT concept IDs used by the Concept Extractor for
querying the SNOMED hierarchy via snomed-service.

**Important:** These IDs are used as query parameters, NOT for hardcoding
business logic. All validation (chronic disease check, laterality applicability,
etc.) is done by querying the actual SNOMED CT hierarchy through snomed-service.

## Attribute Type Concepts

These are relationship/attribute types used to qualify clinical concepts.

| Concept ID | Name | Description | Used For |
|------------|------|-------------|----------|
| `246112005` | Severity | Indicates how severe a condition is | Mild/Moderate/Severe questions |
| `272741003` | Laterality | Indicates which side is affected | Left/Right/Bilateral questions |
| `263502005` | Clinical course | Indicates temporal pattern | Acute/Chronic/Intermittent questions |
| `246454002` | Occurrence | Indicates episode pattern | First/Recurrent/New episode questions |
| `370135005` | Pathological process | Underlying disease mechanism | Infectious/Autoimmune/Inflammatory |
| `363698007` | Finding site | Links finding to body location | Determining laterality |
| `116680003` | Is a | Hierarchical relationship | Parent/child navigation |

### Usage in Code

```python
# mrcm.py - these IDs are for SNOMED queries, NOT hardcoded logic

# Check if concept is chronic via hierarchy query
ancestors = await snomed_client.get_ancestors(concept_id)
is_chronic = CHRONIC_DISEASE_CONCEPT in ancestors

# Check if laterality is valid for body site via MRCM query
is_lateralizable = await snomed_client.is_valid_attribute(
    body_site_id, LATERALITY_ATTR_ID
)
```

---

## Disease Classification Concepts

### Chronic Disease

| Concept ID | Name | Description |
|------------|------|-------------|
| `27624003` | Chronic disease (disorder) | Top-level chronic disease concept |

**Descendants of this concept should NOT get "Clinical course" questions** - they are already chronic by definition.

### How Chronic Disease Check Works

The concept extractor queries the SNOMED hierarchy to determine if a concept is chronic:

```python
# Query actual SNOMED hierarchy - NO hardcoded disease lists
ancestors = await snomed_client.get_ancestors(concept_id)
is_chronic = "27624003" in ancestors  # CHRONIC_DISEASE_CONCEPT
```

This approach:
- Uses actual SNOMED CT data, not hardcoded lists
- Automatically handles new chronic diseases added to SNOMED
- Works correctly across SNOMED CT version updates

---

## Severity Qualifier Values

Valid values for the Severity attribute (246112005):

| Concept ID | Preferred Term | FSN |
|------------|----------------|-----|
| `255604002` | Mild | Mild (qualifier value) |
| `6736007` | Moderate | Moderate (severity modifier) |
| `24484000` | Severe | Severe (severity modifier) |

**ECL:** `<< 272141005 |Severities (qualifier value)|`

---

## Laterality Qualifier Values

Valid values for the Laterality attribute (272741003):

| Concept ID | Preferred Term | FSN |
|------------|----------------|-----|
| `7771000` | Left | Left (qualifier value) |
| `24028007` | Right | Right (qualifier value) |
| `51440002` | Bilateral | Bilateral (qualifier value) |

**ECL:** `<< 182353008 |Side|`

---

## Clinical Course Qualifier Values

Valid values for the Clinical course attribute (263502005):

| Concept ID | Preferred Term | FSN |
|------------|----------------|-----|
| `373933003` | Acute | Acute (qualifier value) |
| `90734009` | Chronic | Chronic (qualifier value) |
| `255212004` | Acute-on-chronic | Acute-on-chronic (qualifier value) |
| `7087005` | Intermittent | Intermittent (qualifier value) |

**ECL:** `<< 288524001 |Courses|`

---

## Occurrence Qualifier Values

Valid values for the Occurrence attribute (246454002):

| Concept ID | Preferred Term | FSN |
|------------|----------------|-----|
| `255217005` | First episode | First episode (qualifier value) |
| `255227004` | Recurrent | Recurrent (qualifier value) |
| `263732008` | New episode | New episode (qualifier value) |

**ECL:** `<< 282032007 |Periods of life|`

---

## Pathological Process Attribute Values

Valid values for the Pathological process attribute (370135005):

| Concept ID | Preferred Term | FSN |
|------------|----------------|-----|
| `441862004` | Infectious process | Infectious process (qualifier value) |
| `263680009` | Autoimmune process | Autoimmune process (qualifier value) |
| `308490002` | Pathological developmental process | Pathological developmental process (qualifier value) |
| `472963003` | Hypersensitivity process | Hypersensitivity process (qualifier value) |
| `769247005` | Inflammatory process | Inflammatory process (qualifier value) |

**ECL:** `<< 441862004 |Infectious process|`

**Note:** This is NOT a qualifier - it describes the underlying pathological mechanism.

---

## Top-Level Hierarchy Concepts

These are the major branches of SNOMED CT:

| Concept ID | Name | Description |
|------------|------|-------------|
| `404684003` | Clinical finding | Observations, symptoms, signs |
| `64572001` | Disease | Disorders and diseases |
| `71388002` | Procedure | Medical procedures |
| `123037004` | Body structure | Anatomical structures |
| `105590001` | Substance | Drugs, chemicals |
| `362981000` | Qualifier value | Modifiers and qualifiers |
| `410607006` | Organism | Bacteria, viruses, etc. |
| `373873005` | Pharmaceutical product | Medications |
| `260787004` | Physical object | Medical devices |

---

## Lateralizable Body Structures

Body structures that can have laterality are determined by querying SNOMED MRCM.

### How Laterality Check Works

The concept extractor queries snomed-service's MRCM endpoint to determine if a body
structure can accept the Laterality attribute:

```python
# Query MRCM for attribute validity - NO hardcoded keyword lists
is_lateralizable = await snomed_client.is_valid_attribute(
    body_site_id, LATERALITY_ATTR_ID  # "272741003"
)
```

This approach:
- Uses actual SNOMED MRCM rules, not keyword matching
- Correctly handles all paired body structures in SNOMED
- Adapts automatically to SNOMED CT version updates

---

## IS_A Relationship

| Concept ID | Name |
|------------|------|
| `116680003` | Is a (attribute) |

The IS_A relationship defines the SNOMED CT hierarchy:

```
29857009 |Chest pain|
  IS_A → 22253000 |Pain|
    IS_A → 404684003 |Clinical finding|
      IS_A → 138875005 |SNOMED CT Concept|
```

---

## Reference: Concept ID Format

SNOMED CT concept IDs are:
- Numeric only (no letters)
- Variable length (typically 6-18 digits)
- Include a check digit (Verhoeff algorithm)

```
Format: NNNNNNNN[N...]
Example: 29857009, 404684003, 116680003

The last digit is a check digit.
```

---

## How to Look Up Concepts

### SNOMED CT Browser

- [Official Browser](https://browser.ihtsdotools.org/)
- Search by term or concept ID
- View hierarchy, relationships, descriptions

### snomed-service Endpoints

```bash
# Get concept details
GET /api/v1/concepts/{conceptId}

# Search by text
POST /api/v1/search
{"text": "chest pain", "top_k": 10}

# Get relationships
GET /api/v1/concepts/{conceptId}/relationships

# Get children
GET /api/v1/concepts/{conceptId}/children

# Get ancestors (for chronic disease check)
GET /api/v1/concepts/{conceptId}/ancestors

# Get MRCM valid attributes (for laterality check)
GET /api/v1/mrcm/attributes/{conceptId}

# Execute ECL
POST /api/v1/ecl/execute
{"ecl": "< 404684003"}
```
