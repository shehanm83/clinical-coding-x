from google.protobuf.internal import containers as _containers
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class ConcreteValueType(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    CONCRETE_VALUE_TYPE_UNSPECIFIED: _ClassVar[ConcreteValueType]
    CONCRETE_VALUE_TYPE_STRING: _ClassVar[ConcreteValueType]
    CONCRETE_VALUE_TYPE_INTEGER: _ClassVar[ConcreteValueType]
    CONCRETE_VALUE_TYPE_DECIMAL: _ClassVar[ConcreteValueType]
CONCRETE_VALUE_TYPE_UNSPECIFIED: ConcreteValueType
CONCRETE_VALUE_TYPE_STRING: ConcreteValueType
CONCRETE_VALUE_TYPE_INTEGER: ConcreteValueType
CONCRETE_VALUE_TYPE_DECIMAL: ConcreteValueType

class Concept(_message.Message):
    __slots__ = ("id", "effective_time", "active", "module_id", "definition_status_id", "fsn")
    ID_FIELD_NUMBER: _ClassVar[int]
    EFFECTIVE_TIME_FIELD_NUMBER: _ClassVar[int]
    ACTIVE_FIELD_NUMBER: _ClassVar[int]
    MODULE_ID_FIELD_NUMBER: _ClassVar[int]
    DEFINITION_STATUS_ID_FIELD_NUMBER: _ClassVar[int]
    FSN_FIELD_NUMBER: _ClassVar[int]
    id: int
    effective_time: int
    active: bool
    module_id: int
    definition_status_id: int
    fsn: str
    def __init__(self, id: _Optional[int] = ..., effective_time: _Optional[int] = ..., active: bool = ..., module_id: _Optional[int] = ..., definition_status_id: _Optional[int] = ..., fsn: _Optional[str] = ...) -> None: ...

class Description(_message.Message):
    __slots__ = ("id", "concept_id", "language_code", "type_id", "term", "active")
    ID_FIELD_NUMBER: _ClassVar[int]
    CONCEPT_ID_FIELD_NUMBER: _ClassVar[int]
    LANGUAGE_CODE_FIELD_NUMBER: _ClassVar[int]
    TYPE_ID_FIELD_NUMBER: _ClassVar[int]
    TERM_FIELD_NUMBER: _ClassVar[int]
    ACTIVE_FIELD_NUMBER: _ClassVar[int]
    id: int
    concept_id: int
    language_code: str
    type_id: int
    term: str
    active: bool
    def __init__(self, id: _Optional[int] = ..., concept_id: _Optional[int] = ..., language_code: _Optional[str] = ..., type_id: _Optional[int] = ..., term: _Optional[str] = ..., active: bool = ...) -> None: ...

class Relationship(_message.Message):
    __slots__ = ("id", "source_id", "destination_id", "type_id", "relationship_group", "active", "characteristic_type_id")
    ID_FIELD_NUMBER: _ClassVar[int]
    SOURCE_ID_FIELD_NUMBER: _ClassVar[int]
    DESTINATION_ID_FIELD_NUMBER: _ClassVar[int]
    TYPE_ID_FIELD_NUMBER: _ClassVar[int]
    RELATIONSHIP_GROUP_FIELD_NUMBER: _ClassVar[int]
    ACTIVE_FIELD_NUMBER: _ClassVar[int]
    CHARACTERISTIC_TYPE_ID_FIELD_NUMBER: _ClassVar[int]
    id: int
    source_id: int
    destination_id: int
    type_id: int
    relationship_group: int
    active: bool
    characteristic_type_id: int
    def __init__(self, id: _Optional[int] = ..., source_id: _Optional[int] = ..., destination_id: _Optional[int] = ..., type_id: _Optional[int] = ..., relationship_group: _Optional[int] = ..., active: bool = ..., characteristic_type_id: _Optional[int] = ...) -> None: ...

class ConcreteRelationship(_message.Message):
    __slots__ = ("id", "source_id", "value", "value_type", "type_id", "relationship_group", "active")
    ID_FIELD_NUMBER: _ClassVar[int]
    SOURCE_ID_FIELD_NUMBER: _ClassVar[int]
    VALUE_FIELD_NUMBER: _ClassVar[int]
    VALUE_TYPE_FIELD_NUMBER: _ClassVar[int]
    TYPE_ID_FIELD_NUMBER: _ClassVar[int]
    RELATIONSHIP_GROUP_FIELD_NUMBER: _ClassVar[int]
    ACTIVE_FIELD_NUMBER: _ClassVar[int]
    id: int
    source_id: int
    value: str
    value_type: ConcreteValueType
    type_id: int
    relationship_group: int
    active: bool
    def __init__(self, id: _Optional[int] = ..., source_id: _Optional[int] = ..., value: _Optional[str] = ..., value_type: _Optional[_Union[ConcreteValueType, str]] = ..., type_id: _Optional[int] = ..., relationship_group: _Optional[int] = ..., active: bool = ...) -> None: ...

class RefsetMember(_message.Message):
    __slots__ = ("id", "refset_id", "referenced_component_id", "active")
    ID_FIELD_NUMBER: _ClassVar[int]
    REFSET_ID_FIELD_NUMBER: _ClassVar[int]
    REFERENCED_COMPONENT_ID_FIELD_NUMBER: _ClassVar[int]
    ACTIVE_FIELD_NUMBER: _ClassVar[int]
    id: int
    refset_id: int
    referenced_component_id: int
    active: bool
    def __init__(self, id: _Optional[int] = ..., refset_id: _Optional[int] = ..., referenced_component_id: _Optional[int] = ..., active: bool = ...) -> None: ...

class AssociationMember(_message.Message):
    __slots__ = ("id", "refset_id", "source_component_id", "target_component_id", "active")
    ID_FIELD_NUMBER: _ClassVar[int]
    REFSET_ID_FIELD_NUMBER: _ClassVar[int]
    SOURCE_COMPONENT_ID_FIELD_NUMBER: _ClassVar[int]
    TARGET_COMPONENT_ID_FIELD_NUMBER: _ClassVar[int]
    ACTIVE_FIELD_NUMBER: _ClassVar[int]
    id: int
    refset_id: int
    source_component_id: int
    target_component_id: int
    active: bool
    def __init__(self, id: _Optional[int] = ..., refset_id: _Optional[int] = ..., source_component_id: _Optional[int] = ..., target_component_id: _Optional[int] = ..., active: bool = ...) -> None: ...

class OwlExpression(_message.Message):
    __slots__ = ("id", "refset_id", "referenced_concept_id", "owl_expression", "active")
    ID_FIELD_NUMBER: _ClassVar[int]
    REFSET_ID_FIELD_NUMBER: _ClassVar[int]
    REFERENCED_CONCEPT_ID_FIELD_NUMBER: _ClassVar[int]
    OWL_EXPRESSION_FIELD_NUMBER: _ClassVar[int]
    ACTIVE_FIELD_NUMBER: _ClassVar[int]
    id: int
    refset_id: int
    referenced_concept_id: int
    owl_expression: str
    active: bool
    def __init__(self, id: _Optional[int] = ..., refset_id: _Optional[int] = ..., referenced_concept_id: _Optional[int] = ..., owl_expression: _Optional[str] = ..., active: bool = ...) -> None: ...

class GetConceptRequest(_message.Message):
    __slots__ = ("id",)
    ID_FIELD_NUMBER: _ClassVar[int]
    id: int
    def __init__(self, id: _Optional[int] = ...) -> None: ...

class GetConceptResponse(_message.Message):
    __slots__ = ("concept", "descriptions")
    CONCEPT_FIELD_NUMBER: _ClassVar[int]
    DESCRIPTIONS_FIELD_NUMBER: _ClassVar[int]
    concept: Concept
    descriptions: _containers.RepeatedCompositeFieldContainer[Description]
    def __init__(self, concept: _Optional[_Union[Concept, _Mapping]] = ..., descriptions: _Optional[_Iterable[_Union[Description, _Mapping]]] = ...) -> None: ...

class GetParentsRequest(_message.Message):
    __slots__ = ("id",)
    ID_FIELD_NUMBER: _ClassVar[int]
    id: int
    def __init__(self, id: _Optional[int] = ...) -> None: ...

class GetParentsResponse(_message.Message):
    __slots__ = ("parents",)
    PARENTS_FIELD_NUMBER: _ClassVar[int]
    parents: _containers.RepeatedCompositeFieldContainer[Concept]
    def __init__(self, parents: _Optional[_Iterable[_Union[Concept, _Mapping]]] = ...) -> None: ...

class GetChildrenRequest(_message.Message):
    __slots__ = ("id",)
    ID_FIELD_NUMBER: _ClassVar[int]
    id: int
    def __init__(self, id: _Optional[int] = ...) -> None: ...

class GetChildrenResponse(_message.Message):
    __slots__ = ("children",)
    CHILDREN_FIELD_NUMBER: _ClassVar[int]
    children: _containers.RepeatedCompositeFieldContainer[Concept]
    def __init__(self, children: _Optional[_Iterable[_Union[Concept, _Mapping]]] = ...) -> None: ...

class SearchRequest(_message.Message):
    __slots__ = ("query", "limit", "active_only")
    QUERY_FIELD_NUMBER: _ClassVar[int]
    LIMIT_FIELD_NUMBER: _ClassVar[int]
    ACTIVE_ONLY_FIELD_NUMBER: _ClassVar[int]
    query: str
    limit: int
    active_only: bool
    def __init__(self, query: _Optional[str] = ..., limit: _Optional[int] = ..., active_only: bool = ...) -> None: ...

class SearchResponse(_message.Message):
    __slots__ = ("concepts",)
    CONCEPTS_FIELD_NUMBER: _ClassVar[int]
    concepts: _containers.RepeatedCompositeFieldContainer[Concept]
    def __init__(self, concepts: _Optional[_Iterable[_Union[Concept, _Mapping]]] = ...) -> None: ...

class IsDescendantOfRequest(_message.Message):
    __slots__ = ("concept_id", "ancestor_id")
    CONCEPT_ID_FIELD_NUMBER: _ClassVar[int]
    ANCESTOR_ID_FIELD_NUMBER: _ClassVar[int]
    concept_id: int
    ancestor_id: int
    def __init__(self, concept_id: _Optional[int] = ..., ancestor_id: _Optional[int] = ...) -> None: ...

class IsDescendantOfResponse(_message.Message):
    __slots__ = ("is_descendant",)
    IS_DESCENDANT_FIELD_NUMBER: _ClassVar[int]
    is_descendant: bool
    def __init__(self, is_descendant: bool = ...) -> None: ...

class GetRelationshipsRequest(_message.Message):
    __slots__ = ("concept_id", "type_filter", "include_incoming")
    CONCEPT_ID_FIELD_NUMBER: _ClassVar[int]
    TYPE_FILTER_FIELD_NUMBER: _ClassVar[int]
    INCLUDE_INCOMING_FIELD_NUMBER: _ClassVar[int]
    concept_id: int
    type_filter: _containers.RepeatedScalarFieldContainer[int]
    include_incoming: bool
    def __init__(self, concept_id: _Optional[int] = ..., type_filter: _Optional[_Iterable[int]] = ..., include_incoming: bool = ...) -> None: ...

class GetRelationshipsResponse(_message.Message):
    __slots__ = ("outgoing", "incoming")
    OUTGOING_FIELD_NUMBER: _ClassVar[int]
    INCOMING_FIELD_NUMBER: _ClassVar[int]
    outgoing: _containers.RepeatedCompositeFieldContainer[Relationship]
    incoming: _containers.RepeatedCompositeFieldContainer[Relationship]
    def __init__(self, outgoing: _Optional[_Iterable[_Union[Relationship, _Mapping]]] = ..., incoming: _Optional[_Iterable[_Union[Relationship, _Mapping]]] = ...) -> None: ...

class GetConceptsBatchRequest(_message.Message):
    __slots__ = ("ids", "include_descriptions")
    IDS_FIELD_NUMBER: _ClassVar[int]
    INCLUDE_DESCRIPTIONS_FIELD_NUMBER: _ClassVar[int]
    ids: _containers.RepeatedScalarFieldContainer[int]
    include_descriptions: bool
    def __init__(self, ids: _Optional[_Iterable[int]] = ..., include_descriptions: bool = ...) -> None: ...

class GetConceptsBatchResponse(_message.Message):
    __slots__ = ("concepts", "not_found")
    CONCEPTS_FIELD_NUMBER: _ClassVar[int]
    NOT_FOUND_FIELD_NUMBER: _ClassVar[int]
    concepts: _containers.RepeatedCompositeFieldContainer[Concept]
    not_found: _containers.RepeatedScalarFieldContainer[int]
    def __init__(self, concepts: _Optional[_Iterable[_Union[Concept, _Mapping]]] = ..., not_found: _Optional[_Iterable[int]] = ...) -> None: ...

class GetPreferredTermRequest(_message.Message):
    __slots__ = ("concept_id", "language_refset_id")
    CONCEPT_ID_FIELD_NUMBER: _ClassVar[int]
    LANGUAGE_REFSET_ID_FIELD_NUMBER: _ClassVar[int]
    concept_id: int
    language_refset_id: int
    def __init__(self, concept_id: _Optional[int] = ..., language_refset_id: _Optional[int] = ...) -> None: ...

class GetPreferredTermResponse(_message.Message):
    __slots__ = ("term", "found")
    TERM_FIELD_NUMBER: _ClassVar[int]
    FOUND_FIELD_NUMBER: _ClassVar[int]
    term: str
    found: bool
    def __init__(self, term: _Optional[str] = ..., found: bool = ...) -> None: ...

class GetConcreteRelationshipsRequest(_message.Message):
    __slots__ = ("concept_id", "type_filter")
    CONCEPT_ID_FIELD_NUMBER: _ClassVar[int]
    TYPE_FILTER_FIELD_NUMBER: _ClassVar[int]
    concept_id: int
    type_filter: _containers.RepeatedScalarFieldContainer[int]
    def __init__(self, concept_id: _Optional[int] = ..., type_filter: _Optional[_Iterable[int]] = ...) -> None: ...

class GetConcreteRelationshipsResponse(_message.Message):
    __slots__ = ("relationships",)
    RELATIONSHIPS_FIELD_NUMBER: _ClassVar[int]
    relationships: _containers.RepeatedCompositeFieldContainer[ConcreteRelationship]
    def __init__(self, relationships: _Optional[_Iterable[_Union[ConcreteRelationship, _Mapping]]] = ...) -> None: ...

class GetOwlExpressionsRequest(_message.Message):
    __slots__ = ("concept_id",)
    CONCEPT_ID_FIELD_NUMBER: _ClassVar[int]
    concept_id: int
    def __init__(self, concept_id: _Optional[int] = ...) -> None: ...

class GetOwlExpressionsResponse(_message.Message):
    __slots__ = ("expressions",)
    EXPRESSIONS_FIELD_NUMBER: _ClassVar[int]
    expressions: _containers.RepeatedCompositeFieldContainer[OwlExpression]
    def __init__(self, expressions: _Optional[_Iterable[_Union[OwlExpression, _Mapping]]] = ...) -> None: ...

class GetRefsetMembersRequest(_message.Message):
    __slots__ = ("refset_id", "limit", "offset")
    REFSET_ID_FIELD_NUMBER: _ClassVar[int]
    LIMIT_FIELD_NUMBER: _ClassVar[int]
    OFFSET_FIELD_NUMBER: _ClassVar[int]
    refset_id: int
    limit: int
    offset: int
    def __init__(self, refset_id: _Optional[int] = ..., limit: _Optional[int] = ..., offset: _Optional[int] = ...) -> None: ...

class GetRefsetMembersResponse(_message.Message):
    __slots__ = ("member_ids", "total_count")
    MEMBER_IDS_FIELD_NUMBER: _ClassVar[int]
    TOTAL_COUNT_FIELD_NUMBER: _ClassVar[int]
    member_ids: _containers.RepeatedScalarFieldContainer[int]
    total_count: int
    def __init__(self, member_ids: _Optional[_Iterable[int]] = ..., total_count: _Optional[int] = ...) -> None: ...

class GetRefsetsForConceptRequest(_message.Message):
    __slots__ = ("concept_id",)
    CONCEPT_ID_FIELD_NUMBER: _ClassVar[int]
    concept_id: int
    def __init__(self, concept_id: _Optional[int] = ...) -> None: ...

class GetRefsetsForConceptResponse(_message.Message):
    __slots__ = ("refset_ids",)
    REFSET_IDS_FIELD_NUMBER: _ClassVar[int]
    refset_ids: _containers.RepeatedScalarFieldContainer[int]
    def __init__(self, refset_ids: _Optional[_Iterable[int]] = ...) -> None: ...

class GetAssociationsRequest(_message.Message):
    __slots__ = ("concept_id",)
    CONCEPT_ID_FIELD_NUMBER: _ClassVar[int]
    concept_id: int
    def __init__(self, concept_id: _Optional[int] = ...) -> None: ...

class GetAssociationsResponse(_message.Message):
    __slots__ = ("associations",)
    ASSOCIATIONS_FIELD_NUMBER: _ClassVar[int]
    associations: _containers.RepeatedCompositeFieldContainer[AssociationMember]
    def __init__(self, associations: _Optional[_Iterable[_Union[AssociationMember, _Mapping]]] = ...) -> None: ...

class GetReplacementConceptRequest(_message.Message):
    __slots__ = ("inactive_concept_id",)
    INACTIVE_CONCEPT_ID_FIELD_NUMBER: _ClassVar[int]
    inactive_concept_id: int
    def __init__(self, inactive_concept_id: _Optional[int] = ...) -> None: ...

class GetReplacementConceptResponse(_message.Message):
    __slots__ = ("replacement_id", "found")
    REPLACEMENT_ID_FIELD_NUMBER: _ClassVar[int]
    FOUND_FIELD_NUMBER: _ClassVar[int]
    replacement_id: int
    found: bool
    def __init__(self, replacement_id: _Optional[int] = ..., found: bool = ...) -> None: ...

class EclExecutorConfig(_message.Message):
    __slots__ = ("timeout_ms", "parallel", "enable_cache")
    TIMEOUT_MS_FIELD_NUMBER: _ClassVar[int]
    PARALLEL_FIELD_NUMBER: _ClassVar[int]
    ENABLE_CACHE_FIELD_NUMBER: _ClassVar[int]
    timeout_ms: int
    parallel: bool
    enable_cache: bool
    def __init__(self, timeout_ms: _Optional[int] = ..., parallel: bool = ..., enable_cache: bool = ...) -> None: ...

class ExecuteEclRequest(_message.Message):
    __slots__ = ("ecl", "limit", "include_details", "config")
    ECL_FIELD_NUMBER: _ClassVar[int]
    LIMIT_FIELD_NUMBER: _ClassVar[int]
    INCLUDE_DETAILS_FIELD_NUMBER: _ClassVar[int]
    CONFIG_FIELD_NUMBER: _ClassVar[int]
    ecl: str
    limit: int
    include_details: bool
    config: EclExecutorConfig
    def __init__(self, ecl: _Optional[str] = ..., limit: _Optional[int] = ..., include_details: bool = ..., config: _Optional[_Union[EclExecutorConfig, _Mapping]] = ...) -> None: ...

class ExecuteEclResponse(_message.Message):
    __slots__ = ("concept_ids", "concepts", "total_count", "execution_time_ms", "truncated")
    CONCEPT_IDS_FIELD_NUMBER: _ClassVar[int]
    CONCEPTS_FIELD_NUMBER: _ClassVar[int]
    TOTAL_COUNT_FIELD_NUMBER: _ClassVar[int]
    EXECUTION_TIME_MS_FIELD_NUMBER: _ClassVar[int]
    TRUNCATED_FIELD_NUMBER: _ClassVar[int]
    concept_ids: _containers.RepeatedScalarFieldContainer[int]
    concepts: _containers.RepeatedCompositeFieldContainer[Concept]
    total_count: int
    execution_time_ms: int
    truncated: bool
    def __init__(self, concept_ids: _Optional[_Iterable[int]] = ..., concepts: _Optional[_Iterable[_Union[Concept, _Mapping]]] = ..., total_count: _Optional[int] = ..., execution_time_ms: _Optional[int] = ..., truncated: bool = ...) -> None: ...

class MatchesEclRequest(_message.Message):
    __slots__ = ("concept_id", "ecl")
    CONCEPT_ID_FIELD_NUMBER: _ClassVar[int]
    ECL_FIELD_NUMBER: _ClassVar[int]
    concept_id: int
    ecl: str
    def __init__(self, concept_id: _Optional[int] = ..., ecl: _Optional[str] = ...) -> None: ...

class MatchesEclResponse(_message.Message):
    __slots__ = ("matches",)
    MATCHES_FIELD_NUMBER: _ClassVar[int]
    matches: bool
    def __init__(self, matches: bool = ...) -> None: ...

class GetDescendantsRequest(_message.Message):
    __slots__ = ("concept_id", "limit", "include_self")
    CONCEPT_ID_FIELD_NUMBER: _ClassVar[int]
    LIMIT_FIELD_NUMBER: _ClassVar[int]
    INCLUDE_SELF_FIELD_NUMBER: _ClassVar[int]
    concept_id: int
    limit: int
    include_self: bool
    def __init__(self, concept_id: _Optional[int] = ..., limit: _Optional[int] = ..., include_self: bool = ...) -> None: ...

class GetDescendantsResponse(_message.Message):
    __slots__ = ("concept_ids", "total_count")
    CONCEPT_IDS_FIELD_NUMBER: _ClassVar[int]
    TOTAL_COUNT_FIELD_NUMBER: _ClassVar[int]
    concept_ids: _containers.RepeatedScalarFieldContainer[int]
    total_count: int
    def __init__(self, concept_ids: _Optional[_Iterable[int]] = ..., total_count: _Optional[int] = ...) -> None: ...

class GetAncestorsRequest(_message.Message):
    __slots__ = ("concept_id", "include_self")
    CONCEPT_ID_FIELD_NUMBER: _ClassVar[int]
    INCLUDE_SELF_FIELD_NUMBER: _ClassVar[int]
    concept_id: int
    include_self: bool
    def __init__(self, concept_id: _Optional[int] = ..., include_self: bool = ...) -> None: ...

class GetAncestorsResponse(_message.Message):
    __slots__ = ("concept_ids", "total_count")
    CONCEPT_IDS_FIELD_NUMBER: _ClassVar[int]
    TOTAL_COUNT_FIELD_NUMBER: _ClassVar[int]
    concept_ids: _containers.RepeatedScalarFieldContainer[int]
    total_count: int
    def __init__(self, concept_ids: _Optional[_Iterable[int]] = ..., total_count: _Optional[int] = ...) -> None: ...

class ExplainEclRequest(_message.Message):
    __slots__ = ("ecl",)
    ECL_FIELD_NUMBER: _ClassVar[int]
    ecl: str
    def __init__(self, ecl: _Optional[str] = ...) -> None: ...

class QueryPlanStep(_message.Message):
    __slots__ = ("operation", "description", "estimated_count", "children")
    OPERATION_FIELD_NUMBER: _ClassVar[int]
    DESCRIPTION_FIELD_NUMBER: _ClassVar[int]
    ESTIMATED_COUNT_FIELD_NUMBER: _ClassVar[int]
    CHILDREN_FIELD_NUMBER: _ClassVar[int]
    operation: str
    description: str
    estimated_count: int
    children: _containers.RepeatedCompositeFieldContainer[QueryPlanStep]
    def __init__(self, operation: _Optional[str] = ..., description: _Optional[str] = ..., estimated_count: _Optional[int] = ..., children: _Optional[_Iterable[_Union[QueryPlanStep, _Mapping]]] = ...) -> None: ...

class ExplainEclResponse(_message.Message):
    __slots__ = ("parsed_ecl", "plan", "parse_time_us")
    PARSED_ECL_FIELD_NUMBER: _ClassVar[int]
    PLAN_FIELD_NUMBER: _ClassVar[int]
    PARSE_TIME_US_FIELD_NUMBER: _ClassVar[int]
    parsed_ecl: str
    plan: QueryPlanStep
    parse_time_us: int
    def __init__(self, parsed_ecl: _Optional[str] = ..., plan: _Optional[_Union[QueryPlanStep, _Mapping]] = ..., parse_time_us: _Optional[int] = ...) -> None: ...

class IsSubsumedByRequest(_message.Message):
    __slots__ = ("concept_id", "ancestor_id")
    CONCEPT_ID_FIELD_NUMBER: _ClassVar[int]
    ANCESTOR_ID_FIELD_NUMBER: _ClassVar[int]
    concept_id: int
    ancestor_id: int
    def __init__(self, concept_id: _Optional[int] = ..., ancestor_id: _Optional[int] = ...) -> None: ...

class IsSubsumedByResponse(_message.Message):
    __slots__ = ("is_subsumed", "distance")
    IS_SUBSUMED_FIELD_NUMBER: _ClassVar[int]
    DISTANCE_FIELD_NUMBER: _ClassVar[int]
    is_subsumed: bool
    distance: int
    def __init__(self, is_subsumed: bool = ..., distance: _Optional[int] = ...) -> None: ...

class GetDirectParentsRequest(_message.Message):
    __slots__ = ("concept_id",)
    CONCEPT_ID_FIELD_NUMBER: _ClassVar[int]
    concept_id: int
    def __init__(self, concept_id: _Optional[int] = ...) -> None: ...

class GetDirectParentsResponse(_message.Message):
    __slots__ = ("parent_ids",)
    PARENT_IDS_FIELD_NUMBER: _ClassVar[int]
    parent_ids: _containers.RepeatedScalarFieldContainer[int]
    def __init__(self, parent_ids: _Optional[_Iterable[int]] = ...) -> None: ...

class GetDirectChildrenRequest(_message.Message):
    __slots__ = ("concept_id",)
    CONCEPT_ID_FIELD_NUMBER: _ClassVar[int]
    concept_id: int
    def __init__(self, concept_id: _Optional[int] = ...) -> None: ...

class GetDirectChildrenResponse(_message.Message):
    __slots__ = ("child_ids",)
    CHILD_IDS_FIELD_NUMBER: _ClassVar[int]
    child_ids: _containers.RepeatedScalarFieldContainer[int]
    def __init__(self, child_ids: _Optional[_Iterable[int]] = ...) -> None: ...
