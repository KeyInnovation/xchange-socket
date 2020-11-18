#!/bin/sh
 
PROCESS_COUNT=$(ps -fu root | grep server.js | grep -v grep | wc -l)
case $PROCESS_COUNT in
0) forever start /home/xchangeback/public_html/InventarioServer/server.js
;;
1) #OK, program is already running once
;;
*) #OK, program is already multiple times
;;
esac
