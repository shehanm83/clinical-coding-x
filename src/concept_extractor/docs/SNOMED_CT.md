# SNOMED CT Overview

SNOMED CT (Systematized Nomenclature of Medicine - Clinical Terms) is the most comprehensive clinical terminology system in the world.

## Key Concepts

### 1. Concept

A **concept** is a unique clinical meaning with a numeric identifier.

```
Concept ID: 29857009
Preferred Term: Chest pain
FSN: Chest pain (finding)
Semantic Tag: finding
```

**Example concepts:**
| Concept ID | Preferred Term | Semantic Tag |
|------------|----------------|--------------|
| 29857009 | Chest pain | finding |
| 73211009 | Diabetes mellitus | disorder |
| 80891009 | Heart disease | disorder |
| 39937001 | Skin structure | body structure |
| 387517004 | Paracetamol | substance |

### 2. Fully Specified Name (FSN)

The **FSN** is a unique, unambiguous description that includes a **semantic tag**.

```
Format: "Term (semantic tag)"

Examples:
- "Chest pain (finding)"
- "Diabetes mellitus (disorder)"
- "Left arm (body structure)"
- "Aspirin (substance)"
```

### 3. Semantic Tags

Semantic tags categorize concepts into high-level domains:

| Semantic Tag | Description | Example |
|--------------|-------------|---------|
| `finding` | Clinical observations | Chest pain, Fever |
| `disorder` | Diseases/conditions | Diabetes, Hypertension |
| `procedure` | Medical procedures | Blood test, Surgery |
| `body structure` | Anatomical locations | Heart, Left arm |
| `substance` | Drugs, chemicals | Aspirin, Insulin |
| `qualifier value` | Modifiers | Mild, Severe, Left |
| `organism` | Pathogens | E. coli, Virus |

### 4. Relationships

Concepts are linked by **relationships**:

```
┌─────────────────┐
│  Chest pain     │
│  (29857009)     │
└────────┬────────┘
         │
         │ IS_A (116680003)
         ▼
┌─────────────────┐
│  Pain           │
│  (22253000)     │
└────────┬────────┘
         │
         │ IS_A
         ▼
┌─────────────────┐
│  Clinical       │
│  finding        │
│  (404684003)    │
└─────────────────┘
```

**Common relationship types:**

| Type ID | Type Name | Description |
|---------|-----------|-------------|
| 116680003 | IS_A | Hierarchical parent |
| 363698007 | Finding site | Body location |
| 246112005 | Severity | Mild/Moderate/Severe |
| 272741003 | Laterality | Left/Right/Bilateral |
| 263502005 | Clinical course | Acute/Chronic |

### 5. Hierarchy

SNOMED CT has a **polyhierarchical** structure - concepts can have multiple parents.

```
                    ┌─────────────────┐
                    │  Clinical       │
                    │  finding        │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
       ┌──────────┐   ┌──────────┐   ┌──────────┐
       │  Pain    │   │  Fever   │   │  Symptom │
       └────┬─────┘   └──────────┘   └──────────┘
            │
     ┌──────┴──────┐
     │             │
     ▼             ▼
┌─────────┐  ┌──────────┐
│ Chest   │  │ Abdominal│
│ pain    │  │ pain     │
└─────────┘  └──────────┘
```

---

## SNOMED CT in This System

### Vector Search

The snomed-service provides **vector similarity search**:

```python
# Input: Clinical text
result = await client.match_concepts("crushing chest pain radiating to arm")

# Output: Ranked SNOMED concepts
# 1. Acute myocardial infarction (0.92 similarity)
# 2. Chest pain (0.85 similarity)
# 3. Angina pectoris (0.78 similarity)
```

### Hierarchy Traversal

```python
# Get children of "Pain" concept
children = await client.get_children("22253000")
# Returns: Chest pain, Abdominal pain, Headache, etc.

# Get all ancestors (for "is-a" checking)
ancestors = await client.get_ancestors("29857009")  # Chest pain
# Returns: Pain, Clinical finding, SNOMED CT Concept
```

### Relationship Queries

```python
# Get relationships for a concept
rels = await client.get_relationships("29857009")
# Returns:
# - IS_A → Pain
# - IS_A → Thoracic symptom
# - Finding site → Chest wall structure
```

---

## Important SNOMED CT Domains

### Clinical Findings (< 404684003)

Observable clinical states - symptoms, signs, test results.

```
404684003 Clinical finding
├── 22253000 Pain
│   ├── 29857009 Chest pain
│   └── 21522001 Abdominal pain
├── 386661006 Fever
└── 267036007 Dyspnea
```

### Disorders (< 64572001)

Diseases and pathological conditions.

```
64572001 Disease
├── 73211009 Diabetes mellitus
├── 38341003 Hypertension
└── 13645005 COPD
```

### Body Structures (< 123037004)

Anatomical locations.

```
123037004 Body structure
├── 80891009 Heart
├── 39937001 Skin
└── 40983000 Upper arm structure
    ├── 368208006 Left upper arm
    └── 368209003 Right upper arm
```

### Qualifier Values (< 362981000)

Modifiers for other concepts.

```
362981000 Qualifier value
├── 255604002 Mild
├── 6736007 Moderate
├── 24484000 Severe
├── 7771000 Left
└── 24028007 Right
```

---

## Expression Constraint Language (ECL)

ECL is a query language for SNOMED CT:

```
# All descendants of Clinical finding
< 404684003

# All ancestors of Chest pain
> 29857009

# Concepts with Finding site = Heart
* : 363698007 = 80891009

# All disorders that are chronic
< 64572001 : 263502005 = 90734009
```

The snomed-service supports ECL queries via `/api/v1/ecl/execute`.

---

## References

- [SNOMED International](https://www.snomed.org/)
- [SNOMED CT Browser](https://browser.ihtsdotools.org/)
- [ECL Specification](https://confluence.ihtsdotools.org/display/DOCECL)
