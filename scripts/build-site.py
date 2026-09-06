#!/usr/bin/env python3
"""
Bouwt site/index.html op uit src/prioridis.html.

Prioridis wordt in twee vormen onderhouden:
  - src/prioridis.html  : de bewerkbare bron. Bevat <style> en de hele app-
                           inhoud (login-scherm, app-scherm, script), zonder
                           een eigen <head> met echte bestandslinks.
  - site/index.html     : de daadwerkelijk gehoste site (Netlify). Heeft een
                           echte <head> met manifest.json/icon-bestanden en de
                           Firebase-scripts van gstatic.com in plaats van
                           data-URI's.

Dit script combineert ze: het pakt de kop uit site/head-template.html, plakt
daar de <style> en de inhoud van src/prioridis.html tussen, en sluit af met
site/tail-template.html (de service-worker-registratie en de sluit-tags).

Gebruik:
    python3 scripts/build-site.py

Aan te passen aan de bron (tekst, functies, opmaak): bewerk src/prioridis.html.
Aan te passen aan de site zelf (paginatitel, meta-tags, manifest-link,
Firebase-scriptversie): bewerk site/head-template.html of site/tail-template.html.
Herbouw daarna met dit script; schrijf nooit rechtstreeks in site/index.html.
"""
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src" / "prioridis.html"
HEAD = ROOT / "site" / "head-template.html"
TAIL = ROOT / "site" / "tail-template.html"
OUT = ROOT / "site" / "index.html"

WRAP_MARKER = '<div class="wrap" id="loginView">'


def main():
    src = SRC.read_text(encoding="utf-8")
    head = HEAD.read_text(encoding="utf-8")
    tail = TAIL.read_text(encoding="utf-8")

    if "<style>" not in src:
        sys.exit("Fout: geen <style> gevonden in " + str(SRC))
    if WRAP_MARKER not in src:
        sys.exit("Fout: geen " + WRAP_MARKER + " gevonden in " + str(SRC))

    style_start = src.index("<style>")
    wrap_start = src.index(WRAP_MARKER)

    style_block = src[style_start:wrap_start]
    body_block = src[wrap_start:]

    site_html = head + style_block + "</head>\n<body>\n\n" + body_block + tail
    OUT.write_text(site_html, encoding="utf-8")
    print("Geschreven: " + str(OUT) + " (" + str(len(site_html)) + " bytes)")


if __name__ == "__main__":
    main()
