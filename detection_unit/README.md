# Detection Unit

The Detection Unit is a device that is placed at the entrance and exit to each of the parking lots that are to be monitored with the system. 

**Each Detection Unit includes the following:**

- Microcontroller and sensor package, called Detection Unit Core
- Power subsystem, which includes solar panels, battery and associated electronics
- A 3D printed enclosure

## Microcontrollers

##### Adafruit Feather 32u4
The Adafruit Feather 32u4 microcontroller is an Arduino based microcontroller. The sensor has an onboard LoRa radio. The microcontroller uses SPI to communicate with the LoRa radio. The 32u4 also features an I2C interface, many different pins for GPIO, Digital IO, Analog IO, an antenna pin, a power cable connector for connecting to a power source, and a micro-USB port for power and programming.

##### Custom Arduino Microcontroller
The idea to make a PCB of an Arduino Uno was proposed to save cost, have experience with PCB CAD, and conserve space in the enclosure. The program used to design the PCB is Eagle CAD due to its compatibility with printing companies and its popularity allowing the user to have access to many tutorials. In order to build the Arduino, it is necessary to know the components used in an Arduino that will be needed in the PCB and all the hardware that will be needing the Arduino.

## Sensors & Peripherals

##### Ultrasonic Sensor
The Maxbotix LV-MaxSonar-EZ1 Ultrasonic Range Finder is an ultrasonic sensor that uses Analog output to communicate with a host microcontroller. Ultrasonic sensors emit ultrasonic pulses that can bounce off objects and calculate the distance based on the amount of time sound takes to reach the sensor. The sensor has a theoretical detection range of 6.45 meters from is initial position. Each Detection Unit Core uses one of these sensors positioned towards the curb of a street. The Ultrasonic Range Finder is used to detect whether a vehicle is passing by the Detection Unit.

##### Time of Flight Infrared Sensor
The Adafruit VL53L0X Time of Flight Distance Sensor is a LIDAR sensor that uses I2C to communicate with a host microcontroller. LIDAR is a technology that uses laser light pulses to determine the distance between the sensor and the object in front of the sensor. The sensor has a theoretical detection range of up to one meter from is initial position. Each Detection Unit Core uses one of these sensors positioned upwards the gate above the Detection Unit. The Time of Flight Sensor is used to detect the position of the gate and verify that an authorized vehicle has passed through the entrance of a parking lot. 

## Detection Algorithm

To accurately detect a vehicle, the group wanted to use all current infrastructure already setup in the parking lot such as the limited roadways and established gate units at the entrance. After researching into possible sensors to sense the state of the entrance, the group chose two types of sensors to go into each Detection Unit. The first sensor, the Maxbotix LV-MaxSonar-EZ1 Ultrasonic Range Finder, is tasked with detecting whether an entity (vehicle or animal) enters the parking lot. The Ultrasonic Range Finder, has a theoretical detection range of 6.45 meters (645 cm). After testing the sensor in the field, the sensor actually had a detection range of 4.5 meters (450 cm) which still satisfied the group’s detection requirements of detecting an entity on a 325 cm roadway. The first sensor, the Adafruit VL53L0X Time of Flight Distance Sensor, is tasked with detecting whether a given object entering the lot is authorized to enter by determining the position of the gate unit. The group determined that an authorized vehicle would make the gate rise which would be detected by the Distance sensor. The Time of Flight Distance Sensor, has a theoretical detection range of two meters (200 cm). After testing the sensor in the field, the sensor was tuned and scaled to sense a meter which satisfied the group’s detection requirements of detecting the gate at rest which was 92 cm above the island. Before any hardware was used for detection, the group calibrated each sensor with the gate and roadway in the entrance of the parking lot.

Through testing with driving vehicles through the entrance of the parking lot multiple times, the group determined that the Detection Unit will count an object as a valid vehicle entering the parking lot when both sensors reach a certain state. When the entrance to a parking lot has no vehicles entering, the ultrasonic sensor would read the maximum range value (approximately 450 cm) and the infrared distance sensor would read a constant 92 cm. When a vehicle enters the parking lot, the ultrasonic sensor would detect a drop in distance over a period of 4 seconds which will cause the infrared distance sensor to begin tracking the position of the gate unit for 5 seconds. Since the gate unit is near the maximum range of the distance sensor, when the gate unit opens the distance sensor will output the maximum range (2 meters). When both the ultrasonic sensor reads a drop in distance and the infrared distance sensor outputs its maximum range value, a vehicle is counted and sent to a centralized server. After performing various experiments with 100 entering vehicles, the group found that this method allowed the Detection Unit to detect 98% of authorized vehicles entering the parking lot. 

![Sensor Graph](https://github.com/nextseto/Parking-Lot-Occupancy/raw/master/assets/detection_graph.png)

## Power Subsystem

Large pre-existing parking lots offer limited external power connections AC power, and the addition of such connections would be costly. Laying wires would present safety concerns for drivers and cumbersome gantry supports to allow overhead connections would be impractical. To minimize the burden of deployment of detection units in a large number of parking lots at TCNJ, we provide autonomous power to each detection unit, without requiring a connection to an AC power line. Stable, continuous power is required for proper operation of the detection unit subsystems and components.  A compact and standalone solar system was developed for use with each unit, allowing for greater freedom of placement and minimal external wiring as compared to alternative energy sources such as wind. Solar also provided scalable power as opposed to a much more restricted low power energy harvesting system. Charge storage in the event of poor solar insolation due to bad weather and for overnight detection unit power demands was accounted for with a LiPo battery charging circuit. LiPo batteries being available in significantly smaller packages than their Lithium-Ion battery counterparts allowed for the design of a smaller waterproof enclosure. To ensure battery longevity and safety, circuit elements to provide overcurrent and voltage regulation protection were included. Additionally, a DC/DC boost converter was necessary to account for the unique power demands and losses of the individual detection unit components. 

![Overall Architecture](https://github.com/nextseto/Parking-Lot-Occupancy/raw/master/detection_unit/custom_power_system/circuit.png)

## Enclosure

A major component of this project is the detection system that relays the information of the sensors to the base station and the power system that powers the detection system using a solar panel. In order to keep all the components of each system in place and intact, an enclosure for the detection unit was proposed. Along with verifying that the hardware of these systems would be secure from the environment, it acts as a mount for the sensors to detect the moving vehicles. The design of the enclosure was based on the needs previously mentioned above and due to trial error, there are five versions of the first prototype all designed using CAD in Autodesk Fusion 360.