#!/bin/sh
git --no-pager log --reverse --no-merges --date=short --format='%ad:%s:%an' -- $1 | awk 'BEGIN { FS=":" } ; { d = split($1,datearr,"-") } ; {print "\\hline\n"datearr[3]"."datearr[2]"."datearr[1]"  & "$2" & "$3" \\\\" }'""