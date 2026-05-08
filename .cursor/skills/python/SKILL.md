---
name: python
description: Build, debug, review, and maintain Python scripts, services, data-processing utilities, API clients, automation tools, and agent tool integrations. Use when the user asks for Python code, Python debugging, pip dependencies, scripts, data parsing, file processing, backend utilities, or Python-based AI/agent tools.
---

# Python

## Default Approach

When working on Python:

1. Inspect the existing project structure before adding files.
2. Prefer small, focused modules over one large script.
3. Use standard library tools first when they are enough.
4. Add third-party dependencies only when they clearly reduce complexity.
5. Keep secrets in environment variables, never in source files.
6. Include clear error handling for file, network, API, and parsing failures.
7. Make scripts runnable from the project root.

## Environment

- Prefer virtual environments for local Python work.
- If a project already has `requirements.txt`, `pyproject.toml`, `uv.lock`, or `Pipfile`, follow that package manager.
- If no convention exists, use `requirements.txt` for simple scripts and `pyproject.toml` for reusable packages.
- Do not invent pinned versions unless the user asks; use the package manager to resolve versions.

## Code Style

- Target Python 3.11+ unless the project indicates another version.
- Use type hints for public functions and non-trivial data structures.
- Use `pathlib.Path` for filesystem paths.
- Use `dataclasses` or typed dictionaries for structured data when helpful.
- Prefer explicit return values over printing inside reusable functions.
- Keep CLI entrypoints thin; put real logic in testable functions.

## API And Agent Tools

For API clients and agent tools:

1. Read credentials from environment variables.
2. Set timeouts on network requests.
3. Return structured data, not only strings.
4. Normalize external API errors into clear messages.
5. Log enough context for debugging without leaking tokens.

Recommended response shape for tool functions:

```python
{
    "ok": True,
    "data": result,
    "source": "api-name",
}
```

For failures:

```python
{
    "ok": False,
    "error": "Human-readable error",
    "detail": "Optional technical detail",
}
```

## Data Processing

For CSV, JSON, Excel, or local file imports:

- Validate required columns or fields before processing.
- Preserve original raw data where practical.
- Make encoding explicit for text files, usually `utf-8`.
- For large files, stream or chunk instead of loading everything into memory.
- Separate parsing, validation, transformation, and output formatting.

## Testing

Add tests when logic has branching, parsing, calculations, API adapters, or reusable functions.

Preferred test layout:

```text
tests/
  test_module_name.py
```

Use `pytest` if the project already uses it or the user asks for tests. For tiny standalone scripts, a small `if __name__ == "__main__":` smoke path is acceptable.

## Validation

After Python edits, run the narrowest useful check:

```bash
python -m py_compile path/to/file.py
```

For packages or larger changes, run existing tests or:

```bash
python -m pytest
```

If validation cannot run because Python or dependencies are missing, report that clearly.
