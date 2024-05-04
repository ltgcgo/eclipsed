#!/bin/bash
# Build HTML files
if [ -f "$(which minify)" ]; then
	minify --type html --html-keep-document-tags --html-keep-quotes -o "dist/${1}.htm" "web/${1}/index.htm"
else
	echo -e "\033[1;31mError\033[0m: tdewolff-minify is not available."
fi
exit