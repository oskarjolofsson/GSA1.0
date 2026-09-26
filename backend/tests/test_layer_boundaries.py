"""The layers may only talk downwards, and only through the seam below them.

The backend is three layers: `app/` (HTTP), `core/services/` (behaviour) and
`core/infrastructure/db/` (persistence). Nothing enforced that split, so query
building had leaked upwards into services and even into an API schema. See #168.

These tests read the import statements rather than the runtime graph, because the
leak they guard against is textual: the moment a module writes `select(...)`, it has
taken on work the layer below owns.

`sqlalchemy.orm.Session` is deliberately exempt. A `Session` travels down from the
request dependency through every layer as an opaque handle; naming its type is not
the same as building a query with it.
"""

import ast
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent

# Importing these means the module is doing persistence work itself.
FORBIDDEN_MODULES = ("sqlalchemy",)
FORBIDDEN_PACKAGES = ("core.infrastructure.db.models",)

# The one sqlalchemy name any layer may hold: the session handle it passes through.
ALLOWED_SQLALCHEMY_NAMES = {"Session"}


def _imports(path: Path) -> list[tuple[str, tuple[str, ...], int]]:
    """Every import in a file as (module, imported names, line number)."""
    tree = ast.parse(path.read_text(), filename=str(path))
    found = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                found.append((alias.name, (), node.lineno))
        elif isinstance(node, ast.ImportFrom) and node.module and node.level == 0:
            found.append(
                (node.module, tuple(a.name for a in node.names), node.lineno)
            )
    return found


def _violations(package: str) -> list[str]:
    """Persistence imports inside `package`, as human-readable locations."""
    bad = []
    for path in sorted((BACKEND / package).rglob("*.py")):
        for module, names, lineno in _imports(path):
            root = module.split(".")[0]
            where = f"{path.relative_to(BACKEND)}:{lineno}"
            if root in FORBIDDEN_MODULES:
                leaked = set(names) - ALLOWED_SQLALCHEMY_NAMES
                if leaked or not names:
                    bad.append(f"{where} imports {module} ({', '.join(sorted(leaked)) or module})")
            else:
                targets = [module] + [f"{module}.{n}" for n in names]
                leaked = [
                    t
                    for t in targets
                    if any(t == p or t.startswith(p + ".") for p in FORBIDDEN_PACKAGES)
                ]
                if leaked:
                    bad.append(f"{where} imports {leaked[0]}")
    return bad


def test_api_layer_does_not_touch_the_database():
    """`app/` owns HTTP. It reaches the database only by calling a service."""
    assert _violations("app") == []


def test_services_do_not_build_queries():
    """`core/services/` owns behaviour. Statements belong in a repository.

    Every service in #168's audit has been migrated, so this is now an empty-set
    assertion rather than a shrinking allowlist. A new entry here means a service has
    started building statements again — move them into `db/repositories/` instead of
    listing the file as an exception.
    """
    assert _violations("core/services") == []


# ---------------------------------------------------------------------------
# The AI layer takes plain data in and returns checked dicts out.
#
# It used to read the database itself (v1 loaded every issue, which is how other users'
# private issues reached the prompt) and to import core.services.taxonomy (the coach
# feedback prompt). Both were moved out; this keeps them out.
#
# Relative imports are resolved here, unlike `_imports` above: `from ...services import
# taxonomy` is exactly how that upward import would come back.
# ---------------------------------------------------------------------------

AI_PACKAGE = "core/infrastructure/ai"
AI_FORBIDDEN = ("core.services", "core.infrastructure.db", "app", "sqlalchemy")


def _absolute_imports(path: Path, base: Path) -> list[tuple[str, int]]:
    """Every module `path` imports, relative imports resolved against its package."""
    package = list(path.relative_to(base).with_suffix("").parts[:-1])
    found = []
    for node in ast.walk(ast.parse(path.read_text(), filename=str(path))):
        if isinstance(node, ast.Import):
            found += [(alias.name, node.lineno) for alias in node.names]
        elif isinstance(node, ast.ImportFrom):
            if node.level:
                parent = package[: len(package) - (node.level - 1)]
                module = ".".join(parent + ([node.module] if node.module else []))
            else:
                module = node.module or ""
            found.append((module, node.lineno))
            found += [(f"{module}.{alias.name}", node.lineno) for alias in node.names]
    return found


def _ai_violations(base: Path = BACKEND) -> list[str]:
    bad = []
    for path in sorted((base / AI_PACKAGE).rglob("*.py")):
        for module, lineno in _absolute_imports(path, base):
            module = module.removeprefix("backend.")
            hit = next((f for f in AI_FORBIDDEN if module == f or module.startswith(f + ".")), None)
            if hit:
                bad.append(f"{path.relative_to(base)}:{lineno} imports {module}")
    return sorted(set(bad))


def test_ai_layer_does_not_reach_up_or_into_the_database():
    """`core/infrastructure/ai/` gets what it needs as arguments. The caller loads it."""
    assert _ai_violations() == []


def test_ai_check_catches_absolute_and_relative_imports(tmp_path):
    """The guard above is only worth something if it fires. Prove it on a planted file."""
    ai_dir = tmp_path / AI_PACKAGE
    ai_dir.mkdir(parents=True)
    (ai_dir / "bad.py").write_text(
        "from ...services import taxonomy\n"
        "from ..db.repositories import issues\n"
        "import core.services.analysis_service\n"
        "from backend.core.infrastructure.db import models\n"
        "from sqlalchemy.orm import Session\n"
        "from . import gemini\n"
        "from core import config\n"
    )

    found = _ai_violations(tmp_path)

    # Lines 1-5 each break the rule; 6 and 7 are how the layer is meant to import.
    assert {int(line.split(":")[1].split(" ")[0]) for line in found} == {1, 2, 3, 4, 5}
