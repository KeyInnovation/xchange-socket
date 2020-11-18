#!/bin/sh
 
PROCESS_COUNT=$(ps -fu xchmxsupport | grep xchange-socket.js | grep -v grep | wc -l)
case $PROCESS_COUNT in
0) forever start /home/xchmxsupport/xchange-socket/xchange-socket.js
;;
1) #OK, program is already running once
;;
*) #OK, program is already multiple times
;;
esac
