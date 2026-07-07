from __future__ import annotations

import time
from pathlib import Path
from typing import Any

import yaml

HERE = Path(__file__).resolve().parent
DEFAULT_REGISTRY_PATH = HERE / "models.yaml"


class RegistryError(ValueError):
    pass


def _norm(value: Any) -> str:
    return str(value or "").strip().lower()


class ModelRegistry:
    def __init__(self, path: str | Path = DEFAULT_REGISTRY_PATH):
        self.path = Path(path)
        self.loaded_at = time.time()
        self.models = self._load()

    def _load(self) -> list[dict[str, Any]]:
        raw = yaml.safe_load(self.path.read_text()) or {}
        rows = raw.get("models") or []
        seen: set[str] = set()
        for row in rows:
            missing = [k for k in ("id", "provider", "surface", "model", "capabilities", "authority_roles", "tier") if k not in row]
            if missing:
                raise RegistryError(f"{row.get('id') or row}: missing {', '.join(missing)}")
            if row["id"] in seen:
                raise RegistryError(f"duplicate model id: {row['id']}")
            seen.add(row["id"])
        return rows

    def find(self, surface: str | None, model: str | None = None) -> dict[str, Any] | None:
        surface_n = _norm(surface)
        model_n = _norm(model)
        matches = [m for m in self.models if _norm(m.get("surface")) == surface_n]
        if model_n:
            exact = [m for m in matches if _norm(m.get("model")) == model_n]
            if exact:
                return exact[0]
            loose = [m for m in matches if model_n in _norm(m.get("model")) or _norm(m.get("model")) in model_n]
            if loose:
                return loose[0]
        return matches[0] if matches else None

    def enrich_candidate(self, candidate: dict[str, Any]) -> dict[str, Any]:
        entry = self.find(candidate.get("surface"), candidate.get("model"))
        enriched = dict(candidate)
        if entry:
            enriched["registry_id"] = entry["id"]
            enriched["capabilities"] = entry.get("capabilities", [])
            enriched["authority_roles"] = entry.get("authority_roles", [])
            enriched["allowed_domains"] = entry.get("allowed_domains", [])
            enriched["trust_level"] = entry.get("trust_level")
            enriched["quota"] = entry.get("quota", {})
            enriched["cost"] = entry.get("cost", {})
            enriched["circuit_state"] = "closed"
            enriched["quota_remaining"] = entry.get("quota", {}).get("rpm_limit")
        enriched["rejection_reason"] = self.rejection_reason(enriched)
        return enriched

    def rejection_reason(self, candidate: dict[str, Any]) -> str | None:
        if candidate.get("gated_out"):
            return "authority_or_gate_rule"
        if not candidate.get("routable"):
            return "not_routable"
        if candidate.get("available") is False:
            return "surface_unavailable"
        if candidate.get("circuit_state") == "open":
            return "circuit_open"
        if candidate.get("quota_remaining") == 0:
            return "quota_exhausted"
        return None

    def public_models(self) -> list[dict[str, Any]]:
        return self.models

    def status_rows(self, surface_rows: list[dict[str, Any]] | None = None) -> list[dict[str, Any]]:
        by_surface = {r.get("surface"): r for r in surface_rows or []}
        rows = []
        for model in self.models:
            surface = by_surface.get(model["surface"], {})
            quota = model.get("quota") or {}
            rows.append({
                "id": model["id"],
                "provider": model["provider"],
                "surface": model["surface"],
                "model": model["model"],
                "capabilities": model.get("capabilities", []),
                "authority_roles": model.get("authority_roles", []),
                "allowed_domains": model.get("allowed_domains", []),
                "tier": model.get("tier"),
                "trust_level": model.get("trust_level"),
                "quota": quota,
                "cost": model.get("cost", {}),
                "runtime": {
                    "health": "up" if surface.get("available") else "down",
                    "available": bool(surface.get("available")),
                    "via": surface.get("via"),
                    "detail": surface.get("detail"),
                    "quota_used": 0,
                    "quota_remaining": quota.get("rpm_limit"),
                    "circuit_state": "closed",
                    "last_success": None,
                    "last_failure": None,
                    "last_error": None,
                },
            })
        return rows


_REGISTRY: ModelRegistry | None = None


def get_registry(refresh: bool = False) -> ModelRegistry:
    global _REGISTRY
    if refresh or _REGISTRY is None:
        _REGISTRY = ModelRegistry()
    return _REGISTRY


def validate_registry(path: str | Path = DEFAULT_REGISTRY_PATH) -> dict[str, Any]:
    reg = ModelRegistry(path)
    return {"ok": True, "models": len(reg.models), "path": str(reg.path)}


if __name__ == "__main__":
    print(validate_registry())
