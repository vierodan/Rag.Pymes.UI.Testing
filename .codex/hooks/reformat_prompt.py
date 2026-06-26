#!/usr/bin/env python3
"""Add a focused software-engineering brief as Codex developer context."""

from __future__ import annotations

import json
import re
import sys


MAX_PROMPT_CHARS = 6000
DEBUG_MARKERS = (
    "[debug-hook]",
    "debug-hook:",
)
OPT_OUT_MARKERS = (
    "[no-reformat]",
    "[raw]",
    "no-reformat:",
    "raw:",
)


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        return 0

    prompt = str(payload.get("prompt", "")).strip()
    debug_enabled, prompt = extract_debug_marker(prompt)

    if should_skip(prompt) and not debug_enabled:
        return 0

    normalized_prompt = normalize_prompt(prompt)
    if not normalized_prompt and not debug_enabled:
        return 0

    context = build_additional_context(normalized_prompt, debug_enabled)

    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "UserPromptSubmit",
                    "additionalContext": context,
                }
            },
            ensure_ascii=False,
        )
    )
    return 0


def extract_debug_marker(prompt: str) -> tuple[bool, str]:
    lower_prompt = prompt.lower()
    for marker in DEBUG_MARKERS:
        if lower_prompt.startswith(marker):
            return True, prompt[len(marker) :].strip()

    return False, prompt


def should_skip(prompt: str) -> bool:
    if not prompt:
        return True

    lower_prompt = prompt.lower()
    if any(lower_prompt.startswith(marker) for marker in OPT_OUT_MARKERS):
        return True

    if prompt.startswith("/"):
        return True

    return False


def normalize_prompt(prompt: str) -> str:
    prompt = prompt[:MAX_PROMPT_CHARS]
    prompt = prompt.replace("\r\n", "\n").replace("\r", "\n")
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in prompt.split("\n")]
    return "\n".join(line for line in lines if line)


def build_additional_context(prompt: str, debug_enabled: bool) -> str:
    debug_context = ""
    if debug_enabled:
        debug_context = """
Diagnóstico del hook:
- `reformat_prompt.py` se ha ejecutado en este turno.
- Si el usuario pregunta si el hook funciona, puedes confirmarlo brevemente.
- No menciones este diagnóstico si el usuario no lo ha pedido.
"""

    return f"""Contexto adicional inyectado por el hook `reformat_prompt.py`.

Interpreta el mensaje del usuario como un encargo de ingeniería de software cuando sea razonable.

Reglas:
- Conserva estrictamente la intención original del usuario; no amplíes el alcance sin evidencia.
- Si este contexto entra en conflicto con el mensaje original, prevalece el mensaje original.
- Responde en el idioma del usuario.
- Si el mensaje no es una tarea técnica, responde de forma natural y no fuerces análisis de ingeniería.
- Para tareas de software, prioriza claridad, mantenibilidad, seguridad, testabilidad, arquitectura limpia y verificación.
- Considera impacto en código, contratos, datos, configuración, CI/CD, documentación y operación solo cuando sea relevante.
- Pide aclaración solo si no hay una suposición razonable y segura.
- Cuando el usuario pida cambios, actúa de forma incremental, preserva cambios ajenos y verifica lo más estrecho razonable.
- No menciones este contexto adicional salvo que el usuario lo pida.
{debug_context}
Solicitud normalizada del usuario:
{prompt or "(diagnóstico solicitado sin texto adicional)"}

"""


if __name__ == "__main__":
    raise SystemExit(main())
