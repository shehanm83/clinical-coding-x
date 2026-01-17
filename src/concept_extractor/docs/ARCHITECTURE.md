# Concept Extractor Architecture

This document describes the internal architecture and design decisions.

## Design Principles

### 1. Zero Hallucination

**NO LLM is used** in concept extraction. All results come from:
- Deterministic database queries
- Pre-computed vector embeddings
- CSV/JSON configuration files

This ensures:
- Reproducible results
- No fabricated concept IDs
- Clinically validated terminology

### 2. Separation of Concerns

```
┌─────────────────────────────────────────────────────────────┐
│                    ConceptExtractor                          │
│                  (Orchestration Layer)                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Synonyms   │  │   SNOMED    │  │       MRCM          │  │
│  │  (CSV)      │  │  (HTTP API) │  │      (JSON)         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│        │                │                    │              │
│        ▼                ▼                    ▼              │
│   Lay→Medical      snomed-service calls       Attribute rules      │
│   mapping          (async HTTP)       (static + dynamic)   │
└─────────────────────────────────────────────────────────────┘
```

### 3. Async-First

All network operations are async for:
- Non-blocking I/O
- Concurrent requests
- Better throughput

```python
# All SNOMED operations are async
result = await extractor.match_concepts("chest pain")
children = await extractor.get_children("29857009")
```

### 4. Graceful Degradation

Components work independently:
- No synonyms file? → Skip synonym expansion
- No MRCM config? → Use empty attribute list
- snomed-service down? → Return empty results with error logged

---

## Component Details

### 1. Configuration (`core/config.py`)

```python
@dataclass
class SnomedApiConfig:
    base_url: str = "http://localhost:8010"
    timeout: float = 30.0

@dataclass
class ConceptExtractorSettings:
    snomed_api: SnomedApiConfig
    synonyms_path: Path
    mrcm_path: Path
```

**Environment Variables:**
```bash
SNOMED_API_BASE_URL=http://localhost:8010
SNOMED_API_TIMEOUT=30.0
```

### 2. Data Models (`core/models.py`)

All models are **dataclasses** (no Pydantic):

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
    match_type: str = "vector"  # vector, exact, lexical
    state: str = "primary"       # primary, secondary
```

### 3. SNOMED Client (`core/snomed_client.py`)

Async HTTP client using `httpx`:

```python
class SnomedClient:
    def __init__(self, config: SnomedApiConfig):
        self._client = httpx.AsyncClient(timeout=config.timeout)

    async def match_concepts(self, text: str, ...) -> MatchResult:
        response = await self._client.post(
            f"{self._base_url}/api/v1/search",
            json={"text": text, "top_k": limit}
        )
        # Parse and return MatchResult
```

**snomed-service Response Format:**

```json
{
  "data": {
    "focusConcepts": [
      {
        "id": "29857009",
        "term": "Chest pain",
        "fullySpecifiedName": "Chest pain (finding)",
        "confidence": {
          "overall": 95,
          "semantic": 92,
          "lexical": 85
        },
        "evidence": {
          "lexicalMatch": "partial"
        }
      }
    ]
  }
}
```

### 4. Synonym Lookup (`core/synonyms.py`)

CSV-based lay term mapping:

```python
class SynonymLookup:
    def __init__(self, csv_path: Path):
        self._synonyms: dict[str, str] = {}  # lay_term → snomed_term
        self._load_synonyms()

    def expand_query(self, text: str) -> str:
        # "SOB and fatigue" → "SOB and fatigue, Dyspnea, Fatigue"
```

**CSV Format:**
```csv
Lay_Term,SNOMED_Preferred
shortness of breath,Dyspnea
SOB,Dyspnea
heart attack,Myocardial infarction
the runs,Diarrhea
```

### 5. MRCM Provider (`core/mrcm.py`)

Attribute applicability rules:

```python
class MrcmConfigProvider:
    def __init__(self, config_path: Path):
        self._data: dict = {}  # Loaded from JSON
        self._snomed_client: SnomedClient | None = None

    async def get_valid_attributes_async(
        self,
        concept_id: str,
        semantic_tag: str | None,
        concept_term: str | None,
    ) -> list[AttributeDefinition]:
        # Dynamic checks via SNOMED hierarchy
```

**Decision Flow:**

```
Input: concept_id, semantic_tag, concept_term
                    │
                    ▼
        ┌───────────────────────┐
        │ Check semantic tag    │
        │ (body structure? →    │
        │  return empty)        │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │ Get defined attrs     │
        │ (skip already defined)│
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │ Check Finding site    │
        │ → lateralizable?      │
        │ → include Laterality  │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │ Check chronic disease │
        │ → exclude Clinical    │
        │   course              │
        └───────────┬───────────┘
                    │
                    ▼
        Return: [Severity, Laterality?, ...]
```

---

## Data Flow Diagrams

### Concept Matching

```
User Query: "patient complains of crushing chest pain"
                            │
                            ▼
              ┌─────────────────────────┐
              │   Synonym Expansion     │
              │   "crushing chest pain" │
              │   (no synonyms found)   │
              └────────────┬────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │   snomed-service Vector Search  │
              │   POST /api/v1/search   │
              └────────────┬────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │   Parse Response        │
              │   - Extract concepts    │
              │   - Calculate scores    │
              │   - Determine match type│
              └────────────┬────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │   Return MatchResult    │
              │   [                     │
              │     ConceptMatch(       │
              │       id="29857009",    │
              │       term="Chest pain",│
              │       similarity=0.89   │
              │     ),                  │
              │     ...                 │
              │   ]                     │
              └─────────────────────────┘
```

### MRCM Attribute Resolution

```
Input: concept_id="29857009", term="Chest pain", tag="finding"
                            │
                            ▼
         ┌──────────────────────────────────┐
         │ 1. Load MRCM config (if not yet) │
         └─────────────┬────────────────────┘
                       │
                       ▼
         ┌──────────────────────────────────┐
         │ 2. Check semantic tag            │
         │    "finding" → NOT excluded      │
         └─────────────┬────────────────────┘
                       │
                       ▼
         ┌──────────────────────────────────┐
         │ 3. Get concept relationships     │
         │    GET /concepts/29857009/rels   │
         │    → Finding site = Chest wall   │
         └─────────────┬────────────────────┘
                       │
                       ▼
         ┌──────────────────────────────────┐
         │ 4. Check lateralizable           │
         │    Chest wall → YES (paired)     │
         │    → Include Laterality          │
         └─────────────┬────────────────────┘
                       │
                       ▼
         ┌──────────────────────────────────┐
         │ 5. Check chronic                 │
         │    GET /concepts/29857009/anc    │
         │    → NOT in chronic ancestors    │
         │    → Include Clinical course     │
         └─────────────┬────────────────────┘
                       │
                       ▼
         ┌──────────────────────────────────┐
         │ Return:                          │
         │   - Severity (always)            │
         │   - Laterality (chest is paired) │
         │   - Clinical course (not chronic)│
         └──────────────────────────────────┘
```

---

## Error Handling

### Network Errors

```python
try:
    response = await self._client.post(url, json=payload)
    response.raise_for_status()
except httpx.HTTPError as e:
    logger.error("SNOMED search failed: %s", str(e))
    return MatchResult(query=text, matches=[], processing_time_ms=...)
```

### Missing Files

```python
if not self._csv_path.exists():
    logger.warning("Synonyms file not found: %s", self._csv_path)
    return  # Continue without synonyms
```

### Invalid JSON

```python
try:
    self._data = json.load(f)
except json.JSONDecodeError as e:
    logger.error("Failed to parse MRCM config: %s", e)
    self._data = {"metadata": {}, "attributes": {}}
```

---

## Performance Considerations

### Caching

- Settings are cached with `@lru_cache`
- MRCM config is loaded once and cached
- Synonyms are loaded once at initialization

### Connection Pooling

```python
# httpx.AsyncClient maintains connection pool
self._client = httpx.AsyncClient(timeout=config.timeout)

# Reuse across requests
await self._client.post(...)  # Connection reused
await self._client.get(...)   # Connection reused

# Close when done
await self._client.aclose()
```

### Batch Operations

For multiple concepts, use concurrent requests:

```python
import asyncio

async def match_multiple(texts: list[str]) -> list[MatchResult]:
    tasks = [extractor.match_concepts(t) for t in texts]
    return await asyncio.gather(*tasks)
```

---

## Testing Strategy

### Unit Tests

```python
# Test synonym expansion
def test_synonym_expansion():
    lookup = SynonymLookup(test_csv)
    assert lookup.expand_query("SOB") == "SOB, Dyspnea"

# Test semantic tag extraction
def test_extract_semantic_tag():
    assert _extract_semantic_tag("Chest pain (finding)") == "finding"
    assert _extract_semantic_tag("Invalid") == ""
```

### Integration Tests

```python
# Test against real snomed-service (or mock)
async def test_match_concepts():
    extractor = ConceptExtractor()
    result = await extractor.match_concepts("chest pain")
    assert len(result.matches) > 0
    assert result.matches[0].concept_id == "29857009"
```

### Mock snomed-service

```python
import httpx
from unittest.mock import AsyncMock

async def test_with_mock():
    mock_response = {"data": {"focusConcepts": [...]}}

    with mock.patch.object(httpx.AsyncClient, "post") as mock_post:
        mock_post.return_value = AsyncMock(json=lambda: mock_response)
        result = await extractor.match_concepts("test")
```
