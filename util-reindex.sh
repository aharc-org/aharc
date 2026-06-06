#!/bin/bash

# ---------------------------------------------------------
# Settings <!--aharc using css v3.0 -->
# ---------------------------------------------------------
SITE_DIR="/home/rex/github/aharc/archive"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOGFILE="$SCRIPT_DIR/util-pagefind-errors.log"
ERROR_LOG="$LOGFILE"

GREEN="\e[32m"
YELLOW="\e[33m"
BLUE="\e[34m"
RESET="\e[0m"

trap 'echo; read -r -p "✅ Script finished (or exited early). Press Enter to close..." _ < /dev/tty' EXIT

# ---------------------------------------------------------
# Logging setup
# ---------------------------------------------------------
echo "=== Pagefind Rebuild Log: $(date) ===" > "$LOGFILE"

cd "$SITE_DIR" 2>>"$LOGFILE" || {
    echo "ERROR: Site directory not found. Check $LOGFILE"
    exit 1
}

# ---------------------------------------------------------
# Remove old Pagefind output
# ---------------------------------------------------------
if [ -d "$SITE_DIR/pagefind" ]; then
    echo "Removing old Pagefind folder..."
    if ! rm -rf "$SITE_DIR/pagefind" 2>>"$LOGFILE"; then
        echo "ERROR: Failed to delete pagefind directory." | tee -a "$LOGFILE"
        exit 1
    fi
fi

# ---------------------------------------------------------
# Rebuild Pagefind
# ---------------------------------------------------------
echo "Rebuilding Pagefind index..."
pagefind --site "$SITE_DIR" --output-path "$SITE_DIR/pagefind" 2>>"$LOGFILE"

if [ $? -ne 0 ]; then
    echo "ERROR: Pagefind failed. Check $LOGFILE"
    exit 1
else
    echo "Pagefind index rebuilt successfully."
fi

# ---------------------------------------------------------
# Build Catalogue
# ---------------------------------------------------------
OUTPUT_FILE="$SITE_DIR/catalogue.html"
echo "Generating catalogue..."

# Portable directory listing (POSIX, works everywhere)
mapfile -t DIRS < <(
    for d in "$SITE_DIR"/*/; do
        d="${d%/}"
        basename "$d"
    done | grep -v "^pagefind$" | sort
)

cat <<EOF > "$OUTPUT_FILE"
<!DOCTYPE html>
<html lang="en" id="top">
<!--aharc using Oakwood Framework v4.1.0 -->
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="/css/1-settings.css">
    <link rel="stylesheet" href="/css/2-base.css">
    <link rel="stylesheet" href="/css/3-components.css">
    <link rel="stylesheet" href="/css/4-utilities.css">
    <link rel="stylesheet" href="/css/5-custom.css">
  <title>Alderholt Archives - Catalogue</title>
</head>

<body>

<header>
<div class="site-title site-title--large">Alderholt Archives</div>
</header>

<nav class="top-nav" aria-label="Primary">
  <a href="/index.html">Home</a>
  <a href="/archive/search.html">Search</a>
  <a href="/aharc-contact.html">Contact</a>
</nav>

<main>
<section class="catalogue-container">
<section class="catalogue-item">

<h2>Catalogue</h2>
<p>This archive contains articles that first appeared in the Alderholt Parish Magazine.</p>
<p>Use the <a href="search.html">Search</a> menu above or browse below.</p>
<hr>
EOF

current_year=""
count=0

for dirname in "${DIRS[@]}"; do

    if [ -f "$SITE_DIR/$dirname/index.html" ]; then

        year="${dirname%%-*}"                     # before first dash
        monthnum=$(echo "$dirname" | cut -d'-' -f2)

        # Month names
        case "$monthnum" in
            01) month="Jan" ;; 02) month="Feb" ;; 03) month="Mar" ;;
            04) month="Apr" ;; 05) month="May" ;; 06) month="Jun" ;;
            07) month="Jul" ;; 08) month="Aug" ;; 09) month="Sep" ;;
            10) month="Oct" ;; 11) month="Nov" ;; 12) month="Dec" ;;
            *) month="$monthnum" ;;
        esac

        remainder=$(echo "$dirname" | cut -d'-' -f3- | sed 's/-/ /g')
        displayname="${year} ${month} ${remainder}"

        # New year header
        if [ "$year" != "$current_year" ]; then
            [ -n "$current_year" ] && echo "</ul>" >> "$OUTPUT_FILE"
            echo "<h4>$year</h4>" >> "$OUTPUT_FILE"
            echo "<ul class=\"spaced-list\">" >> "$OUTPUT_FILE"
            current_year="$year"
        fi

        echo "  <li><a href=\"$dirname/index.html\">$displayname</a></li>" >> "$OUTPUT_FILE"

        count=$((count+1))
    fi
done

echo "</ul>" >> "$OUTPUT_FILE"

cat <<EOF >> "$OUTPUT_FILE"
</section>

</main>

<!-- FAB back to top -->
<a class="fab fab--bottom-right fab--pill" href="#top" aria-label="Back to top">↑</a>

<!-- Footer (web component) -->
<div class= "u-mt-lg">
    <footer-site><footer-item>Alderholt Archives Ref:no-js.</footer-item></footer-site>
</div>

<!-- Scripts -->
<script src="/js/aharc-main.js"></script>

</body>
</html>
EOF

# ---------------------------------------------------------
# Summary
# ---------------------------------------------------------
echo -e "${GREEN}Done.${RESET} Created: ${YELLOW}$OUTPUT_FILE${RESET}"
echo -e "${GREEN}Entries indexed:${RESET} ${BLUE}$count${RESET}"

if [[ -s "$ERROR_LOG" ]]; then
    echo -e "${YELLOW}Warnings/errors logged at:${RESET} $ERROR_LOG"
else
    echo "No errors logged."
fi
