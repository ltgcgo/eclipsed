#!/bin/bash
echo -e "\033[1;37mLightingale Hyacinth\033[0m"
mkdir -p dist
#mkdir -p proxy
# Remove the dev files
rm -r dist/*.css 2> /dev/null
rm -r dist/*.js 2> /dev/null
rm -r dist/*.map 2> /dev/null
rm -r dist/*.mjs 2> /dev/null
# Using esbuild to build all JS files
#esbuild --bundle src/index.js --outfile=dist/index.js --minify --sourcemap
#esbuild --bundle src/index.js --target=es6 --outfile=dist/index.es6.js --minify --sourcemap
echo "Now building CSS."
if [ ! -f "$(which lightningcss)" ]; then
	echo -e "\033[1;33mWarning\033[0m: LightningCSS is not available. May yield unexpected results."
fi
if [ -d "./css" ]; then
	ls -1 css | while IFS= read -r dir ; do
		if [ -e "css/${dir}/index.css" ] ; then
			echo "Building CSS target \"${dir}\"..."
			shx skin $dir --minify $1 > /dev/null
		fi
	done
else
	echo "No CSS targets available."
fi
echo "Now building HTML."
if [ -d "./web" ]; then
	ls -1 web | while IFS= read -r dir ; do
		if [ -e "web/${dir}/index.htm" ] ; then
			echo "Building HTML target \"${dir}\"..."
			shx page $dir > /dev/null
		fi
	done
else
	echo "No HTML targets available."
fi
echo "Now building JS."
substRules='s/{var /{let /g;s/}var /}let /g;s/;var /;let /g;s/(var /(let /g;s/var /"use strict";let /'
if [ -d "./src" ]; then
	ls -1 src | while IFS= read -r dir ; do
		if [ -e "src/${dir}/index.js" ] ; then
			echo "Building JS target \"${dir}\"..."
			shx live $dir --minify $1 > /dev/null
			sed -zi "$substRules" "dist/${dir}.js"
		fi
		if [ -e "src/${dir}/index.mjs" ] ; then
			echo "Building JS module \"${dir}\"..."
			shx live $dir --minify $1 > /dev/null
			sed -zi "$substRules" "dist/${dir}.mjs"
		fi
	done
else
	echo "No JS targets availeble."
fi
echo "Building done!"
#rm -rv proxy/*.map
# Finalizing most builds
#ls -1 src | while IFS= read -r dir ; do
	#if [ -e "src/${dir}/prefixer.js" ] ; then
		#cat src/${dir}/prefixer.js > dist/${dir}.js
	#fi
	#if [ -e "proxy/${dir}.js" ] ; then
		#cat proxy/${dir}.js >> dist/${dir}.js
	#fi
#done
# Node specific
#mkdir -p proxy/node
#mv dist/node.js proxy/node/index.js
#rm proxy/node.js
exit
