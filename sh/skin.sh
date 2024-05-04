#!/bin/bash
# Build CSS files
if [ -f "$(which lightningcss)" ]; then
	lightningcss --bundle ${2:---minify --sourcemap} $3 "css/${1}/index.css" -o "dist/${1}.css"
elif [ "$(shx esbuild 2>&1 >/dev/null;echo $?)" == "0" ]; then
	esbuild --log-level=warning --log-limit=0 --charset=utf8 --bundle ${2:---minify --sourcemap} $3 "css/${1}/index.css" --outfile="dist/${1}.css"
else
	echo -e "\033[1;31mError\033[0m: LightningCSS is not available."
fi
exit