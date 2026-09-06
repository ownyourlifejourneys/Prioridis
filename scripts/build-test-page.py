#!/usr/bin/env python3
"""
Bouwt test/index.html op uit src/prioridis.html, voor gebruik met de lokale
testopstelling (test/server.js + test/firebase-firestore-fake.js).

Dezelfde <style> en app-inhoud als de echte site, maar met de echte Firebase
Auth-emulator (voor inloggen/registreren) en een nagemaakte Firestore-server
(voor taken/instellingen) in plaats van de echte Firebase-scripts van
gstatic.com - die zijn in deze omgeving niet altijd bereikbaar.

Gebruik:
    python3 scripts/build-test-page.py

test/index.html wordt bij elke run overschreven; bewerk dat bestand dus nooit
rechtstreeks. Zie test/README.md voor hoe je de opstelling daarna draait.
"""
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src" / "prioridis.html"
HEAD = ROOT / "test" / "head-template.html"
OUT = ROOT / "test" / "index.html"

WRAP_MARKER = '<div class="wrap" id="loginView">'
TAIL = "\n</body>\n</html>\n"


def main():
    src = SRC.read_text(encoding="utf-8")
    head = HEAD.read_text(encoding="utf-8")

    if WRAP_MARKER not in src:
        sys.exit("Fout: geen " + WRAP_MARKER + " gevonden in " + str(SRC))

    wrap_start = src.index(WRAP_MARKER)
    head_part = src[:wrap_start]
    body_part = src[wrap_start:]

    page = head + head_part + "</head>\n<body>\n\n" + body_part + TAIL
    OUT.write_text(page, encoding="utf-8")
    print("Geschreven: " + str(OUT) + " (" + str(len(page)) + " bytes)")


if __name__ == "__main__":
    main()
