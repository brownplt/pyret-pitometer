#!/bin/bash

tar czf view.tgz view/*

curl -u $FTP_USER:$FTP_PASS \
     -Q "*dele pyret-pitometer/view-copied.tgz" \
     -Q "-rnfr view-copied.tgz" \
     -Q "-rnto view.tgz" \
     --ftp-create-dirs \
     -T view.tgz ftp://ftp.cs.brown.edu/pyret-pitometer/view-copied.tgz

