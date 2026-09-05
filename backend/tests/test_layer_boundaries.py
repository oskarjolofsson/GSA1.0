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
