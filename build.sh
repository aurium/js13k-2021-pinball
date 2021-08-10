#!/bin/bash -e

if test -z "$npm_package_name"; then
  echo 'You must run this script from "$ npm run build".' >&2
  exit 2
fi

test -z "$MKZIP" && MKZIP=true

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

$DEBUG || sed -ri '
  s!([^.])log\([^)]*\)!\1void(0)!g;
  s!.*//\s*DEBUG!// EX DEBUG!g;
  s!/\*\s*INI\s+DEBUG.*\*/!;/* EX MULTILINE DEBUG!g;
  s!.*<fps.*!!
' $DIST/*.{js,html}

cd $DIST

if $MKZIP; then
  zip=/tmp/$npm_package_name.zip
  test -e $zip && rm $zip

  zip -r $zip *

  size=$(du -b $zip | sed 's/\t.*//')
  max=$((13*1024))
  pct=$(echo "scale=2; 100*$size/$max" | bc -l)%

  if [ $size -le $max ]; then
    echo -e "\e[32mThe game pakage is in the limt. $zip: $pct\e[0m"
    exit 0
  else
    echo -e "\e[31mThe game pakage over the limt. $zip: $pct\e[0m"
    exit 1
  fi
else
  echo -e "\e[30mBuilt without zip package. Enjoy dist.\e[0m"
fi
