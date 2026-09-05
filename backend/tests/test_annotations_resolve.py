"""Every annotation in the service and API layers must name something that exists.

CI runs Python 3.13, which evaluates annotations eagerly: a function whose signature
names a deleted import raises NameError the moment its module is imported, taking the
whole app down at startup. Local development runs 3.14, where PEP 649 defers that
evaluation and the same code imports fine — so this class of mistake can pass every
local test and fail CI on import. That happened during #168, when moving ORM models out
of the services left `list[Issue]` behind in three signatures.

`get_type_hints` forces the evaluation on any version, which is what makes this test
say the same thing on both.
"""

import importlib
import inspect
import pkgutil
import typing

import pytest

PACKAGES = ("core.services", "app.api.v1")


def _modules() -> list[str]:
    names = []
    for package_name in PACKAGES:
        package = importlib.import_module(package_name)
        names.append(package_name)
        for info in pkgutil.walk_packages(package.__path__, package_name + "."):
            names.append(info.name)
    return sorted(names)


@pytest.mark.parametrize("module_name", _modules())
def test_annotations_resolve(module_name):
    module = importlib.import_module(module_name)
    for name, obj in vars(module).items():
        if not inspect.isfunction(obj) or obj.__module__ != module_name:
            continue
        try:
            typing.get_type_hints(obj)
        except NameError as exc:
            pytest.fail(f"{module_name}.{name}: unresolvable annotation — {exc}")
