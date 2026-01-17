# Concept Extractor Documentation

This module extracts clinical concepts from text using SNOMED CT terminology via the snomed-service service.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Components](#components)
4. [Data Flow](#data-flow)
5. [Configuration](#configuration)

---

## Overview

The Concept Extractor is a **zero-hallucination** clinical terminology service. It maps clinical text to SNOMED CT concepts using:

- **Vector similarity search** - Semantic matching via embeddings
- **Synonym expansion** - Lay term to medical term mapping
- **Hierarchy traversal** - Parent/child/ancestor relationships
- **MRCM validation** - Attribute applicability checking

**NO LLM is used** - All operations are deterministic database queries or vector similarity searches.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     ConceptExtractor                            │
│  (Main orchestrator - extractor.py)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  Synonym    │  │   SNOMED    │  │      MRCM Config        │ │
│  │  Lookup     │  │   Client    │  │      Provider           │ │
│  │             │  │             │  │                         │ │
│  │ CSV-based   │  │ HTTP calls  │  │ JSON-based attribute    │ │
│  │ lay→medical │  │ to snomed-service   │  │ range validation        │ │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │
│         │                │                     │               │
└─────────┼────────────────┼─────────────────────┼───────────────┘
          │                │                     │
          ▼                ▼                     │
   ┌────────────┐   ┌────────────┐              │
   │ synonyms.  │   │  snomed-service    │◄─────────────┘
   │ csv        │   │  (HTTP)    │  (dynamic hierarchy checks)
   └────────────┘   └────────────┘
```

---

## Components

### 1. ConceptExtractor (`extractor.py`)

The main orchestrator that coordinates all sub-components.

```python
from concept_extractor import ConceptExtractor

extractor = ConceptExtractor()

# Match clinical text to SNOMED concepts
result = await extractor.match_concepts("chest pain")
for match in result.matches:
    print(f"{match.term} ({match.concept_id}) - {match.similarity:.2f}")

# Get concept hierarchy
children = await extractor.get_children("29857009")  # Chest pain

# Get valid MRCM attributes for a concept
attributes = await extractor.get_valid_attributes(
    concept_id="29857009",
    semantic_tag="finding",
    concept_term="Chest pain"
)
```

### 2. SnomedClient (`core/snomed_client.py`)

Async HTTP client for snomed-service. Provides:

| Method | Description |
|--------|-------------|
| `match_concepts()` | Vector similarity search |
| `get_children()` | Direct children in hierarchy |
| `get_descendants()` | All descendants to depth N |
| `get_ancestors()` | All ancestors (IS_A traversal) |
| `get_relationships()` | Concept relationships |

### 3. SynonymLookup (`core/synonyms.py`)

Maps lay/consumer terms to SNOMED preferred terms.

```
CSV Format:
Lay_Term,SNOMED_Preferred
shortness of breath,Dyspnea
the runs,Diarrhea
heart attack,Myocardial infarction
```

### 4. MrcmConfigProvider (`core/mrcm.py`)

Provides MRCM attribute validation. See [MRCM.md](MRCM.md) for details.

---

## Data Flow

### Concept Matching Flow

```
1. Input: "patient has shortness of breath"
                    │
                    ▼
2. Synonym Expansion (optional)
   "shortness of breath" → "Dyspnea"
   Expanded query: "patient has shortness of breath, Dyspnea"
                    │
                    ▼
3. snomed-service Vector Search
   POST /api/v1/search
   {
     "text": "patient has shortness of breath, Dyspnea",
     "top_k": 10
   }
                    │
                    ▼
4. Parse Response
   - Extract concept IDs, terms, FSNs
   - Calculate similarity scores
   - Determine match type (exact/lexical/vector)
                    │
                    ▼
5. Return MatchResult
   [
     ConceptMatch(concept_id="267036007", term="Dyspnea", similarity=0.95),
     ConceptMatch(concept_id="230145002", term="Difficulty breathing", similarity=0.82),
     ...
   ]
```

### MRCM Attribute Flow

```
1. Input: concept_id="29857009" (Chest pain)
                    │
                    ▼
2. Get concept's existing relationships
   → Skip attributes already defined
                    │
                    ▼
3. Check Finding site relationship
   → If lateralizable body structure, include Laterality attribute
                    │
                    ▼
4. Check if chronic disease
   → If chronic, exclude Clinical course attribute
                    │
                    ▼
5. Return applicable attributes
   [
     AttributeDefinition(id="246112005", name="Severity"),
     AttributeDefinition(id="272741003", name="Laterality"),
   ]
```

---

## Configuration

### Environment Variables

```bash
# SNOMED API (snomed-service)
SNOMED_API_BASE_URL=http://localhost:8010
SNOMED_API_TIMEOUT=30.0
```

### Config Files

| File | Description |
|------|-------------|
| `config/synonyms.csv` | Lay term → SNOMED term mappings |
| `config/mrcm-ranges.json` | MRCM attribute ranges |

### Programmatic Configuration

```python
from concept_extractor.core.config import SnomedApiConfig

config = SnomedApiConfig(
    base_url="http://custom-api:8010",
    timeout=60.0
)

extractor = ConceptExtractor(snomed_config=config)
```

---

## See Also

- [SNOMED_CT.md](SNOMED_CT.md) - SNOMED CT terminology basics
- [MRCM.md](MRCM.md) - Machine Readable Concept Model
- [WELL_KNOWN_CONCEPTS.md](WELL_KNOWN_CONCEPTS.md) - Fixed concept IDs used
