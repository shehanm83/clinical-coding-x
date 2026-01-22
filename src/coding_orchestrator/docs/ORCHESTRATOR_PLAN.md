# Coding Orchestrator - Implementation Plan

## REST API Design for UI Integration

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current System State](#2-current-system-state)
3. [Architecture Overview](#3-architecture-overview)
4. [REST API Endpoints](#4-rest-api-endpoints)
5. [Data Flow & Pipeline](#5-data-flow--pipeline)
6. [Enhanced Functionality](#6-enhanced-functionality)
7. [Zero-Hallucination Question Generator](#7-zero-hallucination-question-generator)
8. [Session & State Management](#8-session--state-management)
9. [Data Models](#9-data-models)
10. [Implementation Phases](#10-implementation-phases)

---

## 1. Executive Summary

### Goal

Build a **REST API-based Coding Orchestrator** that:
- Exposes endpoints for UI consumption
- Coordinates Text Normalizer and Concept Extractor services
- Provides enhanced functionality via ECL and SNOMED hierarchy
- Supports **zero-hallucination** conversational coding workflow
- Maintains session state for multi-turn interactions

### Key Differences from Old System

| Aspect | Old (MCP Client) | New (REST API) |
|--------|------------------|----------------|
| Protocol | MCP (Model Context Protocol) | REST/HTTP + JSON |
| Services | Called MCP servers | Direct Python calls + gRPC to SNOMED |
| State | Stateless | Session-based state management |
| ECL | Limited | Full ECL support |
| UI Integration | MCP-specific | Standard REST endpoints |
| Question Generation | LLM-generated options | **SNOMED-backed options ONLY** |

### Services Available

| Service | Status | Notes |
|---------|--------|-------|
| Text Normalizer | ✅ Implemented | Abbreviation + LLM analysis |
| Concept Extractor | ✅ Implemented | gRPC + ECL support |
| Modifier Mapper | ✅ Implemented | Maps modifiers to SNOMED attributes |
| Coding Orchestrator | ✅ Phase 1-3 Complete | REST API operational |
| Question Generator | 🔄 To Build | Zero-hallucination design |

### Golden Rule

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│   EVERY answer option MUST have a SNOMED CT concept ID.            │
│   If it doesn't have a concept ID, it doesn't exist in our system. │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 2. Current System State

### Implemented Components

```
src/
├── text_normalizer/          ✅ COMPLETE
│   ├── core/
│   │   ├── normalizer.py     # TextNormalizer class
│   │   ├── abbreviations.py  # CSV whitelist
│   │   ├── models.py         # NormalizedText, ClinicalPhrase, etc.
│   │   └── prompts.py        # Jinja2 templates
│   └── server/               # gRPC server (optional)
│
├── concept_extractor/        ✅ COMPLETE
│   ├── core/
│   │   ├── snomed_grpc_client.py  # gRPC client
│   │   ├── mrcm.py                # MRCM validation
│   │   └── synonyms.py            # Lay term expansion
│   └── extractor.py          # ConceptExtractor class
│
├── question_generator/       🔄 TO BUILD (Zero-Hallucination)
│   └── __init__.py           # Stub
│
├── coding_orchestrator/      ✅ Phase 1-3 Complete
│   ├── api/                  # REST endpoints
│   ├── models/               # Pydantic models
│   ├── services/
│   │   ├── coding_service.py    # Main orchestrator
│   │   └── modifier_mapper.py   # Modifier to SNOMED mapping
│   └── app.py                # FastAPI application
│
└── shared/
    ├── llm_client.py         ✅ Multi-provider LLM
    └── config.py             ✅ Configuration
```

### Available Functionality

**Text Normalizer** produces:
- `normalized_text` - Expanded and cleaned text
- `abbreviations_expanded` - List of expansions
- `spelling_corrections` - LLM-identified corrections
- `clinical_phrases` - Identified phrases with types
- `negations` - Negated spans
- `modifiers` - Severity, laterality, onset, etc.
- `relationships` - Radiates to, caused by, etc.

**Concept Extractor** provides:
- `match_concepts()` - Text to SNOMED codes
- `execute_ecl()` - ECL expression execution
- `matches_ecl()` - ECL matching test
- `is_descendant_of()` - Subsumption check
- `get_children/descendants/ancestors()` - Hierarchy
- `get_relationships()` - Concept relationships
- `get_valid_attributes()` - MRCM attributes

**Modifier Mapper** provides:
- `map_modifier()` - Map severity/laterality/course to SNOMED
- Deterministic mappings to SNOMED attribute/value pairs
- All mappings have SNOMED concept IDs

---

## 3. Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              UI (Web/Mobile)                             │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │ REST/HTTP
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         CODING ORCHESTRATOR                              │
│                         (FastAPI REST Server)                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │   Session    │  │   Pipeline   │  │   Question   │  │   Export    │ │
│  │   Manager    │  │   Controller │  │   Generator  │  │   Service   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘ │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Service Clients                               │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐  │   │
│  │  │  TextNormalizer  │  │ ConceptExtractor │  │ ModifierMapper │  │   │
│  │  │  (direct call)   │  │  (direct call)   │  │ (direct call)  │  │   │
│  │  └──────────────────┘  └──────────────────┘  └────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
            ┌─────────────┐ ┌─────────┐  ┌───────────┐
            │   LLM API   │ │ SNOMED  │  │  Session  │
            │ (Presenta-  │ │ gRPC    │  │  Storage  │
            │  tion ONLY) │ │ :50051  │  │  (Redis?) │
            └─────────────┘ └─────────┘  └───────────┘
```

### Technology Stack

| Component | Technology |
|-----------|------------|
| REST Framework | FastAPI |
| Async Support | asyncio |
| Serialization | Pydantic |
| SNOMED Service | gRPC (Rust backend) |
| Session Storage | In-memory (Redis for production) |
| Documentation | OpenAPI/Swagger (auto-generated) |

---

## 4. REST API Endpoints

### Currently Implemented (Phase 1-3)

| Endpoint | Status | Description |
|----------|--------|-------------|
| `GET /health` | ✅ | Health check |
| `POST /api/v1/code` | ✅ | Full coding pipeline |
| `POST /api/v1/normalize` | ✅ | Text normalization only |
| `POST /api/v1/extract` | ✅ | Concept extraction only |
| `POST /api/v1/ecl/execute` | ✅ | Execute ECL expression |
| `POST /api/v1/ecl/match` | ✅ | Check ECL match |
| `POST /api/v1/ecl/subsumption` | ✅ | Subsumption check |
| `GET /api/v1/concepts/{id}` | ✅ | Get concept details |
| `GET /api/v1/concepts/{id}/children` | ✅ | Get direct children |
| `GET /api/v1/concepts/{id}/descendants` | ✅ | Get all descendants |
| `GET /api/v1/concepts/{id}/ancestors` | ✅ | Get all ancestors |
| `GET /api/v1/concepts/{id}/parents` | ✅ | Get direct parents |
| `GET /api/v1/concepts/{id}/attributes` | ✅ | Get MRCM attributes |
| `GET /api/v1/concepts/{id}/relationships` | ✅ | Get relationships |
| `POST /api/v1/build-expression` | ✅ | Build post-coordinated expression |
| `POST /api/v1/validate/expression` | ✅ | Validate expression |
| `POST /api/v1/validate/relationship` | ✅ | Validate relationship |
| `POST /api/v1/refine` | ✅ | Get refinement suggestions |
| `POST /api/v1/suggest/children` | ✅ | Suggest more specific concepts |
| `POST /api/v1/suggest/siblings` | ✅ | Suggest alternative concepts |
| `POST /api/v1/map-modifiers` | ✅ | Map modifiers to SNOMED |
| `POST /api/v1/code/enhanced` | ✅ | Enhanced coding with post-coordination |
| `POST /api/v1/refsets/membership` | ✅ | Check refset membership |

### Planned (Phase 4-5)

| Endpoint | Description |
|----------|-------------|
| `POST /api/v1/code-with-questions` | Coding + question generation |
| `POST /api/v1/sessions` | Create new session |
| `GET /api/v1/sessions/{id}` | Get session state |
| `POST /api/v1/sessions/{id}/answer` | Answer a question |
| `DELETE /api/v1/sessions/{id}` | End session |
| `POST /api/v1/export/fhir` | Export as FHIR |
| `POST /api/v1/export/expression` | Export as SNOMED expression |

---

## 5. Data Flow & Pipeline

### Main Coding Pipeline

```
┌────────────────────────────────────────────────────────────────────────┐
│                        POST /api/v1/code                                │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Input: Raw Clinical Text                                              │
│  "Pt presents with severe CP radiating to L arm, SOB x 2 days"        │
│                              │                                         │
│                              ▼                                         │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  STAGE 1: TEXT NORMALIZATION                                    │   │
│  │  ────────────────────────────────────────────────────────────  │   │
│  │  1. Abbreviation expansion (CSV whitelist - DETERMINISTIC)     │   │
│  │     "Pt" → "Patient", "CP" → "Chest pain", "SOB" → "Shortness" │   │
│  │                                                                 │   │
│  │  2. LLM Analysis (structured extraction)                       │   │
│  │     - Clinical phrases: ["Chest pain", "Shortness of breath"]  │   │
│  │     - Modifiers: [{type: "severity", value: "severe", ...}]    │   │
│  │     - Relationships: [{type: "radiates_to", target: "L arm"}]  │   │
│  │     - Negations: []                                            │   │
│  │                                                                 │   │
│  │  Output: NormalizedText                                         │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                              │                                         │
│                              ▼                                         │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  STAGE 2: CONCEPT EXTRACTION (per clinical phrase)             │   │
│  │  ────────────────────────────────────────────────────────────  │   │
│  │  For each clinical_phrase:                                      │   │
│  │                                                                 │   │
│  │  2a. Match to SNOMED CT (gRPC)                                 │   │
│  │      "Chest pain" → [29857009, 274664007, ...]                 │   │
│  │                                                                 │   │
│  │  2b. Get MRCM attributes                                       │   │
│  │      29857009 → [Severity, Laterality, Clinical course, ...]   │   │
│  │                                                                 │   │
│  │  Output: List[ConceptResult]                                    │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                              │                                         │
│                              ▼                                         │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  STAGE 3: MODIFIER MAPPING (Phase 3)                           │   │
│  │  ────────────────────────────────────────────────────────────  │   │
│  │  Map extracted modifiers to SNOMED attributes:                  │   │
│  │    "severe" → 246112005 | Severity | = 24484000 | Severe       │   │
│  │    "left"   → 272741003 | Laterality | = 7771000 | Left        │   │
│  │    "acute"  → 263502005 | Course | = 373933003 | Acute onset   │   │
│  │                                                                 │   │
│  │  Build post-coordinated expressions                             │   │
│  │                                                                 │   │
│  │  Output: EnhancedCodingResult                                   │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                              │                                         │
│                              ▼                                         │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  STAGE 4: QUESTION GENERATION (Zero-Hallucination)             │   │
│  │  ────────────────────────────────────────────────────────────  │   │
│  │  Detect gaps in coding data:                                    │   │
│  │    - Concept has children? → Specificity question              │   │
│  │    - Missing MRCM attributes? → Attribute question             │   │
│  │    - Lateralizable site? → Laterality question                 │   │
│  │                                                                 │   │
│  │  Generate questions with SNOMED-backed options ONLY             │   │
│  │  (See Section 7 for details)                                    │   │
│  │                                                                 │   │
│  │  Output: CodingResponse + List[Question]                        │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Enhanced Functionality

### Implemented Features (Phase 3)

#### **1. Modifier to Attribute Mapping**

Map extracted modifiers to SNOMED CT attributes deterministically:

| Modifier | SNOMED Attribute | Example Values |
|----------|-----------------|----------------|
| severity: "severe" | 246112005 | 24484000 (Severe) |
| severity: "mild" | 246112005 | 255604002 (Mild) |
| laterality: "left" | 272741003 | 7771000 (Left) |
| laterality: "bilateral" | 272741003 | 51440002 (Bilateral) |
| onset: "acute" | 263502005 | 373933003 (Acute onset) |
| course: "chronic" | 263502005 | 90734009 (Chronic) |

#### **2. Relationship Validation**

```python
# Validate that a relationship exists in SNOMED CT
result = await service.validate_relationship(
    source_concept_id="29857009",      # Chest pain
    relationship_type_id="363698007",  # Finding site
    target_concept_id="51185008"       # Thoracic structure
)
# Returns: is_valid=True, validation_method="existing"
```

#### **3. Post-Coordination Building**

```python
# Build valid SNOMED post-coordinated expression
expression = await service.build_expression(
    focus_concept_id="29857009",  # Chest pain
    attributes=[
        ("246112005", "24484000", 0),   # Severity = Severe
        ("272741003", "7771000", 0),    # Laterality = Left
    ]
)
# Output: "29857009 | Chest pain | : 246112005 | Severity | = 24484000 | Severe |, ..."
```

#### **4. Enhanced Coding Endpoint**

`POST /api/v1/code/enhanced` - Automatically:
1. Normalizes text
2. Extracts concepts
3. Maps modifiers to attributes
4. Builds post-coordinated expressions

---

## 7. Zero-Hallucination Question Generator

### Core Principle

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  LLM Role: PRESENTATION ONLY                                           │
│  ─────────────────────────────                                         │
│                                                                        │
│  ✓ LLM CAN format question text naturally                              │
│  ✓ LLM CAN adapt tone and language                                     │
│  ✓ LLM CAN group and organize questions                                │
│                                                                        │
│  ✗ LLM CANNOT generate answer options                                  │
│  ✗ LLM CANNOT add clinical content                                     │
│  ✗ LLM CANNOT suggest diagnoses                                        │
│                                                                        │
│  ALL answer options come from SNOMED CT queries:                       │
│  - ECL execution                                                       │
│  - Hierarchy traversal (children, siblings)                            │
│  - MRCM attribute ranges                                               │
│  - Relationship targets                                                │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Question Types and SNOMED Sources

#### **7.1 Specificity Questions (From Children)**

**Source:** `get_children(concept_id)` or ECL `< {concept_id}`

```
User selects: "Diabetes mellitus" (73211009)
                    │
                    ▼
System calls: get_children("73211009")
                    │
                    ▼
Returns children: [
    ("44054006", "Type 2 diabetes mellitus"),
    ("46635009", "Type 1 diabetes mellitus"),
    ("11530004", "Gestational diabetes mellitus"),
]
                    │
                    ▼
Question: "Can you specify the type of diabetes?"
Options (ALL have SNOMED IDs):
  [ ] Type 1 diabetes mellitus (46635009)
  [ ] Type 2 diabetes mellitus (44054006)
  [ ] Gestational diabetes (11530004)
  [ ] Not specified / Keep general
```

#### **7.2 Attribute Questions (From MRCM)**

**Source:** `get_valid_attributes(concept_id)` + `get_attribute_range(attribute_id)`

```
User selects: "Chest pain" (29857009)
                    │
                    ▼
System calls: get_valid_attributes("29857009", "finding")
                    │
                    ▼
MRCM returns: [Severity, Laterality, Clinical course]
                    │
                    ▼
For Severity, get range:
  get_attribute_range("246112005") → [Mild, Moderate, Severe]
                    │
                    ▼
Question: "How severe is the chest pain?"
Options (ALL are SNOMED qualifier concepts):
  [ ] Mild (255604002)
  [ ] Moderate (6736007)
  [ ] Severe (24484000)
  [ ] Not documented
```

#### **7.3 Laterality Questions (From ECL + Finding Site)**

**Source:** Check if finding site is lateralizable via MRCM

```
Concept: "Arm pain"
Finding site: "Upper arm structure" (40983000)
                    │
                    ▼
Check: Is upper arm lateralizable?
ECL: matches_ecl("40983000", "<< 91723000")
                    │
                    ▼
Result: Yes - Paired structure
                    │
                    ▼
Question: "Which arm is affected?"
Options (SNOMED laterality qualifiers):
  [ ] Left (7771000)
  [ ] Right (24028007)
  [ ] Both arms (51440002)
```

#### **7.4 Disambiguation Questions (From Search Results)**

**Source:** When `match_concepts()` returns multiple semantic categories

```
Search: "cold"
                    │
                    ▼
Results:
  - Common cold (82272006) - disorder
  - Cold sensation (71999009) - finding
  - Cold temperature (84162001) - qualifier
                    │
                    ▼
Disambiguation needed (multiple semantic tags)
                    │
                    ▼
Question: "What do you mean by 'cold'?"
Options (ALL from search results with SNOMED IDs):
  [ ] Common cold - an illness (82272006)
  [ ] Cold sensation - what the patient feels (71999009)
  [ ] Cold temperature - environmental factor (84162001)
```

#### **7.5 Temporal/Course Questions**

**Source:** Clinical course MRCM attribute + chronic disease ancestry check

```
Concept: "Pneumonia" (233604007)
                    │
                    ▼
Check: Is pneumonia inherently chronic?
is_descendant_of("233604007", "27624003")
                    │
                    ▼
Result: False - Pneumonia is NOT inherently chronic
                    │
                    ▼
Question: "What is the clinical course?"
Options (SNOMED course qualifiers):
  [ ] Acute (373933003)
  [ ] Subacute (19939008)
  [ ] Chronic (90734009)
  [ ] Intermittent (7087005)

---

Concept: "Type 2 diabetes mellitus" (44054006)
                    │
                    ▼
Check: Is T2DM inherently chronic?
is_descendant_of("44054006", "27624003")
                    │
                    ▼
Result: True - T2DM IS chronic by definition
                    │
                    ▼
Skip temporal question - not applicable
```

### Gap Detection Strategy

| Gap Type | Detection Method | SNOMED Source |
|----------|------------------|---------------|
| **Specificity Gap** | Concept has children (count 2-15) | `get_children()` |
| **Attribute Gap** | MRCM attribute valid but not defined | `get_valid_attributes()` |
| **Laterality Gap** | Finding site is lateralizable | MRCM + body site check |
| **Disambiguation Gap** | Multiple semantic tags in search | `match_concepts()` |
| **Temporal Gap** | Non-chronic finding without course | `is_descendant_of()` |
| **Location Gap** | Finding without Finding site | `get_relationships()` |

### Smart Defaulting (From Normalized Text)

Pre-select answers when text normalizer extracted relevant modifiers:

```
Input text: "Patient has severe chest pain"
                    │
                    ▼
Text normalizer extracts: modifier(type="severity", value="severe")
                    │
                    ▼
Modifier mapper: severity="severe" → Severity (246112005) = Severe (24484000)
                    │
                    ▼
Question: "How severe is the chest pain?"
Options:
  [ ] Mild
  [ ] Moderate
  [*] Severe  ← PRE-SELECTED (extracted from text, SNOMED ID: 24484000)
```

### ECL Queries for Question Generation

| Purpose | ECL Expression |
|---------|---------------|
| Severity values | `<< 272141005` |
| Laterality values | `<< 182353008` |
| Clinical course values | `<< 288524001` |
| Body structures | `<< 123037004` |
| Clinical findings | `<< 404684003` |
| Chronic diseases | `<< 27624003` |
| Direct children | `< {concept_id}` |

### Question Generation Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                     QUESTION GENERATION FLOW                            │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  INPUT: CodingResult                                                   │
│                    │                                                   │
│                    ▼                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  STEP 1: GAP DETECTION (Parallel)                               │  │
│  │                                                                 │  │
│  │  For each concept:                                              │  │
│  │    ├── get_children() → Specificity gap?                       │  │
│  │    ├── get_valid_attributes() → Attribute gaps?                │  │
│  │    ├── Check body site MRCM → Laterality gap?                  │  │
│  │    └── is_descendant_of(chronic) → Temporal gap?               │  │
│  │                                                                 │  │
│  │  Output: list[Gap] sorted by priority                          │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                    │                                                   │
│                    ▼                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  STEP 2: OPTION GENERATION (SNOMED ONLY)                        │  │
│  │                                                                 │  │
│  │  For each gap:                                                  │  │
│  │    ├── Specificity: get_children(concept_id)                   │  │
│  │    ├── Attribute: get_attribute_range(attribute_id)            │  │
│  │    ├── Laterality: Fixed SNOMED IDs [Left, Right, Bilateral]   │  │
│  │    └── Temporal: get_attribute_range("263502005")              │  │
│  │                                                                 │  │
│  │  Every option has a SNOMED concept ID                          │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                    │                                                   │
│                    ▼                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  STEP 3: SMART DEFAULTING                                       │  │
│  │                                                                 │  │
│  │  Apply pre-selections from extracted modifiers:                 │  │
│  │    modifier(severity="severe") → pre-select Severe (24484000)  │  │
│  │    modifier(laterality="left") → pre-select Left (7771000)     │  │
│  │                                                                 │  │
│  │  Pre-selections also have SNOMED IDs                           │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                    │                                                   │
│                    ▼                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  STEP 4: LLM PRESENTATION (Optional)                            │  │
│  │                                                                 │  │
│  │  LLM formats question text ONLY:                                │  │
│  │    Input:  question_type="severity", concept="chest pain"      │  │
│  │    Output: "How would you rate the severity of the chest pain?" │  │
│  │                                                                 │  │
│  │  Options UNCHANGED - passthrough with SNOMED IDs               │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                    │                                                   │
│                    ▼                                                   │
│  OUTPUT: list[Question]                                                │
│  Each Question.option has:                                             │
│    - concept_id (SNOMED)                                               │
│    - display_text                                                      │
│    - fsn                                                               │
│    - pre_selected (bool)                                               │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Creative LLM Usage (Safe)

| LLM CAN Do | Example |
|------------|---------|
| Format question text naturally | "How severe is the chest pain?" |
| Adapt tone (formal/casual) | Adjust for clinical vs patient-facing |
| Multi-language support | Translate question text |
| Provide context | "Based on the patient's symptoms..." |
| Group questions | "Let's clarify the location details:" |

| LLM CANNOT Do | Why |
|---------------|-----|
| Generate answer options | Options must have SNOMED IDs |
| Add clinical interpretations | Not validated terminology |
| Suggest diagnoses | Outside scope |
| Skip questions based on "judgment" | May miss required data |

---

## 8. Session & State Management

### Session Model

```python
@dataclass
class CodingSession:
    session_id: str
    created_at: datetime
    updated_at: datetime
    status: SessionStatus  # "active", "pending_questions", "complete"

    # Input
    original_text: str

    # Normalized output
    normalized: NormalizedText | None

    # Coding results
    concepts: list[ConceptResult]

    # Questions
    pending_questions: list[Question]
    answered_questions: list[AnsweredQuestion]  # Each answer has SNOMED ID

    # Final output
    expressions: list[str]  # SNOMED post-coordinated expressions

    # Metadata
    processing_times: dict[str, int]
```

### Session Flow

```
┌─────────────────┐
│  Create Session │ POST /api/v1/sessions
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Normalize     │ (automatic)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Extract Concepts│ (automatic)
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Generate Questions             │
│  (All options from SNOMED)      │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Return to UI                   │
│  status: "pending_questions"    │
└────────┬────────────────────────┘
         │
    (user answers)
         │
         ▼
┌─────────────────────────────────┐
│  Process Answer                 │
│  (answer.concept_id required)   │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────┐
│ Build Expression│ Using answered SNOMED IDs
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Complete        │
└─────────────────┘
```

---

## 9. Data Models

### Question Models

```python
class QuestionOption(BaseModel):
    """A single option - ALWAYS backed by SNOMED."""
    concept_id: str                 # REQUIRED - SNOMED concept ID
    display_text: str               # Human-readable term
    fsn: str = ""                   # Fully Specified Name
    semantic_tag: str = ""          # e.g., "finding", "qualifier value"
    pre_selected: bool = False      # From text extraction
    pre_selection_source: str = ""  # How it was determined


class Question(BaseModel):
    """A clarifying question with SNOMED-backed options."""
    id: str
    question_type: str              # specificity, attribute, laterality, etc.
    priority: int                   # 1=critical, 5=optional

    # Source
    source_concept_id: str
    source_concept_term: str
    attribute_id: str | None = None

    # Content
    text: str                       # LLM-formatted question
    options: list[QuestionOption]   # ALL have SNOMED IDs

    # Metadata
    ecl_source: str | None = None
    skip_option: bool = True
    multi_select: bool = False


class AnsweredQuestion(BaseModel):
    """Record of an answered question."""
    question_id: str
    selected_options: list[QuestionOption]  # ALL have SNOMED IDs
    resulting_attribute: tuple[str, str] | None  # (attr_id, value_id)
```

---

## 10. Implementation Phases

### Phase 1: Core REST API ✅ COMPLETE

- [x] Set up FastAPI application
- [x] Implement `/api/v1/code` endpoint
- [x] Implement `/api/v1/normalize` endpoint
- [x] Implement `/api/v1/extract` endpoint
- [x] Implement concept lookup endpoints
- [x] Add OpenAPI documentation

### Phase 2: ECL & Hierarchy ✅ COMPLETE

- [x] Implement ECL endpoints
- [x] Implement hierarchy endpoints
- [x] Add subsumption validation
- [x] Add MRCM attribute endpoints
- [x] Implement expression building
- [x] Add expression validation

### Phase 3: Enhanced Coding ✅ COMPLETE

- [x] Modifier to attribute mapping
- [x] Relationship validation
- [x] Enhanced coding endpoint
- [x] Post-coordination building

### Phase 4: Question Generator ✅ COMPLETE

- [x] Implement Gap Detector
- [x] Implement Option Generator (SNOMED-only)
- [x] Implement Question Presenter (LLM/Template)
- [x] Implement Answer Processor
- [x] Add `/api/v1/code-with-questions` endpoint
- [x] Add `/api/v1/generate-questions` endpoint
- [x] Add session endpoints (`/sessions`, `/{id}`, `/{id}/answer`)

### Phase 5: Export & Production

- [ ] FHIR export
- [ ] SNOMED expression export
- [ ] Batch processing
- [ ] Rate limiting
- [ ] Caching layer
- [ ] Production hardening

---

## Summary

This orchestrator provides a comprehensive REST API for clinical coding that:

1. **Exposes REST endpoints** for UI consumption
2. **Coordinates existing services** (Text Normalizer, Concept Extractor, Modifier Mapper)
3. **Leverages ECL** for powerful SNOMED queries
4. **Supports enhanced features** (post-coordination, validation)
5. **Implements zero-hallucination question generation** where ALL options come from SNOMED CT
6. **Uses LLM creatively but safely** for presentation only, never for clinical content

The key innovation is the **strict separation** between:
- **SNOMED CT** (source of all clinical data and answer options)
- **LLM** (presentation, formatting, user experience - never clinical content)

This ensures **zero hallucination** while still providing intelligent, user-friendly interactions.
