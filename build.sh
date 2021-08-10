#!/bin/bash -e

if test -z "$npm_package_name"; then
  echo 'You must run this script from "$ npm run build".' >&2
  exit 2
fi

test -z "$DEBUG" && DEBUG=false || DEBUG=true
$DEBUG && echo DEBUG is ON || echo DEBUG is OFF

zip=/tmp/$npm_package_name.zip
test -e $zip && rm $zip

test -e dist && rm -r dist
mkdir dist
cp game/index.html game/style.css game/worker.js dist/
echo "
\"use strict\";
$(cat $(ls -1 game/0*.js))
" > dist/game.js
now=$(date +%F_%T)
ls -1 dist/*.{js,html} | xargs -L1 sed -ri "s/#BUILD#/$now/"

$DEBUG || sed -ri '
  s!([^.])log\([^)]*\)!\1void(0)!g;
  s!.*//\s*DEBUG!// EX DEBUG!g;
  s!/\*\s*INI\s+DEBUG.*\*/!;/* EX MULTILINE DEBUG!g;
  s!.*<fps.*!!
' dist/*.{js,html}

cd dist

zip -r $zip *

size=$(du -b $zip | sed 's/\t.*//')
max=$((13*1024))
pct=$(echo "scale=2; 100*$size/$max" | bc -l)%

if [ $s -lte $m ]; then
  echo -e "\e[32mThe game pakage is in the limt. $zip: $pct\e[0m"
  exit 0
else
  echo -e "\e[31mThe game pakage over the limt. $zip: $pct\e[0m"
  exit 1
fi
