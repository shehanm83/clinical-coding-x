# Concept Extractor Integration Plan

## SNOMED gRPC Service Integration with ECL Support

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Original System (HTTP-based)](#2-original-system-http-based)
3. [New System (gRPC with ECL)](#3-new-system-grpc-with-ecl)
4. [Architecture Comparison](#4-architecture-comparison)
5. [How ECL Changes Everything](#5-how-ecl-changes-everything)
6. [Complete API Reference](#6-complete-api-reference)
7. [Data Flow Diagrams](#7-data-flow-diagrams)
8. [Usage Examples](#8-usage-examples)
9. [Configuration](#9-configuration)
10. [Migration Guide](#10-migration-guide)

---

## 1. Executive Summary

### What Changed

| Aspect | Original (HTTP) | New (gRPC + ECL) |
|--------|-----------------|------------------|
| **Transport** | HTTP/REST | gRPC (Protocol Buffers) |
| **Search** | Vector similarity only | Text search + ECL queries |
| **Hierarchy** | Limited (single API calls) | Full traversal (ECL-powered) |
| **Subsumption** | Manual ancestor lookup | Native `IsSubsumedBy` call |
| **Performance** | Higher latency | Lower latency, streaming |
| **ECL Support** | Fallback only | First-class citizen |

### Key Benefits

1. **ECL-Powered Queries**: Execute complex SNOMED queries like `<< 404684003 : 363698007 = << 39057004`
2. **Fast Hierarchy Traversal**: Get all descendants/ancestors in a single call
3. **Native Subsumption**: Check "is-a" relationships without fetching entire ancestor tree
4. **Better Performance**: gRPC binary protocol vs HTTP JSON
5. **Richer API**: Access to refsets, OWL expressions, concept batching

---

## 2. Original System (HTTP-based)

### How It Worked

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Original Architecture                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Clinical Text ──► Synonym Expansion ──► Vector Search ──► Results │
│                          (CSV)              (HTTP)                  │
│                                                                     │
│   "chest pain"  ──► "chest pain"     ──► POST /api/v1/search       │
│                                              ↓                      │
│                                        JSON Response                │
│                                              ↓                      │
│                                        ConceptMatch[]               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Original Flow

1. **Input**: Clinical text (e.g., "patient has shortness of breath")
2. **Synonym Expansion**: CSV lookup expands lay terms
   - "shortness of breath" → appends "Dyspnea"
3. **HTTP Request**: `POST /api/v1/search` with expanded text
4. **Vector Search**: snomed-service performs embedding-based similarity
5. **Response**: JSON with matched concepts + confidence scores

### Limitations

- **No ECL**: Could not execute SNOMED Expression Constraint Language
- **Slow Hierarchy**: Each parent/child lookup was a separate HTTP call
- **No Subsumption**: To check "is A a descendant of B", had to fetch all ancestors
- **Limited Queries**: Only text-based search, no constraint-based filtering

### Original API Endpoints

```
POST /api/v1/search              → Vector similarity search
GET  /api/v1/concepts/{id}/children     → Direct children
GET  /api/v1/concepts/{id}/descendants  → Descendants (limited)
GET  /api/v1/concepts/{id}/ancestors    → All ancestors
GET  /api/v1/concepts/{id}/relationships → Concept relationships
GET  /api/v1/mrcm/attributes/{id}       → MRCM validation
POST /api/v1/ecl/execute         → ECL (fallback, limited)
```

---

## 3. New System (gRPC with ECL)

### How It Works Now

```
┌─────────────────────────────────────────────────────────────────────┐
│                         New Architecture                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌──────────────────────────────────────────────────────────────┐ │
│   │                    ConceptExtractor                           │ │
│   │  ┌────────────┐  ┌─────────────────┐  ┌──────────────────┐   │ │
│   │  │  Synonym   │  │ SnomedGrpcClient │  │ MrcmConfigProvider│   │ │
│   │  │  Lookup    │  │                 │  │                  │   │ │
│   │  └────────────┘  └────────┬────────┘  └────────┬─────────┘   │ │
│   └───────────────────────────┼─────────────────────┼────────────┘ │
│                               │                     │              │
│                               ▼                     │              │
│   ┌──────────────────────────────────────────────────────────────┐ │
│   │              SNOMED gRPC Service (localhost:50051)            │ │
│   │  ┌────────────┐ ┌────────────┐ ┌──────────┐ ┌─────────────┐  │ │
│   │  │ Concept    │ │  Search    │ │   ECL    │ │   Refset    │  │ │
│   │  │ Service    │ │  Service   │ │  Service │ │   Service   │  │ │
│   │  └────────────┘ └────────────┘ └──────────┘ └─────────────┘  │ │
│   └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### gRPC Services Available

| Service | Methods | Purpose |
|---------|---------|---------|
| **ConceptService** | GetConcept, GetParents, GetChildren, GetRelationships, GetConceptsBatch | Core concept operations |
| **SearchService** | Search | Text-based concept search |
| **EclService** | ExecuteEcl, MatchesEcl, IsSubsumedBy, GetDescendants, GetAncestors, GetDirectParents, GetDirectChildren, ExplainEcl | ECL execution & hierarchy |
| **RefsetService** | GetRefsetMembers, GetRefsetsForConcept | Reference set queries |

### New Capabilities

1. **ECL Execution**: Run any valid ECL expression
2. **Fast Subsumption**: Single call to check hierarchy relationships
3. **Batch Operations**: Get multiple concepts in one request
4. **Query Explanation**: Debug ECL queries with ExplainEcl
5. **Streaming**: Potential for large result set streaming

---

## 4. Architecture Comparison

### Side-by-Side

```
┌─────────────────────────────┐     ┌─────────────────────────────┐
│      ORIGINAL (HTTP)        │     │       NEW (gRPC)            │
├─────────────────────────────┤     ├─────────────────────────────┤
│                             │     │                             │
│  ConceptExtractor           │     │  ConceptExtractor           │
│       │                     │     │       │                     │
│       ▼                     │     │       ▼                     │
│  SnomedClient (HTTP)        │     │  SnomedGrpcClient           │
│       │                     │     │       │                     │
│       ▼                     │     │       ▼                     │
│  httpx.AsyncClient          │     │  grpc.Channel               │
│       │                     │     │       │                     │
│       ▼                     │     │       ├─► ConceptServiceStub│
│  HTTP/1.1 + JSON            │     │       ├─► SearchServiceStub │
│       │                     │     │       ├─► EclServiceStub    │
│       ▼                     │     │       └─► RefsetServiceStub │
│  snomed-service:8010        │     │       │                     │
│                             │     │       ▼                     │
│                             │     │  snomed-service:50051       │
│                             │     │  (gRPC + Protocol Buffers)  │
└─────────────────────────────┘     └─────────────────────────────┘
```

### Transport Comparison

| Feature | HTTP (httpx) | gRPC |
|---------|--------------|------|
| Serialization | JSON | Protocol Buffers (binary) |
| Connection | New per request (with pooling) | Persistent multiplexed |
| Streaming | Limited | Full bidirectional |
| Type Safety | Runtime | Compile-time (proto) |
| Message Size | Larger | ~30% smaller |
| Latency | Higher | Lower |

---

## 5. How ECL Changes Everything

### What is ECL?

**ECL (Expression Constraint Language)** is SNOMED CT's query language for defining sets of concepts based on:
- Hierarchy relationships (descendants, ancestors)
- Attribute constraints (finding site, laterality)
- Logical operators (AND, OR, NOT)

### ECL Syntax Quick Reference

| Expression | Meaning | Example |
|------------|---------|---------|
| `<< 73211009` | Descendants of diabetes | All types of diabetes |
| `< 73211009` | Descendants (excluding self) | Types of diabetes, not diabetes itself |
| `>> 73211009` | Ancestors of diabetes | Higher-level concepts |
| `> 73211009` | Ancestors (excluding self) | Ancestors, not diabetes itself |
| `73211009 \| 386661006` | Union | Diabetes OR fever |
| `<< 404684003 AND << 64572001` | Intersection | Clinical findings that are diseases |
| `<< 404684003 MINUS << 64572001` | Difference | Findings that are NOT diseases |

### Advanced ECL with Attributes

```
# Disorders of the heart
<< 64572001 : 363698007 = << 80891009

# Meaning:
# << 64572001          = descendants of "Disease"
# : 363698007          = with "Finding site" attribute
# = << 80891009        = equal to descendants of "Heart structure"

# Bilateral conditions
<< 404684003 : 272741003 = 51440002
# Finding with laterality = bilateral
```

### Why ECL Matters for Concept Extraction

#### Before (Without ECL)

To check if "Type 2 diabetes mellitus" (44054006) is a type of diabetes:
```python
# Had to fetch ALL ancestors and check manually
ancestors = await client.get_ancestors("44054006")  # Multiple HTTP calls
is_diabetes = "73211009" in ancestors  # Manual check
```

#### After (With ECL)

```python
# Single gRPC call with native subsumption check
is_diabetes = await extractor.is_descendant_of("44054006", "73211009")

# Or use ECL directly
is_diabetes = await extractor.matches_ecl("44054006", "<< 73211009")

# Get ALL types of diabetes in one call
all_diabetes = await extractor.execute_ecl("<< 73211009", limit=1000)
```

### ECL Use Cases in Clinical Coding

| Use Case | ECL Expression |
|----------|----------------|
| All clinical findings | `<< 404684003` |
| All disorders | `<< 64572001` |
| Cardiac conditions | `<< 64572001 : 363698007 = << 80891009` |
| Bilateral conditions | `<< 404684003 : 272741003 = 51440002` |
| Chronic diseases | `<< 27624003` |
| Infectious diseases | `<< 40733004` |
| Procedures on heart | `<< 71388002 : 363704007 = << 80891009` |

---

## 6. Complete API Reference

### ConceptExtractor Methods

#### Core Methods (Both HTTP & gRPC)

```python
class ConceptExtractor:
    # Text matching
    async def match_concepts(
        text: str,
        limit: int = 10,
        domain: str | None = None,
        min_similarity: float = 0.0,
        expand_synonyms: bool = True,
    ) -> MatchResult

    # Hierarchy traversal
    async def get_children(concept_id: str) -> HierarchyResult
    async def get_descendants(concept_id: str, depth: int = 1) -> HierarchyResult
    async def get_ancestors(concept_id: str) -> set[str]

    # Relationships
    async def get_relationships(
        concept_id: str,
        exclude_is_a: bool = False
    ) -> RelationshipResult

    # MRCM attributes
    async def get_valid_attributes(
        concept_id: str,
        semantic_tag: str | None = None,
        concept_term: str | None = None,
    ) -> list[AttributeDefinition]

    def get_attribute_range(attribute_id: str) -> list[AttributeValue]

    # Synonyms
    def get_synonym_expansions(text: str) -> list[tuple[str, str]]
```

#### Enhanced Methods (gRPC Only)

```python
class ConceptExtractor:
    # Direct concept lookup
    async def get_concept(concept_id: str) -> SnomedConcept | None

    # Direct parents (one level up)
    async def get_parents(concept_id: str) -> list[SnomedConcept]

    # Subsumption check
    async def is_descendant_of(
        concept_id: str,
        ancestor_id: str
    ) -> bool

    # ECL execution
    async def execute_ecl(
        ecl: str,
        limit: int = 100,
        include_details: bool = True,
    ) -> list[SnomedConcept]

    # ECL matching
    async def matches_ecl(
        concept_id: str,
        ecl: str
    ) -> bool
```

### Data Models

```python
@dataclass
class SnomedConcept:
    concept_id: str
    term: str
    fsn: str = ""
    semantic_tag: str = ""
    active: bool = True

@dataclass
class ConceptMatch:
    concept_id: str
    term: str
    similarity: float
    fsn: str = ""
    semantic_tag: str = ""
    semantic_score: float = 0.0
    lexical_score: float = 0.0
    lexical_match: str = "none"  # 'exact', 'partial', 'none'
    match_type: str = "vector"   # 'vector', 'exact', 'fuzzy'
    state: str = "primary"

@dataclass
class HierarchyResult:
    concept_id: str
    concepts: list[SnomedConcept]
    total_count: int
    processing_time_ms: int

@dataclass
class MatchResult:
    query: str
    matches: list[ConceptMatch]
    processing_time_ms: int
```

---

## 7. Data Flow Diagrams

### Text Matching Flow

```
┌────────────────────────────────────────────────────────────────────┐
│                        match_concepts() Flow                        │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Input: "patient reports chest pain and SOB"                       │
│                         │                                          │
│                         ▼                                          │
│  ┌─────────────────────────────────────┐                          │
│  │      1. Synonym Expansion           │                          │
│  │   "SOB" → "Dyspnea"                 │                          │
│  │   Expanded: "...chest pain and SOB, │                          │
│  │             Dyspnea"                │                          │
│  └─────────────────┬───────────────────┘                          │
│                    │                                               │
│                    ▼                                               │
│  ┌─────────────────────────────────────┐                          │
│  │      2. gRPC Search Request         │                          │
│  │   SearchService.Search()            │                          │
│  │   query: expanded text              │                          │
│  │   limit: 10                         │                          │
│  │   active_only: true                 │                          │
│  └─────────────────┬───────────────────┘                          │
│                    │                                               │
│                    ▼                                               │
│  ┌─────────────────────────────────────┐                          │
│  │      3. Parse Response              │                          │
│  │   - Extract concept ID, term, FSN   │                          │
│  │   - Parse semantic tag from FSN     │                          │
│  │   - Apply domain filter if set      │                          │
│  │   - Build ConceptMatch objects      │                          │
│  └─────────────────┬───────────────────┘                          │
│                    │                                               │
│                    ▼                                               │
│  ┌─────────────────────────────────────┐                          │
│  │      4. Return MatchResult          │                          │
│  │   [                                 │                          │
│  │     ConceptMatch(                   │                          │
│  │       concept_id="29857009",        │                          │
│  │       term="Chest pain",            │                          │
│  │       similarity=0.9                │                          │
│  │     ),                              │                          │
│  │     ConceptMatch(                   │                          │
│  │       concept_id="267036007",       │                          │
│  │       term="Dyspnea",               │                          │
│  │       similarity=0.9                │                          │
│  │     ),                              │                          │
│  │     ...                             │                          │
│  │   ]                                 │                          │
│  └─────────────────────────────────────┘                          │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### ECL Execution Flow

```
┌────────────────────────────────────────────────────────────────────┐
│                        execute_ecl() Flow                           │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Input: ecl="<< 73211009", limit=100                               │
│                         │                                          │
│                         ▼                                          │
│  ┌─────────────────────────────────────┐                          │
│  │      1. Build ECL Request           │                          │
│  │   ExecuteEclRequest {               │                          │
│  │     ecl: "<< 73211009",             │                          │
│  │     limit: 100,                     │                          │
│  │     include_details: true           │                          │
│  │   }                                 │                          │
│  └─────────────────┬───────────────────┘                          │
│                    │                                               │
│                    ▼                                               │
│  ┌─────────────────────────────────────┐                          │
│  │      2. gRPC Call                   │                          │
│  │   EclService.ExecuteEcl()           │                          │
│  │                                     │                          │
│  │   snomed-service parses ECL,        │                          │
│  │   traverses IS_A hierarchy,         │                          │
│  │   returns matching concepts         │                          │
│  └─────────────────┬───────────────────┘                          │
│                    │                                               │
│                    ▼                                               │
│  ┌─────────────────────────────────────┐                          │
│  │      3. Parse Response              │                          │
│  │   ExecuteEclResponse {              │                          │
│  │     concepts: [...],                │                          │
│  │     total_count: 342,               │                          │
│  │     execution_time_ms: 45,          │                          │
│  │     truncated: true                 │                          │
│  │   }                                 │                          │
│  └─────────────────┬───────────────────┘                          │
│                    │                                               │
│                    ▼                                               │
│  ┌─────────────────────────────────────┐                          │
│  │      4. Return SnomedConcept[]      │                          │
│  │   [                                 │                          │
│  │     SnomedConcept(                  │                          │
│  │       concept_id="44054006",        │                          │
│  │       term="Type 2 diabetes",       │                          │
│  │       semantic_tag="disorder"       │                          │
│  │     ),                              │                          │
│  │     SnomedConcept(...),             │                          │
│  │     ... (100 concepts)              │                          │
│  │   ]                                 │                          │
│  └─────────────────────────────────────┘                          │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Hierarchy Navigation Flow

```
┌────────────────────────────────────────────────────────────────────┐
│                     Hierarchy Operations                            │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│                        SNOMED CT Hierarchy                         │
│                                                                    │
│                     ┌───────────────────┐                          │
│                     │   404684003       │                          │
│                     │ Clinical finding  │ ◄── get_ancestors()      │
│                     └─────────┬─────────┘                          │
│                               │                                    │
│                     ┌─────────┴─────────┐                          │
│                     │    64572001       │                          │
│                     │     Disease       │                          │
│                     └─────────┬─────────┘                          │
│                               │                                    │
│           ┌───────────────────┼───────────────────┐                │
│           │                   │                   │                │
│   ┌───────┴───────┐   ┌───────┴───────┐   ┌───────┴───────┐       │
│   │  73211009     │   │  386661006    │   │  40733004     │       │
│   │  Diabetes     │   │    Fever      │   │  Infection    │       │
│   └───────┬───────┘   └───────────────┘   └───────────────┘       │
│           │                                                        │
│   ┌───────┴───────┐  ◄── get_children() / get_descendants()       │
│   │               │                                                │
│   │  44054006     │   ┌───────────────┐                           │
│   │  Type 2 DM    │   │  46635009     │                           │
│   │               │   │  Type 1 DM    │                           │
│   └───────────────┘   └───────────────┘                           │
│                                                                    │
│   ┌─────────────────────────────────────────────────────────────┐ │
│   │  is_descendant_of("44054006", "73211009") → true            │ │
│   │  matches_ecl("44054006", "<< 73211009") → true              │ │
│   │  execute_ecl("<< 73211009") → [44054006, 46635009, ...]     │ │
│   └─────────────────────────────────────────────────────────────┘ │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 8. Usage Examples

### Basic Text Matching

```python
from concept_extractor import ConceptExtractor

async def main():
    # Initialize (gRPC by default)
    extractor = ConceptExtractor()

    # Match clinical text
    result = await extractor.match_concepts(
        text="patient presents with severe chest pain",
        limit=5,
        expand_synonyms=True
    )

    for match in result.matches:
        print(f"{match.term} ({match.concept_id})")
        print(f"  Semantic tag: {match.semantic_tag}")
        print(f"  Similarity: {match.similarity:.2f}")

    await extractor.close()
```

### ECL Queries

```python
async def ecl_examples():
    extractor = ConceptExtractor()

    # Get all types of diabetes
    diabetes_types = await extractor.execute_ecl(
        ecl="<< 73211009",  # Descendants of diabetes
        limit=100
    )
    print(f"Found {len(diabetes_types)} types of diabetes")

    # Check if a concept is a type of diabetes
    is_diabetes = await extractor.matches_ecl(
        concept_id="44054006",  # Type 2 DM
        ecl="<< 73211009"       # Descendants of diabetes
    )
    print(f"Type 2 DM is diabetes: {is_diabetes}")

    # Get cardiac conditions
    cardiac = await extractor.execute_ecl(
        ecl="<< 64572001 : 363698007 = << 80891009",
        # Diseases with finding site = heart structure
        limit=50
    )

    await extractor.close()
```

### Hierarchy Navigation

```python
async def hierarchy_examples():
    extractor = ConceptExtractor()

    # Get direct children
    children = await extractor.get_children("73211009")
    print(f"Direct children of diabetes: {len(children.concepts)}")

    # Get all descendants
    descendants = await extractor.get_descendants(
        concept_id="73211009",
        depth=3
    )
    print(f"Descendants (depth 3): {descendants.total_count}")

    # Get all ancestors
    ancestors = await extractor.get_ancestors("44054006")
    print(f"Ancestors of Type 2 DM: {ancestors}")

    # Check subsumption directly
    is_child = await extractor.is_descendant_of(
        concept_id="44054006",   # Type 2 DM
        ancestor_id="73211009"   # Diabetes
    )
    print(f"Type 2 DM is descendant of Diabetes: {is_child}")

    await extractor.close()
```

### MRCM Attribute Validation

```python
async def mrcm_examples():
    extractor = ConceptExtractor()

    # Get valid attributes for a concept
    attributes = await extractor.get_valid_attributes(
        concept_id="29857009",      # Chest pain
        semantic_tag="finding",
        concept_term="Chest pain"
    )

    for attr in attributes:
        print(f"Attribute: {attr.name} ({attr.id})")

        # Get valid values for this attribute
        values = extractor.get_attribute_range(attr.id)
        for val in values[:3]:
            print(f"  - {val.term}")

    await extractor.close()
```

### Complete Clinical Coding Flow

```python
async def clinical_coding_flow():
    """
    Complete flow: Extract concepts from clinical text,
    validate against SNOMED hierarchy, and determine
    applicable qualifiers.
    """
    extractor = ConceptExtractor()

    clinical_text = """
    Patient is a 55-year-old male presenting with
    severe chest pain radiating to left arm,
    associated with shortness of breath.
    """

    # Step 1: Extract primary concepts
    result = await extractor.match_concepts(clinical_text, limit=10)

    for match in result.matches:
        print(f"\n=== {match.term} ({match.concept_id}) ===")
        print(f"Semantic tag: {match.semantic_tag}")

        # Step 2: Check if it's a clinical finding
        is_finding = await extractor.matches_ecl(
            match.concept_id,
            "<< 404684003"  # Clinical finding hierarchy
        )

        if is_finding:
            # Step 3: Get applicable MRCM attributes
            attrs = await extractor.get_valid_attributes(
                concept_id=match.concept_id,
                semantic_tag=match.semantic_tag,
                concept_term=match.term
            )

            if attrs:
                print("Applicable qualifiers:")
                for attr in attrs:
                    print(f"  - {attr.name}")

            # Step 4: Check for specific conditions
            is_cardiac = await extractor.matches_ecl(
                match.concept_id,
                "<< 64572001 : 363698007 = << 80891009"
            )
            if is_cardiac:
                print("  [CARDIAC CONDITION]")

    await extractor.close()
```

---

## 9. Configuration

### Environment Variables

```bash
# .env file

# gRPC Service (Primary - New)
SNOMED_GRPC_ADDRESS=localhost:50051
SNOMED_GRPC_TIMEOUT=30.0

# HTTP API (Legacy - Fallback)
SNOMED_API_BASE_URL=http://localhost:8010
SNOMED_API_TIMEOUT=30.0
```

### Programmatic Configuration

```python
from concept_extractor import ConceptExtractor, SnomedGrpcConfig

# Custom gRPC config
config = SnomedGrpcConfig(
    grpc_address="snomed-server.example.com:50051",
    timeout=60.0
)

# Use gRPC (default)
extractor = ConceptExtractor(grpc_config=config)

# Or fall back to HTTP
extractor_http = ConceptExtractor(use_grpc=False)
```

### Config Files

| File | Purpose |
|------|---------|
| `config/synonyms.csv` | Lay term → SNOMED term mappings |
| `config/mrcm-ranges.json` | MRCM attribute definitions & value ranges |

---

## 10. Migration Guide

### From HTTP to gRPC

The migration is seamless - the `ConceptExtractor` API remains the same:

```python
# Before (HTTP - still works)
extractor = ConceptExtractor(use_grpc=False)

# After (gRPC - default)
extractor = ConceptExtractor()  # use_grpc=True by default
```

### New Methods Available with gRPC

```python
# These methods are only available with gRPC:

# Direct concept lookup
concept = await extractor.get_concept("73211009")

# Direct parents
parents = await extractor.get_parents("44054006")

# ECL execution
concepts = await extractor.execute_ecl("<< 73211009")

# ECL matching
matches = await extractor.matches_ecl("44054006", "<< 73211009")

# These raise NotImplementedError if use_grpc=False
```

### Checking Client Type

```python
if extractor.is_grpc:
    # Can use ECL methods
    result = await extractor.execute_ecl("<< 73211009")
else:
    # Fall back to hierarchy traversal
    descendants = await extractor.get_descendants("73211009", depth=10)
```

---

## Summary

The new gRPC-based integration with full ECL support transforms the concept extractor from a simple text-matching tool into a powerful clinical terminology engine capable of:

1. **Complex hierarchical queries** via ECL
2. **Fast subsumption checks** without manual ancestor traversal
3. **Efficient batch operations** for high-throughput scenarios
4. **Rich semantic constraints** for precise concept filtering

The architecture maintains backward compatibility while unlocking the full power of SNOMED CT's expression constraint language.
