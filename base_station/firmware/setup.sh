#!/bin/bash

# Download nodeJS executable
wget -O nodeJS.tar.xz https://nodejs.org/dist/v8.9.4/node-v8.9.4-linux-armv6l.tar.xz

# Create folder to store the nodeJS executable
mkdir nodeJS

# Untar
tar -xJf nodeJS.tar.xz -C nodeJS --strip-components=1

# Cleanup
rm nodeJS.tar.xz

# Prepare nodeJS Packages
cd /home/pi/R1/app
/home/pi/R1/nodeJS/bin/npm install
/home/pi/R1/nodeJS/bin/npm install serialport --unsafe-perm --build-from-source