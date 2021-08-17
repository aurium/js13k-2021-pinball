#!/bin/bash -e

if test -z "$npm_package_name"; then
  echo 'You must run this script from "$ npm run build".' >&2
  exit 2
fi

test -z "$MKZIP" && MKZIP=true
test -z "$ZIP_PACK" && ZIP_PACK=/tmp/$npm_package_name.zip
ZIP_PACK="$(realpath "$ZIP_PACK")"

test -z "$DEBUG" && DEBUG=false || DEBUG=true
$DEBUG && echo DEBUG is ON || echo DEBUG is OFF

test -z "$DIST" && DIST=dist
echo "Building into $DIST"

test -e $DIST && rm -r $DIST
mkdir -p $DIST
cp game/index.html game/style.css game/worker.js $DIST/
echo "
\"use strict\";
$(cat $(ls -1 game/0*.js))
" > $DIST/game.js
now=$(date +%F_%T)
ls -1 $DIST/*.{js,html} | xargs -L1 sed -ri "s/#BUILD#/$now/"

if ! $DEBUG; then
  # Accept some levels of nested parentheses inside `log()`.
  recursiveParentheses="([^()]*\([^()]*\)[^()]*)"
  recursiveParentheses="(\([^()]*$recursiveParentheses*[^()]*\))"
  recursiveParentheses="(\([^()]*$recursiveParentheses*[^()]*\))"
  recursiveParentheses="(\([^()]*$recursiveParentheses*[^()]*\))"
  # Cleanup debug snippets
  sed -ri "
    s!(^|[^.])log\([^()]*$recursiveParentheses*[^()]*\)!\1void(0)!g;
    s!.*//\s*DEBUG!// EX DEBUG!;
    s!/\*\s*(INI\s+DEBUG|DEBUG\s+INI).*\*/!/* EX MULTILINE DEBUG!g;
    s/.*<!--\s*DEBUG\s*-->.*//;
  " $DIST/*.{js,html,css}

  # Minify html
  HTML=$(tr -s '\n' ' ' < $DIST/index.html)
  echo "$HTML" | sed -r 's/> </></g; s/<!--[^>]*-->//' > $DIST/index.html

  # Minify CSS
  CSS=$(tr -s '\n' ' ' < $DIST/style.css)
  echo "$CSS" | sed -r '
    s!/\*([^*]|\*[^/])*\*/!!g;
    s!; *\}!}!g;
    s! *([:;,{}]) *!\1!g;
    s!\( *!(!g;
    s! *\)!)!g;
  ' > $DIST/style.css

  # Minify JS
  sed -r 's/const/let/' $DIST/game.js |
  terser --compress \
         --mangle toplevel \
         --mangle-props regex=/_$/ \
         > $DIST/game.min.js
  mv $DIST/game.min.js $DIST/game.js
fi

cd $DIST

if $MKZIP; then
  test -e "$ZIP_PACK" && rm "$ZIP_PACK"
  if which zip > /dev/null; then
    zip -9 -r "$ZIP_PACK" *
    zip_size=$(du -b "$ZIP_PACK" | sed 's/\t.*//')
  fi

  test -e "$ZIP_PACK" && rm "$ZIP_PACK"
  ect_bin=../node_modules/ect-bin/vendor/linux/ect
  chmod +x $ect_bin || true
  $ect_bin -9 -zip "$ZIP_PACK" *
  ect_size=$(du -b "$ZIP_PACK" | sed 's/\t.*//')
  if which zip > /dev/null; then
    echo "• zip size: $zip_size bytes"
  fi
  echo "• ect size: $ect_size bytes (using it)"

  max=$((13*1024))
  if which bc > /dev/null; then
    pct="= $(echo "scale=2; 100*$ect_size/$max" | bc -l)%"
  else
    pct="≈ $(( (100 * $ect_size) / $max))%"
  fi

  if [ $ect_size -le $max ]; then
    echo -e "\e[32mThe game pakage is in the limt. $ZIP_PACK $pct\e[0m"
    exit 0
  else
    echo -e "\e[31mThe game pakage over the limt. $ZIP_PACK $pct\e[0m"
    exit 1
  fi
else
  echo -e "\e[30mBuilt without zip package. Enjoy dist.\e[0m"
fi
