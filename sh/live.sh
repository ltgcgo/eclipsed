#!/bin/bash
# Determines building params
inject=" "
format="iife"
ext="js"
if [ -e "src/${1:-default}/inject.js" ] ; then
	inject="--inject:src/${1:-default}/inject.js"
fi
if [ -e "src/${1:-default}/index.mjs" ] ; then
	format="esm"
	ext="mjs"
fi
# Clean previous build results up
rm -rv dist/${1:-default}.${ext}
rm -rv proxy/${1:-default}.${ext}
esbuild --bundle src/${1:-default}/index.${ext} $inject --format=$format --outfile=proxy/${1:-default}.${ext} ${2:---minify-syntax --sourcemap}
# Use prefixer
if [ -e "src/${1:-default}/prefixer.js" ] ; then
	cat "src/${1:-default}/prefixer.js" > dist/${1:-default}.${ext}
fi
cat proxy/${1:-default}.${ext} >> dist/${1:-default}.${ext}
exit
