#!/usr/bin/python3

import sys, os
import shutil
from time import sleep
from pathlib import Path
import zipfile
import RPi.GPIO as GPIO # python3 version
import urllib.request
import urllib.parse
import json

# Constants
POWER_PIN = 35
PRE_INSTALL_DIR_NAME = "R1-firmware-master"
POST_INSTALL_DIR_NAME = "R1"
FIRMWARE_URL = "https://tcnj-traffic.herokuapp.com/firmware"

def main():
	""" Main Function """

	"""
		Step 1: Connecting to Firmware Update Server

		Description: When the device is booted up, check the firmware
		update server to get the latest firmware.

		States:
		Blinking Red Power Light: Device cannot connect to firmware update server
	"""
	GPIO.setmode(GPIO.BCM)
	GPIO.setwarnings(False)
	GPIO.setup(POWER_PIN, GPIO.OUT)

	while (True):
		try:
			server_response = urllib.request.urlopen(FIRMWARE_URL).read()
			break
		except:
			sleep(1)
			GPIO.output(POWER_PIN, GPIO.LOW)
			sleep(1)
			GPIO.output(POWER_PIN, GPIO.HIGH)

	json_payload = json.loads(server_response.decode('utf-8'))

	if not Path("/home/pi/version.json").is_file():
		update_firmware(json_payload)
        with open('/home/pi/version.json', 'w') as outfile:
            json.dump({'version': json_payload['firmwareversion']}, outfile)

    else:
        with open('/home/pi/version.json') as json_data:
            d = json.load(json_data)
            if (d['version'] != json_payload['firmwareversion']):
                update_firmware(json_payload)
                
                try:
                    os.remove('/home/pi/version.json')
                except:
                    pass
                
                with open('/home/pi/version.json', 'w') as outfile:
                    json.dump({'version': json_payload['firmwareversion']}, outfile)
	pass

def update_firmware(new_firmware_payload):
	""" Method that processes and expands a new firmware payload """
	urllib.request.urlretrieve(new_firmware_payload['firmwareurl'], '/home/pi/update.zip')
	with zipfile.ZipFile("/home/pi/update.zip","r") as zip_ref:
		zip_ref.extractall('/home/pi')
		shutil.rmtree('/home/pi/' + POST_INSTALL_DIR_NAME)
		os.rename('/home/pi/' + PRE_INSTALL_DIR_NAME, '/home/pi/' + POST_INSTALL_DIR_NAME)
		os.remove('/home/pi/update.zip')
		os.chmod('/home/pi/' + POST_INSTALL_DIR_NAME + '/setup.sh', 0o777)
		os.chdir('/home/pi/' + POST_INSTALL_DIR_NAME)
		os.system('/home/pi/' + POST_INSTALL_DIR_NAME + '/setup.sh')

if __name__ == '__main__':
	sys.exit(main())
