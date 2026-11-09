# Comparison and report formats

Editable comparisons use `keyharbor-project-v1`. Exactly these string fields are allowed: `schema`, `title`, `sourceName`, `targetName`, `sourceText`, `targetText`. The latter two retain the original raw dictionary text, not a rewritten/sorted version.

Each dictionary is an object containing nested objects and string leaves. Duplicate member names are detected after JSON escape decoding, within each object independently. Literal prototype-like names are defined as ordinary own properties; they are not merged into prototypes. There is no Unicode normalization or dotted-key expansion.

The parser enforces explicit source, decoded-text, key, value, node, depth and message limits. It rejects unsupported values, malformed JSON and unpaired Unicode surrogates atomically. Project wrappers have separate bounds to allow embedded raw dictionaries.

Reports use `keyharbor-report-v1`. They contain the complete project, a scope description, summary and ordered review records. Paths are JSON Pointer strings; `segments` retain the original decoded key sequence.

Records retain source/target presence flags and full values. Null in a record with presence false means absent, not an imported JSON null (null dictionary values are unsupported). String/object shape conflicts preserve full subtrees in one record. Missing/extra subtrees expand to strings and empty objects. Message coverage sums must equal both original dictionaries’ string counts.

The highest issue level determines a record’s level: attention, review, info, checked. Summary levels count records. Placeholder-pair counts include only matched string records and explicitly distinguish checked from skipped syntax. This is coverage of a narrow supported subset, not a framework or linguistic validation score.

Known variable tokens retain escaped/unescaped occurrence counts. If either side contains detected unsupported syntax, variable parity claims are skipped for the entire matched pair. Markup review is independent of supported variable-name comparison.

Report JSON, HTML and SVG are exports, not editable import formats. Open project JSON to resume. HTML includes complete values and original inputs; SVG summarizes counts only. Display filters and pagination never change export content.

All edits and the 25-action history are in memory. Dictionary-file loads fill drafts; comparison-project loads replace the analyzed project. Strict UTF-8 reads that are superseded by newer input/actions/files never overwrite the later state.
