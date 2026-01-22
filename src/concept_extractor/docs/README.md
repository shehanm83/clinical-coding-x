# Concept Extractor Documentation

This module extracts clinical concepts from text using SNOMED CT terminology via gRPC-based snomed-service with full ECL (Expression Constraint Language) support.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Components](#components)
4. [Key Features](#key-features)
5. [Data Flow](#data-flow)
6. [Configuration](#configuration)
7. [Quick Start](#quick-start)

---

## Overview

The Concept Extractor is a **zero-hallucination** clinical terminology service. It maps clinical text to SNOMED CT concepts using:

- **Text search** - Lexical matching via gRPC SearchService
- **ECL queries** - Expression Constraint Language for complex SNOMED queries
- **Synonym expansion** - Lay term to medical term mapping
- **Hierarchy traversal** - Parent/child/ancestor/descendant relationships
- **MRCM validation** - Attribute applicability checking

**NO LLM is used** - All operations are deterministic database queries.

### What's New: gRPC + ECL Support

| Feature | Description |
|---------|-------------|
| **gRPC Transport** | Fast binary protocol instead of HTTP/JSON |
| **ECL Execution** | Run complex SNOMED queries like `<< 73211009` |
| **Native Subsumption** | Check hierarchy without fetching all ancestors |
| **Batch Operations** | Get multiple concepts in one call |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ConceptExtractor                              │
│  (Main orchestrator - extractor.py)                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐  ┌──────────────────┐  ┌────────────────────────┐ │
│  │  Synonym    │  │  SnomedGrpc      │  │    MRCM Config         │ │
│  │  Lookup     │  │  Client          │  │    Provider            │ │
│  │             │  │                  │  │                        │ │
│  │ CSV-based   │  │ gRPC calls to    │  │ JSON-based attribute   │ │
│  │ lay→medical │  │ snomed-service   │  │ range validation       │ │
│  └──────┬──────┘  └────────┬─────────┘  └───────────┬────────────┘ │
│         │                  │                        │              │
└─────────┼──────────────────┼────────────────────────┼──────────────┘
          │                  │                        │
          ▼                  ▼                        │
   ┌────────────┐   ┌─────────────────────────┐      │
   │ synonyms.  │   │   snomed-service        │◄─────┘
   │ csv        │   │   (gRPC :50051)         │  (dynamic hierarchy checks)
   └────────────┘   │                         │
                    │  ├─ ConceptService      │
                    │  ├─ SearchService       │
                    │  ├─ EclService          │
                    │  └─ RefsetService       │
                    └─────────────────────────┘
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

# Execute ECL query
diabetes_types = await extractor.execute_ecl("<< 73211009")

# Check subsumption
is_diabetes = await extractor.is_descendant_of("44054006", "73211009")

# Get valid MRCM attributes
attributes = await extractor.get_valid_attributes(
    concept_id="29857009",
    semantic_tag="finding"
)
```

### 2. SnomedGrpcClient (`core/snomed_grpc_client.py`)

gRPC client for snomed-service. Provides:

| Method | Description |
|--------|-------------|
| `match_concepts()` | Text-based concept search |
| `get_concept()` | Get single concept by ID |
| `get_children()` | Direct children in hierarchy |
| `get_descendants()` | All descendants to depth N |
| `get_ancestors()` | All ancestors (IS_A traversal) |
| `get_parents()` | Direct parents (one level) |
| `get_relationships()` | Concept relationships |
| `execute_ecl()` | Execute ECL expression |
| `matches_ecl()` | Check if concept matches ECL |
| `is_descendant_of()` | Native subsumption check |

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

## Key Features

### ECL (Expression Constraint Language)

ECL enables powerful SNOMED queries:

```python
# Get all descendants of diabetes
await extractor.execute_ecl("<< 73211009")

# Get cardiac conditions (diseases with finding site = heart)
await extractor.execute_ecl("<< 64572001 : 363698007 = << 80891009")

# Check if concept matches ECL
await extractor.matches_ecl("44054006", "<< 73211009")  # True
```

### Common ECL Patterns

| Pattern | Meaning |
|---------|---------|
| `<< 73211009` | Descendants of diabetes (including self) |
| `< 73211009` | Descendants (excluding self) |
| `>> 73211009` | Ancestors (including self) |
| `> 73211009` | Ancestors (excluding self) |
| `A \| B` | Union (A OR B) |
| `A AND B` | Intersection |
| `A MINUS B` | Difference |

### Hierarchy Navigation

```python
# Get children
children = await extractor.get_children("73211009")

# Get all descendants
descendants = await extractor.get_descendants("73211009", depth=5)

# Get ancestors
ancestors = await extractor.get_ancestors("44054006")

# Check subsumption
is_child = await extractor.is_descendant_of("44054006", "73211009")
```

---

## Data Flow

### Concept Matching Flow

```
1. Input: "patient has shortness of breath"
                    │
                    ▼
2. Synonym Expansion (optional)
   "shortness of breath" → "Dyspnea"
   Expanded query: "...shortness of breath, Dyspnea"
                    │
                    ▼
3. gRPC Search Request
   SearchService.Search(query, limit, active_only)
                    │
                    ▼
4. Parse Response
   - Extract concept IDs, terms, FSNs
   - Parse semantic tag from FSN
   - Build ConceptMatch objects
                    │
                    ▼
5. Return MatchResult
   [ConceptMatch(concept_id="267036007", term="Dyspnea", ...)]
```

### ECL Execution Flow

```
1. Input: ecl="<< 73211009"
                    │
                    ▼
2. gRPC ECL Request
   EclService.ExecuteEcl(ecl, limit, include_details)
                    │
                    ▼
3. snomed-service parses ECL,
   traverses SNOMED hierarchy
                    │
                    ▼
4. Return SnomedConcept[]
   [SnomedConcept(id="44054006", term="Type 2 DM"), ...]
```

---

## Configuration

### Environment Variables

```bash
# gRPC Service (Primary)
SNOMED_GRPC_ADDRESS=localhost:50051
SNOMED_GRPC_TIMEOUT=30.0

# HTTP API (Legacy fallback)
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
from concept_extractor import ConceptExtractor, SnomedGrpcConfig

# Custom gRPC config
config = SnomedGrpcConfig(
    grpc_address="snomed-server:50051",
    timeout=60.0
)

# Use gRPC (default)
extractor = ConceptExtractor(grpc_config=config)

# Fall back to HTTP if needed
extractor_http = ConceptExtractor(use_grpc=False)
```

---

## Quick Start

```python
import asyncio
from concept_extractor import ConceptExtractor

async def main():
    # Initialize extractor
    extractor = ConceptExtractor()

    # 1. Match clinical text
    result = await extractor.match_concepts("severe chest pain")
    for match in result.matches:
        print(f"{match.term} ({match.concept_id})")

    # 2. Execute ECL query
    cardiac_conditions = await extractor.execute_ecl(
        "<< 64572001 : 363698007 = << 80891009"
    )
    print(f"Found {len(cardiac_conditions)} cardiac conditions")

    # 3. Check subsumption
    is_finding = await extractor.matches_ecl(
        "29857009",       # Chest pain
        "<< 404684003"    # Clinical finding
    )
    print(f"Chest pain is a clinical finding: {is_finding}")

    # 4. Get MRCM attributes
    attrs = await extractor.get_valid_attributes(
        concept_id="29857009",
        semantic_tag="finding"
    )
    for attr in attrs:
        print(f"Applicable: {attr.name}")

    await extractor.close()

asyncio.run(main())
```

---

## See Also

- [INTEGRATION_PLAN.md](INTEGRATION_PLAN.md) - Comprehensive integration documentation
- [SNOMED_CT.md](SNOMED_CT.md) - SNOMED CT terminology basics
- [MRCM.md](MRCM.md) - Machine Readable Concept Model
- [WELL_KNOWN_CONCEPTS.md](WELL_KNOWN_CONCEPTS.md) - Fixed concept IDs used
